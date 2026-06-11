import { resolveSignalOnChain } from "../src/chain/client.js";
import { config, currentProofNetworkKey, getProofNetworkConfig, shouldUseMockChain } from "../src/config.js";
import { createDemoSignal } from "../src/agent/orchestrator.js";
import { markSignalResolved } from "../src/db/signals.js";
import { prisma } from "../src/db/prisma.js";
import type { MarketEventType, SignalOutcome } from "../src/types.js";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const curatedKinds: MarketEventType[] = [
  "volume_spike",
  "exit_risk",
  "liquidity_removal",
  "tracked_wallet_action",
  "large_swap",
  "repeated_buys",
  "whale_transfer",
  "volume_spike",
  "exit_risk",
  "tracked_wallet_action"
];

const resolvedOutcomes: SignalOutcome[] = [
  "Correct",
  "Failed",
  "Inconclusive",
  "Correct",
  "Failed",
  "Correct",
  "Inconclusive",
  "Correct"
];

function assertProofReady(signal: Awaited<ReturnType<typeof createDemoSignal>>["signal"]) {
  assert(signal.sourceEventType, `Signal ${signal.id} missing sourceEventType`);
  assert(signal.usdValue !== null, `Signal ${signal.id} missing usdValue`);
  assert(signal.sourceChain, `Signal ${signal.id} missing sourceChain`);
  assert(signal.dataHash, `Signal ${signal.id} missing dataHash`);
  assert(signal.reasoningHash, `Signal ${signal.id} missing reasoningHash`);
  assert(signal.commitTxHash, `Signal ${signal.id} missing commitTxHash`);
  assert(signal.chainSignalId !== null, `Signal ${signal.id} missing chainSignalId`);
  assert(signal.proofNetworkKey === currentProofNetworkKey(), `Signal ${signal.id} was not created for the current proof network`);
}

async function main() {
  const proof = getProofNetworkConfig();
  const created = [];

  for (const kind of curatedKinds) {
    const result = await createDemoSignal(kind);
    if ((config.chainMode === "local" || config.chainMode === "testnet") && result.mockedChain) {
      throw new Error(`Curated seed stopped: CHAIN_MODE=${config.chainMode} requires real commitSignal transactions`);
    }
    assertProofReady(result.signal);
    created.push(result.signal);
  }

  const resolved = [];
  for (let index = 0; index < resolvedOutcomes.length; index += 1) {
    const signal = created[index];
    const outcome = resolvedOutcomes[index];
    assert(signal.chainSignalId !== null, `Signal ${signal.id} missing chainSignalId before resolve`);
    const chainResult = await resolveSignalOnChain(signal.chainSignalId, outcome);
    if ((config.chainMode === "local" || config.chainMode === "testnet") && chainResult.mocked) {
      throw new Error(`Curated seed stopped: CHAIN_MODE=${config.chainMode} requires real resolveSignal transactions`);
    }
    const updated = await markSignalResolved(signal.id, outcome, chainResult.txHash);
    resolved.push({
      signalId: updated.id,
      chainSignalId: updated.chainSignalId,
      signalType: updated.signalType,
      outcome: updated.outcome,
      resolveTxHash: updated.resolveTxHash
    });
  }

  const pending = created.slice(resolvedOutcomes.length).map((signal) => ({
    signalId: signal.id,
    chainSignalId: signal.chainSignalId,
    signalType: signal.signalType,
    sourceEventType: signal.sourceEventType,
    commitTxHash: signal.commitTxHash
  }));

  console.log(
    JSON.stringify(
      {
        ok: true,
        chainMode: config.chainMode,
        marketDataMode: config.marketDataMode,
        proofNetwork: shouldUseMockChain() ? "Mock" : proof.proofNetwork,
        chainId: proof.chainId,
        proofNetworkKey: currentProofNetworkKey(),
        created: created.length,
        resolved: resolved.length,
        pending: pending.length,
        outcomes: {
          correct: resolved.filter((entry) => entry.outcome === "Correct").length,
          failed: resolved.filter((entry) => entry.outcome === "Failed").length,
          inconclusive: resolved.filter((entry) => entry.outcome === "Inconclusive").length
        },
        resolvedSignals: resolved,
        pendingSignals: pending
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
