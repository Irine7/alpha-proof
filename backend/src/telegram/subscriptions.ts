import crypto from "node:crypto";
import { Prisma, type Signal } from "../generated/prisma/index.js";
import { prisma } from "../db/prisma.js";

export type TelegramIdentity = {
  telegramUserId?: string | null;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
};

export type TelegramSubscriptionSettings = {
  subscribedToCreates?: boolean;
  subscribedToResolves?: boolean;
  minConfidence?: number | null;
  signalTypes?: string[] | null;
};

const CONNECT_CODE_TTL_MS = 10 * 60 * 1000;

function normalizeSignalTypes(signalTypes: string[] | null | undefined): Prisma.InputJsonValue | typeof Prisma.JsonNull | undefined {
  if (signalTypes === undefined) return undefined;
  if (signalTypes === null) return Prisma.JsonNull;

  const values = [...new Set(signalTypes.map((value) => value.trim()).filter(Boolean))];
  return values.length ? values : Prisma.JsonNull;
}

function signalTypesFromJson(value: Prisma.JsonValue | null): string[] | null {
  if (!Array.isArray(value)) return null;
  const values = value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0);
  return values.length ? values : null;
}

function randomConnectCode() {
  return `ap_${crypto.randomBytes(24).toString("base64url").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 48)}`;
}

export function maskChatId(chatId: string | null | undefined) {
  if (!chatId) return null;
  if (chatId.length <= 6) return "***";
  return `${chatId.slice(0, 3)}...${chatId.slice(-3)}`;
}

export async function expireOldConnectCodes() {
  return prisma.telegramConnectCode.updateMany({
    where: {
      status: "pending",
      expiresAt: { lt: new Date() }
    },
    data: { status: "expired" }
  });
}

export async function createConnectCode() {
  await expireOldConnectCodes();

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const code = randomConnectCode();
    try {
      return await prisma.telegramConnectCode.create({
        data: {
          code,
          status: "pending",
          expiresAt: new Date(Date.now() + CONNECT_CODE_TTL_MS)
        }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (!message.includes("Unique constraint")) throw error;
    }
  }

  throw new Error("Could not create a unique Telegram connect code.");
}

export async function createOrUpdateSubscriberFromTelegram(chatId: string, identity: TelegramIdentity = {}) {
  const now = new Date();
  return prisma.telegramSubscriber.upsert({
    where: { chatId },
    create: {
      chatId,
      telegramUserId: identity.telegramUserId || null,
      username: identity.username || null,
      firstName: identity.firstName || null,
      lastName: identity.lastName || null,
      isActive: true,
      lastSeenAt: now
    },
    update: {
      telegramUserId: identity.telegramUserId || null,
      username: identity.username || null,
      firstName: identity.firstName || null,
      lastName: identity.lastName || null,
      isActive: true,
      lastSeenAt: now
    }
  });
}

export async function consumeConnectCode(code: string, identity: TelegramIdentity, chatId: string) {
  await expireOldConnectCodes();

  const connectCode = await prisma.telegramConnectCode.findUnique({ where: { code } });
  if (!connectCode) return { status: "not_found" as const, subscriber: null, connectCode: null };
  if (connectCode.status === "used") return { status: "used" as const, subscriber: null, connectCode };
  if (connectCode.status === "expired" || connectCode.expiresAt.getTime() <= Date.now()) {
    const expired = await prisma.telegramConnectCode.update({
      where: { code },
      data: { status: "expired" }
    });
    return { status: "expired" as const, subscriber: null, connectCode: expired };
  }

  const subscriber = await createOrUpdateSubscriberFromTelegram(chatId, identity);
  const used = await prisma.telegramConnectCode.update({
    where: { code },
    data: {
      status: "used",
      chatId,
      telegramUserId: identity.telegramUserId || null,
      username: identity.username || null,
      usedAt: new Date()
    }
  });

  return { status: "connected" as const, subscriber, connectCode: used };
}

export async function getConnectCodeStatus(code: string) {
  await expireOldConnectCodes();
  return prisma.telegramConnectCode.findUnique({ where: { code } });
}

export async function unsubscribe(chatId: string) {
  return prisma.telegramSubscriber.upsert({
    where: { chatId },
    create: {
      chatId,
      isActive: false,
      lastSeenAt: new Date()
    },
    update: {
      isActive: false,
      lastSeenAt: new Date()
    }
  });
}

export async function getSubscriberByChatId(chatId: string) {
  return prisma.telegramSubscriber.findUnique({ where: { chatId } });
}

export async function listActiveSubscribers() {
  return prisma.telegramSubscriber.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" }
  });
}

export async function updateSubscriberSettings(chatId: string, settings: TelegramSubscriptionSettings) {
  return prisma.telegramSubscriber.update({
    where: { chatId },
    data: {
      ...(settings.subscribedToCreates !== undefined ? { subscribedToCreates: settings.subscribedToCreates } : {}),
      ...(settings.subscribedToResolves !== undefined ? { subscribedToResolves: settings.subscribedToResolves } : {}),
      ...(settings.minConfidence !== undefined ? { minConfidence: settings.minConfidence } : {}),
      ...(settings.signalTypes !== undefined ? { signalTypes: normalizeSignalTypes(settings.signalTypes) } : {}),
      lastSeenAt: new Date()
    }
  });
}

export async function deactivateSubscriber(chatId: string) {
  return prisma.telegramSubscriber.update({
    where: { chatId },
    data: { isActive: false }
  });
}

export function subscriberSignalTypes(subscriber: { signalTypes: Prisma.JsonValue | null }) {
  return signalTypesFromJson(subscriber.signalTypes);
}

export function signalPassesSubscriberFilters(
  signal: Pick<Signal, "confidence" | "signalType">,
  subscriber: { minConfidence: number | null; signalTypes: Prisma.JsonValue | null }
) {
  if (subscriber.minConfidence !== null && signal.confidence < subscriber.minConfidence) return false;

  const signalTypes = subscriberSignalTypes(subscriber);
  if (signalTypes && !signalTypes.some((signalType) => signalType.toLowerCase() === signal.signalType.toLowerCase())) {
    return false;
  }

  return true;
}
