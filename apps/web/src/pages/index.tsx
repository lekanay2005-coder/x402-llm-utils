import React, { useEffect, useState } from "react";
import Link from "next/link";

export default function Home() {
  const [stats, setStats] = useState({ apis: 0, escrows: 0, providers: 0 });

  useEffect(() => {
    fetch(process.env.NEXT_PUBLIC_INDEXER_API_URL + "/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  return (
    <div className="page">
      <header className="hero">
        <h1>x402 LLM-Utility Marketplace</h1>
        <p>
          Pay-per-call LLM utility APIs backed by Soroban escrow and automatic refunds.
        </p>
        <div className="hero-actions">
          <Link href="/apis" className="btn btn-primary">
            Browse APIs
          </Link>
          <Link href="/escrow" className="btn btn-secondary">
            My Escrows
          </Link>
        </div>
      </header>
      <section className="stats">
        <div className="stat-card">
          <strong>{stats.apis}</strong>
          <span>APIs Listed</span>
        </div>
        <div className="stat-card">
          <strong>{stats.escrows}</strong>
          <span>Active Escrows</span>
        </div>
        <div className="stat-card">
          <strong>{stats.providers}</strong>
          <span>Providers</span>
        </div>
      </section>
      <section className="features">
        <div className="feature">
          <h3>Token Counting</h3>
          <p>Count tokens in any text across multiple encoding schemes.</p>
        </div>
        <div className="feature">
          <h3>Embeddings</h3>
          <p>Generate vector embeddings for semantic search and clustering.</p>
        </div>
        <div className="feature">
          <h3>Moderation</h3>
          <p>Classify content against safety and policy categories.</p>
        </div>
        <div className="feature">
          <h3>Document Parsing</h3>
          <p>Extract structured data from PDFs, images, and raw text.</p>
        </div>
      </section>
      <style jsx>{`
        .page { font-family: system-ui, -apple-system, sans-serif; max-width: 960px; margin: 0 auto; padding: 2rem; color: #111; }
        .hero { text-align: center; padding: 4rem 0 3rem; }
        .hero h1 { font-size: 2.5rem; margin: 0 0 0.75rem; }
        .hero p { font-size: 1.15rem; color: #555; max-width: 600px; margin: 0 auto 2rem; }
        .hero-actions { display: flex; gap: 1rem; justify-content: center; }
        .btn { padding: 0.75rem 1.5rem; border-radius: 8px; text-decoration: none; font-weight: 600; }
        .btn-primary { background: #0066ff; color: #fff; }
        .btn-secondary { border: 1px solid #ccc; color: #333; }
        .stats { display: flex; gap: 2rem; justify-content: center; margin: 3rem 0; }
        .stat-card { text-align: center; }
        .stat-card strong { display: block; font-size: 2rem; }
        .stat-card span { color: #666; font-size: 0.9rem; }
        .features { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
        .feature { border: 1px solid #e5e5e5; border-radius: 10px; padding: 1.5rem; }
        .feature h3 { margin: 0 0 0.5rem; }
        .feature p { margin: 0; color: #555; font-size: 0.95rem; }
      `}</style>
    </div>
  );
}
