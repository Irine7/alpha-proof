import { assertChainConfigured, assertExpectedRpcChainId, chainModeLabel, config } from "./config.js";
import { createServer } from "./api/server.js";
import { startTelegramBot, stopTelegramBot } from "./telegram/bot.js";

async function main() {
  if (config.chainMode === "testnet") {
    assertChainConfigured();
  }
  await assertExpectedRpcChainId();

  const app = createServer();

  const server = app.listen(config.port, () => {
    console.log(`AlphaProof backend listening on http://localhost:${config.port}`);
    console.log("Chain mode:", chainModeLabel());
  });

  await startTelegramBot();

  const shutdown = (signal: NodeJS.Signals) => {
    stopTelegramBot(signal);
    server.close(() => {
      process.exit(0);
    });
    setTimeout(() => process.exit(0), 2_000).unref();
  };

  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
