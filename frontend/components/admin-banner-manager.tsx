"use client";

import { GripVertical, ImageOff, LoaderCircle, Pencil, Plus, Trash2, Upload } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { createBanner, deleteBanner, getAdminBanners, updateBanner } from "@/lib/api";
import { inputClass, primaryButton, secondaryButton } from "@/components/ui";
import type { Banner } from "@/types";

type FormState = {
  href: string;
  sortOrder: number;
  active: boolean;
};

const emptyForm: FormState = { href: "/", sortOrder: 0, active: true };

export function AdminBannerManager() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [image, setImage] = useState<File>();
  const [saving, setSaving] = useState(false);
  const imagePreview = useMemo(() => (image ? URL.createObjectURL(image) : undefined), [image]);

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

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  function startCreate() {
    setForm({ ...emptyForm, sortOrder: banners.length });
    setImage(undefined);
    setEditingId("new");
  }

  function startEdit(banner: Banner) {
    setForm({ href: banner.href, sortOrder: banner.sortOrder, active: banner.active });
    setImage(undefined);
    setEditingId(banner.id);
  }

  function cancelEdit() {
    setEditingId(null);
    setImage(undefined);
    setError("");
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingId) return;
    if (editingId === "new" && !image) {
      setError("Unggah foto untuk banner baru.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (editingId === "new" && image) {
        await createBanner({ ...form, image });
      } else {
        await updateBanner(editingId, { ...form, image });
      }
      setEditingId(null);
      setImage(undefined);
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Banner gagal disimpan.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(banner: Banner) {
    if (!window.confirm("Hapus banner ini?")) return;
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

  const editingBanner = editingId && editingId !== "new" ? banners.find((item) => item.id === editingId) : undefined;
  const previewSrc = imagePreview ?? editingBanner?.imageUrl;

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-4">
        <p className="text-sm leading-6 text-slate-600">
          Banner berupa foto yang tampil bergantian di bagian atas dashboard pengguna, urut sesuai nomor urut.
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

          <label className="block text-sm font-bold text-slate-700">
            Foto banner {editingId === "new" && <span className="text-red-600">*</span>}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => setImage(event.target.files?.[0])}
              className="mt-2 block w-full text-sm text-slate-600 file:mr-3 file:min-h-11 file:rounded-xl file:border-0 file:bg-orange-600 file:px-4 file:font-bold file:text-white hover:file:bg-orange-700"
            />
            <span className="mt-1.5 block text-xs font-normal text-slate-500">JPG, PNG, atau WebP, maksimal 5 MB.</span>
          </label>

          {previewSrc ? (
            <div className="relative h-40 w-full overflow-hidden rounded-xl border border-orange-200 bg-white sm:h-56">
              <Image unoptimized src={previewSrc} alt="Pratinjau banner" fill className="object-cover" />
            </div>
          ) : (
            <div className="flex h-40 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-orange-300 bg-white text-sm text-slate-400 sm:h-56">
              <ImageOff className="size-5" /> Belum ada foto
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
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
              <span className="mt-1.5 block text-xs font-normal text-slate-500">Halaman yang dibuka saat foto diklik, harus diawali &quot;/&quot;</span>
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
              {saving ? <LoaderCircle className="size-5 animate-spin" /> : <Upload className="size-5" />} Simpan
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
              <div className="relative h-10 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                {banner.imageUrl && <Image unoptimized src={banner.imageUrl} alt="" fill className="object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <strong className="truncate text-sm">{banner.href}</strong>
                  {!banner.active && (
                    <span className="shrink-0 rounded-full border border-slate-300 bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500">
                      Nonaktif
                    </span>
                  )}
                </div>
                <p className="truncate text-xs text-slate-500">urutan {banner.sortOrder}</p>
              </div>
              <button
                type="button"
                onClick={() => startEdit(banner)}
                aria-label="Edit banner"
                className="grid size-10 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                <Pencil className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => remove(banner)}
                aria-label="Hapus banner"
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
