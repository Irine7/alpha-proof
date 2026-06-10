import type { AgentStats, CreateDemoResponse, ResolvePendingResponse, RuntimeStatus, Signal } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers
    }
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function getSignals(): Promise<Signal[]> {
  try {
    return await apiFetch<Signal[]>("/api/signals");
  } catch {
    return [];
  }
}

export async function getSignal(id: string): Promise<Signal | null> {
  try {
    return await apiFetch<Signal>(`/api/signals/${id}`);
  } catch {
    return null;
  }
}

export async function getStats(): Promise<AgentStats> {
  try {
    return await apiFetch<AgentStats>("/api/agent/stats");
  } catch {
    return {
      totalSignals: 0,
      resolvedSignals: 0,
      pendingSignals: 0,
      correct: 0,
      failed: 0,
      inconclusive: 0,
      accuracy: 0,
      averageConfidence: 0,
      bestSignalType: null,
      worstSignalType: null
    };
  }
}

export async function getRuntimeStatus(): Promise<RuntimeStatus> {
  try {
    return await apiFetch<RuntimeStatus>("/api/runtime");
  } catch {
    return {
      chainMode: "unknown",
      chainModeLabel: "backend unavailable",
      isMock: true,
      isOnChain: false,
      rpcTarget: "unavailable",
      signalRegistryAddress: null,
      hasAgentPrivateKey: false
    };
  }
}

export async function createDemoSignal(): Promise<CreateDemoResponse> {
  return apiFetch<CreateDemoResponse>("/api/demo/create-signal", { method: "POST", body: "{}" });
}

export async function resolvePendingSignals(): Promise<ResolvePendingResponse> {
  return apiFetch<ResolvePendingResponse>("/api/demo/resolve-pending", { method: "POST", body: "{}" });
}
