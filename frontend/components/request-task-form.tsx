"use client";

import { Banknote, CreditCard, LoaderCircle } from "lucide-react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { createTask } from "@/lib/api";
import { midtransClientKey, midtransSnapScriptUrl } from "@/lib/midtrans";
import type { PaymentMethod } from "@/types";
import { inputClass, primaryButton, secondaryButton } from "./ui";

type TaskFields = { title: string; location: string; budget: string; schedule: string; note: string };
const initialFields: TaskFields = { title: "", location: "", budget: "", schedule: "", note: "" };
const TOTAL_STEPS = 6;

export function RequestTaskForm({ providerId }: { providerId?: string }) {
  const router = useRouter();
  const [method, setMethod] = useState<PaymentMethod>("online");
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [fields, setFields] = useState<TaskFields>(initialFields);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const update = (name: keyof TaskFields, value: string) => {
    setFields((current) => ({ ...current, [name]: value }));
    setError("");
  };

  function validate(current: number) {
    if (current === 1 && !fields.title.trim()) return "Nama task wajib diisi.";
    if (current === 2 && !fields.location.trim()) return "Lokasi wajib diisi.";
    if (current === 3) {
      const budget = Number(fields.budget);
      if (!fields.budget || budget < 15000) return "Biaya minimal Rp15.000.";
      if (budget % 500 !== 0) return "Biaya harus diisi dengan kelipatan Rp500.";
    }
    if (current === 4 && !fields.schedule) return "Jadwal wajib diisi.";
    if (current === 5 && !fields.note.trim()) return "Catatan pekerjaan wajib diisi.";
    return "";
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

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = validate(5);
    if (message) {
      setError(message);
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
        category: "Umum",
        location: fields.location,
        budget: Number(fields.budget),
        schedule: new Date(fields.schedule).toISOString(),
        note: fields.note,
        providerId,
        method,
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
      router.push("/task-submitted");
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
          <div key={step} className={direction === "forward" ? "wizard-slide-forward" : "wizard-slide-backward"}>
            <div className="flex flex-col">
              <fieldset className="flex-1">
                {step === 1 && (
                  <StepField label="Nama task">
                    <input {...fieldProps("title")} className={inputClass} placeholder="Contoh: Perbaiki pipa wastafel bocor" autoFocus />
                  </StepField>
                )}
                {step === 2 && (
                  <StepField label="Lokasi">
                    <input {...fieldProps("location")} className={inputClass} placeholder="Alamat pengerjaan" autoFocus />
                  </StepField>
                )}
                {step === 3 && (
                  <StepField label="Biaya" helper="Biaya harus diisi dengan kelipatan Rp500">
                    <input {...fieldProps("budget")} type="number" min="15000" step="500" className={inputClass} placeholder="Rp 500000" autoFocus />
                  </StepField>
                )}
                {step === 4 && (
                  <StepField label="Jadwal yang diinginkan">
                    <input {...fieldProps("schedule")} type="datetime-local" className={inputClass} autoFocus />
                  </StepField>
                )}
                {step === 5 && (
                  <StepField label="Catatan pekerjaan" helper="Semakin detail catatan Anda, semakin cepat penyedia yang tepat mengambil task ini.">
                    <textarea {...fieldProps("note")} rows={5} className={`${inputClass} py-3`} placeholder="Jelaskan masalah, kondisi lokasi, dan hasil yang Anda harapkan..." autoFocus />
                  </StepField>
                )}
                {step === 6 && <PaymentOptions method={method} setMethod={setMethod} />}
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
                    disabled={Boolean(validate(step))}
                    className={`${primaryButton} rounded-full disabled:bg-slate-300 disabled:text-slate-500 sm:min-w-36`}
                  >
                    Lanjut
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading || Boolean(validate(step))}
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

function StepField({ label, helper, children }: { label: string; helper?: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-bold text-slate-700">
      {label} <span className="text-red-600">*</span>
      {children}
      {helper && <span className="mt-2 block text-xs font-normal leading-5 text-slate-500">{helper}</span>}
    </label>
  );
}

function PaymentOptions({ method, setMethod }: { method: PaymentMethod; setMethod: (method: PaymentMethod) => void }) {
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
