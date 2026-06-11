export type SignalStatus = "Pending" | "Resolved";
export type SignalOutcome = "Unknown" | "Correct" | "Failed" | "Inconclusive";

export type Signal = {
  id: number;
  chainSignalId: number | null;
  signalType: string;
  asset: string;
  wallet: string | null;
  pool: string | null;
  marketDataMode: string;
  sourceChain: string | null;
  sourceTxHash: string | null;
  sourceBlockNumber: string | null;
  sourceWallet: string | null;
  sourceProtocol: string | null;
  sourcePool: string | null;
  counterAsset: string | null;
  usdValue: number | null;
  sourceEventType: string | null;
  detectedAt: string | null;
  rawEventJson: string | null;
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
  commitBlockNumber: string | null;
  committedAt: string | null;
  contractAddress: string | null;
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
  hasSignalDiversity: boolean;
};

export type RuntimeStatus = {
  chainMode: string;
  marketDataMode: string;
  chainModeLabel: string;
  proofNetwork: string;
  proofNetworkLabel: string;
  marketDataSource: string;
  isMock: boolean;
  isOnChain: boolean;
  rpcTarget: string;
  signalRegistryAddress: string | null;
  hasAgentPrivateKey: boolean;
  proofExplorerUrl: string | null;
  contractExplorerUrl: string | null;
  txExplorerBaseUrl: string | null;
  lastSourceEvent: {
    eventType: string | null;
    asset: string;
    sourceChain: string | null;
    txHash: string | null;
    detectedAt: string | null;
  } | null;
  lastProofTx: string | null;
};

export type CreateDemoResponse = {
  signal: Signal;
  event: unknown;
  mockedChain: boolean;
  marketDataSource: string;
};

export type ResolvePendingResponse = {
  resolved: number;
  skipped: number;
  results: Array<{
    signal: Signal;
    mocked: boolean;
    synced?: boolean;
  }>;
  skippedSignals: Array<{
    signalId: number;
    chainSignalId: number | null;
    reason: string;
  }>;
};
