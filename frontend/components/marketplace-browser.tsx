"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import { getProviders } from "@/lib/api";
import { categories } from "@/lib/mock-data";
import type { Provider } from "@/types";
import { ProviderCard } from "./provider-card";

export function MarketplaceBrowser() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Semua");
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        setProviders(await getProviders(query, category));
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Marketplace gagal dimuat.");
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [category, query]);
  return (
    <>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5">
        <div className="flex flex-col gap-3 md:flex-row">
          <label className="relative flex-1"><span className="sr-only">Cari penyedia</span><Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari nama, layanan, atau kota..." className="min-h-12 w-full rounded-xl border border-slate-300 pl-12 pr-4 outline-none focus:border-orange-600 focus:ring-4 focus:ring-orange-100" /></label>
          <button type="button" className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 font-bold hover:bg-slate-50"><SlidersHorizontal className="size-5" /> Filter lainnya</button>
        </div>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">{categories.map((item) => <button key={item} type="button" onClick={() => setCategory(item)} className={`min-h-10 shrink-0 cursor-pointer rounded-full border px-4 text-sm font-bold transition ${category === item ? "border-orange-600 bg-orange-600 text-white" : "border-slate-300 bg-white text-slate-600 hover:border-orange-400"}`}>{item}</button>)}</div>
      </div>
      <div className="mb-5 mt-7 flex items-center justify-between"><p className="font-bold text-slate-700">{loading ? "Memuat penyedia..." : `${providers.length} penyedia ditemukan`}</p><select aria-label="Urutkan penyedia" className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold"><option>Rating tertinggi</option><option>Harga terendah</option><option>Pekerjaan terbanyak</option></select></div>
      {error && <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{providers.map((provider) => <ProviderCard key={provider.id} provider={provider} />)}</div>
    </>
  );
}
