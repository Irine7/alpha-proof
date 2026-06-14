export const TELEGRAM_COMMANDS = [
  { command: "start", description: "connect or start AlphaProof" },
  { command: "latest", description: "latest proof-backed signal" },
  { command: "pending", description: "pending signal committed before outcome" },
  { command: "reputation", description: "agent reputation" },
  { command: "signal", description: "signal details by ID" },
  { command: "subscribe", description: "enable Telegram alerts" },
  { command: "unsubscribe", description: "disable alerts but keep connection" },
  { command: "settings", description: "alert settings" },
  { command: "status", description: "subscription status" },
  { command: "alerts", description: "enable or disable alerts" },
  { command: "minconfidence", description: "set alert threshold" },
  { command: "disconnect", description: "unlink Telegram from AlphaProof" },
  { command: "help", description: "commands" }
];
