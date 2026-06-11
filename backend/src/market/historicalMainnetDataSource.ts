import fs from "node:fs/promises";
import path from "node:path";
import type { MarketDataSource, MarketEvent, MarketEventType } from "../types.js";

let cursor = 0;
let cachedEvents: MarketEvent[] | null = null;

async function loadEvents() {
  if (cachedEvents) return cachedEvents;

  const fixturePath = path.resolve(process.cwd(), "src", "market", "mantle-mainnet.fixture.json");
  const raw = await fs.readFile(fixturePath, "utf8");
  cachedEvents = JSON.parse(raw) as MarketEvent[];
  return cachedEvents;
}

export const historicalMainnetDataSource: MarketDataSource = {
  mode: "historical_mainnet",
  label: "Historical Mantle mainnet events",
  async getNextMarketEvent(kind?: MarketEventType) {
    const events = await loadEvents();
    const available = kind ? events.filter((event) => event.kind === kind) : events;
    const template = available[cursor % available.length] || events[0];
    cursor += 1;

    const detectedAt = new Date().toISOString();
    return {
      ...template,
      marketDataMode: "historical_mainnet",
      detectedAt,
      observedAt: template.observedAt || detectedAt
    };
  }
};
