"use client";

import { MapPin, ShieldCheck, Star } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ProviderReviews } from "@/components/provider-reviews";
import { PageHeader, primaryButton } from "@/components/ui";
import { getProvider, getProviderRatings } from "@/lib/api";
import { rupiah } from "@/lib/format";
import type { Provider, Rating } from "@/types";

export default function ProviderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [provider, setProvider] = useState<Provider>();
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getProvider(id), getProviderRatings(id)])
      .then(([nextProvider, nextRatings]) => {
        setProvider(nextProvider);
        setRatings(nextRatings);
      })
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Profil penyedia gagal dimuat."));
  }, [id]);

  if (error)
    return (
      <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 font-semibold text-red-700">
        {error}
      </div>
    );
  if (!provider) return <p className="py-16 text-center text-slate-500">Memuat profil penyedia...</p>;

  return (
    <>
      <PageHeader eyebrow="Penyedia" title={provider.name} description={provider.title} backHref="/penyedia" />
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-center gap-4">
              <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-slate-900 text-xl font-bold text-white">{provider.initials}</span>
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="font-[var(--font-manrope)] text-xl font-extrabold">{provider.name}</h2>
                  {provider.verified && <ShieldCheck className="size-5 text-blue-600" aria-label="Terverifikasi" />}
                </div>
                <p className="mt-1 text-slate-500">{provider.title}</p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-5 border-y border-slate-100 py-4 text-sm">
              <span className="flex items-center gap-1 font-bold text-slate-800">
                <Star className="size-4 fill-amber-400 text-amber-400" />
                {provider.rating.toFixed(1)}
              </span>
              <span className="text-slate-500">{provider.jobs} pekerjaan selesai</span>
              <span className="flex items-center gap-1.5 text-slate-500">
                <MapPin className="size-4" />
                {provider.location}
              </span>
            </div>
            {provider.bio && <p className="mt-4 leading-7 text-slate-600">{provider.bio}</p>}
          </section>
          <section>
            <h2 className="mb-4 font-[var(--font-manrope)] text-xl font-extrabold">Ulasan ({ratings.length})</h2>
            <ProviderReviews ratings={ratings} />
          </section>
        </div>
        <aside className="h-fit space-y-4 rounded-2xl border border-orange-200 bg-orange-50 p-6 xl:sticky xl:top-28">
          <div>
            <span className="block text-xs text-slate-500">Mulai dari</span>
            <strong className="text-lg text-slate-950">{rupiah(provider.priceFrom)}</strong>
          </div>
          <Link href={`/request-task?provider=${provider.id}`} className={`${primaryButton} w-full`}>
            Pilih penyedia ini
          </Link>
        </aside>
      </div>
    </>
  );
}
