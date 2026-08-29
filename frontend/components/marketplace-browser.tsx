"use client";

import { MapPin, Search, ShieldCheck, Star, Store } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getMarketplaceListings } from "@/lib/api";
import type { MarketplaceListing } from "@/types";

const categories = ["Semua", "Listrik", "Plumbing", "AC", "Pertukangan", "Kebersihan"];

export function MarketplaceBrowser({ initialQuery = "" }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState("Semua");
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        setListings(await getMarketplaceListings(query, category));
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Daftar marketplace gagal dimuat.");
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => window.clearTimeout(timer);
  }, [category, query]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return listings.filter((listing) => {
      const matchesCategory = category === "Semua" || listing.category === category;
      const matchesQuery =
        !q ||
        listing.name.toLowerCase().includes(q) ||
        listing.category.toLowerCase().includes(q) ||
        listing.location.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [category, listings, query]);

  return (
    <>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5">
        <div className="flex flex-col gap-3 md:flex-row">
          <label className="relative flex-1">
            <span className="sr-only">Cari marketplace</span>
            <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari lapak, kategori, atau kota..."
              className="min-h-12 w-full rounded-xl border border-slate-300 pl-12 pr-4 outline-none focus:border-orange-600 focus:ring-4 focus:ring-orange-100"
            />
          </label>
        </div>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              className={`min-h-10 shrink-0 cursor-pointer rounded-full border px-4 text-sm font-bold transition ${
                category === item
                  ? "border-orange-600 bg-orange-600 text-white"
                  : "border-slate-300 bg-white text-slate-600 hover:border-orange-400"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-5 mt-7 flex items-center justify-between">
        <p className="font-bold text-slate-700">
          {loading ? "Memuat marketplace..." : `${filtered.length} lapak ditemukan`}
        </p>
      </div>

      {error && (
        <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((listing) => (
          <article
            key={listing.id}
            className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:border-orange-300"
          >
            <div className="flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-orange-500 to-amber-400">
              <Store className="size-10 text-white/95" />
            </div>
            <div className="flex flex-1 flex-col p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{listing.category}</span>
                  <h3 className="mt-1 font-[var(--font-manrope)] text-lg font-extrabold text-slate-950">
                    {listing.name}
                  </h3>
                </div>
                {listing.verified && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">
                    <ShieldCheck className="size-3" /> Verifikasi
                  </span>
                )}
              </div>

              <div className="mt-3 space-y-2 text-sm text-slate-500">
                <span className="flex items-center gap-2">
                  <MapPin className="size-4 shrink-0" />
                  <span>{listing.location}</span>
                </span>
                <span className="flex items-center gap-2">
                  <Star className="size-4 shrink-0 fill-yellow-400 text-yellow-400" />
                  <span>
                    {listing.rating.toFixed(1)} · {listing.jobs} tugas selesai
                  </span>
                </span>
              </div>

              <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{listing.description}</p>

              <div className="mt-auto pt-4">
                <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Mulai dari</div>
                    <strong className="text-base text-slate-950">
                      Rp{listing.priceFrom.toLocaleString("id-ID")}
                    </strong>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase text-slate-600">
                    {listing.status}
                  </span>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {!loading && !error && filtered.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <Store className="mx-auto size-9 text-slate-400" />
          <h2 className="mt-4 font-[var(--font-manrope)] text-xl font-extrabold">Belum ada lapak yang cocok</h2>
          <p className="mt-2 text-slate-500">Coba ubah kata pencarian atau pilih kategori lain.</p>
        </div>
      )}
    </>
  );
}
