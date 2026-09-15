"use client";

import { CheckCircle2, CircleDollarSign, ImagePlus, LoaderCircle, MapPin, Store } from "lucide-react";
import Image from "next/image";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { PageHeader, inputClass, primaryButton, secondaryButton } from "@/components/ui";
import { saveMarketplaceListing } from "@/lib/api";

const categories = ["Listrik", "Plumbing", "AC", "Pertukangan", "Kebersihan", "Lainnya"];

export default function RegisterListingPage() {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [imagePreview, setImagePreview] = useState("");

  function pickImage(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setImagePreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return file ? URL.createObjectURL(file) : "";
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const image = form.get("image");
    setSaving(true);
    setMessage("");
    setError("");
    try {
      await saveMarketplaceListing({
        name: String(form.get("name")),
        category: String(form.get("category")),
        location: String(form.get("location")),
        description: String(form.get("description")),
        priceFrom: Number(form.get("priceFrom")),
        image: image instanceof File && image.size > 0 ? image : undefined,
      });
      setMessage("Lapak berhasil didaftarkan dan sekarang tampil di marketplace.");
      event.currentTarget.reset();
      setImagePreview((current) => {
        if (current) URL.revokeObjectURL(current);
        return "";
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Lapak gagal didaftarkan.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Marketplace"
        title="Daftarkan lapak Anda"
        description="Tawarkan layanan Anda agar mudah ditemukan oleh pengguna Tasktify."
        action={<Link href="/market" className={secondaryButton}>Lihat market</Link>}
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-5 md:p-7">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Nama lapak" name="name" placeholder="Contoh: Budi Plumbing" />
            <label className="block text-sm font-bold text-slate-700">
              Kategori
              <select name="category" required defaultValue="" className={inputClass}>
                <option value="" disabled>Pilih kategori</option>
                {categories.map((category) => <option key={category}>{category}</option>)}
              </select>
            </label>
            <Field icon={MapPin} label="Kota atau area layanan" name="location" placeholder="Contoh: Jakarta Selatan" />
            <Field icon={CircleDollarSign} label="Harga mulai dari" name="priceFrom" type="number" min="0" placeholder="150000" />
          </div>
          <label className="mt-5 block text-sm font-bold text-slate-700">
            Deskripsi layanan
            <textarea name="description" required minLength={20} maxLength={1000} rows={5} placeholder="Jelaskan layanan, keunggulan, dan area yang Anda layani..." className={`${inputClass} py-3`} />
            <span className="mt-2 block text-xs font-normal text-slate-500">Minimal 20 karakter agar calon pelanggan memahami layanan Anda.</span>
          </label>
          <label className="mt-5 block text-sm font-bold text-slate-700">
            Foto banner lapak
            <span className="mt-2 flex items-center gap-4">
              <span className="relative flex h-24 w-36 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50">
                {imagePreview ? (
                  <Image src={imagePreview} alt="" fill className="object-cover" unoptimized />
                ) : (
                  <ImagePlus className="size-6 text-slate-400" />
                )}
              </span>
              <span className="flex flex-col gap-2">
                <span className="relative inline-flex w-fit cursor-pointer items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:border-slate-400">
                  Pilih foto
                  <input
                    name="image"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={pickImage}
                    className="absolute inset-0 cursor-pointer opacity-0"
                  />
                </span>
                <span className="text-xs font-normal text-slate-500">JPG, PNG, atau WebP. Maksimal 5 MB.</span>
              </span>
            </span>
          </label>
          <div className="mt-7 flex justify-end border-t border-slate-200 pt-6">
            <button disabled={saving} className={`${primaryButton} disabled:opacity-50`}>
              {saving && <LoaderCircle className="size-5 animate-spin" />}
              {saving ? "Mendaftarkan..." : "Tampilkan lapak"}
            </button>
          </div>
          {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p>}
          {message && <p role="status" className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700"><CheckCircle2 className="size-5 shrink-0" />{message}</p>}
        </form>
        <aside className="h-fit rounded-2xl border border-orange-200 bg-orange-50 p-6">
          <Store className="size-8 text-orange-600" />
          <h2 className="mt-5 font-[var(--font-manrope)] text-xl font-extrabold text-slate-950">Lapak yang menarik</h2>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
            <li>Gunakan nama layanan yang mudah dicari.</li>
            <li>Tulis deskripsi yang spesifik dan jujur.</li>
            <li>Pasang harga awal yang kompetitif.</li>
          </ul>
        </aside>
      </div>
    </>
  );
}

function Field({ icon: Icon, label, name, type = "text", min, placeholder }: { icon?: typeof MapPin; label: string; name: string; type?: string; min?: string; placeholder: string }) {
  return (
    <label className="block text-sm font-bold text-slate-700">
      {label}
      <span className="relative block">
        {Icon && <Icon className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />}
        <input name={name} type={type} min={min} required className={`${inputClass} ${Icon ? "pl-12" : ""}`} placeholder={placeholder} />
      </span>
    </label>
  );
}