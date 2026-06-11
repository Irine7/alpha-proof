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

export function formatUsd(value?: number | null) {
  if (value === null || value === undefined) return "Not available";
  return new Intl.NumberFormat("en", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

export function formatMode(value?: string | null) {
  if (!value) return "Not available";
  return value.replaceAll("_", " ");
}

export function minutesUntil(value: string) {
  const diff = new Date(value).getTime() - Date.now();
  if (diff <= 0) return "due now";
  return `${Math.ceil(diff / 60000)} min`;
}

export function explorerTxUrl(txHash?: string | null, txExplorerBaseUrl?: string | null) {
  if (!txHash) return null;
  if (!txExplorerBaseUrl) return null;
  return `${txExplorerBaseUrl}/${txHash}`;
}
