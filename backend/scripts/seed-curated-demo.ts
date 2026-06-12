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
  "exit_risk",
  "large_swap",
  "repeated_buys",
  "liquidity_removal",
  "volume_spike",
  "tracked_wallet_action",
  "whale_transfer",
  "large_swap",
  "exit_risk",
  "liquidity_removal"
];

const resolvedOutcomes: SignalOutcome[] = [
  "Correct",
  "Failed",
  "Correct",
  "Inconclusive",
  "Correct",
  "Inconclusive",
  "Failed",
  "Failed"
];

function explorerTxUrl(txHash?: string | null) {
  const proof = getProofNetworkConfig();
  if (!txHash || !proof.explorerUrl) return null;
  return `${proof.explorerUrl}/tx/${txHash}`;
}

function chainWriteHint(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.toLowerCase().includes("insufficient funds")) {
    return `${message}\n\nCurated seed stopped before completion because the agent wallet does not have enough proof-network gas. Fund the AGENT_PRIVATE_KEY wallet with Mantle Sepolia MNT and rerun pnpm proof:seed-curated. Already committed records were not cleaned or reset.`;
  }
  return message;
}

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

function assertCuratedDiversity(signals: Awaited<ReturnType<typeof createDemoSignal>>["signal"][]) {
  const signalTypes = new Set(signals.map((signal) => signal.signalType));
  const sourceEventTypes = new Set(signals.map((signal) => signal.sourceEventType).filter(Boolean));
  const assetsAndPools = new Set(signals.flatMap((signal) => [signal.asset, signal.sourcePool, signal.pool].filter(Boolean)));

  for (const signalType of ["Whale Accumulation", "Liquidity Shock", "Smart Wallet Activity", "Volume Spike", "Exit Risk"]) {
    assert(signalTypes.has(signalType), `Curated seed missing signal type: ${signalType}`);
  }

  for (const eventType of [
    "large_buy_swap",
    "large_sell_to_stable",
    "repeated_buy_swaps",
    "liquidity_removed",
    "pool_volume_spike",
    "smart_wallet_collateral_deposit",
    "whale_transfer",
    "exit_liquidity_warning"
  ]) {
    assert(sourceEventTypes.has(eventType), `Curated seed missing source event type: ${eventType}`);
  }

  for (const assetOrPair of ["MNT", "mETH", "MNT/USDT", "USDC/MNT", "USDT/MNT"]) {
    assert(assetsAndPools.has(assetOrPair), `Curated seed missing asset or pair: ${assetOrPair}`);
  }
}

async function main() {
  const proof = getProofNetworkConfig();
  const created = [];

  for (const kind of curatedKinds) {
    const result = await createDemoSignal(kind, { notify: config.telegramAlertsForBulk });
    if ((config.chainMode === "local" || config.chainMode === "testnet") && result.mockedChain) {
      throw new Error(`Curated seed stopped: CHAIN_MODE=${config.chainMode} requires real commitSignal transactions`);
    }
    assertProofReady(result.signal);
    created.push(result.signal);
  }

  assertCuratedDiversity(created);

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
        contractAddress: config.signalRegistryAddress || null,
        proofNetworkKey: currentProofNetworkKey(),
        created: created.length,
        resolved: resolved.length,
        pending: pending.length,
        correct: resolved.filter((entry) => entry.outcome === "Correct").length,
        failed: resolved.filter((entry) => entry.outcome === "Failed").length,
        inconclusive: resolved.filter((entry) => entry.outcome === "Inconclusive").length,
        firstExplorerTx: explorerTxUrl(created[0]?.commitTxHash),
        lastExplorerTx: explorerTxUrl(created.at(-1)?.commitTxHash),
        signalTypes: [...new Set(created.map((signal) => signal.signalType))],
        sourceEventTypes: [...new Set(created.map((signal) => signal.sourceEventType).filter(Boolean))],
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
    console.error(chainWriteHint(error));
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
