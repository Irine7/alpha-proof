import { config } from "../src/config.js";
import { getLatestSignals } from "../src/db/signals.js";
import { prisma } from "../src/db/prisma.js";
import { shortenHash } from "../src/telegram/formatter.js";
import { sendTelegramTestAlert } from "../src/telegram/notifier.js";

function assertTelegramEnv() {
  if (!config.telegramEnabled) {
    throw new Error("Telegram test requires TELEGRAM_ENABLED=true.");
  }
  if (!config.telegramBotToken) {
    throw new Error("Telegram test requires TELEGRAM_BOT_TOKEN.");
  }
  if (!config.telegramChatId) {
    throw new Error("Telegram test requires TELEGRAM_CHAT_ID.");
  }
}

async function main() {
  assertTelegramEnv();

  const [latest] = await getLatestSignals(1, { proofReadyOnly: true, currentNetworkOnly: true });
  if (!latest) {
    throw new Error("No latest proof-backed signal found; create proof signal first.");
  }

  const result = await sendTelegramTestAlert(latest);
  if (!result.sent) {
    throw new Error(`Telegram test alert was not sent: ${result.reason || "unknown reason"}`);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        message: "Telegram test alert sent for latest signal.",
        telegramEnabled: config.telegramEnabled,
        chatConfigured: Boolean(config.telegramChatId),
        dbSignalId: latest.id,
        contractSignalId: latest.chainSignalId ?? "pending / unavailable",
        proofTxShortHash: shortenHash(latest.commitTxHash)
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
