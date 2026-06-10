import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: Number(process.env.PORT || 4000),
  databaseUrl: process.env.DATABASE_URL || "",
  chainMode: process.env.CHAIN_MODE || "auto",
  signalRegistryAddress: process.env.SIGNAL_REGISTRY_ADDRESS || "",
  mantleRpcUrl: process.env.MANTLE_RPC_URL || "",
  agentPrivateKey: process.env.AGENT_PRIVATE_KEY || "",
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || "",
  telegramChatId: process.env.TELEGRAM_CHAT_ID || "",
  aiProvider: process.env.AI_PROVIDER || "mock",
  mantleExplorerUrl: process.env.MANTLE_EXPLORER_URL || "https://explorer.testnet.mantle.xyz"
};

export function isExplicitOnChainMode() {
  return ["local", "onchain", "real"].includes(config.chainMode);
}

export function hasChainEnv() {
  if (config.chainMode === "mock") return false;
  return Boolean(config.signalRegistryAddress && config.mantleRpcUrl && config.agentPrivateKey);
}

export function shouldUseMockChain() {
  if (config.chainMode === "mock") return true;
  if (isExplicitOnChainMode()) return false;
  return !hasChainEnv();
}

export function assertChainConfigured() {
  const missing = [
    ["SIGNAL_REGISTRY_ADDRESS", config.signalRegistryAddress],
    ["MANTLE_RPC_URL", config.mantleRpcUrl],
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
  return config.mantleRpcUrl.includes("127.0.0.1") || config.mantleRpcUrl.includes("localhost")
    ? "local Hardhat contract"
    : "configured contract";
}

export function chainRuntimeStatus() {
  const isMock = shouldUseMockChain();
  const isLocalRpc = config.mantleRpcUrl.includes("127.0.0.1") || config.mantleRpcUrl.includes("localhost");
  const rpcTarget = !config.mantleRpcUrl ? "not configured" : isLocalRpc ? "local Hardhat" : "configured RPC";

  return {
    chainMode: config.chainMode,
    chainModeLabel: chainModeLabel(),
    isMock,
    isOnChain: !isMock,
    rpcTarget,
    signalRegistryAddress: config.signalRegistryAddress || null,
    hasAgentPrivateKey: Boolean(config.agentPrivateKey)
  };
}

export function hasTelegramEnv() {
  return Boolean(config.telegramBotToken && config.telegramChatId);
}
