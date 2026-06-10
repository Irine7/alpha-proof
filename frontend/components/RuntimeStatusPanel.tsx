import { AlertTriangle, CheckCircle, Server } from "lucide-react";
import type { RuntimeStatus } from "../lib/types";
import { shortHash } from "../lib/format";

export function RuntimeStatusPanel({ runtime }: { runtime: RuntimeStatus }) {
  const tone = runtime.isOnChain
    ? "border-mantle/30 bg-mantle/5 text-mantle"
    : "border-amber-300/30 bg-amber-300/5 text-amber-200";

  return (
    <section className="mb-12 border border-white/10 bg-[#0a0a0a]">
      <div className="grid gap-0 md:grid-cols-[1fr_1fr_1.2fr] md:divide-x divide-white/10">
        <div className="border-b border-white/10 p-5 md:border-b-0">
          <div className="mb-3 flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
            <Server size={14} aria-hidden />
            Backend chain mode
          </div>
          <div className={`inline-flex items-center gap-2 border px-3 py-2 text-xs font-mono uppercase ${tone}`}>
            {runtime.isOnChain ? <CheckCircle size={14} aria-hidden /> : <AlertTriangle size={14} aria-hidden />}
            {runtime.chainModeLabel}
          </div>
        </div>

        <div className="border-b border-white/10 p-5 md:border-b-0">
          <div className="mb-3 text-[10px] font-mono uppercase tracking-wider text-zinc-500">RPC target</div>
          <p className="font-mono text-sm text-white">{runtime.rpcTarget}</p>
          <p className="mt-2 text-xs text-zinc-500">
            CHAIN_MODE={runtime.chainMode}
          </p>
        </div>

        <div className="p-5">
          <div className="mb-3 text-[10px] font-mono uppercase tracking-wider text-zinc-500">SignalRegistry</div>
          <p className="font-mono text-sm text-white">
            {runtime.signalRegistryAddress ? shortHash(runtime.signalRegistryAddress) : "Not configured"}
          </p>
          <p className="mt-2 text-xs text-zinc-500">
            {runtime.isOnChain
              ? "Create Demo Signal should write to the configured contract."
              : "Mock mode stores local proof metadata without a real contract transaction."}
          </p>
        </div>
      </div>
    </section>
  );
}
