import { config } from "../../config.js";
import type { AiAnalysis, DemoEvent, SignalCandidate } from "../../types.js";
import { analyzeWithMockAi } from "./mockAnalyzer.js";

export async function analyzeSignal(event: DemoEvent, candidate: SignalCandidate): Promise<AiAnalysis> {
  if (config.aiProvider !== "mock") {
    console.warn(`AI_PROVIDER=${config.aiProvider} is not implemented yet; using deterministic mock analyzer.`);
  }

  return analyzeWithMockAi(event, candidate);
}
