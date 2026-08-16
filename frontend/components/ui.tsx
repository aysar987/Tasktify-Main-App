import { ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export const inputClass = "mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-orange-600 focus:ring-4 focus:ring-orange-100";
export const primaryButton = "inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 font-bold text-white transition hover:bg-orange-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 disabled:cursor-not-allowed disabled:opacity-50";
export const secondaryButton = "inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 font-bold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200";

export function PageHeader({ eyebrow, title, description, action, backHref }: { eyebrow?: string; title: string; description?: string; action?: ReactNode; backHref?: string }) {
  return (
    <div className="mb-8 flex flex-col gap-5 border-b border-slate-200 pb-7 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex items-start gap-4">
        {backHref && <Link href={backHref} aria-label="Kembali" className="grid size-11 shrink-0 place-items-center rounded-xl border border-slate-300 bg-white transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200"><ArrowLeft className="size-5" /></Link>}
        <div>
          {eyebrow && <p className="mb-2 text-sm font-bold uppercase tracking-[.16em] text-orange-700">{eyebrow}</p>}
          <h1 className="font-[var(--font-manrope)] text-3xl font-extrabold tracking-tight text-slate-950 md:text-4xl">{title}</h1>
          {description && <p className="mt-2 max-w-2xl text-base leading-7 text-slate-600">{description}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    awaiting_payment: "bg-orange-50 text-orange-700 border-orange-200",
    ongoing: "bg-blue-50 text-blue-700 border-blue-200",
    scheduled: "bg-violet-50 text-violet-700 border-violet-200",
    history: "bg-emerald-50 text-emerald-700 border-emerald-200",
    waiting: "bg-amber-50 text-amber-800 border-amber-200",
    cancelled: "bg-red-50 text-red-700 border-red-200",
    rejected: "bg-red-50 text-red-700 border-red-200",
  };
  const labels: Record<string, string> = { awaiting_payment: "Menunggu pembayaran", ongoing: "Sedang berjalan", scheduled: "Terjadwal", history: "Selesai", waiting: "Menunggu", cancelled: "Dibatalkan", rejected: "Ditolak" };
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${styles[status] ?? styles.waiting}`}><CheckCircle2 className="size-3.5" />{labels[status] ?? status}</span>;
}
