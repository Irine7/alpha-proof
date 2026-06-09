import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusBadge } from "../../../components/StatusBadge";
import { explorerTxUrl, formatDate, predictionLabel, shortHash } from "../../../lib/format";
import { getSignal } from "../../../lib/api";
import { ArrowLeft, Terminal } from "lucide-react";

export default async function SignalDetailPage({ params }: { params: { id: string } }) {
  const signal = await getSignal(params.id);

  if (!signal) {
    notFound();
  }

  const commitUrl = explorerTxUrl(signal.commitTxHash);
  const resolveUrl = explorerTxUrl(signal.resolveTxHash);

  return (
    <main className="relative z-10 pt-32 pb-20 max-w-[1000px] mx-auto px-6">
      {/* Back Link */}
      <Link 
        href="/dashboard" 
        className="inline-flex items-center gap-2 text-xs font-mono uppercase text-zinc-500 hover:text-white transition-colors mb-8"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
      </Link>

      {/* Main Details Panel */}
      <div className="border border-white/10 bg-[#0a0a0a] p-8 md:p-12 space-y-12">
        
        {/* Header Block */}
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start border-b border-white/10 pb-8">
          <div className="space-y-3">
            <p className="text-xs font-mono uppercase tracking-widest text-zinc-500">{"//"} SIGNAL #{signal.id}</p>
            <h1 className="text-4xl font-medium tracking-tight text-white">{signal.signalType}</h1>
            <p className="text-lg text-zinc-400 font-light">
              {signal.asset} · <span className="font-mono text-sm text-zinc-500">{predictionLabel(signal.prediction)}</span> · {signal.confidence}% confidence
            </p>
          </div>
          <div>
            <StatusBadge status={signal.status} outcome={signal.outcome} />
          </div>
        </div>

        {/* Info Bento Grid */}
        <section className="grid gap-px bg-white/10 grid-cols-1 sm:grid-cols-2 md:grid-cols-4 border border-white/10 overflow-hidden">
          <Info label="Chain signal ID" value={signal.chainSignalId ?? "Mock/local"} />
          <Info label="Evaluation time" value={formatDate(signal.evaluationTime)} />
          <Info label="Wallet" value={signal.wallet || "Not applicable"} />
          <Info label="Pool" value={signal.pool || "Not applicable"} />
        </section>

        {/* AI Summary */}
        <section className="space-y-4">
          <h2 className="text-xl font-medium text-white tracking-tight border-b border-white/10 pb-2">AI Summary</h2>
          <p className="text-base leading-relaxed text-zinc-400 font-light" dangerouslySetInnerHTML={{ __html: signal.aiSummary }} />
        </section>

        {/* Technical Terminal: Full AI Reasoning */}
        <section className="space-y-4">
          <h2 className="text-xl font-medium text-white tracking-tight border-b border-white/10 pb-2">Full AI Reasoning</h2>
          <div className="bg-[#050505] border border-zinc-800 p-1 flex flex-col font-mono text-xs">
            <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-2 flex justify-between items-center text-zinc-500">
              <span className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5" />
                <span>reasoning_engine_log</span>
              </span>
              <span className="flex gap-1">
                <div className="w-2 h-2 bg-zinc-700 rounded-full" />
                <div className="w-2 h-2 bg-zinc-700 rounded-full" />
                <div className="w-2 h-2 bg-zinc-700 rounded-full" />
              </span>
            </div>
            <pre className="p-4 overflow-x-auto whitespace-pre-wrap text-zinc-400 leading-relaxed max-h-[400px]">
              {signal.reasoning}
            </pre>
          </div>
        </section>

        {/* Proof Signatures */}
        <section className="grid gap-4 md:grid-cols-2">
          <Proof label="Reasoning hash" value={signal.reasoningHash} />
          <Proof label="Data hash" value={signal.dataHash} />
          <Proof label="Commit tx" value={signal.commitTxHash} href={commitUrl} />
          <Proof label="Resolve tx" value={signal.resolveTxHash} href={resolveUrl} />
        </section>

        {/* Technical Terminal: Source Event Data */}
        <section className="space-y-4">
          <h2 className="text-xl font-medium text-white tracking-tight border-b border-white/10 pb-2">Source Event Data</h2>
          <div className="bg-[#050505] border border-zinc-800 p-1 flex flex-col font-mono text-xs">
            <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-2 flex justify-between items-center text-zinc-500">
              <span>event_source_data.json</span>
              <span className="flex gap-1">
                <div className="w-2 h-2 bg-zinc-700 rounded-full" />
                <div className="w-2 h-2 bg-zinc-700 rounded-full" />
                <div className="w-2 h-2 bg-zinc-700 rounded-full" />
              </span>
            </div>
            <pre className="p-4 overflow-x-auto text-zinc-400 leading-relaxed max-h-[300px]">
              {signal.sourceDataJson}
            </pre>
          </div>
        </section>
      </div>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-[#0a0a0a] p-5 space-y-1">
      <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-medium text-white break-all">{value}</p>
    </div>
  );
}

function Proof({ label, value, href }: { label: string; value?: string | null; href?: string | null }) {
  return (
    <div className="border border-white/10 bg-[#0a0a0a] p-5 space-y-1">
      <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">{label}</p>
      {value ? (
        href ? (
          <a href={href} target="_blank" rel="noreferrer" className="font-mono text-xs text-white hover:text-mantle transition-colors block underline">
            {shortHash(value)}
          </a>
        ) : (
          <p className="font-mono text-xs text-zinc-400 break-all">{value}</p>
        )
      ) : (
        <p className="text-xs text-zinc-600 font-mono">Not available yet</p>
      )}
    </div>
  );
}
