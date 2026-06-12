import { config } from "../src/config.js";

type WebhookAction = "set" | "delete" | "info";

function assertTelegramToken() {
  if (!config.telegramBotToken) {
    throw new Error("Telegram webhook command requires TELEGRAM_BOT_TOKEN.");
  }
}

async function telegramApi<T>(method: string, body?: Record<string, unknown>): Promise<T> {
  assertTelegramToken();

  const response = await fetch(`https://api.telegram.org/bot${config.telegramBotToken}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : "{}"
  });

  const result = (await response.json()) as T & { ok?: boolean; description?: string };
  if (!response.ok || result.ok === false) {
    throw new Error(result.description || `Telegram API ${method} failed`);
  }
  return result;
}

async function setWebhook() {
  if (!config.telegramWebhookUrl) {
    throw new Error("telegram:set-webhook requires TELEGRAM_WEBHOOK_URL.");
  }

  await telegramApi("setWebhook", {
    url: config.telegramWebhookUrl,
    ...(config.telegramWebhookSecret ? { secret_token: config.telegramWebhookSecret } : {})
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        action: "setWebhook",
        webhookUrlConfigured: true,
        secretConfigured: Boolean(config.telegramWebhookSecret)
      },
      null,
      2
    )
  );
}

async function deleteWebhook() {
  await telegramApi("deleteWebhook", { drop_pending_updates: false });
  console.log(JSON.stringify({ ok: true, action: "deleteWebhook" }, null, 2));
}

async function webhookInfo() {
  const result = await telegramApi<{
    ok: boolean;
    result: {
      url?: string;
      has_custom_certificate?: boolean;
      pending_update_count?: number;
      last_error_date?: number;
      last_error_message?: string;
      max_connections?: number;
    };
  }>("getWebhookInfo");

  console.log(
    JSON.stringify(
      {
        ok: true,
        urlConfigured: Boolean(result.result.url),
        pendingUpdateCount: result.result.pending_update_count ?? 0,
        lastErrorDate: result.result.last_error_date ?? null,
        lastErrorMessage: result.result.last_error_message ?? null,
        maxConnections: result.result.max_connections ?? null
      },
      null,
      2
    )
  );
}

const action = (process.argv[2] || "info") as WebhookAction;

if (action === "set") {
  await setWebhook();
} else if (action === "delete") {
  await deleteWebhook();
} else {
  await webhookInfo();
}
