#!/usr/bin/env bash
# Bulk issue generator for x402 LLM-Utility Marketplace
# Usage: gh auth login  (first time)
#        ./scripts/create-issues.sh

set -euo pipefail

REPO="lekanay2005-coder/x402-llm-utils"

create_issue() {
  local title="$1"
  local label="$2"
  local body="$3"
  gh issue create \
    --repo "$REPO" \
    --title "$title" \
    --label "$label" \
    --body "$body"
}

# --- Contract Issues ---

create_issue "feat(settlement): implement batch payout logic" "enhancement" "
## Summary
Implement the batch settlement logic in the Settlement contract. Currently a skeleton.

## Acceptance Criteria
- [ ] Settlement contract processes multiple escrow payouts in a single transaction
- [ ] Admin can trigger batch settlement for a list of escrow IDs
- [ ] Proper auth checks (admin-only)
- [ ] Events emitted per payout
- [ ] Integration tests pass

## Tech Stack
- Rust, soroban-sdk 27.0.1
"

create_issue "test(escrow): add edge-case tests for refund and withdraw" "testing" "
## Summary
Expand integration tests for the Escrow contract to cover edge cases.

## Acceptance Criteria
- [ ] Test double-refund attempt fails
- [ ] Test withdraw before confirmation fails
- [ ] Test expired escrow refund
- [ ] Test unauthorized confirm fails
- [ ] Test fee calculation at withdrawal boundary (0%, 2%, max)

## Tech Stack
- Rust, soroban-sdk 27.0.1
"

# --- SDK Issues ---

create_issue "feat(sdk): add contract spec generation and type-safe wrappers" "enhancement" "
## Summary
Generate TypeScript type definitions from the Soroban contract specs and build type-safe wrappers.

## Acceptance Criteria
- [ ] SDK includes auto-generated types matching contract storage
- [ ] Helper functions for common XDR encoding/decoding patterns
- [ ] Proper error handling for RPC failures
- [ ] Retry logic for transaction submission
- [ ] Tests with a local Soroban test environment

## Tech Stack
- TypeScript, @stellar/stellar-sdk 13.x
"

create_issue "feat(sdk): add event subscription API" "enhancement" "
## Summary
Add event subscription support to the SDK so consumers can listen for contract events in real-time.

## Acceptance Criteria
- [ ] Event subscription method for Registry events (create_api, chg_price, pause_api)
- [ ] Event subscription method for Escrow events (pay, confirm_ex, refund, withdraw)
- [ ] Automatic reconnection on failure
- [ ] Typed event payloads

## Tech Stack
- TypeScript, @stellar/stellar-sdk 13.x
"

# --- Web App Issues ---

create_issue "feat(web): add provider dashboard" "enhancement" "
## Summary
Build a provider-facing dashboard for registering and managing API listings.

## Acceptance Criteria
- [ ] Provider can connect Stellar wallet (Freighter / Wallet SDK)
- [ ] Provider can register a new API (endpoint, price, metadata)
- [ ] Provider can update pricing on existing APIs
- [ ] Provider can pause/resume APIs
- [ ] Provider can view escrow history for their APIs

## Tech Stack
- Next.js 14, React 18, @stellar/stellar-sdk 13.x
"

create_issue "feat(web): add payment flow with Freighter wallet" "enhancement" "
## Summary
Implement the end-to-end payment flow where consumers connect Freighter, select an API, and pay via escrow.

## Acceptance Criteria
- [ ] Freighter wallet connection
- [ ] API selection and price display
- [ ] Escrow creation (pay function) via wallet
- [ ] Status polling for escrow state transitions
- [ ] Success/refund notifications

## Tech Stack
- Next.js 14, React 18, @stellar/freighter-api, @stellar/stellar-sdk 13.x
"

# --- Indexer Issues ---

create_issue "feat(indexer): add historical event backfill" "enhancement" "
## Summary
Add a backfill command to the indexer that replays all contract events from the deploy ledger.

## Acceptance Criteria
- [ ] CLI flag or env var triggers backfill mode
- [ ] Fetches all events from deploy ledger to current
- [ ] Batch writes to PostgreSQL for performance
- [ ] Progress logging
- [ ] Idempotent (safe to re-run)

## Tech Stack
- Node.js, TypeScript, @stellar/stellar-sdk 13.x, pg
"

echo ""
echo "Issues created successfully."
