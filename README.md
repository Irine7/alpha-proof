# AlphaProof AI

AlphaProof AI is a hackathon MVP for verifiable AI market signals on Mantle:

```text
market event
  -> detector
  -> AI explanation
  -> on-chain proof commit
  -> Neon PostgreSQL
  -> dashboard
  -> outcome
  -> proof-backed reputation
```

It is not a trading bot, does not custody funds, does not execute trades, and does not provide financial advice.

## Packages

```text
contracts/  Hardhat + Solidity SignalRegistry
backend/    Express + TypeScript + Prisma + Neon PostgreSQL
frontend/   Next.js dashboard
```

Telegram integration is planned for later. The current technical demo does not require Telegram.

## Env Safety

Never commit real `.env` files. This repo ignores `.env`, `.env.local`, `.env.*.local`, `backend/.env`, `frontend/.env.local`, and `contracts/.env`.

Use the checked-in `.env.example` files as placeholders only.

## Modes Overview

`CHAIN_MODE` controls where proof transactions are written:

- `local`: proof writes to a local Hardhat `SignalRegistry`.
- `testnet`: proof writes to Mantle Testnet.
- `mainnet`: production-later mode for Mantle Mainnet proof commits.
- `mock`: no contract transaction; local mock hashes only.

`MARKET_DATA_MODE` controls where market events come from:

- `demo`: generated Mantle-like market events.
- `historical_mainnet`: fixture-backed Mantle-mainnet-like events.
- `live_mainnet`: prepared stub for a future Mantle Mainnet reader.

Recommended combinations:

```env
# Local
CHAIN_MODE=local
MARKET_DATA_MODE=demo

# Testnet demo
CHAIN_MODE=testnet
MARKET_DATA_MODE=historical_mainnet

# Realistic hackathon mode
CHAIN_MODE=testnet
MARKET_DATA_MODE=historical_mainnet
# or MARKET_DATA_MODE=live_mainnet once the reader is implemented

# Production later
CHAIN_MODE=mainnet
MARKET_DATA_MODE=live_mainnet
```

## Why Testnet Proof Can Use Mainnet Market Data

Mantle Testnet is useful for proof contract transactions, explorer links, and repeatable judging demos. Real market activity, however, lives on Mantle Mainnet. AlphaProof separates these concerns intentionally:

- Market data can be demo, historical mainnet, or live mainnet.
- Proof commitments can be local, testnet, or mainnet.
- In hackathon mode, market events may come from Mantle Mainnet data while commitments are written to Mantle Testnet.

## Install

From the repo root:

```bash
pnpm install
```

## Neon PostgreSQL

The backend expects Neon/PostgreSQL, not SQLite.

Create `backend/.env` from `backend/.env.example` and set:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST.neon.tech/DB?sslmode=require"
PORT=4000
CHAIN_MODE="local"
MARKET_DATA_MODE="demo"
SIGNAL_REGISTRY_ADDRESS=""
MANTLE_LOCAL_RPC_URL="http://127.0.0.1:8545"
MANTLE_TESTNET_RPC_URL="https://rpc.testnet.mantle.xyz"
MANTLE_TESTNET_EXPLORER_URL="https://explorer.testnet.mantle.xyz"
MANTLE_MAINNET_RPC_URL=""
AGENT_PRIVATE_KEY=""
AI_PROVIDER="mock"
OPENAI_API_KEY=""
```

Validate Prisma:

```bash
cd backend
pnpm prisma validate
pnpm prisma generate
```

This project currently uses `prisma db push` rather than migrations. For a fresh hackathon/dev Neon database, apply the schema with:

```bash
pnpm prisma db push
```

Do not run destructive reset/drop/truncate commands against the real Neon database.

## Local Hardhat Proof Mode

Start a local chain:

```bash
cd contracts
pnpm hardhat node
```

In a second terminal, deploy:

```bash
cd contracts
pnpm deploy:local
```

The deploy script saves the address to:

```text
contracts/deployments/localhost.json
```

It does not overwrite `backend/.env`. Copy the printed address manually.

Backend local config:

```env
CHAIN_MODE="local"
MARKET_DATA_MODE="demo"
SIGNAL_REGISTRY_ADDRESS="0xLOCAL_DEPLOYED_SIGNAL_REGISTRY"
MANTLE_LOCAL_RPC_URL="http://127.0.0.1:8545"
AGENT_PRIVATE_KEY="LOCAL_HARDHAT_ACCOUNT_PRIVATE_KEY"
```

Run:

```bash
cd backend
pnpm dev
```

Local Hardhat state is ephemeral. If you restart the Hardhat node, deploy `SignalRegistry` again.

## Mantle Testnet Proof Mode

Mantle Testnet config:

```text
Network Name: Mantle Testnet
RPC URL: https://rpc.testnet.mantle.xyz
Chain ID: 5001
Currency Symbol: BIT
Block Explorer URL: https://explorer.testnet.mantle.xyz
```

Create `contracts/.env` from `contracts/.env.example`:

```env
MANTLE_TESTNET_RPC_URL="https://rpc.testnet.mantle.xyz"
MANTLE_TESTNET_EXPLORER_URL="https://explorer.testnet.mantle.xyz"
PRIVATE_KEY="DEPLOYER_PRIVATE_KEY"
```

Deploy:

```bash
cd contracts
pnpm deploy
```

The deployment artifact is saved to:

```text
contracts/deployments/mantle-testnet.json
```

Copy `signalRegistry` from that artifact into `backend/.env` as `SIGNAL_REGISTRY_ADDRESS`.

## How To Run Backend Against Mantle Testnet

```env
CHAIN_MODE="testnet"
MARKET_DATA_MODE="historical_mainnet"
SIGNAL_REGISTRY_ADDRESS="0xMANTLE_TESTNET_SIGNAL_REGISTRY"
MANTLE_TESTNET_RPC_URL="https://rpc.testnet.mantle.xyz"
MANTLE_TESTNET_EXPLORER_URL="https://explorer.testnet.mantle.xyz"
MANTLE_MAINNET_RPC_URL=""
AGENT_PRIVATE_KEY="TESTNET_AGENT_PRIVATE_KEY"
```

Then:

```bash
cd backend
pnpm dev
```

If `CHAIN_MODE=testnet` is selected and required env is missing, the backend returns a clear error instead of creating a fake transaction.

## Frontend

Create `frontend/.env.local` from `frontend/.env.example`:

```env
NEXT_PUBLIC_API_URL="http://localhost:4000"
```

Run:

```bash
cd frontend
pnpm dev
```

Open:

```text
http://localhost:3000/dashboard
```

The dashboard shows proof network and market data source separately. Demo-generated data is labelled as demo-generated, not live.

## How To Create A Proof Signal

With a proof network, backend, and frontend running:

```bash
curl -X POST http://localhost:4000/api/demo/create-signal
curl http://localhost:4000/api/signals
curl -X POST http://localhost:4000/api/demo/resolve-pending
curl http://localhost:4000/api/agent/stats
```

`POST /api/demo/create-signal` creates a pending signal and commits the proof before the outcome is known. `POST /api/demo/resolve-pending` resolves pending signals and updates reputation.

## How To Verify Tx In Explorer

For `CHAIN_MODE=testnet`, open:

```text
https://explorer.testnet.mantle.xyz/tx/<commitTxHash>
```

The signal detail page also shows:

- Signal ID
- Proof tx hash
- Contract address
- Committed block/time when available
- Resolve tx hash when resolved
- Outcome and evaluation time
- Source event fields and raw event JSON

For `CHAIN_MODE=local`, explorer links are disabled and the UI labels the proof network as local Hardhat.

## Market Data Modes

The backend market data architecture lives in:

```text
backend/src/market/dataSource.ts
backend/src/market/demoDataSource.ts
backend/src/market/historicalMainnetDataSource.ts
backend/src/market/liveMainnetDataSource.ts
```

Each source implements:

```ts
getNextMarketEvent(): Promise<MarketEvent>
```

Signal types currently generated by demo/historical sources:

- Whale Accumulation
- Liquidity Shock
- Smart Wallet Activity
- Volume Spike
- Exit Risk

## Contracts

Compile and test:

```bash
cd contracts
pnpm hardhat compile
pnpm hardhat test
```

`SignalRegistry` supports `commitSignal`, `resolveSignal`, `getSignal`, `getSignalsCount`, `SignalCommitted`, and `SignalResolved`.

## Telegram Planned Later

Telegram bot wiring is intentionally out of scope for this task. The current flow is API + dashboard only.

## Remaining Live Mainnet Work

`MARKET_DATA_MODE=live_mainnet` currently validates that `MANTLE_MAINNET_RPC_URL` exists, then returns a clear placeholder error. Production live mode still needs:

- Mantle Mainnet contract/event reader
- Protocol adapters for target DEX/lending pools
- Backfill and cursor persistence
- Reorg handling
- Rate limiting and RPC failover
