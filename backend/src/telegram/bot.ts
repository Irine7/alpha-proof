import { Markup, Telegraf } from "telegraf";
import type { Signal } from "../generated/prisma/index.js";
import { config, currentProofNetworkKey } from "../config.js";
import { createDemoSignal } from "../agent/orchestrator.js";
import { getAgentStats, getLatestPendingSignal, getLatestSignals, getSignalByContractId, getSignalById } from "../db/signals.js";
import {
  formatHelpMessage,
  formatLatestSignal,
  formatReputation,
  formatSignalDetails,
  formatStartMessage,
  getTelegramLinks,
  escapeHtml,
  isPublicAppUrl
} from "./formatter.js";
import {
  consumeConnectCode,
  createOrUpdateSubscriberFromTelegram,
  disconnectTelegramChat,
  getSignalFilterNote,
  getSubscriberByChatId,
  subscriberSignalTypes,
  unsubscribe,
  updateSubscriberSettings
} from "./subscriptions.js";

let bot: Telegraf | null = null;
let launched = false;
let registered = false;
let warnedMissingToken = false;
let warnedMissingChat = false;
let warnedLocalAppUrl = false;
let cachedBotUsername: string | null = null;

export function htmlMessageOptions(markup?: ReturnType<typeof Markup.inlineKeyboard>) {
  return {
    parse_mode: "HTML" as const,
    ...(markup || {})
  };
}

export function getTelegramBot() {
  if (!config.telegramEnabled || !config.telegramBotToken) return null;
  bot ||= new Telegraf(config.telegramBotToken);
  return bot;
}

export async function getTelegramBotUsername() {
  if (config.telegramBotUsername) return config.telegramBotUsername.replace(/^@/, "");
  if (cachedBotUsername) return cachedBotUsername;

  const activeBot = getTelegramBot();
  if (!activeBot) return "";

  const me = await activeBot.telegram.getMe();
  cachedBotUsername = me.username || "";
  return cachedBotUsername;
}

export function warnMissingToken() {
  if (warnedMissingToken) return;
  warnedMissingToken = true;
  console.warn("Telegram enabled but TELEGRAM_BOT_TOKEN is missing. Bot polling and alerts are disabled.");
}

export function warnMissingChat() {
  if (warnedMissingChat) return;
  warnedMissingChat = true;
  console.warn("Telegram enabled but TELEGRAM_CHAT_ID is missing. Bot commands can run, but auto-alerts are disabled.");
}

function warnLocalPublicAppUrl() {
  if (warnedLocalAppUrl || !config.publicAppUrl || isPublicAppUrl(config.publicAppUrl)) return;
  warnedLocalAppUrl = true;
  console.warn("PUBLIC_APP_URL is local or not public; Telegram dashboard buttons disabled.");
}

function isTelegramButtonUrl(url: string | undefined): url is string {
  if (!url) return false;

  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    return (
      ["http:", "https:"].includes(parsed.protocol) &&
      hostname !== "localhost" &&
      hostname !== "127.0.0.1" &&
      hostname !== "::1"
    );
  } catch {
    return false;
  }
}

export function signalKeyboard(signal: Signal, mode: "commit" | "resolve" = "commit") {
  const links = getTelegramLinks(signal);
  const primaryRow = [];
  const secondaryRow = [];
  const primaryProofUrl = mode === "resolve" ? links.resolveTxUrl : links.proofTxUrl;

  if (isTelegramButtonUrl(primaryProofUrl)) {
    primaryRow.push(Markup.button.url(mode === "resolve" ? "Open Resolve Tx" : "Open Proof Tx", primaryProofUrl));
  }
  if (isTelegramButtonUrl(links.dashboardSignalUrl)) {
    primaryRow.push(Markup.button.url("View Signal", links.dashboardSignalUrl));
  }

  if (mode === "resolve" && isTelegramButtonUrl(links.proofTxUrl)) {
    secondaryRow.push(Markup.button.url("Open Proof Tx", links.proofTxUrl));
  }
  if (isTelegramButtonUrl(links.reputationUrl)) {
    secondaryRow.push(Markup.button.url("Reputation", links.reputationUrl));
  }

  const rows = [primaryRow, secondaryRow].filter((row) => row.length > 0);
  return rows.length ? Markup.inlineKeyboard(rows) : undefined;
}

export function reputationKeyboard() {
  const links = getTelegramLinks();
  const buttons = [];
  if (isTelegramButtonUrl(links.dashboardUrl)) buttons.push(Markup.button.url("Open Dashboard", links.dashboardUrl));
  if (isTelegramButtonUrl(links.reputationUrl)) buttons.push(Markup.button.url("Reputation", links.reputationUrl));
  return buttons.length ? Markup.inlineKeyboard([buttons]) : undefined;
}

function signalLookupKeyboard() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback("Latest Signal", "aps:latest"),
      Markup.button.callback("Pending Signal", "aps:pending")
    ]
  ]);
}

function parseSignalQuery(text: string) {
  const [, raw = ""] = text.trim().split(/\s+/, 2);
  const value = raw.trim();
  if (!value) return null;

  const dbMatch = value.match(/^db:(\d+)$/i);
  if (dbMatch) return { type: "db" as const, id: Number(dbMatch[1]) };

  const contractMatch = value.match(/^contract:(\d+)$/i);
  if (contractMatch) return { type: "contract" as const, id: Number(contractMatch[1]) };

  if (/^\d+$/.test(value)) return { type: "db" as const, id: Number(value) };
  return null;
}

function telegramIdentity(ctx: { from?: { id: number; username?: string; first_name?: string; last_name?: string } }) {
  return {
    telegramUserId: ctx.from?.id ? String(ctx.from.id) : null,
    username: ctx.from?.username || null,
    firstName: ctx.from?.first_name || null,
    lastName: ctx.from?.last_name || null
  };
}

function chatIdFromCtx(ctx: { chat?: { id: number | string } }) {
  return ctx.chat?.id !== undefined ? String(ctx.chat.id) : null;
}

function parseCommandPayload(text: string) {
  const [, payload = ""] = text.trim().split(/\s+/, 2);
  return payload.trim();
}

function settingsText(subscriber: Awaited<ReturnType<typeof getSubscriberByChatId>>) {
  const signalTypes = subscriber ? subscriberSignalTypes(subscriber) : null;
  return [
    "Telegram alerts: " + (subscriber?.isActive ? "enabled" : "disabled"),
    `Creates: ${subscriber?.subscribedToCreates ?? true ? "on" : "off"}`,
    `Resolves: ${subscriber?.subscribedToResolves ?? true ? "on" : "off"}`,
    `Min confidence: ${subscriber?.minConfidence === null || subscriber?.minConfidence === undefined ? "off" : `${subscriber.minConfidence}%`}`,
    `Signal types: ${signalTypes?.length ? signalTypes.join(", ") : "all"}`
  ].join("\n");
}

function settingsKeyboard(subscriber: Awaited<ReturnType<typeof getSubscriberByChatId>>) {
  const isActive = subscriber?.isActive ?? false;
  const createsOn = subscriber?.subscribedToCreates ?? true;
  const resolvesOn = subscriber?.subscribedToResolves ?? true;
  const minConfidence = subscriber?.minConfidence ?? null;

  return Markup.inlineKeyboard([
    [Markup.button.callback(isActive ? "Alerts Off" : "Alerts On", `aps:alerts:${isActive ? "off" : "on"}`)],
    [
      Markup.button.callback(createsOn ? "Creates Off" : "Creates On", "aps:creates:toggle"),
      Markup.button.callback(resolvesOn ? "Resolves Off" : "Resolves On", "aps:resolves:toggle")
    ],
    [
      Markup.button.callback(minConfidence === null ? "Min Off ✓" : "Min Off", "aps:min:off"),
      Markup.button.callback(minConfidence === 70 ? "Min 70% ✓" : "Min 70%", "aps:min:70"),
      Markup.button.callback(minConfidence === 75 ? "Min 75% ✓" : "Min 75%", "aps:min:75"),
      Markup.button.callback(minConfidence === 80 ? "Min 80% ✓" : "Min 80%", "aps:min:80")
    ],
    [Markup.button.callback("Status", "aps:status"), Markup.button.callback("Latest", "aps:latest")]
  ]);
}

async function ensureSubscriberForChat(chatId: string, ctx: { from?: { id: number; username?: string; first_name?: string; last_name?: string } }) {
  return createOrUpdateSubscriberFromTelegram(chatId, telegramIdentity(ctx));
}

async function replyWithSettings(ctx: { reply: (text: string, extra?: ReturnType<typeof htmlMessageOptions>) => Promise<unknown> }, chatId: string) {
  const subscriber = await getSubscriberByChatId(chatId);
  return ctx.reply(settingsText(subscriber), htmlMessageOptions(settingsKeyboard(subscriber)));
}

function withFilterNote(text: string, signal: Signal, subscriber: Awaited<ReturnType<typeof getSubscriberByChatId>>) {
  const note = getSignalFilterNote(signal, subscriber);
  return note ? `${text}\n\n<i>${escapeHtml(note)}</i>` : text;
}

function isDemoChatAllowed(chatId: string) {
  if (config.telegramAllowedDemoChatIds.length) return config.telegramAllowedDemoChatIds.includes(chatId);
  return chatId === config.telegramChatId;
}

function registerCommands(activeBot: Telegraf) {
  if (registered) return;
  registered = true;

  activeBot.start(async (ctx) => {
    const text = "text" in ctx.message ? ctx.message.text : "";
    const code = ctx.startPayload || parseCommandPayload(text);
    const chatId = chatIdFromCtx(ctx);

    if (code && chatId) {
      const result = await consumeConnectCode(code, telegramIdentity(ctx), chatId);
      if (result.status === "connected") {
        await ctx.reply(
          "✅ Telegram connected.\n\nAlphaProof signal alerts and resolved updates are enabled for this chat.",
          htmlMessageOptions()
        );
        return;
      }
      if (result.status === "expired") {
        await ctx.reply("This connect code expired. Generate a new Telegram link from the AlphaProof dashboard.");
        return;
      }
      if (result.status === "used") {
        await ctx.reply("This connect code was already used. Generate a new Telegram link from the AlphaProof dashboard if needed.");
        return;
      }
      await ctx.reply("Connect code not found. Generate a new Telegram link from the AlphaProof dashboard.");
      return;
    }

    if (chatId) {
      const subscriber = await getSubscriberByChatId(chatId);
      if (subscriber?.isActive) {
        await ctx.reply(
          [
            "Welcome back. Telegram alerts are enabled.",
            "",
            "No trading. No custody. Not financial advice.",
            "",
            "Use /help for commands."
          ].join("\n"),
          htmlMessageOptions()
        );
        return;
      }
      if (subscriber) {
        await ctx.reply(
          [
            "Welcome back. Telegram is connected, but alerts are disabled.",
            "Use /subscribe or /alerts on to enable them.",
            "",
            "No trading. No custody. Not financial advice.",
            "",
            "Use /help for commands."
          ].join("\n"),
          htmlMessageOptions()
        );
        return;
      }
    }

    await ctx.reply(formatStartMessage(), htmlMessageOptions());
  });
  activeBot.help((ctx) => ctx.reply(formatHelpMessage(), htmlMessageOptions()));
  activeBot.command("help", (ctx) => ctx.reply(formatHelpMessage(), htmlMessageOptions()));

  activeBot.command("subscribe", async (ctx) => {
    const chatId = chatIdFromCtx(ctx);
    if (!chatId) {
      await ctx.reply("Telegram chat not found.");
      return;
    }

    await createOrUpdateSubscriberFromTelegram(chatId, telegramIdentity(ctx));
    await ctx.reply("✅ Telegram alerts enabled.\nYou will receive AlphaProof signal alerts and resolved updates.");
  });

  activeBot.command("unsubscribe", async (ctx) => {
    const chatId = chatIdFromCtx(ctx);
    if (!chatId) {
      await ctx.reply("Telegram chat not found.");
      return;
    }

    await unsubscribe(chatId);
    await ctx.reply("Alerts disabled. You can re-enable with /subscribe or /alerts on.");
  });

  activeBot.command("disconnect", async (ctx) => {
    const chatId = chatIdFromCtx(ctx);
    if (!chatId) {
      await ctx.reply("Telegram chat not found.");
      return;
    }

    await disconnectTelegramChat(chatId);
    await ctx.reply("Telegram disconnected from AlphaProof.\nYou can reconnect from the AlphaProof dashboard.");
  });

  activeBot.command("alerts", async (ctx) => {
    const chatId = chatIdFromCtx(ctx);
    const text = "text" in ctx.message ? ctx.message.text : "";
    const value = parseCommandPayload(text).toLowerCase();
    if (!chatId) {
      await ctx.reply("Telegram chat not found.");
      return;
    }

    if (value === "on") {
      await createOrUpdateSubscriberFromTelegram(chatId, telegramIdentity(ctx));
      await ctx.reply("✅ Telegram alerts enabled.\nYou will receive AlphaProof signal alerts and resolved updates.");
      return;
    }
    if (value === "off") {
      await unsubscribe(chatId);
      await ctx.reply("Alerts disabled. You can re-enable with /subscribe or /alerts on.");
      return;
    }
    if (value === "status") {
      await ctx.reply(settingsText(await getSubscriberByChatId(chatId)));
      return;
    }

    await ctx.reply(["Usage:", "/alerts on - enable Telegram alerts", "/alerts off - disable Telegram alerts", "/alerts status - show alert settings"].join("\n"));
  });

  activeBot.command("status", async (ctx) => {
    const chatId = chatIdFromCtx(ctx);
    if (!chatId) {
      await ctx.reply("Telegram chat not found.");
      return;
    }

    await ctx.reply(settingsText(await getSubscriberByChatId(chatId)));
  });

  activeBot.command("settings", async (ctx) => {
    const chatId = chatIdFromCtx(ctx);
    if (!chatId) {
      await ctx.reply("Telegram chat not found.");
      return;
    }

    await replyWithSettings(ctx, chatId);
  });

  activeBot.command("minconfidence", async (ctx) => {
    const chatId = chatIdFromCtx(ctx);
    const text = "text" in ctx.message ? ctx.message.text : "";
    const value = parseCommandPayload(text);
    if (!chatId) {
      await ctx.reply("Telegram chat not found.");
      return;
    }

    await ensureSubscriberForChat(chatId, ctx);
    if (value.toLowerCase() === "off") {
      const subscriber = await updateSubscriberSettings(chatId, { minConfidence: null });
      await ctx.reply(`Min confidence disabled.\n\n${settingsText(subscriber)}`);
      return;
    }

    const minConfidence = Number(value);
    if (!Number.isInteger(minConfidence) || minConfidence < 0 || minConfidence > 100) {
      await ctx.reply("Usage: /minconfidence 70 or /minconfidence off");
      return;
    }

    const subscriber = await updateSubscriberSettings(chatId, { minConfidence });
    await ctx.reply(`Min confidence set to ${minConfidence}%.\n\n${settingsText(subscriber)}`);
  });

  activeBot.command("types", async (ctx) => {
    const chatId = chatIdFromCtx(ctx);
    const text = "text" in ctx.message ? ctx.message.text : "";
    const value = parseCommandPayload(text);
    if (!chatId) {
      await ctx.reply("Telegram chat not found.");
      return;
    }

    await ensureSubscriberForChat(chatId, ctx);
    if (!value) {
      await ctx.reply("Usage: /types all or /types Whale Accumulation,Liquidity Shock");
      return;
    }

    const signalTypes =
      value.toLowerCase() === "all"
        ? null
        : value
            .split(",")
            .map((entry) => entry.trim())
            .filter(Boolean);

    const subscriber = await updateSubscriberSettings(chatId, { signalTypes });
    await ctx.reply(`Signal type filter updated.\n\n${settingsText(subscriber)}`);
  });

  activeBot.command("latest", async (ctx) => {
    const [latest] = await getLatestSignals(1, { proofReadyOnly: true, currentNetworkOnly: true });
    if (!latest) {
      await ctx.reply("No proof-backed signals yet. Create a proof signal first.");
      return;
    }

    const subscriber = chatIdFromCtx(ctx) ? await getSubscriberByChatId(chatIdFromCtx(ctx) as string) : null;
    await ctx.reply(withFilterNote(formatLatestSignal(latest), latest, subscriber), htmlMessageOptions(signalKeyboard(latest)));
  });

  activeBot.command("pending", async (ctx) => {
    const pending = await getLatestPendingSignal({ currentNetworkOnly: true });
    if (!pending) {
      await ctx.reply("No pending signals in the current proof network.\n\nCreate a new proof signal from the AlphaProof dashboard.");
      return;
    }

    const subscriber = chatIdFromCtx(ctx) ? await getSubscriberByChatId(chatIdFromCtx(ctx) as string) : null;
    await ctx.reply(withFilterNote(formatSignalDetails(pending), pending, subscriber), htmlMessageOptions(signalKeyboard(pending)));
  });

  activeBot.command("reputation", async (ctx) => {
    const stats = await getAgentStats({ proofReadyOnly: true, currentNetworkOnly: true });
    await ctx.reply(formatReputation(stats), htmlMessageOptions(reputationKeyboard()));
  });

  activeBot.command("signal", async (ctx) => {
    const text = "text" in ctx.message ? ctx.message.text : "";
    const payload = parseCommandPayload(text);
    if (!payload) {
      await ctx.reply(
        [
          "<b>Signal details</b>",
          "",
          "Send a DB Signal ID:",
          " <code>/signal 50</code>",
          "",
          "Or a Contract Signal ID:",
          " <code>/signal contract:28</code>",
          "",
          "You can also use:",
          "/latest - latest signal",
          "/pending - pending signal"
        ].join("\n"),
        htmlMessageOptions(signalLookupKeyboard())
      );
      return;
    }

    const query = parseSignalQuery(text);
    if (!query || !Number.isInteger(query.id) || query.id < 1) {
      await ctx.reply("Usage: /signal <db id> or /signal contract:<id>");
      return;
    }

    const signal = query.type === "contract" ? await getSignalByContractId(query.id) : await getSignalById(query.id);
    if (!signal) {
      await ctx.reply("Signal not found for the current proof network.");
      return;
    }

    if (signal.proofNetworkKey && signal.proofNetworkKey !== currentProofNetworkKey()) {
      await ctx.reply("This signal belongs to a different proof network.");
      return;
    }

    const subscriber = chatIdFromCtx(ctx) ? await getSubscriberByChatId(chatIdFromCtx(ctx) as string) : null;
    await ctx.reply(withFilterNote(formatSignalDetails(signal), signal, subscriber), htmlMessageOptions(signalKeyboard(signal)));
  });

  activeBot.command("demo", async (ctx) => {
    if (!config.telegramAllowDemoCommand) {
      await ctx.reply("Demo command is disabled on this deployment.");
      return;
    }

    if (!ctx.chat || !isDemoChatAllowed(String(ctx.chat.id))) {
      await ctx.reply("Demo command is restricted to the configured Telegram chat.");
      return;
    }

    const result = await createDemoSignal();
    await ctx.reply(
      [
        "<b>Demo proof signal created.</b>",
        "",
        `DB Signal ID: <code>#${result.signal.id}</code>`,
        `Contract Signal ID: <code>#${result.signal.chainSignalId ?? "pending / unavailable"}</code>`,
        `Status: <b>${result.signal.status}</b>`
      ].join("\n"),
      htmlMessageOptions(signalKeyboard(result.signal))
    );
  });

  activeBot.catch((error) => {
    console.error("Telegram bot error:", error instanceof Error ? error.message : "Unknown Telegram error");
  });

  activeBot.on("callback_query", async (ctx) => {
    const data = "data" in ctx.callbackQuery ? ctx.callbackQuery.data : "";
    if (!data?.startsWith("aps:")) {
      await ctx.answerCbQuery("Unknown action.").catch(() => undefined);
      return;
    }

    const chatId = chatIdFromCtx(ctx);
    if (!chatId) {
      await ctx.answerCbQuery("Telegram chat not found.");
      return;
    }

    const [, key, value] = data.split(":");

    try {
      let callbackMessage = "Settings updated.";

      if (key === "alerts") {
        if (value !== "on" && value !== "off") {
          await ctx.answerCbQuery("Unknown settings action.");
          return;
        }
        if (value === "on") {
          await createOrUpdateSubscriberFromTelegram(chatId, telegramIdentity(ctx));
          await updateSubscriberSettings(chatId, { subscribedToCreates: true, subscribedToResolves: true });
        } else {
          await unsubscribe(chatId);
        }
      } else if (key === "creates") {
        await ensureSubscriberForChat(chatId, ctx);
        const current = await getSubscriberByChatId(chatId);
        if (!current) throw new Error("Subscriber not found");
        await updateSubscriberSettings(chatId, { subscribedToCreates: !current.subscribedToCreates });
      } else if (key === "resolves") {
        await ensureSubscriberForChat(chatId, ctx);
        const current = await getSubscriberByChatId(chatId);
        if (!current) throw new Error("Subscriber not found");
        await updateSubscriberSettings(chatId, { subscribedToResolves: !current.subscribedToResolves });
      } else if (key === "min") {
        const allowedValues = new Set(["off", "70", "75", "80"]);
        if (!allowedValues.has(value || "")) {
          await ctx.answerCbQuery("Unknown threshold.");
          return;
        }
        await ensureSubscriberForChat(chatId, ctx);
        await updateSubscriberSettings(chatId, { minConfidence: value === "off" ? null : Number(value) });
      } else if (key === "status") {
        callbackMessage = "Status refreshed.";
      } else if (key === "latest") {
        const [latest] = await getLatestSignals(1, { proofReadyOnly: true, currentNetworkOnly: true });
        await ctx.answerCbQuery(latest ? "Latest signal loaded." : "No signal found.");
        if (latest) await ctx.reply(withFilterNote(formatLatestSignal(latest), latest, await getSubscriberByChatId(chatId)), htmlMessageOptions(signalKeyboard(latest)));
        return;
      } else if (key === "pending") {
        const pending = await getLatestPendingSignal({ currentNetworkOnly: true });
        await ctx.answerCbQuery(pending ? "Pending signal loaded." : "No pending signal found.");
        if (pending) {
          await ctx.reply(withFilterNote(formatSignalDetails(pending), pending, await getSubscriberByChatId(chatId)), htmlMessageOptions(signalKeyboard(pending)));
        } else {
          await ctx.reply("No pending signals in the current proof network.\n\nCreate a new proof signal from the AlphaProof dashboard.");
        }
        return;
      } else {
        await ctx.answerCbQuery("Unknown settings action.");
        return;
      }

      const updated = await getSubscriberByChatId(chatId);
      await ctx.answerCbQuery(callbackMessage);
      await ctx.editMessageText(settingsText(updated), htmlMessageOptions(settingsKeyboard(updated))).catch(async () => {
        await ctx.reply(settingsText(updated), htmlMessageOptions(settingsKeyboard(updated)));
      });
    } catch {
      await ctx.answerCbQuery("Could not update settings.");
    }
  });
}

function ensureTelegramBotReady() {
  const activeBot = getTelegramBot();
  if (activeBot) registerCommands(activeBot);
  return activeBot;
}

export async function startTelegramBot() {
  if (!config.telegramEnabled) {
    console.log("Telegram disabled.");
    return;
  }

  if (!config.telegramBotToken) {
    warnMissingToken();
    return;
  }

  if (!config.telegramChatId) {
    warnMissingChat();
  }
  warnLocalPublicAppUrl();

  const activeBot = ensureTelegramBotReady();
  if (!activeBot || launched) return;

  if (config.telegramMode === "webhook") {
    console.log("Telegram webhook mode enabled; polling not started.");
    return;
  }

  await activeBot.launch();
  launched = true;
  console.log("Telegram bot started.");
}

export async function handleTelegramWebhookUpdate(update: unknown) {
  const activeBot = ensureTelegramBotReady();
  if (!activeBot) throw new Error("Telegram bot is not configured");
  await activeBot.handleUpdate(update as never);
}

export function stopTelegramBot(reason = "shutdown") {
  if (!bot || !launched) return;
  bot.stop(reason);
  launched = false;
}
