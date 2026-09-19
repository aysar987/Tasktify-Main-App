"use client";

import { BellRing } from "lucide-react";
import { useEffect, useState } from "react";
import {
  enablePush,
  needsHomeScreenInstall,
  pushAvailableOnServer,
  pushSupported,
  syncPushSubscription,
} from "@/lib/push";

type State = "hidden" | "ask" | "denied" | "install";

/** Asks once for permission to push new chat messages to this device, and keeps the subscription registered. */
export function ChatPushPrompt() {
  const [state, setState] = useState<State>("hidden");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      if (needsHomeScreenInstall()) {
        if (!cancelled) setState("install");
        return;
      }
      if (!pushSupported() || !(await pushAvailableOnServer())) return;
      if (Notification.permission === "granted") {
        await syncPushSubscription().catch(() => undefined);
        return;
      }
      if (!cancelled) setState(Notification.permission === "denied" ? "denied" : "ask");
    }
    void init();
    return () => {
      cancelled = true;
    };
  }, []);

  async function enable() {
    setBusy(true);
    try {
      const permission = await enablePush();
      setState(permission === "denied" ? "denied" : permission === "granted" ? "hidden" : "ask");
    } catch {
      setState("ask");
    } finally {
      setBusy(false);
    }
  }

  if (state === "hidden") return null;
  const message = {
    ask: "Aktifkan notifikasi agar pesan baru masuk ke HP Anda walau aplikasi ditutup.",
    denied: "Notifikasi diblokir. Izinkan notifikasi Tasktify di pengaturan browser atau HP untuk menerima pesan baru.",
    install: "Untuk menerima notifikasi chat di iPhone, tambahkan Tasktify ke Layar Utama lalu buka dari sana.",
  }[state];

  return (
    <div className="mt-4 flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4">
      <BellRing className="size-6 shrink-0 text-blue-600" />
      <p className="min-w-0 flex-1 text-sm leading-5 text-slate-700">{message}</p>
      {state === "ask" && (
        <button
          type="button"
          onClick={() => void enable()}
          disabled={busy}
          className="shrink-0 cursor-pointer rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          Aktifkan
        </button>
      )}
    </div>
  );
}
