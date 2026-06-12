import type { Prisma } from "../generated/prisma/index.js";
import { currentProofNetworkKey } from "../config.js";
import { prisma } from "./prisma.js";

const proofReadyWhere: Prisma.SignalWhereInput = {
  sourceEventType: { not: null },
  usdValue: { not: null },
  OR: [{ sourceChain: { not: null } }, { marketDataMode: { not: "" } }],
  dataHash: { not: "" },
  reasoningHash: { not: "" },
  commitTxHash: { not: null },
  chainSignalId: { not: null }
};

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

export function proofReadyFilter() {
  return proofReadyWhere;
}

function currentNetworkWhere(currentNetworkOnly = true): Prisma.SignalWhereInput | undefined {
  if (!currentNetworkOnly) return undefined;
  return { proofNetworkKey: currentProofNetworkKey() };
}

function signalWhere(options: { proofReadyOnly?: boolean; currentNetworkOnly?: boolean } = {}): Prisma.SignalWhereInput | undefined {
  const filters = [
    options.proofReadyOnly ?? true ? proofReadyWhere : undefined,
    currentNetworkWhere(options.currentNetworkOnly ?? true)
  ].filter(Boolean) as Prisma.SignalWhereInput[];

  if (!filters.length) return undefined;
  if (filters.length === 1) return filters[0];
  return { AND: filters };
}

function sortLatestSignals<T extends { status: string; createdAt: Date; updatedAt: Date; evaluationTime: Date }>(signals: T[]) {
  return [...signals].sort((a, b) => {
    if (a.status !== b.status) return a.status === "Pending" ? -1 : 1;
    const left = a.status === "Pending" ? a.createdAt : a.updatedAt;
    const right = b.status === "Pending" ? b.createdAt : b.updatedAt;
    return right.getTime() - left.getTime();
  });
}

export function isProofReadyRecord(signal: {
  sourceEventType: string | null;
  usdValue: number | null;
  sourceChain: string | null;
  marketDataMode: string | null;
  dataHash: string | null;
  reasoningHash: string | null;
  commitTxHash: string | null;
  chainSignalId: number | null;
}) {
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

export async function getLatestSignals(limit = 25, options: { proofReadyOnly?: boolean; currentNetworkOnly?: boolean } = {}) {
  const proofReadyOnly = options.proofReadyOnly ?? true;
  const signals = await withDbRetry(() =>
    prisma.signal.findMany({
      where: signalWhere({ proofReadyOnly, currentNetworkOnly: options.currentNetworkOnly ?? true }),
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: Math.max(limit * 3, limit)
    })
  );
  return sortLatestSignals(signals).slice(0, limit);
}

export async function getSignalById(id: number) {
  return withDbRetry(() => prisma.signal.findUnique({ where: { id } }));
}

export async function getSignalByContractId(chainSignalId: number, options: { currentNetworkOnly?: boolean } = {}) {
  return withDbRetry(() =>
    prisma.signal.findFirst({
      where: {
        AND: [
          { chainSignalId },
          proofReadyWhere,
          currentNetworkWhere(options.currentNetworkOnly ?? true)
        ].filter(Boolean) as Prisma.SignalWhereInput[]
      },
      orderBy: { createdAt: "desc" }
    })
  );
}

export async function getPendingSignals(options: { currentNetworkOnly?: boolean } = {}) {
  return withDbRetry(() =>
    prisma.signal.findMany({
      where: {
        AND: [{ status: "Pending" }, currentNetworkWhere(options.currentNetworkOnly ?? true)].filter(Boolean) as Prisma.SignalWhereInput[]
      },
      orderBy: { createdAt: "asc" }
    })
  );
}

export async function getLatestPendingSignal(options: { currentNetworkOnly?: boolean } = {}) {
  return withDbRetry(() =>
    prisma.signal.findFirst({
      where: {
        AND: [{ status: "Pending" }, currentNetworkWhere(options.currentNetworkOnly ?? true)].filter(Boolean) as Prisma.SignalWhereInput[]
      },
      orderBy: { createdAt: "desc" }
    })
  );
}

export async function getPendingSignalById(id: number, options: { currentNetworkOnly?: boolean } = {}) {
  return withDbRetry(() =>
    prisma.signal.findFirst({
      where: {
        AND: [{ id }, { status: "Pending" }, currentNetworkWhere(options.currentNetworkOnly ?? true)].filter(Boolean) as Prisma.SignalWhereInput[]
      }
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

export async function getAgentStats(options: { proofReadyOnly?: boolean; currentNetworkOnly?: boolean } = {}) {
  const proofReadyOnly = options.proofReadyOnly ?? true;
  const signals = await withDbRetry(() =>
    prisma.signal.findMany({
      where: signalWhere({ proofReadyOnly, currentNetworkOnly: options.currentNetworkOnly ?? true })
    })
  );
  const totalSignals = signals.length;
  const resolved = signals.filter((signal) => signal.status === "Resolved");
  const correct = resolved.filter((signal) => signal.outcome === "Correct").length;
  const failed = resolved.filter((signal) => signal.outcome === "Failed").length;
  const inconclusive = resolved.filter((signal) => signal.outcome === "Inconclusive").length;
  const confidenceTotal = signals.reduce((sum, signal) => sum + signal.confidence, 0);
  const averageConfidence = totalSignals ? Math.round(confidenceTotal / totalSignals) : 0;
  const accuracy = correct + failed ? Math.round((correct / (correct + failed)) * 100) : 0;

  const byType = new Map<string, { total: number; correct: number; failed: number; inconclusive: number }>();
  for (const signal of signals) {
    const current = byType.get(signal.signalType) || { total: 0, correct: 0, failed: 0, inconclusive: 0 };
    current.total += 1;
    if (signal.outcome === "Correct") current.correct += 1;
    if (signal.outcome === "Failed") current.failed += 1;
    if (signal.outcome === "Inconclusive") current.inconclusive += 1;
    byType.set(signal.signalType, current);
  }

  const ranked = [...byType.entries()]
    .map(([signalType, value]) => ({
      signalType,
      accuracy: value.correct + value.failed ? value.correct / (value.correct + value.failed) : 0,
      total: value.correct + value.failed
    }))
    .filter((entry) => entry.total > 0)
    .sort((a, b) => b.accuracy - a.accuracy || b.total - a.total || a.signalType.localeCompare(b.signalType));

  const hasSignalDiversity = ranked.length >= 2;
  const signalTypePerformance = [...byType.entries()]
    .map(([signalType, value]) => ({
      signalType,
      total: value.total,
      correct: value.correct,
      failed: value.failed,
      inconclusive: value.inconclusive,
      accuracy: value.correct + value.failed ? Math.round((value.correct / (value.correct + value.failed)) * 100) : 0
    }))
    .sort((a, b) => b.total - a.total || a.signalType.localeCompare(b.signalType));
  const latestResolvedSignals = [...resolved]
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, 6);

  return {
    totalSignals,
    resolvedSignals: resolved.length,
    pendingSignals: totalSignals - resolved.length,
    correct,
    failed,
    inconclusive,
    accuracy,
    averageConfidence,
    bestSignalType: hasSignalDiversity ? ranked[0]?.signalType || null : null,
    worstSignalType: hasSignalDiversity ? ranked.at(-1)?.signalType || null : null,
    hasSignalDiversity,
    outcomeDistribution: {
      correct,
      failed,
      inconclusive,
      pending: totalSignals - resolved.length
    },
    signalTypePerformance,
    latestResolvedSignals
  };
}
