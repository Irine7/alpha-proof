# AlphaProof

AlphaProof is a hackathon MVP for verifiable AI signals, predictions, and risk alerts on Mantle. It commits signal hashes before outcomes are known, stores context in Neon PostgreSQL, and turns resolved outcomes into proof-backed reputation.

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

To create one pending Mantle Sepolia proof signal for the opening dashboard shot:

```bash
pnpm proof:create-pending:testnet
```

This requires `CHAIN_MODE=testnet` and `MARKET_DATA_MODE=historical_mainnet`, creates one real `commitSignal` transaction, prints the Mantle Sepolia explorer link, does not resolve the signal, and does not clean Neon.

## Telegram Bot

AlphaProof can run a Telegram bot as an alert/distribution layer for proof-backed signals. It supports user subscriptions through a dashboard connect link, polling for local/demo runs, and webhook mode for deployed backends.

1. Create a bot with BotFather.
2. Add backend env:

```env
TELEGRAM_ENABLED=true
TELEGRAM_MODE=polling
TELEGRAM_BOT_TOKEN="<token>"
TELEGRAM_BOT_USERNAME="<bot username>"
TELEGRAM_CHAT_ID="<chat id>"
TELEGRAM_ADMIN_ALERTS=false
PUBLIC_APP_URL=https://your-public-url
TELEGRAM_ALERTS_ON_CREATE=true
TELEGRAM_ALERTS_ON_RESOLVE=true
TELEGRAM_ALERTS_FOR_BULK=false
TELEGRAM_WEBHOOK_URL=
TELEGRAM_WEBHOOK_SECRET=
TELEGRAM_ALLOW_DEMO_COMMAND=false
```

For local testing, `PUBLIC_APP_URL=http://localhost:3000` is fine. For demo video/submission, use a public frontend URL such as Vercel, Render, or a tunnel URL so Telegram can render dashboard inline buttons.

3. Run the backend:

```bash
cd backend
pnpm dev
```

4. Test the latest-signal alert without creating a new signal or writing to chain:

```bash
pnpm telegram:test
```

To test the reputation card:

```bash
pnpm telegram:test:reputation
```

To create or reactivate a subscriber from the configured demo chat:

```bash
pnpm telegram:test-subscription
```

## Telegram User Subscriptions And Web Connect Flow

1. Start the backend in polling mode:

```bash
cd backend
pnpm dev
```

2. Open the dashboard.
3. Click `Connect Telegram Alerts`.
4. AlphaProof creates a one-time connect code and opens:

```text
https://t.me/<bot_username>?start=<connect_code>
```

5. The bot receives `/start <connect_code>`, links the Telegram chat to an active subscriber, and confirms the subscription.
6. The dashboard polls the connect-code status and shows `Telegram connected`.
7. Future create/resolve alerts go to active subscribers.

`TELEGRAM_CHAT_ID` remains a demo/admin fallback. If no active subscribers exist, AlphaProof can still send to `TELEGRAM_CHAT_ID`. Set `TELEGRAM_ADMIN_ALERTS=true` only when you intentionally want the admin chat to receive alerts even when subscribers exist.

Subscription commands:

```text
/subscribe
/unsubscribe
/status
/settings
/minconfidence 70
/minconfidence off
/types all
/types Whale Accumulation,Liquidity Shock
```

`/minconfidence 75` suppresses alerts below 75% confidence for that subscriber. Signal-type preferences are stored for future filtering and can be updated with `/types`.

## Telegram Webhook Mode

Polling and webhooks are mutually exclusive in Telegram. Local/dev should use:

```env
TELEGRAM_MODE=polling
```

For a deployed backend:

```env
TELEGRAM_MODE=webhook
TELEGRAM_WEBHOOK_URL=https://your-api-domain.com/api/telegram/webhook
TELEGRAM_WEBHOOK_SECRET="<random secret>"
TELEGRAM_WEBHOOK_PATH=/api/telegram/webhook
```

Set, inspect, or delete the webhook explicitly:

```bash
pnpm telegram:set-webhook
pnpm telegram:webhook-info
pnpm telegram:delete-webhook
```

When `TELEGRAM_WEBHOOK_SECRET` is set, the backend validates Telegram's `X-Telegram-Bot-Api-Secret-Token` header. The backend does not call `setWebhook` automatically on boot.

## Telegram Demo Flow

Create one pending proof signal for the demo:

```bash
pnpm telegram:demo-flow
```

Expected result: Telegram receives a compact proof-backed alert with:

- Open Proof Tx button
- View Signal button when `PUBLIC_APP_URL` is public
- Reputation button when `PUBLIC_APP_URL` is public

Resolve exactly the created signal:

```bash
pnpm proof:resolve --signal-id <DB_SIGNAL_ID>
```

Or create and resolve one signal in a single demo script run:

```powershell
$env:DEMO_RESOLVE_AFTER_CREATE="true"
pnpm telegram:demo-flow
Remove-Item Env:\DEMO_RESOLVE_AFTER_CREATE
```

Resolve the latest pending signal:

```bash
pnpm proof:resolve-latest
```

Expected result: Telegram receives a resolved update with the outcome and resolve transaction button.

Bulk resolve is explicit and guarded:

```powershell
$env:CONFIRM_RESOLVE_ALL="YES"
pnpm proof:resolve-all
Remove-Item Env:\CONFIRM_RESOLVE_ALL
```

Bulk operations do not send Telegram alerts unless `TELEGRAM_ALERTS_FOR_BULK=true`.

Telegram does not allow `localhost` URLs in inline keyboard buttons. With `PUBLIC_APP_URL=http://localhost:3000`, dashboard links are still controlled by `PUBLIC_APP_URL`, but dashboard buttons are omitted. Use a public HTTPS URL when you want `View Signal` and `Reputation` buttons.

Bot commands:

```text
/start
/latest
/pending
/reputation
/signal <id>
/signal contract:<id>
/subscribe
/unsubscribe
/status
/settings
/minconfidence 70
/types all
/demo
/help
```

If `TELEGRAM_ENABLED=false`, the backend logs `Telegram disabled.` and does not start polling. If `TELEGRAM_ENABLED=true` but `TELEGRAM_BOT_TOKEN` is missing, polling and alerts are disabled with a warning. If `TELEGRAM_CHAT_ID` is missing, bot commands can still work, but auto-alerts are disabled with a warning.

No trading. No custody. Not financial advice.

## Curated Demo Seed

From the repo root:

```bash
pnpm proof:seed-curated
```

The seed script does not clean the database. It creates 10 proof-ready signals for the current proof network: 8 resolved and 2 pending, with Correct, Failed, and Inconclusive outcomes across different signal types.

In `local` and `testnet` modes, real `commitSignal` and `resolveSignal` transactions are required. If a chain write fails, the script stops and reports the error. In `mock` mode, mock hashes are allowed and the UI marks them as mock. Seed/bulk operations suppress Telegram alerts by default; set `TELEGRAM_ALERTS_FOR_BULK=true` only when you intentionally want those messages.

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
- On-chain proof: proof network, chain ID, contract address, Contract Signal ID, commit tx, commit block/time, resolve tx, outcome, data hash, explorer buttons, and copy buttons.
- Raw event JSON in a collapsible formatted block.

## Final Mantle Sepolia Demo Flow

1. Deploy contract:

```bash
cd contracts
pnpm hardhat run scripts/deploy.ts --network mantleTestnet
```

2. Backend env:

```env
CHAIN_MODE="testnet"
MARKET_DATA_MODE="historical_mainnet"
MANTLE_TESTNET_RPC_URL="https://rpc.sepolia.mantle.xyz"
MANTLE_TESTNET_EXPLORER_URL="https://explorer.sepolia.mantle.xyz"
EXPECTED_CHAIN_ID=5003
SIGNAL_REGISTRY_ADDRESS="<deployed address>"
AGENT_PRIVATE_KEY="<testnet wallet private key>"
DATABASE_URL="<Neon PostgreSQL URL>"
TELEGRAM_ENABLED=true
TELEGRAM_MODE=polling
TELEGRAM_BOT_TOKEN="<token>"
TELEGRAM_BOT_USERNAME="<bot username>"
TELEGRAM_CHAT_ID="<chat id>"
TELEGRAM_ADMIN_ALERTS=false
PUBLIC_APP_URL="https://your-public-url"
TELEGRAM_ALERTS_ON_CREATE=true
TELEGRAM_ALERTS_ON_RESOLVE=true
TELEGRAM_ALERTS_FOR_BULK=false
```

3. Start services:

```bash
cd backend
pnpm dev
```

```bash
cd frontend
pnpm dev
```

4. Open the dashboard and click `Connect Telegram Alerts`.

5. Open the Telegram deep link and wait for the bot confirmation.

6. Create one pending signal:

```bash
pnpm telegram:demo-flow
```

7. Show Telegram alert, then tap `Open Proof Tx` and `View Signal` from Telegram.

8. Optional curated dataset:

```bash
pnpm proof:seed-curated
```

9. Resolve exactly one signal:

```powershell
$env:RESOLVE_AFTER_CREATE="true"
pnpm proof:smoke:testnet
Remove-Item Env:\RESOLVE_AFTER_CREATE
```

or:

```bash
pnpm proof:resolve --signal-id <DB_SIGNAL_ID>
```

10. Show Telegram resolve update, then open:

```text
http://localhost:3000/dashboard
http://localhost:3000/reputation
```

11. Demo video checklist:

- Show dashboard runtime panel.
- Click Connect Telegram Alerts.
- Show Telegram subscription confirmation.
- Show Mantle Sepolia contract link.
- Create proof signal.
- Show Telegram proof-backed alert.
- Open proof tx in explorer.
- Open signal detail.
- Show source event, dataHash, and reasoningHash.
- Resolve exactly the demo signal.
- Show Telegram resolve update.
- Show reputation update.

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
- Telegram is alerts only; it does not trade, custody funds, take payments, or connect wallets.
- No automatic Neon cleanup.
