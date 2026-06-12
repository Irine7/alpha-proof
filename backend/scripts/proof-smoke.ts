import { createDemoSignal } from "../src/agent/orchestrator.js";
import { resolvePendingDemoSignals } from "../src/agent/evaluators/demoEvaluator.js";
import { config } from "../src/config.js";
import { getSignalById } from "../src/db/signals.js";
import { prisma } from "../src/db/prisma.js";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function main() {
  const shouldResolve = process.argv.includes("--resolve");
  const result = await createDemoSignal();
  const signal = await getSignalById(result.signal.id);

  assert(signal, "Smoke failed: created signal was not found in DB");
  assert(signal.commitTxHash, "Smoke failed: DB signal has no commitTxHash");

  if (config.chainMode === "local" || config.chainMode === "testnet") {
    assert(signal.chainSignalId !== null, "Smoke failed: on-chain mode did not store chainSignalId");
  }

  const resolved = shouldResolve ? await resolvePendingDemoSignals({ signalId: signal.id, notify: true }) : null;

  console.log(
    JSON.stringify(
      {
        ok: true,
        signalId: signal.id,
        chainSignalId: signal.chainSignalId,
        commitTxHash: signal.commitTxHash,
        marketDataMode: signal.marketDataMode,
        chainMode: config.chainMode,
        sourceEventType: signal.sourceEventType,
        resolved: resolved?.results.length ?? 0,
        skipped: resolved?.skipped.length ?? 0
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
