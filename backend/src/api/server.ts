import cors from "cors";
import express from "express";
import { getAgentStats, getLatestSignals, getSignalById } from "../db/signals.js";
import { createDemoSignal } from "../agent/orchestrator.js";
import { resolvePendingDemoSignals } from "../agent/evaluators/demoEvaluator.js";
import type { DemoEventKind } from "../types.js";
import { chainRuntimeStatus, config } from "../config.js";
import { getTelegramBotUsername, handleTelegramWebhookUpdate } from "../telegram/bot.js";
import { sendTelegramConnectionTestAlert } from "../telegram/notifier.js";
import {
  createConnectCode,
  disconnectConnectCode,
  getConnectCodeStatus,
  getSubscriberByChatId,
  maskChatId,
  subscriberSignalTypes
} from "../telegram/subscriptions.js";

const telegramTestAlertRateLimit = new Map<string, number>();
const TELEGRAM_TEST_ALERT_RATE_LIMIT_MS = 30_000;

export function createServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "alphaproof-backend" });
  });

  app.get("/api/runtime", async (_req, res, next) => {
    try {
      const latest = (await getLatestSignals(1, { proofReadyOnly: true }))[0];
      res.json({
        ...chainRuntimeStatus(),
        lastSourceEvent: latest
          ? {
              eventType: latest.sourceEventType,
              asset: latest.asset,
              sourceChain: latest.sourceChain,
              txHash: latest.sourceTxHash,
              detectedAt: latest.detectedAt
            }
          : null,
        lastProofTx: latest?.commitTxHash || null
      });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/signals", async (req, res, next) => {
    try {
      const proofReadyOnly = req.query.records !== "all";
      const currentNetworkOnly = req.query.network !== "all";
      res.json(await getLatestSignals(25, { proofReadyOnly, currentNetworkOnly }));
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/signals/:id", async (req, res, next) => {
    try {
      const id = Number(req.params.id);

      if (!Number.isInteger(id) || id < 1) {
        res.status(400).json({ error: "Invalid signal id" });
        return;
      }

      const signal = await getSignalById(id);
      if (!signal) {
        res.status(404).json({ error: "Signal not found" });
        return;
      }
      res.json(signal);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/agent/stats", async (req, res, next) => {
    try {
      const proofReadyOnly = req.query.records !== "all";
      const currentNetworkOnly = req.query.network !== "all";
      res.json(await getAgentStats({ proofReadyOnly, currentNetworkOnly }));
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/telegram/connect-code", async (_req, res, next) => {
    try {
      if (!config.telegramEnabled || !config.telegramBotToken) {
        res.status(503).json({ error: "Telegram bot is not configured" });
        return;
      }

      const username = await getTelegramBotUsername();
      if (!username) {
        res.status(503).json({ error: "TELEGRAM_BOT_USERNAME is not configured and bot username could not be resolved" });
        return;
      }

      const connectCode = await createConnectCode();
      res.status(201).json({
        code: connectCode.code,
        botUrl: `https://t.me/${username}?start=${connectCode.code}`,
        expiresAt: connectCode.expiresAt,
        status: connectCode.status
      });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/telegram/connect-code/:code/status", async (req, res, next) => {
    try {
      const connectCode = await getConnectCodeStatus(req.params.code);
      if (!connectCode) {
        res.status(404).json({ error: "Connect code not found" });
        return;
      }
      const subscriber = connectCode.chatId ? await getSubscriberByChatId(connectCode.chatId) : null;

      res.json({
        status: connectCode.status,
        connected: connectCode.status === "used" && Boolean(subscriber),
        chatIdMasked: maskChatId(connectCode.chatId),
        username: connectCode.username || null,
        usedAt: connectCode.usedAt,
        subscriber: subscriber
          ? {
              isActive: subscriber.isActive,
              subscribedToCreates: subscriber.subscribedToCreates,
              subscribedToResolves: subscriber.subscribedToResolves,
              minConfidence: subscriber.minConfidence,
              signalTypes: subscriberSignalTypes(subscriber),
              username: subscriber.username,
              chatIdMasked: maskChatId(subscriber.chatId)
            }
          : null
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/telegram/connect-code/:code/test-alert", async (req, res, next) => {
    try {
      const connectCode = await getConnectCodeStatus(req.params.code);
      if (!connectCode) {
        res.status(404).json({ error: "Connect code not found" });
        return;
      }

      if (connectCode.status !== "used" || !connectCode.chatId) {
        res.status(409).json({ error: "Connect Telegram first" });
        return;
      }

      const subscriber = await getSubscriberByChatId(connectCode.chatId);
      if (!subscriber) {
        res.status(409).json({ error: "Telegram subscriber not found" });
        return;
      }

      const rateLimitKey = `${connectCode.code}:${connectCode.chatId}`;
      const now = Date.now();
      const lastSentAt = telegramTestAlertRateLimit.get(rateLimitKey) || 0;
      const retryAfterMs = TELEGRAM_TEST_ALERT_RATE_LIMIT_MS - (now - lastSentAt);
      if (retryAfterMs > 0) {
        res.status(429).json({
          error: "Please wait before sending another test alert",
          retryAfterSeconds: Math.ceil(retryAfterMs / 1000)
        });
        return;
      }

      const result = await sendTelegramConnectionTestAlert(connectCode.chatId, {
        alertsDisabled: !subscriber.isActive
      });

      if (!result.sent) {
        res.status(502).json({ error: result.reason || "Telegram test alert failed" });
        return;
      }

      telegramTestAlertRateLimit.set(rateLimitKey, now);
      res.json({
        sent: true,
        chatIdMasked: maskChatId(connectCode.chatId),
        alertsEnabled: subscriber.isActive
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/telegram/connect-code/:code/disconnect", async (req, res, next) => {
    try {
      const result = await disconnectConnectCode(req.params.code);
      if (result.status === "not_found") {
        res.status(404).json({ error: "Connect code not found" });
        return;
      }

      res.json({
        status: "disconnected",
        connected: false,
        chatIdMasked: maskChatId(result.connectCode?.chatId),
        subscriber: result.subscriber
          ? {
              isActive: result.subscriber.isActive,
              subscribedToCreates: result.subscriber.subscribedToCreates,
              subscribedToResolves: result.subscriber.subscribedToResolves,
              minConfidence: result.subscriber.minConfidence,
              signalTypes: subscriberSignalTypes(result.subscriber),
              username: result.subscriber.username,
              chatIdMasked: maskChatId(result.subscriber.chatId)
            }
          : null
      });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/telegram/subscription/status", async (req, res, next) => {
    try {
      const chatId = typeof req.query.chatId === "string" ? req.query.chatId : "";
      if (!chatId) {
        res.status(400).json({ error: "chatId is required" });
        return;
      }

      const subscriber = await getSubscriberByChatId(chatId);
      res.json({
        connected: Boolean(subscriber?.isActive),
        chatIdMasked: maskChatId(subscriber?.chatId),
        username: subscriber?.username || null,
        subscribedToCreates: subscriber?.subscribedToCreates ?? false,
        subscribedToResolves: subscriber?.subscribedToResolves ?? false,
        minConfidence: subscriber?.minConfidence ?? null
      });
    } catch (error) {
      next(error);
    }
  });

  app.post(config.telegramWebhookPath, async (req, res, next) => {
    try {
      if (config.telegramWebhookSecret) {
        const secret = req.get("X-Telegram-Bot-Api-Secret-Token");
        if (secret !== config.telegramWebhookSecret) {
          res.status(401).json({ error: "Invalid Telegram webhook secret" });
          return;
        }
      }

      await handleTelegramWebhookUpdate(req.body);
      res.json({ ok: true });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/demo/create-signal", async (req, res, next) => {
    try {
      const result = await createDemoSignal(req.body?.kind as DemoEventKind | undefined);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/demo/resolve-pending", async (_req, res, next) => {
    try {
      const { results, skipped } = await resolvePendingDemoSignals({ latestOnly: true, notify: true });
      res.json({ resolved: results.length, skipped: skipped.length, results, skippedSignals: skipped });
    } catch (error) {
      next(error);
    }
  });

  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown server error"
    });
  });

  return app;
}
