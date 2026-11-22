"use client";

import { CalendarDays, Check, CircleDollarSign, LoaderCircle, MapPin } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { TaskGallery } from "@/components/task-photos";
import { Toast, useToast } from "@/components/toast";
import { VerificationGate } from "@/components/verification-gate";
import { PageHeader, primaryButton } from "@/components/ui";
import { ApiError, VERIFICATION_ERROR_CODES, claimTask, getOpenTask, getProfile } from "@/lib/api";
import { isConnectionError, userErrorMessage } from "@/lib/errors";
import { rupiah } from "@/lib/format";
import type { AccountVerification, Task } from "@/types";

export default function MarketplaceTaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [task, setTask] = useState<Task>();
  const [error, setError] = useState("");
  const [claiming, setClaiming] = useState(false);
  // Set when the task can no longer be taken (taken by someone else or cancelled).
  const [unavailable, setUnavailable] = useState("");
  const { toast, show: showToast, close: closeToast } = useToast();
  // Set when the account must be verified before taking tasks.
  const [gate, setGate] = useState<AccountVerification>();

  // An unverified account gets the verification screen instead of an error.
  function handleError(cause: unknown, fallback: string) {
    if (cause instanceof ApiError && cause.code && VERIFICATION_ERROR_CODES.includes(cause.code)) {
      getProfile()
        .then((profile) => setGate(profile.verification))
        .catch(() => setError(cause.message));
      return;
    }
    setError(cause instanceof Error ? cause.message : fallback);
  }

  useEffect(() => {
    getOpenTask(id)
      .then(setTask)
      .catch((cause: unknown) => handleError(cause, "Task gagal dimuat."));
  }, [id]);

  async function claim() {
    if (claiming) return;
    setClaiming(true);
    try {
      await claimTask(id);
      showToast("success", "Task berhasil diambil");
      router.push(`/tasks/${id}`);
    } catch (cause) {
      setClaiming(false);
      if (cause instanceof ApiError && cause.code && VERIFICATION_ERROR_CODES.includes(cause.code)) {
        handleError(cause, "Task gagal diambil.");
        return;
      }
      // The task stays on screen; the error is shown as a toast.
      const message = isConnectionError(cause)
        ? "Gagal mengambil task. Coba lagi."
        : userErrorMessage(cause, "Gagal mengambil task. Coba lagi.");
      // Taken by someone else or cancelled meanwhile (not "you already have an active task").
      if (cause instanceof ApiError && (cause.code === "NOT_FOUND" || cause.code === "CONFLICT")) {
        setUnavailable(message);
      }
      showToast("error", message);
    }
  }

  // After approval the notification brings the user back to this task.
  if (gate) return <VerificationGate verification={gate} returnTo={`/marketplace/${id}`} />;
  if (error)
    return (
      <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 font-semibold text-red-700">
        {error}
      </div>
    );
  if (!task) return <p className="py-16 text-center text-slate-500">Memuat detail task...</p>;

  return (
    <>
      <PageHeader eyebrow={task.id} title={task.title} description="Detail permintaan dari klien, siap diambil siapa cepat." backHref="/marketplace" />
      <TaskGallery images={task.images} />
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="font-[var(--font-manrope)] text-xl font-extrabold">Informasi task</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {[
              { icon: MapPin, label: "Area", value: task.location || "Ditampilkan setelah task diambil" },
              { icon: CalendarDays, label: "Jadwal", value: task.date },
              { icon: CircleDollarSign, label: "Anggaran", value: rupiah(task.budget) },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600">
                  <Icon className="size-5" />
                </span>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</span>
                  <strong className="mt-1 block text-sm">{value}</strong>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 border-t border-slate-200 pt-6">
            <h3 className="font-bold">Catatan</h3>
            <p className="mt-2 leading-7 text-slate-600">{task.note}</p>
          </div>
        </section>
        <aside className="h-fit space-y-4 rounded-2xl border border-orange-200 bg-orange-50 p-6 xl:sticky xl:top-28">
          <div>
            <span className="block text-xs text-slate-500">Harga tetap</span>
            <strong className="text-lg text-slate-950">{rupiah(task.budget)}</strong>
          </div>
          {unavailable ? (
            <p role="status" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
              {unavailable} Task ini tidak bisa diambil lagi.
            </p>
          ) : (
            <>
              <p className="text-sm leading-6 text-slate-600">Alamat lengkap dan kontak klien ditampilkan setelah Anda mengambil task ini.</p>
              <button type="button" disabled={claiming} onClick={claim} className={`${primaryButton} w-full`}>
                {claiming ? <LoaderCircle className="size-5 animate-spin" /> : <Check className="size-5" />} Ambil task ini
              </button>
            </>
          )}
        </aside>
        <Toast toast={toast} onClose={closeToast} />
      </div>
    </>
  );
}
