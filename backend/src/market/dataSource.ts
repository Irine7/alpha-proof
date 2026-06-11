import { config } from "../config.js";
import type { MarketDataSource } from "../types.js";
import { demoMarketDataSource } from "./demoDataSource.js";
import { historicalMainnetDataSource } from "./historicalMainnetDataSource.js";
import { liveMainnetDataSource } from "./liveMainnetDataSource.js";

export function getMarketDataSource(): MarketDataSource {
  if (config.marketDataMode === "historical_mainnet") return historicalMainnetDataSource;
  if (config.marketDataMode === "live_mainnet") return liveMainnetDataSource;
  return demoMarketDataSource;
}
