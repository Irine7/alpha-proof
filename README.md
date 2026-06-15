# AlphaProof

AlphaProof is a hackathon MVP for verifiable AI market signals on Mantle.

The project turns Mantle market events into AI-generated signals, commits the signal hashes to an on-chain `SignalRegistry` before the outcome is known, stores full context in PostgreSQL, sends Telegram alerts, and then resolves outcomes into an auditable agent reputation score.

> AlphaProof is not a trading bot. It does not custody funds, does not execute trades, and does not provide financial advice.

## Contents

- [What AlphaProof Solves](#what-alphaproof-solves)
- [What Judges Should Look At](#what-judges-should-look-at)
- [Repository Structure](#repository-structure)
- [Technology Stack](#technology-stack)
- [Application Architecture](#application-architecture)
- [Signal Lifecycle](#signal-lifecycle)
- [Data And Proof Model](#data-and-proof-model)
- [Smart Contract](#smart-contract)
- [Runtime Modes](#runtime-modes)
- [Environment Files](#environment-files)
- [Quick Start: Mock Proof Mode](#quick-start-mock-proof-mode)
- [Local On-Chain Mode](#local-on-chain-mode)
- [Mantle Sepolia Demo Mode](#mantle-sepolia-demo-mode)
- [Telegram Alerts](#telegram-alerts)
- [Frontend Pages](#frontend-pages)
- [Backend API](#backend-api)
- [Useful Scripts](#useful-scripts)
- [Demo Script For Judges](#demo-script-for-judges)
- [Verification And Tests](#verification-and-tests)
- [Troubleshooting](#troubleshooting)
- [Safety Notes](#safety-notes)

## What AlphaProof Solves

Most AI trading or market-analysis demos are easy to fake after the fact: a model can claim it predicted an event only after the market already moved. AlphaProof solves that accountability problem.

The core idea:

1. A market event is detected.
2. The AI agent creates a prediction with confidence, reasoning, and an evaluation window.
3. AlphaProof hashes both the source data and the reasoning.
4. The hashes are committed to `SignalRegistry` on the configured proof network before the outcome is known.
5. The full context is stored in PostgreSQL for dashboard verification.
6. Telegram subscribers receive a proof-backed alert.
7. Later, the signal is resolved as `Correct`, `Failed`, or `Inconclusive`.
8. Agent reputation is calculated only from proof-backed records.

This makes the agent auditable: the timestamp, prediction, confidence, data hash, and reasoning hash are locked before resolution.

## What Judges Should Look At

Recommended judging path:

1. Open the dashboard: `http://localhost:3000/dashboard`
2. Check the runtime panel:
   - proof network
   - chain ID
   - contract address
   - market data source
   - latest proof transaction
3. Create a signal from the dashboard or with `pnpm telegram:demo-flow`.
4. Open the Mantle Sepolia explorer transaction from the UI or Telegram.
5. Open a signal detail page: `/signals/<id>`.
6. Verify:
   - source event
   - AI reasoning
   - `dataHash`
   - `reasoningHash`
   - contract signal ID
   - commit transaction
   - resolve transaction, if resolved
7. Open reputation: `http://localhost:3000/reputation`
8. Resolve a signal and confirm reputation changes.

## Repository Structure

```text
alpha-proof/
  package.json                 pnpm workspace scripts
  pnpm-workspace.yaml          workspace package list
  .env.example                 shared Telegram-oriented reference example

  frontend/
    app/                       Next.js App Router pages
    components/                dashboard, signal, Telegram, stats UI
    lib/                       API client, types, formatting, proof helpers
    public/assets/             project images
    .env.example               frontend environment example

  backend/
    src/
      api/                     Express API server
      agent/                   signal orchestration, detectors, AI analyzer
      chain/                   ethers client for SignalRegistry
      db/                      Prisma-backed signal and stats queries
      market/                  demo, historical fixture, live reader sources
      telegram/                bot, commands, subscriptions, notifications
      utils/                   hashing helpers
      config.ts                runtime env parsing and validation
    prisma/schema.prisma       PostgreSQL schema
    scripts/                   smoke tests, demo flow, Telegram utilities
    .env.example               backend environment example

  contracts/
    contracts/SignalRegistry.sol
    scripts/deploy.ts
    scripts/read-signal.ts
    test/SignalRegistry.test.ts
    deployments/               saved deployment artifacts
    .env.example               Hardhat environment example
```

## Technology Stack

| Layer | Tech | Purpose |
| --- | --- | --- |
| Frontend | Next.js 16, React 19, Tailwind CSS | Dashboard, proof pages, reputation UI |
| Backend | Node.js 20, Express, TypeScript | API, agent orchestration, Telegram flow |
| Database | PostgreSQL, Prisma | Signal context, proof metadata, subscribers |
| Blockchain | Solidity, Hardhat, ethers v6 | `SignalRegistry` commit and resolve proof |
| Network | Mantle Sepolia Testnet by default | Public proof transactions for demo |
| Alerts | Telegram Bot API via Telegraf | Subscriber alerts and command interface |
| Package manager | pnpm 9 | Monorepo dependency and script management |

## Application Architecture

```mermaid
flowchart LR
  subgraph "Market Data Sources"
    A1["Demo generator"]
    A2["Historical Mantle mainnet fixture"]
    A3["Live Mantle mainnet Transfer reader"]
  end

  subgraph "Backend"
    B1["MarketDataSource selector"]
    B2["Signal detector"]
    B3["AI analyzer or mock analyzer"]
    B4["Hash builder: dataHash + reasoningHash"]
    B5["Chain client"]
    B6["Prisma repository"]
    B7["Telegram notifier"]
    B8["Express API"]
  end

  subgraph "Proof Network"
    C1["SignalRegistry contract"]
    C2["Commit tx"]
    C3["Resolve tx"]
  end

  subgraph "Storage And UI"
    D1["PostgreSQL / Neon"]
    D2["Next.js dashboard"]
    D3["Signal detail page"]
    D4["Reputation page"]
    D5["Telegram subscribers"]
  end

  A1 --> B1
  A2 --> B1
  A3 --> B1
  B1 --> B2 --> B3 --> B4 --> B5
  B5 --> C1
  C1 --> C2
  C1 --> C3
  B5 --> B6
  B6 --> D1
  B6 --> B7 --> D5
  D1 --> B8
  B8 --> D2
  B8 --> D3
  B8 --> D4
```

## Signal Lifecycle

```mermaid
sequenceDiagram
  autonumber
  participant Source as "Market source"
  participant Agent as "AlphaProof agent"
  participant Chain as "SignalRegistry"
  participant DB as "PostgreSQL"
  participant TG as "Telegram"
  participant UI as "Dashboard"

  Source->>Agent: Market event
  Agent->>Agent: Detect signal type and prediction
  Agent->>Agent: Generate confidence and reasoning
  Agent->>Agent: Build dataHash and reasoningHash
  Agent->>Chain: commitSignal(...)
  Chain-->>Agent: SignalCommitted(signalId, txHash)
  Agent->>DB: Save full signal context and proof metadata
  Agent->>TG: Send proof-backed alert
  UI->>DB: Read latest signals and stats through API
  Agent->>Chain: resolveSignal(signalId, outcome)
  Chain-->>Agent: SignalResolved(signalId, outcome)
  Agent->>DB: Save outcome and resolve tx
  Agent->>TG: Send outcome update
  UI->>DB: Reputation updates from resolved proof records
```

## Data And Proof Model

AlphaProof intentionally separates:

- Market source network: where the observed market event came from.
- Proof network: where the prediction commitment is written.

For the hackathon demo, this usually means:

- Read historical Mantle mainnet-style events from `backend/src/market/mantle-mainnet.fixture.json`.
- Commit proof transactions to Mantle Sepolia Testnet.

This lets judges inspect realistic Mantle event context and real proof transactions without implying live financial advice or trade execution.

### Signal Record

The main database model is `Signal` in `backend/prisma/schema.prisma`.

Important fields:

| Field | Meaning |
| --- | --- |
| `id` | Internal database signal ID |
| `chainSignalId` | ID emitted by `SignalRegistry` |
| `signalType` | Human-readable signal classification |
| `asset`, `counterAsset` | Asset pair or tracked asset |
| `confidence` | AI confidence, 0-100 |
| `prediction` | `-1`, `0`, or `1` |
| `aiSummary`, `reasoning` | Human-readable explanation |
| `dataHash` | Hash of the source event payload |
| `reasoningHash` | Hash of the AI reasoning |
| `commitTxHash` | On-chain commit transaction |
| `resolveTxHash` | On-chain resolve transaction |
| `status` | `Pending` or `Resolved` |
| `outcome` | `Unknown`, `Correct`, `Failed`, `Inconclusive` |
| `proofNetworkKey` | `<chainMode>:<chainId>:<contractAddress>` |

### Telegram Models

The database also stores:

- `TelegramSubscriber`: chat ID, username, active state, alert preferences.
- `TelegramConnectCode`: one-time dashboard-to-Telegram connection codes.

## Smart Contract

Contract: `contracts/contracts/SignalRegistry.sol`

The contract stores the minimal public proof payload:

```solidity
struct Signal {
    uint256 id;
    address agent;
    string signalType;
    string asset;
    bytes32 reasoningHash;
    bytes32 dataHash;
    uint8 confidence;
    int8 prediction;
    uint256 createdAt;
    uint256 evaluationTime;
    SignalStatus status;
    Outcome outcome;
}
```

Main functions:

| Function | Purpose |
| --- | --- |
| `commitSignal(...)` | Commits signal metadata and hashes before evaluation |
| `resolveSignal(signalId, outcome)` | Resolves a signal as correct, failed, or inconclusive |
| `getSignal(signalId)` | Reads a committed signal |
| `getSignalsCount()` | Reads total committed signals |

Important contract rules:

- `confidence` must be `0..100`.
- `prediction` must be `-1`, `0`, or `1`.
- Only the original committing agent can resolve its signal.
- A signal can be resolved only once.
- `Outcome.Unknown` is not allowed as a resolution.

## Runtime Modes

AlphaProof has two independent runtime dimensions.

### Proof Network: `CHAIN_MODE`

| Mode | Meaning | Typical use |
| --- | --- | --- |
| `mock` | No chain write; backend creates mock tx hashes | Fast UI/dev demo |
| `local` | Writes to local Hardhat node | Local smart contract proof |
| `testnet` | Writes to Mantle Sepolia Testnet | Main hackathon demo |
| `mainnet` / `real` | Prepared for Mantle Mainnet | Future production mode |

`CHAIN_MODE=testnet` validates Mantle Sepolia chain ID `5003`. If required env vars are missing, the backend fails loudly instead of silently falling back to fake proof transactions.

### Market Source: `MARKET_DATA_MODE`

| Mode | Meaning |
| --- | --- |
| `demo` | Synthetic but realistic demo events |
| `historical_mainnet` | Curated Mantle mainnet-style fixture events |
| `live_mainnet` | Minimal live Mantle Mainnet ERC-20 Transfer reader |

The recommended demo mode is:

```env
CHAIN_MODE="testnet"
MARKET_DATA_MODE="historical_mainnet"
```

## Environment Files

Each package reads environment variables from its own working directory.

Create these files:

```text
backend/.env
frontend/.env.local
contracts/.env
```

PowerShell copy commands:

```powershell
Copy-Item backend\.env.example backend\.env
Copy-Item frontend\.env.example frontend\.env.local
Copy-Item contracts\.env.example contracts\.env
```

### `backend/.env`: Full Annotated Example

```env
# Required. PostgreSQL connection string.
# Neon example:
# DATABASE_URL="postgresql://USER:PASSWORD@HOST.neon.tech/DB?sslmode=require"
# Local PostgreSQL example:
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/alphaproof"
DATABASE_URL="postgresql://USER:PASSWORD@HOST.neon.tech/DB?sslmode=require"

# Backend port.
PORT=4000

# Proof network: mock | local | testnet | mainnet | real
# Use mock for fastest setup.
# Use local for Hardhat.
# Use testnet for the hackathon Mantle Sepolia demo.
CHAIN_MODE="testnet"

# Market source: demo | historical_mainnet | live_mainnet
MARKET_DATA_MODE="historical_mainnet"

# Address of deployed SignalRegistry for local/testnet/mainnet modes.
SIGNAL_REGISTRY_ADDRESS="0xYOUR_DEPLOYED_SIGNAL_REGISTRY"

# Local Hardhat RPC. Used with CHAIN_MODE=local.
MANTLE_LOCAL_RPC_URL="http://127.0.0.1:8545"

# Mantle Sepolia Testnet. Used with CHAIN_MODE=testnet.
MANTLE_TESTNET_RPC_URL="https://rpc.sepolia.mantle.xyz"
MANTLE_TESTNET_EXPLORER_URL="https://explorer.sepolia.mantle.xyz"
EXPECTED_CHAIN_ID=5003

# Mantle Mainnet reader/proof settings.
# Mainnet proof is not the recommended hackathon demo path.
MANTLE_MAINNET_RPC_URL="https://rpc.mantle.xyz"
MANTLE_MAINNET_EXPLORER_URL="https://explorer.mantle.xyz"

# Live reader options for MARKET_DATA_MODE=live_mainnet.
# TRACKED_TOKEN_ADDRESSES is comma-separated.
LIVE_SCAN_BLOCK_WINDOW=100
LIVE_TRANSFER_THRESHOLD_UNITS="100000"
TRACKED_TOKEN_ADDRESSES=""

# Private key used by the backend agent to commit/resolve signals.
# For testnet, fund this wallet with Mantle Sepolia MNT.
# Do not commit real secrets.
AGENT_PRIVATE_KEY="0xYOUR_AGENT_PRIVATE_KEY"

# Telegram alert layer.
TELEGRAM_ENABLED=true
TELEGRAM_MODE=polling
TELEGRAM_BOT_TOKEN="123456:YOUR_TELEGRAM_BOT_TOKEN"
TELEGRAM_BOT_USERNAME="your_bot_username"
TELEGRAM_CHAT_ID=""
TELEGRAM_ADMIN_ALERTS=false
TELEGRAM_ALERTS_ON_CREATE=true
TELEGRAM_ALERTS_ON_RESOLVE=true
TELEGRAM_ALERTS_FOR_BULK=false
TELEGRAM_ALLOW_DEMO_COMMAND=false
TELEGRAM_ALLOWED_DEMO_CHAT_IDS=
TELEGRAM_WEBHOOK_URL=
TELEGRAM_WEBHOOK_SECRET=
TELEGRAM_WEBHOOK_PATH=/api/telegram/webhook

# Public frontend URL used in Telegram inline buttons.
# Local development:
PUBLIC_APP_URL=http://localhost:3000
# Deployed demo:
# PUBLIC_APP_URL=https://your-public-frontend-url

# AI provider switch. Current MVP uses the mock analyzer by default.
AI_PROVIDER="mock"
OPENAI_API_KEY=""
```

### `backend/.env`: Minimal Mock Mode

Use this when judges or reviewers only need the app running quickly and do not need real on-chain transactions.

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST.neon.tech/DB?sslmode=require"
PORT=4000
CHAIN_MODE="mock"
MARKET_DATA_MODE="historical_mainnet"
TELEGRAM_ENABLED=false
PUBLIC_APP_URL=http://localhost:3000
AI_PROVIDER="mock"
```

### `backend/.env`: Local Hardhat Mode

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST.neon.tech/DB?sslmode=require"
PORT=4000
CHAIN_MODE="local"
MARKET_DATA_MODE="historical_mainnet"
SIGNAL_REGISTRY_ADDRESS="0xLOCAL_DEPLOYED_SIGNAL_REGISTRY"
MANTLE_LOCAL_RPC_URL="http://127.0.0.1:8545"
AGENT_PRIVATE_KEY="0xLOCAL_HARDHAT_PRIVATE_KEY"
TELEGRAM_ENABLED=false
PUBLIC_APP_URL=http://localhost:3000
AI_PROVIDER="mock"
```

### `backend/.env`: Mantle Sepolia Demo Mode

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST.neon.tech/DB?sslmode=require"
PORT=4000
CHAIN_MODE="testnet"
MARKET_DATA_MODE="historical_mainnet"
SIGNAL_REGISTRY_ADDRESS="0xDEPLOYED_SIGNAL_REGISTRY"
MANTLE_TESTNET_RPC_URL="https://rpc.sepolia.mantle.xyz"
MANTLE_TESTNET_EXPLORER_URL="https://explorer.sepolia.mantle.xyz"
EXPECTED_CHAIN_ID=5003
AGENT_PRIVATE_KEY="0xTESTNET_AGENT_PRIVATE_KEY"
TELEGRAM_ENABLED=true
TELEGRAM_MODE=polling
TELEGRAM_BOT_TOKEN="123456:YOUR_TELEGRAM_BOT_TOKEN"
TELEGRAM_BOT_USERNAME="your_bot_username"
TELEGRAM_CHAT_ID=""
TELEGRAM_ADMIN_ALERTS=false
TELEGRAM_ALERTS_ON_CREATE=true
TELEGRAM_ALERTS_ON_RESOLVE=true
TELEGRAM_ALERTS_FOR_BULK=false
PUBLIC_APP_URL=http://localhost:3000
AI_PROVIDER="mock"
OPENAI_API_KEY=""
```

### `frontend/.env.local`

```env
# Backend API base URL.
NEXT_PUBLIC_API_URL="http://localhost:4000"

# Used by the frontend Telegram connect UI.
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME="your_bot_username"
```

For a deployed frontend:

```env
NEXT_PUBLIC_API_URL="https://your-backend-domain.com"
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME="your_bot_username"
```

### `contracts/.env`

```env
# Mantle Sepolia Testnet.
MANTLE_TESTNET_RPC_URL="https://rpc.sepolia.mantle.xyz"
MANTLE_TESTNET_EXPLORER_URL="https://explorer.sepolia.mantle.xyz"

# Deployer private key for Hardhat deploy scripts.
# For Mantle Sepolia, fund this wallet with testnet MNT.
PRIVATE_KEY="0xYOUR_DEPLOYER_PRIVATE_KEY"
```

## Quick Start: Mock Proof Mode

This is the fastest way to run the full UI and backend without deploying a contract or spending testnet gas.

Requirements:

- Node.js `>=20`
- pnpm `>=9`
- PostgreSQL database URL, for example Neon

Install dependencies:

```powershell
pnpm install
```

Create env files:

```powershell
Copy-Item backend\.env.example backend\.env
Copy-Item frontend\.env.example frontend\.env.local
```

Edit `backend/.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST.neon.tech/DB?sslmode=require"
PORT=4000
CHAIN_MODE="mock"
MARKET_DATA_MODE="historical_mainnet"
TELEGRAM_ENABLED=false
PUBLIC_APP_URL=http://localhost:3000
AI_PROVIDER="mock"
```

Prepare the database:

```powershell
pnpm --filter @alphaproof/backend db:generate
pnpm backend:db
```

Start backend and frontend together:

```powershell
pnpm dev
```

Open:

```text
http://localhost:3000/dashboard
```

Create a signal from the dashboard or from a new terminal:

```powershell
pnpm --filter @alphaproof/backend proof:create
```

In mock mode the UI works, database records are real, but proof transactions are mock hashes.

## Local On-Chain Mode

Use this when you want real contract calls without Mantle Sepolia.

Terminal 1: start local Hardhat node:

```powershell
cd contracts
pnpm hardhat node
```

Terminal 2: deploy `SignalRegistry` locally:

```powershell
cd contracts
pnpm deploy:local
```

Copy the deployed contract address into `backend/.env`:

```env
CHAIN_MODE="local"
MARKET_DATA_MODE="historical_mainnet"
SIGNAL_REGISTRY_ADDRESS="0xLOCAL_DEPLOYED_SIGNAL_REGISTRY"
MANTLE_LOCAL_RPC_URL="http://127.0.0.1:8545"
AGENT_PRIVATE_KEY="0xLOCAL_HARDHAT_PRIVATE_KEY"
```

Prepare database and run services:

```powershell
pnpm backend:db
pnpm dev
```

Open:

```text
http://localhost:3000/dashboard
```

Notes:

- Local explorer links are disabled in the UI.
- Transactions are real Hardhat transactions.
- Use a private key printed by `pnpm hardhat node`.

## Mantle Sepolia Demo Mode

This is the recommended final hackathon demo mode.

Mantle Sepolia parameters:

```text
Network name: Mantle Sepolia Testnet
RPC URL:      https://rpc.sepolia.mantle.xyz
Chain ID:     5003
Currency:     MNT
Explorer:     https://explorer.sepolia.mantle.xyz
```

Explorer URL patterns:

```text
Transaction: https://explorer.sepolia.mantle.xyz/tx/<txHash>
Address:     https://explorer.sepolia.mantle.xyz/address/<address>
```

### 1. Configure contracts

Create `contracts/.env`:

```env
MANTLE_TESTNET_RPC_URL="https://rpc.sepolia.mantle.xyz"
MANTLE_TESTNET_EXPLORER_URL="https://explorer.sepolia.mantle.xyz"
PRIVATE_KEY="0xYOUR_DEPLOYER_PRIVATE_KEY"
```

Deploy:

```powershell
cd contracts
pnpm deploy
```

Deployment artifact:

```text
contracts/deployments/mantle-sepolia.json
```

Expected shape:

```json
{
  "network": "mantle-sepolia",
  "chainId": 5003,
  "signalRegistry": "0x...",
  "deployedAt": "...",
  "explorerUrl": "https://explorer.sepolia.mantle.xyz/address/0x..."
}
```

### 2. Configure backend

Create `backend/.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST.neon.tech/DB?sslmode=require"
PORT=4000
CHAIN_MODE="testnet"
MARKET_DATA_MODE="historical_mainnet"
SIGNAL_REGISTRY_ADDRESS="0xDEPLOYED_SIGNAL_REGISTRY"
MANTLE_TESTNET_RPC_URL="https://rpc.sepolia.mantle.xyz"
MANTLE_TESTNET_EXPLORER_URL="https://explorer.sepolia.mantle.xyz"
EXPECTED_CHAIN_ID=5003
AGENT_PRIVATE_KEY="0xTESTNET_AGENT_PRIVATE_KEY"
TELEGRAM_ENABLED=false
PUBLIC_APP_URL=http://localhost:3000
AI_PROVIDER="mock"
```

The `AGENT_PRIVATE_KEY` wallet must have Mantle Sepolia testnet MNT.

### 3. Configure frontend

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL="http://localhost:4000"
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME="your_bot_username"
```

### 4. Prepare DB

From repository root:

```powershell
pnpm install
pnpm --filter @alphaproof/backend db:generate
pnpm backend:db
```

### 5. Start app

```powershell
pnpm dev
```

Open:

```text
http://localhost:3000/dashboard
```

### 6. Run testnet smoke proof

```powershell
pnpm proof:smoke:testnet
```

This script checks:

- RPC chain ID is `5003`
- contract is configured
- one proof signal can be created
- `chainSignalId` is returned
- `commitTxHash` exists
- explorer URL is generated
- record is persisted in PostgreSQL

Create and resolve in one smoke run:

```powershell
$env:RESOLVE_AFTER_CREATE="true"
pnpm proof:smoke:testnet
Remove-Item Env:\RESOLVE_AFTER_CREATE
```

Create one pending signal for a dashboard demo:

```powershell
pnpm proof:create-pending:testnet
```

## Telegram Alerts

Telegram is an alert and distribution layer. It does not trade, custody funds, or connect wallets.

### Capabilities

- Dashboard connect button creates a one-time code.
- User opens a deep link: `https://t.me/<bot_username>?start=<connect_code>`.
- Bot links the Telegram chat to the dashboard code.
- User receives proof-backed signal alerts.
- User can configure alert preferences.
- Manual lookup commands can fetch latest, pending, reputation, or a specific signal.

### Telegram Setup

1. Create a bot with BotFather.
2. Put token and username into `backend/.env`.
3. Enable Telegram:

```env
TELEGRAM_ENABLED=true
TELEGRAM_MODE=polling
TELEGRAM_BOT_TOKEN="123456:YOUR_TELEGRAM_BOT_TOKEN"
TELEGRAM_BOT_USERNAME="your_bot_username"
TELEGRAM_CHAT_ID=""
TELEGRAM_ADMIN_ALERTS=false
PUBLIC_APP_URL=http://localhost:3000
TELEGRAM_ALERTS_ON_CREATE=true
TELEGRAM_ALERTS_ON_RESOLVE=true
TELEGRAM_ALERTS_FOR_BULK=false
```

For public demo videos, use a public HTTPS frontend URL:

```env
PUBLIC_APP_URL="https://your-public-frontend-url"
```

Telegram inline keyboard buttons do not work well with `localhost`, so public URLs are recommended for final judging videos.

### Telegram Polling Mode

Use this for local development:

```env
TELEGRAM_MODE=polling
```

Start backend:

```powershell
cd backend
pnpm dev
```

Test alert scripts:

```powershell
pnpm telegram:test
pnpm telegram:test:reputation
pnpm telegram:test-subscription
pnpm telegram:test-delivery-rules
```

### Telegram Webhook Mode

Use this for deployed backends:

```env
TELEGRAM_MODE=webhook
TELEGRAM_WEBHOOK_URL=https://your-api-domain.com/api/telegram/webhook
TELEGRAM_WEBHOOK_SECRET="random-secret"
TELEGRAM_WEBHOOK_PATH=/api/telegram/webhook
```

Webhook commands:

```powershell
pnpm telegram:webhook-config-check
pnpm telegram:set-webhook
pnpm telegram:webhook-info
pnpm telegram:delete-webhook
```

The backend validates `X-Telegram-Bot-Api-Secret-Token` when `TELEGRAM_WEBHOOK_SECRET` is configured.

### Telegram Commands

Supported commands:

```text
/start
/latest
/pending
/reputation
/signal <id>
/signal contract:<id>
/subscribe
/unsubscribe
/disconnect
/alerts on
/alerts off
/alerts status
/status
/settings
/minconfidence 70
/minconfidence off
/types all
/types Whale Accumulation,Liquidity Shock
/help
```

Register bot command menu:

```powershell
pnpm telegram:set-commands
pnpm telegram:get-commands
pnpm telegram:delete-commands
```

### Telegram Connect Flow

```mermaid
sequenceDiagram
  autonumber
  participant User as "User"
  participant Web as "Next.js dashboard"
  participant API as "Backend API"
  participant Bot as "Telegram bot"
  participant DB as "PostgreSQL"

  User->>Web: Click "Connect Telegram Alerts"
  Web->>API: POST /api/telegram/connect-code
  API->>DB: Create one-time code
  API-->>Web: botUrl with start code
  Web-->>User: Open Telegram deep link
  User->>Bot: /start <connect_code>
  Bot->>DB: Mark code as used and create subscriber
  Web->>API: Poll connect-code status
  API-->>Web: connected=true and subscriber preferences
  User->>Web: Send test alert
  Web->>API: POST /test-alert
  API->>Bot: Send connection test message
```

## Frontend Pages

| Route | Purpose |
| --- | --- |
| `/` | Landing page with latest proof signal and project overview |
| `/dashboard` | Main operations console, runtime status, stats, signal list, demo controls |
| `/dashboard?records=all` | Shows non-proof-ready and legacy records too |
| `/dashboard?network=all` | Shows records across proof networks |
| `/signals/<id>` | Full verification page for one signal |
| `/reputation` | Agent reputation, outcome distribution, signal type performance |
| `/agent` | Redirects to `/reputation` |
| `/how-it-works` | Visual explanation of the workflow |

## Backend API

Base URL in local development:

```text
http://localhost:4000
```

### Health

```http
GET /health
```

Returns:

```json
{
  "ok": true,
  "service": "alphaproof-backend"
}
```

### Runtime Status

```http
GET /api/runtime
```

Returns chain mode, proof network, market source, contract address, chain ID, explorer URLs, last source event, and latest proof tx.

### Signals

```http
GET /api/signals
GET /api/signals?records=all
GET /api/signals?network=all
GET /api/signals?records=all&network=all
GET /api/signals/:id
```

Default behavior:

- proof-ready records only
- current proof network only

### Agent Stats

```http
GET /api/agent/stats
GET /api/agent/stats?records=all
GET /api/agent/stats?network=all
```

Returns:

- total signals
- resolved signals
- pending signals
- correct / failed / inconclusive counts
- accuracy
- average confidence
- signal type performance
- latest resolved signals

### Demo Controls

```http
POST /api/demo/create-signal
POST /api/demo/resolve-pending
```

`create-signal` accepts an optional body:

```json
{
  "kind": "large_swap"
}
```

Supported event kinds:

```text
large_swap
repeated_buys
liquidity_removal
tracked_wallet_action
volume_spike
exit_risk
whale_transfer
```

### Telegram Connect API

```http
POST /api/telegram/connect-code
GET /api/telegram/connect-code/:code/status
POST /api/telegram/connect-code/:code/test-alert
POST /api/telegram/connect-code/:code/disconnect
GET /api/telegram/subscription/status?chatId=<chatId>
POST /api/telegram/webhook
```

Test alerts are rate-limited to one alert per connected chat/code every 30 seconds.

## Useful Scripts

Run from repository root unless noted otherwise.

### Workspace

```powershell
pnpm install
pnpm dev
pnpm build
pnpm check
```

### Database

```powershell
pnpm --filter @alphaproof/backend db:generate
pnpm backend:db
```

`pnpm backend:db` runs Prisma `db push`. It applies schema changes without dropping data. Do not run destructive database operations against Neon unless you intentionally want to reset the demo data.

### Contracts

```powershell
pnpm contracts:test
pnpm contracts:deploy
pnpm contracts:deploy:local
pnpm contracts:read:local
```

### Proof Signals

```powershell
pnpm proof:smoke
pnpm proof:smoke:testnet
pnpm proof:create-pending:testnet
pnpm proof:resolve --signal-id <DB_SIGNAL_ID>
pnpm proof:resolve-latest
pnpm proof:seed-curated
```

Resolve all pending signals is guarded:

```powershell
$env:CONFIRM_RESOLVE_ALL="YES"
pnpm proof:resolve-all
Remove-Item Env:\CONFIRM_RESOLVE_ALL
```

### Curated Demo Seed

```powershell
pnpm proof:seed-curated
```

Creates 10 proof-ready historical-mainnet-style demo signals for the current proof network.

Optional balanced reputation profile:

```powershell
$env:DEMO_REPUTATION_PROFILE="balanced"
pnpm proof:seed-curated
Remove-Item Env:\DEMO_REPUTATION_PROFILE
```

Bulk scripts suppress Telegram alerts by default. Set this only if you intentionally want bulk alerts:

```env
TELEGRAM_ALERTS_FOR_BULK=true
```

### Telegram

```powershell
pnpm telegram:test
pnpm telegram:test:reputation
pnpm telegram:test-subscription
pnpm telegram:test-delivery-rules
pnpm telegram:demo-flow
pnpm telegram:set-commands
pnpm telegram:get-commands
pnpm telegram:delete-commands
pnpm telegram:webhook-config-check
pnpm telegram:set-webhook
pnpm telegram:webhook-info
pnpm telegram:delete-webhook
```

### URL Check

```powershell
pnpm app:url-check
```

This checks whether `PUBLIC_APP_URL` is suitable for Telegram dashboard buttons.

## Demo Script For Judges

Use this script when presenting the final project.

### Before Demo

1. Deploy `SignalRegistry` to Mantle Sepolia.
2. Put the deployed address into `backend/.env`.
3. Confirm `CHAIN_MODE=testnet`.
4. Confirm `MARKET_DATA_MODE=historical_mainnet`.
5. Confirm `EXPECTED_CHAIN_ID=5003`.
6. Fund the agent wallet with Mantle Sepolia MNT.
7. Run:

```powershell
pnpm backend:db
pnpm proof:smoke:testnet
```

8. Start the app:

```powershell
pnpm dev
```

### Live Demo Flow

1. Open `http://localhost:3000/dashboard`.
2. Show runtime status:
   - Mantle Sepolia
   - chain ID `5003`
   - contract address
   - current market source
3. Click `Connect Telegram Alerts`.
4. Open Telegram deep link and press Start.
5. Send a test alert from the dashboard.
6. Create a proof-backed signal:

```powershell
pnpm telegram:demo-flow
```

7. Show Telegram alert.
8. Click `Open Proof Tx`.
9. Show the transaction in Mantle Sepolia explorer.
10. Open the signal detail page from dashboard or Telegram.
11. Show:
    - source event
    - raw event JSON
    - AI reasoning
    - `dataHash`
    - `reasoningHash`
    - contract signal ID
12. Resolve the exact signal:

```powershell
pnpm proof:resolve --signal-id <DB_SIGNAL_ID>
```

13. Show Telegram outcome update.
14. Open `http://localhost:3000/reputation`.
15. Show updated accuracy and outcome distribution.

## Verification And Tests

Recommended full check:

```powershell
pnpm check
pnpm build
pnpm contracts:test
```

More explicit package-level checks:

```powershell
cd contracts
pnpm hardhat compile
pnpm hardhat test
```

```powershell
cd backend
pnpm prisma validate
pnpm prisma generate
pnpm check
pnpm build
pnpm exec tsc -p scripts/tsconfig.json --noEmit
```

```powershell
cd frontend
pnpm lint
pnpm build
```

Testnet smoke:

```powershell
pnpm proof:smoke:testnet
```

Local smoke:

```powershell
$env:CHAIN_MODE="local"
$env:MARKET_DATA_MODE="historical_mainnet"
pnpm proof:smoke
Remove-Item Env:\CHAIN_MODE
Remove-Item Env:\MARKET_DATA_MODE
```

## Troubleshooting

### Backend fails with chain config error

If `CHAIN_MODE=testnet`, the backend requires:

```env
SIGNAL_REGISTRY_ADDRESS
MANTLE_TESTNET_RPC_URL
MANTLE_TESTNET_EXPLORER_URL
EXPECTED_CHAIN_ID=5003
AGENT_PRIVATE_KEY
```

Use `CHAIN_MODE=mock` if you want to run without chain writes.

### Mantle chain ID mismatch

Mantle Sepolia must return chain ID `5003`.

Do not mix:

- legacy Mantle Testnet `5001`
- Mantle Sepolia explorer links
- Mantle Sepolia RPC

Correct config:

```env
MANTLE_TESTNET_RPC_URL="https://rpc.sepolia.mantle.xyz"
MANTLE_TESTNET_EXPLORER_URL="https://explorer.sepolia.mantle.xyz"
EXPECTED_CHAIN_ID=5003
```

### No contract found at `SIGNAL_REGISTRY_ADDRESS`

The backend checks deployed bytecode before writing.

Fix:

1. Confirm the contract address is correct.
2. Confirm the RPC points to the same network where the contract was deployed.
3. Re-run deploy if needed:

```powershell
cd contracts
pnpm deploy
```

### Telegram connects but buttons do not show dashboard links

Telegram does not accept `localhost` as a public button target.

Use:

```env
PUBLIC_APP_URL="https://your-public-frontend-url"
```

Check:

```powershell
pnpm app:url-check
```

### Telegram bot does not receive `/start`

Polling and webhook modes conflict.

For local development:

```env
TELEGRAM_MODE=polling
```

If a webhook was previously set, delete it:

```powershell
pnpm telegram:delete-webhook
```

### Prisma client errors

Regenerate Prisma client:

```powershell
pnpm --filter @alphaproof/backend db:generate
```

Apply schema:

```powershell
pnpm backend:db
```

### Frontend shows backend unavailable

Check:

```env
NEXT_PUBLIC_API_URL="http://localhost:4000"
```

Then verify backend:

```text
http://localhost:4000/health
```

### No live mainnet event found

`MARKET_DATA_MODE=live_mainnet` is intentionally minimal. It scans recent ERC-20 `Transfer` logs for configured tokens.

Required:

```env
MANTLE_MAINNET_RPC_URL="https://rpc.mantle.xyz"
TRACKED_TOKEN_ADDRESSES="0xTOKEN1,0xTOKEN2"
LIVE_SCAN_BLOCK_WINDOW=100
LIVE_TRANSFER_THRESHOLD_UNITS="100000"
```

If no transfer exceeds the threshold, the script returns an explanatory error.

## Safety Notes

- No trading.
- No custody.
- Not financial advice.
- No wallet connection is required for Telegram subscribers.
- The backend agent wallet is only used to commit and resolve proof records.
- Demo and seed scripts do not automatically clean Neon/PostgreSQL data.
- Bulk resolve requires explicit confirmation.
- In `local` and `testnet` modes, real contract writes are required. If a chain write fails, the script stops instead of silently creating mock proof data.

## Current Hackathon Positioning

AlphaProof is an accountability layer for AI agents on Mantle:

- It proves when a prediction was made.
- It preserves the source data hash.
- It preserves the reasoning hash.
- It makes agent outcomes measurable over time.
- It gives users Telegram alerts with links to proof transactions.

The MVP demonstrates the full loop: event ingestion, AI signal generation, on-chain commitment, database-backed verification, Telegram distribution, and reputation after resolution.
