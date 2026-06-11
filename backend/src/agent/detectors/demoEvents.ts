import type { DemoEvent, DemoEventKind } from "../../types.js";
import { buildDemoMarketEvent } from "../../market/demoDataSource.js";

export function createDemoEvent(kind?: DemoEventKind): DemoEvent {
  return buildDemoMarketEvent(kind);
}
