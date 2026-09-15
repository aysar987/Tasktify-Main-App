"use client";

import { ArrowLeftRight, ChevronDown, Search, Store } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { getMarketplaceListings } from "@/lib/api";
import type { MarketplaceListing } from "@/types";

const categories = ["Listrik", "Plumbing", "AC", "Pertukangan", "Kebersihan"];
const PAGE_SIZE = 12;

type FeeSort = "default" | "asc" | "desc";
type RelevanceSort = "relevan" | "rating" | "jobs";
type OpenMenu = "fee" | "terkait" | "filter" | null;

export function MarketplaceBrowser({ initialQuery = "" }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [feeSort, setFeeSort] = useState<FeeSort>("default");
  const [relevanceSort, setRelevanceSort] = useState<RelevanceSort>("relevan");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const [openMenu, setOpenMenu] = useState<OpenMenu>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const toolbarRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        setListings(await getMarketplaceListings(query));
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Daftar marketplace gagal dimuat.");
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (toolbarRef.current && !toolbarRef.current.contains(event.target as Node)) setOpenMenu(null);
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = useMemo(() => {
    let result = listings.filter((listing) => {
      const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(listing.category);
      const matchesVerified = !verifiedOnly || listing.verified;
      return matchesCategory && matchesVerified;
    });

    if (relevanceSort === "rating") {
      result = [...result].sort((a, b) => b.rating - a.rating);
    } else if (relevanceSort === "jobs") {
      result = [...result].sort((a, b) => b.jobs - a.jobs);
    }

    if (feeSort === "asc") {
      result = [...result].sort((a, b) => a.priceFrom - b.priceFrom);
    } else if (feeSort === "desc") {
      result = [...result].sort((a, b) => b.priceFrom - a.priceFrom);
    }

    return result;
  }, [listings, selectedCategories, verifiedOnly, relevanceSort, feeSort]);

  const visible = filtered.slice(0, visibleCount);
  const activeFilterCount = selectedCategories.length + (verifiedOnly ? 1 : 0);

  function toggleCategory(item: string) {
    setSelectedCategories((current) =>
      current.includes(item) ? current.filter((c) => c !== item) : [...current, item],
    );
    setVisibleCount(PAGE_SIZE);
  }

  return (
    <div>
      <label className="relative mb-4 block">
        <span className="sr-only">Cari lapak</span>
        <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setVisibleCount(PAGE_SIZE);
          }}
          placeholder="Search..."
          className="min-h-12 w-full rounded-2xl border-0 bg-slate-100 pl-12 pr-4 text-base outline-none placeholder:text-slate-400 focus:ring-4 focus:ring-orange-100"
        />
      </label>

      <div ref={toolbarRef} className="relative mb-5 flex flex-wrap items-center gap-2.5">
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenMenu((current) => (current === "fee" ? null : "fee"))}
            className={`flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full border px-4 text-sm font-bold transition ${
              feeSort !== "default" ? "border-orange-600 bg-orange-50 text-orange-700" : "border-slate-200 bg-slate-100 text-slate-900 hover:border-slate-300"
            }`}
          >
            Fee <ChevronDown className="size-4" />
          </button>
          {openMenu === "fee" && (
            <div className="absolute left-0 top-full z-20 mt-2 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
              {(
                [
                  ["default", "Semua Harga"],
                  ["asc", "Harga Terendah"],
                  ["desc", "Harga Tertinggi"],
                ] as [FeeSort, string][]
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setFeeSort(value);
                    setOpenMenu(null);
                    setVisibleCount(PAGE_SIZE);
                  }}
                  className={`flex w-full cursor-pointer items-center px-4 py-2.5 text-left text-sm font-semibold transition hover:bg-slate-50 ${feeSort === value ? "text-orange-700" : "text-slate-700"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenMenu((current) => (current === "terkait" ? null : "terkait"))}
            className={`flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full border px-4 text-sm font-bold transition ${
              relevanceSort !== "relevan" ? "border-orange-600 bg-orange-50 text-orange-700" : "border-slate-200 bg-slate-100 text-slate-900 hover:border-slate-300"
            }`}
          >
            Terkait <ChevronDown className="size-4" />
          </button>
          {openMenu === "terkait" && (
            <div className="absolute left-0 top-full z-20 mt-2 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
              {(
                [
                  ["relevan", "Paling Relevan"],
                  ["rating", "Rating Tertinggi"],
                  ["jobs", "Tugas Terbanyak"],
                ] as [RelevanceSort, string][]
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setRelevanceSort(value);
                    setOpenMenu(null);
                    setVisibleCount(PAGE_SIZE);
                  }}
                  className={`flex w-full cursor-pointer items-center px-4 py-2.5 text-left text-sm font-semibold transition hover:bg-slate-50 ${relevanceSort === value ? "text-orange-700" : "text-slate-700"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenMenu((current) => (current === "filter" ? null : "filter"))}
            className={`flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full border px-4 text-sm font-bold transition ${
              activeFilterCount > 0 ? "border-orange-600 bg-orange-50 text-orange-700" : "border-slate-200 bg-slate-100 text-slate-900 hover:border-slate-300"
            }`}
          >
            Filter <ArrowLeftRight className="size-4 rotate-90" />
            {activeFilterCount > 0 && (
              <span className="grid size-4 place-items-center rounded-full bg-orange-600 text-[10px] font-bold text-white">{activeFilterCount}</span>
            )}
          </button>
          {openMenu === "filter" && (
            <div className="absolute right-0 top-full z-20 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-4 shadow-lg">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Kategori</p>
              <div className="flex flex-col gap-2">
                {categories.map((item) => (
                  <label key={item} className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(item)}
                      onChange={() => toggleCategory(item)}
                      className="size-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                    />
                    {item}
                  </label>
                ))}
              </div>
              <label className="mt-3 flex cursor-pointer items-center gap-2 border-t border-slate-100 pt-3 text-sm font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={verifiedOnly}
                  onChange={(event) => {
                    setVerifiedOnly(event.target.checked);
                    setVisibleCount(PAGE_SIZE);
                  }}
                  className="size-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                />
                Hanya Terverifikasi
              </label>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategories([]);
                    setVerifiedOnly(false);
                    setVisibleCount(PAGE_SIZE);
                  }}
                  className="mt-3 w-full cursor-pointer text-center text-sm font-bold text-orange-700 hover:underline"
                >
                  Reset filter
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <p className="mb-4 text-sm text-slate-500">
        {loading
          ? "Memuat marketplace..."
          : query.trim()
            ? `Menampilkan ${visible.length} jasa dari total ${filtered.length} untuk "${query.trim()}"`
            : `Menampilkan ${visible.length} jasa dari total ${filtered.length}`}
      </p>

      {error && (
        <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {visible.map((listing) => (
          <article
            key={listing.id}
            className="group flex flex-col overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-lg"
          >
            <div className="relative flex h-[130px] items-center justify-center overflow-hidden bg-gradient-to-br from-sky-300 via-blue-500 to-indigo-800">
              {listing.imageUrl ? (
                <Image unoptimized src={listing.imageUrl} alt="" fill className="object-cover" />
              ) : (
                <>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.34),transparent_36%)]" />
                  <Store className="relative size-9 text-white/90 transition duration-300 group-hover:scale-110" strokeWidth={1.35} />
                </>
              )}
            </div>
            <div className="p-3">
              <h3 className="truncate text-sm font-extrabold text-slate-950">{listing.name}</h3>
              <p className="mt-1 truncate text-xs text-slate-500">{listing.category}</p>
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

      {!loading && filtered.length > visible.length && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
            className="min-h-11 cursor-pointer rounded-xl border border-slate-300 bg-white px-6 text-sm font-bold text-slate-700 transition hover:border-orange-400 hover:text-orange-700"
          >
            Muat lebih banyak
          </button>
        </div>
      )}
    </div>
  );
}
