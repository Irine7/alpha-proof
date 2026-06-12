import { createDemoSignal } from "../src/agent/orchestrator.js";
import { resolvePendingDemoSignals } from "../src/agent/evaluators/demoEvaluator.js";
import { config, getProofNetworkConfig } from "../src/config.js";
import { prisma } from "../src/db/prisma.js";
import { shortenHash } from "../src/telegram/formatter.js";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function explorerTxUrl(txHash?: string | null) {
  const proof = getProofNetworkConfig();
  if (!txHash || !proof.explorerUrl) return null;
  return `${proof.explorerUrl.replace(/\/+$/, "")}/tx/${txHash}`;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  assert(config.telegramEnabled, "telegram:demo-flow requires TELEGRAM_ENABLED=true.");
  assert(Boolean(config.telegramBotToken), "telegram:demo-flow requires TELEGRAM_BOT_TOKEN.");
  assert(Boolean(config.telegramChatId), "telegram:demo-flow requires TELEGRAM_CHAT_ID.");
  assert(config.chainMode === "testnet", "telegram:demo-flow requires CHAIN_MODE=testnet.");
  assert(config.marketDataMode === "historical_mainnet", "telegram:demo-flow requires MARKET_DATA_MODE=historical_mainnet.");

  const result = await createDemoSignal(undefined, { notify: true });
  const { signal } = result;
  const shouldResolve = process.env.DEMO_RESOLVE_AFTER_CREATE === "true";

  const summary: Record<string, unknown> = {
    ok: true,
    mode: shouldResolve ? "create-and-resolve" : "create-pending",
    dbSignalId: signal.id,
    contractSignalId: signal.chainSignalId,
    proofTxShortHash: shortenHash(signal.commitTxHash),
    proofExplorerUrl: explorerTxUrl(signal.commitTxHash),
    status: signal.status
  };

  if (shouldResolve) {
    await sleep(3_000);
    const { results, skipped } = await resolvePendingDemoSignals({ signalId: signal.id, notify: true });
    const resolved = results[0]?.signal;

    summary.resolved = results.length;
    summary.skipped = skipped.length;
    summary.outcome = resolved?.outcome || null;
    summary.resolveTxShortHash = shortenHash(resolved?.resolveTxHash);
    summary.resolveExplorerUrl = explorerTxUrl(resolved?.resolveTxHash);
    summary.skippedSignals = skipped;
  }

  console.log(JSON.stringify(summary, null, 2));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
