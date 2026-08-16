"use client";

import { Search, Store } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getProviders } from "@/lib/api";
import type { Provider } from "@/types";
import { ProviderCard } from "./provider-card";

const categories = ["Semua", "Listrik", "Plumbing", "AC", "Pertukangan", "Kebersihan"];

export function ProviderBrowser({ initialQuery = "" }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
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
        setError(cause instanceof Error ? cause.message : "Direktori penyedia gagal dimuat.");
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [category, query]);
  return (
    <>
      <div className="mb-5 flex justify-end">
        <Link href="/AddMarket" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-orange-600 px-4 text-sm font-bold text-white transition hover:bg-orange-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200">Ajukan lapakmu di marketplace</Link>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5">
        <div className="flex flex-col gap-3 md:flex-row">
          <label className="relative flex-1"><span className="sr-only">Cari penyedia</span><Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari nama, layanan, atau kota..." className="min-h-12 w-full rounded-xl border border-slate-300 pl-12 pr-4 outline-none focus:border-orange-600 focus:ring-4 focus:ring-orange-100" /></label>
        </div>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">{categories.map((item) => <button key={item} type="button" onClick={() => setCategory(item)} className={`min-h-10 shrink-0 cursor-pointer rounded-full border px-4 text-sm font-bold transition ${category === item ? "border-orange-600 bg-orange-600 text-white" : "border-slate-300 bg-white text-slate-600 hover:border-orange-400"}`}>{item}</button>)}</div>
      </div>
      <div className="mb-5 mt-7 flex items-center justify-between"><p className="font-bold text-slate-700">{loading ? "Memuat penyedia..." : `${providers.length} penyedia ditemukan`}</p></div>
      {error && <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{providers.map((provider) => <ProviderCard key={provider.id} provider={provider} />)}</div>
      {!loading && !error && providers.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center"><Store className="mx-auto size-9 text-slate-400" /><h2 className="mt-4 font-[var(--font-manrope)] text-xl font-extrabold">Belum ada penyedia yang cocok</h2><p className="mt-2 text-slate-500">Ubah kata pencarian atau pilih kategori lain.</p></div>}
    </>
  );
}
