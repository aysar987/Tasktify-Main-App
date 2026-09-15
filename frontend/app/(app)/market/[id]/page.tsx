"use client";

import { BriefcaseBusiness, MapPin, MessageCircle, ShieldCheck, ShoppingBag, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { PageHeader, primaryButton, secondaryButton } from "@/components/ui";
import { getMarketplaceListing } from "@/lib/api";
import { rating, rupiah } from "@/lib/format";
import type { MarketplaceListing } from "@/types";

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

  return (
    <>
      <PageHeader eyebrow="Lapak" title={listing.name} description={listing.category} backHref="/market" />
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="relative flex h-[220px] items-center justify-center overflow-hidden bg-gradient-to-br from-sky-300 via-blue-500 to-indigo-800">
              {listing.imageUrl ? (
                <Image unoptimized src={listing.imageUrl} alt="" fill className="object-cover" />
              ) : (
                <BriefcaseBusiness className="size-16 text-white/90" strokeWidth={1.35} />
              )}
              {listing.verified && (
                <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-emerald-600/90 px-3 py-1 text-xs font-bold text-white shadow-sm">
                  <ShieldCheck className="size-3.5" />
                  Terverifikasi
                </span>
              )}
            </div>
            <div className="p-6">
              <div className="flex flex-wrap items-center gap-5 border-b border-slate-100 pb-4 text-sm">
                <span className="flex items-center gap-1 font-bold text-slate-800">
                  <Star className="size-4 fill-amber-400 text-amber-400" />
                  {rating(listing.rating)}
                </span>
                <span className="text-slate-500">{listing.jobs} pekerjaan selesai</span>
                <span className="flex items-center gap-1.5 text-slate-500">
                  <MapPin className="size-4" />
                  {listing.location}
                </span>
              </div>
              <p className="mt-4 leading-7 whitespace-pre-line text-slate-600">{listing.description}</p>
            </div>
          </section>
        </div>
        <aside className="h-fit space-y-4 rounded-2xl border border-orange-200 bg-orange-50 p-6 xl:sticky xl:top-28">
          <div>
            <span className="block text-xs text-slate-500">Mulai dari</span>
            <strong className="text-lg text-slate-950">{rupiah(listing.priceFrom)}</strong>
          </div>
          {listing.providerId ? (
            <div className="space-y-3">
              <Link href={`/request-task?provider=${encodeURIComponent(listing.providerId)}`} className={`${primaryButton} w-full`}>
                <ShoppingBag className="size-4" />
                Pesan Jasa Ini
              </Link>
              <Link href={`/chat?with=${encodeURIComponent(listing.providerId)}`} className={`${secondaryButton} w-full`}>
                <MessageCircle className="size-4" />
                Chat Lapak Ini
              </Link>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Lapak ini belum tertaut ke penyedia. Pemesanan dan chat belum tersedia.</p>
          )}
        </aside>
      </div>
    </>
  );
}
