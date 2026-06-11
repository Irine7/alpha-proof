# AlphaProof AI

AlphaProof AI is a hackathon MVP for verifiable AI signals, predictions, and risk alerts on Mantle. It commits signal hashes before outcomes are known, stores context in Neon PostgreSQL, and turns resolved outcomes into proof-backed reputation.

It is not a trading bot, does not custody funds, does not execute trades, and does not provide financial advice.

## Packages

```text
contracts/  Hardhat + Solidity SignalRegistry
backend/    Express + TypeScript + Prisma + Neon PostgreSQL
frontend/   Next.js dashboard and verification pages
```

## Mantle Sepolia As Default Testnet

`CHAIN_MODE=testnet` uses Mantle Sepolia Testnet by default:

```text
Network Name: Mantle Sepolia Testnet
RPC URL: https://rpc.sepolia.mantle.xyz
Chain ID: 5003
Currency Symbol: MNT
Explorer: https://explorer.sepolia.mantle.xyz
```

Explorer links use:

```text
tx:      https://explorer.sepolia.mantle.xyz/tx/<txHash>
address: https://explorer.sepolia.mantle.xyz/address/<address>
```

Legacy Mantle Testnet `5001` is only a deprecated fallback reference. Do not mix a `5001` RPC with the Mantle Sepolia `5003` explorer, or a `5003` RPC with legacy explorer links.

## Local Proof Mode

Use this for development without testnet funds:

```env
CHAIN_MODE="local"
MARKET_DATA_MODE="historical_mainnet"
SIGNAL_REGISTRY_ADDRESS="0xLOCAL_DEPLOYED_SIGNAL_REGISTRY"
MANTLE_LOCAL_RPC_URL="http://127.0.0.1:8545"
AGENT_PRIVATE_KEY="LOCAL_HARDHAT_PRIVATE_KEY"
DATABASE_URL="postgresql://USER:PASSWORD@HOST.neon.tech/DB?sslmode=require"
```

Run:

```bash
cd contracts
pnpm hardhat node
```

In a second terminal:

```bash
cd contracts
pnpm deploy:local
```

Local explorer links are disabled in the UI and labelled as local Hardhat transactions.

## Testnet Proof Mode

Use this for the Mantle Sepolia demo:

```env
CHAIN_MODE="testnet"
MARKET_DATA_MODE="historical_mainnet"
MANTLE_TESTNET_RPC_URL="https://rpc.sepolia.mantle.xyz"
MANTLE_TESTNET_EXPLORER_URL="https://explorer.sepolia.mantle.xyz"
EXPECTED_CHAIN_ID=5003
SIGNAL_REGISTRY_ADDRESS="0xDEPLOYED_SIGNAL_REGISTRY"
AGENT_PRIVATE_KEY="TESTNET_AGENT_PRIVATE_KEY"
DATABASE_URL="postgresql://USER:PASSWORD@HOST.neon.tech/DB?sslmode=require"
```

The backend validates that the configured testnet RPC returns chainId `5003`. If required testnet env is missing, it fails loudly instead of creating mock proof transactions.

Deploy `SignalRegistry`:

```bash
cd contracts
pnpm hardhat run scripts/deploy.ts --network mantleTestnet
```

The canonical deployment artifact is:

```text
contracts/deployments/mantle-sepolia.json
```

Format:

```json
{
  "network": "mantle-sepolia",
  "chainId": 5003,
  "signalRegistry": "0x...",
  "deployedAt": "...",
  "explorerUrl": "https://explorer.sepolia.mantle.xyz/address/0x..."
}
```

`contracts/deployments/mantle-testnet.json` may still be read as a legacy alias, but new demo docs and scripts use `mantle-sepolia.json`.

## Historical Mainnet Market Data Mode

`MARKET_DATA_MODE=historical_mainnet` reads curated Mantle mainnet-style fixture events from:

```text
backend/src/market/mantle-mainnet.fixture.json
```

Events include source chain, source tx hash, block number, wallet/protocol/pool context, USD value, source event type, raw event JSON, data hash, and reasoning hash.

## Why Read Mainnet-Style Events And Write To Testnet

Market events and proof network are intentionally separated. During the demo, AlphaProof reads historical Mantle mainnet-style events while committing proofs to the configured proof network. That lets judges inspect realistic signal inputs and real proof transactions on Mantle Sepolia without implying trading, custody, or live financial advice.

## Network-Aware Stats And Filtering

New proof records include:

```text
chainMode
chainId
contractAddress
proofNetwork
proofNetworkKey = <chainMode>:<chainId>:<contractAddress lowercase>
```

Dashboard stats and latest signals default to:

```text
proof-ready only
current proof network only
```

The dashboard also has toggles for `Show all records` and `All networks`. Legacy/local records are not deleted automatically and are marked when shown outside the current proof network.

## Testnet Smoke Flow

From the repo root:

```bash
pnpm proof:smoke:testnet
```

Requirements:

```env
CHAIN_MODE="testnet"
MARKET_DATA_MODE="historical_mainnet"
EXPECTED_CHAIN_ID=5003
```

The script checks RPC chainId, creates one proof signal, verifies `chainSignalId`, `commitTxHash`, `contractAddress`, explorer URL, and Neon persistence, then leaves the signal pending by default.

To resolve the created signal after commit:

```bash
RESOLVE_AFTER_CREATE=true pnpm proof:smoke:testnet
```

The output includes network, chainId, contract, signalId, chainSignalId, commitTxHash, commitExplorerUrl, status, marketDataMode, and sourceEventType. It does not print secrets and does not clean the database.

## Curated Demo Seed

From the repo root:

```bash
pnpm proof:seed-curated
```

The seed script does not clean the database. It creates 10 proof-ready signals for the current proof network: 8 resolved and 2 pending, with Correct, Failed, and Inconclusive outcomes across different signal types.

In `local` and `testnet` modes, real `commitSignal` and `resolveSignal` transactions are required. If a chain write fails, the script stops and reports the error. In `mock` mode, mock hashes are allowed and the UI marks them as mock.

## Running The App

Install and prepare Prisma:

```bash
pnpm install
cd backend
pnpm prisma validate
pnpm prisma generate
pnpm prisma db push
```

`prisma db push` applies additive schema changes. Do not run reset/drop/truncate against Neon without explicit confirmation.

Backend:

```bash
cd backend
pnpm dev
```

Frontend:

```bash
cd frontend
pnpm dev
```

Open:

```text
http://localhost:3000/dashboard
```

## Verification Page

Each `/signals/<id>` page shows:

- Signal summary: type, asset pair, confidence, prediction, status/outcome, evaluation time.
- Source event: market data mode, source chain, source tx hash, source block, wallet, protocol, pool, event type, USD value, detected time.
- AI reasoning: summary, reasoning, reasoning hash.
- On-chain proof: proof network, chain ID, contract address, chain signal ID, commit tx, commit block/time, resolve tx, outcome, data hash, explorer buttons, and copy buttons.
- Raw event JSON in a collapsible formatted block.

## Checks

```bash
cd contracts
pnpm hardhat compile
pnpm hardhat test

cd ../backend
pnpm prisma validate
pnpm prisma generate
pnpm check
pnpm build

cd ../frontend
pnpm lint
pnpm build
```

Optional local smoke:

```bash
cd backend
$env:CHAIN_MODE="local"
$env:MARKET_DATA_MODE="historical_mainnet"
pnpm proof:smoke
```

## Safety

- No trading.
- No custody or user funds.
- Not financial advice.
- No AgentIdentity contract in this demo.
- No Telegram bot in the Mantle Sepolia proof flow.
- No automatic Neon cleanup.
