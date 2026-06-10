# AlphaProof AI

AlphaProof AI is a hackathon MVP for the Mantle AI / Alpha & Data track. It demonstrates a verifiable AI signal loop:

```text
demo Mantle-like event
  -> deterministic mock AI analyzer
  -> SignalRegistry commit on-chain
  -> Neon PostgreSQL record
  -> API + dashboard
  -> later outcome resolution
  -> reputation stats
```

It is not a trading bot, does not custody funds, and does not provide financial advice.

## Packages

```text
contracts/  Hardhat + Solidity SignalRegistry
backend/    Express + TypeScript + Prisma + Neon PostgreSQL
frontend/   Next.js dashboard
```

Telegram integration is planned for later. The current technical demo does not require Telegram.

## Env Safety

Never commit real `.env` files. This repo ignores:

- `.env`
- `.env.local`
- `.env.*.local`
- `backend/.env`
- `frontend/.env.local`
- `contracts/.env`

Use the checked-in `.env.example` files as placeholders only.

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
CHAIN_MODE="auto"
SIGNAL_REGISTRY_ADDRESS=""
MANTLE_RPC_URL=""
AGENT_PRIVATE_KEY=""
AI_PROVIDER="mock"
OPENAI_API_KEY=""
```

`CHAIN_MODE` options:

- `auto`: use chain env when complete, otherwise use mock proof hashes.
- `local`, `onchain`, or `real`: require chain env and fail instead of mocking.
- `mock`: force mock proof hashes.

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

## Contracts

Compile and test:

```bash
cd contracts
pnpm hardhat compile
pnpm hardhat test
```

`SignalRegistry` supports:

- `commitSignal`
- `resolveSignal`
- `getSignal`
- `getSignalsCount`
- `SignalCommitted`
- `SignalResolved`

## Local Hardhat Chain

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

It does not overwrite `backend/.env` or `frontend/.env.local`. Copy the printed address manually.

Local Hardhat state is ephemeral. If you restart `pnpm hardhat node`, the chain is wiped and you must deploy `SignalRegistry` again.

For a stable contract address, deploy to Mantle testnet:

```bash
cd contracts
pnpm deploy
```

## Backend Local Chain Config

For local end-to-end testing with Neon plus Hardhat, set `backend/.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST.neon.tech/DB?sslmode=require"
PORT=4000
CHAIN_MODE="local"
SIGNAL_REGISTRY_ADDRESS="0xLOCAL_DEPLOYED_SIGNAL_REGISTRY"
MANTLE_RPC_URL="http://127.0.0.1:8545"
AGENT_PRIVATE_KEY="LOCAL_HARDHAT_ACCOUNT_PRIVATE_KEY"
AI_PROVIDER="mock"
```

Then run:

```bash
cd backend
pnpm dev
```

If chain env is missing in `auto`, the backend falls back to local mock proof hashes. For real local contract commits, use `CHAIN_MODE="local"` and provide the local Hardhat RPC, contract address, and local Hardhat private key. In `local` mode, a missing or wrong contract address returns an error instead of creating a fake proof.

## Frontend

Create `frontend/.env.local` from `frontend/.env.example`:

```env
NEXT_PUBLIC_API_URL="http://localhost:4000"
NEXT_PUBLIC_MANTLE_EXPLORER_URL=""
NEXT_PUBLIC_SIGNAL_REGISTRY_ADDRESS="0xLOCAL_DEPLOYED_SIGNAL_REGISTRY"
```

For Mantle testnet, set `NEXT_PUBLIC_MANTLE_EXPLORER_URL` to the Mantle explorer base URL. For local Hardhat, leave it empty so localhost tx hashes are shown as hashes, not explorer links.

Run:

```bash
cd frontend
pnpm dev
```

Open:

```text
http://localhost:3000/dashboard
```

## API Demo Flow

With Hardhat node, deployed contract, backend, and frontend running:

```bash
curl http://localhost:4000/api/signals
curl http://localhost:4000/api/agent/stats
curl -X POST http://localhost:4000/api/demo/create-signal
curl http://localhost:4000/api/signals
curl -X POST http://localhost:4000/api/demo/resolve-pending
curl http://localhost:4000/api/agent/stats
```

Read the local contract:

```bash
cd contracts
pnpm read:local
```

Read a specific chain signal:

```bash
cd contracts
SIGNAL_ID=0 pnpm read:local
```

PowerShell:

```powershell
$env:SIGNAL_ID="0"
pnpm read:local
Remove-Item Env:\SIGNAL_ID
```

## Expected End-to-End Result

After `POST /api/demo/create-signal`:

- Neon has a new `Signal` row.
- `SignalRegistry.getSignal(chainSignalId)` returns matching signal data.
- API signal has `chainSignalId`, `commitTxHash`, `reasoningHash`, `dataHash`, and `status: Pending`.

After `POST /api/demo/resolve-pending`:

- API signal has `status: Resolved`, `outcome`, and `resolveTxHash`.
- `SignalRegistry.getSignal(chainSignalId)` has matching resolved status and outcome.
- `/api/agent/stats` updates reputation counts and accuracy.

Old pending rows from a previous mock/local run may remain in Neon. The backend skips chain-resolve failures for stale pending rows instead of crashing the current demo flow.
