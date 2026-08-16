"use client";

import { Check, MapPin, ShieldAlert, ShieldCheck, ShieldQuestion, X } from "lucide-react";
import { FormEvent, useState } from "react";
import { rejectProvider, verifyProvider } from "@/lib/api";
import type { Provider } from "@/types";
import { primaryButton, secondaryButton } from "./ui";

const STATUS_META = {
  pending: { icon: ShieldQuestion, label: "Menunggu review", className: "border-amber-200 bg-amber-50 text-amber-800" },
  verified: { icon: ShieldCheck, label: "Terverifikasi", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  rejected: { icon: ShieldAlert, label: "Ditolak", className: "border-red-200 bg-red-50 text-red-700" },
};

export function AdminProviderCard({
  provider,
  onUpdated,
}: {
  provider: Provider;
  onUpdated: (provider: Provider) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rejecting, setRejecting] = useState(false);

  async function approve() {
    setLoading(true);
    setError("");
    try {
      onUpdated(await verifyProvider(provider.id));
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
      onUpdated(await rejectProvider(provider.id, note));
      setRejecting(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Penolakan gagal.");
    } finally {
      setLoading(false);
    }
  }

  const statusMeta = STATUS_META[provider.verificationStatus];
  const StatusIcon = statusMeta.icon;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-slate-900 font-bold text-white">{provider.initials}</span>
          <div>
            <h3 className="font-[var(--font-manrope)] font-extrabold">{provider.name}</h3>
            <p className="text-sm text-slate-500">{provider.title} · {provider.category}</p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${statusMeta.className}`}>
          <StatusIcon className="size-3.5" />
          {statusMeta.label}
        </span>
      </div>
      <p className="mt-3 flex items-center gap-2 text-sm text-slate-600">
        <MapPin className="size-4 text-slate-400" />
        {provider.location}
      </p>
      {provider.bio && <p className="mt-3 text-sm leading-6 text-slate-600">{provider.bio}</p>}
      {provider.verificationNote && (
        <p className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <strong>Alasan ditolak:</strong> {provider.verificationNote}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
          {error}
        </p>
      )}
      {provider.verificationStatus !== "verified" && (
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" disabled={loading} onClick={approve} className={primaryButton}>
            <Check className="size-5" /> Verifikasi
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => setRejecting((prev) => !prev)}
            className={`${secondaryButton} border-red-200 text-red-700`}
          >
            <X className="size-5" /> Tolak
          </button>
        </div>
      )}
      {rejecting && (
        <form onSubmit={reject} className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <label className="block text-sm font-bold text-slate-700">
            Alasan penolakan (opsional)
            <textarea
              name="note"
              rows={2}
              className="mt-2 w-full rounded-lg border border-slate-300 p-3 text-sm"
              placeholder="Contoh: foto profil tidak jelas, data tidak lengkap..."
            />
          </label>
          <button disabled={loading} className={`${primaryButton} w-full`}>
            Kirim penolakan
          </button>
        </form>
      )}
    </article>
  );
}
