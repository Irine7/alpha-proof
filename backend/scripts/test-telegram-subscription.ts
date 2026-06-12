import { config } from "../src/config.js";
import { prisma } from "../src/db/prisma.js";
import { createOrUpdateSubscriberFromTelegram, getSubscriberByChatId, maskChatId } from "../src/telegram/subscriptions.js";

async function main() {
  if (!config.telegramEnabled) {
    throw new Error("Telegram subscription test requires TELEGRAM_ENABLED=true.");
  }
  if (!config.telegramChatId) {
    throw new Error("Telegram subscription test requires TELEGRAM_CHAT_ID.");
  }

  await createOrUpdateSubscriberFromTelegram(config.telegramChatId, {});
  const subscriber = await getSubscriberByChatId(config.telegramChatId);
  if (!subscriber?.isActive) {
    throw new Error("Telegram subscription test failed: subscriber is not active.");
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        subscriberActive: subscriber.isActive,
        chatIdMasked: maskChatId(subscriber.chatId),
        subscribedToCreates: subscriber.subscribedToCreates,
        subscribedToResolves: subscriber.subscribedToResolves,
        minConfidence: subscriber.minConfidence
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
