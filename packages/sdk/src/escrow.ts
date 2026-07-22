export interface EscrowRecord {
  consumer: string;
  provider: string;
  apiId: string;
  amount: bigint;
  state: "Locked" | "Confirmed" | "Refunded" | "Withdrawn";
  createdAt: number;
}

export class EscrowClient {
  constructor(public contractId: string, public rpcUrl: string) {}

  async pay(consumer: string, provider: string, apiId: string, amount: bigint): Promise<string> {
    return "0x_mock_escrow_id";
  }

  async confirmExecution(escrowId: string): Promise<void> {
    // Verifier confirmation call
  }

  async refund(consumer: string, escrowId: string): Promise<void> {
    // Consumer refund call
  }

  async withdraw(provider: string, escrowId: string): Promise<void> {
    // Provider withdraw call
  }

  async getEscrow(escrowId: string): Promise<EscrowRecord> {
    return {
      consumer: "G...",
      provider: "G...",
      apiId: "0x0",
      amount: 100000n,
      state: "Locked",
      createdAt: Date.now(),
    };
  }
}
