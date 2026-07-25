import express from "express";
import pkg from "pg";
import { SorobanRpc, scValToNative, xdr } from "@stellar/stellar-sdk";

const { Pool } = pkg;

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgres://postgres:postgres@localhost:5432/x402_llm_utils",
});

const server = new SorobanRpc.Server(
  process.env.SOROBAN_RPC_URL || "https://rpc-futurenet.stellar.org"
);

const REGISTRY_ID = process.env.REGISTRY_CONTRACT_ID || "";
const ESCROW_ID = process.env.ESCROW_CONTRACT_ID || "";
const POLL_MS = parseInt(process.env.POLL_INTERVAL_MS || "10000", 10);

let lastLedger = 0;

// --- Event indexing ---

type EventHandler = (topics: xdr.ScVal[], data: xdr.ScVal, ledger: number) => Promise<void>;

async function indexEvents(
  contractId: string,
  handlers: Record<string, EventHandler>
) {
  try {
    const events = await server.getEvents({
      contractIds: [contractId],
      startLedger: lastLedger || undefined,
      limit: 100,
    });
    for (const event of events) {
      const topics = event.event.value?.body().value()?.apply(
        (v: xdr.ScVal) => v
      ) as xdr.ScVal[] | undefined;
      if (!topics || topics.length === 0) continue;
      const symbol = scValToNative(topics[0]) as string;
      const handler = handlers[symbol];
      if (handler) {
        await handler(topics, event.event.value?.body().value() as xdr.ScVal, event.ledger);
      }
    }
    if (events.length > 0) {
      lastLedger = Math.max(...events.map((e) => e.ledger)) + 1;
    }
  } catch (err) {
    console.error("Event polling error:", err);
  }
}

const registryHandlers: Record<string, EventHandler> = {
  create_api: async (topics, data, ledger) => {
    const vals = scValToNative(data) as any[];
    const apiId = vals[0]?.toString() ?? "";
    const provider = vals[1]?.toString() ?? "";
    const endpoint = vals[2]?.toString() ?? "";
    const price = vals[3]?.toString() ?? "0";
    const metadataHash = vals[4]?.toString() ?? "";
    await pool.query(
      `INSERT INTO api_listings (api_id, provider, endpoint, price_per_call, metadata_hash, active)
       VALUES ($1, $2, $3, $4, $5, TRUE)
       ON CONFLICT (api_id) DO UPDATE SET active = TRUE`,
      [apiId, provider, endpoint, price, metadataHash]
    );
    console.log(`indexed: create_api ${apiId} @ ledger ${ledger}`);
  },
  chg_price: async (topics, data, ledger) => {
    const vals = scValToNative(data) as any[];
    const apiId = vals[0]?.toString() ?? "";
    const newPrice = vals[1]?.toString() ?? "0";
    await pool.query(
      `UPDATE api_listings SET price_per_call = $1 WHERE api_id = $2`,
      [newPrice, apiId]
    );
    console.log(`indexed: chg_price ${apiId} → ${newPrice} @ ledger ${ledger}`);
  },
  pause_api: async (topics, data, ledger) => {
    const vals = scValToNative(data) as any[];
    const apiId = vals[0]?.toString() ?? "";
    const active = vals[1] === true || vals[1] === 1;
    await pool.query(`UPDATE api_listings SET active = $1 WHERE api_id = $2`, [
      active,
      apiId,
    ]);
    console.log(`indexed: pause_api ${apiId} active=${active} @ ledger ${ledger}`);
  },
};

const escrowHandlers: Record<string, EventHandler> = {
  pay: async (topics, data, ledger) => {
    const vals = scValToNative(data) as any[];
    const escrowId = vals[0]?.toString() ?? "";
    const consumer = vals[1]?.toString() ?? "";
    const provider = vals[2]?.toString() ?? "";
    const apiId = vals[3]?.toString() ?? "";
    const amount = vals[4]?.toString() ?? "0";
    const createdAt = BigInt(vals[5] ?? 0).toString();
    await pool.query(
      `INSERT INTO escrows (escrow_id, consumer, provider, api_id, amount, state, created_at)
       VALUES ($1, $2, $3, $4, $5, 'Locked', $6)
       ON CONFLICT (escrow_id) DO NOTHING`,
      [escrowId, consumer, provider, apiId, amount, createdAt]
    );
    console.log(`indexed: pay ${escrowId} @ ledger ${ledger}`);
  },
  confirm_ex: async (topics, data, ledger) => {
    const escrowId = scValToNative(topics[1] ?? data)?.toString() ?? "";
    await pool.query(`UPDATE escrows SET state = 'Confirmed', updated_at = NOW() WHERE escrow_id = $1`, [escrowId]);
    console.log(`indexed: confirm_ex ${escrowId} @ ledger ${ledger}`);
  },
  refund: async (topics, data, ledger) => {
    const escrowId = scValToNative(topics[2] ?? data)?.toString() ?? "";
    await pool.query(`UPDATE escrows SET state = 'Refunded', updated_at = NOW() WHERE escrow_id = $1`, [escrowId]);
    console.log(`indexed: refund ${escrowId} @ ledger ${ledger}`);
  },
  withdraw: async (topics, data, ledger) => {
    const escrowId = scValToNative(topics[2] ?? data)?.toString() ?? "";
    await pool.query(`UPDATE escrows SET state = 'Withdrawn', updated_at = NOW() WHERE escrow_id = $1`, [escrowId]);
    console.log(`indexed: withdraw ${escrowId} @ ledger ${ledger}`);
  },
};

// --- HTTP API ---

const app = express();

app.get("/stats", async (_req, res) => {
  const apis = await pool.query("SELECT COUNT(*) FROM api_listings");
  const escrows = await pool.query("SELECT COUNT(*) FROM escrows");
  const providers = await pool.query(
    "SELECT COUNT(DISTINCT provider) FROM api_listings"
  );
  res.json({
    apis: parseInt(apis.rows[0].count, 10),
    escrows: parseInt(escrows.rows[0].count, 10),
    providers: parseInt(providers.rows[0].count, 10),
  });
});

app.get("/apis", async (_req, res) => {
  const result = await pool.query(
    "SELECT api_id, provider, endpoint, price_per_call, active FROM api_listings ORDER BY created_at DESC"
  );
  res.json(result.rows);
});

app.get("/apis/:id", async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM api_listings WHERE api_id = $1",
    [req.params.id]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: "not found" });
  res.json(result.rows[0]);
});

app.get("/escrows", async (_req, res) => {
  const result = await pool.query(
    "SELECT escrow_id, consumer, provider, api_id, amount, state, created_at FROM escrows ORDER BY created_at DESC"
  );
  res.json(result.rows);
});

const PORT = parseInt(process.env.PORT || "3001", 10);

// --- Main ---

async function main() {
  await pool.connect();
  console.log("Indexer connected to PostgreSQL");

  app.listen(PORT, () => console.log(`Indexer API on :${PORT}`));

  // Polling loop
  setInterval(async () => {
    if (REGISTRY_ID) await indexEvents(REGISTRY_ID, registryHandlers);
    if (ESCROW_ID) await indexEvents(ESCROW_ID, escrowHandlers);
  }, POLL_MS);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
