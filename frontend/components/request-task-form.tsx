"use client";

import { Banknote, CreditCard, ImagePlus, LoaderCircle } from "lucide-react";
import Image from "next/image";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { createTask } from "@/lib/api";
import { TASK_LIMITS, taskLabel, validateTaskField } from "@/lib/forms/task";
import { rupiah } from "@/lib/format";
import { midtransClientKey, midtransSnapScriptUrl } from "@/lib/midtrans";
import type { PaymentMethod } from "@/types";
import { FieldLabelText, RequiredNote, inputClass, primaryButton, secondaryButton } from "./ui";

type TaskFields = { title: string; location: string; budget: string; schedule: string; note: string };
const initialFields: TaskFields = { title: "", location: "", budget: "", schedule: "", note: "" };
const REVIEW_STEP = 7;
const PAYMENT_STEP = 8;
const TOTAL_STEPS = PAYMENT_STEP;

function formatSchedule(value: string) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "full", timeStyle: "short" }).format(new Date(value));
}

export function RequestTaskForm({ providerId }: { providerId?: string }) {
  const router = useRouter();
  const [method, setMethod] = useState<PaymentMethod>("online");
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [fields, setFields] = useState<TaskFields>(initialFields);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const update = (name: keyof TaskFields, value: string) => {
    setFields((current) => ({ ...current, [name]: value }));
    setError("");
  };

  function pickImage(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setImage(file);
    setImagePreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return file ? URL.createObjectURL(file) : "";
    });
  }

  // Rules (required flags, limits) live in lib/forms/task.ts and match the backend.
  function validate(current: number) {
    if (current === 1) return validateTaskField("title", fields.title);
    if (current === 2) return validateTaskField("location", fields.location);
    if (current === 3) return validateTaskField("budget", fields.budget);
    if (current === 4) return validateTaskField("schedule", fields.schedule);
    if (current === 5) return validateTaskField("note", fields.note);
    return "";
  }

  // Before sending, re-check every step (a field may have been changed via "Ubah").
  function firstInvalidStep() {
    for (const current of [1, 2, 3, 4, 5]) {
      const message = validate(current);
      if (message) return { step: current, message };
    }
    return undefined;
  }

  function next() {
    const message = validate(step);
    if (message) {
      setError(message);
      return;
    }
    setError("");
    setDirection("forward");
    setStep((current) => Math.min(current + 1, TOTAL_STEPS));
  }

  function previous() {
    setError("");
    setDirection("backward");
    setStep((current) => Math.max(current - 1, 1));
  }

  // Jump back from the review step to fix a single field.
  function editStep(target: number) {
    setError("");
    setDirection("backward");
    setStep(target);
  }

  const budget = Number(fields.budget) || 0;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Enter in a field submits the form; only send from the payment step so the
    // review and payment choice can never be skipped.
    if (step !== PAYMENT_STEP) {
      next();
      return;
    }
    const invalid = firstInvalidStep();
    if (invalid) {
      // Go back to the step with the problem; everything typed stays as it is.
      editStep(invalid.step);
      setError(invalid.message);
      return;
    }
    setLoading(true);
    setError("");
    if (method === "online" && !midtransClientKey) {
      setError("Pembayaran online belum dikonfigurasi. Hubungi admin atau pilih tunai.");
      setLoading(false);
      return;
    }
    try {
      const { task, payment } = await createTask({
        title: fields.title,
        location: fields.location,
        budget: Number(fields.budget),
        schedule: new Date(fields.schedule).toISOString(),
        note: fields.note,
        providerId,
        method,
        image: image ?? undefined,
      });
      if (method === "online" && payment?.snapToken && window.snap) {
        window.snap.pay(payment.snapToken, {
          onSuccess: () => router.push(`/tasks/${task.id}`),
          onPending: () => router.push(`/tasks/${task.id}`),
          onError: () => router.push(`/tasks/${task.id}`),
          onClose: () => router.push(`/tasks/${task.id}`),
        });
        return;
      }
      if (method === "online") {
        router.push(`/tasks/${task.id}`);
        return;
      }
      router.push(`/task-submitted?task=${encodeURIComponent(task.id)}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Task gagal dikirim.");
      setLoading(false);
    }
  }

  const fieldProps = (name: keyof TaskFields) => ({
    name,
    value: fields[name],
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => update(name, event.target.value),
  });

  return (
    <form onSubmit={submit} className="pb-20">
      <Script src={midtransSnapScriptUrl} data-client-key={midtransClientKey} strategy="afterInteractive" />
      <div className="mx-auto max-w-3xl">
        <div className="mb-5 flex items-center justify-between text-sm font-bold text-blue-50">
          <span>Langkah {step} dari {TOTAL_STEPS}</span>
          <div className="flex gap-2">
            {Array.from({ length: TOTAL_STEPS }, (_, index) => index + 1).map((item) => (
              <span
                key={item}
                className={`size-2.5 rounded-full transition-all duration-300 ${item === step ? "scale-125 bg-white" : item < step ? "bg-sky-200" : "bg-white/35"}`}
              />
            ))}
          </div>
        </div>
        <div className="overflow-hidden rounded-[24px] border border-white/70 bg-white p-5 shadow-2xl shadow-slate-950/20 md:p-8">
          <RequiredNote className="mb-4" />
          <div key={step} className={direction === "forward" ? "wizard-slide-forward" : "wizard-slide-backward"}>
            <div className="flex flex-col">
              <fieldset className="flex-1">
                {step === 1 && (
                  <StepField {...taskLabel("title")}>
                    <input {...fieldProps("title")} required maxLength={TASK_LIMITS.titleMax} className={inputClass} placeholder="Contoh: Perbaiki pipa wastafel bocor" autoFocus />
                  </StepField>
                )}
                {step === 2 && (
                  <StepField {...taskLabel("location")}>
                    <input {...fieldProps("location")} required maxLength={TASK_LIMITS.locationMax} className={inputClass} placeholder="Alamat pengerjaan" autoFocus />
                  </StepField>
                )}
                {step === 3 && (
                  <StepField {...taskLabel("budget")} helper="Minimal Rp15.000, kelipatan Rp500">
                    <input {...fieldProps("budget")} required type="number" min={TASK_LIMITS.budgetMin} step={TASK_LIMITS.budgetStep} className={inputClass} placeholder="Rp 500000" autoFocus />
                  </StepField>
                )}
                {step === 4 && (
                  <StepField {...taskLabel("schedule")}>
                    <input {...fieldProps("schedule")} required type="datetime-local" className={inputClass} autoFocus />
                  </StepField>
                )}
                {step === 5 && (
                  <StepField {...taskLabel("note")} helper="Semakin detail catatan Anda, semakin cepat penyedia yang tepat mengambil task ini.">
                    <textarea {...fieldProps("note")} required maxLength={TASK_LIMITS.noteMax} rows={5} className={`${inputClass} py-3`} placeholder="Jelaskan masalah, kondisi lokasi, dan hasil yang Anda harapkan..." autoFocus />
                  </StepField>
                )}
                {step === 6 && (
                  <StepField {...taskLabel("image")} helper="Bantu penyedia memahami kondisi pekerjaan lewat foto.">
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
                  </StepField>
                )}
                {step === REVIEW_STEP && (
                  <section aria-labelledby="task-review-title">
                    <h2 id="task-review-title" className="mb-1 font-[var(--font-manrope)] text-2xl font-extrabold text-slate-950">
                      Ringkasan pesanan
                    </h2>
                    <p className="mb-4 text-sm font-normal text-slate-500">Periksa kembali task Anda sebelum memilih pembayaran.</p>
                    {imagePreview && (
                      <span className="relative mb-4 block h-40 w-full overflow-hidden rounded-2xl border border-slate-200">
                        <Image src={imagePreview} alt="Foto task" fill className="object-cover" unoptimized />
                      </span>
                    )}
                    <dl className="divide-y divide-slate-100 rounded-2xl border border-slate-200 text-sm">
                      <ReviewRow label="Nama task" value={fields.title.trim()} onEdit={() => editStep(1)} />
                      <ReviewRow label="Lokasi" value={fields.location.trim()} onEdit={() => editStep(2)} />
                      <ReviewRow label="Jadwal" value={fields.schedule ? formatSchedule(fields.schedule) : "-"} onEdit={() => editStep(4)} />
                      <ReviewRow label="Catatan" value={fields.note.trim()} onEdit={() => editStep(5)} />
                      <ReviewRow label="Foto" value={image ? image.name : "Tidak ada foto"} onEdit={() => editStep(6)} />
                      <ReviewRow label="Subtotal" value={rupiah(budget)} onEdit={() => editStep(3)} />
                      <div className="flex items-center justify-between gap-3 rounded-b-2xl bg-slate-50 px-4 py-4">
                        <dt className="font-bold text-slate-950">Total</dt>
                        <dd className="text-lg font-extrabold text-slate-950">{rupiah(budget)}</dd>
                      </div>
                    </dl>
                  </section>
                )}
                {step === PAYMENT_STEP && (
                  <>
                    <PaymentOptions method={method} setMethod={setMethod} />
                    <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-4">
                      <span className="text-sm font-bold text-slate-950">Total pembayaran</span>
                      <strong className="text-lg font-extrabold text-slate-950">{rupiah(budget)}</strong>
                    </div>
                    <p className="mt-3 text-xs font-normal leading-5 text-slate-500">
                      {method === "online"
                        ? "Setelah dikirim, Anda akan diarahkan ke halaman pembayaran. Dana ditahan platform dan dicairkan saat task selesai."
                        : "Task langsung dipublikasikan ke penyedia. Pembayaran dilakukan tunai saat bertemu."}
                    </p>
                  </>
                )}
              </fieldset>
              {error && <p role="alert" className="mt-4 text-sm font-semibold text-red-700">{error}</p>}
              <div className="mt-8 flex items-center justify-between gap-3 border-t border-slate-200 pt-5">
                {step > 1 ? (
                  <button type="button" onClick={previous} className={`${secondaryButton} rounded-full`}>
                    Kembali
                  </button>
                ) : (
                  <span />
                )}
                {step < TOTAL_STEPS ? (
                  <button
                    type="button"
                    onClick={next}
                    className={`${primaryButton} rounded-full disabled:bg-slate-300 disabled:text-slate-500 sm:min-w-36`}
                  >
                    Lanjut
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className={`${primaryButton} rounded-full disabled:bg-slate-300 disabled:text-slate-500 sm:min-w-36`}
                  >
                    {loading && <LoaderCircle className="size-5 animate-spin" />}
                    Kirim
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

function ReviewRow({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3">
      <dt className="shrink-0 font-normal text-slate-500">{label}</dt>
      <dd className="flex min-w-0 items-start gap-3 text-right">
        <span className="min-w-0 break-words font-semibold text-slate-950">{value}</span>
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Ubah ${label.toLowerCase()}`}
          className="shrink-0 cursor-pointer text-xs font-bold text-orange-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200"
        >
          Ubah
        </button>
      </dd>
    </div>
  );
}

export function StepField({
  label,
  helper,
  required = true,
  children,
}: {
  label: string;
  helper?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm font-bold text-slate-700">
      <FieldLabelText label={label} required={required} />
      {children}
      {helper && <span className="mt-2 block text-xs font-normal leading-5 text-slate-500">{helper}</span>}
    </label>
  );
}

export function PaymentOptions({ method, setMethod }: { method: PaymentMethod; setMethod: (method: PaymentMethod) => void }) {
  return (
    <fieldset className="space-y-3">
      <legend className="mb-3 font-[var(--font-manrope)] text-2xl font-extrabold text-slate-950">Metode pembayaran</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setMethod("online")}
          aria-pressed={method === "online"}
          className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition ${method === "online" ? "border-orange-600 bg-orange-50 ring-4 ring-orange-100" : "border-slate-300 bg-white hover:border-slate-400"}`}
        >
          <CreditCard className="size-5 shrink-0 text-orange-600" />
          <span>
            <strong className="block text-sm">Bayar online</strong>
            <span className="mt-0.5 block text-xs font-normal text-slate-500">Ditahan platform, dicairkan saat task selesai</span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => setMethod("cash")}
          aria-pressed={method === "cash"}
          className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition ${method === "cash" ? "border-orange-600 bg-orange-50 ring-4 ring-orange-100" : "border-slate-300 bg-white hover:border-slate-400"}`}
        >
          <Banknote className="size-5 shrink-0 text-orange-600" />
          <span>
            <strong className="block text-sm">Bayar tunai</strong>
            <span className="mt-0.5 block text-xs font-normal text-slate-500">Dibayar langsung saat bertemu</span>
          </span>
        </button>
      </div>
    </fieldset>
  );
}
