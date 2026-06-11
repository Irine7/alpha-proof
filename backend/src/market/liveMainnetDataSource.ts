import { config } from "../config.js";
import type { MarketDataSource } from "../types.js";

export const liveMainnetDataSource: MarketDataSource = {
  mode: "live_mainnet",
  label: "Live Mantle mainnet reader",
  async getNextMarketEvent() {
    if (!config.mantleMainnetRpcUrl) {
      throw new Error("MARKET_DATA_MODE=live_mainnet requires MANTLE_MAINNET_RPC_URL. Live reader wiring is intentionally not mocked.");
    }

    throw new Error("Live Mantle mainnet reader is prepared but not implemented yet. Use MARKET_DATA_MODE=historical_mainnet for hackathon proof flow.");
  }
};
