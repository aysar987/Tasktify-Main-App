"use client";

import { Ban, MessageSquareText, Star } from "lucide-react";
import { useState } from "react";
import { cancelTask } from "@/lib/api";
import { primaryButton, secondaryButton } from "./ui";

export function TaskActions({ taskId, completed = false, cancelled: initialCancelled = false, onCancelled }: { taskId: string; completed?: boolean; cancelled?: boolean; onCancelled?: () => void }) {
  const [cancelled, setCancelled] = useState(initialCancelled);
  const [loading, setLoading] = useState(false);
  async function cancel() {
    if (!window.confirm("Batalkan task ini? Tindakan ini tidak dapat diurungkan.")) return;
    setLoading(true);
    try { await cancelTask(taskId); setCancelled(true); onCancelled?.(); } finally { setLoading(false); }
  }
  if (cancelled) return <div role="status" className="rounded-xl border border-red-200 bg-red-50 p-4 font-semibold text-red-700">Task telah dibatalkan. Penyedia akan menerima notifikasi.</div>;
  return completed ? <button type="button" disabled title="Rating akan tersedia setelah sistem penyedia diaktifkan" className={`${primaryButton} w-full opacity-50`}><Star className="size-5" /> Beri rating</button> : <div className="grid gap-3"><a href="/chat" className={`${primaryButton} w-full`}><MessageSquareText className="size-5" /> Hubungi penyedia</a><button disabled={loading} type="button" onClick={cancel} className={`${secondaryButton} w-full border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50`}><Ban className="size-5" /> {loading ? "Membatalkan..." : "Batalkan task"}</button></div>;
}
