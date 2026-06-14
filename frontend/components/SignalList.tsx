"use client";

import { useState } from "react";
import type { RuntimeStatus, Signal } from "../lib/types";
import { SignalCard } from "./SignalCard";

const PAGE_SIZE = 8;

export function SignalList({ signals, runtime }: { signals: Signal[]; runtime: RuntimeStatus }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const visibleSignals = signals.slice(0, visibleCount);
  const canLoadMore = visibleCount < signals.length;

  if (!signals.length) {
    return (
      <div className="border border-white/10 bg-[#0a0a0a] p-8 text-center text-zinc-500 font-mono text-sm">
        No signals yet. Create a proof signal from the dashboard controls.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {visibleSignals.map((signal) => (
          <SignalCard key={signal.id} signal={signal} runtime={runtime} />
        ))}
      </div>
      <div className="flex flex-col items-center justify-between gap-3 border border-white/10 bg-[#0a0a0a] p-4 sm:flex-row">
        <p className="text-xs font-mono uppercase tracking-wider text-zinc-500">
          Showing {visibleSignals.length} of {signals.length}
        </p>
        {canLoadMore ? (
          <button
            type="button"
            onClick={() => setVisibleCount((current) => Math.min(current + PAGE_SIZE, signals.length))}
            className="border border-white/10 px-4 py-2 text-xs font-mono uppercase tracking-wider text-zinc-300 transition-colors hover:border-white/25 hover:text-white"
          >
            Load more
          </button>
        ) : null}
      </div>
    </div>
  );
}
