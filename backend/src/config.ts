import dotenv from "dotenv";
import { JsonRpcProvider } from "ethers";
import type { ChainMode, MarketDataMode } from "./types.js";

dotenv.config();

const DEFAULT_MANTLE_TESTNET_RPC_URL = "https://rpc.sepolia.mantle.xyz";
const DEFAULT_MANTLE_TESTNET_EXPLORER_URL = "https://explorer.sepolia.mantle.xyz";
export const MANTLE_SEPOLIA_CHAIN_ID = 5003;

function valueOrLegacy(primary: string | undefined, legacy: string | undefined) {
  return primary || legacy || "";
}

function redactRpcTarget(url: string) {
  if (!url) return "not configured";
  if (url.includes("127.0.0.1") || url.includes("localhost")) return "local Hardhat";

  try {
    const parsed = new URL(url);
    return parsed.host;
  } catch {
    return "configured RPC";
  }
}

function normalizeChainMode(value: string | undefined): ChainMode {
  const mode = (value || "local") as ChainMode;
  if (["local", "testnet", "mainnet", "mock", "auto", "onchain", "real"].includes(mode)) return mode;
  return "local";
}

function normalizeMarketDataMode(value: string | undefined): MarketDataMode {
  const mode = (value || "demo") as MarketDataMode;
  if (["demo", "historical_mainnet", "live_mainnet"].includes(mode)) return mode;
  return "demo";
}

function envFlag(value: string | undefined, defaultValue: boolean) {
  if (value === undefined || value === "") return defaultValue;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

export const config = {
  port: Number(process.env.PORT || 4000),
  databaseUrl: process.env.DATABASE_URL || "",
  chainMode: normalizeChainMode(process.env.CHAIN_MODE),
  marketDataMode: normalizeMarketDataMode(process.env.MARKET_DATA_MODE),
  signalRegistryAddress: process.env.SIGNAL_REGISTRY_ADDRESS || "",
  expectedChainId: Number(process.env.EXPECTED_CHAIN_ID || MANTLE_SEPOLIA_CHAIN_ID),
  mantleRpcUrl: valueOrLegacy(process.env.MANTLE_LOCAL_RPC_URL, process.env.MANTLE_RPC_URL) || "http://127.0.0.1:8545",
  mantleTestnetRpcUrl: process.env.MANTLE_TESTNET_RPC_URL || DEFAULT_MANTLE_TESTNET_RPC_URL,
  mantleTestnetExplorerUrl: process.env.MANTLE_TESTNET_EXPLORER_URL || DEFAULT_MANTLE_TESTNET_EXPLORER_URL,
  mantleMainnetRpcUrl: process.env.MANTLE_MAINNET_RPC_URL || "",
  mantleMainnetExplorerUrl: process.env.MANTLE_MAINNET_EXPLORER_URL || "",
  liveScanBlockWindow: Math.max(1, Number(process.env.LIVE_SCAN_BLOCK_WINDOW || 100)),
  liveTransferThresholdUnits: process.env.LIVE_TRANSFER_THRESHOLD_UNITS || "",
  trackedTokenAddresses: (process.env.TRACKED_TOKEN_ADDRESSES || "")
    .split(",")
    .map((address) => address.trim())
    .filter(Boolean),
  agentPrivateKey: process.env.AGENT_PRIVATE_KEY || "",
  telegramEnabled: envFlag(process.env.TELEGRAM_ENABLED, false),
  telegramMode: (process.env.TELEGRAM_MODE || "polling").toLowerCase() === "webhook" ? "webhook" : "polling",
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || "",
  telegramBotUsername: process.env.TELEGRAM_BOT_USERNAME || "",
  telegramChatId: process.env.TELEGRAM_CHAT_ID || "",
  telegramAdminAlerts: envFlag(process.env.TELEGRAM_ADMIN_ALERTS, false),
  telegramAlertsOnCreate: envFlag(process.env.TELEGRAM_ALERTS_ON_CREATE, true),
  telegramAlertsOnResolve: envFlag(process.env.TELEGRAM_ALERTS_ON_RESOLVE, true),
  telegramAlertsForBulk: envFlag(process.env.TELEGRAM_ALERTS_FOR_BULK, false),
  telegramAllowDemoCommand: envFlag(process.env.TELEGRAM_ALLOW_DEMO_COMMAND, false),
  telegramAllowedDemoChatIds: (process.env.TELEGRAM_ALLOWED_DEMO_CHAT_IDS || "")
    .split(",")
    .map((chatId) => chatId.trim())
    .filter(Boolean),
  telegramWebhookUrl: process.env.TELEGRAM_WEBHOOK_URL || "",
  telegramWebhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET || "",
  telegramWebhookPath: process.env.TELEGRAM_WEBHOOK_PATH || "/api/telegram/webhook",
  publicAppUrl: process.env.PUBLIC_APP_URL || "",
  aiProvider: process.env.AI_PROVIDER || "mock",
  mantleExplorerUrl: process.env.MANTLE_EXPLORER_URL || DEFAULT_MANTLE_TESTNET_EXPLORER_URL
};

export function isExplicitOnChainMode() {
  return ["local", "testnet", "mainnet", "onchain", "real"].includes(config.chainMode);
}

export function getProofNetworkConfig() {
  if (config.chainMode === "testnet") {
    return {
      mode: "testnet",
      proofNetwork: "Mantle Sepolia Testnet",
      proofNetworkLabel: "Mantle Sepolia Testnet contract",
      rpcUrl: config.mantleTestnetRpcUrl,
      explorerUrl: config.mantleTestnetExplorerUrl,
      chainId: MANTLE_SEPOLIA_CHAIN_ID
    };
  }

  if (config.chainMode === "mainnet" || config.chainMode === "real") {
    return {
      mode: "mainnet",
      proofNetwork: "Mantle Mainnet",
      proofNetworkLabel: "Mantle Mainnet contract",
      rpcUrl: config.mantleMainnetRpcUrl,
      explorerUrl: config.mantleMainnetExplorerUrl,
      chainId: 5000
    };
  }

  return {
    mode: "local",
    proofNetwork: "Local Hardhat",
    proofNetworkLabel: "Local Hardhat contract",
    rpcUrl: config.mantleRpcUrl,
    explorerUrl: "",
    chainId: 31337
  };
}

export function currentProofNetworkKey() {
  const proof = getProofNetworkConfig();
  const contractAddress = config.signalRegistryAddress || "unconfigured";
  return `${config.chainMode}:${proof.chainId}:${contractAddress.toLowerCase()}`;
}

export function hasChainEnv() {
  if (config.chainMode === "mock") return false;
  const proof = getProofNetworkConfig();
  return Boolean(config.signalRegistryAddress && proof.rpcUrl && config.agentPrivateKey);
}

export function shouldUseMockChain() {
  if (config.chainMode === "mock") return true;
  if (isExplicitOnChainMode()) return false;
  return !hasChainEnv();
}

export function assertChainConfigured() {
  const proof = getProofNetworkConfig();
  const missing = [
    ["SIGNAL_REGISTRY_ADDRESS", config.signalRegistryAddress],
    [
      proof.mode === "testnet"
        ? "MANTLE_TESTNET_RPC_URL"
        : proof.mode === "mainnet"
          ? "MANTLE_MAINNET_RPC_URL"
          : "MANTLE_LOCAL_RPC_URL or MANTLE_RPC_URL",
      proof.mode === "testnet" ? process.env.MANTLE_TESTNET_RPC_URL : proof.rpcUrl
    ],
    [proof.mode === "testnet" ? "MANTLE_TESTNET_EXPLORER_URL" : "explorer", proof.mode === "testnet" ? process.env.MANTLE_TESTNET_EXPLORER_URL : "ok"],
    [proof.mode === "testnet" ? "EXPECTED_CHAIN_ID" : "expected chain", proof.mode === "testnet" ? process.env.EXPECTED_CHAIN_ID || String(MANTLE_SEPOLIA_CHAIN_ID) : "ok"],
    ["AGENT_PRIVATE_KEY", config.agentPrivateKey]
  ]
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length) {
    throw new Error(`Chain mode ${config.chainMode} requires: ${missing.join(", ")}`);
  }
}

export async function assertExpectedRpcChainId() {
  const proof = getProofNetworkConfig();
  if (proof.mode !== "testnet") return;

  const expected = config.expectedChainId || MANTLE_SEPOLIA_CHAIN_ID;
  if (expected !== MANTLE_SEPOLIA_CHAIN_ID) {
    throw new Error(`CHAIN_MODE=testnet expects Mantle Sepolia Testnet chainId ${MANTLE_SEPOLIA_CHAIN_ID}, received EXPECTED_CHAIN_ID=${expected}`);
  }

  const provider = new JsonRpcProvider(proof.rpcUrl);
  const network = await provider.getNetwork();
  const actual = Number(network.chainId);
  if (actual !== MANTLE_SEPOLIA_CHAIN_ID) {
    throw new Error(
      `Mantle Sepolia Testnet RPC chainId mismatch: expected ${MANTLE_SEPOLIA_CHAIN_ID}, received ${actual}. Check MANTLE_TESTNET_RPC_URL and do not mix legacy Mantle Testnet 5001 with Sepolia explorer links.`
    );
  }
}

export function chainModeLabel() {
  if (shouldUseMockChain()) return "mock local proofs";
  return getProofNetworkConfig().proofNetworkLabel;
}

export function marketDataModeLabel() {
  if (config.marketDataMode === "live_mainnet" && (!config.mantleMainnetRpcUrl || !config.trackedTokenAddresses.length)) {
    return "Live mainnet reader not configured";
  }

  const map: Record<MarketDataMode, string> = {
    demo: "Demo-generated market events",
    historical_mainnet: "Historical Mantle mainnet events",
    live_mainnet: "Live Mantle mainnet reader"
  };
  return map[config.marketDataMode];
}

export function chainRuntimeStatus() {
  const isMock = shouldUseMockChain();
  const proof = getProofNetworkConfig();
  const explorerUrl = isMock ? "" : proof.explorerUrl;

  return {
    chainMode: config.chainMode,
    marketDataMode: config.marketDataMode,
    chainModeLabel: chainModeLabel(),
    proofNetwork: proof.proofNetwork,
    proofNetworkLabel: isMock ? "Mock proof hashes" : proof.proofNetworkLabel,
    marketDataSource: marketDataModeLabel(),
    isMock,
    isOnChain: !isMock,
    rpcTarget: redactRpcTarget(proof.rpcUrl),
    signalRegistryAddress: config.signalRegistryAddress || null,
    chainId: proof.chainId,
    currentProofNetworkKey: currentProofNetworkKey(),
    hasAgentPrivateKey: Boolean(config.agentPrivateKey),
    liveMainnetConfigured: Boolean(config.mantleMainnetRpcUrl && config.trackedTokenAddresses.length),
    proofExplorerUrl: explorerUrl || null,
    contractExplorerUrl: explorerUrl && config.signalRegistryAddress ? `${explorerUrl}/address/${config.signalRegistryAddress}` : null,
    txExplorerBaseUrl: explorerUrl ? `${explorerUrl}/tx` : null,
    explorerEnabled: Boolean(explorerUrl)
  };
}

export function hasTelegramEnv() {
  return Boolean(config.telegramEnabled && config.telegramBotToken && config.telegramChatId);
}
