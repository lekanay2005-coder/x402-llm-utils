# Contributing to x402 LLM-Utility Marketplace

## Getting Started

1. Check [open issues](https://github.com/lekanay2005-coder/x402-llm-utils/issues) for work that needs doing.
2. Comment on an issue to claim it.
3. Fork the repo and create a branch: `git checkout -b feat/my-change`.
4. Make your changes.
5. Commit using [conventional commits](https://www.conventionalcommits.org/).
6. Open a PR against `main`.

## Conventional Commits

| Prefix | Use Case |
|--------|----------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation |
| `refactor:` | Code restructuring |
| `test:` | Tests |
| `chore:` | Build/tooling/dependencies |

## What Not to Do

- No speculative contracts or functions — every function must map to a real user-flow step.
- No `unwrap()` outside tests.
- No floats in any contract code — use basis-points math (e.g., 200 = 2%).
- No committing secrets, `.env` files, or contract IDs without verification.

## PR Checklist

Before submitting:

- [ ] Tests pass (`cargo test`)
- [ ] Contracts build for WASM (`cargo build --target wasm32-unknown-unknown --release`)
- [ ] No `unwrap()` in production contract code
- [ ] No floats in contract code
- [ ] Conventional commit message
- [ ] README/docs updated if API surface changed

## Code of Conduct

Be respectful, constructive, and direct. No filler, no hype.
