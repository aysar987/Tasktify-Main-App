import { Briefcase } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { rupiah } from "@/lib/format";
import type { Task } from "@/types";

export function TaskMarketCard({ task }: { task: Task }) {
  return (
    <Link
      href={`/marketplace/${task.id}`}
      className="group block overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-lg"
    >
      <div className="relative flex h-[130px] items-center justify-center overflow-hidden bg-gradient-to-br from-sky-300 via-blue-500 to-indigo-800">
        {task.imageUrl ? (
          <Image unoptimized src={task.imageUrl} alt="" fill className="object-cover" />
        ) : (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.34),transparent_36%)]" />
            <Briefcase className="relative size-9 text-white/90 transition duration-300 group-hover:scale-110" strokeWidth={1.35} />
          </>
        )}
      </div>
      <div className="p-3">
        <h3 className="truncate text-sm font-extrabold text-slate-950 group-hover:text-blue-700">{task.title}</h3>
        <p className="mt-1 truncate text-xs text-slate-500">{rupiah(task.budget)}</p>
      </div>
    </Link>
  );
}
