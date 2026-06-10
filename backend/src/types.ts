export type DemoEventKind = "large_swap" | "repeated_buys" | "liquidity_removal" | "tracked_wallet_action";

export type Prediction = -1 | 0 | 1;

export type SignalStatus = "Pending" | "Resolved";

export type SignalOutcome = "Unknown" | "Correct" | "Failed" | "Inconclusive";

export type DemoEvent = {
  id: string;
  kind: DemoEventKind;
  asset: string;
  wallet?: string;
  pool?: string;
  amountUsd: number;
  txCount?: number;
  direction?: "buy" | "sell" | "remove" | "deposit" | "withdraw";
  observedAt: string;
  txHash: string;
  notes: string;
};

export type SignalCandidate = {
  signalType: string;
  asset: string;
  wallet?: string;
  pool?: string;
  prediction: Prediction;
};

export type AiAnalysis = {
  signalType: string;
  confidence: number;
  prediction: Prediction;
  aiSummary: string;
  reasoning: string;
  evaluationTime: Date;
};

export type ChainCommitResult = {
  chainSignalId: number;
  txHash: string;
  mocked: boolean;
};

export type ChainResolveResult = {
  txHash: string;
  mocked: boolean;
};

export type ChainSignalRead = {
  id: number;
  signalType: string;
  asset: string;
  reasoningHash: string;
  dataHash: string;
  confidence: number;
  prediction: number;
  status: SignalStatus;
  outcome: SignalOutcome;
};
