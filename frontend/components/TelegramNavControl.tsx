"use client";

import { ExternalLink, RefreshCw, Send, Unlink } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

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

export function TelegramNavControl() {
  const [connect, setConnect] = useState<ConnectResponse | null>(null);
  const [status, setStatus] = useState<ConnectStatus | null>(null);
  const [savedCode, setSavedCode] = useState<string | null>(() =>
    typeof window === "undefined" ? null : window.localStorage.getItem(STORAGE_KEY)
  );
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const state = useMemo(() => {
    if (status?.status === "disconnected") return "disconnected";
    if (status?.connected) return "connected";
    if (status?.status === "expired") return "expired";
    if (connect) return "waiting";
    return "idle";
  }, [connect, status]);

  const subscriber = status?.subscriber;
  const botUrl = connect?.botUrl || (BOT_USERNAME ? `https://t.me/${BOT_USERNAME.replace(/^@/, "")}` : "");
  const connectedLabel = subscriber?.username ? `@${subscriber.username}` : subscriber?.chatIdMasked || status?.chatIdMasked || "connected chat";

  const refreshStatus = useCallback(async (code = connect?.code || savedCode) => {
    if (!code) return;
    try {
      const response = await fetch(`${API_URL}/api/telegram/connect-code/${code}/status`, { cache: "no-store" });
      if (!response.ok) return;
      const body = (await response.json()) as ConnectStatus;
      setStatus(body);
      if (body.status === "disconnected" || body.status === "expired") {
        window.localStorage.removeItem(STORAGE_KEY);
        setSavedCode(null);
        setConnect(null);
      }
    } catch {
      // Keep the current visible state.
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

  async function createConnectCode() {
    setIsLoading(true);
    setMessage(null);
    try {
      const response = await fetch(`${API_URL}/api/telegram/connect-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const body = (await response.json()) as ConnectResponse | { error?: string };
      if (!response.ok) throw new Error("error" in body && body.error ? body.error : "Telegram connect failed");

      const nextConnect = body as ConnectResponse;
      setConnect(nextConnect);
      setSavedCode(nextConnect.code);
      setStatus(null);
      window.localStorage.setItem(STORAGE_KEY, nextConnect.code);
      window.open(nextConnect.botUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Telegram connect failed");
    } finally {
      setIsLoading(false);
    }
  }

  async function sendTestAlert() {
    const code = status?.status === "used" ? savedCode || connect?.code : connect?.code || savedCode;
    if (!code || !status?.connected) {
      setMessage("Connect Telegram first.");
      return;
    }

    setIsTesting(true);
    setMessage(null);
    try {
      const response = await fetch(`${API_URL}/api/telegram/connect-code/${code}/test-alert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const body = (await response.json()) as { error?: string; retryAfterSeconds?: number; alertsEnabled?: boolean };
      if (!response.ok) {
        const retry = response.status === 429 && body.retryAfterSeconds ? ` Try again in ${body.retryAfterSeconds}s.` : "";
        throw new Error(`${body.error || "Test alert failed"}${retry}`);
      }
      setMessage(body.alertsEnabled === false ? "Sent, alerts disabled" : "Test alert sent");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Test alert failed");
    } finally {
      setIsTesting(false);
    }
  }

  async function disconnectTelegram() {
    const code = savedCode || connect?.code;
    if (!code) {
      setMessage("No Telegram connection.");
      return;
    }

    setIsDisconnecting(true);
    setMessage(null);
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
      setMessage("Disconnected");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Telegram disconnect failed");
    } finally {
      setIsDisconnecting(false);
    }
  }

  if (state === "connected") {
    return (
      <div className="group relative hidden sm:block">
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 border border-mantle/30 bg-mantle/10 px-4 py-2 font-mono text-xs uppercase tracking-wider text-mantle shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-colors hover:border-mantle/50 hover:bg-mantle/15"
        >
          Connected
        </button>

        <div className="invisible absolute right-0 top-full z-50 w-[300px] translate-y-3 border border-white/10 bg-[#101312]/95 p-4 opacity-0 shadow-2xl shadow-black/60 backdrop-blur-md transition-all group-hover:visible group-hover:translate-y-2 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-2 group-focus-within:opacity-100">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <p className="text-[18px] font-semibold leading-tight text-white">Instant Signals: Telegram Integration</p>
            </div>
            <span className="shrink-0 rounded-[5px] border border-mantle/20 bg-mantle/10 px-2.5 py-1 text-xs font-semibold text-mantle">
              Connected
            </span>
          </div>

          <div className="space-y-2">
            {botUrl ? (
              <a href={botUrl.split("?")[0]} target="_blank" rel="noreferrer" className="flex w-full items-center justify-center gap-2 rounded-[5px] border border-white/10 bg-[#17191d] px-3 py-2 text-xs font-bold uppercase tracking-wider text-zinc-200 transition-colors hover:border-white/25 hover:text-white">
                <ExternalLink size={15} aria-hidden />
                Open Bot Chat
              </a>
            ) : null}
            <button type="button" onClick={() => void sendTestAlert()} disabled={isTesting} className="flex w-full items-center justify-center gap-2 rounded-[5px] border border-mantle/40 bg-mantle px-3 py-2 text-xs font-bold uppercase tracking-wider text-black transition-colors hover:bg-mantle/90 disabled:cursor-not-allowed disabled:opacity-60">
              {isTesting ? <RefreshCw size={15} className="animate-spin" aria-hidden /> : <Send size={15} aria-hidden />}
              Send Test Alert
            </button>
            <button type="button" onClick={() => void refreshStatus()} className="flex w-full items-center justify-center gap-2 rounded-[5px] border border-white/10 bg-[#17191d] px-3 py-2 text-xs font-bold uppercase tracking-wider text-zinc-200 transition-colors hover:border-white/25 hover:text-white">
              <RefreshCw size={15} aria-hidden />
              Refresh Status
            </button>
            <button type="button" onClick={() => void disconnectTelegram()} disabled={isDisconnecting} className="flex w-full items-center justify-center gap-2 rounded-[5px] border border-red-300/20 bg-[#17191d] px-3 py-2 text-xs font-bold uppercase tracking-wider text-red-200 transition-colors hover:border-red-300/40 hover:bg-red-300/5 disabled:cursor-not-allowed disabled:opacity-60">
              {isDisconnecting ? <RefreshCw size={15} className="animate-spin" aria-hidden /> : <Unlink size={15} aria-hidden />}
              Disconnect
            </button>
          </div>

          <p className="mt-3 truncate text-center text-xs font-semibold text-mantle/80">Alerts active for {connectedLabel}</p>
          {message ? <p className="mt-2 text-center text-xs text-zinc-400">{message}</p> : null}
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void createConnectCode()}
      disabled={isLoading}
      className="hidden items-center justify-center gap-2 border border-white/10 bg-[#0a0a0a] px-4 py-2 font-mono text-xs uppercase tracking-wider text-zinc-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-colors hover:border-mantle/40 hover:text-mantle disabled:cursor-not-allowed disabled:opacity-60 sm:inline-flex"
    >
      {isLoading ? <RefreshCw size={14} className="animate-spin" aria-hidden /> : <Send size={14} aria-hidden />}
      {state === "waiting" ? "Open Telegram" : "Connect Telegram"}
    </button>
  );
}
