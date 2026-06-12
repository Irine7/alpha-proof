import Link from "next/link";
import { StatCard } from "../../components/StatCard";
import { getRuntimeStatus, getStats } from "../../lib/api";
import { explorerAddressUrl, explorerTxUrl, shortHash } from "../../lib/format";

export default async function ReputationPage() {
  const [stats, runtime] = await Promise.all([getStats(), getRuntimeStatus()]);
  const contractUrl = explorerAddressUrl(runtime.signalRegistryAddress, runtime.proofExplorerUrl);

  return (
    <main className="relative z-10 pt-32 pb-20 max-w-[1400px] mx-auto px-6">
      <div className="mb-12 border-b border-white/10 pb-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-wider text-zinc-500">
            <span className="flex items-center gap-2 text-mantle">
              <span className="w-2 h-2 bg-mantle rounded-full animate-pulse" />
              Accountability Layer
            </span>
            <span>{"//"}</span>
            <span>Current Proof Network</span>
          </div>
          <h1 className="text-5xl font-medium text-white tracking-tighter leading-none">Agent Reputation</h1>
          <p className="max-w-2xl text-zinc-400 font-light leading-relaxed">
            AlphaProof keeps score from proof-backed signals that were committed before outcomes were known.
          </p>
          <p className="text-xs font-mono uppercase tracking-wider text-zinc-500">
            Stats are scoped to the current proof network.
          </p>
        </div>
      </div>

      <section className="mb-12 grid gap-px border border-white/10 bg-white/10 md:grid-cols-3">
        <NetworkInfo label="Proof network" value={runtime.proofNetwork} />
        <NetworkInfo label="Chain ID" value={String(runtime.chainId)} />
        <NetworkInfo label="Contract" value={runtime.signalRegistryAddress ? shortHash(runtime.signalRegistryAddress) : "Not configured"} href={contractUrl} />
      </section>

      <section className="mb-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-white/10 bg-[#0a0a0a] divide-y divide-white/10 sm:divide-y-0 sm:divide-x">
        <StatCard label="Total signals" value={stats.totalSignals} />
        <StatCard label="Resolved" value={stats.resolvedSignals} />
        <StatCard label="Pending" value={stats.pendingSignals} />
        <StatCard label="Accuracy" value={`${stats.accuracy}%`} hint="Accuracy excludes inconclusive signals." />
      </section>

      <section className="mb-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-white/10 bg-[#0a0a0a] divide-y divide-white/10 sm:divide-y-0 sm:divide-x">
        <StatCard label="Correct" value={stats.correct} />
        <StatCard label="Failed" value={stats.failed} />
        <StatCard label="Inconclusive" value={stats.inconclusive} />
        <StatCard label="Average confidence" value={`${stats.averageConfidence}%`} />
      </section>

      <section className="mb-12 grid gap-6 md:grid-cols-2">
        <div className="border border-white/10 bg-[#0a0a0a] p-6">
          <p className="text-xs font-mono uppercase tracking-wider text-zinc-500">Best signal type</p>
          <p className="mt-4 text-2xl font-light text-white font-mono">
            {stats.hasSignalDiversity ? stats.bestSignalType : "Not enough signal diversity yet"}
          </p>
        </div>
        <div className="border border-white/10 bg-[#0a0a0a] p-6">
          <p className="text-xs font-mono uppercase tracking-wider text-zinc-500">Weakest signal type</p>
          <p className="mt-4 text-2xl font-light text-zinc-400 font-mono">
            {stats.hasSignalDiversity ? stats.worstSignalType : "Not enough signal diversity yet"}
          </p>
        </div>
      </section>

      <section className="mb-12 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <div className="border border-white/10 bg-[#0a0a0a] p-6">
          <h2 className="text-xl font-medium tracking-tight text-white">Outcome Distribution</h2>
          <div className="mt-6 space-y-3">
            <DistributionRow label="Correct" value={stats.outcomeDistribution.correct} total={stats.totalSignals} />
            <DistributionRow label="Failed" value={stats.outcomeDistribution.failed} total={stats.totalSignals} />
            <DistributionRow label="Inconclusive" value={stats.outcomeDistribution.inconclusive} total={stats.totalSignals} />
            <DistributionRow label="Pending" value={stats.outcomeDistribution.pending} total={stats.totalSignals} />
          </div>
        </div>

        <div className="overflow-hidden border border-white/10 bg-[#0a0a0a]">
          <div className="border-b border-white/10 p-6">
            <h2 className="text-xl font-medium tracking-tight text-white">Signal Type Performance</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left font-mono text-xs">
              <thead className="border-b border-white/10 text-zinc-500 uppercase">
                <tr>
                  <th className="px-4 py-3 font-normal">Signal type</th>
                  <th className="px-4 py-3 font-normal">Total</th>
                  <th className="px-4 py-3 font-normal">Correct</th>
                  <th className="px-4 py-3 font-normal">Failed</th>
                  <th className="px-4 py-3 font-normal">Inconclusive</th>
                  <th className="px-4 py-3 font-normal">Accuracy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {stats.signalTypePerformance.length ? (
                  stats.signalTypePerformance.map((row) => (
                    <tr key={row.signalType} className="text-zinc-300">
                      <td className="px-4 py-3 text-white">{row.signalType}</td>
                      <td className="px-4 py-3">{row.total}</td>
                      <td className="px-4 py-3">{row.correct}</td>
                      <td className="px-4 py-3">{row.failed}</td>
                      <td className="px-4 py-3">{row.inconclusive}</td>
                      <td className="px-4 py-3">{row.accuracy}%</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-6 text-zinc-500" colSpan={6}>
                      No current-network proof signals yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="border border-white/10 bg-[#0a0a0a]">
        <div className="border-b border-white/10 p-6">
          <h2 className="text-xl font-medium tracking-tight text-white">Latest Resolved Signals</h2>
        </div>
        <div className="divide-y divide-white/10">
          {stats.latestResolvedSignals.length ? (
            stats.latestResolvedSignals.map((signal) => {
              const txUrl = explorerTxUrl(signal.resolveTxHash || signal.commitTxHash, runtime.txExplorerBaseUrl);
              return (
                <Link key={signal.id} href={`/signals/${signal.id}`} className="grid gap-2 p-5 transition-colors hover:bg-white/[0.02] md:grid-cols-[1.2fr_0.8fr_0.8fr_1fr]">
                  <span className="font-mono text-sm text-white">{signal.signalType}</span>
                  <span className="font-mono text-xs text-zinc-400">{signal.outcome}</span>
                  <span className="font-mono text-xs text-zinc-400">DB #{signal.id} / Contract #{signal.chainSignalId ?? "n/a"}</span>
                  <span className="font-mono text-xs text-zinc-500">{txUrl ? shortHash(signal.resolveTxHash || signal.commitTxHash) : "Explorer unavailable"}</span>
                </Link>
              );
            })
          ) : (
            <div className="p-6 text-sm font-mono text-zinc-500">No resolved current-network signals yet.</div>
          )}
        </div>
      </section>
    </main>
  );
}

function NetworkInfo({ label, value, href }: { label: string; value: string; href?: string | null }) {
  return (
    <div className="bg-[#0a0a0a] p-5">
      <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">{label}</p>
      {href ? (
        <a href={href} target="_blank" rel="noreferrer" className="mt-2 block font-mono text-sm text-white underline hover:text-mantle">
          {value}
        </a>
      ) : (
        <p className="mt-2 font-mono text-sm text-white">{value}</p>
      )}
    </div>
  );
}

function DistributionRow({ label, value, total }: { label: string; value: number; total: number }) {
  const width = total ? Math.max(4, Math.round((value / total) * 100)) : 0;

  return (
    <div>
      <div className="mb-1 flex justify-between text-xs font-mono uppercase tracking-wider text-zinc-500">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-2 bg-white/10">
        <div className="h-full bg-mantle" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}
