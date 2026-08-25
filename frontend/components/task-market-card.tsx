"use client";

import { Briefcase, CalendarDays, Check, LoaderCircle, Lock, MapPin } from "lucide-react";
import Link from "next/link";
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
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:border-orange-300">
      <Link href={`/marketplace/${task.id}`} className="focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200">
        <div className="flex aspect-[4/3] items-center justify-center bg-orange-600">
          <Briefcase className="size-10 text-white/90" />
        </div>
        <div className="p-4">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{task.category}</span>
          <h3 className="mt-1 line-clamp-1 font-[var(--font-manrope)] text-base font-extrabold text-slate-950 group-hover:text-orange-700">{task.title}</h3>
          <div className="mt-2 space-y-1 text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><MapPin className="size-3.5 shrink-0" /><span className="truncate">{task.location}</span></span>
            <span className="flex items-center gap-1.5"><CalendarDays className="size-3.5 shrink-0" /><span className="truncate">{task.date}</span></span>
          </div>
        </div>
      </Link>
      <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-100 px-4 py-3">
        <strong className="text-sm text-slate-950">{rupiah(task.budget)}</strong>
        <button type="button" disabled={loading || locked} onClick={claim} className={`${primaryButton} min-h-9 px-3 text-sm`}>
          {loading ? <LoaderCircle className="size-4 animate-spin" /> : locked ? <Lock className="size-4" /> : <Check className="size-4" />} {locked ? "Terkunci" : "Ambil"}
        </button>
      </div>
    </article>
  );
}
