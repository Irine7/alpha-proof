"use client";

import { AlertTriangle, CheckCircle, Plus, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createDemoSignal, resolvePendingSignals } from "../lib/api";

export function DemoControls() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isWorking, setIsWorking] = useState(false);

  async function run(action: "create" | "resolve") {
    setIsWorking(true);
    setMessage(null);
    try {
      if (action === "create") {
        const result = await createDemoSignal();
        const chainText = result.signal.chainSignalId === null ? "mock proof" : `chain signal #${result.signal.chainSignalId}`;
        setMessage(`Demo signal committed (${chainText}). Proof and reasoning are now visible below.`);
      } else {
        const result = await resolvePendingSignals();
        const synced = result.results.filter((entry) => entry.synced).length;
        const staleText = result.skipped
          ? ` ${result.skipped} stale pending signal(s) were skipped after chain verification.`
          : "";
        const syncedText = synced ? ` ${synced} already-resolved signal(s) were synced from chain state.` : "";
        setMessage(`Resolved ${result.resolved ?? 0} pending signal(s). Reputation updated.${syncedText}${staleText}`);
      }
      startTransition(() => router.refresh());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Action failed. Is the backend running?");
    } finally {
      setIsWorking(false);
    }
  }

  const disabled = isWorking || isPending;

  return (
    <div className="border border-white/10 bg-[#0a0a0a] p-6 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={() => run("create")}
          disabled={disabled}
          className="inline-flex items-center justify-center gap-2 text-xs font-mono uppercase bg-white text-black px-4 py-2 hover:bg-zinc-200 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={14} aria-hidden />
          Create Demo Signal_
        </button>
        <button
          onClick={() => run("resolve")}
          disabled={disabled}
          className="inline-flex items-center justify-center gap-2 text-xs font-mono uppercase border border-white/10 text-white px-4 py-2 hover:border-white/30 transition-colors bg-[#0a0a0a] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <CheckCircle size={14} aria-hidden />
          Resolve Pending Signals_
        </button>
        <button
          onClick={() => startTransition(() => router.refresh())}
          disabled={disabled}
          title="Refresh dashboard data"
          className="inline-flex items-center justify-center gap-2 text-xs font-mono uppercase border border-white/10 text-zinc-300 px-4 py-2 hover:border-white/30 hover:text-white transition-colors bg-[#0a0a0a] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw size={14} aria-hidden />
          Refresh_
        </button>
      </div>
      {message ? (
        <p className="flex items-start gap-2 text-xs font-mono text-mantle">
          {message.includes("stale") ? <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-300" aria-hidden /> : null}
          <span>{message}</span>
        </p>
      ) : null}
      <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-600">
        Demo mode: generated evaluation only, no trading or custody
      </p>
    </div>
  );
}
