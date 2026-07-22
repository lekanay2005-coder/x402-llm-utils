#![no_std]

use soroban_sdk::{contracterror, contracttype, Address, BytesN, String};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
pub enum ContractError {
    Unauthorized = 1,
    AlreadyExists = 2,
    NotFound = 3,
    Paused = 4,
    InvalidPrice = 5,
    InsufficientBalance = 6,
    InvalidState = 7,
    Expired = 8,
    ArithmeticError = 9,
    InvalidVerifier = 10,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ApiListing {
    pub provider: Address,
    pub endpoint: String,
    pub price_per_call: i128,
    pub metadata_hash: BytesN<32>,
    pub active: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum EscrowState {
    Locked,
    Confirmed,
    Refunded,
    Withdrawn,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct EscrowRecord {
    pub consumer: Address,
    pub provider: Address,
    pub api_id: BytesN<32>,
    pub amount: i128,
    pub state: EscrowState,
    pub created_at: u64,
}
