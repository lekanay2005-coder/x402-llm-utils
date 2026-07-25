import {
  SorobanRpc,
  Contract,
  Address,
  nativeToScVal,
  scValToNative,
  Keypair,
  TransactionBuilder,
  Networks,
  BASE_FEE,
  xdr,
} from "@stellar/stellar-sdk";

export interface ApiListing {
  provider: string;
  endpoint: string;
  pricePerCall: bigint;
  metadataHash: string;
  active: boolean;
}

function contractSpec(u32: string): xdr.ScVal {
  return xdr.ScVal.scvSymbol(u32);
}

export class RegistryClient {
  public contract: Contract;
  public server: SorobanRpc.Server;

  constructor(public contractId: string, public rpcUrl: string) {
    this.contract = new Contract(contractId);
    this.server = new SorobanRpc.Server(rpcUrl);
  }

  async createApi(
    providerKp: Keypair,
    endpoint: string,
    pricePerCall: bigint,
    metadataHash: string
  ): Promise<string> {
    const provider = Address.fromString(providerKp.publicKey());
    const tx = await this.server.prepareTransaction(
      TransactionBuilder.fromXdr(
        this.contract
          .call(
            "create_api",
            provider.toScVal(),
            nativeToScVal(endpoint, { type: "string" }),
            nativeToScVal(pricePerCall, { type: "i128" }),
            nativeToScVal(metadataHash, { type: "string" })
          )
          .toXDR(),
        Networks.PUBLIC
      ).build(),
      await this.server.getAccount(providerKp.publicKey())
    );
    tx.sign(providerKp);
    const send = await this.server.sendTransaction(tx);
    if (send.status === "PENDING" || send.status === "DUPLICATE") {
      const result = await this.server.getTransaction(send.hash);
      if (result.status === "SUCCESS") {
        const apiId = result.returnValue
          ? scValToNative(result.returnValue)
          : send.hash;
        return String(apiId);
      }
    }
    throw new Error(`create_api failed: ${send.errorResult?.error}`);
  }

  async getApi(apiId: string): Promise<ApiListing> {
    const result = await this.server.simulateTransaction(
      TransactionBuilder.fromXdr(
        this.contract
          .call("get_api", nativeToScVal(apiId, { type: "string" }))
          .toXDR(),
        Networks.PUBLIC
      ).build()
    );
    if (result.error) throw new Error(`get_api failed: ${result.error}`);
    const val = (result as any).result?.retval;
    if (!val) throw new Error("get_api returned no value");
    const raw = scValToNative(val);
    return {
      provider: raw.provider?.toString() ?? raw[0]?.toString(),
      endpoint: raw.endpoint?.toString() ?? raw[1]?.toString(),
      pricePerCall: BigInt(raw.price_per_call ?? raw[2] ?? 0),
      metadataHash: raw.metadata_hash?.toString() ?? raw[3]?.toString(),
      active: Boolean(raw.active ?? raw[4]),
    };
  }
}
