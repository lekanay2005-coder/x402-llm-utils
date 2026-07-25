import React, { useEffect, useState } from "react";
import Link from "next/link";

interface EscrowItem {
  escrow_id: string;
  consumer: string;
  provider: string;
  api_id: string;
  amount: string;
  state: string;
}

export default function EscrowPage() {
  const [escrows, setEscrows] = useState<EscrowItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(process.env.NEXT_PUBLIC_INDEXER_API_URL + "/escrows")
      .then((r) => r.json())
      .then((data) => { setEscrows(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const stateColor: Record<string, string> = {
    Locked: "#e6e6ff",
    Confirmed: "#e6f7e6",
    Refunded: "#fff3e6",
    Withdrawn: "#e6e6e6",
  };

  return (
    <div className="page">
      <header>
        <Link href="/" className="back">&larr; Home</Link>
        <h1>Escrows</h1>
      </header>
      {loading ? (
        <p className="muted">Loading...</p>
      ) : escrows.length === 0 ? (
        <p className="muted">No escrows found.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Escrow ID</th>
              <th>Consumer</th>
              <th>Provider</th>
              <th>Amount</th>
              <th>State</th>
            </tr>
          </thead>
          <tbody>
            {escrows.map((e) => (
              <tr key={e.escrow_id}>
                <td><code>{e.escrow_id.slice(0, 16)}...</code></td>
                <td><code>{e.consumer.slice(0, 8)}...</code></td>
                <td><code>{e.provider.slice(0, 8)}...</code></td>
                <td>{e.amount}</td>
                <td>
                  <span
                    className="state-badge"
                    style={{ background: stateColor[e.state] || "#eee" }}
                  >
                    {e.state}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <style jsx>{`
        .page { font-family: system-ui, -apple-system, sans-serif; max-width: 860px; margin: 0 auto; padding: 2rem; color: #111; }
        header { margin-bottom: 2rem; }
        .back { color: #0066ff; text-decoration: none; font-size: 0.9rem; }
        h1 { margin: 0.5rem 0 0; }
        .muted { color: #888; }
        table { width: 100%; border-collapse: collapse; }
        th, td { text-align: left; padding: 0.75rem 0.5rem; border-bottom: 1px solid #eee; font-size: 0.9rem; }
        th { font-weight: 600; color: #555; }
        td code { font-size: 0.8rem; background: #f5f5f5; padding: 0.15rem 0.3rem; border-radius: 3px; }
        .state-badge { font-size: 0.75rem; padding: 0.2rem 0.5rem; border-radius: 4px; font-weight: 600; }
      `}</style>
    </div>
  );
}
