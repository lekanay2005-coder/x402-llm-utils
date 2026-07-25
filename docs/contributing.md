# Contributing

See [CONTRIBUTING.md](https://github.com/lekanay2005-coder/x402-llm-utils/blob/main/CONTRIBUTING.md) in the repo root.

## What Needs Work

### High Priority

- **Settlement contract**: Implement batch payout logic (currently a skeleton)
- **Edge-case tests**: Double-refund, unauthorized access, expired escrows
- **Provider dashboard**: Web UI for registering and managing APIs
- **Freighter wallet integration**: End-to-end payment flow in the web app

### Medium Priority

- **SDK event subscriptions**: Real-time event listening
- **Historical event backfill**: Replay all contract events from deploy
- **Contract spec generation**: Auto-generate TypeScript types from Soroban specs

### Low Priority

- **Documentation site**: Expand with more worked examples
- **Demo video**: Record end-to-end walkthrough
- **Mainnet deployment**: Coordinate with SDF for mainnet launch

## Development Workflow

1. Pick an issue from the tracker
2. Comment to claim it
3. Create a branch: `git checkout -b feat/my-thing`
4. Commit with conventional commits
5. Open a PR
6. CI must pass (Rust build + test, TypeScript build)

## Code Standards

- No `unwrap()` outside tests
- No floats in contract code — all fees in basis points
- No speculative functions — every contract function maps to a user flow step
- No committing secrets or `.env` files
