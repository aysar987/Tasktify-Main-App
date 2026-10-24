"use client";

import { GripVertical, ImageOff, LoaderCircle, Pencil, Plus, Trash2, Upload } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { BannerCropModal, BannerCropPreset } from "@/components/banner-crop-modal";
import { createBanner, deleteBanner, getAdminBanners, updateBanner } from "@/lib/api";
import { inputClass, primaryButton, secondaryButton } from "@/components/ui";
import type { Banner } from "@/types";

type FormState = {
  href: string;
  sortOrder: number;
  active: boolean;
};

type CropTarget = "mobile" | "desktop";

const emptyForm: FormState = { href: "/", sortOrder: 0, active: true };
const bannerPresets: Record<CropTarget, BannerCropPreset> = {
  mobile: { label: "Mobile", aspect: 2 / 1, width: 1200, height: 600 },
  desktop: { label: "Desktop", aspect: 24 / 5, width: 2400, height: 500 },
};

function loadImageDimensions(file: File) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new window.Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Foto tidak dapat dibaca. Pilih file JPG, PNG, atau WebP yang valid."));
    };
    image.src = url;
  });
}

export function AdminBannerManager() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploadErrors, setUploadErrors] = useState<Partial<Record<CropTarget, string>>>({});
  const [warnings, setWarnings] = useState<Partial<Record<CropTarget, string>>>({});
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [mobileImage, setMobileImage] = useState<File>();
  const [desktopImage, setDesktopImage] = useState<File>();
  const [cropRequest, setCropRequest] = useState<{ target: CropTarget; imageUrl: string }>();
  const [saving, setSaving] = useState(false);
  const mobilePreview = useMemo(() => (mobileImage ? URL.createObjectURL(mobileImage) : undefined), [mobileImage]);
  const desktopPreview = useMemo(() => (desktopImage ? URL.createObjectURL(desktopImage) : undefined), [desktopImage]);

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

  useEffect(() => () => {
    if (mobilePreview) URL.revokeObjectURL(mobilePreview);
  }, [mobilePreview]);

  useEffect(() => () => {
    if (desktopPreview) URL.revokeObjectURL(desktopPreview);
  }, [desktopPreview]);

  function clearImages() {
    setMobileImage(undefined);
    setDesktopImage(undefined);
    setWarnings({});
    setUploadErrors({});
  }

  function startCreate() {
    setForm({ ...emptyForm, sortOrder: banners.length });
    clearImages();
    setEditingId("new");
  }

  function startEdit(banner: Banner) {
    setForm({ href: banner.href, sortOrder: banner.sortOrder, active: banner.active });
    clearImages();
    setEditingId(banner.id);
  }

  function cancelCrop() {
    if (cropRequest) URL.revokeObjectURL(cropRequest.imageUrl);
    setCropRequest(undefined);
  }

  function cancelEdit() {
    cancelCrop();
    setEditingId(null);
    clearImages();
    setError("");
  }

  async function chooseImage(target: CropTarget, file?: File) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setUploadErrors((current) => ({ ...current, [target]: "Format file harus JPG, PNG, atau WebP." }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadErrors((current) => ({ ...current, [target]: "Ukuran file maksimal 5 MB." }));
      return;
    }
    try {
      const { width, height } = await loadImageDimensions(file);
      const preset = bannerPresets[target];
      setWarnings((current) => ({
        ...current,
        [target]:
          width < preset.width || height < preset.height
            ? `Resolusi sumber ${width} × ${height} px lebih kecil dari ${preset.width} × ${preset.height} px; hasil crop mungkin terlihat buram.`
            : "",
      }));
      setUploadErrors((current) => ({ ...current, [target]: "" }));
      setCropRequest({ target, imageUrl: URL.createObjectURL(file) });
    } catch (cause) {
      setUploadErrors((current) => ({
        ...current,
        [target]: cause instanceof Error ? cause.message : "Foto gagal dibaca.",
      }));
    }
  }

  function saveCrop(file: File) {
    if (!cropRequest) return;
    const { target, imageUrl } = cropRequest;
    if (file.size > 5 * 1024 * 1024) {
      setUploadErrors((current) => ({ ...current, [target]: "Hasil crop melebihi batas 5 MB. Pilih foto lain." }));
      URL.revokeObjectURL(imageUrl);
      setCropRequest(undefined);
      return;
    }
    if (target === "mobile") setMobileImage(file);
    else setDesktopImage(file);
    setUploadErrors((current) => ({ ...current, [target]: "" }));
    URL.revokeObjectURL(imageUrl);
    setCropRequest(undefined);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingId) return;
    if (editingId === "new" && !mobileImage && !desktopImage) {
      setError("Unggah minimal satu banner mobile atau desktop.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = { ...form, mobileImage, desktopImage };
      if (editingId === "new") {
        await createBanner(payload);
      } else {
        await updateBanner(editingId, payload);
      }
      setEditingId(null);
      clearImages();
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
  const mobileSrc = mobilePreview ?? editingBanner?.mobileImageUrl ?? editingBanner?.imageUrl;
  const desktopSrc = desktopPreview ?? editingBanner?.desktopImageUrl ?? editingBanner?.imageUrl;

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-4">
        <p className="text-sm leading-6 text-slate-600">
          Unggah banner mobile (2:1) dan desktop (24:5). Jika hanya satu ukuran diunggah, gambar itu digunakan untuk keduanya.
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

          <div className="grid gap-5 lg:grid-cols-2">
            <BannerImageField
              target="mobile"
              file={mobileImage}
              preview={mobileSrc}
              error={uploadErrors.mobile}
              warning={warnings.mobile}
              onChoose={(file) => void chooseImage("mobile", file)}
            />
            <BannerImageField
              target="desktop"
              file={desktopImage}
              preview={desktopSrc}
              error={uploadErrors.desktop}
              warning={warnings.desktop}
              onChoose={(file) => void chooseImage("desktop", file)}
            />
          </div>

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
            <div key={banner.id} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4">
              <GripVertical className="size-4 shrink-0 text-slate-300" />
              <div className="grid w-36 shrink-0 gap-1">
                <div className="relative aspect-[2/1] overflow-hidden rounded-lg bg-slate-100">
                  <Image unoptimized src={banner.mobileImageUrl || banner.imageUrl} alt="" fill className="object-contain" />
                </div>
                <span className="text-center text-[10px] text-slate-500">Mobile / Desktop</span>
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

      {cropRequest && (
        <BannerCropModal
          imageUrl={cropRequest.imageUrl}
          preset={bannerPresets[cropRequest.target]}
          onCancel={cancelCrop}
          onSave={saveCrop}
        />
      )}
    </div>
  );
}

function BannerImageField({
  target,
  file,
  preview,
  error,
  warning,
  onChoose,
}: {
  target: CropTarget;
  file?: File;
  preview?: string;
  error?: string;
  warning?: string;
  onChoose: (file?: File) => void;
}) {
  const preset = bannerPresets[target];
  return (
    <div>
      <label className="block text-sm font-bold text-slate-700">
        Banner {preset.label} ({preset.width} × {preset.height})
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => {
            onChoose(event.target.files?.[0]);
            event.target.value = "";
          }}
          className="mt-2 block w-full text-sm text-slate-600 file:mr-3 file:min-h-11 file:rounded-xl file:border-0 file:bg-orange-600 file:px-4 file:font-bold file:text-white hover:file:bg-orange-700"
        />
      </label>
      <p className="mt-1 text-xs text-slate-500">JPG, PNG, atau WebP; maksimal 5 MB.</p>
      {file && <p className="mt-1 text-xs font-semibold text-emerald-700">Siap diunggah: {file.name}</p>}
      {warning && <p role="status" className="mt-2 rounded-lg bg-amber-50 p-2 text-xs font-semibold text-amber-800">{warning}</p>}
      {error && <p role="alert" className="mt-2 rounded-lg bg-red-50 p-2 text-xs font-semibold text-red-700">{error}</p>}
      {preview ? (
        <div className="mt-3 overflow-hidden rounded-xl border border-orange-200 bg-white" style={{ aspectRatio: String(preset.aspect) }}>
          <Image unoptimized src={preview} alt={`Pratinjau banner ${preset.label}`} width={preset.width} height={preset.height} className="h-full w-full object-contain" />
        </div>
      ) : (
        <div className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-dashed border-orange-300 bg-white text-sm text-slate-400" style={{ aspectRatio: String(preset.aspect) }}>
          <ImageOff className="size-5" /> Belum ada foto
        </div>
      )}
    </div>
  );
}
