import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusBadge } from "../../../components/StatusBadge";
import { explorerTxUrl, formatDate, formatMode, formatUsd, predictionLabel, shortHash } from "../../../lib/format";
import { getRuntimeStatus, getSignal } from "../../../lib/api";
import { ArrowLeft, Terminal } from "lucide-react";
import { CopyButton } from "../../../components/CopyButton";

export default async function SignalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [signal, runtime] = await Promise.all([getSignal(id), getRuntimeStatus()]);

  if (!signal) {
    notFound();
  }

  const commitUrl = explorerTxUrl(signal.commitTxHash, runtime.txExplorerBaseUrl);
  const resolveUrl = explorerTxUrl(signal.resolveTxHash, runtime.txExplorerBaseUrl);
  const contractAddress = signal.contractAddress || runtime.signalRegistryAddress;
  const contractUrl = runtime.proofExplorerUrl && contractAddress ? `${runtime.proofExplorerUrl}/address/${contractAddress}` : null;
  const proofNetwork = signal.proofNetwork || runtime.proofNetwork;
  const chainId = signal.chainId || runtime.chainId;
  const rawEventJson = formatJson(signal.rawEventJson);

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

        <section className="flex flex-wrap gap-2">
          <CopyButton value={String(signal.id)} label="Copy signal id" />
          {signal.commitTxHash ? <CopyButton value={signal.commitTxHash} label="Copy tx hash" /> : null}
          {contractAddress ? <CopyButton value={contractAddress} label="Copy contract address" /> : null}
          {commitUrl ? (
            <a href={commitUrl} target="_blank" rel="noreferrer" className="inline-flex items-center border border-white/10 px-2 py-1 text-[10px] font-mono uppercase text-zinc-300 transition-colors hover:border-white/30 hover:text-white">
              Open proof tx
            </a>
          ) : (
            <span className="inline-flex items-center border border-white/10 px-2 py-1 text-[10px] font-mono uppercase text-zinc-600">
              {runtime.isMock ? "Mock proof, not on-chain" : "Local Hardhat transaction, explorer unavailable"}
            </span>
          )}
          {contractUrl ? (
            <a href={contractUrl} target="_blank" rel="noreferrer" className="inline-flex items-center border border-white/10 px-2 py-1 text-[10px] font-mono uppercase text-zinc-300 transition-colors hover:border-white/30 hover:text-white">
              Open contract
            </a>
          ) : contractAddress ? (
            <span className="inline-flex items-center border border-white/10 px-2 py-1 text-[10px] font-mono uppercase text-zinc-600">
              Local Hardhat transaction, explorer unavailable
            </span>
          ) : null}
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-medium text-white tracking-tight border-b border-white/10 pb-2">Signal Summary</h2>
          <div className="grid gap-px bg-white/10 grid-cols-1 sm:grid-cols-2 md:grid-cols-4 border border-white/10 overflow-hidden">
            <Info label="Signal type" value={signal.signalType} />
            <Info label="Asset pair" value={signal.counterAsset ? `${signal.asset}/${signal.counterAsset}` : signal.asset} />
            <Info label="Prediction" value={predictionLabel(signal.prediction)} />
            <Info label="Confidence" value={`${signal.confidence}%`} />
            <Info label="Status / outcome" value={`${signal.status} / ${signal.outcome}`} />
            <Info label="Evaluation time" value={formatDate(signal.evaluationTime)} />
            <Info label="Signal ID" value={signal.id} />
            <Info label="Created" value={formatDate(signal.createdAt)} />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-medium text-white tracking-tight border-b border-white/10 pb-2">Source Event</h2>
          <div className="grid gap-px bg-white/10 grid-cols-1 sm:grid-cols-2 md:grid-cols-4 border border-white/10 overflow-hidden">
            <Info label="Market data mode" value={formatMode(signal.marketDataMode)} />
            <Info label="Source chain" value={signal.sourceChain || "Not available"} />
            <Info label="Source tx hash" value={signal.sourceTxHash || "Not available"} />
            <Info label="Source block" value={signal.sourceBlockNumber || "Not available"} />
            <Info label="Source wallet" value={signal.sourceWallet || signal.wallet || "Not applicable"} />
            <Info label="Protocol" value={signal.sourceProtocol || "Unknown"} />
            <Info label="Pool" value={signal.sourcePool || signal.pool || "Unknown"} />
            <Info label="Event type" value={signal.sourceEventType || "Not available"} />
            <Info label="USD value" value={formatUsd(signal.usdValue)} />
            <Info label="Detected at" value={signal.detectedAt ? formatDate(signal.detectedAt) : "Not available"} />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-medium text-white tracking-tight border-b border-white/10 pb-2">AI Reasoning</h2>
          <p className="text-base leading-relaxed text-zinc-400 font-light" dangerouslySetInnerHTML={{ __html: signal.aiSummary }} />
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

        <section className="space-y-4">
          <h2 className="text-xl font-medium text-white tracking-tight border-b border-white/10 pb-2">On-chain Proof</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Proof label="Proof network" value={proofNetwork} />
            <Proof label="Chain ID" value={String(chainId)} />
            <Proof label="Chain signal ID" value={signal.chainSignalId === null ? null : String(signal.chainSignalId)} />
            <Proof label="Contract address" value={contractAddress} href={contractUrl} />
            <Proof label="Commit tx" value={signal.commitTxHash} href={commitUrl} />
            <Proof label="Commit block" value={signal.commitBlockNumber} />
            <Proof label="Committed at" value={signal.committedAt ? formatDate(signal.committedAt) : null} />
            <Proof label="Resolve tx" value={signal.resolveTxHash} href={resolveUrl} />
            <Proof label="Outcome" value={signal.outcome} />
            <Proof label="Data hash" value={signal.dataHash} />
            <Proof label="Reasoning hash" value={signal.reasoningHash} />
            <Proof label="Proof network key" value={signal.proofNetworkKey} />
          </div>
          {!runtime.explorerEnabled ? (
            <p className="text-xs font-mono text-zinc-500">Local Hardhat transaction, explorer unavailable</p>
          ) : null}
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

        <section className="space-y-4">
          <h2 className="text-xl font-medium text-white tracking-tight border-b border-white/10 pb-2">Raw Event JSON</h2>
          <details className="bg-[#050505] border border-zinc-800 p-1 font-mono text-xs">
            <summary className="cursor-pointer bg-zinc-900 border-b border-zinc-800 px-4 py-2 text-zinc-500">raw_event.json</summary>
            <pre className="p-4 overflow-x-auto whitespace-pre-wrap break-words text-zinc-400 leading-relaxed max-h-[300px]">
              {rawEventJson}
            </pre>
          </details>
        </section>
      </div>
    </main>
  );
}

function formatJson(value?: string | null) {
  if (!value) return "Not available";
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
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
  const isTx = label.toLowerCase().includes("tx");
  const isContract = label.toLowerCase().includes("contract");

  return (
    <div className="border border-white/10 bg-[#0a0a0a] p-5 space-y-1">
      <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">{label}</p>
      {value ? (
        href ? (
          <div className="flex flex-wrap items-center gap-2">
            <a href={href} target="_blank" rel="noreferrer" className="font-mono text-xs text-white hover:text-mantle transition-colors block underline">
              {isContract ? "Open contract" : "Open proof tx"} · {shortHash(value)}
            </a>
            <CopyButton value={value} label={isTx ? "Copy tx hash" : isContract ? "Copy contract address" : "Copy"} />
          </div>
        ) : (
          <div className="space-y-2">
            <p className="font-mono text-xs text-zinc-400 break-all">{value}</p>
            <CopyButton value={value} label={isTx ? "Copy tx hash" : isContract ? "Copy contract address" : "Copy"} />
          </div>
        )
      ) : (
        <p className="text-xs text-zinc-600 font-mono">Not available yet</p>
      )}
    </div>
  );
}
