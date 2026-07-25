import { Keypair } from "@stellar/stellar-sdk";
import { EscrowClient } from "./escrow.js";

export interface X402Challenge {
  endpoint: string;
  pricePerCall: string;
  recipient: string;
  expiresAt: number;
}

export interface X402PaymentResult {
  escrowId: string;
  paymentHeader: string;
}

export class X402Handler {
  constructor(
    public facilitatorUrl: string,
    public escrowClient: EscrowClient
  ) {}

  parseChallenge(response: Response): X402Challenge {
    if (response.status !== 402) {
      throw new Error("Expected HTTP 402 Payment Required");
    }
    const header = response.headers.get("Stellar-x402-Challenge");
    if (!header) {
      throw new Error("Missing Stellar-x402-Challenge header");
    }
    return JSON.parse(header) as X402Challenge;
  }

  async resolvePayment(
    consumerKp: Keypair,
    challenge: X402Challenge
  ): Promise<X402PaymentResult> {
    const escrowId = await this.escrowClient.pay(
      consumerKp,
      challenge.recipient,
      challenge.endpoint,
      BigInt(challenge.pricePerCall)
    );
    const paymentHeader = JSON.stringify({
      escrow_id: escrowId,
      consumer: consumerKp.publicKey(),
      endpoint: challenge.endpoint,
      timestamp: Date.now(),
    });
    return { escrowId, paymentHeader };
  }

  async handle402Response(
    consumerKp: Keypair,
    response: Response
  ): Promise<X402PaymentResult> {
    const challenge = this.parseChallenge(response);
    return this.resolvePayment(consumerKp, challenge);
  }
}
