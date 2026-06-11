import crypto from "node:crypto";
import type { MarketDataSource, MarketEvent, MarketEventType } from "../types.js";

type EventTemplate = Omit<
  MarketEvent,
  "id" | "observedAt" | "detectedAt" | "txHash" | "sourceTxHash" | "rawEventJson" | "sourceBlockNumber" | "dataHash" | "reasoningHash"
>;

const templates: EventTemplate[] = [
  {
    kind: "repeated_buys",
    marketDataMode: "demo",
    sourceChain: "Mantle Mainnet (demo)",
    sourceWallet: "0x9d5d2bE53f4F8a7E7D13c45E10D483a941eEab21",
    sourceProtocol: "Merchant Moe",
    sourcePool: "MNT/USDT",
    asset: "MNT",
    counterAsset: "USDT",
    usdValue: 184000,
    eventType: "repeated_buy_swaps",
    wallet: "0x9d5d2bE53f4F8a7E7D13c45E10D483a941eEab21",
    pool: "MNT/USDT",
    amountUsd: 184000,
    txCount: 7,
    direction: "buy",
    notes: "Tracked wallet accumulated MNT through seven swaps over a compressed window."
  },
  {
    kind: "large_swap",
    marketDataMode: "demo",
    sourceChain: "Mantle Mainnet (demo)",
    sourceWallet: "0x7a3B91cC2D3F8B2A6A2b37a89255F340B82C9a0F",
    sourceProtocol: "Agni Finance",
    sourcePool: "mETH/MNT",
    asset: "mETH",
    counterAsset: "MNT",
    usdValue: 262000,
    eventType: "large_buy_swap",
    wallet: "0x7a3B91cC2D3F8B2A6A2b37a89255F340B82C9a0F",
    pool: "mETH/MNT",
    amountUsd: 262000,
    txCount: 1,
    direction: "buy",
    notes: "Single large swap moved into mETH with size well above the rolling demo baseline."
  },
  {
    kind: "liquidity_removal",
    marketDataMode: "demo",
    sourceChain: "Mantle Mainnet (demo)",
    sourceWallet: "0x34E351A9e881f30731700C4D4D798D5525b6f85E",
    sourceProtocol: "FusionX",
    sourcePool: "USDT/MNT",
    asset: "USDT/MNT",
    counterAsset: "MNT",
    usdValue: 391000,
    eventType: "liquidity_removed",
    pool: "USDT/MNT",
    amountUsd: 391000,
    txCount: 1,
    direction: "remove",
    notes: "Liquidity was removed from a Mantle DEX pool, increasing short-term slippage risk."
  },
  {
    kind: "tracked_wallet_action",
    marketDataMode: "demo",
    sourceChain: "Mantle Mainnet (demo)",
    sourceWallet: "0xA17c9fA1fa5A64C0B6d89c37b5A41e947938fF02",
    sourceProtocol: "INIT Capital",
    sourcePool: "MNT collateral vault",
    asset: "MNT",
    counterAsset: "USDT",
    usdValue: 118000,
    eventType: "smart_wallet_collateral_deposit",
    wallet: "0xA17c9fA1fa5A64C0B6d89c37b5A41e947938fF02",
    pool: "MNT collateral vault",
    amountUsd: 118000,
    txCount: 3,
    direction: "deposit",
    notes: "Smart wallet deposited collateral after several MNT buys, suggesting conviction but not certainty."
  },
  {
    kind: "volume_spike",
    marketDataMode: "demo",
    sourceChain: "Mantle Mainnet (demo)",
    sourceWallet: "0x5b82F2c4a9cC8fCE91957f6C841a1c2b143A6C39",
    sourceProtocol: "Merchant Moe",
    sourcePool: "MNT/USDC",
    asset: "MNT",
    counterAsset: "USDC",
    usdValue: 524000,
    eventType: "pool_volume_spike",
    wallet: "0x5b82F2c4a9cC8fCE91957f6C841a1c2b143A6C39",
    pool: "MNT/USDC",
    amountUsd: 524000,
    txCount: 18,
    direction: "buy",
    notes: "Pool volume spiked above the demo rolling baseline with clustered same-direction swaps."
  },
  {
    kind: "exit_risk",
    marketDataMode: "demo",
    sourceChain: "Mantle Mainnet (demo)",
    sourceWallet: "0xEd8b0fAc915eD9d8B69565e37f9248618A9A4a77",
    sourceProtocol: "Agni Finance",
    sourcePool: "mETH/USDT",
    asset: "mETH",
    counterAsset: "USDT",
    usdValue: 338000,
    eventType: "large_sell_to_stable",
    wallet: "0xEd8b0fAc915eD9d8B69565e37f9248618A9A4a77",
    pool: "mETH/USDT",
    amountUsd: 338000,
    txCount: 2,
    direction: "sell",
    notes: "A monitored wallet rotated a large mETH position into stable liquidity before evaluation."
  }
];

let cursor = 0;

export function buildDemoMarketEvent(kind?: MarketEventType): MarketEvent {
  const available = kind ? templates.filter((event) => event.kind === kind) : templates;
  const template = available[cursor % available.length] || templates[0];
  cursor += 1;

  const now = new Date();
  const seed = `${template.kind}:${template.asset}:${now.toISOString()}:${cursor}`;
  const digest = crypto.createHash("sha256").update(seed).digest("hex");
  const sourceBlockNumber = String(68_100_000 + cursor * 17);
  const txHash = `0x${digest.padEnd(64, "0").slice(0, 64)}`;
  const raw = {
    source: "demo-generator",
    sourceChain: template.sourceChain,
    sourceBlockNumber,
    txHash,
    protocol: template.sourceProtocol,
    pool: template.sourcePool,
    asset: template.asset,
    counterAsset: template.counterAsset,
    usdValue: template.usdValue,
    eventType: template.eventType,
    direction: template.direction,
    txCount: template.txCount
  };

  return {
    ...template,
    id: `evt_${digest.slice(0, 12)}`,
    observedAt: now.toISOString(),
    detectedAt: now.toISOString(),
    txHash,
    sourceTxHash: txHash,
    sourceBlockNumber,
    rawEventJson: JSON.stringify(raw, null, 2)
  };
}

export const demoMarketDataSource: MarketDataSource = {
  mode: "demo",
  label: "Demo-generated market events",
  async getNextMarketEvent(kind?: MarketEventType) {
    return buildDemoMarketEvent(kind);
  }
};
