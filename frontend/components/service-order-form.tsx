"use client";

import { LoaderCircle, Minus, Plus } from "lucide-react";
import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { createTask, getMarketplaceListing, getProfile } from "@/lib/api";
import { rupiah, serviceUnitLabels } from "@/lib/format";
import { midtransClientKey, midtransSnapScriptUrl } from "@/lib/midtrans";
import type { MarketplaceListing, MarketplaceListingService, PaymentMethod } from "@/types";
import { PaymentOptions, StepField } from "./request-task-form";
import { RequiredNote, inputClass, primaryButton, secondaryButton } from "./ui";

// Must match the backend's minimum task budget (createTaskInput.Budget).
const MINIMUM_ORDER = 15000;
const STEPS = ["Tempat & waktu", "Pembayaran", "Ringkasan"] as const;

/** Earliest schedule the picker allows: now, in the datetime-local format. */
function nowForPicker() {
  const now = new Date();
  now.setSeconds(0, 0);
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function formatSchedule(value: string) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "full", timeStyle: "short" }).format(new Date(value));
}

/**
 * Ordering flow for a service picked on a lapak page: the service name and
 * price come from the listing, so the buyer only chooses where/when,
 * how to pay, and confirms a summary before the order is sent.
 */
export function ServiceOrderForm({ listingId, serviceIndex }: { listingId: string; serviceIndex: number }) {
  const router = useRouter();
  const [listing, setListing] = useState<MarketplaceListing>();
  const [service, setService] = useState<MarketplaceListingService>();
  const [loadError, setLoadError] = useState("");
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [location, setLocation] = useState("");
  const [schedule, setSchedule] = useState("");
  const [note, setNote] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [method, setMethod] = useState<PaymentMethod>("online");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getMarketplaceListing(listingId)
      .then((loaded) => {
        const picked = loaded.services?.filter((item) => item.isActive)[serviceIndex];
        if (!picked) throw new Error("Jenis jasa ini sudah tidak tersedia. Silakan pilih jasa lain di halaman lapak.");
        if (!loaded.providerId) throw new Error("Lapak ini belum bisa menerima pesanan.");
        setListing(loaded);
        setService(picked);
      })
      .catch((cause: unknown) => setLoadError(cause instanceof Error ? cause.message : "Lapak gagal dimuat."));
    // Start from the buyer's saved address; they can still change it.
    getProfile()
      .then((profile) => setLocation((current) => current || profile.address || ""))
      .catch(() => undefined);
  }, [listingId, serviceIndex]);

  if (loadError) {
    return (
      <div className="mx-auto max-w-3xl rounded-[24px] bg-white p-6 shadow-2xl shadow-slate-950/20">
        <p role="alert" className="font-semibold text-red-700">{loadError}</p>
        <Link href={`/market/${encodeURIComponent(listingId)}`} className={`${secondaryButton} mt-5 rounded-full`}>
          Kembali ke lapak
        </Link>
      </div>
    );
  }
  if (!listing || !service) {
    return <p className="py-16 text-center font-semibold text-white">Memuat pesanan...</p>;
  }

  const unitLabel = serviceUnitLabels[service.unit] ?? service.unit;
  // "Sekali datang" is a flat visit fee, so it is always ordered once.
  const quantityAdjustable = service.unit !== "sekali_datang";
  const total = service.price * quantity;

  function validate(current: number) {
    if (current === 0) {
      if (!location.trim()) return "Tempat pengerjaan wajib diisi.";
      if (location.trim().length > 200) return "Tempat pengerjaan maksimal 200 karakter.";
      if (!schedule) return "Jadwal wajib diisi.";
      if (new Date(schedule).getTime() < Date.now()) return "Jadwal harus di waktu yang akan datang.";
    }
    if (current === 2 && total < MINIMUM_ORDER) {
      return `Total pesanan minimal ${rupiah(MINIMUM_ORDER)}.${quantityAdjustable ? " Tambah jumlah pesanan." : ""}`;
    }
    return "";
  }

  function go(next: number) {
    if (next > step) {
      const message = validate(step);
      if (message) {
        setError(message);
        return;
      }
    }
    setError("");
    setDirection(next > step ? "forward" : "backward");
    setStep(next);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!listing || !service) return;
    const message = validate(0) || validate(2);
    if (message) {
      setError(message);
      return;
    }
    if (method === "online" && !midtransClientKey) {
      setError("Pembayaran online belum dikonfigurasi. Hubungi admin atau pilih tunai.");
      return;
    }
    setLoading(true);
    setError("");
    const orderLine = `Pesanan jasa "${service.name}" dari ${listing.name}: ${quantity} × ${rupiah(service.price)} (${unitLabel}) = ${rupiah(total)}.`;
    try {
      const { task, payment } = await createTask({
        title: `${service.name} - ${listing.name}`.slice(0, 160),
        location: location.trim(),
        budget: total,
        schedule: new Date(schedule).toISOString(),
        note: (note.trim() ? `${orderLine}\n\nCatatan pembeli: ${note.trim()}` : orderLine).slice(0, 2000),
        providerId: listing.providerId,
        marketplaceListingId: listing.id,
        method,
      });
      if (method === "online") {
        const open = () => router.push(`/tasks/${task.id}`);
        if (payment?.snapToken && window.snap) {
          window.snap.pay(payment.snapToken, { onSuccess: open, onPending: open, onError: open, onClose: open });
        } else {
          open();
        }
        return;
      }
      router.push(`/task-submitted?task=${encodeURIComponent(task.id)}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Pesanan gagal dikirim.");
      setLoading(false);
    }
  }

  const last = step === STEPS.length - 1;

  return (
    <form onSubmit={submit} className="pb-20">
      <Script src={midtransSnapScriptUrl} data-client-key={midtransClientKey} strategy="afterInteractive" />
      <div className="mx-auto max-w-3xl">
        <div className="mb-5 flex items-center justify-between text-sm font-bold text-blue-50">
          <span>
            Langkah {step + 1} dari {STEPS.length} · {STEPS[step]}
          </span>
          <div className="flex gap-2">
            {STEPS.map((label, index) => (
              <span
                key={label}
                className={`size-2.5 rounded-full transition-all duration-300 ${index === step ? "scale-125 bg-white" : index < step ? "bg-sky-200" : "bg-white/35"}`}
              />
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-[24px] border border-white/70 bg-white p-5 shadow-2xl shadow-slate-950/20 md:p-8">
          <RequiredNote className="mb-4" />
          <div className="mb-6 flex items-start justify-between gap-3 rounded-2xl bg-blue-50 p-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-blue-800">{listing.name}</p>
              <p className="truncate font-bold text-slate-950">{service.name}</p>
            </div>
            <p className="shrink-0 text-right text-sm font-bold text-slate-950">
              {rupiah(service.price)}
              <span className="block text-xs font-normal text-slate-500">{unitLabel}</span>
            </p>
          </div>

          <div key={step} className={direction === "forward" ? "wizard-slide-forward" : "wizard-slide-backward"}>
            {step === 0 && (
              <fieldset className="space-y-5">
                <StepField label="Tempat pengerjaan" helper="Diisi dari alamat di profil Anda. Ubah jika pengerjaan di tempat lain.">
                  <input
                    value={location}
                    onChange={(event) => {
                      setLocation(event.target.value);
                      setError("");
                    }}
                    maxLength={200}
                    className={inputClass}
                    placeholder="Alamat lengkap atau patokan lokasi"
                  />
                </StepField>
                <StepField label="Jadwal yang diinginkan">
                  <input
                    type="datetime-local"
                    value={schedule}
                    min={nowForPicker()}
                    onChange={(event) => {
                      setSchedule(event.target.value);
                      setError("");
                    }}
                    className={inputClass}
                  />
                </StepField>
                <StepField label="Catatan untuk penjual" required={false} helper="Misalnya ukuran, kondisi barang, atau permintaan khusus.">
                  <textarea
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    rows={3}
                    maxLength={1500}
                    className={`${inputClass} py-3`}
                    placeholder="Opsional"
                  />
                </StepField>
              </fieldset>
            )}

            {step === 1 && <PaymentOptions method={method} setMethod={setMethod} />}

            {step === 2 && (
              <section aria-labelledby="order-summary-title">
                <h2 id="order-summary-title" className="mb-4 font-[var(--font-manrope)] text-2xl font-extrabold text-slate-950">
                  Ringkasan pesanan
                </h2>
                <dl className="divide-y divide-slate-100 rounded-2xl border border-slate-200 text-sm">
                  <SummaryRow label="Jasa" value={service.name} />
                  <SummaryRow label="Lapak" value={listing.name} />
                  <SummaryRow label="Harga" value={`${rupiah(service.price)} ${unitLabel}`} />
                  {quantityAdjustable && (
                    <div className="flex items-center justify-between gap-3 px-4 py-3">
                      <dt className="text-slate-500">Jumlah</dt>
                      <dd className="flex items-center gap-3">
                        <button
                          type="button"
                          aria-label="Kurangi jumlah"
                          disabled={quantity <= 1}
                          onClick={() => {
                            setQuantity((current) => Math.max(1, current - 1));
                            setError("");
                          }}
                          className="grid size-9 cursor-pointer place-items-center rounded-full border border-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Minus className="size-4" />
                        </button>
                        <span className="min-w-6 text-center font-bold text-slate-950" aria-live="polite">{quantity}</span>
                        <button
                          type="button"
                          aria-label="Tambah jumlah"
                          disabled={quantity >= 99}
                          onClick={() => {
                            setQuantity((current) => Math.min(99, current + 1));
                            setError("");
                          }}
                          className="grid size-9 cursor-pointer place-items-center rounded-full border border-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Plus className="size-4" />
                        </button>
                      </dd>
                    </div>
                  )}
                  <SummaryRow label="Tempat" value={location.trim()} />
                  <SummaryRow label="Jadwal" value={schedule ? formatSchedule(schedule) : "-"} />
                  {note.trim() && <SummaryRow label="Catatan" value={note.trim()} />}
                  <SummaryRow label="Pembayaran" value={method === "online" ? "Bayar online" : "Bayar tunai saat bertemu"} />
                  <div className="flex items-center justify-between gap-3 bg-slate-50 px-4 py-4">
                    <dt className="font-bold text-slate-950">Total</dt>
                    <dd className="text-lg font-extrabold text-slate-950">{rupiah(total)}</dd>
                  </div>
                </dl>
                {total < MINIMUM_ORDER && (
                  <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-800">
                    Total pesanan minimal {rupiah(MINIMUM_ORDER)}.
                    {quantityAdjustable ? " Tambah jumlah pesanan untuk melanjutkan." : " Hubungi penjual lewat chat untuk pesanan ini."}
                  </p>
                )}
                <p className="mt-3 text-xs leading-5 text-slate-500">
                  {method === "online"
                    ? "Setelah dikirim, Anda akan diarahkan ke halaman pembayaran. Dana ditahan platform dan dicairkan saat jasa selesai."
                    : "Pesanan dikirim ke penjual untuk dikonfirmasi. Pembayaran dilakukan tunai saat bertemu."}
                </p>
              </section>
            )}
          </div>

          {error && <p role="alert" className="mt-4 text-sm font-semibold text-red-700">{error}</p>}

          <div className="mt-8 flex items-center justify-between gap-3 border-t border-slate-200 pt-5">
            {step > 0 ? (
              <button type="button" onClick={() => go(step - 1)} className={`${secondaryButton} rounded-full`}>
                Kembali
              </button>
            ) : (
              <span />
            )}
            {/* Distinct keys make React mount a new element instead of turning the
                clicked "Lanjut" button into a submit button mid-click, which
                would make the browser submit the order on entering the summary. */}
            {last ? (
              <button
                key="submit"
                type="submit"
                disabled={loading || Boolean(validate(2))}
                className={`${primaryButton} rounded-full disabled:bg-slate-300 disabled:text-slate-500 sm:min-w-36`}
              >
                {loading && <LoaderCircle className="size-5 animate-spin" />}
                Kirim pesanan
              </button>
            ) : (
              <button
                key="next"
                type="button"
                onClick={() => go(step + 1)}
                disabled={Boolean(validate(step))}
                className={`${primaryButton} rounded-full disabled:bg-slate-300 disabled:text-slate-500 sm:min-w-36`}
              >
                Lanjut
              </button>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3">
      <dt className="shrink-0 text-slate-500">{label}</dt>
      <dd className="min-w-0 break-words text-right font-semibold text-slate-950">{value}</dd>
    </div>
  );
}
