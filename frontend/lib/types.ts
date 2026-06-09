export type SignalStatus = "Pending" | "Resolved";
export type SignalOutcome = "Unknown" | "Correct" | "Failed" | "Inconclusive";

export type Signal = {
  id: number;
  chainSignalId: number | null;
  signalType: string;
  asset: string;
  wallet: string | null;
  pool: string | null;
  confidence: number;
  prediction: number;
  aiSummary: string;
  reasoning: string;
  sourceDataJson: string;
  reasoningHash: string;
  dataHash: string;
  status: SignalStatus;
  outcome: SignalOutcome;
  commitTxHash: string | null;
  resolveTxHash: string | null;
  createdAt: string;
  evaluationTime: string;
  updatedAt: string;
};

export type AgentStats = {
  totalSignals: number;
  resolvedSignals: number;
  pendingSignals: number;
  correct: number;
  failed: number;
  inconclusive: number;
  accuracy: number;
  averageConfidence: number;
  bestSignalType: string | null;
  worstSignalType: string | null;
};
