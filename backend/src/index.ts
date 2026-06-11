import { assertChainConfigured, assertExpectedRpcChainId, chainModeLabel, config } from "./config.js";
import { createServer } from "./api/server.js";
import { startTelegramBot } from "./telegram/bot.js";

async function main() {
  if (config.chainMode === "testnet") {
    assertChainConfigured();
  }
  await assertExpectedRpcChainId();

  const app = createServer();

  app.listen(config.port, () => {
    console.log(`AlphaProof backend listening on http://localhost:${config.port}`);
    console.log("Chain mode:", chainModeLabel());
  });

  startTelegramBot();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
