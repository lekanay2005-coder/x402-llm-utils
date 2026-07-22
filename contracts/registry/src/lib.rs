#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, Address, Bytes, BytesN, Env, String, Symbol};
use x402_llm_utils_shared::{ApiListing, ContractError};
use soroban_sdk::xdr::ToXdr;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum RegistryDataKey {
    Api(BytesN<32>),
}

#[contract]
pub struct RegistryContract;

#[contractimpl]
impl RegistryContract {
    pub fn create_api(
        env: Env,
        provider: Address,
        endpoint: String,
        price_per_call: i128,
        metadata_hash: BytesN<32>,
    ) -> Result<BytesN<32>, ContractError> {
        provider.require_auth();

        if price_per_call <= 0 {
            return Err(ContractError::InvalidPrice);
        }

        let mut bytes = Bytes::new(&env);
        bytes.append(&provider.clone().to_xdr(&env));
        bytes.append(&endpoint.clone().to_xdr(&env));
        let api_id: BytesN<32> = env.crypto().sha256(&bytes).into();

        let key = RegistryDataKey::Api(api_id.clone());
        if env.storage().persistent().has(&key) {
            return Err(ContractError::AlreadyExists);
        }

        let listing = ApiListing {
            provider: provider.clone(),
            endpoint,
            price_per_call,
            metadata_hash,
            active: true,
        };

        env.storage().persistent().set(&key, &listing);
        env.storage().persistent().extend_ttl(&key, 500_000, 500_000);

        env.events().publish(
            (Symbol::new(&env, "create_api"), api_id.clone()),
            (provider, listing.price_per_call),
        );

        Ok(api_id)
    }

    pub fn change_price(
        env: Env,
        provider: Address,
        api_id: BytesN<32>,
        new_price: i128,
    ) -> Result<(), ContractError> {
        provider.require_auth();

        if new_price <= 0 {
            return Err(ContractError::InvalidPrice);
        }

        let key = RegistryDataKey::Api(api_id.clone());
        let mut listing: ApiListing = env.storage()
            .persistent()
            .get(&key)
            .ok_or(ContractError::NotFound)?;

        if listing.provider != provider {
            return Err(ContractError::Unauthorized);
        }

        listing.price_per_call = new_price;
        env.storage().persistent().set(&key, &listing);
        env.storage().persistent().extend_ttl(&key, 500_000, 500_000);

        env.events().publish(
            (Symbol::new(&env, "chg_price"), api_id),
            (provider, new_price),
        );

        Ok(())
    }

    pub fn pause_api(
        env: Env,
        provider: Address,
        api_id: BytesN<32>,
        active: bool,
    ) -> Result<(), ContractError> {
        provider.require_auth();

        let key = RegistryDataKey::Api(api_id.clone());
        let mut listing: ApiListing = env.storage()
            .persistent()
            .get(&key)
            .ok_or(ContractError::NotFound)?;

        if listing.provider != provider {
            return Err(ContractError::Unauthorized);
        }

        listing.active = active;
        env.storage().persistent().set(&key, &listing);
        env.storage().persistent().extend_ttl(&key, 500_000, 500_000);

        env.events().publish(
            (Symbol::new(&env, "pause_api"), api_id),
            (provider, active),
        );

        Ok(())
    }

    pub fn get_api(env: Env, api_id: BytesN<32>) -> Result<ApiListing, ContractError> {
        let key = RegistryDataKey::Api(api_id);
        env.storage()
            .persistent()
            .get(&key)
            .ok_or(ContractError::NotFound)
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Env};

    #[test]
    fn test_registry_flow() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(RegistryContract, ());
        let client = RegistryContractClient::new(&env, &contract_id);

        let provider = Address::generate(&env);
        let endpoint = String::from_str(&env, "https://api.llmutils.io/v1/tokenize");
        let price = 100_000i128;
        let meta_hash = BytesN::from_array(&env, &[1u8; 32]);

        let api_id = client.create_api(&provider, &endpoint, &price, &meta_hash);
        let listing = client.get_api(&api_id);

        assert_eq!(listing.provider, provider);
        assert_eq!(listing.price_per_call, price);
        assert!(listing.active);

        // Change price
        let new_price = 150_000i128;
        client.change_price(&provider, &api_id, &new_price);
        let updated_listing = client.get_api(&api_id);
        assert_eq!(updated_listing.price_per_call, new_price);

        // Pause API
        client.pause_api(&provider, &api_id, &false);
        let paused_listing = client.get_api(&api_id);
        assert!(!paused_listing.active);
    }
}
