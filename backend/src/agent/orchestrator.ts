import { commitSignalOnChain } from "../chain/client.js";
import { createSignal } from "../db/signals.js";
import { sendSignalAlert } from "../telegram/bot.js";
import type { DemoEventKind } from "../types.js";
import { hashToBytes32 } from "../utils/hash.js";
import { analyzeSignal } from "./ai/index.js";
import { createDemoEvent } from "./detectors/demoEvents.js";
import { detectSignal } from "./detectors/detector.js";

export async function createDemoSignal(kind?: DemoEventKind) {
  const event = createDemoEvent(kind);
  const candidate = detectSignal(event);
  const analysis = await analyzeSignal(event, candidate);
  const reasoningHash = hashToBytes32(analysis.reasoning);
  const dataHash = hashToBytes32(event);

  const chainResult = await commitSignalOnChain({
    signalType: analysis.signalType,
    asset: candidate.asset,
    reasoningHash,
    dataHash,
    confidence: analysis.confidence,
    prediction: analysis.prediction,
    evaluationTime: analysis.evaluationTime
  });

  const signal = await createSignal({
    chainSignalId: chainResult.chainSignalId,
    signalType: analysis.signalType,
    asset: candidate.asset,
    wallet: candidate.wallet,
    pool: candidate.pool,
    confidence: analysis.confidence,
    prediction: analysis.prediction,
    aiSummary: analysis.aiSummary,
    reasoning: analysis.reasoning,
    sourceDataJson: JSON.stringify(event, null, 2),
    reasoningHash,
    dataHash,
    status: "Pending",
    outcome: "Unknown",
    commitTxHash: chainResult.txHash,
    evaluationTime: analysis.evaluationTime
  });

  await sendSignalAlert(signal);

  return { signal, event, mockedChain: chainResult.mocked };
}
