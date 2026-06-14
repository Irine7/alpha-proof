"use client";

import { RefreshCw, Send } from "lucide-react";
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
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const STORAGE_KEY = "alphaproof.telegramConnectCode";

export function HeroTelegramConnectButton() {
  const [connect, setConnect] = useState<ConnectResponse | null>(null);
  const [status, setStatus] = useState<ConnectStatus | null>(null);
  const [savedCode, setSavedCode] = useState<string | null>(() =>
    typeof window === "undefined" ? null : window.localStorage.getItem(STORAGE_KEY)
  );
  const [isLoading, setIsLoading] = useState(false);

  const state = useMemo(() => {
    if (status?.status === "disconnected") return "disconnected";
    if (status?.connected) return "connected";
    if (status?.status === "expired") return "expired";
    if (connect) return "waiting";
    return "idle";
  }, [connect, status]);

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
      // Keep the visible state stable if the backend is unavailable.
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
    } catch {
      // Keep the card quiet; the dashboard exposes the fuller connection state.
    } finally {
      setIsLoading(false);
    }
  }

  function handleClick() {
    if (state === "connected") return;
    if (state === "waiting" && connect?.botUrl) {
      window.open(connect.botUrl, "_blank", "noopener,noreferrer");
      return;
    }
    void createConnectCode();
  }

  if (state === "connected") {
    return (
      <button
        type="button"
        disabled
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-[12px] border border-mantle/30 bg-mantle/10 px-5 py-3 text-sm font-semibold text-mantle shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
      >
        Connected
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-[12px] border border-mantle/40 bg-mantle/5 px-5 py-3 text-sm font-semibold text-zinc-100 transition-colors hover:border-mantle/70 hover:bg-mantle/10 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isLoading ? <RefreshCw size={14} className="animate-spin" aria-hidden /> : <Send size={14} aria-hidden />}
      {state === "waiting" ? "Open Telegram" : "Connect Telegram"}
    </button>
  );
}
