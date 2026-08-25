"use client";

import { GripVertical, LoaderCircle, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { createBanner, deleteBanner, getAdminBanners, updateBanner } from "@/lib/api";
import { bannerAccentOptions, bannerGradient } from "@/lib/banner-accent";
import { inputClass, primaryButton, secondaryButton } from "@/components/ui";
import type { Banner, BannerAccent } from "@/types";

type FormState = {
  title: string;
  description: string;
  href: string;
  cta: string;
  accent: BannerAccent;
  sortOrder: number;
  active: boolean;
};

const emptyForm: FormState = {
  title: "",
  description: "",
  href: "/",
  cta: "",
  accent: "orange",
  sortOrder: 0,
  active: true,
};

export function AdminBannerManager() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      setBanners(await getAdminBanners());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Banner gagal dimuat.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const items = await getAdminBanners();
        if (!cancelled) setBanners(items);
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Banner gagal dimuat.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function startCreate() {
    setForm({ ...emptyForm, sortOrder: banners.length });
    setEditingId("new");
  }

  function startEdit(banner: Banner) {
    setForm({
      title: banner.title,
      description: banner.description,
      href: banner.href,
      cta: banner.cta,
      accent: banner.accent,
      sortOrder: banner.sortOrder,
      active: banner.active,
    });
    setEditingId(banner.id);
  }

  function cancelEdit() {
    setEditingId(null);
    setError("");
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingId) return;
    setSaving(true);
    setError("");
    try {
      if (editingId === "new") {
        await createBanner(form);
      } else {
        await updateBanner(editingId, form);
      }
      setEditingId(null);
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Banner gagal disimpan.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(banner: Banner) {
    if (!window.confirm(`Hapus banner "${banner.title}"?`)) return;
    setSaving(true);
    setError("");
    try {
      await deleteBanner(banner.id);
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Banner gagal dihapus.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-4">
        <p className="text-sm leading-6 text-slate-600">
          Banner ditampilkan bergantian di bagian atas dashboard pengguna, urut sesuai nomor urut.
        </p>
        {editingId === null && (
          <button type="button" onClick={startCreate} className={`${primaryButton} shrink-0`}>
            <Plus className="size-5" /> Tambah banner
          </button>
        )}
      </div>

      {error && (
        <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </p>
      )}

      {editingId !== null && (
        <form onSubmit={submit} className="mb-6 space-y-4 rounded-2xl border border-orange-200 bg-orange-50/50 p-5">
          <h3 className="font-[var(--font-manrope)] text-lg font-extrabold">
            {editingId === "new" ? "Banner baru" : "Edit banner"}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-bold text-slate-700">
              Judul <span className="text-red-600">*</span>
              <input
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                required
                maxLength={120}
                className={inputClass}
                placeholder="Contoh: Ambil task yang sesuai"
              />
            </label>
            <label className="block text-sm font-bold text-slate-700">
              Teks tombol (CTA) <span className="text-red-600">*</span>
              <input
                value={form.cta}
                onChange={(event) => setForm({ ...form, cta: event.target.value })}
                required
                maxLength={40}
                className={inputClass}
                placeholder="Contoh: Ambil Task"
              />
            </label>
          </div>
          <label className="block text-sm font-bold text-slate-700">
            Deskripsi
            <textarea
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              maxLength={300}
              rows={2}
              className={`${inputClass} py-3`}
              placeholder="Kalimat singkat pendukung judul"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block text-sm font-bold text-slate-700">
              Tautan tujuan <span className="text-red-600">*</span>
              <input
                value={form.href}
                onChange={(event) => setForm({ ...form, href: event.target.value })}
                required
                maxLength={200}
                className={inputClass}
                placeholder="/marketplace"
              />
              <span className="mt-1.5 block text-xs font-normal text-slate-500">Harus diawali dengan &quot;/&quot;</span>
            </label>
            <label className="block text-sm font-bold text-slate-700">
              Warna
              <select
                value={form.accent}
                onChange={(event) => setForm({ ...form, accent: event.target.value as BannerAccent })}
                className={inputClass}
              >
                {bannerAccentOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-bold text-slate-700">
              Urutan tampil
              <input
                type="number"
                value={form.sortOrder}
                onChange={(event) => setForm({ ...form, sortOrder: Number(event.target.value) })}
                className={inputClass}
              />
            </label>
          </div>
          <div className={`rounded-xl bg-gradient-to-r ${bannerGradient(form.accent)} p-4 text-white`}>
            <p className="text-xs font-bold uppercase tracking-wider text-white/80">{form.cta || "CTA"}</p>
            <p className="mt-1 font-[var(--font-manrope)] text-lg font-extrabold">{form.title || "Judul banner"}</p>
            <p className="mt-1 text-sm text-white/90">{form.description || "Deskripsi banner"}</p>
          </div>
          <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(event) => setForm({ ...form, active: event.target.checked })}
              className="size-4 rounded border-slate-300"
            />
            Aktif (ditampilkan di dashboard)
          </label>
          <div className="flex flex-col-reverse gap-3 border-t border-orange-200 pt-4 sm:flex-row sm:justify-end">
            <button type="button" onClick={cancelEdit} className={secondaryButton}>
              Batal
            </button>
            <button type="submit" disabled={saving} className={primaryButton}>
              {saving ? <LoaderCircle className="size-5 animate-spin" /> : null} Simpan
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="py-16 text-center text-slate-500">Memuat...</p>
      ) : banners.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center text-slate-500">
          Belum ada banner. Tambahkan banner pertama untuk dashboard.
        </div>
      ) : (
        <div className="space-y-3">
          {banners.map((banner) => (
            <div
              key={banner.id}
              className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4"
            >
              <GripVertical className="size-4 shrink-0 text-slate-300" />
              <span className={`h-10 w-16 shrink-0 rounded-lg bg-gradient-to-r ${bannerGradient(banner.accent)}`} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <strong className="truncate text-sm">{banner.title}</strong>
                  {!banner.active && (
                    <span className="shrink-0 rounded-full border border-slate-300 bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500">
                      Nonaktif
                    </span>
                  )}
                </div>
                <p className="truncate text-xs text-slate-500">
                  {banner.cta} &middot; {banner.href} &middot; urutan {banner.sortOrder}
                </p>
              </div>
              <button
                type="button"
                onClick={() => startEdit(banner)}
                aria-label={`Edit banner ${banner.title}`}
                className="grid size-10 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                <Pencil className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => remove(banner)}
                aria-label={`Hapus banner ${banner.title}`}
                className="grid size-10 shrink-0 place-items-center rounded-xl border border-slate-200 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
