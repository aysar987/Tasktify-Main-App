import { BriefcaseBusiness, MapPin, Star } from "lucide-react";
import Image from "next/image";
import { rating, rupiah } from "@/lib/format";
import type { MarketplaceListing } from "@/types";

export function MarketplaceListingCard({ listing }: { listing: MarketplaceListing }) {
  return (
    <div className="group block h-full overflow-hidden rounded-[24px] border border-blue-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:border-blue-400 hover:shadow-lg">
      <div className="relative flex h-[150px] items-center justify-center overflow-hidden bg-gradient-to-br from-sky-300 via-blue-500 to-indigo-800">
        {listing.imageUrl ? (
          <Image unoptimized src={listing.imageUrl} alt="" fill className="object-cover" />
        ) : (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.34),transparent_36%)]" />
            <BriefcaseBusiness className="relative size-16 text-white/90 transition duration-300 group-hover:scale-110" strokeWidth={1.35} />
          </>
        )}
      </div>
      <div className="flex flex-col p-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="truncate font-[var(--font-manrope)] text-lg font-extrabold text-slate-950 group-hover:text-blue-700">
            {listing.name}
          </h3>
          <span className="flex shrink-0 items-center gap-1 text-sm font-bold text-slate-800"><Star className="size-4 fill-amber-400 text-amber-400" />{rating(listing.rating)}</span>
        </div>
        <p className="truncate text-sm text-slate-500">{listing.category}</p>
        <div className="mt-2 flex items-end justify-between gap-3 border-t border-slate-100 pt-2">
          <div>
            <span className="block text-xs text-slate-500">Mulai dari</span>
            <strong className="text-base font-extrabold text-slate-950">{rupiah(listing.priceFrom)}</strong>
          </div>
          <span className="flex items-center gap-1 text-xs text-slate-500"><MapPin className="size-3.5" />{listing.location}</span>
        </div>
      </div>
    </div>
  );
}
