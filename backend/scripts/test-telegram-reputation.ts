import { config } from "../src/config.js";
import { getAgentStats } from "../src/db/signals.js";
import { prisma } from "../src/db/prisma.js";
import { sendTelegramReputationTest } from "../src/telegram/notifier.js";

function assertTelegramEnv() {
  if (!config.telegramEnabled) {
    throw new Error("Telegram reputation test requires TELEGRAM_ENABLED=true.");
  }
  if (!config.telegramBotToken) {
    throw new Error("Telegram reputation test requires TELEGRAM_BOT_TOKEN.");
  }
  if (!config.telegramChatId) {
    throw new Error("Telegram reputation test requires TELEGRAM_CHAT_ID.");
  }
}

async function main() {
  assertTelegramEnv();

  const stats = await getAgentStats({ proofReadyOnly: true, currentNetworkOnly: true });
  const result = await sendTelegramReputationTest(stats);
  if (!result.sent) {
    throw new Error(`Telegram reputation test was not sent: ${result.reason || "unknown reason"}`);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        message: "Telegram reputation test sent.",
        telegramEnabled: config.telegramEnabled,
        chatConfigured: Boolean(config.telegramChatId),
        totalSignals: stats.totalSignals,
        resolved: stats.resolvedSignals,
        pending: stats.pendingSignals,
        accuracy: `${stats.accuracy}%`
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
