"use client";

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
        await createDemoSignal();
        setMessage("Demo signal committed. Proof and reasoning are now visible below.");
      } else {
        const result = (await resolvePendingSignals()) as { resolved?: number };
        setMessage(`Resolved ${result.resolved ?? 0} pending signal(s). Reputation updated.`);
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
          className="text-xs font-mono uppercase bg-white text-black px-4 py-2 hover:bg-zinc-200 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          Create Demo Signal_
        </button>
        <button
          onClick={() => run("resolve")}
          disabled={disabled}
          className="text-xs font-mono uppercase border border-white/10 text-white px-4 py-2 hover:border-white/30 transition-colors bg-[#0a0a0a] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Resolve Pending Signals_
        </button>
      </div>
      {message ? <p className="text-xs font-mono text-mantle">{message}</p> : null}
      <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-600">
        Demo mode: mock/historical evaluation, no trading or custody
      </p>
    </div>
  );
}
