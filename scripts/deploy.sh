#!/usr/bin/env bash
set -euo pipefail

# x402 LLM-Utility Marketplace — Contract Deployment Script
# Usage: ./scripts/deploy.sh [network]
#   network: local | testnet | futurenet (default: testnet)
#
# Prerequisites:
#   - soroban-cli 27.0.1 installed
#   - SOROBAN_ACCOUNT env var set to the deployer keypair alias
#   - Required env vars per component (see below)

NETWORK="${1:-testnet}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

case "$NETWORK" in
  local)
    RPC_URL="http://localhost:8000/soroban/rpc"
    PASSPHRASE="Standalone Network ; February 2017"
    ;;
  testnet)
    RPC_URL="https://rpc-testnet.stellar.org"
    PASSPHRASE="Test SDF Network ; September 2015"
    ;;
  futurenet)
    RPC_URL="https://rpc-futurenet.stellar.org"
    PASSPHRASE="Test SDF Future Network ! October 2022"
    ;;
  *)
    echo "Unknown network: $NETWORK (use: local, testnet, futurenet)"
    exit 1
    ;;
esac

echo "=== x402 LLM-Utility Marketplace — Deploy to $NETWORK ==="
echo "RPC:     $RPC_URL"
echo "Account: ${SOROBAN_ACCOUNT:-default}"
echo ""

deploy_contract() {
  local package="$1"
  # Cargo converts hyphens to underscores in WASM output filenames
  local wasm_name="${package//-/_}"
  local wasm="$PROJECT_DIR/target/wasm32-unknown-unknown/release/${wasm_name}.wasm"

  if [ ! -f "$wasm" ]; then
    echo "ERROR: WASM not found at $wasm"
    echo "Run: cargo build --target wasm32-unknown-unknown --release"
    exit 1
  fi

  echo "Deploying $package..."
  soroban contract deploy \
    --wasm "$wasm" \
    --source "${SOROBAN_ACCOUNT:-default}" \
    --rpc-url "$RPC_URL" \
    --network-passphrase "$PASSPHRASE"
}

invoke_contract() {
  local contract_id="$1"
  shift
  soroban contract invoke \
    --id "$contract_id" \
    --source "${SOROBAN_ACCOUNT:-default}" \
    --rpc-url "$RPC_URL" \
    --network-passphrase "$PASSPHRASE" \
    "$@"
}

echo "--- Building contracts ---"
cargo build --target wasm32-unknown-unknown --release

echo ""
echo "=== Step 1: Deploy Registry ==="
REGISTRY_ID=$(deploy_contract "x402_llm_utils_registry")
echo "Registry ID: $REGISTRY_ID"

echo ""
echo "=== Step 2: Deploy Escrow ==="
ESCROW_ID=$(deploy_contract "x402_llm_utils_escrow")
echo "Escrow ID: $ESCROW_ID"

echo ""
echo "=== Step 3: Initialize Escrow ==="
# Requires: admin, registry address, verifier address, token address, fee_collector address
ADMIN="${ADMIN_ADDRESS:?Set ADMIN_ADDRESS}"
VERIFIER="${VERIFIER_ADDRESS:?Set VERIFIER_ADDRESS}"
TOKEN="${TOKEN_ADDRESS:?Set TOKEN_ADDRESS}"
FEE_COLLECTOR="${FEE_COLLECTOR_ADDRESS:?Set FEE_COLLECTOR_ADDRESS}"

invoke_contract "$ESCROW_ID" \
  initialize \
  --admin "$ADMIN" \
  --registry "$REGISTRY_ID" \
  --verifier "$VERIFIER" \
  --token "$TOKEN" \
  --fee_collector "$FEE_COLLECTOR"
echo "Escrow initialized."

echo ""
echo "=== Step 4: Deploy Settlement ==="
SETTLEMENT_ID=$(deploy_contract "x402_llm_utils_settlement")
echo "Settlement ID: $SETTLEMENT_ID"

echo ""
echo "=== Step 5: Initialize Settlement ==="
invoke_contract "$SETTLEMENT_ID" \
  initialize \
  --admin "$ADMIN" \
  --escrow "$ESCROW_ID" \
  --token "$TOKEN"
echo "Settlement initialized."

echo ""
echo "============================================"
echo "  Deployment complete!"
echo "============================================"
echo ""
echo "Contract IDs (save these):"
echo "  REGISTRY_CONTRACT_ID=$REGISTRY_ID"
echo "  ESCROW_CONTRACT_ID=$ESCROW_ID"
echo "  SETTLEMENT_CONTRACT_ID=$SETTLEMENT_ID"
echo ""
echo "Set these in your .env files and hosting platform."
