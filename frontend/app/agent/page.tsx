import { StatCard } from "../../components/StatCard";
import { getStats } from "../../lib/api";

export default async function AgentPage() {
  const stats = await getStats();

  return (
    <main className="relative z-10 pt-32 pb-20 max-w-[1400px] mx-auto px-6">
      {/* Header Info */}
      <div className="mb-12 border-b border-white/10 pb-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-wider text-zinc-500">
            <span className="flex items-center gap-2 text-mantle">
              <span className="w-2 h-2 bg-mantle rounded-full animate-pulse" />
              Accountability Layer
            </span>
            <span>//</span>
            <span>Verification Statistics</span>
          </div>
          <h1 className="text-5xl font-medium text-white tracking-tighter leading-none">Agent Reputation</h1>
          <p className="max-w-2xl text-zinc-400 font-light leading-relaxed">
            AlphaProof does not ask users to trust a one-off AI explanation. It keeps score from proof-backed signals that were committed before outcomes were known
          </p>
        </div>
      </div>

      {/* Stats Bento Grid */}
      <section className="mb-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-white/10 bg-[#0a0a0a] divide-y divide-white/10 sm:divide-y-0 sm:divide-x">
        <div className="flex flex-col divide-y divide-white/10 sm:col-span-2 sm:grid sm:grid-cols-2 sm:divide-y-0 sm:divide-x">
          <StatCard label="Total signals" value={stats.totalSignals} />
          <StatCard label="Resolved" value={stats.resolvedSignals} />
        </div>
        <div className="flex flex-col divide-y divide-white/10 sm:col-span-2 sm:grid sm:grid-cols-2 sm:divide-y-0 sm:divide-x">
          <StatCard label="Correct" value={stats.correct} />
          <StatCard label="Failed" value={stats.failed} />
        </div>
      </section>

      <section className="mb-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-white/10 bg-[#0a0a0a] divide-y divide-white/10 sm:divide-y-0 sm:divide-x">
        <StatCard label="Inconclusive" value={stats.inconclusive} />
        <StatCard label="Accuracy" value={`${stats.accuracy}%`} />
        <StatCard label="Average confidence" value={`${stats.averageConfidence}%`} />
        <StatCard label="Pending" value={stats.pendingSignals} />
      </section>

      {/* Performance Insights */}
      <section className="grid gap-6 md:grid-cols-2">
        <div className="p-8 border border-white/10 bg-[#0a0a0a] hover:bg-white/[0.02] transition-colors flex flex-col justify-between min-h-[160px]">
          <div>
            <span className="w-1.5 h-1.5 bg-emerald-400 inline-block mb-4" />
            <p className="text-xs font-mono uppercase tracking-wider text-zinc-500">Best signal type</p>
          </div>
          <p className="text-3xl font-light text-white font-mono mt-4">{stats.bestSignalType || "Awaiting results"}</p>
        </div>
        <div className="p-8 border border-white/10 bg-[#0a0a0a] hover:bg-white/[0.02] transition-colors flex flex-col justify-between min-h-[160px]">
          <div>
            <span className="w-1.5 h-1.5 bg-amber-400 inline-block mb-4" />
            <p className="text-xs font-mono uppercase tracking-wider text-zinc-500">Weakest signal type</p>
          </div>
          <p className="text-3xl font-light text-zinc-400 font-mono mt-4">{stats.worstSignalType || "Awaiting results"}</p>
        </div>
      </section>
    </main>
  );
}
