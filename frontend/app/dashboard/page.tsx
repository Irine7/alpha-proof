import Link from "next/link";
import { DemoControls } from "../../components/DemoControls";
import { RuntimeStatusPanel } from "../../components/RuntimeStatusPanel";
import { SignalCard } from "../../components/SignalCard";
import { StatCard } from "../../components/StatCard";
import { getRuntimeStatus, getSignals, getStats } from "../../lib/api";

export default async function DashboardPage({ searchParams }: { searchParams?: Promise<{ records?: string; network?: string }> }) {
  const params = await searchParams;
  const showAllRecords = params?.records === "all";
  const showAllNetworks = params?.network === "all";
  const [signals, stats, runtime] = await Promise.all([
    getSignals({ showAllRecords, showAllNetworks }),
    getStats({ showAllRecords, showAllNetworks }),
    getRuntimeStatus()
  ]);
  const consoleLabel =
    runtime.marketDataMode === "live_mainnet"
      ? "LIVE DEMO CONSOLE"
      : runtime.marketDataMode === "historical_mainnet"
        ? "TESTNET PROOF CONSOLE"
        : "DEMO PROOF CONSOLE";

  return (
    <main className="relative z-10 pt-32 pb-20 max-w-[1400px] mx-auto px-6">
      {/* Header Info */}
      <div className="mb-12 flex flex-col justify-between gap-8 lg:flex-row lg:items-end border-b border-white/10 pb-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-wider text-zinc-500">
            <span className="flex items-center gap-2 text-mantle">
              <span className="w-2 h-2 bg-mantle rounded-full animate-pulse" />
              {consoleLabel}
            </span>
            <span>{"//"}</span>
            <span>Agent Operations</span>
          </div>
          <h1 className="text-5xl font-medium text-white tracking-tighter leading-none">Dashboard</h1>
          <p className="max-w-2xl text-zinc-400 font-light leading-relaxed">
            AI makes a prediction, commits hashes through the configured proof network, stores the result in Neon, then resolves outcomes into proof-backed reputation. Market data source and proof network are tracked separately below
          </p>
          <p className="max-w-3xl text-sm text-zinc-500 leading-relaxed">
            Market events and proof network are separated. During demo, AlphaProof reads historical Mantle mainnet-style events while committing proofs to the configured proof network.
          </p>
        </div>
        <div className="w-full lg:w-auto">
          <DemoControls runtime={runtime} />
        </div>
      </div>

      <RuntimeStatusPanel runtime={runtime} />

      {stats.pendingSignals > 0 ? (
        <section className="mb-8 border border-amber-300/20 bg-amber-300/5 p-4 text-sm text-amber-100">
          <span className="font-mono uppercase tracking-wider text-amber-200">Pending proof:</span>{" "}
          This signal was committed before the outcome is known.
        </section>
      ) : null}

      {/* Stats Bento Grid */}
      <section className="mb-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-white/10 bg-[#0a0a0a] divide-y sm:divide-y-0 sm:divide-x divide-white/10">
        <StatCard label="Total signals" value={stats.totalSignals} />
        <StatCard label="Pending" value={stats.pendingSignals} />
        <StatCard label="Accuracy" value={`${stats.accuracy}%`} hint="Correct / non-inconclusive resolved" />
        <StatCard label="Avg confidence" value={`${stats.averageConfidence}%`} />
      </section>

      {/* Signals Listing */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h2 className="text-2xl font-medium tracking-tight text-white font-mono">LATEST_SIGNALS_</h2>
            <p className="mt-2 text-xs font-mono uppercase tracking-wider text-zinc-500">
              {showAllRecords ? "Showing all records" : "Proof-ready only"} · {showAllNetworks ? "all proof networks" : "current proof network"}
            </p>
          </div>
          <div className="flex flex-wrap justify-end gap-2 text-[10px] font-mono uppercase tracking-wider">
            <div className="flex border border-white/10 bg-[#050505] p-1">
              <Link href={showAllNetworks ? "/dashboard?network=all" : "/dashboard"} className={`px-3 py-2 transition-colors ${showAllRecords ? "text-zinc-500 hover:text-white" : "bg-white text-black"}`}>
                Proof-ready only
              </Link>
              <Link href={showAllNetworks ? "/dashboard?records=all&network=all" : "/dashboard?records=all"} className={`px-3 py-2 transition-colors ${showAllRecords ? "bg-white text-black" : "text-zinc-500 hover:text-white"}`}>
                Show all records
              </Link>
            </div>
            <div className="flex border border-white/10 bg-[#050505] p-1">
              <Link href={showAllRecords ? "/dashboard?records=all" : "/dashboard"} className={`px-3 py-2 transition-colors ${showAllNetworks ? "text-zinc-500 hover:text-white" : "bg-white text-black"}`}>
                Current network
              </Link>
              <Link href={showAllRecords ? "/dashboard?records=all&network=all" : "/dashboard?network=all"} className={`px-3 py-2 transition-colors ${showAllNetworks ? "bg-white text-black" : "text-zinc-500 hover:text-white"}`}>
                All networks
              </Link>
            </div>
          </div>
        </div>
        {signals.length ? (
          <div className="grid gap-6 md:grid-cols-2">
            {signals.map((signal) => (
              <SignalCard key={signal.id} signal={signal} runtime={runtime} />
            ))}
          </div>
        ) : (
          <div className="border border-white/10 bg-[#0a0a0a] p-8 text-center text-zinc-500 font-mono text-sm">
            No signals yet. Start the backend, run Prisma setup, then click “Create Proof Signal”
          </div>
        )}
      </section>
    </main>
  );
}
