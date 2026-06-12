import { resolveSignalOnChain } from "../src/chain/client.js";
import { assertExpectedRpcChainId, config, getProofNetworkConfig } from "../src/config.js";
import { createDemoSignal } from "../src/agent/orchestrator.js";
import { getSignalById, markSignalResolved } from "../src/db/signals.js";
import { prisma } from "../src/db/prisma.js";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function chainWriteHint(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.toLowerCase().includes("insufficient funds")) {
    return `${message}\n\nThe testnet agent wallet does not have enough Mantle Sepolia MNT for gas. Fund AGENT_PRIVATE_KEY's address and rerun pnpm proof:smoke:testnet.`;
  }
  return message;
}

async function main() {
  assert(config.chainMode === "testnet", "Testnet smoke requires CHAIN_MODE=testnet");
  assert(config.marketDataMode === "historical_mainnet", "Testnet smoke requires MARKET_DATA_MODE=historical_mainnet");
  await assertExpectedRpcChainId();

  const proof = getProofNetworkConfig();
  const result = await createDemoSignal();
  let signal = await getSignalById(result.signal.id);

  assert(signal, "Smoke failed: created signal was not found in Neon");
  assert(signal.chainSignalId !== null, "Smoke failed: chainSignalId missing");
  assert(signal.commitTxHash, "Smoke failed: commitTxHash missing");
  assert(signal.contractAddress, "Smoke failed: contractAddress missing");
  assert(signal.proofNetworkKey, "Smoke failed: proofNetworkKey missing");
  assert(!result.mockedChain, "Smoke failed: CHAIN_MODE=testnet must not create mock proof tx");

  const commitExplorerUrl = `${proof.explorerUrl}/tx/${signal.commitTxHash}`;
  assert(
    commitExplorerUrl.startsWith("https://explorer.sepolia.mantle.xyz/tx/"),
    "Smoke failed: commit explorer URL is not Mantle Sepolia"
  );

  let resolveExplorerUrl: string | null = null;
  if (process.env.RESOLVE_AFTER_CREATE === "true") {
    const resolved = await resolveSignalOnChain(signal.chainSignalId, "Inconclusive");
    assert(resolved.txHash, "Smoke failed: resolveTxHash missing");
    signal = await markSignalResolved(signal.id, "Inconclusive", resolved.txHash);
    resolveExplorerUrl = `${proof.explorerUrl}/tx/${resolved.txHash}`;
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        network: proof.proofNetwork,
        chainId: proof.chainId,
        contract: signal.contractAddress,
        signalId: signal.id,
        chainSignalId: signal.chainSignalId,
        commitTxHash: signal.commitTxHash,
        commitExplorerUrl,
        resolveTxHash: signal.resolveTxHash,
        resolveExplorerUrl,
        status: signal.status,
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
