import crypto from "node:crypto";
import { Contract, formatUnits, id, Interface, JsonRpcProvider, parseUnits } from "ethers";
import { config } from "../config.js";
import type { MarketDataSource, MarketEvent } from "../types.js";

const erc20Abi = [
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)"
];

const transferInterface = new Interface(erc20Abi);
const transferTopic = id("Transfer(address,address,uint256)");

function requireLiveConfig() {
  const missing = [
    ["MANTLE_MAINNET_RPC_URL", config.mantleMainnetRpcUrl],
    ["TRACKED_TOKEN_ADDRESSES", config.trackedTokenAddresses.join(",")]
  ]
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length) {
    throw new Error(`Live mainnet reader not configured. Missing: ${missing.join(", ")}`);
  }
}

async function readTokenMeta(provider: JsonRpcProvider, tokenAddress: string) {
  const token = new Contract(tokenAddress, erc20Abi, provider);
  const [symbol, decimals] = await Promise.all([
    token.symbol().catch(() => "ERC20"),
    token.decimals().catch(() => 18)
  ]);

  return { symbol: String(symbol), decimals: Number(decimals) };
}

export const liveMainnetDataSource: MarketDataSource = {
  mode: "live_mainnet",
  label: "Live Mantle mainnet reader",
  async getNextMarketEvent(): Promise<MarketEvent> {
    requireLiveConfig();

    const provider = new JsonRpcProvider(config.mantleMainnetRpcUrl);
    const latestBlock = await provider.getBlockNumber();
    const fromBlock = Math.max(0, latestBlock - config.liveScanBlockWindow);
    const thresholdText = config.liveTransferThresholdUnits || "100000";

    for (const tokenAddress of config.trackedTokenAddresses) {
      const { symbol, decimals } = await readTokenMeta(provider, tokenAddress);
      const threshold = parseUnits(thresholdText, decimals);
      const logs = await provider.getLogs({
        address: tokenAddress,
        topics: [transferTopic],
        fromBlock,
        toBlock: latestBlock
      });

      for (const log of logs.reverse()) {
        const parsed = transferInterface.parseLog({ topics: [...log.topics], data: log.data });
        if (!parsed) continue;

        const value = parsed.args.value as bigint;
        if (value < threshold) continue;

        const formattedValue = Number(formatUnits(value, decimals));
        const block = await provider.getBlock(log.blockNumber);
        const detectedAt = new Date().toISOString();
        const observedAt = block?.timestamp ? new Date(block.timestamp * 1000).toISOString() : detectedAt;
        const raw = {
          source: "live-mainnet-transfer-reader",
          tokenAddress,
          symbol,
          decimals,
          from: parsed.args.from,
          to: parsed.args.to,
          value: value.toString(),
          formattedValue,
          thresholdUnits: thresholdText,
          txHash: log.transactionHash,
          blockNumber: log.blockNumber,
          limitations: "Minimal MVP reader: Transfer events only, no price oracle, no DEX path reconstruction, no reorg handling."
        };
        const digest = crypto.createHash("sha256").update(`${log.transactionHash}:${log.index}`).digest("hex");

        return {
          id: `live_${digest.slice(0, 12)}`,
          kind: "whale_transfer",
          marketDataMode: "live_mainnet",
          sourceChain: "Mantle Mainnet",
          sourceTxHash: log.transactionHash,
          sourceBlockNumber: String(log.blockNumber),
          sourceWallet: String(parsed.args.from),
          sourceProtocol: "ERC-20 Transfer reader",
          sourcePool: tokenAddress,
          asset: symbol,
          usdValue: null,
          usdValueNote: "USD value unavailable in minimal live reader; token units are shown instead.",
          eventType: "large_transfer",
          detectedAt,
          rawEventJson: JSON.stringify(raw, null, 2),
          wallet: String(parsed.args.from),
          pool: tokenAddress,
          amountUsd: formattedValue,
          txCount: 1,
          direction: "withdraw",
          observedAt,
          txHash: log.transactionHash,
          notes: `Large ${symbol} Transfer event detected over the last ${config.liveScanBlockWindow} Mantle Mainnet blocks. USD pricing is not attached in the MVP reader.`
        };
      }
    }

    throw new Error(
      `Live mainnet reader found no Transfer events above ${thresholdText} units in the last ${config.liveScanBlockWindow} blocks for TRACKED_TOKEN_ADDRESSES.`
    );
  }
};
