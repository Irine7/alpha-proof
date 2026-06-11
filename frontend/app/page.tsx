import Link from 'next/link';
import { 
  ArrowRight, 
  ShieldCheck, 
  Terminal, 
  Database, 
  Cpu, 
  CheckCircle2
} from 'lucide-react';
import { LocalClock } from "../components/LocalClock";
import { getRuntimeStatus, getSignals, getStats } from "../lib/api";
import { predictionLabel, shortHash } from "../lib/format";

export default async function Landing() {
  const [signals, stats, runtime] = await Promise.all([getSignals(), getStats(), getRuntimeStatus()]);
  const latestSignal = signals[0] || null;
  const tickerSignals = signals.length ? [...signals.slice(0, 5), ...signals.slice(0, 5)] : [];
  const demoLabel = runtime.marketDataMode === "live_mainnet" ? "Run Live Demo" : "Run Proof Demo";

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-300 font-sans selection:bg-white selection:text-black">
      <main className="relative z-10 pt-32 pb-20 max-w-[1400px] mx-auto">
        {/* Hero Section - Asymmetric, Data-driven */}
        <div className="px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-end min-h-[60vh]">
          <div className="lg:col-span-8 space-y-8">
            <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-wider text-zinc-500">
              <span className="flex items-center gap-2 text-mantle">
                <span className="w-2 h-2 bg-mantle rounded-full animate-pulse" />
                Runtime Interface
              </span>
              <span>{"//"}</span>
              <span>{runtime.proofNetwork}</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-medium text-white tracking-tighter leading-[1.05]">
              Quant-grade AI<br />
              <span className="text-zinc-500">On-chain verified</span>
            </h1>
            
            <p className="max-w-xl text-lg text-zinc-400 leading-relaxed font-light">
              Raw blockchain activity is transformed into verifiable AI signals through detection, reasoning, and on-chain commitment.
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              <Link href="/dashboard" className="bg-white text-black px-6 py-3 text-sm font-medium hover:bg-zinc-200 transition-colors flex items-center gap-2">
                {demoLabel} <ArrowRight className="w-4 h-4" />
              </Link>
              <a href="https://github.com/Irine7/alpha-proof" target="_blank" rel="noreferrer" className="border border-white/10 hover:border-white/30 text-white px-6 py-3 text-sm font-medium transition-colors flex items-center gap-2 bg-[#0a0a0a]">
                <Terminal className="w-4 h-4" /> View Contracts
              </a>
            </div>
          </div>

          <div className="lg:col-span-4 border-l border-white/10 pl-6 space-y-6 hidden lg:block">
            <div className="space-y-1">
              <div className="text-[10px] font-mono text-zinc-500">AVG SIGNAL CONFIDENCE</div>
              <div className="text-3xl font-light text-white">{stats.averageConfidence}%</div>
            </div>
            <div className="space-y-1">
              <div className="text-[10px] font-mono text-zinc-500">SIGNALS IN NEON</div>
              <div className="text-3xl font-light text-white">{stats.totalSignals}</div>
            </div>
            <div className="space-y-1">
              <div className="text-[10px] font-mono text-zinc-500">LOCAL SYSTEM TIME</div>
              <div className="text-3xl font-light text-white font-mono"><LocalClock /></div>
            </div>
          </div>
        </div>

        {/* Technical Ticker */}
        <div className="mt-20 border-y border-white/10 flex overflow-hidden bg-white/[0.02]">
          <div className="flex whitespace-nowrap animate-marquee py-3 text-xs font-mono text-zinc-500">
            {tickerSignals.length ? (
              tickerSignals.map((signal, index) => (
                <span key={`${signal.id}-${index}`} className={signal.status === "Resolved" ? "mx-4 text-mantle" : "mx-4"}>
                  TX: {shortHash(signal.commitTxHash)} [{signal.status.toUpperCase()}: {signal.signalType.toUpperCase().replaceAll(" ", "_")}]
                </span>
              ))
            ) : (
              <span className="mx-4 text-mantle">NO SIGNALS YET - OPEN DASHBOARD AND CREATE ONE</span>
            )}
          </div>
        </div>

        {/* Section: Architecture - Bento/Grid Style */}
        <section id="mechanics" className="pt-32 px-6">
          <div className="mb-12">
            <h2 className="text-3xl font-medium tracking-tight text-white mb-4">Architecture</h2>
            <p className="text-zinc-400 max-w-xl">
              Raw blockchain activity is transformed into verifiable AI signals through detection, reasoning, and on-chain commitment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 border border-white/10 bg-[#0a0a0a]">
            <div className="p-8 border-b md:border-b-0 md:border-r border-white/10 hover:bg-white/[0.02] transition-colors">
              <Database className="w-5 h-5 text-white mb-8" />
              <div className="text-xs font-mono text-zinc-500 mb-2">PHASE_01</div>
              <h3 className="text-lg font-medium text-white mb-3">Ingestion</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Market events are read from the configured source: demo-generated events, historical Mantle mainnet fixtures, or a future live Mantle mainnet reader
              </p>
            </div>
            
            <div className="p-8 border-b md:border-b-0 md:border-r border-white/10 hover:bg-white/[0.02] transition-colors">
              <Cpu className="w-5 h-5 text-white mb-8" />
              <div className="text-xs font-mono text-zinc-500 mb-2">PHASE_02</div>
              <h3 className="text-lg font-medium text-white mb-3">Detection</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                The detector converts source events into risk alerts and predictions with confidence, source hashes, and AI reasoning
              </p>
            </div>

            <div className="p-8 hover:bg-white/[0.02] transition-colors">
              <ShieldCheck className="w-5 h-5 text-white mb-8" />
              <div className="text-xs font-mono text-zinc-500 mb-2">PHASE_03</div>
              <h3 className="text-lg font-medium text-white mb-3">On-chain Commit</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                The signal is cryptographically hashed and recorded on the selected proof network before the outcome is evaluated
              </p>
            </div>
          </div>
        </section>

        {/* Section: Verification / Terminal UI */}
        <section id="verification" className="pt-32 px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div>
              <h2 className="text-3xl font-medium tracking-tight text-white mb-6">Proof-Backed Signals</h2>
              <div className="space-y-6 text-zinc-400 text-sm leading-relaxed">
                <p>
                  The market is filled with black boxes and retrospective analytics. In Web3, trust must be replaced by mathematical proof
                </p>
                <p>
                  AlphaProof AI cannot forge history or delete an unsuccessful forecast. Each agent prediction becomes a proof transaction, locking in the timestamp and model confidence
                </p>
                <ul className="space-y-4 pt-4 border-t border-white/10 mt-6">
                  <li className="flex items-center gap-3 text-white">
                    <CheckCircle2 className="w-4 h-4 text-zinc-500" />
                    <span>Zero possibility of data manipulation</span>
                  </li>
                  <li className="flex items-center gap-3 text-white">
                    <CheckCircle2 className="w-4 h-4 text-zinc-500" />
                    <span>Public on-chain agent statistics</span>
                  </li>
                  <li className="flex items-center gap-3 text-white">
                    <CheckCircle2 className="w-4 h-4 text-zinc-500" />
                    <span>Auditable commit smart contracts</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Signal Terminal */}
            <div className="overflow-hidden rounded-lg border border-zinc-800 bg-[#050505] font-mono text-xs shadow-2xl shadow-black/40">
              <div className="grid h-11 grid-cols-[auto_1fr_auto] items-center border-b border-zinc-800 bg-[#18181b] px-4 text-zinc-500">
                <span className="flex items-center gap-2" aria-hidden>
                  <span className="grid h-3.5 w-3.5 place-items-center rounded-full bg-[#ff5f57] text-[10px] leading-none text-red-950">x</span>
                  <span className="grid h-3.5 w-3.5 place-items-center rounded-full bg-[#febc2e] text-[10px] leading-none text-yellow-950">-</span>
                  <span className="grid h-3.5 w-3.5 place-items-center rounded-full bg-[#28c840] text-[10px] leading-none text-green-950">-</span>
                </span>
                <span className="justify-self-center text-[11px] uppercase tracking-[0.18em] text-zinc-400">signal_trace</span>
                <span className="text-[10px] uppercase tracking-[0.16em] text-zinc-600">Neon / Chain</span>
              </div>
              <div className="flex h-[300px] flex-col justify-end space-y-2 overflow-hidden bg-black p-5 text-zinc-400">
                {latestSignal ? (
                  <>
                    <div className="opacity-50">&gt; Proof network: {runtime.proofNetwork}</div>
                    <div className="opacity-50">&gt; Market source: {runtime.marketDataSource}</div>
                    <div className="opacity-50">&gt; Loading latest Neon signal... OK</div>
                    <div>&gt; WARN: {latestSignal.signalType} detected for {latestSignal.asset}</div>
                    <div>&gt; Prediction: {predictionLabel(latestSignal.prediction)}</div>
                    <div className="text-white">&gt; SIGNAL: {latestSignal.asset} / {latestSignal.signalType}</div>
                    <div>&gt; Confidence score: {(latestSignal.confidence / 100).toFixed(2)}</div>
                    <div className="py-2">
                      <div className={latestSignal.status === "Resolved" ? "text-mantle" : "text-amber-300"}>
                        {latestSignal.status === "Resolved" ? "✓ Resolved on current record" : "• Pending evaluation"}
                      </div>
                      <div className="text-zinc-500">  Chain id: {latestSignal.chainSignalId ?? "mock/local fallback"}</div>
                      <div className="text-zinc-500">  Tx: {shortHash(latestSignal.commitTxHash)}</div>
                      <div className="text-zinc-500">  Reasoning: {shortHash(latestSignal.reasoningHash)}</div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="opacity-50">&gt; Proof network: {runtime.proofNetwork}</div>
                    <div className="opacity-50">&gt; Market source: {runtime.marketDataSource}</div>
                    <div>&gt; No backend signals found</div>
                    <div className="text-mantle">&gt; Open Dashboard and create the first proof signal</div>
                  </>
                )}
                <div className="animate-pulse">&gt; _</div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#0a0a0a] mt-32">
        <div className="max-w-[1400px] mx-auto px-6 py-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-mono text-zinc-600">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-zinc-600" />
            ALPHAPROOF AI © {new Date().getFullYear()}
          </div>
          <div className="flex gap-6">
            <a href="https://github.com/Irine7/alpha-proof" target="_blank" rel="noreferrer" className="hover:text-white transition-colors flex items-center gap-2">GitHub</a>
            <span className="text-zinc-700">Telegram planned</span>
            <a href="#" className="hover:text-white transition-colors">Docs</a>
          </div>
          <div>NOT FINANCIAL ADVICE</div>
        </div>
      </footer>
    </div>
  );
}
