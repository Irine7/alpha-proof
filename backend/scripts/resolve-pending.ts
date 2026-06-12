import { config, getProofNetworkConfig } from "../src/config.js";
import { resolvePendingDemoSignals } from "../src/agent/evaluators/demoEvaluator.js";
import { prisma } from "../src/db/prisma.js";
import { shortenHash } from "../src/telegram/formatter.js";

function argValue(name: string) {
  const prefixed = `${name}=`;
  const inline = process.argv.find((arg) => arg.startsWith(prefixed));
  if (inline) return inline.slice(prefixed.length);

  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function parseSignalId() {
  const raw = argValue("--signal-id") || process.env.SIGNAL_ID;
  if (!raw) return undefined;

  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) {
    throw new Error("SIGNAL_ID / --signal-id must be a positive DB Signal ID.");
  }
  return id;
}

function explorerTxUrl(txHash?: string | null) {
  const proof = getProofNetworkConfig();
  if (!txHash || !proof.explorerUrl) return null;
  return `${proof.explorerUrl.replace(/\/+$/, "")}/tx/${txHash}`;
}

async function main() {
  const signalId = parseSignalId();
  const resolveAll = process.argv.includes("--all") || process.env.RESOLVE_ALL === "true";
  const latestOnly = process.argv.includes("--latest") || (!signalId && !resolveAll);

  if (resolveAll && process.env.CONFIRM_RESOLVE_ALL !== "YES") {
    throw new Error("Bulk resolve requires CONFIRM_RESOLVE_ALL=YES. For demo, use pnpm proof:resolve --signal-id <DB_SIGNAL_ID> or pnpm proof:resolve-latest.");
  }

  const { results, skipped } = await resolvePendingDemoSignals({
    signalId,
    latestOnly,
    resolveAll,
    notify: resolveAll ? config.telegramAlertsForBulk : true
  });

  console.log(
    JSON.stringify(
      {
        mode: resolveAll ? "all" : signalId ? "signal-id" : "latest",
        telegramAlertsForBulk: config.telegramAlertsForBulk,
        resolved: results.length,
        resolvedSignals: results.map((entry) => ({
          dbSignalId: entry.signal.id,
          contractSignalId: entry.signal.chainSignalId,
          outcome: entry.signal.outcome,
          resolveTxShortHash: shortenHash(entry.signal.resolveTxHash),
          resolveExplorerUrl: explorerTxUrl(entry.signal.resolveTxHash),
          synced: "synced" in entry ? entry.synced : false
        })),
        skipped: skipped.length,
        skippedSignals: skipped
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
