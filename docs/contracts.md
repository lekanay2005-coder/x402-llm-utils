# Smart Contract Reference

## Shared (`contracts/shared`)

Types and errors used across all contracts.

### ContractError

```rust
enum ContractError {
    Unauthorized,        // Caller lacks required auth
    AlreadyExists,       // Resource already registered
    NotFound,            // Resource not found
    Paused,              // API is paused
    InvalidPrice,        // Price is zero or negative
    InsufficientBalance, // Consumer has insufficient funds
    InvalidState,        // Escrow in wrong state for operation
    Expired,             // Escrow deadline passed
    ArithmeticError,     // Overflow or underflow
    InvalidVerifier,     // Wrong verifier address
}
```

### ApiListing

```rust
struct ApiListing {
    provider: Address,
    endpoint: String,
    price_per_call: i128,
    metadata_hash: String,
    active: bool,
}
```

### EscrowRecord

```rust
struct EscrowRecord {
    consumer: Address,
    provider: Address,
    api_id: String,
    amount: i128,
    state: EscrowState,
    created_at: u64,
}
```

### EscrowState

```rust
enum EscrowState {
    Locked,
    Confirmed,
    Refunded,
    Withdrawn,
}
```

---

## Registry (`contracts/registry`)

Manages API provider listings. Each listing is identified by `api_id = sha256(provider || endpoint)`.

### Functions

| Function | Auth | Params | Returns | Description |
|----------|------|--------|---------|-------------|
| `create_api` | `provider` | `provider: Address, endpoint: String, price: i128, metadata_hash: String` | `String` (api_id) | Register a new API |
| `change_price` | `provider` | `provider: Address, api_id: String, new_price: i128` | `Void` | Update API price |
| `pause_api` | `provider` | `provider: Address, api_id: String, active: bool` | `Void` | Pause or resume |
| `get_api` | none | `api_id: String` | `ApiListing` | Read an API |

### Events

| Event | Topics | Data |
|-------|--------|------|
| `create_api` | `create_api` | `(api_id, provider, endpoint, price, metadata_hash)` |
| `chg_price` | `chg_price` | `(api_id, new_price)` |
| `pause_api` | `pause_api` | `(api_id, active)` |

---

## Escrow (`contracts/escrow`)

Holds consumer funds in escrow during API call execution.

### Initialization

One-time setup by the admin:
```rust
fn initialize(
    admin: Address,
    registry: Address,    // Registry contract ID
    verifier: Address,    // Verifier account
    token: Address,       // Token contract ID
    fee_collector: Address,
);
```

### Functions

| Function | Auth | Params | Returns | Description |
|----------|------|--------|---------|-------------|
| `pay` | `consumer` | `consumer: Address, provider: Address, api_id: String, amount: i128` | `String` (escrow_id) | Lock payment in escrow |
| `confirm_execution` | `verifier` | `escrow_id: String` | `Void` | Mark execution successful |
| `refund` | `consumer` | `consumer: Address, escrow_id: String` | `Void` | Refund while Locked |
| `withdraw` | `provider` | `provider: Address, escrow_id: String` | `Void` | Withdraw (2% fee deducted) |
| `get_escrow` | none | `escrow_id: String` | `EscrowRecord` | Read escrow state |

### Fee Logic (withdraw)

```rust
let fee = amount * 200 / 10000;  // 2% = 200 basis points
let payout = amount - fee;
token_client.transfer(&provider, &payout);
token_client.transfer(&fee_collector, &fee);
```

### Events

| Event | Topics | Data |
|-------|--------|------|
| `pay` | `pay` | `(escrow_id, consumer, provider, api_id, amount, created_at)` |
| `confirm_ex` | `confirm_ex` | `(escrow_id)` |
| `refund` | `refund` | `(escrow_id)` |
| `withdraw` | `withdraw` | `(escrow_id)` |

---

## Settlement (`contracts/settlement`)

Batch settlement for providers. Currently a skeleton for future implementation.

### Functions

| Function | Auth | Params | Description |
|----------|------|--------|-------------|
| `initialize` | `admin` | `admin: Address, escrow: Address, token: Address` | One-time init |
