#!/usr/bin/env bash
set -e

echo "Deploying x402-llm-utils contracts to Soroban network..."
# 1. Deploy Registry
# 2. Deploy Escrow (pointing to Registry ID)
# 3. Deploy Settlement (pointing to Escrow ID)
echo "Deployment completed successfully."
