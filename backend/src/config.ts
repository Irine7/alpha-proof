import dotenv from "dotenv";
import type { ChainMode, MarketDataMode } from "./types.js";

dotenv.config();

const DEFAULT_MANTLE_TESTNET_RPC_URL = "https://rpc.sepolia.mantle.xyz";
const DEFAULT_MANTLE_TESTNET_EXPLORER_URL = "https://explorer.sepolia.mantle.xyz";

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

export const config = {
  port: Number(process.env.PORT || 4000),
  databaseUrl: process.env.DATABASE_URL || "",
  chainMode: normalizeChainMode(process.env.CHAIN_MODE),
  marketDataMode: normalizeMarketDataMode(process.env.MARKET_DATA_MODE),
  signalRegistryAddress: process.env.SIGNAL_REGISTRY_ADDRESS || "",
  mantleRpcUrl: valueOrLegacy(process.env.MANTLE_LOCAL_RPC_URL, process.env.MANTLE_RPC_URL) || "http://127.0.0.1:8545",
  mantleTestnetRpcUrl: process.env.MANTLE_TESTNET_RPC_URL || DEFAULT_MANTLE_TESTNET_RPC_URL,
  mantleTestnetExplorerUrl: process.env.MANTLE_TESTNET_EXPLORER_URL || DEFAULT_MANTLE_TESTNET_EXPLORER_URL,
  mantleMainnetRpcUrl: process.env.MANTLE_MAINNET_RPC_URL || "",
  mantleMainnetExplorerUrl: process.env.MANTLE_MAINNET_EXPLORER_URL || "",
  agentPrivateKey: process.env.AGENT_PRIVATE_KEY || "",
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || "",
  telegramChatId: process.env.TELEGRAM_CHAT_ID || "",
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
      proofNetwork: "Mantle Testnet",
      proofNetworkLabel: "Mantle Testnet contract",
      rpcUrl: config.mantleTestnetRpcUrl,
      explorerUrl: config.mantleTestnetExplorerUrl,
      chainId: 5003
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
    [proof.mode === "testnet" ? "MANTLE_TESTNET_RPC_URL" : proof.mode === "mainnet" ? "MANTLE_MAINNET_RPC_URL" : "MANTLE_LOCAL_RPC_URL or MANTLE_RPC_URL", proof.rpcUrl],
    ["AGENT_PRIVATE_KEY", config.agentPrivateKey]
  ]
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length) {
    throw new Error(`Chain mode ${config.chainMode} requires: ${missing.join(", ")}`);
  }
}

export function chainModeLabel() {
  if (shouldUseMockChain()) return "mock local proofs";
  return getProofNetworkConfig().proofNetworkLabel;
}

export function marketDataModeLabel() {
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
    hasAgentPrivateKey: Boolean(config.agentPrivateKey),
    proofExplorerUrl: explorerUrl || null,
    contractExplorerUrl: explorerUrl && config.signalRegistryAddress ? `${explorerUrl}/address/${config.signalRegistryAddress}` : null,
    txExplorerBaseUrl: explorerUrl ? `${explorerUrl}/tx` : null
  };
}

export function hasTelegramEnv() {
  return Boolean(config.telegramBotToken && config.telegramChatId);
}
