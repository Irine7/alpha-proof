import type { Signal } from "../../generated/prisma/index.js";
import { readSignalOnChain, resolveSignalOnChain } from "../../chain/client.js";
import { getLatestPendingSignal, getPendingSignalById, getPendingSignals, markSignalResolved } from "../../db/signals.js";
import { notifySignalResolved } from "../../telegram/notifier.js";
import type { SignalOutcome } from "../../types.js";

function chooseDemoOutcome(signal: Signal): SignalOutcome {
  if (signal.signalType === "Volume Spike") return "Correct";
  if (signal.signalType === "Liquidity Shock") return "Correct";
  if (signal.signalType === "Exit Risk") return "Failed";
  if (signal.signalType === "Smart Wallet Activity") return "Inconclusive";

  const basis = signal.confidence + signal.id + signal.signalType.length;
  if (basis % 7 === 0) return "Inconclusive";
  if (signal.confidence >= 78 || basis % 2 === 0) return "Correct";
  return "Failed";
}

function describeResolveError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes("0x4e89b5b4") || message.includes("SignalDoesNotExist")) {
    return "Signal does not exist on the configured chain. The local Hardhat node was probably restarted after this Neon record was created.";
  }

  if (message.includes("0x82cb314e") || message.includes("SignalAlreadyResolved")) {
    return "Signal is already resolved on the configured chain. Refresh the dashboard or check for stale Neon status.";
  }

  if (message.includes("No SignalRegistry contract found")) {
    return "SignalRegistry is not deployed at the configured address for the current RPC.";
  }

  return "Chain resolve failed. Check CHAIN_MODE, SIGNAL_REGISTRY_ADDRESS, MANTLE_RPC_URL, and the Hardhat node.";
}

function isAlreadyResolvedError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("0x82cb314e") || message.includes("SignalAlreadyResolved");
}

export type ResolvePendingDemoSignalsOptions = {
  signalId?: number;
  latestOnly?: boolean;
  resolveAll?: boolean;
  notify?: boolean;
};

async function resolveOnePendingSignal(signal: Signal, notify: boolean) {
  const outcome = chooseDemoOutcome(signal);
  try {
    const chainResult = await resolveSignalOnChain(signal.chainSignalId ?? signal.id, outcome);
    const updated = await markSignalResolved(signal.id, outcome, chainResult.txHash);
    if (notify) void notifySignalResolved(updated);
    return { result: { signal: updated, mocked: chainResult.mocked }, skipped: null };
  } catch (error) {
    if (isAlreadyResolvedError(error) && signal.chainSignalId !== null) {
      try {
        const chainSignal = await readSignalOnChain(signal.chainSignalId);
        if (chainSignal?.status === "Resolved" && chainSignal.outcome !== "Unknown") {
          const updated = await markSignalResolved(signal.id, chainSignal.outcome, signal.resolveTxHash);
          return { result: { signal: updated, mocked: false, synced: true }, skipped: null };
        }
      } catch {
        // Keep the original resolve error as the skipped reason below.
      }
    }

    return {
      result: null,
      skipped: {
        signalId: signal.id,
        chainSignalId: signal.chainSignalId,
        reason: describeResolveError(error)
      }
    };
  }
}

async function selectPendingSignals(options: ResolvePendingDemoSignalsOptions) {
  if (options.signalId !== undefined) {
    const signal = await getPendingSignalById(options.signalId);
    return signal ? [signal] : [];
  }

  if (options.resolveAll) {
    return getPendingSignals();
  }

  const latest = await getLatestPendingSignal();
  return latest ? [latest] : [];
}

export async function resolvePendingDemoSignals(options: ResolvePendingDemoSignalsOptions = {}) {
  const pending = await selectPendingSignals(options);
  const results = [];
  const skipped = [];

  if (!pending.length && options.signalId !== undefined) {
    skipped.push({
      signalId: options.signalId,
      chainSignalId: null,
      reason: "Pending signal was not found in the current proof network."
    });
  }

  for (const signal of pending) {
    const { result, skipped: skippedSignal } = await resolveOnePendingSignal(signal, options.notify ?? !options.resolveAll);
    if (result) results.push(result);
    if (skippedSignal) skipped.push(skippedSignal);
  }

  return { results, skipped };
}
