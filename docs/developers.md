# Developer Guide

## Prerequisites

- Rust 1.75+ (`rustup target add wasm32-unknown-unknown`)
- Soroban CLI 27.0.1 (`cargo install soroban-cli --version 27.0.1`)
- Node.js 20+
- PostgreSQL 16+
- Freighter wallet (for frontend interaction)

## Setup

```bash
git clone https://github.com/lekanay2005-coder/x402-llm-utils.git
cd x402-llm-utils
```

### Contracts

```bash
cargo build --target wasm32-unknown-unknown --release
cargo test
```

### SDK

```bash
cd packages/sdk
npm install
npm run build
```

### Web App

```bash
cd apps/web
npm install
npm run dev
```

### Indexer

```bash
cd indexer
npm install
createdb x402_llm_utils
psql x402_llm_utils < schema.sql
npm run dev
```

## Environment Variables

### Contracts (deployment)

| Variable | Required | Description |
|----------|----------|-------------|
| `SOROBAN_RPC_URL` | Yes | Soroban RPC endpoint |
| `SOROBAN_NETWORK_PASSPHRASE` | Yes | Network passphrase |
| `ADMIN_SECRET_KEY` | Yes | Admin account secret |
| `TOKEN_CONTRACT_ID` | Yes | Token contract ID |
| `VERIFIER_SECRET_KEY` | Yes | Verifier secret key |
| `FEE_COLLECTOR_ADDRESS` | Yes | Fee collector |

### Indexer

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `SOROBAN_RPC_URL` | Yes | — | Soroban RPC endpoint |
| `REGISTRY_CONTRACT_ID` | Yes | — | Registry contract ID |
| `ESCROW_CONTRACT_ID` | Yes | — | Escrow contract ID |
| `POLL_INTERVAL_MS` | No | 10000 | Event polling interval |
| `PORT` | No | 3001 | HTTP API port |

### Web App

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_RPC_URL` | Yes | Soroban RPC (client-side) |
| `NEXT_PUBLIC_REGISTRY_ID` | Yes | Registry contract ID |
| `NEXT_PUBLIC_ESCROW_ID` | Yes | Escrow contract ID |
| `NEXT_PUBLIC_FACILITATOR_URL` | Yes | x402 facilitator URL |
| `NEXT_PUBLIC_INDEXER_API_URL` | Yes | Indexer API URL |

## SDK Usage

### RegistryClient

```typescript
import { RegistryClient } from "@x402-llm-utils/sdk";

const registry = new RegistryClient(
  "C...contract-id",
  "https://rpc-futurenet.stellar.org"
);

// Read an API listing
const api = await registry.getApi("api-id-here");
console.log(api.endpoint, api.pricePerCall);
```

### EscrowClient

```typescript
import { EscrowClient } from "@x402-llm-utils/sdk";
import { Keypair } from "@stellar/stellar-sdk";

const escrow = new EscrowClient(
  "C...contract-id",
  "https://rpc-futurenet.stellar.org"
);
const consumerKp = Keypair.fromSecret("S...secret");

// Pay
const escrowId = await escrow.pay(consumerKp, providerAddress, apiId, amount);

// Confirm (verifier)
await escrow.confirmExecution(verifierKp, escrowId);

// Withdraw (provider)
await escrow.withdraw(providerKp, escrowId);

// Refund (consumer)
await escrow.refund(consumerKp, escrowId);

// Read
const record = await escrow.getEscrow(escrowId);
```

### X402Handler

```typescript
import { X402Handler, EscrowClient } from "@x402-llm-utils/sdk";
import { Keypair } from "@stellar/stellar-sdk";

const consumerKp = Keypair.fromSecret("S...");
const escrowClient = new EscrowClient(contractId, rpcUrl);
const handler = new X402Handler(facilitatorUrl, escrowClient);

// On HTTP 402 response
const result = await handler.handle402Response(consumerKp, response);
// result.escrowId, result.paymentHeader — attach to next request
```

## Deployment

```bash
./scripts/deploy.sh testnet
```

Outputs contract IDs. Set these in your `.env` files and hosting platform's env UI.

## API Reference (Indexer)

| Endpoint | Method | Returns |
|----------|--------|---------|
| `/stats` | GET | `{ apis, escrows, providers }` |
| `/apis` | GET | Array of API listings |
| `/apis/:id` | GET | Single API listing |
| `/escrows` | GET | Array of escrow records |
