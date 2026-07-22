use soroban_sdk::{testutils::Address as _, token, Address, BytesN, Env};
use x402_llm_utils_escrow::{EscrowContract, EscrowContractClient};
use x402_llm_utils_shared::EscrowState;

#[test]
fn test_escrow_integration_lifecycle() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let registry = Address::generate(&env);
    let verifier = Address::generate(&env);
    let fee_collector = Address::generate(&env);

    let token_admin = Address::generate(&env);
    let token_contract = env.register_stellar_asset_contract(token_admin);
    let token_client = token::Client::new(&env, &token_contract);

    let contract_id = env.register(EscrowContract, ());
    let client = EscrowContractClient::new(&env, &contract_id);

    client.initialize(&admin, &registry, &verifier, &token_contract, &fee_collector);

    let consumer = Address::generate(&env);
    let provider = Address::generate(&env);
    let api_id = BytesN::from_array(&env, &[99u8; 32]);
    let amount = 200_000i128;

    token_client.mint(&consumer, &1_000_000i128);

    let escrow_id = client.pay(&consumer, &provider, &api_id, &amount);
    let record = client.get_escrow(&escrow_id);

    assert_eq!(record.state, EscrowState::Locked);
    assert_eq!(record.amount, amount);
}
