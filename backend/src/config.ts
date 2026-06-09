import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: Number(process.env.PORT || 4000),
  databaseUrl: process.env.DATABASE_URL || "file:./dev.db",
  signalRegistryAddress: process.env.SIGNAL_REGISTRY_ADDRESS || "",
  mantleRpcUrl: process.env.MANTLE_RPC_URL || "",
  agentPrivateKey: process.env.AGENT_PRIVATE_KEY || "",
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || "",
  telegramChatId: process.env.TELEGRAM_CHAT_ID || "",
  aiProvider: process.env.AI_PROVIDER || "mock",
  mantleExplorerUrl: process.env.MANTLE_EXPLORER_URL || "https://explorer.testnet.mantle.xyz"
};

export function hasChainEnv() {
  return Boolean(config.signalRegistryAddress && config.mantleRpcUrl && config.agentPrivateKey);
}

export function hasTelegramEnv() {
  return Boolean(config.telegramBotToken && config.telegramChatId);
}
