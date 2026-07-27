import { MapPin, ShieldCheck, Star } from "lucide-react";
import Link from "next/link";
import { rupiah } from "@/lib/format";
import type { Provider } from "@/types";

export function ProviderCard({ provider }: { provider: Provider }) {
  return (
    <article className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-orange-300">
      <div className="flex items-start gap-4">
        <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-slate-900 font-bold text-white">{provider.initials}</div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5"><h3 className="truncate font-[var(--font-manrope)] font-extrabold">{provider.name}</h3>{provider.verified && <ShieldCheck className="size-4 shrink-0 text-blue-600" aria-label="Terverifikasi" />}</div>
          <p className="mt-1 truncate text-sm text-slate-500">{provider.title}</p>
        </div>
      </div>
      <div className="mt-5 flex items-center gap-4 border-y border-slate-100 py-3 text-sm">
        <span className="flex items-center gap-1 font-bold text-slate-800"><Star className="size-4 fill-amber-400 text-amber-400" />{provider.rating}</span>
        <span className="text-slate-500">{provider.jobs} pekerjaan</span>
      </div>
      <p className="mt-4 flex items-center gap-2 text-sm text-slate-600"><MapPin className="size-4 text-slate-400" />{provider.location}</p>
      <div className="mt-auto flex items-end justify-between gap-3 pt-5">
        <div><span className="block text-xs text-slate-500">Mulai dari</span><strong className="text-sm text-slate-950">{rupiah(provider.priceFrom)}</strong></div>
        <Link href={`/marketplace?provider=${provider.id}`} className="inline-flex min-h-10 items-center rounded-lg border border-slate-300 px-4 text-sm font-bold transition group-hover:border-orange-600 group-hover:text-orange-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200">Lihat profil</Link>
      </div>
    </article>
  );
}
