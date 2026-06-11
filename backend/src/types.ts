export type ChainMode = "local" | "testnet" | "mainnet" | "mock" | "auto" | "onchain" | "real";

export type MarketDataMode = "demo" | "historical_mainnet" | "live_mainnet";

export type MarketEventType =
  | "large_swap"
  | "repeated_buys"
  | "liquidity_removal"
  | "tracked_wallet_action"
  | "volume_spike"
  | "exit_risk"
  | "whale_transfer";

export type DemoEventKind = MarketEventType;

export type Prediction = -1 | 0 | 1;

export type SignalStatus = "Pending" | "Resolved";

export type SignalOutcome = "Unknown" | "Correct" | "Failed" | "Inconclusive";

export type MarketEvent = {
  id: string;
  kind: MarketEventType;
  marketDataMode: MarketDataMode;
  sourceChain: string;
  sourceTxHash: string;
  sourceBlockNumber: string;
  sourceWallet?: string;
  sourceProtocol?: string;
  sourcePool?: string;
  asset: string;
  counterAsset?: string;
  usdValue: number | null;
  usdValueNote?: string;
  eventType: string;
  detectedAt: string;
  rawEventJson: string;
  dataHash?: string;
  reasoningHash?: string;
  wallet?: string;
  pool?: string;
  amountUsd: number;
  txCount?: number;
  direction?: "buy" | "sell" | "remove" | "deposit" | "withdraw";
  observedAt: string;
  txHash: string;
  notes: string;
};

export type DemoEvent = MarketEvent;

export interface MarketDataSource {
  mode: MarketDataMode;
  label: string;
  getNextMarketEvent(kind?: MarketEventType): Promise<MarketEvent>;
}

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
  blockNumber?: number;
  committedAt?: Date;
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
