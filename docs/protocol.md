# Protocol Mechanics

## State Machine

Every escrow flows through four states:

```
         pay()
  ┌──────────────────┐
  │                  ▼
  │              ┌────────┐
  │   refund()   │ Locked │
  │  ┌───────────┤        │
  │  │           └───┬────┘
  │  │               │ confirm_execution()
  │  │               ▼
  │  │           ┌───────────┐
  │  │           │ Confirmed │
  │  │           └─────┬─────┘
  │  │                 │ withdraw()
  │  │                 ▼
  │  │           ┌──────────┐
  │  │           │ Withdrawn │
  │  │           └──────────┘
  │  │
  │  └──> ┌──────────┐
  │       │ Refunded │
  │       └──────────┘
```

### State Transitions

| # | Transition | Trigger | Auth | Effect |
|---|-----------|---------|------|--------|
| 1 | → Locked | `pay()` | Consumer | Funds moved to contract balance |
| 2 | Locked → Confirmed | `confirm_execution()` | Verifier | Marks execution as valid |
| 3 | Confirmed → Withdrawn | `withdraw()` | Provider | Funds sent to provider minus 2% fee |
| 4 | Locked → Refunded | `refund()` | Consumer | Funds returned to consumer |

## Fee Calculation

Platform fee: **2%** (200 basis points).

Formula:
```
fee = amount * 200 / 10000
payout = amount - fee
```

Example with 100 XLM:
```
fee = 100 * 200 / 10000 = 2 XLM
payout = 100 - 2 = 98 XLM
```

Fee is collected on `withdraw()`, not on `pay()`. If the escrow is refunded, no fee is charged.

## Verification Model

The verifier is a trusted off-chain service that:

1. Receives the consumer's API request and the provider's response
2. Checks the response arrived within the timeout (configurable, default 30s)
3. Validates the HTTP status is 200
4. Validates the response body is non-empty and matches the expected schema
5. Calls `confirm_execution(escrow_id)` on success

Self-attestation (providers confirming their own execution) is explicitly rejected.

## x402 Protocol Flow

```
Consumer                  Provider              Verifier          Escrow Contract
    │                        │                     │                    │
    ├── HTTP GET /api ──────►│                     │                    │
    │◄── 402 Payment Req. ───┤                     │                    │
    │     + challenge         │                     │                    │
    │                         │                     │                    │
    ├── pay() ──────────────────────────────────────────────────────────►│
    │                         │                     │              ┌── Locked
    ├── HTTP GET /api ──────►│                     │                    │
    │     + proof header      │                     │                    │
    │◄── 200 OK + data ──────┤                     │                    │
    │                         ├── confirm_execution───────────────────►│
    │                         │                     │              ┌── Confirmed
    │                         ├── withdraw() ──────────────────────────►│
    │                         │                     │              ┌── Withdrawn
```

## Security Properties

- **No custody risk**: Funds are held by the escrow contract, not the provider
- **Atomic refunds**: Consumer can always refund while in `Locked` state
- **Fee transparency**: 2% fee is enforced by contract logic, not by the provider
- **Verifier independence**: Verifier is a separate role — no single party controls the full flow
