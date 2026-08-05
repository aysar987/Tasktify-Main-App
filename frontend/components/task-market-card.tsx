"use client";

import { CalendarDays, Check, LoaderCircle, Lock, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { claimTask } from "@/lib/api";
import { rupiah } from "@/lib/format";
import type { Task } from "@/types";
import { primaryButton } from "./ui";

export function TaskMarketCard({
  task,
  locked,
  onClaimed,
  onError,
}: {
  task: Task;
  locked?: boolean;
  onClaimed: (id: string) => void;
  onError: (message: string) => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function claim() {
    setLoading(true);
    try {
      await claimTask(task.id);
      onClaimed(task.id);
      router.push(`/tasks/${task.id}`);
    } catch (cause) {
      onError(cause instanceof Error ? cause.message : "Task gagal diambil.");
      setLoading(false);
    }
  }

  return (
    <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-orange-300">
      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{task.id} · {task.category}</span>
      <h3 className="mt-1 font-[var(--font-manrope)] text-lg font-extrabold text-slate-950">{task.title}</h3>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
        <span className="flex items-center gap-2"><MapPin className="size-4" />{task.location}</span>
        <span className="flex items-center gap-2"><CalendarDays className="size-4" />{task.date}</span>
      </div>
      <p className="mt-3 line-clamp-2 text-sm text-slate-600">{task.note}</p>
      <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <div><span className="block text-xs text-slate-500">Harga tetap</span><strong className="text-slate-950">{rupiah(task.budget)}</strong></div>
        <button type="button" disabled={loading || locked} onClick={claim} className={primaryButton}>
          {loading ? <LoaderCircle className="size-5 animate-spin" /> : locked ? <Lock className="size-5" /> : <Check className="size-5" />} {locked ? "Terkunci" : "Ambil task"}
        </button>
      </div>
    </article>
  );
}
