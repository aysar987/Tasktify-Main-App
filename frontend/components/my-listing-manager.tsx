"use client";

import { CheckCircle2, ImagePlus, LoaderCircle, Plus, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { getMyMarketplaceListing, saveMarketplaceListing } from "@/lib/api";
import type { MarketplaceListing, MarketplaceOperatingHours, MarketplaceListingService } from "@/types";
import { PageHeader, inputClass, primaryButton } from "./ui";

const categories = ["Listrik", "Plumbing", "AC", "Pertukangan", "Kebersihan", "Lainnya"];
const weekdays = [
  ["monday", "Senin"],
  ["tuesday", "Selasa"],
  ["wednesday", "Rabu"],
  ["thursday", "Kamis"],
  ["friday", "Jumat"],
  ["saturday", "Sabtu"],
  ["sunday", "Minggu"],
] as const;
const serviceUnits = [
  ["per_pasangan", "Per pasang"],
  ["per_item", "Per item"],
  ["per_jam", "Per jam"],
  ["per_meter", "Per meter"],
  ["per_kg", "Per kg"],
  ["per_unit", "Per unit"],
  ["sekali_datang", "Sekali datang"],
] as const;
const serviceTypeOptions = [
  ["buyer_location", "Pembeli datang ke lokasi"],
  ["provider_travel", "Penjual datang ke pembeli"],
  ["pickup_delivery", "Antar-jemput"],
] as const;
const emptyService = {
  name: "",
  description: "",
  price: "",
  unit: "per_unit",
  duration: "",
  isActive: true,
};
type ServiceDraft = typeof emptyService;
type ServiceType = (typeof serviceTypeOptions)[number][0];
type DayKey = (typeof weekdays)[number][0];
type HoursDay = NonNullable<MarketplaceOperatingHours[DayKey]>;
type FormOperatingHours = Record<DayKey, HoursDay>;
type FormErrors = Record<string, string>;

const emptyHours = (): FormOperatingHours =>
  Object.fromEntries(
    weekdays.map(([day]) => [day, { isOpen: false, openTime: "09:00", closeTime: "17:00" }]),
  ) as FormOperatingHours;

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
}

function normalizeWhatsApp(value: string) {
  let number = value.trim().replace(/[ ().-]/g, "");
  if (!/^\+?[0-9]+$/.test(number)) return "";
  number = number.replace(/^\+/, "");
  if (number.startsWith("0")) number = `62${number.slice(1)}`;
  else if (number.startsWith("8")) number = `62${number}`;
  return /^628[1-9][0-9]{7,10}$/.test(number) ? number : "";
}

function toServiceDraft(service: MarketplaceListingService): ServiceDraft {
  return {
    name: service.name,
    description: service.description,
    price: String(service.price),
    unit: service.unit,
    duration: service.duration,
    isActive: service.isActive,
  };
}

export function MyListingManager() {
  const [listing, setListing] = useState<MarketplaceListing | null>(null);
  const [services, setServices] = useState<ServiceDraft[]>([{ ...emptyService }]);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [hours, setHours] = useState<FormOperatingHours>(emptyHours);
  const [copyDay, setCopyDay] = useState<DayKey>("monday");
  const [description, setDescription] = useState("");
  const [whatsApp, setWhatsApp] = useState("");
  const [image, setImage] = useState<File>();
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [editingPriceIndex, setEditingPriceIndex] = useState<number | null>(null);
  const saveLock = useRef(false);

  useEffect(() => {
    let active = true;
    getMyMarketplaceListing()
      .then((current) => {
        if (!active || !current) return;
        setListing(current);
        setServices(current.services?.length ? current.services.map(toServiceDraft) : [{ ...emptyService }]);
        setServiceTypes(current.serviceTypes ?? []);
        setHours({ ...emptyHours(), ...current.operatingHours });
        setDescription(current.description);
        setWhatsApp(current.whatsapp);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "Lapak gagal dimuat.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!imagePreview) return;
    return () => URL.revokeObjectURL(imagePreview);
  }, [imagePreview]);

  useEffect(() => {
    if (!dirty || saving) return;
    const warnBeforeLeave = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeLeave);
    return () => window.removeEventListener("beforeunload", warnBeforeLeave);
  }, [dirty, saving]);

  useEffect(() => {
    if (!dirty || saving) return;
    const confirmInternalNavigation = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const anchor = event.target.closest<HTMLAnchorElement>("a[href]");
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      if (anchor.origin !== window.location.origin) return;
      if (window.confirm("Perubahan belum disimpan. Yakin ingin meninggalkan halaman ini?")) {
        setDirty(false);
        return;
      }
      event.preventDefault();
      event.stopImmediatePropagation();
    };
    document.addEventListener("click", confirmInternalNavigation, true);
    return () => document.removeEventListener("click", confirmInternalNavigation, true);
  }, [dirty, saving]);

  function clearError(key: string) {
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function handleFormChange(event: ChangeEvent<HTMLFormElement>) {
    setDirty(true);
    setError("");
    const target = event.nativeEvent.target;
    if (target instanceof HTMLElement && target.dataset.validationKey) clearError(target.dataset.validationKey);
  }

  function updateService(index: number, field: keyof ServiceDraft, value: string | boolean) {
    setDirty(true);
    setError("");
    clearError("services");
    setServices((current) =>
      current.map((service, itemIndex) => (itemIndex === index ? { ...service, [field]: value } : service)),
    );
  }

  function updateHours(day: DayKey, changes: Partial<HoursDay>) {
    setDirty(true);
    setError("");
    setHours((current) => ({ ...current, [day]: { ...current[day], ...changes } }));
  }

  function pickImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    const extensionAllowed = /\.(jpe?g|png|webp)$/i.test(file.name);
    if ((!allowedTypes.includes(file.type) && !(file.type === "" && extensionAllowed)) || file.size > 5 * 1024 * 1024) {
      const validationMessage =
        file.size > 5 * 1024 * 1024
          ? "Ukuran foto maksimal 5 MB."
          : "Format foto harus JPG, PNG, atau WebP.";
      setErrors((current) => ({ ...current, image: validationMessage }));
      event.target.value = "";
      return;
    }
    setErrors((current) => {
      const next = { ...current };
      delete next.image;
      return next;
    });
    setDirty(true);
    setError("");
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function validate(form: FormData) {
    const next: FormErrors = {};
    const value = (key: string) => String(form.get(key) ?? "").trim();
    if (errors.image) next.image = errors.image;
    const name = value("name");
    const category = value("category");
    const location = value("location");
    const address = value("fullAddress");
    const instagramUrl = value("instagramUrl");
    const tiktokUrl = value("tiktokUrl");
    const termsWarranty = value("termsWarranty");

    if (name.length < 3 || name.length > 120) next.name = "Nama lapak wajib diisi (3-120 karakter).";
    if (!category) next.category = "Pilih kategori lapak.";
    if (!location || location.length > 160) next.location = "Kota atau area layanan wajib diisi (maksimal 160 karakter).";
    if (description.trim().length < 20 || description.trim().length > 500) {
      next.description = "Deskripsi layanan wajib 20-500 karakter.";
    }
    if (!normalizeWhatsApp(whatsApp)) next.whatsapp = "Masukkan nomor WhatsApp Indonesia yang valid.";
    if (!address || address.length > 500) next.fullAddress = "Alamat lengkap wajib diisi (maksimal 500 karakter).";
    if (serviceTypes.length === 0) next.serviceTypes = "Pilih minimal satu tipe layanan.";
    if (termsWarranty.length > 300) next.termsWarranty = "Syarat dan garansi maksimal 300 karakter.";

    for (const [field, input] of [["instagramUrl", instagramUrl], ["tiktokUrl", tiktokUrl]]) {
      if (input) {
        try {
          const parsed = new URL(input);
          if (!["http:", "https:"].includes(parsed.protocol)) next[field] = "Masukkan URL yang valid (http atau https).";
        } catch {
          next[field] = "Masukkan URL yang valid (http atau https).";
        }
      }
    }

    for (const [day] of weekdays) {
      const dayHours = hours[day];
      if (dayHours.isOpen && (!dayHours.openTime || !dayHours.closeTime || dayHours.closeTime <= dayHours.openTime)) {
        next[`hours.${day}`] = "Jam tutup harus setelah jam buka.";
      }
    }

    let activeValidServices = 0;
    services.forEach((service, index) => {
      const prefix = `service.${index}`;
      if (!service.name.trim() || service.name.trim().length > 120) {
        next[`${prefix}.name`] = "Nama jasa wajib diisi (maksimal 120 karakter).";
      }
      const price = service.price === "" ? Number.NaN : Number(service.price);
      if (!Number.isSafeInteger(price) || price < 0 || price > 2_147_483_647) {
        next[`${prefix}.price`] = "Masukkan harga bulat antara Rp0 dan Rp2.147.483.647.";
      }
      if (!serviceUnits.some(([unit]) => unit === service.unit)) {
        next[`${prefix}.unit`] = "Pilih satuan jasa.";
      }
      if (service.description.trim().length > 500) {
        next[`${prefix}.description`] = "Deskripsi jasa maksimal 500 karakter.";
      }
      if (service.duration.trim().length > 80) {
        next[`${prefix}.duration`] = "Estimasi durasi maksimal 80 karakter.";
      }
      if (service.isActive && service.name.trim() && Number.isSafeInteger(price) && price >= 0 && price <= 2_147_483_647) {
        activeValidServices++;
      }
    });
    if (services.length === 0 || activeValidServices === 0) {
      next.services = "Tambahkan minimal satu jasa valid yang berstatus aktif.";
    }
    return next;
  }

  function scrollToFirstError(next: FormErrors) {
    const firstKey = Object.keys(next)[0];
    if (!firstKey) return;
    requestAnimationFrame(() => {
      const target = document.querySelector<HTMLElement>(`[data-validation-key="${firstKey}"]`);
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
      target?.focus({ preventScroll: true });
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saveLock.current) return;
    const form = new FormData(event.currentTarget);
    const validationErrors = validate(form);
    setErrors(validationErrors);
    setError("");
    setMessage("");
    if (Object.keys(validationErrors).length > 0) {
      scrollToFirstError(validationErrors);
      return;
    }

    saveLock.current = true;
    setSaving(true);
    try {
      const saved = await saveMarketplaceListing({
        name: String(form.get("name")).trim(),
        category: String(form.get("category")).trim(),
        location: String(form.get("location")).trim(),
        description: description.trim(),
        whatsapp: normalizeWhatsApp(whatsApp),
        fullAddress: String(form.get("fullAddress")).trim(),
        serviceTypes,
        operatingHours: hours,
        instagramUrl: String(form.get("instagramUrl")).trim(),
        tiktokUrl: String(form.get("tiktokUrl")).trim(),
        termsWarranty: String(form.get("termsWarranty")).trim(),
        image,
        services: services.map((service) => ({
          name: service.name.trim(),
          description: service.description.trim(),
          price: Number(service.price),
          unit: service.unit as MarketplaceListingService["unit"],
          duration: service.duration.trim(),
          isActive: service.isActive,
        })),
      });
      setListing(saved);
      setServices(saved.services?.length ? saved.services.map(toServiceDraft) : [{ ...emptyService }]);
      setWhatsApp(saved.whatsapp);
      setImage(undefined);
      setImagePreview("");
      setDirty(false);
      setMessage("Perubahan tersimpan. Lapak menunggu verifikasi admin sebelum tampil di marketplace.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Perubahan lapak gagal disimpan.");
    } finally {
      saveLock.current = false;
      setSaving(false);
    }
  }

  const activePrices = services
    .filter((service) => service.isActive && service.name.trim() && service.price !== "")
    .map((service) => Number(service.price));
  const lowestActivePrice = activePrices.length ? Math.min(...activePrices) : null;
  const hasActiveValidService = services.some((service) => {
    const price = Number(service.price);
    return (
      service.isActive &&
      service.name.trim().length > 0 &&
      service.name.trim().length <= 120 &&
      service.price !== "" &&
      Number.isSafeInteger(price) &&
      price >= 0 &&
      price <= 2_147_483_647 &&
      serviceUnits.some(([unit]) => unit === service.unit)
    );
  });

  return (
    <>
      <PageHeader
        title="Kelola lapak"
        description="Perbarui informasi, harga, foto, dan jenis jasa yang tampil di marketplace."
        action={
          <Link
            href="/market"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700"
          >
            Lihat marketplace
          </Link>
        }
      />
      {loading ? (
        <p className="py-16 text-center text-slate-500">Memuat lapak...</p>
      ) : error && !listing ? (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p>
      ) : (
        <form
          noValidate
          onSubmit={submit}
          onChange={handleFormChange}
          className="max-w-4xl space-y-6 rounded-2xl border border-slate-200 bg-white p-5 md:p-7"
        >
          <ListingStatusBanner listing={listing} />

          <div className="grid gap-5 md:grid-cols-2">
            <label className="block text-sm font-bold text-slate-700">Nama lapak
              <input id="field-name" data-validation-key="name" name="name" required defaultValue={listing?.name} placeholder="Contoh: Budi Plumbing" aria-invalid={Boolean(errors.name)} className={inputClass} />
              <InlineError message={errors.name} />
            </label>
            <label className="block text-sm font-bold text-slate-700">Kategori
              <select id="field-category" data-validation-key="category" name="category" required defaultValue={listing?.category ?? ""} aria-invalid={Boolean(errors.category)} className={inputClass}>
                <option value="" disabled>Pilih kategori</option>
                {categories.map((category) => <option key={category}>{category}</option>)}
              </select>
              <InlineError message={errors.category} />
            </label>
            <label className="block text-sm font-bold text-slate-700">Kota atau area layanan
              <input id="field-location" data-validation-key="location" name="location" required defaultValue={listing?.location} placeholder="Contoh: Jakarta Selatan" aria-invalid={Boolean(errors.location)} className={inputClass} />
              <InlineError message={errors.location} />
            </label>
            <div className="block text-sm font-bold text-slate-700">
              Harga mulai dari
              <div aria-readonly="true" className={`${inputClass} flex items-center text-slate-700`}>
                {lowestActivePrice === null ? "Isi harga jasa aktif" : formatRupiah(lowestActivePrice)}
              </div>
              <span className="mt-1 block text-xs font-normal text-slate-500">Dihitung otomatis dari jasa yang aktif.</span>
            </div>
          </div>

          <label className="block text-sm font-bold text-slate-700">Deskripsi layanan
            <textarea
              id="field-description"
              data-validation-key="description"
              name="description"
              required
              minLength={20}
              maxLength={500}
              rows={5}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Jelaskan layanan dan area yang Anda layani..."
              aria-invalid={Boolean(errors.description)}
              className={`${inputClass} py-3`}
            />
            <span className="mt-1 block text-right text-xs font-normal text-slate-500">{description.length}/500</span>
            <InlineError message={errors.description} />
          </label>

          <section>
            <p className="text-sm font-bold text-slate-700">Foto lapak</p>
            <div className="mt-2 flex flex-wrap items-center gap-4">
              <span className="relative flex h-24 w-36 items-center justify-center overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50">
                {imagePreview || listing?.imageUrl ? (
                  <Image unoptimized src={imagePreview || listing?.imageUrl || ""} alt="Pratinjau foto lapak" fill className="object-cover" />
                ) : (
                  <ImagePlus className="size-6 text-slate-400" />
                )}
              </span>
              <label className="relative inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700">
                Pilih foto
                <input
                  id="field-image"
                  data-validation-key="image"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="absolute inset-0 cursor-pointer opacity-0"
                  onChange={pickImage}
                />
              </label>
              <span className="text-xs text-slate-500">JPG, PNG, atau WebP, maksimal 5 MB. Kosongkan untuk mempertahankan foto saat ini.</span>
            </div>
            <InlineError message={errors.image} />
          </section>

          <section className="border-t border-slate-200 pt-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold">Jenis jasa</p>
                <p className="mt-1 text-xs text-slate-500">Jasa aktif menentukan harga mulai yang ditampilkan di marketplace.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDirty(true);
                  clearError("services");
                  setServices((current) => [...current, { ...emptyService }]);
                }}
                className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-slate-300 px-3 text-sm font-bold"
              >
                <Plus className="size-4" />Tambah
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {services.map((service, index) => (
                <div key={index} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    <ServiceInput
                      id={`service-${index}-name`}
                      errorKey={`service.${index}.name`}
                      label="Nama jasa"
                      value={service.name}
                      error={errors[`service.${index}.name`]}
                      onChange={(value) => updateService(index, "name", value)}
                      placeholder="Contoh: Cuci sepatu"
                    />
                    <ServiceInput
                      id={`service-${index}-description`}
                      errorKey={`service.${index}.description`}
                      label="Deskripsi singkat (opsional)"
                      value={service.description}
                      error={errors[`service.${index}.description`]}
                      onChange={(value) => updateService(index, "description", value)}
                      placeholder="Penjelasan singkat jasa"
                    />
                    <label className="block text-sm font-bold text-slate-700">
                      Harga
                      <input
                        id={`service-${index}-price`}
                        data-validation-key={`service.${index}.price`}
                        inputMode="numeric"
                        value={editingPriceIndex === index ? service.price : service.price === "" ? "" : formatRupiah(Number(service.price))}
                        onFocus={() => setEditingPriceIndex(index)}
                        onBlur={() => setEditingPriceIndex(null)}
                        onChange={(event) => updateService(index, "price", event.target.value.replace(/\D/g, ""))}
                        placeholder="Masukkan harga, mis. 5000"
                        aria-invalid={Boolean(errors[`service.${index}.price`])}
                        className={`${inputClass} mt-0 bg-white`}
                      />
                      <InlineError message={errors[`service.${index}.price`]} />
                    </label>
                    <label className="block text-sm font-bold text-slate-700">
                      Satuan
                      <select
                        id={`service-${index}-unit`}
                        data-validation-key={`service.${index}.unit`}
                        value={service.unit}
                        onChange={(event) => updateService(index, "unit", event.target.value)}
                        aria-invalid={Boolean(errors[`service.${index}.unit`])}
                        className={`${inputClass} mt-0 bg-white`}
                      >
                        {serviceUnits.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </select>
                      <InlineError message={errors[`service.${index}.unit`]} />
                    </label>
                    <ServiceInput
                      id={`service-${index}-duration`}
                      errorKey={`service.${index}.duration`}
                      label="Estimasi durasi (opsional)"
                      value={service.duration}
                      error={errors[`service.${index}.duration`]}
                      onChange={(value) => updateService(index, "duration", value)}
                      placeholder="Contoh: 2-3 hari"
                    />
                    <div className="flex items-end justify-between gap-3">
                      <button
                        type="button"
                        aria-pressed={service.isActive}
                        onClick={() => updateService(index, "isActive", !service.isActive)}
                        className="inline-flex min-h-12 items-center gap-3 text-sm font-bold text-slate-700"
                      >
                        <span className={`relative h-6 w-11 rounded-full transition ${service.isActive ? "bg-emerald-600" : "bg-slate-300"}`}>
                          <span className={`absolute top-1 size-4 rounded-full bg-white transition ${service.isActive ? "left-6" : "left-1"}`} />
                        </span>
                        {service.isActive ? "Aktif" : "Nonaktif"}
                      </button>
                      <button
                        type="button"
                        aria-label={`Hapus jasa ${index + 1}`}
                        disabled={services.length === 1}
                        onClick={() => {
                          setDirty(true);
                          setServices((current) => current.filter((_, itemIndex) => itemIndex !== index));
                        }}
                        className="grid size-11 place-items-center rounded-xl border border-slate-300 bg-white text-slate-500 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p data-validation-key="services" tabIndex={-1} className="mt-2"><InlineError message={errors.services} /></p>
          </section>

          <section className="border-t border-slate-200 pt-5">
            <h2 className="text-sm font-bold text-slate-700">Informasi kontak dan lokasi</h2>
            <div className="mt-4 grid gap-5 md:grid-cols-2">
              <label className="block text-sm font-bold text-slate-700">Nomor WhatsApp
                <input
                  id="field-whatsapp"
                  data-validation-key="whatsapp"
                  name="whatsapp"
                  type="tel"
                  value={whatsApp}
                  onChange={(event) => setWhatsApp(event.target.value)}
                  placeholder="Contoh: 081234567890"
                  aria-invalid={Boolean(errors.whatsapp)}
                  className={inputClass}
                />
                <span className="mt-1 block text-xs font-normal text-slate-500">Nomor akan disimpan dengan awalan 62.</span>
                <InlineError message={errors.whatsapp} />
              </label>
              <label className="block text-sm font-bold text-slate-700 md:col-span-2">Alamat lengkap / patokan lokasi
                <textarea
                  id="field-fullAddress"
                  data-validation-key="fullAddress"
                  name="fullAddress"
                  required
                  maxLength={500}
                  rows={3}
                  defaultValue={listing?.fullAddress}
                  placeholder="Alamat lengkap atau patokan untuk menemukan lokasi"
                  aria-invalid={Boolean(errors.fullAddress)}
                  className={`${inputClass} py-3`}
                />
                <InlineError message={errors.fullAddress} />
              </label>
              <fieldset className="md:col-span-2">
                <legend className="text-sm font-bold text-slate-700">Tipe layanan</legend>
                <div id="field-serviceTypes" className="mt-3 flex flex-wrap gap-x-6 gap-y-3">
                  {serviceTypeOptions.map(([value, label]) => (
                    <label key={value} className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                      <input
                        type="checkbox"
                        data-validation-key="serviceTypes"
                        checked={serviceTypes.includes(value)}
                        onChange={(event) => {
                          setServiceTypes((current) =>
                            event.target.checked ? [...current, value] : current.filter((type) => type !== value),
                          );
                        }}
                        className="size-4 accent-orange-600"
                      />
                      {label}
                    </label>
                  ))}
                </div>
                <InlineError message={errors.serviceTypes} />
              </fieldset>
            </div>
          </section>

          <section className="border-t border-slate-200 pt-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-slate-700">Jam operasional</h2>
                <p className="mt-1 text-xs text-slate-500">Atur jam buka dan tutup untuk setiap hari.</p>
              </div>
              <div className="flex items-center gap-2">
                <select aria-label="Hari sumber jam operasional" value={copyDay} onChange={(event) => setCopyDay(event.target.value as DayKey)} className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm">
                  {weekdays.map(([day, label]) => <option key={day} value={day}>{label}</option>)}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    setDirty(true);
                    const source = hours[copyDay];
                    setHours(Object.fromEntries(weekdays.map(([day]) => [day, { ...source }])) as FormOperatingHours);
                  }}
                  className="min-h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm font-bold text-slate-700"
                >
                  Salin ke semua hari
                </button>
              </div>
            </div>
            <div className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-200">
              {weekdays.map(([day, label]) => (
                <div key={day} className="grid gap-3 p-3 sm:grid-cols-[1fr_1fr_1fr] sm:items-center">
                  <label className="inline-flex items-center gap-3 text-sm font-bold text-slate-700">
                    <input data-validation-key={`hours.${day}`} type="checkbox" checked={hours[day].isOpen} onChange={(event) => updateHours(day, { isOpen: event.target.checked })} className="size-4 accent-orange-600" />
                    {label}
                    <span className="font-normal text-slate-500">{hours[day].isOpen ? "Buka" : "Tutup"}</span>
                  </label>
                  {hours[day].isOpen ? (
                    <>
                      <label className="text-xs font-semibold text-slate-600">Jam buka
                        <input
                          data-validation-key={`hours.${day}`}
                          type="time"
                          value={hours[day].openTime}
                          onChange={(event) => updateHours(day, { openTime: event.target.value })}
                          aria-invalid={Boolean(errors[`hours.${day}`])}
                          className="mt-1 min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
                        />
                      </label>
                      <label className="text-xs font-semibold text-slate-600">Jam tutup
                        <input
                          data-validation-key={`hours.${day}`}
                          type="time"
                          value={hours[day].closeTime}
                          onChange={(event) => updateHours(day, { closeTime: event.target.value })}
                          aria-invalid={Boolean(errors[`hours.${day}`])}
                          className="mt-1 min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
                        />
                        <InlineError message={errors[`hours.${day}`]} />
                      </label>
                    </>
                  ) : <p className="text-sm text-slate-400 sm:col-span-2">Tutup</p>}
                </div>
              ))}
            </div>
          </section>

          <section className="border-t border-slate-200 pt-5">
            <h2 className="text-sm font-bold text-slate-700">Informasi tambahan (opsional)</h2>
            <div className="mt-4 grid gap-5 md:grid-cols-2">
              <label className="block text-sm font-bold text-slate-700">Link Instagram
                <input id="field-instagramUrl" data-validation-key="instagramUrl" name="instagramUrl" type="url" defaultValue={listing?.instagramUrl} placeholder="https://instagram.com/akun" aria-invalid={Boolean(errors.instagramUrl)} className={inputClass} />
                <InlineError message={errors.instagramUrl} />
              </label>
              <label className="block text-sm font-bold text-slate-700">Link TikTok
                <input id="field-tiktokUrl" data-validation-key="tiktokUrl" name="tiktokUrl" type="url" defaultValue={listing?.tiktokUrl} placeholder="https://tiktok.com/@akun" aria-invalid={Boolean(errors.tiktokUrl)} className={inputClass} />
                <InlineError message={errors.tiktokUrl} />
              </label>
              <label className="block text-sm font-bold text-slate-700 md:col-span-2">Syarat &amp; garansi
                <textarea id="field-termsWarranty" data-validation-key="termsWarranty" name="termsWarranty" maxLength={300} rows={3} defaultValue={listing?.termsWarranty} placeholder="Jelaskan syarat layanan atau garansi (maks. 300 karakter)" aria-invalid={Boolean(errors.termsWarranty)} className={`${inputClass} py-3`} />
                <span className="mt-1 block text-right text-xs font-normal text-slate-500">Maksimal 300 karakter</span>
                <InlineError message={errors.termsWarranty} />
              </label>
            </div>
          </section>

          <div className="flex justify-end border-t border-slate-200 pt-5">
            <button disabled={saving || !hasActiveValidService} className={primaryButton}>
              {saving ? <LoaderCircle className="size-5 animate-spin" /> : <CheckCircle2 className="size-5" />}
              {saving ? "Menyimpan..." : listing ? "Simpan perubahan" : "Ajukan lapak"}
            </button>
          </div>
          {!hasActiveValidService && <p className="text-right text-xs font-semibold text-slate-500">Tambahkan minimal satu jasa aktif dengan nama dan harga yang valid untuk mengajukan lapak.</p>}
          {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p>}
          {message && <p role="status" className="rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">{message}</p>}
        </form>
      )}
    </>
  );
}

function ListingStatusBanner({ listing }: { listing: MarketplaceListing | null }) {
  if (!listing) {
    return <p className="rounded-xl bg-blue-50 p-4 text-sm leading-6 text-blue-900">Anda belum memiliki lapak. Isi formulir ini untuk mengajukan lapak baru; lapak akan diperiksa admin sebelum dipublikasikan.</p>;
  }
  if (listing.verificationStatus === "verified") {
    return <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">Lapak disetujui dan tampil di marketplace. Perubahan yang disimpan akan ditinjau admin kembali.</p>;
  }
  if (listing.verificationStatus === "rejected") {
    return <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-900">Lapak ditolak. Perbaiki informasi berikut lalu ajukan kembali.{listing.verificationNote && <span className="mt-1 block"><strong>Alasan admin:</strong> {listing.verificationNote}</span>}</p>;
  }
  return <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">Lapak sedang menunggu review admin. Perubahan yang disimpan akan mengirim ulang lapak untuk ditinjau.</p>;
}

function InlineError({ message }: { message?: string }) {
  return message ? <span role="alert" className="mt-1 block text-xs font-semibold text-red-700">{message}</span> : null;
}

function ServiceInput({
  id,
  errorKey,
  label,
  value,
  error,
  onChange,
  placeholder,
}: {
  id: string;
  errorKey: string;
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block text-sm font-bold text-slate-700">
      {label}
      <input
        id={id}
        data-validation-key={errorKey}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        className={`${inputClass} mt-0 bg-white`}
      />
      <InlineError message={error} />
    </label>
  );
}
