import { CalendarDays, ChevronRight, MapPin } from "lucide-react";
import Link from "next/link";
import { rupiah } from "@/lib/format";
import type { Task } from "@/types";
import { StatusBadge } from "./ui";

export function TaskCard({ task }: { task: Task }) {
  return (
    <Link href={`/tasks/${task.id}`} className="group block rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-orange-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><span className="text-xs font-bold uppercase tracking-wider text-slate-400">{task.id}</span><h3 className="mt-1 font-[var(--font-manrope)] text-lg font-extrabold text-slate-950">{task.title}</h3></div><StatusBadge status={task.status} /></div>
      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500"><span className="flex items-center gap-2"><MapPin className="size-4" />{task.location}</span><span className="flex items-center gap-2"><CalendarDays className="size-4" />{task.date}</span></div>
      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4"><span className="font-bold text-slate-900">{rupiah(task.budget)}</span><span className="flex items-center gap-1 text-sm font-bold text-orange-700">Lihat detail <ChevronRight className="size-4 transition group-hover:translate-x-1" /></span></div>
    </Link>
  );
}
