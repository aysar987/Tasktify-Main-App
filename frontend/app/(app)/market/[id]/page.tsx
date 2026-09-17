"use client";

import { ArrowLeft, MapPin, Plus, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getMarketplaceListing } from "@/lib/api";
import { rating } from "@/lib/format";
import type { MarketplaceListing } from "@/types";

const fallbackServices = [{ name: "Jasa umum", description: "Ajukan permintaan langsung ke lapak ini." }];

export default function MarketplaceListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [listing, setListing] = useState<MarketplaceListing>();
  const [error, setError] = useState("");

  useEffect(() => {
    getMarketplaceListing(id)
      .then(setListing)
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Lapak gagal dimuat."));
  }, [id]);

  if (error)
    return (
      <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 font-semibold text-red-700">
        {error}
      </div>
    );
  if (!listing) return <p className="py-16 text-center text-slate-500">Memuat lapak...</p>;

  const services = listing.services?.length ? listing.services : fallbackServices;

  return (
    <div className="-mx-4 -mb-7 -mt-7 sm:-mx-6 lg:-mx-10 lg:-mb-10 lg:-mt-10">
      <div className="relative flex h-[300px] items-end overflow-hidden bg-gradient-to-br from-sky-300 via-blue-500 to-indigo-900 sm:h-[360px]">
        {listing.imageUrl && <Image unoptimized src={listing.imageUrl} alt="" fill className="object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/5 to-transparent" />
        <Link
          href="/market"
          aria-label="Kembali ke market"
          className="absolute left-4 top-4 grid size-11 place-items-center rounded-full bg-white/90 text-slate-900 shadow-sm transition hover:bg-white sm:left-6 sm:top-6"
        >
          <ArrowLeft className="size-5" />
        </Link>
      </div>

      <div className="relative z-10 -mt-10 space-y-4 px-4 pb-10 sm:px-6 lg:px-10">
        <section className="rounded-[24px] bg-white p-6 shadow-xl shadow-slate-950/10">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="truncate font-[var(--font-manrope)] text-2xl font-extrabold text-slate-950">{listing.name}</h1>
              <p className="mt-1 text-slate-500">{listing.category}</p>
            </div>
            <span className="flex shrink-0 items-center gap-1 pt-1 font-bold text-slate-800">
              <Star className="size-5 fill-amber-400 text-amber-400" />
              {rating(listing.rating)}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-500">
            <span className="flex items-center gap-1.5">
              <MapPin className="size-4" />
              {listing.location}
            </span>
          </div>
          {listing.providerId ? (
            <Link
              href={`/chat?with=${encodeURIComponent(listing.providerId)}`}
              className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#42B2FF] px-5 font-bold text-white transition hover:bg-[#2f9eef]"
            >
              Start Conversation
            </Link>
          ) : (
            <p className="mt-5 text-sm text-slate-500">Lapak ini belum tertaut ke penyedia. Pemesanan dan chat belum tersedia.</p>
          )}
        </section>

        <section className="rounded-[24px] bg-white p-6 shadow-sm">
          <h2 className="font-[var(--font-manrope)] text-xl font-extrabold text-slate-950">Deskripsi Layanan</h2>
          <p className="mt-4 whitespace-pre-line leading-7 text-slate-600">{listing.description}</p>
        </section>

        <section className="space-y-3">
          <h2 className="px-1 font-[var(--font-manrope)] text-xl font-extrabold text-slate-950">Jenis Jasa</h2>
          {services.map((service, index) => (
            <div key={index} className="flex items-center justify-between gap-3 rounded-[24px] bg-white p-5 shadow-sm">
              <div className="min-w-0">
                <h3 className="truncate font-bold text-slate-950">{service.name}</h3>
                {service.description && <p className="mt-0.5 truncate text-sm text-slate-500">{service.description}</p>}
              </div>
              {listing.providerId && (
                <Link
                  href={`/request-task?provider=${encodeURIComponent(listing.providerId)}`}
                  aria-label={`Pesan ${service.name}`}
                  className="grid size-9 shrink-0 place-items-center rounded-full bg-blue-500 text-white transition hover:bg-blue-600"
                >
                  <Plus className="size-5" />
                </Link>
              )}
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
