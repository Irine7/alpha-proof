import { config } from "../src/config.js";

function webhookPathFromUrl(value: string) {
  try {
    return new URL(value).pathname;
  } catch {
    return null;
  }
}

const isWebhookMode = config.telegramMode === "webhook";
const webhookUrlPath = config.telegramWebhookUrl ? webhookPathFromUrl(config.telegramWebhookUrl) : null;
const issues: string[] = [];
const warnings: string[] = [];

if (isWebhookMode && !config.telegramWebhookUrl) {
  issues.push("TELEGRAM_WEBHOOK_URL is required when TELEGRAM_MODE=webhook.");
}

if (isWebhookMode && config.telegramWebhookUrl && webhookUrlPath !== config.telegramWebhookPath) {
  issues.push("TELEGRAM_WEBHOOK_URL path must match TELEGRAM_WEBHOOK_PATH.");
}

if (isWebhookMode && !config.telegramWebhookSecret) {
  warnings.push("TELEGRAM_WEBHOOK_SECRET is not configured; set a secret for deployed webhook mode.");
}

if (config.telegramWebhookUrl) {
  try {
    const parsed = new URL(config.telegramWebhookUrl);
    if (parsed.protocol !== "https:") {
      warnings.push("Telegram webhooks should use a public HTTPS URL.");
    }
    if (["localhost", "127.0.0.1", "::1"].includes(parsed.hostname.toLowerCase())) {
      warnings.push("Telegram webhook URL is local; use polling for local/dev.");
    }
  } catch {
    issues.push("TELEGRAM_WEBHOOK_URL is not a valid URL.");
  }
}

console.log(
  JSON.stringify(
    {
      ok: issues.length === 0,
      mode: config.telegramMode,
      tokenConfigured: Boolean(config.telegramBotToken),
      webhookUrlConfigured: Boolean(config.telegramWebhookUrl),
      webhookSecretConfigured: Boolean(config.telegramWebhookSecret),
      webhookPath: config.telegramWebhookPath,
      webhookUrlPath,
      wouldCallSetWebhook: false,
      issues,
      warnings
    },
    null,
    2
  )
);

if (issues.length) process.exitCode = 1;
