import {
  SorobanRpc,
  Contract,
  Address,
  nativeToScVal,
  scValToNative,
  Keypair,
  TransactionBuilder,
  Networks,
  xdr,
} from "@stellar/stellar-sdk";

export type EscrowState = "Locked" | "Confirmed" | "Refunded" | "Withdrawn";

export interface EscrowRecord {
  consumer: string;
  provider: string;
  apiId: string;
  amount: bigint;
  state: EscrowState;
  createdAt: number;
}

async function submitAndPoll(
  server: SorobanRpc.Server,
  contract: Contract,
  method: string,
  kp: Keypair,
  args: xdr.ScVal[]
): Promise<string | undefined> {
  const source = await server.getAccount(kp.publicKey());
  const tx = TransactionBuilder.fromXdr(
    contract.call(method, ...args).toXDR(),
    Networks.PUBLIC
  );
  const prepared = await server.prepareTransaction(tx.build(), source);
  prepared.sign(kp);
  const send = await server.sendTransaction(prepared);
  if (send.status === "PENDING" || send.status === "DUPLICATE") {
    const result = await server.getTransaction(send.hash);
    if (result.status === "SUCCESS") {
      return result.returnValue
        ? String(scValToNative(result.returnValue))
        : send.hash;
    }
  }
  throw new Error(`${method} failed: ${send.errorResult?.error}`);
}

export class EscrowClient {
  public contract: Contract;
  public server: SorobanRpc.Server;

  constructor(public contractId: string, public rpcUrl: string) {
    this.contract = new Contract(contractId);
    this.server = new SorobanRpc.Server(rpcUrl);
  }

  async pay(
    consumerKp: Keypair,
    provider: string,
    apiId: string,
    amount: bigint
  ): Promise<string> {
    return (await submitAndPoll(
      this.server,
      this.contract,
      "pay",
      consumerKp,
      [
        Address.fromString(consumerKp.publicKey()).toScVal(),
        Address.fromString(provider).toScVal(),
        nativeToScVal(apiId, { type: "string" }),
        nativeToScVal(amount, { type: "i128" }),
      ]
    ))!;
  }

  async confirmExecution(verifierKp: Keypair, escrowId: string): Promise<void> {
    await submitAndPoll(this.server, this.contract, "confirm_execution", verifierKp, [
      nativeToScVal(escrowId, { type: "string" }),
    ]);
  }

  async refund(consumerKp: Keypair, escrowId: string): Promise<void> {
    await submitAndPoll(this.server, this.contract, "refund", consumerKp, [
      Address.fromString(consumerKp.publicKey()).toScVal(),
      nativeToScVal(escrowId, { type: "string" }),
    ]);
  }

  async withdraw(providerKp: Keypair, escrowId: string): Promise<void> {
    await submitAndPoll(this.server, this.contract, "withdraw", providerKp, [
      Address.fromString(providerKp.publicKey()).toScVal(),
      nativeToScVal(escrowId, { type: "string" }),
    ]);
  }

  async getEscrow(escrowId: string): Promise<EscrowRecord> {
    const result = await this.server.simulateTransaction(
      TransactionBuilder.fromXdr(
        this.contract
          .call("get_escrow", nativeToScVal(escrowId, { type: "string" }))
          .toXDR(),
        Networks.PUBLIC
      ).build()
    );
    if (result.error) throw new Error(`get_escrow failed: ${result.error}`);
    const val = (result as any).result?.retval;
    if (!val) throw new Error("get_escrow returned no value");
    const raw = scValToNative(val);
    return {
      consumer: raw.consumer?.toString() ?? raw[0]?.toString(),
      provider: raw.provider?.toString() ?? raw[1]?.toString(),
      apiId: raw.api_id?.toString() ?? raw[2]?.toString(),
      amount: BigInt(raw.amount ?? raw[3] ?? 0),
      state: ((raw.state?.toString() ?? raw[4]?.toString()) as EscrowState),
      createdAt: Number(raw.created_at ?? raw[5] ?? 0),
    };
  }
}
