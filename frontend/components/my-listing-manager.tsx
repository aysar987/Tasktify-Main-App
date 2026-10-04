"use client";

import { CheckCircle2, ImagePlus, LoaderCircle, Plus, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { getMyMarketplaceListing, saveMarketplaceListing } from "@/lib/api";
import type { MarketplaceListing, MarketplaceListingService } from "@/types";
import { PageHeader, inputClass, primaryButton } from "./ui";

const categories = ["Listrik", "Plumbing", "AC", "Pertukangan", "Kebersihan", "Lainnya"];
const emptyService: MarketplaceListingService = { name: "", description: "" };

export function MyListingManager() {
  const [listing, setListing] = useState<MarketplaceListing | null>(null);
  const [services, setServices] = useState<MarketplaceListingService[]>([{ ...emptyService }]);
  const [image, setImage] = useState<File>();
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    getMyMarketplaceListing()
      .then((current) => {
        if (!active || !current) return;
        setListing(current);
        setServices(current.services?.length ? current.services : [{ ...emptyService }]);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "Lapak gagal dimuat.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  function updateService(index: number, field: keyof MarketplaceListingService, value: string) {
    setServices((current) => current.map((service, itemIndex) => itemIndex === index ? { ...service, [field]: value } : service));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const saved = await saveMarketplaceListing({
        name: String(form.get("name")),
        category: String(form.get("category")),
        location: String(form.get("location")),
        description: String(form.get("description")),
        priceFrom: Number(form.get("priceFrom")),
        image,
        services: services.filter((service) => service.name.trim()).map((service) => ({
          name: service.name.trim(), description: service.description.trim(),
        })),
      });
      setListing(saved);
      setServices(saved.services?.length ? saved.services : [{ ...emptyService }]);
      setImage(undefined);
      setImagePreview("");
      setMessage("Perubahan lapak tersimpan. Lapak menunggu verifikasi ulang sebelum ditampilkan di marketplace.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Perubahan lapak gagal disimpan.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader eyebrow="Akun penyedia" title="Kelola lapak" description="Perbarui informasi, harga, foto, dan jenis jasa yang tampil di marketplace." action={<Link href="/market" className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700">Lihat marketplace</Link>} />
      {loading ? <p className="py-16 text-center text-slate-500">Memuat lapak...</p> : error && !listing ? (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p>
      ) : (
        <form onSubmit={submit} className="max-w-4xl space-y-6 rounded-2xl border border-slate-200 bg-white p-5 md:p-7">
          {listing ? <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            Status lapak: <strong>{listing.verificationStatus === "verified" ? "Terverifikasi" : listing.verificationStatus === "rejected" ? "Perlu diperbaiki" : "Menunggu verifikasi"}</strong>. Menyimpan perubahan akan meminta verifikasi admin kembali.
            {listing.verificationNote && <p className="mt-1">Catatan admin: {listing.verificationNote}</p>}
          </div> : <p className="rounded-xl bg-blue-50 p-4 text-sm leading-6 text-blue-900">Anda belum memiliki lapak. Isi formulir ini untuk mengajukan lapak baru; lapak akan diperiksa admin sebelum dipublikasikan.</p>}
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Nama lapak" name="name" defaultValue={listing?.name} placeholder="Contoh: Budi Plumbing" />
            <label className="block text-sm font-bold text-slate-700">Kategori
              <select name="category" required defaultValue={listing?.category ?? ""} className={inputClass}>
                <option value="" disabled>Pilih kategori</option>{categories.map((category) => <option key={category}>{category}</option>)}
              </select>
            </label>
            <Field label="Kota atau area layanan" name="location" defaultValue={listing?.location} placeholder="Contoh: Jakarta Selatan" />
            <Field label="Harga mulai dari" name="priceFrom" type="number" min="0" defaultValue={listing?.priceFrom} placeholder="150000" />
          </div>
          <label className="block text-sm font-bold text-slate-700">Deskripsi layanan
            <textarea name="description" required minLength={20} maxLength={1000} rows={5} defaultValue={listing?.description ?? ""} placeholder="Jelaskan layanan dan area yang Anda layani..." className={`${inputClass} py-3`} />
          </label>
          <div>
            <p className="text-sm font-bold text-slate-700">Foto lapak</p>
            <div className="mt-2 flex flex-wrap items-center gap-4">
              <span className="relative flex h-24 w-36 items-center justify-center overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50">
                {imagePreview || listing?.imageUrl ? <Image unoptimized src={imagePreview || listing?.imageUrl || ""} alt="Pratinjau foto lapak" fill className="object-cover" /> : <ImagePlus className="size-6 text-slate-400" />}
              </span>
              <label className="relative inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700">
                Pilih foto<input type="file" accept="image/png,image/jpeg,image/webp" className="absolute inset-0 cursor-pointer opacity-0" onChange={(event) => {
                  const file = event.target.files?.[0];
                  setImage(file);
                  if (imagePreview) URL.revokeObjectURL(imagePreview);
                  setImagePreview(file ? URL.createObjectURL(file) : "");
                }} />
              </label>
              <span className="text-xs text-slate-500">JPG, PNG, atau WebP, maksimal 5 MB. Kosongkan untuk mempertahankan foto saat ini.</span>
            </div>
          </div>
          <div className="border-t border-slate-200 pt-5">
            <div className="flex items-center justify-between gap-3"><div><p className="text-sm font-bold">Jenis jasa</p><p className="mt-1 text-xs text-slate-500">Kelola daftar jasa yang ditawarkan melalui lapak.</p></div>
              <button type="button" onClick={() => setServices((current) => [...current, { ...emptyService }])} className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-slate-300 px-3 text-sm font-bold"><Plus className="size-4" />Tambah</button>
            </div>
            <div className="mt-4 space-y-3">{services.map((service, index) => <div key={index} className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-[1fr_1fr_auto]">
              <input aria-label={`Nama jasa ${index + 1}`} value={service.name} onChange={(event) => updateService(index, "name", event.target.value)} placeholder="Nama jasa" className={`${inputClass} mt-0 bg-white`} />
              <input aria-label={`Deskripsi jasa ${index + 1}`} value={service.description} onChange={(event) => updateService(index, "description", event.target.value)} placeholder="Deskripsi singkat (opsional)" className={`${inputClass} mt-0 bg-white`} />
              <button type="button" aria-label={`Hapus jasa ${index + 1}`} disabled={services.length === 1} onClick={() => setServices((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="grid size-11 place-items-center rounded-xl border border-slate-300 bg-white text-slate-500 disabled:opacity-40"><X className="size-4" /></button>
            </div>)}</div>
          </div>
          <div className="flex justify-end border-t border-slate-200 pt-5"><button disabled={saving} className={`${primaryButton} disabled:opacity-50`}>{saving ? <LoaderCircle className="size-5 animate-spin" /> : <CheckCircle2 className="size-5" />}{saving ? "Menyimpan..." : listing ? "Simpan perubahan" : "Ajukan lapak"}</button></div>
          {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p>}
          {message && <p role="status" className="rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">{message}</p>}
        </form>
      )}
    </>
  );
}

function Field({ label, name, placeholder, defaultValue, type = "text", min }: { label: string; name: string; placeholder: string; defaultValue?: string | number; type?: string; min?: string }) {
  return <label className="block text-sm font-bold text-slate-700">{label}<input name={name} type={type} min={min} required defaultValue={defaultValue} placeholder={placeholder} className={inputClass} /></label>;
}
