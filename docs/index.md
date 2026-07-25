# x402 LLM-Utility Marketplace — Documentation

## Introduction

The x402 LLM-Utility Marketplace is a pay-per-call protocol for LLM utility APIs — token counting, embeddings, moderation, and document parsing — built on Stellar's Soroban smart contracts.

Every API call is backed by an on-chain escrow: the consumer locks payment before the call, a lightweight verifier confirms the provider delivered a valid response within the timeout, and the provider withdraws minus a 2% platform fee. If the provider fails or the response is invalid, the consumer gets an automatic refund.

### Why This Exists

Existing LLM API billing is post-paid (API key + monthly invoice) or pre-paid (wallet top-up). Both models force consumers to trust providers with their payment and force providers to manage billing infrastructure. The x402 protocol (HTTP 402 + Stellar escrow) eliminates both problems: payment is atomic with each call, escrowed before execution, and released only on verified delivery.

### Key Figures

- **Escrow lock time**: ~5 seconds (Stellar transaction finality)
- **Platform fee**: 2% (200 basis points), deducted on provider withdrawal
- **Supported assets**: Any Stellar asset (native XLM, USDC, etc.)
- **Network**: Stellar Futurenet (testnet), planned mainnet

## Architecture

```
User Browser → Next.js Frontend → SDK → Soroban RPC (writes)
                                    → Indexer API → PostgreSQL (reads)
                                    → x402 Facilitator (HTTP 402 flow)

Smart Contracts → Events → Indexer Service → PostgreSQL
```

### Repository Structure

- **x402-llm-utils** (this repo) — Smart contracts, SDK, indexer, web app
- **contracts/** — Rust/Soroban workspace (shared, registry, escrow, settlement)
- **packages/sdk/** — TypeScript SDK for contract interaction + x402 handling
- **apps/web/** — Next.js 14 marketplace frontend
- **indexer/** — Event indexer + REST API backed by PostgreSQL

## Project Status

| Phase | Status |
|-------|--------|
| Smart Contracts | Done (tested) |
| SDK | Done |
| Web App | Done |
| Indexer/API | Done |
| Deployment Scripts | Done |
| Docs | This site |
| Drips Wave Submission | Pending |

## Quick Start

```bash
# Build & test contracts
cargo build --target wasm32-unknown-unknown --release
cargo test

# Deploy to testnet
export SOROBAN_ACCOUNT=my-key
export ADMIN_ADDRESS=G...
export VERIFIER_ADDRESS=G...
export TOKEN_ADDRESS=C...
export FEE_COLLECTOR_ADDRESS=G...
./scripts/deploy.sh testnet

# Run indexer
cd indexer && npm install
createdb x402_llm_utils && psql x402_llm_utils < schema.sql
npm run dev

# Run web app
cd apps/web && npm install && npm run dev
```
