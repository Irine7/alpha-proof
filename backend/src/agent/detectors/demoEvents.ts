import crypto from "node:crypto";
import type { DemoEvent, DemoEventKind } from "../../types.js";

const events: Array<Omit<DemoEvent, "id" | "observedAt" | "txHash">> = [
  {
    kind: "repeated_buys",
    asset: "MNT",
    wallet: "0x9d5d2bE53f4F8a7E7D13c45E10D483a941eEab21",
    amountUsd: 184000,
    txCount: 7,
    direction: "buy",
    notes: "Tracked wallet accumulated MNT through seven swaps over a compressed window."
  },
  {
    kind: "large_swap",
    asset: "mETH",
    wallet: "0x7a3B91cC2D3F8B2A6A2b37a89255F340B82C9a0F",
    amountUsd: 262000,
    txCount: 1,
    direction: "buy",
    notes: "Single large swap moved into mETH with size well above the rolling demo baseline."
  },
  {
    kind: "liquidity_removal",
    asset: "USDT/MNT",
    pool: "0xPoolMantleUsdtMnt00000000000000000000001",
    amountUsd: 391000,
    direction: "remove",
    notes: "Liquidity was removed from a Mantle DEX pool, increasing short-term slippage risk."
  },
  {
    kind: "tracked_wallet_action",
    asset: "MNT",
    wallet: "0xA17c9fA1fa5A64C0B6d89c37b5A41e947938fF02",
    amountUsd: 118000,
    txCount: 3,
    direction: "deposit",
    notes: "Smart wallet deposited collateral after several MNT buys, suggesting conviction but not certainty."
  }
];

let cursor = 0;

export function createDemoEvent(kind?: DemoEventKind): DemoEvent {
  const available = kind ? events.filter((event) => event.kind === kind) : events;
  const template = available[cursor % available.length] || events[0];
  cursor += 1;

  const now = new Date();
  const seed = `${template.kind}:${template.asset}:${now.toISOString()}:${cursor}`;
  const digest = crypto.createHash("sha256").update(seed).digest("hex");

  return {
    ...template,
    id: `evt_${digest.slice(0, 12)}`,
    observedAt: now.toISOString(),
    txHash: `0x${digest.padEnd(64, "0").slice(0, 64)}`
  };
}
