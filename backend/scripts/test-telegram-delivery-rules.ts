import { config } from "../src/config.js";
import { selectTelegramRecipients, type TelegramRecipientSubscriber } from "../src/telegram/notifier.js";
import { maskChatId, subscriberReceivesAlert } from "../src/telegram/subscriptions.js";

const signal68 = { confidence: 68, signalType: "Whale Accumulation" };
const signal80 = { confidence: 80, signalType: "Whale Accumulation" };

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function subscriber(overrides: Partial<TelegramRecipientSubscriber> = {}): TelegramRecipientSubscriber {
  return {
    chatId: "subscriber-chat",
    isActive: true,
    subscribedToCreates: true,
    subscribedToResolves: true,
    minConfidence: null,
    signalTypes: null,
    ...overrides
  };
}

async function main() {
  const checks = [
    {
      name: "active subscriber receives eligible create signal",
      passed: subscriberReceivesAlert(signal80, subscriber(), "create")
    },
    {
      name: "inactive subscriber does not receive create signal",
      passed: !subscriberReceivesAlert(signal80, subscriber({ isActive: false }), "create")
    },
    {
      name: "minConfidence=75 blocks confidence=68",
      passed: !subscriberReceivesAlert(signal68, subscriber({ minConfidence: 75 }), "create")
    },
    {
      name: "minConfidence=75 allows confidence=80",
      passed: subscriberReceivesAlert(signal80, subscriber({ minConfidence: 75 }), "create")
    },
    {
      name: "minConfidence=off allows confidence=68",
      passed: subscriberReceivesAlert(signal68, subscriber({ minConfidence: null }), "create")
    },
    {
      name: "subscribedToCreates=false blocks create alert",
      passed: !subscriberReceivesAlert(signal80, subscriber({ subscribedToCreates: false }), "create")
    },
    {
      name: "subscribedToResolves=false blocks resolve alert",
      passed: !subscriberReceivesAlert(signal80, subscriber({ subscribedToResolves: false }), "resolve")
    },
    {
      name: "TELEGRAM_ADMIN_ALERTS=false does not duplicate active subscriber to admin",
      passed:
        selectTelegramRecipients(signal80, "create", [subscriber({ chatId: "admin-chat" })], {
          adminChatId: "admin-chat",
          adminAlerts: false
        }).length === 1
    },
    {
      name: "TELEGRAM_ADMIN_ALERTS=true avoids duplicate when admin is also subscriber",
      passed:
        selectTelegramRecipients(signal80, "create", [subscriber({ chatId: "admin-chat" })], {
          adminChatId: "admin-chat",
          adminAlerts: true
        }).length === 1
    },
    {
      name: "fallback admin receives alert when no active subscribers exist",
      passed:
        selectTelegramRecipients(signal80, "create", [], {
          adminChatId: "admin-chat",
          adminAlerts: false
        }).join(",") === "admin-chat"
    }
  ];

  for (const check of checks) {
    assert(check.passed, `Delivery rule failed: ${check.name}`);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        sentTelegramMessages: false,
        wroteChain: false,
        wroteDatabase: false,
        chatConfigured: Boolean(config.telegramChatId),
        chatIdMasked: maskChatId(config.telegramChatId),
        checks
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
  });
