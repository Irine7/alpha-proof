import { commitSignalOnChain } from "../chain/client.js";
import { config, currentProofNetworkKey, getProofNetworkConfig } from "../config.js";
import { createSignal } from "../db/signals.js";
import { getMarketDataSource } from "../market/dataSource.js";
import { sendSignalAlert } from "../telegram/bot.js";
import type { MarketEventType } from "../types.js";
import { hashToBytes32 } from "../utils/hash.js";
import { analyzeSignal } from "./ai/index.js";
import { detectSignal } from "./detectors/detector.js";

export async function createDemoSignal(kind?: MarketEventType) {
  const marketDataSource = getMarketDataSource();
  const event = await marketDataSource.getNextMarketEvent(kind);
  const candidate = detectSignal(event);
  const analysis = await analyzeSignal(event, candidate);
  const reasoningHash = hashToBytes32(analysis.reasoning);
  const dataHash = hashToBytes32({
    id: event.id,
    marketDataMode: event.marketDataMode,
    sourceChain: event.sourceChain,
    sourceTxHash: event.sourceTxHash,
    sourceBlockNumber: event.sourceBlockNumber,
    sourceWallet: event.sourceWallet,
    sourceProtocol: event.sourceProtocol,
    sourcePool: event.sourcePool,
    asset: event.asset,
    counterAsset: event.counterAsset,
    usdValue: event.usdValue,
    eventType: event.eventType,
    detectedAt: event.detectedAt,
    rawEventJson: event.rawEventJson
  });
  const enrichedEvent = { ...event, dataHash, reasoningHash };

  const chainResult = await commitSignalOnChain({
    signalType: analysis.signalType,
    asset: candidate.asset,
    reasoningHash,
    dataHash,
    confidence: analysis.confidence,
    prediction: analysis.prediction,
    evaluationTime: analysis.evaluationTime
  });
  const proofNetwork = getProofNetworkConfig();

  const signal = await createSignal({
    chainSignalId: chainResult.chainSignalId,
    signalType: analysis.signalType,
    asset: candidate.asset,
    wallet: candidate.wallet,
    pool: candidate.pool,
    marketDataMode: event.marketDataMode,
    sourceChain: event.sourceChain,
    sourceTxHash: event.sourceTxHash,
    sourceBlockNumber: event.sourceBlockNumber,
    sourceWallet: event.sourceWallet,
    sourceProtocol: event.sourceProtocol,
    sourcePool: event.sourcePool,
    counterAsset: event.counterAsset,
    usdValue: event.usdValue,
    sourceEventType: event.eventType,
    detectedAt: new Date(event.detectedAt),
    rawEventJson: event.rawEventJson,
    confidence: analysis.confidence,
    prediction: analysis.prediction,
    aiSummary: analysis.aiSummary,
    reasoning: analysis.reasoning,
    sourceDataJson: JSON.stringify(enrichedEvent, null, 2),
    reasoningHash,
    dataHash,
    status: "Pending",
    outcome: "Unknown",
    commitTxHash: chainResult.txHash,
    commitBlockNumber: chainResult.blockNumber ? String(chainResult.blockNumber) : null,
    committedAt: chainResult.committedAt || new Date(),
    contractAddress: config.signalRegistryAddress || null,
    chainMode: config.chainMode,
    chainId: proofNetwork.chainId,
    proofNetwork: proofNetwork.proofNetwork,
    proofNetworkKey: currentProofNetworkKey(),
    evaluationTime: analysis.evaluationTime
  });

  await sendSignalAlert(signal);

  return { signal, event: enrichedEvent, mockedChain: chainResult.mocked, marketDataSource: marketDataSource.label };
}
