import type { Prisma } from "../generated/prisma/index.js";
import { prisma } from "./prisma.js";

async function withDbRetry<T>(operation: () => Promise<T>, attempts = 2): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const isTransientConnectionError =
      message.includes("Can't reach database server") ||
      message.includes("Timed out fetching a new connection") ||
      message.includes("Connection terminated unexpectedly");

    if (attempts <= 1 || !isTransientConnectionError) {
      throw error;
    }

    await new Promise((resolve) => setTimeout(resolve, 750));
    return withDbRetry(operation, attempts - 1);
  }
}

export async function createSignal(data: Prisma.SignalCreateInput) {
  return withDbRetry(() => prisma.signal.create({ data }));
}

export async function getLatestSignals(limit = 25) {
  return withDbRetry(() =>
    prisma.signal.findMany({
      orderBy: { createdAt: "desc" },
      take: limit
    })
  );
}

export async function getSignalById(id: number) {
  return withDbRetry(() => prisma.signal.findUnique({ where: { id } }));
}

export async function getPendingSignals() {
  return withDbRetry(() =>
    prisma.signal.findMany({
      where: { status: "Pending" },
      orderBy: { createdAt: "asc" }
    })
  );
}

export async function markSignalResolved(id: number, outcome: string, resolveTxHash?: string | null) {
  return withDbRetry(() =>
    prisma.signal.update({
      where: { id },
      data: {
        status: "Resolved",
        outcome,
        ...(resolveTxHash ? { resolveTxHash } : {})
      }
    })
  );
}

export async function getAgentStats() {
  const signals = await withDbRetry(() => prisma.signal.findMany());
  const totalSignals = signals.length;
  const resolved = signals.filter((signal) => signal.status === "Resolved");
  const correct = resolved.filter((signal) => signal.outcome === "Correct").length;
  const failed = resolved.filter((signal) => signal.outcome === "Failed").length;
  const inconclusive = resolved.filter((signal) => signal.outcome === "Inconclusive").length;
  const confidenceTotal = signals.reduce((sum, signal) => sum + signal.confidence, 0);
  const averageConfidence = totalSignals ? Math.round(confidenceTotal / totalSignals) : 0;
  const accuracy = correct + failed ? Math.round((correct / (correct + failed)) * 100) : 0;

  const byType = new Map<string, { correct: number; failed: number }>();
  for (const signal of resolved) {
    const current = byType.get(signal.signalType) || { correct: 0, failed: 0 };
    if (signal.outcome === "Correct") current.correct += 1;
    if (signal.outcome === "Failed") current.failed += 1;
    byType.set(signal.signalType, current);
  }

  const ranked = [...byType.entries()]
    .map(([signalType, value]) => ({
      signalType,
      score: value.correct - value.failed,
      total: value.correct + value.failed
    }))
    .filter((entry) => entry.total > 0)
    .sort((a, b) => b.score - a.score);

  return {
    totalSignals,
    resolvedSignals: resolved.length,
    pendingSignals: totalSignals - resolved.length,
    correct,
    failed,
    inconclusive,
    accuracy,
    averageConfidence,
    bestSignalType: ranked[0]?.signalType || null,
    worstSignalType: ranked.at(-1)?.signalType || null
  };
}
