# AlphaProof AI Demo Submission

Project name: AlphaProof AI

Track: AI Alpha & Data

SignalRegistry contract address: `0x1aB929e6c826A622355bA4AE241001B1C839a0D4`

Mantle Sepolia explorer contract URL: `https://explorer.sepolia.mantle.xyz/address/0x1aB929e6c826A622355bA4AE241001B1C839a0D4`

Example commit tx: use the `commitExplorerUrl` printed by `pnpm proof:smoke:testnet` or `pnpm proof:create-pending:testnet`.

Example resolve tx: use the `resolveExplorerUrl` printed by `RESOLVE_AFTER_CREATE=true pnpm proof:smoke:testnet`, or the tx hash printed by `pnpm --filter @alphaproof/backend proof:resolve`.

Demo flow summary:

1. Read historical Mantle mainnet-style source events.
2. Detect AI alpha/risk signals with source context and reasoning.
3. Hash source event data into `dataHash`.
4. Hash AI reasoning into `reasoningHash`.
5. Commit the signal to SignalRegistry on Mantle Sepolia before outcome.
6. Store the full signal record in Neon PostgreSQL.
7. Resolve outcomes later into proof-backed reputation.
8. Review dashboard, signal detail page, explorer links, and reputation page.

No trading / no custody statement: AlphaProof AI does not execute trades, custody funds, request user funds, or promise profit. It is a verifiable proof and reputation layer for AI-generated market signals.

Known limitations:

- Uses historical mainnet-style data for a stable demo.
- A minimal live mainnet reader exists, but this demo is not a full indexer.
- ERC-8004 Agent ID integration is planned later and is not included in this Mantle Sepolia proof demo.
