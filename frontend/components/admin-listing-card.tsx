"use client";

import { BriefcaseBusiness, Check, MapPin, ShieldAlert, ShieldCheck, ShieldQuestion, Star, Trash2, X } from "lucide-react";
import Image from "next/image";
import { FormEvent, useState } from "react";
import { deleteMarketplaceListing, rejectMarketplaceListing, verifyMarketplaceListing } from "@/lib/api";
import { rating, rupiah } from "@/lib/format";
import type { MarketplaceListing } from "@/types";
import { primaryButton, secondaryButton } from "./ui";

const STATUS_META = {
  pending: { icon: ShieldQuestion, label: "Menunggu review", className: "border-amber-200 bg-amber-50 text-amber-800" },
  verified: { icon: ShieldCheck, label: "Terverifikasi", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  rejected: { icon: ShieldAlert, label: "Ditolak", className: "border-red-200 bg-red-50 text-red-700" },
};

export function AdminListingCard({
  listing,
  onUpdated,
  onDeleted,
}: {
  listing: MarketplaceListing;
  onUpdated: (listing: MarketplaceListing) => void;
  onDeleted: (id: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rejecting, setRejecting] = useState(false);

  async function approve() {
    setLoading(true);
    setError("");
    try {
      onUpdated(await verifyMarketplaceListing(listing.id));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Verifikasi gagal.");
    } finally {
      setLoading(false);
    }
  }

  async function reject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const note = String(new FormData(event.currentTarget).get("note") ?? "");
    setLoading(true);
    setError("");
    try {
      onUpdated(await rejectMarketplaceListing(listing.id, note));
      setRejecting(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Penolakan gagal.");
    } finally {
      setLoading(false);
    }
  }

  async function remove() {
    if (!window.confirm(`Hapus lapak "${listing.name}"?`)) return;
    setLoading(true);
    setError("");
    try {
      await deleteMarketplaceListing(listing.id);
      onDeleted(listing.id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Lapak gagal dihapus.");
      setLoading(false);
    }
  }

  const statusMeta = STATUS_META[listing.verificationStatus];
  const StatusIcon = statusMeta.icon;

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="relative flex h-32 items-center justify-center overflow-hidden bg-gradient-to-br from-sky-300 via-blue-500 to-indigo-800">
        {listing.imageUrl ? (
          <Image unoptimized src={listing.imageUrl} alt="" fill className="object-cover" />
        ) : (
          <BriefcaseBusiness className="size-10 text-white/90" strokeWidth={1.35} />
        )}
        <span className={`absolute right-2.5 top-2.5 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${statusMeta.className}`}>
          <StatusIcon className="size-3.5" />
          {statusMeta.label}
        </span>
      </div>
      <div className="p-5">
        <h3 className="font-[var(--font-manrope)] font-extrabold">{listing.name}</h3>
        <p className="text-sm text-slate-500">{listing.category}</p>
        <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-600">
          <span className="flex items-center gap-1 font-bold text-slate-800">
            <Star className="size-4 fill-amber-400 text-amber-400" />
            {rating(listing.rating)}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin className="size-4 text-slate-400" />
            {listing.location}
          </span>
          <span>{rupiah(listing.priceFrom)}</span>
        </div>
        <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{listing.description}</p>
        {!listing.providerId && (
          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            Belum tertaut ke penyedia terverifikasi. Verifikasi akan gagal sampai pemilik menyelesaikan verifikasi KTP.
          </p>
        )}
        {listing.verificationNote && (
          <p className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <strong>Alasan ditolak:</strong> {listing.verificationNote}
          </p>
        )}
        {error && (
          <p role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
            {error}
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-3">
          {listing.verificationStatus !== "verified" && (
            <button type="button" disabled={loading} onClick={approve} className={`${primaryButton} min-h-10 text-sm`}>
              <Check className="size-4" /> Verifikasi
            </button>
          )}
          {listing.verificationStatus !== "rejected" && (
            <button
              type="button"
              disabled={loading}
              onClick={() => setRejecting((prev) => !prev)}
              className={`${secondaryButton} min-h-10 border-red-200 text-sm text-red-700`}
            >
              <X className="size-4" /> Tolak
            </button>
          )}
          <button
            type="button"
            disabled={loading}
            onClick={remove}
            aria-label="Hapus lapak"
            className="grid size-10 shrink-0 place-items-center rounded-xl border border-slate-200 text-red-600 hover:bg-red-50"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
        {rejecting && (
          <form onSubmit={reject} className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <label className="block text-sm font-bold text-slate-700">
              Alasan penolakan (opsional)
              <textarea
                name="note"
                rows={2}
                className="mt-2 w-full rounded-lg border border-slate-300 p-3 text-sm"
                placeholder="Contoh: deskripsi kurang jelas, kategori tidak sesuai..."
              />
            </label>
            <button disabled={loading} className={`${primaryButton} w-full`}>
              Kirim penolakan
            </button>
          </form>
        )}
      </div>
    </article>
  );
}
