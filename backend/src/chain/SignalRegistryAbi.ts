export const signalRegistryAbi = [
  "function commitSignal(string signalType,string asset,bytes32 reasoningHash,bytes32 dataHash,uint8 confidence,int8 prediction,uint256 evaluationTime) returns (uint256)",
  "function resolveSignal(uint256 signalId,uint8 outcome)",
  "function getSignal(uint256 signalId) view returns (tuple(uint256 id,address agent,string signalType,string asset,bytes32 reasoningHash,bytes32 dataHash,uint8 confidence,int8 prediction,uint256 createdAt,uint256 evaluationTime,uint8 status,uint8 outcome))",
  "function getSignalsCount() view returns (uint256)",
  "event SignalCommitted(uint256 indexed signalId,address indexed agent,string signalType,string asset,uint8 confidence,int8 prediction,uint256 evaluationTime)",
  "event SignalResolved(uint256 indexed signalId,address indexed agent,uint8 outcome)"
] as const;
