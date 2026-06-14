# AlphaProof Demo Submission

Project name: AlphaProof

Track: AI Alpha & Data

SignalRegistry contract address: `0x1aB929e6c826A622355bA4AE241001B1C839a0D4`

Mantle Sepolia explorer contract URL: `https://explorer.sepolia.mantle.xyz/address/0x1aB929e6c826A622355bA4AE241001B1C839a0D4`

Example commit tx: use the `commitExplorerUrl` printed by `pnpm proof:smoke:testnet` or `pnpm proof:create-pending:testnet`.

Example resolve tx: use the `resolveExplorerUrl` printed by `DEMO_RESOLVE_AFTER_CREATE=true pnpm telegram:demo-flow`, or the tx hash printed by `pnpm proof:resolve --signal-id <DB_SIGNAL_ID>`.

Telegram bot:

- Uses polling for the hackathon demo.
- Dashboard `Connect Telegram Alerts` creates a one-time deep link connect code.
- `/start <connect_code>` subscribes the Telegram chat.
- Dashboard `Send Test Alert` verifies the connected chat without creating a signal, changing stats, writing to chain, or spending gas.
- Sends proof-backed signal alerts and resolve updates to active subscribers.
- `/pending` shows the latest proof-before-outcome signal.
- `/alerts on`, `/alerts off`, `/settings`, and `/minconfidence` manage alert preferences.
- `/unsubscribe` disables alerts but keeps the dashboard connection; `/disconnect` unlinks Telegram and requires a new dashboard connect link.
- Automatic alerts respect subscriber preferences such as `minConfidence`; manual lookups still show requested signals.
- Manual lookups show a note when a signal is below the current alert threshold.
- Fresh demo pending signals use a future evaluation window, usually about 30 minutes; old pending signals show that evaluation is due and waiting for outcome resolution.
- Webhook mode is implemented for deployed backends; polling remains the demo default.
- `PUBLIC_APP_URL` must be public HTTPS for Telegram `View Signal` and reputation buttons; localhost disables those buttons.
- Full auth/user accounts and advanced preferences are planned later.

Demo flow summary:

1. Open the AlphaProof dashboard.
2. Click `Connect Telegram Alerts`.
3. Open the Telegram deep link.
4. Bot confirms the subscription.
5. Click `Send Test Alert` in the dashboard.
6. Show `/settings`.
7. Optionally set `/minconfidence 75`.
8. Create a proof signal from the dashboard or script using a historical Mantle mainnet-style source event.
9. Telegram receives the automatic proof-backed alert only if it passes preferences.
10. Tap `Open Proof Tx`.
11. Tap `View Signal`.
12. Resolve exactly the demo signal.
13. Telegram receives the resolved update.
14. Show `/reputation`.

Technical flow:

1. Read historical Mantle mainnet-style source events.
2. Detect AI alpha/risk signals with source context and reasoning.
3. Hash source event data into `dataHash`.
4. Hash AI reasoning into `reasoningHash`.
5. Commit the signal to SignalRegistry on Mantle Sepolia before outcome.
6. Store the full signal record in Neon PostgreSQL.
7. Send a Telegram alert with proof and dashboard links to active subscribers.
8. Resolve exactly one demo signal into proof-backed reputation.

No trading / no custody statement: AlphaProof does not execute trades, custody funds, request user funds, or promise profit. It is a verifiable proof and reputation layer for AI-generated market signals.

Known limitations:

- Uses historical mainnet-style data for a stable demo.
- A minimal live mainnet reader exists, but this demo is not a full indexer.
- Telegram uses polling for the hackathon demo; webhook mode is implemented for deployed HTTPS backends.
- ERC-8004 Agent ID integration is planned later and is not included in this Mantle Sepolia proof demo.
