#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, token, Address, Bytes, BytesN, Env, Symbol};
use x402_llm_utils_shared::{ContractError, EscrowRecord, EscrowState};
use soroban_sdk::xdr::ToXdr;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum EscrowAdminKey {
    Registry,
    Verifier,
    Token,
    FeeCollector,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum EscrowStorageKey {
    Escrow(BytesN<32>),
}

#[contract]
pub struct EscrowContract;

#[contractimpl]
impl EscrowContract {
    pub fn initialize(
        env: Env,
        admin: Address,
        registry: Address,
        verifier: Address,
        token: Address,
        fee_collector: Address,
    ) -> Result<(), ContractError> {
        admin.require_auth();

        if env.storage().instance().has(&EscrowAdminKey::Registry) {
            return Err(ContractError::AlreadyExists);
        }

        env.storage().instance().set(&EscrowAdminKey::Registry, &registry);
        env.storage().instance().set(&EscrowAdminKey::Verifier, &verifier);
        env.storage().instance().set(&EscrowAdminKey::Token, &token);
        env.storage().instance().set(&EscrowAdminKey::FeeCollector, &fee_collector);

        Ok(())
    }

    pub fn pay(
        env: Env,
        consumer: Address,
        provider: Address,
        api_id: BytesN<32>,
        amount: i128,
    ) -> Result<BytesN<32>, ContractError> {
        consumer.require_auth();

        if amount <= 0 {
            return Err(ContractError::InvalidPrice);
        }

        let token_address: Address = env.storage().instance().get(&EscrowAdminKey::Token).ok_or(ContractError::NotFound)?;
        let token_client = token::Client::new(&env, &token_address);

        // Transfer payment from consumer to escrow contract
        token_client.transfer(&consumer, &env.current_contract_address(), &amount);

        let mut bytes = Bytes::new(&env);
        bytes.append(&consumer.clone().to_xdr(&env));
        bytes.append(&provider.clone().to_xdr(&env));
        bytes.append(&api_id.clone().to_xdr(&env));
        let timestamp = env.ledger().timestamp();
        bytes.append(&timestamp.to_xdr(&env));

        let escrow_id: BytesN<32> = env.crypto().sha256(&bytes).into();
        let key = EscrowStorageKey::Escrow(escrow_id.clone());

        if env.storage().persistent().has(&key) {
            return Err(ContractError::AlreadyExists);
        }

        let record = EscrowRecord {
            consumer,
            provider,
            api_id,
            amount,
            state: EscrowState::Locked,
            created_at: timestamp,
        };

        env.storage().persistent().set(&key, &record);
        env.storage().persistent().extend_ttl(&key, 500_000, 500_000);

        env.events().publish(
            (Symbol::new(&env, "pay"), escrow_id.clone()),
            (record.consumer.clone(), record.amount),
        );

        Ok(escrow_id)
    }

    pub fn confirm_execution(env: Env, escrow_id: BytesN<32>) -> Result<(), ContractError> {
        let verifier: Address = env.storage().instance().get(&EscrowAdminKey::Verifier).ok_or(ContractError::NotFound)?;
        verifier.require_auth();

        let key = EscrowStorageKey::Escrow(escrow_id.clone());
        let mut record: EscrowRecord = env.storage()
            .persistent()
            .get(&key)
            .ok_or(ContractError::NotFound)?;

        if record.state != EscrowState::Locked {
            return Err(ContractError::InvalidState);
        }

        record.state = EscrowState::Confirmed;
        env.storage().persistent().set(&key, &record);
        env.storage().persistent().extend_ttl(&key, 500_000, 500_000);

        env.events().publish(
            (Symbol::new(&env, "confirm_ex"), escrow_id),
            (record.provider, record.amount),
        );

        Ok(())
    }

    pub fn refund(env: Env, consumer: Address, escrow_id: BytesN<32>) -> Result<(), ContractError> {
        consumer.require_auth();

        let key = EscrowStorageKey::Escrow(escrow_id.clone());
        let mut record: EscrowRecord = env.storage()
            .persistent()
            .get(&key)
            .ok_or(ContractError::NotFound)?;

        if record.consumer != consumer {
            return Err(ContractError::Unauthorized);
        }

        if record.state != EscrowState::Locked {
            return Err(ContractError::InvalidState);
        }

        let token_address: Address = env.storage().instance().get(&EscrowAdminKey::Token).ok_or(ContractError::NotFound)?;
        let token_client = token::Client::new(&env, &token_address);

        // Refund funds back to consumer
        token_client.transfer(&env.current_contract_address(), &consumer, &record.amount);

        record.state = EscrowState::Refunded;
        env.storage().persistent().set(&key, &record);
        env.storage().persistent().extend_ttl(&key, 500_000, 500_000);

        env.events().publish(
            (Symbol::new(&env, "refund"), escrow_id),
            (consumer, record.amount),
        );

        Ok(())
    }

    pub fn withdraw(env: Env, provider: Address, escrow_id: BytesN<32>) -> Result<(), ContractError> {
        provider.require_auth();

        let key = EscrowStorageKey::Escrow(escrow_id.clone());
        let mut record: EscrowRecord = env.storage()
            .persistent()
            .get(&key)
            .ok_or(ContractError::NotFound)?;

        if record.provider != provider {
            return Err(ContractError::Unauthorized);
        }

        if record.state != EscrowState::Confirmed {
            return Err(ContractError::InvalidState);
        }

        let token_address: Address = env.storage().instance().get(&EscrowAdminKey::Token).ok_or(ContractError::NotFound)?;
        let fee_collector: Address = env.storage().instance().get(&EscrowAdminKey::FeeCollector).ok_or(ContractError::NotFound)?;
        let token_client = token::Client::new(&env, &token_address);

        // 2% platform fee
        let fee = (record.amount * 2) / 100;
        let provider_amount = record.amount - fee;

        if fee > 0 {
            token_client.transfer(&env.current_contract_address(), &fee_collector, &fee);
        }
        token_client.transfer(&env.current_contract_address(), &provider, &provider_amount);

        record.state = EscrowState::Withdrawn;
        env.storage().persistent().set(&key, &record);
        env.storage().persistent().extend_ttl(&key, 500_000, 500_000);

        env.events().publish(
            (Symbol::new(&env, "withdraw"), escrow_id),
            (provider, provider_amount),
        );

        Ok(())
    }

    pub fn get_escrow(env: Env, escrow_id: BytesN<32>) -> Result<EscrowRecord, ContractError> {
        let key = EscrowStorageKey::Escrow(escrow_id);
        env.storage()
            .persistent()
            .get(&key)
            .ok_or(ContractError::NotFound)
    }
}
