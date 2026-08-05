import { Star } from "lucide-react";
import type { Rating } from "@/types";

export function ProviderReviews({ ratings }: { ratings: Rating[] }) {
  if (ratings.length === 0)
    return (
      <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
        Belum ada ulasan.
      </p>
    );
  return (
    <div className="space-y-4">
      {ratings.map((item) => (
        <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <strong className="font-[var(--font-manrope)]">{item.clientName}</strong>
              {item.taskTitle && <p className="text-xs font-semibold text-slate-500">Untuk task: {item.taskTitle}</p>}
            </div>
            <span className="flex items-center gap-1" aria-label={`Rating ${item.score} dari 5`}>
              {Array.from({ length: 5 }, (_, index) => (
                <Star key={index} className={`size-4 ${index < item.score ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />
              ))}
            </span>
          </div>
          {item.review && <p className="mt-3 text-sm leading-6 text-slate-600">{item.review}</p>}
          <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(item.createdAt))}
          </p>
        </article>
      ))}
    </div>
  );
}
