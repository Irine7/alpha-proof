import Link from "next/link";
import { explorerTxUrl, formatDate, formatUsd, minutesUntil, predictionLabel, shortHash } from "../lib/format";
import type { RuntimeStatus, Signal } from "../lib/types";
import { StatusBadge } from "./StatusBadge";

export function SignalCard({ signal, runtime }: { signal: Signal; runtime: RuntimeStatus }) {
  const txUrl = explorerTxUrl(signal.commitTxHash, runtime.txExplorerBaseUrl);

  return (
    <article className="border border-white/10 bg-[#0a0a0a] p-6 hover:bg-white/[0.02] transition-colors flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">{"//"} {signal.signalType}</p>
            <h3 className="mt-2 text-2xl font-medium text-white tracking-tight">{signal.asset}</h3>
          </div>
          <StatusBadge status={signal.status} outcome={signal.outcome} />
        </div>
        <p className="mt-4 text-sm text-zinc-400 font-light leading-relaxed" dangerouslySetInnerHTML={{ __html: signal.aiSummary }} />
        
        <div className="mt-6 grid gap-2 grid-cols-2">
          <div className="border border-white/10 bg-[#050505] p-3 space-y-1">
            <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">Source event</p>
            <p className="text-sm font-medium text-white truncate">{signal.sourceEventType || "Unknown"}</p>
          </div>
          <div className="border border-white/10 bg-[#050505] p-3 space-y-1">
            <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">USD value</p>
            <p className="text-sm font-medium text-white">{formatUsd(signal.usdValue)}</p>
          </div>
          <div className="border border-white/10 bg-[#050505] p-3 space-y-1">
            <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">Confidence</p>
            <p className="text-sm font-medium text-white">{signal.confidence}%</p>
          </div>
          <div className="border border-white/10 bg-[#050505] p-3 space-y-1">
            <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">Prediction</p>
            <p className="text-sm font-medium text-white">{predictionLabel(signal.prediction)}</p>
          </div>
          <div className="border border-white/10 bg-[#050505] p-3 space-y-1 col-span-2 sm:col-span-1">
            <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">Evaluation</p>
            <p className="text-xs font-mono text-zinc-400 truncate">
              {signal.status === "Pending" ? `in ${minutesUntil(signal.evaluationTime)}` : formatDate(signal.evaluationTime)}
            </p>
          </div>
          <div className="border border-white/10 bg-[#050505] p-3 space-y-1 col-span-2 sm:col-span-1">
            <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">Proof Tx</p>
            {txUrl ? (
              <a href={txUrl} target="_blank" rel="noreferrer" className="font-mono text-xs text-white hover:text-mantle transition-colors block truncate underline">
                {shortHash(signal.commitTxHash)}
              </a>
            ) : signal.commitTxHash ? (
              <p className="text-xs font-mono text-zinc-400 truncate">{shortHash(signal.commitTxHash)} · {runtime.proofNetwork}</p>
            ) : (
              <p className="text-xs font-mono text-zinc-600">Pending</p>
            )}
          </div>
        </div>
        {signal.status === "Pending" ? (
          <p className="mt-4 text-xs font-mono text-amber-200">
            Pending outcome · committed before result · evaluation in {minutesUntil(signal.evaluationTime)}
          </p>
        ) : null}
      </div>
      
      <div className="pt-6">
        <Link href={`/signals/${signal.id}`} className="inline-block text-xs font-mono uppercase bg-white text-black px-4 py-2 hover:bg-zinc-200 transition-colors">
          View Proof Details_
        </Link>
      </div>
    </article>
  );
}
