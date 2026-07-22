import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/x402_llm_utils",
});

async function main() {
  console.log("Starting x402-llm-utils indexer service...");
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT NOW()');
    console.log("Connected to PostgreSQL successfully:", res.rows[0]);
  } finally {
    client.release();
  }
}

main().catch(console.error);
