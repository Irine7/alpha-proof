import type { AiAnalysis, MarketEvent, SignalCandidate } from "../../types.js";

function predictionText(prediction: -1 | 0 | 1) {
  if (prediction === 1) return "possible upward volatility";
  if (prediction === -1) return "possible downside or liquidity risk";
  return "heightened monitoring without a directional edge";
}

export function analyzeWithMockAi(event: MarketEvent, candidate: SignalCandidate): AiAnalysis {
  const sizeScore = Math.min(18, Math.floor(event.usdValue / 25000));
  const activityScore = Math.min(10, (event.txCount || 1) * 2);
  const confidence = Math.min(94, 58 + sizeScore + activityScore);
  const windowMinutes = event.kind === "liquidity_removal" || event.kind === "exit_risk" ? 20 : 30;
  const evaluationTime = new Date(Date.now() + windowMinutes * 60 * 1000);

  const aiSummary = `A ${event.sourceProtocol || "Mantle"} source event flagged <span class="text-mantle font-medium">${event.asset}</span> as ${candidate.signalType.toLowerCase()} with about <span class="text-mantle font-medium">$${event.usdValue.toLocaleString()}</span> in observed activity.`;

  const reasoning = [
    `Demo AI analysis for ${candidate.signalType}.`,
    `Observed event: ${event.notes}`,
    `Market source: ${event.marketDataMode} on ${event.sourceChain}.`,
    `Source event: ${event.eventType} on ${event.sourceProtocol || "unknown protocol"} / ${event.sourcePool || "unknown pool"} at block ${event.sourceBlockNumber}.`,
    `The detector classified this as ${candidate.signalType} because the transaction size and activity pattern exceed the configured source baseline.`,
    `Prediction: ${predictionText(candidate.prediction)} during the next ${windowMinutes}-minute evaluation window.`,
    `This is a hackathon demo signal, not financial advice. The important guarantee is accountability: the reasoning hash and source-data hash are committed before the outcome is resolved.`
  ].join("\n\n");

  return {
    signalType: candidate.signalType,
    confidence,
    prediction: candidate.prediction,
    aiSummary,
    reasoning,
    evaluationTime
  };
}
