import { AlertTriangle, CheckCircle, Database, ExternalLink, Server } from "lucide-react";
import type { RuntimeStatus } from "../lib/types";
import { shortHash } from "../lib/format";

export function RuntimeStatusPanel({ runtime }: { runtime: RuntimeStatus }) {
  const tone = runtime.isOnChain
    ? "border-mantle/30 bg-mantle/5 text-mantle"
    : "border-amber-300/30 bg-amber-300/5 text-amber-200";
  const proofTarget = runtime.isMock ? "Mock" : runtime.proofNetwork;
  const explorerStatus = runtime.explorerEnabled ? "enabled" : "unavailable";

  return (
    <section className="mb-12 border border-white/10 bg-[#0a0a0a]">
      <div className="grid gap-0 border-b border-white/10 lg:grid-cols-[1fr_1fr_auto] lg:divide-x divide-white/10">
        <Summary label="Reading" value={runtime.marketDataSource} />
        <Summary label="Writing proof to" value={proofTarget} />
        <div className="p-6">
          <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Safety boundary</p>
          <p className="mt-3 text-sm font-mono text-white">No trading · No custody · Not financial advice</p>
          <p className="mt-2 text-xs font-mono text-zinc-500">Explorer: {explorerStatus}</p>
        </div>
      </div>
      <div className="border-b border-white/10 px-6 py-4">
        <p className="max-w-4xl text-sm leading-relaxed text-zinc-400">
          Market events and proof network are separated. During demo, AlphaProof reads historical Mantle mainnet-style events while committing proofs to the configured proof network.
        </p>
      </div>
      <div className="grid gap-0 md:grid-cols-2 xl:grid-cols-4 md:divide-x divide-white/10">
        <div className="border-b border-white/10 p-5 md:border-b-0">
          <div className="mb-3 flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
            <Server size={14} aria-hidden />
            Proof network
          </div>
          <div className={`inline-flex items-center gap-2 border px-3 py-2 text-xs font-mono uppercase ${tone}`}>
            {runtime.isOnChain ? <CheckCircle size={14} aria-hidden /> : <AlertTriangle size={14} aria-hidden />}
            {runtime.proofNetworkLabel}
          </div>
          <p className="mt-2 text-xs text-zinc-500">CHAIN_MODE={runtime.chainMode} · chainId={runtime.chainId}</p>
        </div>

        <div className="border-b border-white/10 p-5 md:border-b-0">
          <div className="mb-3 flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
            <Database size={14} aria-hidden />
            Market data source
          </div>
          <p className="font-mono text-sm text-white">{runtime.marketDataSource}</p>
          <p className="mt-2 text-xs text-zinc-500">MARKET_DATA_MODE={runtime.marketDataMode}</p>
        </div>

        <div className="border-b border-white/10 p-5 md:border-b-0">
          <div className="mb-3 text-[10px] font-mono uppercase tracking-wider text-zinc-500">RPC target</div>
          <p className="font-mono text-sm text-white">{runtime.rpcTarget}</p>
          <p className="mt-2 text-xs text-zinc-500">
            Explorer: {explorerStatus}
          </p>
        </div>

        <div className="p-5">
          <div className="mb-3 text-[10px] font-mono uppercase tracking-wider text-zinc-500">SignalRegistry</div>
          {runtime.contractExplorerUrl ? (
            <a href={runtime.contractExplorerUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 font-mono text-sm text-white underline hover:text-mantle">
              {shortHash(runtime.signalRegistryAddress)}
              <ExternalLink size={13} aria-hidden />
            </a>
          ) : (
            <p className="font-mono text-sm text-white">
              {runtime.signalRegistryAddress ? shortHash(runtime.signalRegistryAddress) : "Not configured"}
            </p>
          )}
          <p className="mt-2 text-xs text-zinc-500">
            {runtime.isOnChain
              ? "Create Proof Signal writes to the configured proof contract."
              : "Mock mode stores local proof metadata without a real contract transaction."}
          </p>
        </div>
      </div>
      <div className="grid gap-0 border-t border-white/10 md:grid-cols-2 md:divide-x divide-white/10">
        <div className="p-5">
          <div className="mb-3 text-[10px] font-mono uppercase tracking-wider text-zinc-500">Last source event</div>
          <p className="font-mono text-sm text-white">
            {runtime.lastSourceEvent
              ? `${runtime.lastSourceEvent.eventType || "event"} · ${runtime.lastSourceEvent.asset}`
              : "Not available yet"}
          </p>
          <p className="mt-2 text-xs text-zinc-500 truncate">
            {runtime.lastSourceEvent?.txHash ? shortHash(runtime.lastSourceEvent.txHash) : runtime.lastSourceEvent?.sourceChain || "Create a proof signal to populate this"}
          </p>
        </div>
        <div className="p-5">
          <div className="mb-3 text-[10px] font-mono uppercase tracking-wider text-zinc-500">Last proof tx</div>
          {runtime.lastProofTx && runtime.txExplorerBaseUrl ? (
            <a href={`${runtime.txExplorerBaseUrl}/${runtime.lastProofTx}`} target="_blank" rel="noreferrer" className="font-mono text-sm text-white underline hover:text-mantle">
              {shortHash(runtime.lastProofTx)}
            </a>
          ) : (
            <p className="font-mono text-sm text-white">{runtime.lastProofTx ? shortHash(runtime.lastProofTx) : "Not available yet"}</p>
          )}
          <p className="mt-2 text-xs text-zinc-500">{runtime.proofNetwork}</p>
        </div>
      </div>
    </section>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-6">
      <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-3 text-xl font-medium text-white tracking-tight">{value}</p>
    </div>
  );
}
