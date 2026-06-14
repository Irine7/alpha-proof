import Image from "next/image";
import Link from "next/link";
import { Activity, BrainCircuit, Copy, Database, Send, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getSignals, getStats } from "../../lib/api";
import { formatDate, predictionLabel, shortHash } from "../../lib/format";
import type { Signal } from "../../lib/types";

const projectWorkflowSteps: ProjectWorkflowStep[] = [
  {
    number: "1",
    title: "Market event",
    text: "Historical/live Mantle activity appears: swaps, liquidity changes or smart wallet movement.",
    Icon: Activity,
    tone: "mantle"
  },
  {
    number: "2",
    title: "AI agent detects signal",
    text: "The detector classifies the event, adds confidence and produces a readable explanation.",
    Icon: BrainCircuit,
    tone: "green",
    tag: "AI"
  },
  {
    number: "3",
    title: "Signal committed",
    text: "The prediction is written to SignalRegistry on Mantle Sepolia before the outcome is known.",
    Icon: ShieldCheck,
    tone: "gold"
  },
  {
    number: "4",
    title: "Context stored",
    text: "Neon keeps the source event, reasoning, hashes and status for dashboard verification.",
    Icon: Database,
    tone: "blue",
    tag: "DB"
  },
  {
    number: "5",
    title: "Telegram alert",
    text: "Subscribers receive a compact alert with the proof transaction and signal details.",
    Icon: Send,
    tone: "mint"
  }
];

type ProjectWorkflowStep = {
  number: string;
  title: string;
  text: string;
  Icon: LucideIcon;
  tone: "mantle" | "green" | "gold" | "blue" | "mint";
  tag?: string;
};

export default async function HowItWorksPage() {
  const [stats, signals] = await Promise.all([getStats(), getSignals()]);
  const latestSignals = signals.slice(0, 3);
  const latestProofSignal = signals[0] ?? null;

  return (
    <main className="relative z-10 mx-auto flex min-h-screen max-w-[2040px] items-start justify-center px-4 pb-20 pt-28 sm:px-6 lg:pt-32">
      <h1 className="sr-only">How it works</h1>

      <div className="grid w-full items-start gap-6 xl:grid-cols-[minmax(0,430px)_minmax(0,430px)_minmax(360px,420px)] xl:justify-center 2xl:grid-cols-[minmax(0,746px)_minmax(0,746px)_minmax(360px,420px)]">
      <div className="w-full max-w-[746px] justify-self-center xl:justify-self-end">
      <section className="w-full" aria-labelledby="reputation-core-title">
        <div className="overflow-hidden rounded-[8px] border border-white/[0.08] bg-[#07090b]/95 p-2 shadow-[0_0_40px_rgba(0,0,0,0.55)]">
          <div className="grid gap-2 md:grid-cols-[1fr_202px]">
            <div className="grid min-h-[194px] gap-4 rounded-[6px] border border-white/[0.07] bg-[#15181b]/95 p-4 sm:grid-cols-[1.15fr_0.85fr]">
              <div className="flex flex-col items-start">
                <h2 id="reputation-core-title" className="mt-4 max-w-[320px] text-[23px] font-semibold leading-[1.08] text-zinc-100 sm:text-[24px]">
                  Verified Reputation Core
                </h2>

                <p className="mt-2 max-w-[320px] text-[11px] font-medium leading-[1.35] text-zinc-500">
                  Raw blockchain activity is transformed into verifiable AI signals through detection, reasoning, and on-chain commitment.
                </p>
              </div>

              <div className="relative flex min-h-[150px] items-center justify-center">
                <div className="absolute h-[170px] w-[170px] rounded-full bg-mantle/10 blur-3xl" aria-hidden />
                <div className="absolute h-[120px] w-[120px] rounded-full bg-[#caffdd]/20 blur-2xl" aria-hidden />
                <Image
                  src="/assets/l.png"
                  alt="AlphaProof logo"
                  width={220}
                  height={220}
                  priority
                  className="relative h-[126px] w-[126px] object-contain drop-shadow-[0_0_26px_rgba(186,255,210,0.34)] sm:h-[140px] sm:w-[140px]"
                />
              </div>
            </div>

            <aside className="grid gap-1.5 rounded-[6px] border border-white/[0.07] bg-[#15181b]/95 p-3 md:grid-rows-[auto_1fr_1fr_1fr]">
              <div className="px-2 pt-1 text-[14px] font-semibold uppercase leading-none text-zinc-200">
                Dashboard
              </div>
              <DashboardMetric label="Total signals" value={String(stats.totalSignals)} tone="gold" />
              <DashboardMetric label="Accuracy" value={`${stats.accuracy}%`} tone="green" />
              <DashboardMetric label="Avg confidence" value={`${stats.averageConfidence}%`} tone="gold" />
            </aside>
          </div>

          <div className="mt-2 rounded-[6px] border border-white/[0.07] bg-[#15181b]/95 p-4">
            <h3 className="text-[14px] font-semibold uppercase leading-none text-zinc-200">Outcome Distribution</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <OutcomeDistributionRow label="Correct" value={stats.outcomeDistribution.correct} total={stats.totalSignals} tone="green" />
              <OutcomeDistributionRow label="Failed" value={stats.outcomeDistribution.failed} total={stats.totalSignals} tone="red" />
              <OutcomeDistributionRow label="Inconclusive" value={stats.outcomeDistribution.inconclusive} total={stats.totalSignals} tone="zinc" />
              <OutcomeDistributionRow label="Pending" value={stats.outcomeDistribution.pending} total={stats.totalSignals} tone="gold" />
            </div>
          </div>

          <div className="px-0 pb-2 pt-5">
            <h3 className="px-1 text-[21px] font-semibold leading-none text-zinc-200">
              LATEST_SIGNALS_
            </h3>

            <div className="mt-4 space-y-2">
              {latestSignals.length ? (
                latestSignals.map((signal) => (
                  <Link key={signal.id} href={`/signals/${signal.id}`} className="grid min-h-11 items-center gap-3 rounded-[6px] border border-white/[0.07] bg-[#15181b]/95 px-4 py-3 transition-colors hover:border-white/15 hover:bg-white/[0.02] sm:grid-cols-[1fr_auto]">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className={`h-3 w-3 rounded-full ${signalDotClass(signal)} shadow-[0_0_14px_currentColor]`} aria-hidden />
                      <span className="truncate text-[14px] font-semibold text-zinc-300">{signalAssetPair(signal)}</span>
                    </div>
                    <div className="truncate text-[12px] font-semibold text-zinc-500">
                      <span>{"//"}</span> <span className="text-zinc-400">{signal.signalType}</span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="grid min-h-11 items-center gap-3 rounded-[6px] border border-white/[0.07] bg-[#15181b]/95 px-4 py-3 sm:grid-cols-[1fr_auto]">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="h-3 w-3 rounded-full bg-zinc-600 shadow-[0_0_14px_currentColor]" aria-hidden />
                    <span className="truncate text-[14px] font-semibold text-zinc-400">No signals yet</span>
                  </div>
                  <div className="truncate text-[12px] font-semibold text-zinc-500">
                    <span>{"//"}</span> <span className="text-zinc-400">Open dashboard to create one</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-center pt-6">
              <Link href="/dashboard" className="rounded-[7px] border border-white/[0.08] bg-[#17191d] px-6 py-3 text-[16px] font-semibold text-zinc-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-colors hover:border-white/20 hover:bg-[#1f2227] focus:outline-none focus:ring-2 focus:ring-mantle/60">
                View all signals
              </Link>
            </div>

          </div>
        </div>
      </section>

      <Image
        src="/assets/1.png"
        alt="AlphaProof visual"
        width={1984}
        height={2158}
        className="mt-6 h-auto w-full rounded-[6px] object-cover"
      />
      </div>

      <SignalProofCard signal={latestProofSignal} />
      <MantleEventStreamCard signals={signals} />
      </div>
    </main>
  );
}

function signalAssetPair(signal: Signal) {
  if (signal.asset.includes("/")) return signal.asset;
  return signal.counterAsset ? `${signal.asset}/${signal.counterAsset}` : signal.asset;
}

function signalDotClass(signal: Signal) {
  if (signal.status === "Pending") return "bg-amberproof";
  if (signal.outcome === "Correct") return "bg-[#75c7a3]";
  if (signal.outcome === "Failed") return "bg-[#d87578]";
  if (signal.outcome === "Inconclusive") return "bg-zinc-500";
  return "bg-[#75c7a3]";
}

function DashboardMetric({ label, value, tone }: { label: string; value: string; tone: "gold" | "green" }) {
  const toneClass = tone === "green" ? "border-mantle/20 bg-mantle/10 text-mantle" : "border-[#d5a33e]/20 bg-[#d5a33e]/10 text-[#d5a33e]";

  return (
    <div className="rounded-[5px] border border-white/[0.06] bg-[#101215] px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate whitespace-nowrap text-[12px] font-semibold leading-none text-zinc-400">{label}</p>
          <p className="mt-2 text-[26px] font-bold leading-none text-zinc-100">{value}</p>
        </div>
        <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-[5px] border ${toneClass}`} aria-hidden>
          <span className={`h-2.5 w-2.5 ${tone === "green" ? "rounded-full" : "rounded-[2px]"} bg-current`} />
        </span>
      </div>
    </div>
  );
}

function OutcomeDistributionRow({ label, value, total, tone }: { label: string; value: number; total: number; tone: "green" | "red" | "gold" | "zinc" }) {
  const width = total ? Math.max(4, Math.round((value / total) * 100)) : 0;
  const toneClass =
    tone === "green"
      ? "bg-mantle shadow-[0_0_16px_rgba(0,224,164,0.22)]"
      : tone === "red"
        ? "bg-dangerproof shadow-[0_0_16px_rgba(255,92,122,0.2)]"
        : tone === "gold"
          ? "bg-amberproof shadow-[0_0_16px_rgba(255,200,87,0.2)]"
          : "bg-zinc-500";

  return (
    <div className="rounded-[5px] border border-white/[0.06] bg-[#101215] px-3 py-3">
      <div className="mb-2 flex items-center justify-between gap-3 text-[11px] font-mono uppercase tracking-wider">
        <span className="truncate text-zinc-500">{label}</span>
        <span className="text-zinc-200">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div className={`h-full rounded-full ${toneClass}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function SignalProofCard({ signal }: { signal: Signal | null }) {
  const status = signal ? proofStatusLabel(signal) : "No signal";
  const statusTone = proofStatusTone(signal);
  const proofPayload = formatProofPayload(signal);
  const reasoningLead = signal
    ? compactSignalText(cleanSignalText(signal.aiSummary) || `${signalAssetPair(signal)} ${signal.signalType}`, 190)
    : "No proof-ready signal has been collected yet.";
  const reasoningDetail = signal
    ? compactSignalText(
        cleanSignalText(signal.reasoning) || `Source event ${signal.sourceEventType ?? signal.signalType} was committed with confidence ${signal.confidence}%.`,
        360
      )
    : "Once a new dashboard signal is committed, this proof payload will update automatically.";
  const signalId = signal ? `#AP-${signal.chainSignalId ?? signal.id}` : "#AP-0000";
  const contractValue = shortHash(signal?.contractAddress);
  const contractMeta = signal?.chainId ? `Chain ${signal.chainId}` : signal?.proofNetworkKey ?? signal?.proofNetwork ?? "Network";
  const txValue = shortHash(signal?.commitTxHash);
  const txMeta = signal?.committedAt ? formatDate(signal.committedAt) : signal?.createdAt ? formatDate(signal.createdAt) : "Not available";

  return (
    <section className="w-full max-w-[746px] justify-self-center xl:justify-self-start" aria-labelledby="signal-proof-title">
      <div className="space-y-3 rounded-[8px] border border-white/[0.08] bg-[#07090b]/95 p-3 shadow-[0_0_40px_rgba(0,0,0,0.55)]">
        <ProjectWorkflowCard />

        <div className="flex min-h-[76px] items-center justify-between gap-4 rounded-[7px] border border-white/[0.08] bg-[#15181b]/95 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
          <div className="flex min-w-0 items-center gap-4">
            
            <span className={`rounded-[5px] border px-4 py-2 text-[16px] font-bold uppercase leading-none shadow-[0_0_18px_rgba(72,180,93,0.18)] ${statusTone.badge}`}>
              Status: {status}
            </span>
          </div>
          <p className="shrink-0 text-right text-[20px] font-bold leading-none text-zinc-300" id="signal-proof-title">
            Signal ID {signalId}
          </p>
        </div>

        <div className="rounded-[7px] border border-white/[0.08] bg-[#111315]/95 p-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-[16px] font-bold uppercase leading-none text-zinc-400">On-chain Proof</h2>
          </div>

          <div className="grid grid-cols-[18px_1fr] gap-3">
            <div aria-hidden />

            <div className="min-w-0">
              <div className="relative -translate-x-[15px] overflow-hidden rounded-lg border border-zinc-800 bg-[#050505] font-mono text-xs shadow-2xl shadow-black/40">
                <div className="grid h-11 grid-cols-[auto_1fr_auto] items-center border-b border-zinc-800 bg-[#18181b] px-4 text-zinc-500">
                  <span className="flex items-center gap-2" aria-hidden>
                    <span className="grid h-3.5 w-3.5 place-items-center rounded-full bg-[#ff5f57] text-[10px] leading-none text-red-950">x</span>
                    <span className="grid h-3.5 w-3.5 place-items-center rounded-full bg-[#febc2e] text-[10px] leading-none text-yellow-950">-</span>
                    <span className="grid h-3.5 w-3.5 place-items-center rounded-full bg-[#28c840] text-[10px] leading-none text-green-950">-</span>
                  </span>
                  <span className="justify-self-center text-[11px] uppercase tracking-[0.18em] text-zinc-400">proof_payload</span>
                  <span className="text-[10px] uppercase tracking-[0.16em] text-zinc-600">Neon / Chain</span>
                </div>
                <div className="relative bg-black p-5 text-zinc-400">
                  <button className="absolute right-5 top-5 rounded-[4px] border border-white/[0.08] bg-black/70 p-1 text-zinc-500 transition-colors hover:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-mantle/50" aria-label="Copy proof payload">
                    <Copy className="h-4 w-4" aria-hidden />
                  </button>
                  <pre className="overflow-x-auto pr-8 text-[13px] leading-[1.38] text-zinc-300">
                    {proofPayload}
                  </pre>
                </div>
              </div>

              <ProofLine label="Contract Address" value={contractValue} meta={contractMeta} />
              <ProofLine label="Transaction Hash" value={txValue} meta={txMeta} />
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

function proofStatusLabel(signal: Signal) {
  if (signal.status === "Pending") return "Pending";
  if (signal.outcome !== "Unknown") return signal.outcome;
  return signal.status;
}

function proofStatusTone(signal: Signal | null) {
  if (!signal) {
    return {
      badge: "border-zinc-500/40 bg-zinc-700 text-zinc-200",
      dot: "bg-zinc-500 shadow-[0_0_12px_rgba(161,161,170,0.75)]"
    };
  }

  if (signal.status === "Pending") {
    return {
      badge: "border-[#e2bc4f]/50 bg-[#7a5b23] text-[#fff1b8]",
      dot: "bg-[#ffc54a] shadow-[0_0_12px_rgba(255,197,74,0.75)]"
    };
  }

  if (signal.outcome === "Failed") {
    return {
      badge: "border-[#92433c]/60 bg-[#8f3d37] text-[#ffd1cd]",
      dot: "bg-[#ff594d] shadow-[0_0_12px_rgba(255,89,77,0.75)]"
    };
  }

  if (signal.outcome === "Inconclusive") {
    return {
      badge: "border-zinc-500/40 bg-zinc-700 text-zinc-200",
      dot: "bg-zinc-400 shadow-[0_0_12px_rgba(212,212,216,0.65)]"
    };
  }

  return {
    badge: "border-[#5fc776]/40 bg-[#2c8743] text-[#dfffe5]",
    dot: "bg-[#65d36f] shadow-[0_0_12px_rgba(101,211,111,0.75)]"
  };
}

function formatProofPayload(signal: Signal | null) {
  if (!signal) {
    return JSON.stringify(
      {
        status: "empty",
        source: "dashboard latest signal",
        proofVectors: {
          committed: false,
          hashesReady: false
        }
      },
      null,
      2
    );
  }

  return JSON.stringify(
    {
      type: signal.signalType,
      asset: signalAssetPair(signal),
      status: signal.status,
      outcome: signal.outcome,
      confidence: signal.confidence,
      prediction: signal.prediction,
      dbSignalId: signal.id,
      contractSignalId: signal.chainSignalId,
      proofNetwork: signal.proofNetwork,
      chainId: signal.chainId,
      proofVectors: {
        committed: Boolean(signal.commitTxHash),
        dataHash: shortHash(signal.dataHash),
        reasoningHash: shortHash(signal.reasoningHash),
        txHash: shortHash(signal.commitTxHash)
      }
    },
    null,
    2
  );
}

function cleanSignalText(value?: string | null) {
  if (!value) return "";
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function compactSignalText(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trimEnd()}...`;
}

function ProofLine({ label, value, meta }: { label: string; value: string; meta: string }) {
  return (
    <div className="relative -translate-x-[15px] mt-2 grid grid-cols-[136px_minmax(0,1fr)_auto] items-center gap-3 font-mono text-[14px] font-semibold text-zinc-300">
      <span className="truncate">{label}</span>
      <span className="truncate rounded-[5px] border border-white/[0.06] bg-[#15181b]/95 px-3 py-2 text-zinc-400">{value}</span>
      <span className="rounded-[5px] border border-white/[0.06] bg-[#15181b]/95 px-3 py-2 text-zinc-400">{meta}</span>
    </div>
  );
}

function ProjectWorkflowCard() {
  return (
    <div className="min-w-0 rounded-[7px] border border-white/[0.08] bg-[#15181b]/95 p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 id="project-workflow-title" className="text-[16px] font-bold uppercase leading-none text-zinc-400">How our project works</h2>
        <span className="rounded-[5px] border border-white/[0.06] bg-[#15181b]/95 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">
          PROCESS_05
        </span>
      </div>

      <div className="relative space-y-1.5">
        {projectWorkflowSteps.map((step, index) => (
          <WorkflowStep key={step.number} step={step} index={index} isLast={index === projectWorkflowSteps.length - 1} />
        ))}
      </div>
    </div>
  );
}

function WorkflowStep({ step, index, isLast }: { step: ProjectWorkflowStep; index: number; isLast: boolean }) {
  const tone = workflowToneClasses(step.tone);
  const Icon = step.Icon;
  const iconLeft = index % 2 === 0;

  return (
    <div className={`relative grid min-h-[74px] items-center gap-2.5 ${iconLeft ? "grid-cols-[52px_minmax(0,1fr)] sm:grid-cols-[56px_minmax(0,1fr)]" : "grid-cols-[minmax(0,1fr)_52px] sm:grid-cols-[minmax(0,1fr)_56px]"}`}>
      <div className="absolute left-6 right-6 top-1/2 h-px -translate-y-1/2 bg-white/10" aria-hidden />
      {!isLast ? (
        <div className={`absolute bottom-[-0.5rem] top-1/2 w-px bg-white/10 ${iconLeft ? "left-6 sm:left-7" : "right-6 sm:right-7"}`} aria-hidden />
      ) : null}

      {iconLeft ? <WorkflowIcon Icon={Icon} tone={tone} /> : null}

      <article className={`relative z-20 rounded-[5px] border border-white/[0.06] bg-[#15181b]/95 p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] ${iconLeft ? "text-left" : "text-right"}`}>
        <div className={`mb-1 flex items-center gap-1.5 ${iconLeft ? "" : "justify-end"}`}>
          <span className={`font-mono text-[18px] font-semibold leading-none ${tone.tag}`}>{step.number}</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-600">Step_{step.number.padStart(2, "0")}</span>
          {step.tag ? <span className={`font-mono text-[12px] font-semibold leading-none ${tone.tag}`}>{step.tag}</span> : null}
        </div>
        <h3 className="truncate text-[14px] font-medium leading-tight tracking-tight text-white sm:text-[15px]">{step.title}</h3>
        <p className="mt-1 overflow-hidden text-[10px] font-medium leading-[1.3] text-zinc-500 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] sm:text-[10.5px]">{step.text}</p>
      </article>

      {!iconLeft ? <WorkflowIcon Icon={Icon} tone={tone} /> : null}
    </div>
  );
}

function WorkflowIcon({ Icon, tone }: { Icon: LucideIcon; tone: ReturnType<typeof workflowToneClasses> }) {
  return (
    <div className="relative z-10">
      <div className={`grid h-[52px] w-[52px] place-items-center rounded-full border sm:h-14 sm:w-14 ${tone.circle}`}>
        <div className="grid h-9 w-9 place-items-center rounded-full sm:h-10 sm:w-10">
          <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${tone.iconText}`} strokeWidth={1.5} aria-hidden />
        </div>
      </div>
    </div>
  );
}

function workflowToneClasses(tone: ProjectWorkflowStep["tone"]) {
  if (tone === "gold") {
    return {
      tag: "text-[#f6c85d]",
      circle: "border-[#d5a33e]/30 shadow-[#d5a33e]/10",
      iconText: "text-[#f6c85d]"
    };
  }

  if (tone === "blue") {
    return {
      tag: "text-[#7dd3fc]",
      circle: "border-[#7dd3fc]/25 shadow-[#0ea5e9]/10",
      iconText: "text-[#7dd3fc]"
    };
  }

  if (tone === "mint") {
    return {
      tag: "text-[#9af7c8]",
      circle: "border-[#9af7c8]/25 shadow-[#9af7c8]/10",
      iconText: "text-[#9af7c8]"
    };
  }

  if (tone === "green") {
    return {
      tag: "text-[#8df0bd]",
      circle: "border-[#75c7a3]/25 shadow-[#75c7a3]/10",
      iconText: "text-[#8df0bd]"
    };
  }

  return {
    tag: "text-mantle",
    circle: "border-mantle/25 shadow-mantle/10",
    iconText: "text-mantle"
  };
}

function MantleEventStreamCard({ signals }: { signals: Signal[] }) {
  const sortedSignals = [...signals].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <section className="w-full max-w-[420px] justify-self-center xl:justify-self-start" aria-labelledby="mantle-event-stream-title">
      <div className="overflow-hidden rounded-[8px] border border-white/[0.08] bg-[#151719]/95 shadow-[0_0_40px_rgba(0,0,0,0.55)]">
        <div className="border-b border-white/[0.08] px-5 py-5">
          <h2 id="mantle-event-stream-title" className="text-[22px] font-bold leading-none text-zinc-100">
            Mantle Event Stream
          </h2>
        </div>

        <div className="relative">
          <div className="absolute bottom-0 left-0 right-0 z-10 h-28 bg-gradient-to-t from-[#151719] via-[#151719]/90 to-transparent" aria-hidden />
          <div className="max-h-[730px] overflow-hidden px-5">
            {sortedSignals.length ? sortedSignals.map((signal) => <EventStreamRow key={signal.id} signal={signal} />) : <EmptyEventStreamRow />}
          </div>

          <div className="relative z-20 px-5 pb-4 pt-2">
            <Link href="/reputation" className="block w-full rounded-[6px] border border-white/[0.08] bg-[#15181b]/95 px-5 py-3.5 text-center text-[18px] font-bold text-zinc-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-colors hover:border-white/20 hover:bg-[#333437] focus:outline-none focus:ring-2 focus:ring-mantle/60">
              Explore reputation core
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function EmptyEventStreamRow() {
  return (
    <div className="relative grid min-h-[80px] grid-cols-[18px_minmax(0,1fr)] gap-2 border-b border-white/[0.07] py-3.5">
      <div className="relative flex justify-center pt-1.5">
        <span className="h-3.5 w-3.5 rounded-full bg-zinc-600 shadow-[0_0_12px_currentColor]" aria-hidden />
      </div>

      <p className="pr-2 text-[16px] font-bold leading-[1.18] text-zinc-400">
        No dashboard signals yet
      </p>
    </div>
  );
}

function EventStreamRow({ signal }: { signal: Signal }) {
  const dotClass = signalDotClass(signal);
  const badgeClass = eventBadgeClass(signal);
  const badgeLabel = proofStatusLabel(signal);
  const title = `${signalAssetPair(signal)} · ${signal.signalType} · ${predictionLabel(signal.prediction)}`;

  return (
    <div className="relative grid min-h-[80px] grid-cols-[18px_minmax(0,1fr)_auto] gap-2 border-b border-white/[0.07] py-3.5">
      <div className="relative flex justify-center pt-1.5">
        <span className={`h-3.5 w-3.5 rounded-full ${dotClass} shadow-[0_0_12px_currentColor]`} aria-hidden />
        <span className="absolute top-6 h-[58px] w-px bg-white/10" aria-hidden />
      </div>

      <p className="pr-2 text-[16px] font-bold leading-[1.18] text-zinc-100">
        {title}
      </p>

      <span className={`mt-2 inline-flex h-8 items-center justify-center gap-1.5 rounded-full border px-2 text-[12px] font-bold ${badgeClass}`}>
        <span className="h-2 w-2 rounded-full bg-current opacity-80" aria-hidden />
        {badgeLabel}
      </span>
    </div>
  );
}

function eventBadgeClass(signal: Signal) {
  if (signal.status === "Pending") return "border-[#e2bc4f]/80 bg-[#ffd865] text-[#5a4517]";
  if (signal.outcome === "Correct") return "border-[#3f9e5a]/70 bg-[#3f9e5a] text-[#c7f5ce]";
  if (signal.outcome === "Failed") return "border-[#92433c]/80 bg-[#8f3d37] text-[#efb3ad]";
  return "border-zinc-500/50 bg-zinc-700 text-zinc-200";
}
