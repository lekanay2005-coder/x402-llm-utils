# Consumer Guide

## Overview

As a consumer, you use the x402 LLM-Utility Marketplace to pay for LLM utility APIs on a per-call basis. Payment is escrowed before each call and released only after verified delivery.

## Setup

1. Install the [Freighter wallet](https://freighter.app/) browser extension
2. Create or import a Stellar account on Futurenet
3. Fund your account (Futurenet friendbot: https://friendbot-futurenet.stellar.org)
4. Navigate to the marketplace web app

## Browsing APIs

1. Go to the **Browse APIs** page
2. Each card shows the endpoint, provider, and price per call
3. Click **View** to see full details
4. APIs can be active or paused — only active APIs accept new escrows

## Making a Payment

1. On an API detail page, enter the input payload you want to send
2. Click **Execute** — this triggers the x402 flow:
   - Your wallet requests approval to lock the payment amount
   - The amount moves into the escrow contract
   - The provider receives your request with a payment proof header
3. Wait for the response — the verifier confirms delivery
4. On success: the provider withdraws (minus 2% fee)
5. On failure or timeout: you can refund

## Refunds

While an escrow is in `Locked` state (before confirmation), you can refund at any time:

1. Go to **My Escrows**
2. Find the escrow with `Locked` state
3. Click **Refund**
4. Funds return to your wallet immediately

A refund is only possible in the `Locked` state. Once the verifier calls `confirm_execution`, the funds are committed to the provider.

## Checking History

The **Escrows** page shows every payment you've made:
- Escrow ID (for reference)
- Provider
- Amount
- Current state (Locked, Confirmed, Refunded, Withdrawn)

All data is indexed from on-chain events and stored in PostgreSQL for fast querying.
