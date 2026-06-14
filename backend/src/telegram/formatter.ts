import type { Signal } from "../generated/prisma/index.js";
import { chainRuntimeStatus, config, getProofNetworkConfig, shouldUseMockChain } from "../config.js";
import type { TelegramLinkSet } from "./types.js";

type AgentStats = {
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
};

function cleanBaseUrl(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed.replace(/\/+$/, "") : "";
}

function isPrivateHost(hostname: string) {
  const host = hostname.toLowerCase();
  if (host === "localhost" || host === "::1" || host.endsWith(".local")) return true;
  if (host === "127.0.0.1" || host.startsWith("127.")) return true;
  if (host === "0.0.0.0") return true;
  if (host.startsWith("10.")) return true;
  if (host.startsWith("192.168.")) return true;
  const private172 = host.match(/^172\.(1[6-9]|2\d|3[0-1])\./);
  return Boolean(private172);
}

export function isPublicAppUrl(url: string | undefined) {
  const trimmed = cleanBaseUrl(url || "");
  if (!trimmed) return false;

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "https:" && !isPrivateHost(parsed.hostname);
  } catch {
    return false;
  }
}

function optionalText(value: string | number | null | undefined, fallback = "n/a") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

export function escapeHtml(value: unknown) {
  return optionalText(value as string | number | null | undefined)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function shortenHash(hash: string | null | undefined) {
  if (!hash) return "n/a";
  if (hash.length <= 18) return hash;
  return `${hash.slice(0, 8)}...${hash.slice(-6)}`;
}

export function formatUsd(value: number | null | undefined) {
  if (value === null || value === undefined) return "n/a";
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

function normalizeAssetPart(value: string | null | undefined) {
  const trimmed = value?.trim();
  if (!trimmed || trimmed.toLowerCase() === "n/a") return "";
  return trimmed;
}

function uniqueParts(parts: string[]) {
  const seen = new Set<string>();
  const result = [];

  for (const part of parts) {
    const key = part.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(part);
  }

  return result;
}

export function formatAssetOrPair(signal: Pick<Signal, "asset" | "counterAsset">) {
  const asset = normalizeAssetPart(signal.asset);
  const counterAsset = normalizeAssetPart(signal.counterAsset);

  if (asset.includes("/")) {
    const parts = uniqueParts(asset.split("/").map(normalizeAssetPart).filter(Boolean));
    if (parts.length >= 2) return `Pair: <b>${escapeHtml(`${parts[0]}/${parts[1]}`)}</b>`;
    if (parts.length === 1) return `Asset: <b>${escapeHtml(parts[0])}</b>`;
  }

  if (asset && counterAsset && asset.toLowerCase() !== counterAsset.toLowerCase()) {
    return `Pair: <b>${escapeHtml(`${asset}/${counterAsset}`)}</b>`;
  }

  return `Asset: <b>${escapeHtml(asset || counterAsset || "n/a")}</b>`;
}

function predictionLabel(prediction: number) {
  if (prediction > 0) return "Bullish / momentum";
  if (prediction < 0) return "Bearish / risk";
  return "Neutral / monitor";
}

export function formatStatus(status: string | null | undefined, outcome: string | null | undefined) {
  if (status === "Pending") return "Pending outcome";
  if (outcome && outcome !== "Unknown") return outcome;
  return optionalText(status, "Unknown");
}

export function formatEvaluationTime(evaluationTime: Date | string | null | undefined) {
  if (!evaluationTime) return "not scheduled";
  const date = evaluationTime instanceof Date ? evaluationTime : new Date(evaluationTime);
  if (Number.isNaN(date.getTime())) return "not scheduled";

  const diffMs = date.getTime() - Date.now();
  if (diffMs <= 0) return "Evaluation due · waiting for outcome resolution";

  const minutes = Math.ceil(diffMs / 60_000);
  if (minutes < 60) return `in ${minutes} minute${minutes === 1 ? "" : "s"}`;

  const hours = Math.ceil(minutes / 60);
  if (hours < 48) return `in ${hours} hour${hours === 1 ? "" : "s"}`;

  const days = Math.ceil(hours / 24);
  return `in ${days} day${days === 1 ? "" : "s"}`;
}

function sourceLabel(signal: Pick<Signal, "marketDataMode" | "sourceChain">) {
  if (signal.marketDataMode === "historical_mainnet") return "Historical Mantle mainnet event";
  if (signal.marketDataMode === "live_mainnet") return "Live Mantle mainnet event";
  return signal.sourceChain || signal.marketDataMode || "Demo event";
}

export function buildExplorerTxUrl(txHash: string | null | undefined) {
  const proof = getProofNetworkConfig();
  if (!txHash || !proof.explorerUrl || shouldUseMockChain()) return undefined;
  return `${proof.explorerUrl.replace(/\/+$/, "")}/tx/${txHash}`;
}

export function buildDashboardSignalUrl(signalId: number) {
  const appUrl = cleanBaseUrl(config.publicAppUrl);
  return isPublicAppUrl(appUrl) ? `${appUrl}/signals/${signalId}` : undefined;
}

export function buildDashboardUrl() {
  const appUrl = cleanBaseUrl(config.publicAppUrl);
  return isPublicAppUrl(appUrl) ? `${appUrl}/dashboard` : undefined;
}

export function buildReputationUrl() {
  const appUrl = cleanBaseUrl(config.publicAppUrl);
  return isPublicAppUrl(appUrl) ? `${appUrl}/reputation` : undefined;
}

export function getTelegramLinks(signal?: Pick<Signal, "id" | "commitTxHash" | "resolveTxHash">): TelegramLinkSet {
  return {
    proofTxUrl: buildExplorerTxUrl(signal?.commitTxHash),
    resolveTxUrl: buildExplorerTxUrl(signal?.resolveTxHash),
    dashboardUrl: buildDashboardUrl(),
    reputationUrl: buildReputationUrl(),
    dashboardSignalUrl: signal ? buildDashboardSignalUrl(signal.id) : undefined
  };
}

function proofTxText(signal: Signal) {
  const proof = getProofNetworkConfig();
  if (shouldUseMockChain() || signal.chainMode === "mock") return "Mock proof";
  if (signal.commitTxHash && !proof.explorerUrl) return "Local Hardhat transaction, explorer unavailable";
  if (signal.commitTxHash) return shortenHash(signal.commitTxHash);
  return "Local Hardhat transaction, explorer unavailable";
}

function resolveTxText(signal: Signal) {
  const proof = getProofNetworkConfig();
  if (shouldUseMockChain() || signal.chainMode === "mock") return "Mock proof";
  if (signal.resolveTxHash && !proof.explorerUrl) return "Local Hardhat transaction, explorer unavailable";
  if (signal.resolveTxHash) return shortenHash(signal.resolveTxHash);
  return "Local Hardhat transaction, explorer unavailable";
}

function contractSignalId(signal: Pick<Signal, "chainSignalId">) {
  return signal.chainSignalId === null || signal.chainSignalId === undefined ? "pending / unavailable" : `#${signal.chainSignalId}`;
}

function proofNetworkLabel(signal: Pick<Signal, "proofNetwork" | "chainMode">) {
  const proof = getProofNetworkConfig();
  if (shouldUseMockChain() || signal.chainMode === "mock") return "Mock proof";
  return signal.proofNetwork || proof.proofNetwork;
}

function contractAddressLabel(address: string | null | undefined) {
  if (!address) return "n/a";
  return shortenHash(address);
}

export function formatStartMessage() {
  return [
    "AlphaProof watches Mantle market events and commits AI signals on-chain before outcomes are known.",
    "",
    "No trading. No custody. Not financial advice.",
    "",
    "Use /subscribe to enable alerts, or connect from the AlphaProof dashboard.",
    "Use /help for commands."
  ].join("\n");
}

export function formatHelpMessage() {
  return [
    "<b>AlphaProof commands</b>",
    "",
    "/start - connect or start AlphaProof",
    "/latest - latest proof-backed signal",
    "/pending - pending signal committed before outcome",
    "/reputation - current agent reputation",
    "/signal &lt;id&gt; - signal details",
    "/status - subscription status",
    "/alerts on - enable alerts",
    "/alerts off - disable alerts",
    "/alerts status - show alert status",
    "/settings - alert settings",
    "/minconfidence 75 - set alert threshold",
    "/minconfidence off - remove threshold",
    "/subscribe - enable Telegram alerts",
    "/unsubscribe - disable alerts but keep connection",
    "/disconnect - unlink Telegram from AlphaProof",
    "/help - commands",
    "",
    "No trading. No custody. Not financial advice."
  ].join("\n");
}

export function formatTelegramConnectionTestAlert(alertsDisabled = false) {
  return [
    "✅ <b>AlphaProof Telegram alerts are connected.</b>",
    "",
    alertsDisabled ? "<b>Telegram connection works, but alerts are currently disabled.</b>" : null,
    alertsDisabled ? "Use /subscribe or /alerts on to re-enable signal alerts." : null,
    alertsDisabled ? "" : null,
    "You will receive proof-backed AI signals here when AlphaProof commits them on-chain.",
    "",
    "No trading. No custody. Not financial advice."
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
}

export function formatSignalAlert(signal: Signal) {
  const status = formatStatus(signal.status, signal.outcome);
  const lines = [
    "🚨 <b>AlphaProof Signal</b>",
    "",
    `<b>${escapeHtml(signal.signalType)}</b>`,
    formatAssetOrPair(signal),
    `Prediction: <b>${escapeHtml(predictionLabel(signal.prediction))}</b>`,
    `Confidence: <b>${signal.confidence}%</b>`,
    `Status: <b>${escapeHtml(status)}</b>`,
    "",
    "<b>Source</b>",
    escapeHtml(sourceLabel(signal)),
    `Event: <code>${escapeHtml(signal.sourceEventType)}</code>`,
    `Value: <b>${escapeHtml(formatUsd(signal.usdValue))}</b>`,
    "",
    "<b>Proof</b>",
    `Network: <b>${escapeHtml(proofNetworkLabel(signal))}</b>`,
    `DB Signal ID: <code>#${signal.id}</code>`,
    `Contract Signal ID: <code>${escapeHtml(contractSignalId(signal))}</code>`,
    `Tx: <code>${escapeHtml(proofTxText(signal))}</code>`
  ];

  if (signal.status === "Pending") {
    const evaluation = formatEvaluationTime(signal.evaluationTime);
    const evaluationLine = evaluation.startsWith("Evaluation due")
      ? `<b>${escapeHtml(evaluation)}</b>`
      : `Evaluation: <b>${escapeHtml(evaluation)}</b>`;
    lines.push("", evaluationLine, "Committed before outcome.");
  }

  lines.push("", "No trading. No custody. Not financial advice.");
  return lines.join("\n");
}

export function formatResolvedAlert(signal: Signal) {
  const outcome = formatStatus(signal.status, signal.outcome);
  const icon = outcome === "Failed" ? "❌" : outcome === "Inconclusive" ? "⚪" : "✅";

  return [
    `${icon} <b>AlphaProof Signal Resolved</b>`,
    "",
    `Type: <b>${escapeHtml(signal.signalType)}</b>`,
    formatAssetOrPair(signal),
    `Prediction: <b>${escapeHtml(predictionLabel(signal.prediction))}</b>`,
    `Confidence: <b>${signal.confidence}%</b>`,
    "",
    `DB Signal ID: <code>#${signal.id}</code>`,
    `Contract Signal ID: <code>${escapeHtml(contractSignalId(signal))}</code>`,
    `Outcome: <b>${escapeHtml(outcome)}</b>`,
    "",
    `Resolve tx: <code>${escapeHtml(resolveTxText(signal))}</code>`,
    "",
    "Reputation updated."
  ].join("\n");
}

export function formatSignalDetails(signal: Signal) {
  return formatSignalAlert(signal);
}

export function formatLatestSignal(signal: Signal) {
  return formatSignalAlert(signal);
}

export function formatReputation(stats: AgentStats) {
  const runtime = chainRuntimeStatus();
  const lastUpdated = new Date().toLocaleString("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });

  return [
    "📊 <b>AlphaProof Reputation</b>",
    "",
    `Network: <b>${escapeHtml(runtime.proofNetwork)}</b>`,
    `Contract: <code>${escapeHtml(contractAddressLabel(runtime.signalRegistryAddress))}</code>`,
    "",
    `Total signals: <b>${stats.totalSignals}</b>`,
    `Resolved: <b>${stats.resolvedSignals}</b>`,
    `Pending: <b>${stats.pendingSignals}</b>`,
    `Correct: <b>${stats.correct}</b>`,
    `Failed: <b>${stats.failed}</b>`,
    `Inconclusive: <b>${stats.inconclusive}</b>`,
    "",
    `Accuracy: <b>${stats.accuracy}%</b>`,
    `Avg confidence: <b>${stats.averageConfidence}%</b>`,
    "",
    `Best type: <b>${escapeHtml(stats.bestSignalType || "n/a")}</b>`,
    `Weakest type: <b>${escapeHtml(stats.worstSignalType || "n/a")}</b>`,
    "",
    "Accuracy excludes inconclusive signals.",
    "Stats scoped to current proof network.",
    `Last updated: <b>${escapeHtml(lastUpdated)} UTC</b>`
  ].join("\n");
}
