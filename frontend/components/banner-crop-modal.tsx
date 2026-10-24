"use client";

import Cropper, { Area, Point } from "react-easy-crop";
import Image from "next/image";
import { useEffect, useState } from "react";

export type BannerCropPreset = {
  label: string;
  aspect: number;
  width: number;
  height: number;
};

export async function cropBannerImage(
  imageUrl: string,
  area: Area,
  preset: BannerCropPreset,
  quality = 0.85,
): Promise<Blob> {
  const image = new window.Image();
  image.src = imageUrl;
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Foto gagal diproses. Silakan pilih foto lain."));
  });

  const canvas = document.createElement("canvas");
  canvas.width = preset.width;
  canvas.height = preset.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Browser tidak dapat memproses hasil crop foto.");
  context.drawImage(
    image,
    area.x,
    area.y,
    area.width,
    area.height,
    0,
    0,
    preset.width,
    preset.height,
  );
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", quality));
  if (!blob) throw new Error("Hasil crop foto gagal dibuat.");
  if (blob.type === "image/webp") return blob;
  const jpeg = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
  if (!jpeg) throw new Error("Hasil crop foto gagal dibuat.");
  return jpeg;
}

export function BannerCropModal({
  imageUrl,
  preset,
  onCancel,
  onSave,
}: {
  imageUrl: string;
  preset: BannerCropPreset;
  onCancel: () => void;
  onSave: (file: File) => void;
}) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!area) return;
    let cancelled = false;
    const timeout = window.setTimeout(() => {
      cropBannerImage(imageUrl, area, {
        ...preset,
        width: Math.min(preset.width, 640),
        height: Math.round(Math.min(preset.width, 640) / preset.aspect),
      }, 0.78)
        .then((blob) => {
          if (cancelled) return;
          const url = URL.createObjectURL(blob);
          setPreviewUrl((previous) => {
            if (previous) URL.revokeObjectURL(previous);
            return url;
          });
        })
        .catch((cause: unknown) => {
          if (!cancelled) setError(cause instanceof Error ? cause.message : "Pratinjau crop gagal dibuat.");
        });
    }, 140);
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [area, imageUrl, preset]);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  async function save() {
    if (!area) {
      setError("Tunggu sampai area crop siap.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const blob = await cropBannerImage(imageUrl, area, preset);
      const extension = blob.type === "image/webp" ? "webp" : "jpg";
      onSave(new File([blob], `banner-${preset.label.toLowerCase()}-${preset.width}x${preset.height}.${extension}`, { type: blob.type }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Hasil crop foto gagal dibuat.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4" role="dialog" aria-modal="true" aria-labelledby="banner-crop-title">
      <div className="w-full max-w-5xl rounded-2xl bg-white p-5 shadow-2xl sm:p-7">
        <div className="mb-4">
          <h2 id="banner-crop-title" className="font-[var(--font-manrope)] text-xl font-extrabold text-slate-950">Crop banner {preset.label}</h2>
          <p className="mt-1 text-sm text-slate-600">Geser dan perbesar foto. Hasil akan disimpan pada {preset.width} × {preset.height} px.</p>
        </div>
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="relative h-[min(55vh,460px)] overflow-hidden rounded-xl bg-slate-950">
            <Cropper
              image={imageUrl}
              crop={crop}
              zoom={zoom}
              aspect={preset.aspect}
              minZoom={1}
              maxZoom={5}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, croppedAreaPixels) => setArea(croppedAreaPixels)}
            />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-700">Pratinjau hasil</p>
            <div className="mt-2 flex min-h-32 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-100" style={{ aspectRatio: String(preset.aspect) }}>
              {previewUrl ? <Image unoptimized src={previewUrl} alt={`Pratinjau banner ${preset.label}`} width={Math.min(preset.width, 640)} height={Math.round(Math.min(preset.width, 640) / preset.aspect)} className="h-full w-full" /> : <span className="text-sm text-slate-500">Menyiapkan pratinjau...</span>}
            </div>
            <label className="mt-5 block text-sm font-semibold text-slate-700">
              Zoom
              <input type="range" min="1" max="5" step="0.01" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} className="mt-2 w-full accent-orange-600" />
            </label>
          </div>
        </div>
        {error && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
        <div className="mt-5 flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 font-bold text-slate-800">Batal</button>
          <button type="button" disabled={saving || !area} onClick={() => void save()} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-orange-600 px-5 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">
            {saving ? "Menyimpan crop..." : "Simpan crop"}
          </button>
        </div>
      </div>
    </div>
  );
}
