# x402 LLM-Utility Marketplace

A pay-per-call marketplace for LLM-utility APIs — token counting, embeddings, moderation, document parsing — where payment sits in Soroban escrow until the provider's response is confirmed, with automatic refund on failure. Built on the x402 protocol and Stellar's production x402 facilitator.

## Architecture
- **x402-llm-utils-contract**: Pure Rust/Soroban workspace (`registry`, `escrow`, `settlement`, `shared`).
- **x402-llm-utils-app**: Monorepo containing `packages/sdk`, `apps/web`, and `indexer/`.

## Locked Design Choices
- **Vertical Lock**: LLM-utility APIs only.
- **Verification Model**: Lightweight verifier call for `confirm_execution()` (response within timeout, correct HTTP status, non-empty payload matching schema). Self-attestation is explicitly rejected.
- **Platform Fee**: Fixed at 2%, collected on withdrawal in Escrow.
