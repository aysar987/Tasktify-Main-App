"use client";

import { ArrowLeft, MapPin, Plus, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getMarketplaceListing } from "@/lib/api";
import { rating, rupiah } from "@/lib/format";
import type { MarketplaceListing } from "@/types";

const serviceUnitLabels: Record<string, string> = {
  per_pasangan: "per pasang",
  per_item: "per item",
  per_jam: "per jam",
  per_meter: "per meter",
  per_kg: "per kg",
  per_unit: "per unit",
  sekali_datang: "sekali datang",
};

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

  const services = listing.services?.filter((service) => service.isActive) ?? [];

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
          {listing.fullAddress && <p className="mt-3 text-sm leading-6 text-slate-600">{listing.fullAddress}</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            {listing.serviceTypes.map((type) => (
              <span key={type} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">
                {type === "buyer_location" ? "Pembeli datang ke lokasi" : type === "provider_travel" ? "Penjual datang ke pembeli" : "Antar-jemput"}
              </span>
            ))}
          </div>
          <Link
            href={`/chat?listing=${encodeURIComponent(listing.id)}`}
            className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#42B2FF] px-5 font-bold text-white transition hover:bg-[#2f9eef]"
          >
            Start Conversation
          </Link>
          {listing.whatsapp && (
            <a href={`https://wa.me/${listing.whatsapp}`} target="_blank" rel="noreferrer" className="ml-2 mt-5 inline-flex min-h-12 items-center rounded-xl border border-emerald-300 px-5 font-bold text-emerald-800">
              Hubungi via WhatsApp
            </a>
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
                {service.duration && <p className="mt-1 text-xs text-slate-500">Estimasi: {service.duration}</p>}
              </div>
              <div className="shrink-0 text-right">
                <strong className="block text-sm text-slate-950">{rupiah(service.price)}</strong>
                <span className="text-xs text-slate-500">{serviceUnitLabels[service.unit] ?? service.unit}</span>
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
          {services.length === 0 && <p className="rounded-2xl bg-white p-5 text-sm text-slate-500">Detail jenis jasa belum tersedia.</p>}
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-[24px] bg-white p-6 shadow-sm">
            <h2 className="font-[var(--font-manrope)] text-lg font-extrabold text-slate-950">Jam operasional</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {Object.entries(listing.operatingHours).map(([day, hours]) => (
                <li key={day} className="flex justify-between gap-3">
                  <span>{({ monday: "Senin", tuesday: "Selasa", wednesday: "Rabu", thursday: "Kamis", friday: "Jumat", saturday: "Sabtu", sunday: "Minggu" } as Record<string, string>)[day] ?? day}</span>
                  <span>{hours.isOpen ? `${hours.openTime}–${hours.closeTime}` : "Tutup"}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-4">
            {listing.termsWarranty && (
              <div className="rounded-[24px] bg-white p-6 shadow-sm">
                <h2 className="font-[var(--font-manrope)] text-lg font-extrabold text-slate-950">Syarat &amp; garansi</h2>
                <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">{listing.termsWarranty}</p>
              </div>
            )}
            {(listing.instagramUrl || listing.tiktokUrl) && (
              <div className="rounded-[24px] bg-white p-6 shadow-sm">
                <h2 className="font-[var(--font-manrope)] text-lg font-extrabold text-slate-950">Media sosial</h2>
                <div className="mt-3 flex flex-wrap gap-4 text-sm font-semibold text-blue-700">
                  {listing.instagramUrl && <a href={listing.instagramUrl} target="_blank" rel="noreferrer">Instagram</a>}
                  {listing.tiktokUrl && <a href={listing.tiktokUrl} target="_blank" rel="noreferrer">TikTok</a>}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
