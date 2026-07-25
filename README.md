# x402 LLM-Utility Marketplace

[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
![Soroban](https://img.shields.io/badge/Soroban-27.0.1-000.svg?color=red)
![Rust](https://img.shields.io/badge/Rust-1.75+-dea584.svg)
![Status](https://img.shields.io/badge/Status-Development-yellow)
[![Drips Wave](https://img.shields.io/badge/Drips%20Wave-Pending-lightgrey)](https://drips.network/wave/stellar)

**Pay-per-call LLM utility APIs — token counting, embeddings, moderation, document parsing — with Soroban escrow payments, automatic refunds on failure, and a 2% protocol fee.**

Built using the [Stellar Wave Builder](https://drips.network/wave/stellar) process: research-driven idea validation, contract-first architecture, and a phased build from ecosystem reconnaissance through on-chain deployment and program submission.

## Project Status

| Phase | Status |
|-------|--------|
| 1 — Ecosystem Reconnaissance | Done |
| 2 — Idea Generation | Done |
| 3 — Critical Review | Done |
| 4 — Naming & Scoping | Done |
| 5 — Contract Architecture | Done |
| 6 — Contract Implementation | Done |
| 7 — App Layer | In Progress |
| 8 — Local Environment & Deployment | Pending |
| 9 — Hosting & Service Topology | Pending |
| 10 — Repo Hygiene for Program Approval | Pending |
| 11 — Documentation Site | Pending |
| 12 — Drips Wave Submission | Pending |

## Architecture

### Repository Structure

```
x402-llm-utils/
├── contracts/          # Soroban smart contracts (Rust workspace)
│   ├── shared/         #  — Shared types, errors, storage structs
│   ├── registry/       #  — API listing registry (create, price, pause)
│   ├── escrow/         #  — Payment escrow (lock, confirm, refund, withdraw)
│   └── settlement/     #  — Batch settlement (skeleton)
├── packages/
│   └── sdk/            # TypeScript SDK — Soroban RPC bindings + x402 handler
├── apps/
│   └── web/            # Next.js frontend
└── indexer/            # PostgreSQL event indexer
```

### Service Topology

```mermaid
graph TB
    User([User Browser]) --> Web[Next.js Frontend<br/>apps/web]
    Web --> SDK[packages/sdk]
    SDK --> RPC[Stellar Soroban RPC<br/>writes: pay, refund, withdraw]
    Web --> API[Indexer API<br/>reads: listings, escrows]
    API --> DB[(PostgreSQL)]
    Contracts[Smart Contracts<br/>Registry, Escrow, Settlement] --> Events[Contract Events]
    Events --> Indexer[Indexer Service]
    Indexer --> DB
    SDK --> X402[x402 Facilitator<br/>HTTP 402 → payment flow]
    RPC --> Stellar[Stellar Network]
```

### Contract Dependencies (deploy order)

```
Registry  ←──  Escrow  ←──  Settlement
                     ↘───────────────↗
```

- **Registry** — No contract dependencies. Deployed first.
- **Escrow** — Depends on Registry address (validates `api_id` exists). Deployed second.
- **Settlement** — Depends on Escrow address (for batch payout data). Deployed third.

## Contracts

### Shared (`contracts/shared`)

Shared types used across all contracts:
- `ContractError` — `Unauthorized`, `AlreadyExists`, `NotFound`, `Paused`, `InvalidPrice`, `InsufficientBalance`, `InvalidState`, `Expired`, `ArithmeticError`, `InvalidVerifier`
- `ApiListing` — `provider`, `endpoint`, `price_per_call`, `metadata_hash`, `active`
- `EscrowState` — `Locked`, `Confirmed`, `Refunded`, `Withdrawn`
- `EscrowRecord` — `consumer`, `provider`, `api_id`, `amount`, `state`, `created_at`

### Registry (`contracts/registry`)

Manages API provider listings.

| Function | Auth | Description |
|----------|------|-------------|
| `create_api(provider, endpoint, price, metadata_hash)` | `provider` | Register a new API listing |
| `change_price(provider, api_id, new_price)` | `provider` | Update price on an existing API |
| `pause_api(provider, api_id, active)` | `provider` | Pause or resume an API |
| `get_api(api_id)` | none | Read an API listing |

### Escrow (`contracts/escrow`)

Holds consumer funds in escrow during API call execution. Platform fee: 2%, collected on withdrawal.

| Function | Auth | Description |
|----------|------|-------------|
| `initialize(admin, registry, verifier, token, fee_collector)` | `admin` | One-time initialization |
| `pay(consumer, provider, api_id, amount)` | `consumer` | Lock payment in escrow |
| `confirm_execution(escrow_id)` | `verifier` | Mark execution as successful |
| `refund(consumer, escrow_id)` | `consumer` | Refund while still `Locked` |
| `withdraw(provider, escrow_id)` | `provider` | Withdraw after confirmation (2% fee deducted) |
| `get_escrow(escrow_id)` | none | Read escrow record |

### Settlement (`contracts/settlement`)

Placeholder for future batch settlement logic.

## Verification Model

- **Lightweight verifier** — checks response within timeout, correct HTTP status, non-empty payload matching schema.
- **Self-attestation explicitly rejected** — providers cannot confirm their own execution.

## Environment Variables

### Contracts (deployment context)

| Variable | Description | Example |
|----------|-------------|---------|
| `SOROBAN_RPC_URL` | Soroban RPC endpoint | `https://rpc-futurenet.stellar.org` |
| `SOROBAN_NETWORK_PASSPHRASE` | Network passphrase | `Test SDF Future Network ! Oct 2022` |
| `ADMIN_SECRET_KEY` | Admin account secret key | `S...` |
| `TOKEN_CONTRACT_ID` | Token contract used for payments | `C...` |
| `VERIFIER_SECRET_KEY` | Verifier account for confirm_execution | `S...` |
| `FEE_COLLECTOR_SECRET_KEY` | Fee collector account | `S...` |

### Indexer

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgres://postgres:postgres@localhost:5432/x402_llm_utils` |
| `SOROBAN_RPC_URL` | Soroban RPC endpoint | `https://rpc-futurenet.stellar.org` |
| `REGISTRY_CONTRACT_ID` | Deployed Registry contract ID | `C...` |
| `ESCROW_CONTRACT_ID` | Deployed Escrow contract ID | `C...` |
| `POLL_INTERVAL_MS` | Event polling interval | `5000` |

### Web App

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_RPC_URL` | Soroban RPC endpoint (client-side) | `https://rpc-futurenet.stellar.org` |
| `NEXT_PUBLIC_REGISTRY_ID` | Registry contract ID | `C...` |
| `NEXT_PUBLIC_ESCROW_ID` | Escrow contract ID | `C...` |
| `NEXT_PUBLIC_FACILITATOR_URL` | x402 facilitator endpoint | `https://facilitator.stellar.org` |
| `INDEXER_API_URL` | Indexer API base URL | `https://indexer.render.com` |

### SDK

| Variable | Description | Example |
|----------|-------------|---------|
| `SOROBAN_RPC_URL` | Soroban RPC endpoint | `https://rpc-futurenet.stellar.org` |
| `NETWORK_PASSPHRASE` | Network passphrase | `Test SDF Future Network ! Oct 2022` |

## Getting Started

### Prerequisites

- Rust 1.75+ (`rustup target add wasm32-unknown-unknown`)
- Soroban CLI (`cargo install soroban-cli --version 27.0.1`)
- Node.js 20+
- PostgreSQL 16+ (for indexer)

### Build Contracts

```bash
cargo build --target wasm32-unknown-unknown --release
```

### Test Contracts

```bash
cargo test
```

### Deploy (local/testnet)

```bash
./scripts/deploy.sh
```

Deployment order: `Registry` → `Escrow` → `Settlement`. Each contract is deployed and initialized sequentially, printing its contract ID.

### SDK

```bash
cd packages/sdk && npm install && npm run build
```

### Web App

```bash
cd apps/web && npm install && npm run dev
```

### Indexer

```bash
cd indexer && npm install
createdb x402_llm_utils && psql x402_llm_utils < schema.sql
npm run dev
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Blockchain | Stellar / Soroban |
| Smart Contracts | Rust, `soroban-sdk = "27.0.1"` |
| SDK | TypeScript, `@stellar/stellar-sdk` |
| Frontend | Next.js 14 (Pages Router) |
| Indexer | Node.js + PostgreSQL |
| Deployment | Vercel (frontend), Render (indexer/API) |

## Locked Design Choices

- **Vertical Lock**: LLM-utility APIs only (token counting, embeddings, moderation, document parsing).
- **Verification**: Lightweight verifier — never the provider themselves.
- **Platform Fee**: 2%, collected on withdrawal in Escrow.
- **Protocol**: Built on x402 and Stellar's production x402 facilitator.

## Maintainers

| Role | Contact |
|------|---------|
| Project Lead | [@lekanay2005-coder](https://github.com/lekanay2005-coder) |
| Drips Wave Submitter | TBD |

## Contributing

We welcome contributions that align with the project's vertical — LLM-utility APIs on Stellar.

### Getting Started

1. Check the [issues](https://github.com/lekanay2005-coder/x402-llm-utils/issues) for open work.
2. Comment on an issue to claim it.
3. Fork the repo and create a branch: `git checkout -b feat/my-change`.
4. Commit using [conventional commits](https://www.conventionalcommits.org/):
   - `feat:` — new feature
   - `fix:` — bug fix
   - `docs:` — documentation
   - `refactor:` — code restructuring
   - `test:` — tests
   - `chore:` — build/tooling
5. Open a PR against `main`. CI must pass.

### What Not to Do

- Do not add speculative contracts or functions — every contract function must map to a real user-flow step.
- Do not use `unwrap()` outside tests.
- Do not introduce floats in any contract code — use basis-points math.
- Do not commit secrets, `.env` files, or contract IDs without verification.

### PR Checklist

- [ ] Tests pass (`cargo test`)
- [ ] No `unwrap()` in production code
- [ ] No floats in contract code
- [ ] Conventional commit message format
- [ ] Documentation updated if API surface changed

## Security

### Disclosure

If you find a security vulnerability in any contract or the protocol itself, **do not open a public issue**.

Contact: direct message [@lekanay2005-coder](https://github.com/lekanay2005-coder) on GitHub with details.

### Scope

- `contracts/` — all Soroban smart contracts
- `packages/sdk/src/` — client-side SDK logic
- `indexer/src/` — event indexer service

### Audit Disclaimer

These contracts have **not been audited**. Use at your own risk. A formal audit is planned before mainnet deployment.

## Documentation Site

Coming soon — see Phase 11 of the build process.

## Demo

End-to-end walkthrough video — coming after deployment (Phase 8).

## License

Apache-2.0
