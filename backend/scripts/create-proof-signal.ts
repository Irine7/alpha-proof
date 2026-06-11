import { createDemoSignal } from "../src/agent/orchestrator.js";
import { config, getProofNetworkConfig } from "../src/config.js";
import { prisma } from "../src/db/prisma.js";

async function main() {
  const result = await createDemoSignal();
  const { signal } = result;
  const proof = getProofNetworkConfig();

  console.log(
    JSON.stringify(
      {
        signalId: signal.id,
        chainSignalId: signal.chainSignalId,
        commitTxHash: signal.commitTxHash,
        marketDataMode: signal.marketDataMode,
        chainMode: config.chainMode,
        sourceEventType: signal.sourceEventType,
        proofNetwork: result.mockedChain ? "mock" : proof.proofNetwork
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
