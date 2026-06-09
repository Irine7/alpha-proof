export function shortHash(value?: string | null) {
  if (!value) return "Not available";
  return `${value.slice(0, 10)}...${value.slice(-8)}`;
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export function predictionLabel(prediction: number) {
  if (prediction > 0) return "Bullish / up";
  if (prediction < 0) return "Bearish / risk";
  return "Neutral watch";
}

export function explorerTxUrl(txHash?: string | null) {
  if (!txHash) return null;
  const base = process.env.NEXT_PUBLIC_MANTLE_EXPLORER_URL;
  if (!base || !process.env.NEXT_PUBLIC_SIGNAL_REGISTRY_ADDRESS) return null;
  return `${base}/tx/${txHash}`;
}
