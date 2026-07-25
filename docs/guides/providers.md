# Provider Guide

## Overview

As a provider, you register LLM utility API endpoints on the marketplace. Consumers pay per call via escrow, and you withdraw after verified delivery. The platform charges a 2% fee on each withdrawal.

## Registering an API

You need a Stellar account on Futurenet with a small XLM balance for transaction fees.

1. Connect your Freighter wallet to the marketplace
2. Go to the **Provider Dashboard**
3. Click **Register API**
4. Provide:
   - **Endpoint URL**: the full URL of your API (e.g., `https://api.example.com/v1/tokenize`)
   - **Price per call**: cost in strokes (1 stroke = 0.00001 XLM)
   - **Metadata hash**: a content hash of your API schema
5. Sign the transaction — your wallet will prompt you

Your API is now listed and consumers can pay to use it.

## Managing Pricing

You can update your API price at any time:

1. Go to the API detail page
2. Click **Change Price**
3. Enter the new price and sign

The change takes effect immediately for new escrows. Existing escrows use the price at the time of payment.

## Pausing and Resuming

If your API needs maintenance:

1. Go to the API detail page
2. Click **Pause** or **Resume**
3. Sign the transaction

Paused APIs cannot receive new escrows but existing escrows remain valid.

## Withdrawing Payments

When a consumer pays and the verifier confirms successful execution, you can withdraw:

1. Go to **My Escrows**
2. Filter by `Confirmed` state
3. Click **Withdraw** on each escrow

The contract transfers the payment minus the 2% platform fee to your wallet.

## Fee Calculation

| Gross Payment | Platform Fee (2%) | Net Payout |
|--------------|-------------------|------------|
| 100 XLM      | 2 XLM             | 98 XLM     |
| 500 XLM      | 10 XLM            | 490 XLM    |
| 1,000 stroked | 20 strokes       | 980 strokes |

The fee is collected at withdrawal time. If the escrow is refunded, no fee is charged.
