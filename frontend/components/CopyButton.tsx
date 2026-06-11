"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copyValue() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <button
      type="button"
      onClick={copyValue}
      title={label}
      className="inline-flex items-center gap-1 border border-white/10 px-2 py-1 text-[10px] font-mono uppercase text-zinc-300 transition-colors hover:border-white/30 hover:text-white"
    >
      {copied ? <Check size={12} aria-hidden /> : <Copy size={12} aria-hidden />}
      {copied ? "Copied" : label}
    </button>
  );
}
