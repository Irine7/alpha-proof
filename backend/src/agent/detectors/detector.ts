import type { MarketEvent, Prediction, SignalCandidate } from "../../types.js";

export function detectSignal(event: MarketEvent): SignalCandidate {
  const map: Record<typeof event.kind, { signalType: string; prediction: Prediction }> = {
    large_swap: { signalType: "Whale Accumulation", prediction: event.direction === "sell" ? -1 : 1 },
    repeated_buys: { signalType: "Whale Accumulation", prediction: 1 },
    liquidity_removal: { signalType: "Liquidity Shock", prediction: -1 },
    tracked_wallet_action: { signalType: "Smart Wallet Activity", prediction: 0 },
    volume_spike: { signalType: "Volume Spike", prediction: event.direction === "sell" ? -1 : 1 },
    exit_risk: { signalType: "Exit Risk", prediction: -1 }
  };

  const selected = map[event.kind];

  return {
    signalType: selected.signalType,
    asset: event.asset,
    wallet: event.wallet,
    pool: event.pool,
    prediction: selected.prediction
  };
}
