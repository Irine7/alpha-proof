import type { Signal } from "../generated/prisma/index.js";
import { config, shouldUseMockChain } from "../config.js";
import type { getAgentStats } from "../db/signals.js";
import { formatReputation, formatResolvedAlert, formatSignalAlert } from "./formatter.js";
import { getTelegramBot, htmlMessageOptions, reputationKeyboard, signalKeyboard, warnMissingChat, warnMissingToken } from "./bot.js";
import { deactivateSubscriber, listActiveSubscribers, signalPassesSubscriberFilters } from "./subscriptions.js";
import type { TelegramAlertKind, TelegramSendResult } from "./types.js";

type AgentStats = Awaited<ReturnType<typeof getAgentStats>>;

function alertsEnabled(kind: TelegramAlertKind) {
  return kind === "create" ? config.telegramAlertsOnCreate : config.telegramAlertsOnResolve;
}

function canSend(kind: TelegramAlertKind): TelegramSendResult {
  if (!config.telegramEnabled) return { sent: false, reason: "Telegram disabled" };
  if (!config.telegramBotToken) {
    warnMissingToken();
    return { sent: false, reason: "Telegram bot token missing" };
  }
  if (!alertsEnabled(kind)) return { sent: false, reason: `Telegram ${kind} alerts disabled` };
  return { sent: true };
}

function shouldReceiveKind(
  subscriber: { subscribedToCreates: boolean; subscribedToResolves: boolean },
  kind: TelegramAlertKind
) {
  return kind === "create" ? subscriber.subscribedToCreates : subscriber.subscribedToResolves;
}

async function alertRecipients(signal: Signal, kind: TelegramAlertKind) {
  const subscribers = await listActiveSubscribers();
  const recipients = subscribers
    .filter((subscriber) => shouldReceiveKind(subscriber, kind))
    .filter((subscriber) => signalPassesSubscriberFilters(signal, subscriber))
    .map((subscriber) => subscriber.chatId);

  if (config.telegramChatId && (config.telegramAdminAlerts || subscribers.length === 0)) {
    recipients.push(config.telegramChatId);
  }

  return [...new Set(recipients)];
}

function isBlockedByUser(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("bot was blocked") || message.includes("Forbidden") || message.includes("user is deactivated");
}

async function sendToChat(chatId: string, signal: Signal, text: string, kind: TelegramAlertKind) {
  const activeBot = getTelegramBot();
  if (!activeBot) return false;

  try {
    await activeBot.telegram.sendMessage(
      chatId,
      text,
      htmlMessageOptions(signalKeyboard(signal, kind === "resolve" ? "resolve" : "commit"))
    );
    return true;
  } catch (error) {
    console.error(`Telegram alert failed for chat ${chatId.slice(0, 3)}...:`, error instanceof Error ? error.message : "Unknown Telegram send error");
    if (isBlockedByUser(error)) {
      await deactivateSubscriber(chatId).catch(() => undefined);
    }
    return false;
  }
}

async function sendConfiguredMessage(signal: Signal, text: string, kind: TelegramAlertKind) {
  const readiness = canSend(kind);
  if (!readiness.sent) return readiness;

  const recipients = await alertRecipients(signal, kind);
  if (!recipients.length) {
    warnMissingChat();
    return { sent: false, reason: "No Telegram recipients configured" };
  }

  let sent = 0;
  for (const chatId of recipients) {
    if (await sendToChat(chatId, signal, text, kind)) sent += 1;
  }

  return sent ? { sent: true } : { sent: false, reason: "Telegram send failed" };
}

export async function notifySignalCreated(signal: Signal) {
  return sendConfiguredMessage(signal, formatSignalAlert(signal), "create");
}

export async function notifySignalResolved(signal: Signal) {
  if (!signal.resolveTxHash && !shouldUseMockChain() && signal.chainMode !== "mock") {
    console.warn(`Telegram resolve alert skipped for signal #${signal.id}: missing resolve transaction hash.`);
    return { sent: false, reason: "Resolve transaction hash missing" };
  }

  return sendConfiguredMessage(signal, formatResolvedAlert(signal), "resolve");
}

export async function sendTelegramTestAlert(signal: Signal) {
  if (!config.telegramChatId) {
    warnMissingChat();
    return { sent: false, reason: "Telegram chat id missing" };
  }

  const readiness = canSend("create");
  if (!readiness.sent) return readiness;

  return (await sendToChat(config.telegramChatId, signal, formatSignalAlert(signal), "create"))
    ? { sent: true }
    : { sent: false, reason: "Telegram send failed" };
}

export async function sendTelegramReputationTest(stats: AgentStats) {
  const readiness = canSend("create");
  if (!readiness.sent) return readiness;
  if (!config.telegramChatId) {
    warnMissingChat();
    return { sent: false, reason: "Telegram chat id missing" };
  }

  const activeBot = getTelegramBot();
  if (!activeBot) return { sent: false, reason: "Telegram bot unavailable" };

  try {
    await activeBot.telegram.sendMessage(config.telegramChatId, formatReputation(stats), htmlMessageOptions(reputationKeyboard()));
    return { sent: true };
  } catch (error) {
    console.error("Telegram reputation test failed:", error instanceof Error ? error.message : "Unknown Telegram send error");
    return { sent: false, reason: "Telegram send failed" };
  }
}
