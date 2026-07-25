#!/usr/bin/env bash
# Drips Wave Submission Script — x402 LLM-Utility Marketplace
#
# This script prints the submission materials. It doesn't submit automatically
# (the Drips Wave form requires manual review). Run this, copy the output,
# and paste it into the Drips Wave application.
#
# Prerequisites:
#   - gh CLI installed and authenticated
#   - Contract IDs known (set below after deployment)
#   - Live app URL known (set below after deployment to Vercel)

set -euo pipefail

REPO="lekanay2005-coder/x402-llm-utils"
LIVE_APP_URL="${LIVE_APP_URL:-https://x402-llm-utils.vercel.app}"
DOCS_URL="${DOCS_URL:-https://github.com/${REPO}/tree/main/docs}"
REGISTRY_ID="${REGISTRY_ID:-<deploy-to-populate>}"
ESCROW_ID="${ESCROW_ID:-<deploy-to-populate>}"
SETTLEMENT_ID="${SETTLEMENT_ID:-<deploy-to-populate>}"

echo "============================================"
echo "  Drips Wave Submission — x402 LLM-Utility"
echo "============================================"
echo ""

# Step 1: Verify not already approved
echo "--- Step 1: Check approved repos ---"
echo "Fetching current approved list from drips.network..."
echo ""
curl -s https://drips.network/wave/stellar/repos | \
  python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    repos = data if isinstance(data, list) else []
    for r in repos:
        name = r.get('name', r.get('repo', ''))
        if 'x402' in name.lower() or 'llm' in name.lower():
            print(f'  WARNING: Project may already be approved: {name}')
            sys.exit(1)
    print('  OK: x402-llm-utils not found in approved list.')
except:
    print('  WARNING: Could not parse response. Manually check https://drips.network/wave/stellar/repos')
"
echo ""

# Step 2: Assemble supporting links
echo "--- Step 2: Supporting Links ---"
echo ""
echo "  Live App URL:    ${LIVE_APP_URL}"
echo "  Repo (mono):     https://github.com/${REPO}"
echo "  Docs:            ${DOCS_URL}"
echo "  Registry (SCAN): https://futurenet.stellarchain.io/contract/${REGISTRY_ID}"
echo "  Escrow (SCAN):   https://futurenet.stellarchain.io/contract/${ESCROW_ID}"
echo "  Settlement:      https://futurenet.stellarchain.io/contract/${SETTLEMENT_ID}"
echo "  Demo Video:      [record and link here]"
echo ""

# Step 3: Repo relationship description
echo "--- Step 3: Repo Relationship ---"
echo ""
echo "  This is a single-repo submission (x402-llm-utils) containing:"
echo "    - contracts/     — Soroban smart contract workspace (4 crates)"
echo "    - packages/sdk/  — TypeScript SDK for contract interaction"
echo "    - apps/web/      — Next.js frontend marketplace"
echo "    - indexer/       — Event indexer + REST API"
echo "    - docs/          — Full documentation site"
echo ""
echo "  The contracts/app split recommended by Wave guidelines is"
echo "  achieved as internal monorepo packages rather than separate"
echo "  repositories. This keeps maintainer overhead low while"
echo "  preserving clear separation of concerns."
echo ""

# Step 4: Planned issues
echo "--- Step 4: Planned Issues ---"
echo ""
echo "  Issues grounded in the created issue tracker:"
echo "  1. feat(settlement): implement batch payout logic"
echo "     — Type: enhancement | Complexity: medium"
echo "     — Settlement contract skeleton needs the actual batch payout logic."
echo ""
echo "  2. test(escrow): add edge-case tests for refund and withdraw"
echo "     — Type: testing | Complexity: low"
echo "     — Double-refund, unauthorized access, expired escrow boundary tests."
echo ""
echo "  3. feat(sdk): add contract spec generation and type-safe wrappers"
echo "     — Type: enhancement | Complexity: medium"
echo "     — Auto-generate TypeScript types from Soroban specs + error handling."
echo ""
echo "  4. feat(sdk): add event subscription API"
echo "     — Type: enhancement | Complexity: medium"
echo "     — Real-time event subscription for Registry and Escrow events."
echo ""
echo "  5. feat(web): add provider dashboard"
echo "     — Type: enhancement | Complexity: high"
echo "     — Full provider UI: register, price, pause APIs + escrow history."
echo ""
echo "  6. feat(web): add payment flow with Freighter wallet"
echo "     — Type: enhancement | Complexity: high"
echo "     — End-to-end consumer payment flow via Freighter wallet."
echo ""
echo "  7. feat(indexer): add historical event backfill"
echo "     — Type: enhancement | Complexity: medium"
echo "     — CLI command to replay all contract events from deploy ledger."
echo ""
echo "  Run ./scripts/create-issues.sh to create these on GitHub."
echo ""

# Step 5: Project description
echo "--- Step 5: Submission Description ---"
echo ""
echo "  x402 LLM-Utility Marketplace"
echo ""
echo "  A pay-per-call marketplace for LLM utility APIs — token counting,"
echo "  embeddings, moderation, and document parsing — where every API call"
echo "  is backed by a Soroban escrow contract. Payment is locked before"
echo "  execution, released only on verified delivery, and automatically"
echo "  refunded on failure. Built on the x402 protocol (HTTP 402 + Stellar"
echo "  payments) and Stellar's production x402 facilitator."
echo ""
echo "  The platform connects four Soroban contracts (Registry, Escrow,"
echo "  Settlement, Shared) with a TypeScript SDK, a Next.js marketplace"
echo "  frontend, and a PostgreSQL-backed event indexer. Providers register"
echo "  APIs with per-call pricing; consumers pay via Freighter wallet; a"
echo "  lightweight verifier confirms delivery; and a 2% protocol fee funds"
echo "  ongoing development."
echo ""
echo "  Target scale: 100+ APIs, 10,000+ escrows/month at launch, growing"
echo "  to 1M+ monthly calls within 12 months."
echo ""
echo "============================================"
echo "  Copy the above into the Drips Wave form at"
echo "  https://drips.network/wave/stellar/apply"
echo "============================================"
