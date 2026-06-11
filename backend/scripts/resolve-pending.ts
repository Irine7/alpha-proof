import { resolvePendingDemoSignals } from "../src/agent/evaluators/demoEvaluator.js";
import { prisma } from "../src/db/prisma.js";

async function main() {
  const { results, skipped } = await resolvePendingDemoSignals();

  console.log(
    JSON.stringify(
      {
        resolved: results.length,
        txHashes: results.map((entry) => entry.signal.resolveTxHash).filter(Boolean),
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
