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
    let message = `API request failed: ${response.status}`;
    try {
      const body = (await response.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      // Keep the generic HTTP message.
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

function buildQuery(options: { showAllRecords?: boolean; showAllNetworks?: boolean } = {}) {
  const params = new URLSearchParams();
  if (options.showAllRecords) params.set("records", "all");
  if (options.showAllNetworks) params.set("network", "all");
  const query = params.toString();
  return query ? `?${query}` : "";
}

export async function getSignals(options: { showAllRecords?: boolean; showAllNetworks?: boolean } = {}): Promise<Signal[]> {
  try {
    return await apiFetch<Signal[]>(`/api/signals${buildQuery(options)}`);
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

export async function getStats(options: { showAllRecords?: boolean; showAllNetworks?: boolean } = {}): Promise<AgentStats> {
  try {
    return await apiFetch<AgentStats>(`/api/agent/stats${buildQuery(options)}`);
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
      worstSignalType: null,
      hasSignalDiversity: false
    };
  }
}

export async function getRuntimeStatus(): Promise<RuntimeStatus> {
  try {
    return await apiFetch<RuntimeStatus>("/api/runtime");
  } catch {
    return {
      chainMode: "unknown",
      marketDataMode: "demo",
      chainModeLabel: "backend unavailable",
      proofNetwork: "Unknown",
      proofNetworkLabel: "Backend unavailable",
      marketDataSource: "Unavailable",
      isMock: true,
      isOnChain: false,
      rpcTarget: "unavailable",
      signalRegistryAddress: null,
      chainId: 0,
      currentProofNetworkKey: "unknown:0:unconfigured",
      hasAgentPrivateKey: false,
      liveMainnetConfigured: false,
      proofExplorerUrl: null,
      contractExplorerUrl: null,
      txExplorerBaseUrl: null,
      explorerEnabled: false,
      lastSourceEvent: null,
      lastProofTx: null
    };
  }
}

export async function createDemoSignal(): Promise<CreateDemoResponse> {
  return apiFetch<CreateDemoResponse>("/api/demo/create-signal", { method: "POST", body: "{}" });
}

export async function resolvePendingSignals(): Promise<ResolvePendingResponse> {
  return apiFetch<ResolvePendingResponse>("/api/demo/resolve-pending", { method: "POST", body: "{}" });
}
