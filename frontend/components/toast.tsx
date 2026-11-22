"use client";

import { AlertCircle, CheckCircle2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export type ToastMessage = { tone: "success" | "error"; message: string };

/** A short message at the bottom of the screen that closes itself after a few seconds. */
export function useToast(duration = 4000) {
  const [toast, setToast] = useState<ToastMessage>();
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(undefined), duration);
    return () => window.clearTimeout(timer);
  }, [toast, duration]);
  const show = useCallback((tone: ToastMessage["tone"], message: string) => setToast({ tone, message }), []);
  const close = useCallback(() => setToast(undefined), []);
  return { toast, show, close };
}

export function Toast({ toast, onClose }: { toast?: ToastMessage; onClose: () => void }) {
  if (!toast) return null;
  const error = toast.tone === "error";
  return (
    <div
      role={error ? "alert" : "status"}
      className="fixed inset-x-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-50 mx-auto flex max-w-sm items-center gap-3 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-xl lg:bottom-8"
    >
      {error ? (
        <AlertCircle className="size-5 shrink-0 text-red-400" />
      ) : (
        <CheckCircle2 className="size-5 shrink-0 text-emerald-400" />
      )}
      <span className="flex-1">{toast.message}</span>
      <button type="button" aria-label="Tutup notifikasi" onClick={onClose} className="grid size-8 cursor-pointer place-items-center rounded-full hover:bg-white/10">
        <X className="size-4" />
      </button>
    </div>
  );
}
