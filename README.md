# AlphaProof AI

AlphaProof AI is a verifiable AI alpha agent for the Mantle Network. It watches Mantle-like smart-money and anomaly events, turns them into AI-explained signals, commits each signal on-chain before the outcome is known, sends a Telegram alert, and later resolves the outcome into an agent reputation score.

This is a practical hackathon MVP for the **AI Alpha & Data** track of The Turing Test Hackathon 2026 by Mantle. It is not a trading bot, does not custody funds, and does not provide financial advice.

## Why It Fits The Track

Most AI alpha demos stop at "the model said so." AlphaProof adds accountability:

```text
Mantle event
  -> detector
  -> AI reasoning
  -> signal
  -> SignalRegistry commit on Mantle
  -> Telegram alert
  -> outcome resolution
  -> reputation score
```

The core claim is simple: **AI can make predictions, but it should not be able to rewrite history after the result is known.**

## Architecture

```text
frontend/ Next.js dashboard
  - landing page
  - signal dashboard
  - signal detail pages
  - agent reputation page

backend/ Node.js + TypeScript API
  - demo Mantle-like event generator
  - signal detector
  - deterministic mock AI analyzer
  - Prisma + SQLite signal database
  - ethers chain client
  - Telegram alert bot

contracts/ Hardhat + Solidity
  - SignalRegistry.sol
  - commitSignal
  - resolveSignal
  - events and read methods
```

## Repository Layout

```text
.
  frontend/
    app/
    components/
    lib/
    package.json
  backend/
    src/
      agent/
      chain/
      db/
      telegram/
      api/
      index.ts
    prisma/
      schema.prisma
    package.json
  contracts/
    contracts/
      SignalRegistry.sol
    scripts/
      deploy.ts
    test/
      SignalRegistry.test.ts
    hardhat.config.ts
    package.json
  README.md
  .env.example
```

## Prerequisites

- Node.js 20+
- pnpm 9+
- A Mantle Sepolia RPC URL
- A funded Mantle Sepolia deployer key for real contract deployment
- Optional Telegram bot token and chat id

## Install

```bash
pnpm install
```

## Smart Contract

The contract is `contracts/contracts/SignalRegistry.sol`.

It supports:

- committing signals;
- resolving outcomes;
- reading signal data;
- reading total signal count;
- emitting `SignalCommitted` and `SignalResolved`.

Run tests:

```bash
pnpm --filter @alphaproof/contracts test
```

Deploy to Mantle Sepolia:

```bash
cp contracts/.env.example contracts/.env
```

Fill:

```bash
MANTLE_RPC_URL="https://rpc.sepolia.mantle.xyz"
PRIVATE_KEY="your_private_key"
```

Deploy:

```bash
pnpm --filter @alphaproof/contracts deploy
```

Copy the deployed `SignalRegistry` address into backend and frontend env files.

## Backend

Create env:

```bash
cp backend/.env.example backend/.env
```

For local demo mode, this is enough:

```bash
DATABASE_URL="file:./dev.db"
PORT=4000
AI_PROVIDER="mock"
```

For real Mantle commits, also set:

```bash
SIGNAL_REGISTRY_ADDRESS="0x..."
MANTLE_RPC_URL="https://rpc.sepolia.mantle.xyz"
AGENT_PRIVATE_KEY="your_private_key"
```

Optional Telegram:

```bash
TELEGRAM_BOT_TOKEN="..."
TELEGRAM_CHAT_ID="..."
```

Prepare SQLite:

```bash
pnpm --filter @alphaproof/backend db:generate
pnpm --filter @alphaproof/backend db:push
```

Run backend:

```bash
pnpm --filter @alphaproof/backend dev
```

API endpoints:

- `GET /api/signals`
- `GET /api/signals/:id`
- `GET /api/agent/stats`
- `POST /api/demo/create-signal`
- `POST /api/demo/resolve-pending`

If chain env variables are missing, the backend uses local mock proof hashes. This keeps the dashboard runnable during judging while preserving the real Mantle deployment path.

## Frontend

Create env:

```bash
cp frontend/.env.example frontend/.env.local
```

Set:

```bash
NEXT_PUBLIC_API_URL="http://localhost:4000"
NEXT_PUBLIC_MANTLE_EXPLORER_URL="https://explorer.testnet.mantle.xyz"
NEXT_PUBLIC_SIGNAL_REGISTRY_ADDRESS="0x..."
```

Run:

```bash
pnpm --filter @alphaproof/frontend dev
```

Open:

```text
http://localhost:3000
```

## Telegram Bot

Telegram is integrated into the backend process. When `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` are set:

- new signal alerts are sent automatically;
- `/start` introduces the bot;
- `/latest` returns the newest signal;
- `/reputation` returns current agent stats.

If Telegram env vars are missing, alerts are logged to the backend console.

## Demo Flow

1. Deploy `SignalRegistry` to Mantle Sepolia.
2. Add the contract address to `backend/.env` and `frontend/.env.local`.
3. Start the backend.
4. Start the frontend.
5. Open `/dashboard`.
6. Click **Create Demo Signal**.
7. See the signal committed on-chain or mocked locally if chain env is absent.
8. See the Telegram alert or console fallback.
9. Click **Resolve Pending Signals**.
10. See the signal outcome and agent reputation update.

## What The Demo Shows

- A Mantle-like event is detected.
- The AI layer writes a human-readable explanation.
- The backend hashes the reasoning and source data.
- The hashes are committed to `SignalRegistry`.
- A proof transaction is attached to the alert and dashboard.
- The result is resolved later.
- Reputation changes based on resolved outcomes.

## Current Limitations

- Demo events are generated locally instead of indexed in real time.
- The AI analyzer is deterministic mock logic by default.
- Outcome evaluation is mock/historical logic for demonstration.
- Only the original committing agent can resolve signals.
- The frontend does not require wallet connection.

## Future Improvements

- Replace demo events with Mantle DEX and wallet indexers.
- Add OpenAI-compatible analyzer provider.
- Store reasoning and source payloads on IPFS or another content-addressed layer.
- Add scheduled evaluators with real market/on-chain outcome criteria.
- Add multi-agent reputation and public leaderboards.
- Add contract-level role management for production resolvers.

## Safety Note

AlphaProof AI creates signals and risk alerts. It does not execute trades, custody user funds, or promise profit.
