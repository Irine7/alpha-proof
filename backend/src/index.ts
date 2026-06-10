import { chainModeLabel, config } from "./config.js";
import { createServer } from "./api/server.js";
import { startTelegramBot } from "./telegram/bot.js";

const app = createServer();

app.listen(config.port, () => {
  console.log(`AlphaProof backend listening on http://localhost:${config.port}`);
  console.log("Chain mode:", chainModeLabel());
});

startTelegramBot();
