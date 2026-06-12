import { assertExpectedRpcChainId, config, getProofNetworkConfig } from "../src/config.js";
import { createDemoSignal } from "../src/agent/orchestrator.js";
import { getSignalById } from "../src/db/signals.js";
import { prisma } from "../src/db/prisma.js";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function chainWriteHint(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.toLowerCase().includes("insufficient funds")) {
    return `${message}\n\nThe testnet agent wallet does not have enough Mantle Sepolia MNT for gas. Fund AGENT_PRIVATE_KEY's address and rerun pnpm proof:create-pending:testnet.`;
  }
  return message;
}

async function main() {
  assert(config.chainMode === "testnet", "Pending testnet proof requires CHAIN_MODE=testnet");
  assert(config.marketDataMode === "historical_mainnet", "Pending testnet proof requires MARKET_DATA_MODE=historical_mainnet");
  await assertExpectedRpcChainId();

  const proof = getProofNetworkConfig();
  const result = await createDemoSignal();
  const signal = await getSignalById(result.signal.id);

  assert(signal, "Pending proof failed: created signal was not found in Neon");
  assert(signal.chainSignalId !== null, "Pending proof failed: chainSignalId missing");
  assert(signal.commitTxHash, "Pending proof failed: commitTxHash missing");
  assert(signal.contractAddress, "Pending proof failed: contractAddress missing");
  assert(!result.mockedChain, "Pending proof failed: CHAIN_MODE=testnet must create a real Mantle Sepolia transaction");
  assert(signal.status === "Pending", "Pending proof failed: created signal should remain unresolved");

  const commitExplorerUrl = `${proof.explorerUrl}/tx/${signal.commitTxHash}`;

  console.log(
    JSON.stringify(
      {
        ok: true,
        status: signal.status,
        outcome: signal.outcome,
        network: proof.proofNetwork,
        chainId: proof.chainId,
        contractAddress: signal.contractAddress,
        databaseSignalId: signal.id,
        contractSignalId: signal.chainSignalId,
        commitTxHash: signal.commitTxHash,
        commitExplorerUrl,
        marketDataMode: signal.marketDataMode,
        sourceEventType: signal.sourceEventType
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(chainWriteHint(error));
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
