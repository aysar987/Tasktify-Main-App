"use client";

import { ArrowRight, Banknote, Check, CreditCard, LoaderCircle } from "lucide-react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { createTask } from "@/lib/api";
import { midtransClientKey, midtransSnapScriptUrl } from "@/lib/midtrans";
import type { PaymentMethod } from "@/types";
import { inputClass, primaryButton, secondaryButton } from "./ui";

export function RequestTaskForm({ providerId }: { providerId?: string }) {
  const router = useRouter();
  const [method, setMethod] = useState<PaymentMethod>("online");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    if (method === "online" && !midtransClientKey) {
      setError("Pembayaran online belum dikonfigurasi. Hubungi admin atau pilih tunai.");
      setLoading(false);
      return;
    }
    const form = new FormData(event.currentTarget);
    try {
      const { task, payment } = await createTask({
        title: String(form.get("title")),
        category: "Umum",
        location: String(form.get("location")),
        budget: Number(form.get("budget")),
        schedule: new Date(String(form.get("schedule"))).toISOString(),
        note: String(form.get("note")),
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
  };
  return (
    <form onSubmit={submit} className="grid gap-6 xl:grid-cols-[1fr_340px]">
      <Script src={midtransSnapScriptUrl} data-client-key={midtransClientKey} strategy="afterInteractive" />
      <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 md:p-7">
        <fieldset className="space-y-5"><legend className="font-[var(--font-manrope)] text-xl font-extrabold">Detail pekerjaan</legend>
          {providerId && <p className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm font-semibold text-blue-700">Task ini akan dikirim langsung ke penyedia yang Anda pilih dari halaman Cari Penyedia.</p>}
          {!providerId && <p className="rounded-xl border border-orange-200 bg-orange-50 p-3 text-sm font-semibold text-orange-700">Task ini akan dipublikasikan ke marketplace agar bisa langsung diambil penyedia mana pun sesuai harga yang Anda tetapkan.</p>}
          <label className="block text-sm font-bold text-slate-700">Nama task <span className="text-red-600">*</span><input name="title" className={inputClass} required placeholder="Contoh: Perbaiki pipa wastafel bocor" /></label>
          <label className="block text-sm font-bold text-slate-700">Lokasi <span className="text-red-600">*</span><input name="location" className={inputClass} required placeholder="Alamat pengerjaan" /></label>
          <label className="block text-sm font-bold text-slate-700">Biaya (min Rp 15.000) <span className="text-red-600">*</span><input name="budget" type="number" min="15000" className={inputClass} required placeholder="Rp 500000" /><span className="mt-2 block text-xs font-normal text-slate-500"></span></label>
          <label className="block text-sm font-bold text-slate-700">Jadwal yang diinginkan <span className="text-red-600">*</span><input name="schedule" type="datetime-local" className={inputClass} required /></label>
          <label className="block text-sm font-bold text-slate-700">Catatan pekerjaan <span className="text-red-600">*</span><textarea name="note" rows={6} className={`${inputClass} py-3`} required placeholder="Jelaskan masalah, kondisi lokasi, dan hasil yang Anda harapkan..." /><span className="mt-2 block text-xs font-normal text-slate-500">Semakin detail catatan Anda, semakin cepat penyedia yang tepat mengambil task ini.</span></label>
        </fieldset>
        <fieldset className="space-y-3 border-t border-slate-200 pt-6">
          <legend className="font-[var(--font-manrope)] text-xl font-extrabold">Metode pembayaran</legend>
          <p className="text-sm text-slate-500">Biaya task akan langsung ditagihkan saat Anda mengirim permintaan ini.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setMethod("online")}
              aria-pressed={method === "online"}
              className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${method === "online" ? "border-orange-600 bg-orange-50 ring-4 ring-orange-100" : "border-slate-300 bg-white hover:border-slate-400"}`}
            >
              <CreditCard className="size-5 shrink-0 text-orange-600" />
              <span>
                <strong className="block text-sm">Bayar online</strong>
                <span className="mt-0.5 block text-xs text-slate-500">Ditahan platform, dicairkan ke penyedia saat task selesai</span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => setMethod("cash")}
              aria-pressed={method === "cash"}
              className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${method === "cash" ? "border-orange-600 bg-orange-50 ring-4 ring-orange-100" : "border-slate-300 bg-white hover:border-slate-400"}`}
            >
              <Banknote className="size-5 shrink-0 text-orange-600" />
              <span>
                <strong className="block text-sm">Bayar tunai</strong>
                <span className="mt-0.5 block text-xs text-slate-500">Dibayar langsung ke penyedia saat bertemu</span>
              </span>
            </button>
          </div>
        </fieldset>
        {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p>}
        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end"><button type="button" onClick={() => router.back()} className={secondaryButton}>Batalkan</button><button type="submit" disabled={loading} className={primaryButton}>{loading ? <LoaderCircle className="size-5 animate-spin" /> : <ArrowRight className="size-5" />} {method === "online" ? "Kirim & bayar online" : "Kirim permintaan"}</button></div>
      </div>
      <aside className="h-fit rounded-2xl border border-orange-200 bg-orange-50 p-6 xl:sticky xl:top-28"><h2 className="font-[var(--font-manrope)] text-lg font-extrabold">Sebelum mengirim</h2><ul className="mt-4 space-y-4">{["Pastikan lokasi pengerjaan akurat", "Tentukan harga yang realistis", "Jangan cantumkan data sensitif", "Anda dapat membatalkan sebelum task diterima"].map((item) => <li key={item} className="flex gap-3 text-sm leading-6 text-slate-700"><span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-orange-600 text-white"><Check className="size-3" /></span>{item}</li>)}</ul></aside>
    </form>
  );
}
