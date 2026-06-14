"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, CheckCircle, Clock, Copy, ExternalLink, RefreshCw, Send, Unlink } from "lucide-react";

type ConnectResponse = {
  code: string;
  botUrl: string;
  expiresAt: string;
  status: "pending";
};

type ConnectStatus = {
  status: "pending" | "used" | "expired" | "disconnected";
  connected: boolean;
  chatIdMasked: string | null;
  username: string | null;
  usedAt: string | null;
  subscriber: {
    isActive: boolean;
    subscribedToCreates: boolean;
    subscribedToResolves: boolean;
    minConfidence: number | null;
    signalTypes: string[] | null;
    username: string | null;
    chatIdMasked: string | null;
  } | null;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "";
const STORAGE_KEY = "alphaproof.telegramConnectCode";

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
  const [testMessage, setTestMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [savedCode, setSavedCode] = useState<string | null>(() =>
    typeof window === "undefined" ? null : window.localStorage.getItem(STORAGE_KEY)
  );

  const state = useMemo(() => {
    if (status?.status === "disconnected") return "disconnected";
    if (status?.connected) return "connected";
    if (status?.status === "expired") return "expired";
    if (connect) return "waiting";
    return "idle";
  }, [connect, status]);

  async function createConnectCode() {
    setIsLoading(true);
    setError(null);
    setTestMessage(null);
    setCopied(false);

    try {
      const response = await fetch(`${API_URL}/api/telegram/connect-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const body = (await response.json()) as ConnectResponse | { error?: string };
      if (!response.ok) throw new Error("error" in body && body.error ? body.error : "Telegram connect failed");

      setConnect(body as ConnectResponse);
      setSavedCode((body as ConnectResponse).code);
      window.localStorage.setItem(STORAGE_KEY, (body as ConnectResponse).code);
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

  async function sendTestAlert() {
    const code = status?.status === "used" ? savedCode || connect?.code : connect?.code || savedCode;
    if (!code || !status?.connected) {
      setError("Connect Telegram first.");
      return;
    }

    setIsTesting(true);
    setError(null);
    setTestMessage(null);

    try {
      const response = await fetch(`${API_URL}/api/telegram/connect-code/${code}/test-alert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const body = (await response.json()) as { sent?: boolean; error?: string; retryAfterSeconds?: number; alertsEnabled?: boolean };
      if (!response.ok) {
        const retry = response.status === 429 && body.retryAfterSeconds ? ` Try again in ${body.retryAfterSeconds}s.` : "";
        throw new Error(`${body.error || "Test alert failed"}${retry}`);
      }

      setTestMessage(body.alertsEnabled === false ? "Test alert sent. Telegram is connected, but alerts are disabled." : "Test alert sent to Telegram.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Test alert failed");
    } finally {
      setIsTesting(false);
    }
  }

  async function disconnectTelegram() {
    const code = savedCode || connect?.code;
    if (!code) {
      setError("No Telegram connection to disconnect.");
      return;
    }

    setIsDisconnecting(true);
    setError(null);
    setTestMessage(null);

    try {
      const response = await fetch(`${API_URL}/api/telegram/connect-code/${code}/disconnect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const body = (await response.json()) as ConnectStatus | { error?: string };
      if (!response.ok) throw new Error("error" in body && body.error ? body.error : "Telegram disconnect failed");

      window.localStorage.removeItem(STORAGE_KEY);
      setSavedCode(null);
      setConnect(null);
      setStatus(body as ConnectStatus);
      setTestMessage("Telegram disconnected.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Telegram disconnect failed");
    } finally {
      setIsDisconnecting(false);
    }
  }

  const refreshStatus = useCallback(async (code = connect?.code || savedCode) => {
    if (!code) return;
    try {
      const response = await fetch(`${API_URL}/api/telegram/connect-code/${code}/status`, { cache: "no-store" });
      if (!response.ok) return;
      const body = (await response.json()) as ConnectStatus;
      setStatus(body);
    } catch {
      // Keep the current state visible.
    }
  }, [connect?.code, savedCode]);

  useEffect(() => {
    if (!savedCode) return undefined;
    const timer = window.setTimeout(() => {
      void refreshStatus(savedCode);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refreshStatus, savedCode]);

  useEffect(() => {
    if (!connect || status?.connected || status?.status === "expired") return undefined;

    const poll = () => refreshStatus(connect.code);

    void poll();
    const timer = window.setInterval(poll, 2500);
    return () => window.clearInterval(timer);
  }, [connect, refreshStatus, status?.connected, status?.status]);

  const botUrl = connect?.botUrl || (BOT_USERNAME ? `https://t.me/${BOT_USERNAME.replace(/^@/, "")}` : "");
  const subscriber = status?.subscriber;
  const isDisabled = state === "connected" && subscriber && !subscriber.isActive;
  const isMisconfigured = !BOT_USERNAME && !connect && (state === "idle" || state === "disconnected");

  return (
    <section className="mb-12 border border-mantle/25 bg-mantle/[0.04] shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
      <div className="grid gap-0 lg:grid-cols-[1fr_auto] lg:divide-x divide-white/10">
        <div className="p-6">
          <div className="mb-3 flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
            <Bell size={14} aria-hidden />
            Telegram Alerts
          </div>
          <h2 className="text-xl font-medium tracking-tight text-white">
            {state === "waiting"
              ? "Waiting for Telegram confirmation..."
              : isDisabled
                ? "Telegram connected, alerts disabled"
                : state === "connected"
                  ? "Telegram connected"
                  : state === "expired"
                    ? "Connect link expired"
                    : state === "disconnected"
                      ? "Telegram disconnected"
                      : "Telegram Alerts"}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">
            Receive proof-backed AlphaProof signals directly in Telegram as soon as they are committed on-chain.
          </p>
          <div className="mt-4 grid gap-3 text-xs font-mono text-zinc-500 sm:grid-cols-2">
            {state === "connected" && subscriber ? (
              <>
                <p>Alerts {subscriber.isActive ? "enabled" : "disabled"}</p>
                <p>Creates: {subscriber.subscribedToCreates ? "on" : "off"}</p>
                <p>Resolves: {subscriber.subscribedToResolves ? "on" : "off"}</p>
                <p>Min confidence: {subscriber.minConfidence === null ? "off" : `${subscriber.minConfidence}%`}</p>
                <p>Signal types: {subscriber.signalTypes?.length ? subscriber.signalTypes.join(", ") : "all"}</p>
                <p>Connected as: {subscriber.username ? `@${subscriber.username}` : subscriber.chatIdMasked || "connected chat"}</p>
              </>
            ) : (
              <>
                <p>Status: {state === "waiting" ? "waiting" : state === "expired" ? "expired" : state === "disconnected" ? "disconnected" : "not connected"}</p>
                <p>Notification mode: signal alerts + resolve updates</p>
              </>
            )}
          </div>
          {state === "waiting" ? <p className="mt-4 text-xs text-zinc-500">After Telegram opens, press Start to connect alerts.</p> : null}
          {isDisabled ? <p className="mt-4 text-sm text-amber-200">Telegram connected, but alerts are disabled. Re-enable in Telegram with /subscribe or /alerts on.</p> : null}
          {state === "connected" && subscriber?.isActive ? <p className="mt-4 text-sm text-emerald-200">Telegram alerts will be sent to your connected chat.</p> : null}
          {state === "idle" ? <p className="mt-4 text-sm text-zinc-400">Connect Telegram to receive alerts.</p> : null}
          {state === "disconnected" ? <p className="mt-4 text-sm text-zinc-400">Reconnect from the dashboard to link Telegram again.</p> : null}
          {isMisconfigured ? <p className="mt-3 text-xs text-zinc-600">Telegram alerts are not configured yet. Backend can still create a connect link when Telegram is configured.</p> : null}
          {testMessage ? <p className="mt-4 text-sm text-emerald-200">{testMessage}</p> : null}
          {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}
        </div>

        <div className="flex min-w-[280px] flex-col justify-center gap-3 p-6">
          {state === "idle" || state === "disconnected" ? (
            <>
              <button
                type="button"
                onClick={createConnectCode}
                disabled={isLoading}
                className="inline-flex items-center justify-center gap-2 border border-mantle/40 bg-mantle/10 px-4 py-3 text-sm font-mono uppercase tracking-wider text-mantle transition-colors hover:bg-mantle/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? <RefreshCw size={16} className="animate-spin" aria-hidden /> : <Send size={16} aria-hidden />}
                {state === "disconnected" ? "Generate new connect link" : "Connect Telegram"}
              </button>
              {BOT_USERNAME ? (
                <a href={`https://t.me/${BOT_USERNAME.replace(/^@/, "")}`} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 border border-white/10 px-4 py-3 text-sm font-mono uppercase tracking-wider text-zinc-300 transition-colors hover:border-white/25 hover:text-white">
                  <ExternalLink size={16} aria-hidden />
                  Open Bot
                </a>
              ) : null}
            </>
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
                onClick={() => void copyLink()}
                className="inline-flex items-center justify-center gap-2 border border-white/10 px-4 py-3 text-sm font-mono uppercase tracking-wider text-zinc-300 transition-colors hover:border-white/25 hover:text-white"
              >
                <Copy size={16} aria-hidden />
                {copied ? "Copied" : "Copy connect link"}
              </button>
              <p className="flex items-center justify-center gap-2 text-center text-xs text-zinc-500">
                <Clock size={13} aria-hidden />
                Waiting for Telegram confirmation · expires in {minutesUntil(connect.expiresAt)}
              </p>
              <button type="button" onClick={() => void refreshStatus()} className="inline-flex items-center justify-center gap-2 border border-white/10 px-4 py-3 text-sm font-mono uppercase tracking-wider text-zinc-300 transition-colors hover:border-white/25 hover:text-white">
                <RefreshCw size={16} aria-hidden />
                Refresh status
              </button>
            </>
          ) : null}

          {state === "connected" ? (
            <>
              <div className="flex items-center justify-center gap-2 border border-emerald-300/25 bg-emerald-300/5 px-4 py-3 text-sm font-mono uppercase tracking-wider text-emerald-200">
                <CheckCircle size={16} aria-hidden />
                Telegram connected
              </div>
              {botUrl ? (
                <a
                  href={botUrl.split("?")[0]}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 border border-white/10 px-4 py-3 text-sm font-mono uppercase tracking-wider text-zinc-300 transition-colors hover:border-white/25 hover:text-white"
                >
                  <ExternalLink size={16} aria-hidden />
                  Open Bot
                </a>
              ) : null}
              <button type="button" onClick={() => void refreshStatus()} className="inline-flex items-center justify-center gap-2 border border-white/10 px-4 py-3 text-sm font-mono uppercase tracking-wider text-zinc-300 transition-colors hover:border-white/25 hover:text-white">
                <RefreshCw size={16} aria-hidden />
                Refresh status
              </button>
              <button
                type="button"
                onClick={() => void sendTestAlert()}
                disabled={isTesting}
                className="inline-flex items-center justify-center gap-2 border border-mantle/40 bg-mantle/10 px-4 py-3 text-sm font-mono uppercase tracking-wider text-mantle transition-colors hover:bg-mantle/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isTesting ? <RefreshCw size={16} className="animate-spin" aria-hidden /> : <Send size={16} aria-hidden />}
                Send Test Alert
              </button>
              <button
                type="button"
                onClick={() => void disconnectTelegram()}
                disabled={isDisconnecting}
                className="inline-flex items-center justify-center gap-2 border border-red-300/25 px-4 py-3 text-sm font-mono uppercase tracking-wider text-red-200 transition-colors hover:border-red-300/40 hover:bg-red-300/5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDisconnecting ? <RefreshCw size={16} className="animate-spin" aria-hidden /> : <Unlink size={16} aria-hidden />}
                Disconnect Telegram
              </button>
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
