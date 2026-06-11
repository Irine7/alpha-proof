import type { Signal } from "./types";

export function isProofReadySignal(signal: Signal) {
  return Boolean(
    signal.sourceEventType &&
      signal.usdValue !== null &&
      (signal.sourceChain || signal.marketDataMode) &&
      signal.dataHash &&
      signal.reasoningHash &&
      signal.commitTxHash &&
      signal.chainSignalId !== null
  );
}
