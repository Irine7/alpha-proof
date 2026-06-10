import type { Signal } from "../../generated/prisma/index.js";
import { readSignalOnChain, resolveSignalOnChain } from "../../chain/client.js";
import { getPendingSignals, markSignalResolved } from "../../db/signals.js";
import type { SignalOutcome } from "../../types.js";

function chooseDemoOutcome(signal: Signal): SignalOutcome {
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

export async function resolvePendingDemoSignals() {
  const pending = await getPendingSignals();
  const results = [];
  const skipped = [];

  for (const signal of pending) {
    const outcome = chooseDemoOutcome(signal);
    try {
      const chainResult = await resolveSignalOnChain(signal.chainSignalId ?? signal.id, outcome);
      const updated = await markSignalResolved(signal.id, outcome, chainResult.txHash);
      results.push({ signal: updated, mocked: chainResult.mocked });
    } catch (error) {
      if (isAlreadyResolvedError(error) && signal.chainSignalId !== null) {
        try {
          const chainSignal = await readSignalOnChain(signal.chainSignalId);
          if (chainSignal?.status === "Resolved" && chainSignal.outcome !== "Unknown") {
            const updated = await markSignalResolved(signal.id, chainSignal.outcome, signal.resolveTxHash);
            results.push({ signal: updated, mocked: false, synced: true });
            continue;
          }
        } catch {
          // Keep the original resolve error as the skipped reason below.
        }
      }

      skipped.push({
        signalId: signal.id,
        chainSignalId: signal.chainSignalId,
        reason: describeResolveError(error)
      });
    }
  }

  return { results, skipped };
}
