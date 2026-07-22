use soroban_sdk::{testutils::Address as _, Address, BytesN, Env, String};
use x402_llm_utils_registry::{RegistryContract, RegistryContractClient};

#[test]
fn test_registry_integration_lifecycle() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(RegistryContract, ());
    let client = RegistryContractClient::new(&env, &contract_id);

    let provider = Address::generate(&env);
    let endpoint = String::from_str(&env, "https://api.llmutils.io/v1/embeddings");
    let price = 50_000i128;
    let meta_hash = BytesN::from_array(&env, &[42u8; 32]);

    let api_id = client.create_api(&provider, &endpoint, &price, &meta_hash);
    let listing = client.get_api(&api_id);

    assert_eq!(listing.provider, provider);
    assert_eq!(listing.price_per_call, price);
    assert!(listing.active);
}
