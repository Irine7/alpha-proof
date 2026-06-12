"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, CheckCircle, Clock, Copy, ExternalLink, RefreshCw, Send } from "lucide-react";

type ConnectResponse = {
  code: string;
  botUrl: string;
  expiresAt: string;
  status: "pending";
};

type ConnectStatus = {
  status: "pending" | "used" | "expired";
  connected: boolean;
  chatIdMasked: string | null;
  username: string | null;
  usedAt: string | null;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function minutesUntil(value: string | null) {
  if (!value) return "";
  const diff = new Date(value).getTime() - Date.now();
  if (diff <= 0) return "expired";
  const minutes = Math.ceil(diff / 60_000);
  return `${minutes} min`;
}

export function TelegramConnectCard() {
  const [connect, setConnect] = useState<ConnectResponse | null>(null);
  const [status, setStatus] = useState<ConnectStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const state = useMemo(() => {
    if (status?.connected) return "connected";
    if (status?.status === "expired") return "expired";
    if (connect) return "waiting";
    return "idle";
  }, [connect, status]);

  async function createConnectCode() {
    setIsLoading(true);
    setError(null);
    setCopied(false);

    try {
      const response = await fetch(`${API_URL}/api/telegram/connect-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const body = (await response.json()) as ConnectResponse | { error?: string };
      if (!response.ok) throw new Error("error" in body && body.error ? body.error : "Telegram connect failed");

      setConnect(body as ConnectResponse);
      setStatus(null);
      window.open((body as ConnectResponse).botUrl, "_blank", "noopener,noreferrer");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Telegram connect failed");
    } finally {
      setIsLoading(false);
    }
  }

  async function copyLink() {
    if (!connect?.botUrl) return;
    await navigator.clipboard.writeText(connect.botUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  useEffect(() => {
    if (!connect || status?.connected || status?.status === "expired") return undefined;

    const poll = async () => {
      try {
        const response = await fetch(`${API_URL}/api/telegram/connect-code/${connect.code}/status`, { cache: "no-store" });
        if (!response.ok) return;
        const body = (await response.json()) as ConnectStatus;
        setStatus(body);
      } catch {
        // Keep the visible waiting state; transient polling failures are not useful to surface.
      }
    };

    void poll();
    const timer = window.setInterval(poll, 2500);
    return () => window.clearInterval(timer);
  }, [connect, status?.connected, status?.status]);

  return (
    <section className="mb-12 border border-white/10 bg-[#0a0a0a]">
      <div className="grid gap-0 lg:grid-cols-[1fr_auto] lg:divide-x divide-white/10">
        <div className="p-6">
          <div className="mb-3 flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
            <Bell size={14} aria-hidden />
            Telegram Alerts
          </div>
          <h2 className="text-xl font-medium tracking-tight text-white">Connect Telegram Alerts</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">
            Get proof-backed signals in Telegram as soon as AlphaProof commits them on-chain.
          </p>
          <div className="mt-4 grid gap-3 text-xs font-mono text-zinc-500 sm:grid-cols-2">
            <p>Signal alerts: enabled</p>
            <p>Resolve updates: enabled</p>
          </div>
          {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}
        </div>

        <div className="flex min-w-[280px] flex-col justify-center gap-3 p-6">
          {state === "idle" ? (
            <button
              type="button"
              onClick={createConnectCode}
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 border border-mantle/40 bg-mantle/10 px-4 py-3 text-sm font-mono uppercase tracking-wider text-mantle transition-colors hover:bg-mantle/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? <RefreshCw size={16} className="animate-spin" aria-hidden /> : <Send size={16} aria-hidden />}
              Connect Telegram
            </button>
          ) : null}

          {state === "waiting" && connect ? (
            <>
              <a
                href={connect.botUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 border border-mantle/40 bg-mantle/10 px-4 py-3 text-sm font-mono uppercase tracking-wider text-mantle transition-colors hover:bg-mantle/20"
              >
                <ExternalLink size={16} aria-hidden />
                Open Telegram
              </a>
              <button
                type="button"
                onClick={copyLink}
                className="inline-flex items-center justify-center gap-2 border border-white/10 px-4 py-3 text-sm font-mono uppercase tracking-wider text-zinc-300 transition-colors hover:border-white/25 hover:text-white"
              >
                <Copy size={16} aria-hidden />
                {copied ? "Copied" : "Copy connect link"}
              </button>
              <p className="flex items-center justify-center gap-2 text-center text-xs text-zinc-500">
                <Clock size={13} aria-hidden />
                Waiting for Telegram confirmation · expires in {minutesUntil(connect.expiresAt)}
              </p>
            </>
          ) : null}

          {state === "connected" ? (
            <>
              <div className="flex items-center justify-center gap-2 border border-emerald-300/25 bg-emerald-300/5 px-4 py-3 text-sm font-mono uppercase tracking-wider text-emerald-200">
                <CheckCircle size={16} aria-hidden />
                Telegram connected
              </div>
              {connect?.botUrl ? (
                <a
                  href={connect.botUrl.split("?")[0]}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 border border-white/10 px-4 py-3 text-sm font-mono uppercase tracking-wider text-zinc-300 transition-colors hover:border-white/25 hover:text-white"
                >
                  <ExternalLink size={16} aria-hidden />
                  Manage in Telegram
                </a>
              ) : null}
            </>
          ) : null}

          {state === "expired" ? (
            <button
              type="button"
              onClick={createConnectCode}
              className="inline-flex items-center justify-center gap-2 border border-amber-300/30 bg-amber-300/5 px-4 py-3 text-sm font-mono uppercase tracking-wider text-amber-200 transition-colors hover:bg-amber-300/10"
            >
              <RefreshCw size={16} aria-hidden />
              Generate new link
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
