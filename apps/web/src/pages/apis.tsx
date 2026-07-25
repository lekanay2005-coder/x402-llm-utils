import React, { useEffect, useState } from "react";
import Link from "next/link";

interface ApiItem {
  api_id: string;
  provider: string;
  endpoint: string;
  price_per_call: string;
  active: boolean;
}

export default function ApisPage() {
  const [apis, setApis] = useState<ApiItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(process.env.NEXT_PUBLIC_INDEXER_API_URL + "/apis")
      .then((r) => r.json())
      .then((data) => { setApis(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <header>
        <Link href="/" className="back">&larr; Home</Link>
        <h1>Available APIs</h1>
      </header>
      {loading ? (
        <p className="muted">Loading...</p>
      ) : apis.length === 0 ? (
        <p className="muted">No APIs listed yet. Check back soon.</p>
      ) : (
        <div className="list">
          {apis.map((api) => (
            <div key={api.api_id} className="card">
              <div className="card-body">
                <h3>{api.endpoint}</h3>
                <p className="meta">
                  Provider: <code>{api.provider.slice(0, 8)}...</code>
                </p>
                <p className="meta">
                  Price: <strong>{api.price_per_call}</strong> strokes per call
                </p>
                <span className={`badge ${api.active ? "active" : "paused"}`}>
                  {api.active ? "Active" : "Paused"}
                </span>
              </div>
              <Link href={`/api/${api.api_id}`} className="btn">View</Link>
            </div>
          ))}
        </div>
      )}
      <style jsx>{`
        .page { font-family: system-ui, -apple-system, sans-serif; max-width: 720px; margin: 0 auto; padding: 2rem; color: #111; }
        header { margin-bottom: 2rem; }
        .back { color: #0066ff; text-decoration: none; font-size: 0.9rem; }
        h1 { margin: 0.5rem 0 0; }
        .muted { color: #888; }
        .list { display: flex; flex-direction: column; gap: 1rem; }
        .card { display: flex; justify-content: space-between; align-items: center; border: 1px solid #e5e5e5; border-radius: 10px; padding: 1.25rem; }
        .card-body h3 { margin: 0 0 0.4rem; font-size: 1rem; }
        .meta { margin: 0.2rem 0; color: #555; font-size: 0.85rem; }
        .badge { font-size: 0.75rem; padding: 0.2rem 0.5rem; border-radius: 4px; }
        .active { background: #e6f7e6; color: #2d7d2d; }
        .paused { background: #fff3e6; color: #b85c00; }
        .btn { padding: 0.5rem 1rem; border: 1px solid #0066ff; color: #0066ff; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 0.85rem; }
      `}</style>
    </div>
  );
}
