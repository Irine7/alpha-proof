import Link from "next/link";
import { evaluationPendingLabel, explorerTxUrl, formatDate, formatUsd, predictionLabel, shortHash } from "../lib/format";
import { isProofReadySignal } from "../lib/proof";
import type { RuntimeStatus, Signal } from "../lib/types";
import { CopyButton } from "./CopyButton";
import { StatusBadge } from "./StatusBadge";

export function SignalCard({ signal, runtime }: { signal: Signal; runtime: RuntimeStatus }) {
  const txUrl = explorerTxUrl(signal.commitTxHash, runtime.txExplorerBaseUrl);
  const isProofReady = isProofReadySignal(signal);
  const isDifferentNetwork = Boolean(signal.proofNetworkKey && signal.proofNetworkKey !== runtime.currentProofNetworkKey);
  const isLegacyNetworkRecord = !signal.proofNetworkKey;

  return (
    <article className={`border bg-[#0a0a0a] hover:bg-white/[0.02] transition-colors flex flex-col justify-between ${signal.status === "Pending" ? "border-amber-300/40" : "border-white/10"}`}>
      {signal.status === "Pending" ? (
        <div className="border-b border-amber-300/30 bg-amber-300/10 px-6 py-3 font-mono text-[10px] uppercase tracking-wider text-amber-100">
          COMMITTED BEFORE OUTCOME
        </div>
      ) : null}
      <div className="p-6 flex flex-1 flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">{"//"} {signal.signalType}</p>
            <h3 className="mt-2 text-2xl font-medium text-white tracking-tight">{signal.asset}</h3>
            <div className="mt-1 space-y-1 text-[10px] font-mono uppercase tracking-wider text-zinc-600">
              <p>DB Signal ID #{signal.id}</p>
              <p>Contract Signal ID {signal.chainSignalId === null ? "Not available" : `#${signal.chainSignalId}`}</p>
            </div>
          </div>
          <StatusBadge status={signal.status} outcome={signal.outcome} />
        </div>
        {!isProofReady ? (
          <div className="mt-4 inline-flex border border-amber-300/30 bg-amber-300/5 px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-amber-200">
            Legacy record / incomplete source event
          </div>
        ) : isDifferentNetwork ? (
          <div className="mt-4 inline-flex border border-amber-300/30 bg-amber-300/5 px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-amber-200">
            Different proof network
          </div>
        ) : isLegacyNetworkRecord ? (
          <div className="mt-4 inline-flex border border-amber-300/30 bg-amber-300/5 px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-amber-200">
            Legacy/local record
          </div>
        ) : runtime.isMock ? (
          <div className="mt-4 inline-flex border border-amber-300/30 bg-amber-300/5 px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-amber-200">
            Mock proof, not on-chain
          </div>
        ) : null}
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
              {signal.status === "Pending" ? evaluationPendingLabel(signal.evaluationTime) : formatDate(signal.evaluationTime)}
            </p>
          </div>
          <div className="border border-white/10 bg-[#050505] p-3 space-y-1 col-span-2 sm:col-span-1">
            <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">Proof Tx</p>
            {txUrl ? (
              <div className="space-y-2">
                <a href={txUrl} target="_blank" rel="noreferrer" className="font-mono text-xs text-white hover:text-mantle transition-colors block truncate underline">
                  Open proof tx · {shortHash(signal.commitTxHash)}
                </a>
                {signal.commitTxHash ? <CopyButton value={signal.commitTxHash} label="Copy tx hash" /> : null}
              </div>
            ) : signal.commitTxHash ? (
              <div className="space-y-2">
                <p className="text-xs font-mono text-zinc-400 break-words">
                  {runtime.isMock
                    ? `Mock proof · ${shortHash(signal.commitTxHash)}`
                    : `Local Hardhat transaction, explorer unavailable · ${shortHash(signal.commitTxHash)}`}
                </p>
                <CopyButton value={signal.commitTxHash} label="Copy tx hash" />
              </div>
            ) : (
              <p className="text-xs font-mono text-zinc-600">Pending</p>
            )}
          </div>
        </div>
        {signal.status === "Pending" ? (
          <div className="mt-4 border border-amber-300/20 bg-amber-300/5 p-4 text-xs font-mono text-amber-100">
            <div className="grid gap-2 sm:grid-cols-2">
              <p>Pending outcome</p>
              <p>{evaluationPendingLabel(signal.evaluationTime)}</p>
              <p>Contract Signal ID {signal.chainSignalId === null ? "Not available" : `#${signal.chainSignalId}`}</p>
              <p>DB Signal ID #{signal.id}</p>
              <p>Proof tx</p>
              <p>{shortHash(signal.commitTxHash)}</p>
            </div>
            {signal.commitTxHash ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {txUrl ? (
                  <a href={txUrl} target="_blank" rel="noreferrer" className="inline-flex items-center border border-amber-300/30 px-2 py-1 text-[10px] uppercase tracking-wider text-amber-100 transition-colors hover:border-amber-200 hover:text-white">
                    Open proof tx
                  </a>
                ) : null}
                <CopyButton value={signal.commitTxHash} label="Copy tx hash" />
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
      
      <div className="pt-6">
        <Link href={`/signals/${signal.id}`} className="inline-block text-xs font-mono uppercase bg-white text-black px-4 py-2 hover:bg-zinc-200 transition-colors">
          View Proof Details_
        </Link>
      </div>
      </div>
    </article>
  );
}
