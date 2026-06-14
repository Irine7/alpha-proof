import { Telegraf } from "telegraf";
import { config } from "../src/config.js";
import { TELEGRAM_COMMANDS } from "../src/telegram/commands.js";

type CommandAction = "set" | "get" | "delete";

function commandAction(value: string | undefined): CommandAction {
  if (value === "set" || value === "get" || value === "delete") return value;
  throw new Error("Usage: pnpm telegram:set-commands | telegram:get-commands | telegram:delete-commands");
}

async function main() {
  const action = commandAction(process.argv[2]);

  if (!config.telegramBotToken) {
    console.warn("TELEGRAM_BOT_TOKEN is not configured; Telegram command menu was not changed.");
    console.log(JSON.stringify({ ok: false, action, tokenConfigured: false }, null, 2));
    return;
  }

  const bot = new Telegraf(config.telegramBotToken);

  if (action === "set") {
    await bot.telegram.setMyCommands(TELEGRAM_COMMANDS);
    console.log(JSON.stringify({ ok: true, action, commands: TELEGRAM_COMMANDS }, null, 2));
    return;
  }

  if (action === "get") {
    const commands = await bot.telegram.getMyCommands();
    console.log(JSON.stringify({ ok: true, action, commands }, null, 2));
    return;
  }

  await bot.telegram.deleteMyCommands();
  console.log(JSON.stringify({ ok: true, action, commands: [] }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
