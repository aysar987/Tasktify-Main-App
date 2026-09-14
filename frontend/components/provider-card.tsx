import { BriefcaseBusiness, MapPin, Star } from "lucide-react";
import Link from "next/link";
import { rating, rupiah } from "@/lib/format";
import type { Provider } from "@/types";

export function ProviderCard({ provider }: { provider: Provider }) {
  return (
    <Link
      href={`/market/${provider.id}`}
      className="group block h-full overflow-hidden rounded-[24px] border border-blue-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:border-blue-400 hover:shadow-lg active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"
    >
      <div className="relative flex aspect-[1.55] items-center justify-center overflow-hidden bg-gradient-to-br from-sky-300 via-blue-500 to-indigo-800">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.34),transparent_36%)]" />
        <BriefcaseBusiness className="relative size-16 text-white/90 transition duration-300 group-hover:scale-110" strokeWidth={1.35} />
        <span className="absolute bottom-4 left-4 rounded-full bg-white/90 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-blue-800">
          {provider.category}
        </span>
      </div>
      <div className="flex min-h-[164px] flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-[var(--font-manrope)] text-lg font-extrabold text-slate-950 group-hover:text-blue-700">
              {provider.name}
            </h3>
            <p className="mt-1 truncate text-sm text-slate-500">{provider.title}</p>
          </div>
          {provider.verified && <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">Terverifikasi</span>}
        </div>
        <div className="mt-auto flex items-end justify-between gap-3 border-t border-slate-100 pt-4">
          <div>
            <span className="block text-xs text-slate-500">Mulai dari</span>
            <strong className="text-base font-extrabold text-slate-950">{rupiah(provider.priceFrom)}</strong>
          </div>
          <div className="text-right text-xs text-slate-500">
            <span className="flex items-center justify-end gap-1 font-bold text-slate-800"><Star className="size-4 fill-amber-400 text-amber-400" />{rating(provider.rating)}</span>
            <span className="mt-1 flex items-center justify-end gap-1"><MapPin className="size-3.5" />{provider.location}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
