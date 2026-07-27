"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { categories, providers } from "@/lib/mock-data";
import { ProviderCard } from "./provider-card";

export function MarketplaceBrowser() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Semua");
  const filtered = useMemo(() => providers.filter((provider) => (category === "Semua" || provider.category === category) && `${provider.name} ${provider.title} ${provider.location}`.toLowerCase().includes(query.toLowerCase())), [category, query]);
  return (
    <>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5">
        <div className="flex flex-col gap-3 md:flex-row">
          <label className="relative flex-1"><span className="sr-only">Cari penyedia</span><Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari nama, layanan, atau kota..." className="min-h-12 w-full rounded-xl border border-slate-300 pl-12 pr-4 outline-none focus:border-orange-600 focus:ring-4 focus:ring-orange-100" /></label>
          <button type="button" className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 font-bold hover:bg-slate-50"><SlidersHorizontal className="size-5" /> Filter lainnya</button>
        </div>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">{categories.map((item) => <button key={item} type="button" onClick={() => setCategory(item)} className={`min-h-10 shrink-0 cursor-pointer rounded-full border px-4 text-sm font-bold transition ${category === item ? "border-orange-600 bg-orange-600 text-white" : "border-slate-300 bg-white text-slate-600 hover:border-orange-400"}`}>{item}</button>)}</div>
      </div>
      <div className="mb-5 mt-7 flex items-center justify-between"><p className="font-bold text-slate-700">{filtered.length} penyedia ditemukan</p><select aria-label="Urutkan penyedia" className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold"><option>Rating tertinggi</option><option>Harga terendah</option><option>Pekerjaan terbanyak</option></select></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{filtered.map((provider) => <ProviderCard key={provider.id} provider={provider} />)}</div>
    </>
  );
}
