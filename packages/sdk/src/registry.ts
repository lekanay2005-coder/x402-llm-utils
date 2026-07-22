import { Address } from "@stellar/stellar-sdk";

export interface ApiListing {
  provider: string;
  endpoint: string;
  pricePerCall: bigint;
  metadataHash: string;
  active: boolean;
}

export class RegistryClient {
  constructor(public contractId: string, public rpcUrl: string) {}

  async createApi(provider: string, endpoint: string, pricePerCall: bigint, metadataHash: string): Promise<string> {
    // Stub implementation for SDK contract invocation
    return "0x_mock_api_id";
  }

  async getApi(apiId: string): Promise<ApiListing> {
    // Stub implementation
    return {
      provider: "G...",
      endpoint: "https://api.llmutils.io/v1/tokenize",
      pricePerCall: 100000n,
      metadataHash: "0x0",
      active: true,
    };
  }
}
