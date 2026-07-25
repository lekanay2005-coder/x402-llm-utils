import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

interface ApiDetail {
  api_id: string;
  provider: string;
  endpoint: string;
  price_per_call: string;
  metadata_hash: string;
  active: boolean;
}

export default function ApiDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [api, setApi] = useState<ApiDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`${process.env.NEXT_PUBLIC_INDEXER_API_URL}/apis/${id}`)
      .then((r) => r.json())
      .then((data) => { setApi(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="page"><p className="muted">Loading...</p></div>;
  if (!api) return <div className="page"><p className="muted">API not found.</p></div>;

  return (
    <div className="page">
      <Link href="/apis" className="back">&larr; All APIs</Link>
      <div className="card">
        <h1>{api.endpoint}</h1>
        <span className={`badge ${api.active ? "active" : "paused"}`}>
          {api.active ? "Active" : "Paused"}
        </span>
        <dl>
          <dt>API ID</dt>
          <dd><code>{api.api_id}</code></dd>
          <dt>Provider</dt>
          <dd><code>{api.provider}</code></dd>
          <dt>Endpoint</dt>
          <dd><code>{api.endpoint}</code></dd>
          <dt>Price per Call</dt>
          <dd><strong>{api.price_per_call}</strong> strokes</dd>
          <dt>Metadata Hash</dt>
          <dd><code>{api.metadata_hash}</code></dd>
        </dl>
      </div>
      <style jsx>{`
        .page { font-family: system-ui, -apple-system, sans-serif; max-width: 640px; margin: 0 auto; padding: 2rem; color: #111; }
        .back { color: #0066ff; text-decoration: none; font-size: 0.9rem; }
        .muted { color: #888; }
        .card { margin-top: 1.5rem; }
        h1 { font-size: 1.5rem; margin: 0.5rem 0; }
        .badge { font-size: 0.75rem; padding: 0.25rem 0.6rem; border-radius: 4px; }
        .active { background: #e6f7e6; color: #2d7d2d; }
        .paused { background: #fff3e6; color: #b85c00; }
        dl { margin-top: 2rem; }
        dt { font-weight: 600; color: #555; font-size: 0.85rem; margin-top: 1rem; }
        dd { margin: 0.25rem 0 0; font-size: 0.95rem; }
        dd code { background: #f5f5f5; padding: 0.15rem 0.4rem; border-radius: 3px; font-size: 0.85rem; }
      `}</style>
    </div>
  );
}
