import type { SignalOutcome, SignalStatus } from "../lib/types";

export function StatusBadge({ status, outcome }: { status: SignalStatus | string; outcome?: SignalOutcome | string }) {
  const label = status === "Pending" ? "Pending" : outcome || "Resolved";
  
  let tone = "border-zinc-800 bg-zinc-900/50 text-zinc-500";
  if (label === "Correct") {
    tone = "border-emerald-500/20 bg-emerald-500/5 text-mantle";
  } else if (label === "Failed") {
    tone = "border-red-500/20 bg-red-500/5 text-red-400";
  } else if (label === "Inconclusive") {
    tone = "border-amber-500/20 bg-amber-500/5 text-amber-400";
  } else if (label === "Pending") {
    tone = "border-zinc-700 bg-zinc-800/30 text-zinc-400";
  }

  return (
    <span className={`inline-block border px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider ${tone}`}>
      {label}
    </span>
  );
}
