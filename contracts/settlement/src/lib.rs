#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env};
use x402_llm_utils_shared::ContractError;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum SettlementAdminKey {
    Admin,
    Escrow,
    Token,
}

#[contract]
pub struct SettlementContract;

#[contractimpl]
impl SettlementContract {
    pub fn initialize(
        env: Env,
        admin: Address,
        escrow: Address,
        token: Address,
    ) -> Result<(), ContractError> {
        admin.require_auth();

        if env.storage().instance().has(&SettlementAdminKey::Admin) {
            return Err(ContractError::AlreadyExists);
        }

        env.storage().instance().set(&SettlementAdminKey::Admin, &admin);
        env.storage().instance().set(&SettlementAdminKey::Escrow, &escrow);
        env.storage().instance().set(&SettlementAdminKey::Token, &token);

        Ok(())
    }
}
