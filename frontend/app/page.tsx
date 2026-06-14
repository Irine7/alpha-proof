import Link from 'next/link';
import { 
  ArrowRight, 
  ShieldCheck, 
  Database, 
  Cpu, 
  CheckCircle2
} from 'lucide-react';
import { HeroTelegramAlert } from "../components/HeroTelegramAlert";
import { HeroTelegramConnectButton } from "../components/HeroTelegramConnectButton";
import { getRuntimeStatus, getSignals, getStats } from "../lib/api";
import { evaluationPendingLabel, explorerTxUrl, predictionLabel, shortHash } from "../lib/format";
import type { Signal } from "../lib/types";

export default async function Landing() {
  const [signals, stats, runtime] = await Promise.all([getSignals(), getStats(), getRuntimeStatus()]);
  const latestSignal = latestByCreatedAt(signals);
  const tickerSignals = signals.length ? [...signals.slice(0, 5), ...signals.slice(0, 5)] : [];
  const signalPair = latestSignal ? assetPair(latestSignal) : "Not available";
  const signalTitle = latestSignal ? `${latestSignal.signalType} detected` : "No proof signal yet";
  const signalSummary = latestSignal
    ? cleanSignalText(latestSignal.aiSummary) || "A Mantle event was committed before the outcome is known."
    : "Open the dashboard and create a proof signal to populate this card with live agent data.";
  const latestProofTxUrl = explorerTxUrl(latestSignal?.commitTxHash, runtime.txExplorerBaseUrl);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-300 font-sans selection:bg-white selection:text-black">
      <main className="relative z-10 pt-32 pb-20 max-w-[1400px] mx-auto">
        {/* Hero Section - Telegram-first proof alerts */}
        <section className="relative overflow-hidden px-6 pt-14 md:px-[78px] lg:min-h-[820px]">
          <div className="grid gap-12 lg:grid-cols-[0.95fr_0.85fr] lg:items-start">
            <div>
              <div className="mb-7 flex items-center gap-3 font-mono text-xs font-bold uppercase tracking-[0.22em] text-mantle">
                <span className="h-2 w-2 rounded-full bg-mantle shadow-[0_0_18px_rgba(0,224,164,0.8)]" />
                Proof-backed AI alerts for Mantle
              </div>

              <h1 className="max-w-[660px] text-6xl font-semibold leading-[0.96] tracking-tighter text-white md:text-7xl lg:text-[88px]">
                AI signals<br />
                <span className="text-zinc-500">you can verify</span>
              </h1>

              <p className="mt-8 max-w-[600px] text-xl font-light leading-relaxed text-zinc-400">
                AlphaProof turns Mantle market events into simple Telegram alerts, commits every prediction on-chain,
                and tracks agent reputation over time.
              </p>

              <div className="mt-9 flex flex-wrap gap-4">
                <Link href="/dashboard" className="flex items-center gap-3 rounded-[10px] bg-white px-6 py-4 text-sm font-bold text-black transition-colors hover:bg-zinc-200">
                  Connect Telegram Alerts <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/dashboard" className="rounded-[10px] border border-white/15 bg-[#0a0a0a]/80 px-6 py-4 text-sm font-bold text-white transition-colors hover:border-white/30">
                  View Live Dashboard
                </Link>
              </div>

              <div className="mt-6 flex flex-wrap gap-3 text-sm font-bold text-emerald-100">
                <span>No trading</span>
                <span className="text-zinc-600">·</span>
                <span>No custody</span>
                <span className="text-zinc-600">·</span>
                <span>Not financial advice</span>
              </div>
            </div>

            <div className="relative min-h-[520px] lg:min-h-[480px]">
              <div className="relative ml-auto w-full max-w-[560px] rounded-[24px] border border-mantle/20 bg-[#0b1712]/90 shadow-2xl shadow-black/50 backdrop-blur-md">
                <div className="flex items-center justify-between border-b border-white/10 px-6 py-6">
                  <p className="font-mono text-sm font-bold uppercase tracking-[0.18em] text-zinc-500">Latest proof-backed signal</p>
                  <span className="rounded-full bg-[#94ffc0] px-4 py-2 text-sm font-bold text-[#052011]">
                    {latestSignal?.status || "Pending"}
                  </span>
                </div>

                <div className="p-7">
                  <h2 className="text-3xl font-semibold tracking-tight text-white">{signalTitle}</h2>
                  <p className="mt-4 max-w-[500px] text-base leading-relaxed text-zinc-400">{signalSummary}</p>

                  <div className="mt-6 flex flex-wrap gap-3 text-sm">
                    <SignalPill label="Pair" value={signalPair} />
                    <SignalPill label="Confidence" value={`${latestSignal?.confidence ?? stats.averageConfidence}%`} />
                    <SignalPill label="Evaluation" value={latestSignal ? evaluationShort(latestSignal.evaluationTime) : "Not available"} />
                  </div>

                  <div className="mt-6 rounded-[18px] border border-mantle/25 bg-mantle/[0.04] p-4 font-mono text-sm">
                    <ProofRow label="Contract Signal ID" value={latestSignal?.chainSignalId ? `#${latestSignal.chainSignalId}` : "Not available"} />
                    <ProofRow label="Proof Tx" value={shortHash(latestSignal?.commitTxHash)} />
                    <ProofRow label="Status" value={latestSignal?.status === "Resolved" ? latestSignal.outcome : "Committed before outcome"} strong />
                  </div>

                  {latestProofTxUrl ? (
                    <a
                      href={latestProofTxUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-5 block rounded-[12px] bg-[#e6c45a] px-5 py-4 text-center text-sm font-bold text-black transition-colors hover:bg-[#f0d778]"
                    >
                      Open Proof Tx
                    </a>
                  ) : (
                    <span className="mt-5 block cursor-not-allowed rounded-[12px] bg-[#e6c45a]/60 px-5 py-4 text-center text-sm font-bold text-black/70">
                      Proof Tx unavailable
                    </span>
                  )}
                </div>
              </div>

              <HeroTelegramAlert
                signalType={latestSignal?.signalType || "No signal yet"}
                pair={signalPair}
                confidence={`${latestSignal?.confidence ?? stats.averageConfidence}%`}
                proofHash={shortHash(latestSignal?.commitTxHash)}
              />

              <div className="absolute bottom-[24px] right-0 w-full max-w-[342px] rounded-[18px] border border-mantle/25 bg-[#071611]/95 p-5 shadow-2xl shadow-black/50 backdrop-blur-md lg:bottom-auto lg:left-[-86px] lg:right-auto lg:top-[530px]">
                <h3 className="text-xl font-bold text-white">Get alerts in Telegram</h3>
                <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                  Connect once and receive proof-backed signals as soon as AlphaProof commits them on-chain.
                </p>
                <HeroTelegramConnectButton />
              </div>
              
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3 lg:-mt-8 lg:grid-cols-[208px_208px_208px]">
            <HeroMetric label="Proof network" value={runtime.proofNetwork.includes("Mantle") ? "Mantle" : runtime.proofNetwork} subvalue={runtime.proofNetwork.includes("Sepolia") ? "Sepolia" : undefined} />
            <HeroMetric label="Signals tracked" value={String(stats.totalSignals)} />
            <HeroMetric label="Alerts channel" value="Telegram" />
          </div>
        </section>

        {/* Technical Ticker */}
        <div className="mt-2 border-y border-white/10 flex overflow-hidden bg-white/[0.02]">
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
                  AlphaProof cannot forge history or delete an unsuccessful forecast. Each agent prediction becomes a proof transaction, locking in the timestamp and model confidence
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
                      <div className="text-zinc-500">  DB Signal ID: {latestSignal.id}</div>
                      <div className="text-zinc-500">  Contract Signal ID: {latestSignal.chainSignalId ?? "mock/local fallback"}</div>
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
            ALPHAPROOF © {new Date().getFullYear()}
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

function SignalPill({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-[11px] border border-white/10 bg-white/[0.04] px-3 py-2 text-zinc-300">
      {label} <strong className="text-white">{value}</strong>
    </span>
  );
}

function ProofRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="grid grid-cols-[1fr_auto] gap-4 border-b border-dashed border-white/10 py-2 last:border-b-0">
      <span className="text-zinc-500">{label}</span>
      <span className={strong ? "font-bold text-[#f0d778]" : "text-zinc-200"}>{value}</span>
    </div>
  );
}

function HeroMetric({ label, value, subvalue }: { label: string; value: string; subvalue?: string }) {
  return (
    <div className="rounded-[14px] border border-white/10 bg-white/[0.03] px-5 py-5">
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">{label}</p>
      <p className="mt-3 text-3xl font-bold tracking-tight text-white">
        {value}
        {subvalue ? <span className="ml-1 text-sm text-zinc-400">{subvalue}</span> : null}
      </p>
    </div>
  );
}

function StepCard({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <div className="min-h-[150px] rounded-[20px] border border-white/10 bg-[#0a0a0a]/90 p-6">
      <span className="grid h-9 w-9 place-items-center rounded-[10px] border border-mantle/35 bg-mantle/15 font-mono font-bold text-mantle">
        {number}
      </span>
      <h3 className="mt-5 text-xl font-bold text-white">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-zinc-500">{text}</p>
    </div>
  );
}

function assetPair(signal: Signal) {
  if (signal.asset.includes("/")) return signal.asset;
  return signal.counterAsset ? `${signal.asset}/${signal.counterAsset}` : signal.asset;
}

function latestByCreatedAt(signals: Signal[]) {
  return [...signals].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] || null;
}

function evaluationShort(value: string) {
  return evaluationPendingLabel(value)
    .replace("Evaluation ", "")
    .replace(" · Still pending", "");
}

function cleanSignalText(value?: string | null) {
  if (!value) return "";
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
