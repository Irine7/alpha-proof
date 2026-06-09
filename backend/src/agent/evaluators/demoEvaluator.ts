import type { Signal } from "../../generated/prisma/index.js";
import { resolveSignalOnChain } from "../../chain/client.js";
import { getPendingSignals, markSignalResolved } from "../../db/signals.js";
import type { SignalOutcome } from "../../types.js";

function chooseDemoOutcome(signal: Signal): SignalOutcome {
  const basis = signal.confidence + signal.id + signal.signalType.length;
  if (basis % 7 === 0) return "Inconclusive";
  if (signal.confidence >= 78 || basis % 2 === 0) return "Correct";
  return "Failed";
}

export async function resolvePendingDemoSignals() {
  const pending = await getPendingSignals();
  const results = [];

  for (const signal of pending) {
    const outcome = chooseDemoOutcome(signal);
    const chainResult = await resolveSignalOnChain(signal.chainSignalId ?? signal.id, outcome);
    const updated = await markSignalResolved(signal.id, outcome, chainResult.txHash);
    results.push({ signal: updated, mocked: chainResult.mocked });
  }

  return results;
}
