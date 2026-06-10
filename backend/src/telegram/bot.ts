import { Telegraf } from "telegraf";
import { config, hasTelegramEnv, shouldUseMockChain } from "../config.js";
import { getAgentStats, getLatestSignals } from "../db/signals.js";
import type { SignalOutcome } from "../types.js";

let bot: Telegraf | null = null;

function predictionLabel(prediction: number) {
  if (prediction > 0) return "Possible upward volatility in the next evaluation window.";
  if (prediction < 0) return "Possible downside or liquidity risk in the next evaluation window.";
  return "Neutral signal: monitor for confirmation.";
}

function shortHash(value: string) {
  return `${value.slice(0, 10)}...${value.slice(-8)}`;
}

function proofText(txHash?: string | null) {
  if (!txHash) return "Mock proof: local demo mode";
  if (shouldUseMockChain()) return `Mock proof hash: ${shortHash(txHash)}`;
  return `Mantle tx: ${config.mantleExplorerUrl}/tx/${txHash}`;
}

export function formatSignalAlert(signal: {
  signalType: string;
  asset: string;
  confidence: number;
  prediction: number;
  aiSummary: string;
  commitTxHash?: string | null;
  status: string;
  outcome: SignalOutcome | string;
}) {
  return [
    "🚨 AlphaProof Signal",
    "",
    `Type: ${signal.signalType}`,
    `Asset: ${signal.asset}`,
    `Confidence: ${signal.confidence}%`,
    "",
    "AI Summary:",
    signal.aiSummary,
    "",
    "Prediction:",
    predictionLabel(signal.prediction),
    "",
    "Proof:",
    proofText(signal.commitTxHash),
    "",
    "Status:",
    signal.status === "Pending" ? "Pending evaluation" : `Resolved: ${signal.outcome}`
  ].join("\n");
}

export async function sendSignalAlert(signal: Parameters<typeof formatSignalAlert>[0]) {
  if (!hasTelegramEnv()) {
    console.log("Telegram env missing; skipping alert.");
    console.log(formatSignalAlert(signal));
    return;
  }

  if (!bot) {
    bot = new Telegraf(config.telegramBotToken);
  }

  await bot.telegram.sendMessage(config.telegramChatId, formatSignalAlert(signal));
}

export function startTelegramBot() {
  if (!hasTelegramEnv()) {
    console.log("Telegram bot disabled. Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID to enable alerts and commands.");
    return;
  }

  bot = new Telegraf(config.telegramBotToken);

  bot.start((ctx) =>
    ctx.reply(
      "AlphaProof AI is watching Mantle demo signals. Use /latest for the newest proof-backed signal or /reputation for agent stats."
    )
  );

  bot.command("latest", async (ctx) => {
    const [latest] = await getLatestSignals(1);
    if (!latest) {
      await ctx.reply("No signals yet. Create one from the dashboard demo button.");
      return;
    }
    await ctx.reply(formatSignalAlert(latest));
  });

  bot.command("reputation", async (ctx) => {
    const stats = await getAgentStats();
    await ctx.reply(
      [
        "AlphaProof Reputation",
        `Total signals: ${stats.totalSignals}`,
        `Resolved: ${stats.resolvedSignals}`,
        `Correct: ${stats.correct}`,
        `Failed: ${stats.failed}`,
        `Inconclusive: ${stats.inconclusive}`,
        `Accuracy: ${stats.accuracy}%`,
        `Average confidence: ${stats.averageConfidence}%`
      ].join("\n")
    );
  });

  bot.launch();
  console.log("Telegram bot started.");
}
