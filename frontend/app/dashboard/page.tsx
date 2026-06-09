import { DemoControls } from "../../components/DemoControls";
import { SignalCard } from "../../components/SignalCard";
import { StatCard } from "../../components/StatCard";
import { getSignals, getStats } from "../../lib/api";

export default async function DashboardPage() {
  const [signals, stats] = await Promise.all([getSignals(), getStats()]);

  return (
    <main className="relative z-10 pt-32 pb-20 max-w-[1400px] mx-auto px-6">
      {/* Header Info */}
      <div className="mb-12 flex flex-col justify-between gap-8 lg:flex-row lg:items-end border-b border-white/10 pb-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-wider text-zinc-500">
            <span className="flex items-center gap-2 text-mantle">
              <span className="w-2 h-2 bg-mantle rounded-full animate-pulse" />
              Live Demo Console
            </span>
            <span>//</span>
            <span>Agent Operations</span>
          </div>
          <h1 className="text-5xl font-medium text-white tracking-tighter leading-none">Dashboard</h1>
          <p className="max-w-2xl text-zinc-400 font-light leading-relaxed">
            AI makes a prediction, commits hashes on-chain, alerts Telegram, then resolves outcomes into reputation. The local fallback uses mock proofs until Mantle env vars are configured
          </p>
        </div>
        <div className="w-full lg:w-auto">
          <DemoControls />
        </div>
      </div>

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
          <h2 className="text-2xl font-medium tracking-tight text-white font-mono">LATEST_SIGNALS_</h2>
          <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">
            Proof first, outcome later
          </span>
        </div>
        {signals.length ? (
          <div className="grid gap-6 md:grid-cols-2">
            {signals.map((signal) => (
              <SignalCard key={signal.id} signal={signal} />
            ))}
          </div>
        ) : (
          <div className="border border-white/10 bg-[#0a0a0a] p-8 text-center text-zinc-500 font-mono text-sm">
            No signals yet. Start the backend, run Prisma setup, then click “Create Demo Signal”
          </div>
        )}
      </section>
    </main>
  );
}
