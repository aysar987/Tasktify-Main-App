"use client";

import { Ban, Banknote, Check, Flag, MessageSquareText, Play, Star, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ApiError, cancelTask, getPayment, getTask, getTaskRating, rateTask, subscribePayment, transitionTask } from "@/lib/api";
import { rupiah } from "@/lib/format";
import type { Payment, Rating, TaskStatus } from "@/types";
import { primaryButton, secondaryButton } from "./ui";

const SUPPORT_EMAIL = "admin@tasktify.id";
const PAID_STATUSES = ["settlement", "capture", "released"];

export function TaskActions({
  taskId,
  status: initialStatus,
  perspective: initialPerspective,
  providerId: initialProviderId,
  onStatus,
  completed,
  cancelled,
  onCancelled,
}: {
  taskId: string;
  status?: TaskStatus;
  perspective?: "client" | "provider";
  providerId?: string;
  onStatus?: (status: TaskStatus) => void;
  completed?: boolean;
  cancelled?: boolean;
  onCancelled?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(false);
  const [status, setStatus] = useState<TaskStatus>(
    initialStatus ??
      (completed ? "history" : cancelled ? "cancelled" : "waiting"),
  );
  const [perspective, setPerspective] = useState<"client" | "provider">(
    initialPerspective ?? "client",
  );
  const [providerId, setProviderId] = useState(initialProviderId);
  const [existingRating, setExistingRating] = useState<Rating>();
  const [task, setTask] = useState<{ title: string; budget: number; clientName?: string }>();
  // undefined while loading, null when the task has no payment record.
  const [payment, setPayment] = useState<Payment | null>();
  const [cashSheetOpen, setCashSheetOpen] = useState(false);
  const [hint, setHint] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    getTask(taskId)
      .then((task) => {
        setStatus(task.status);
        setPerspective(task.perspective === "provider" ? "provider" : "client");
        setProviderId(task.provider?.id);
        setTask({ title: task.title, budget: task.budget, clientName: task.clientName });
        if (task.status === "history" && task.provider) {
          getTaskRating(taskId).then(setExistingRating).catch(() => undefined);
        }
      })
      .catch(() => undefined);
  }, [taskId]);
  useEffect(() => {
    getPayment(taskId).then((value) => setPayment(value ?? null)).catch(() => undefined);
    return subscribePayment(taskId, setPayment);
  }, [taskId]);
  // Opens this task's conversation; the chat's back button returns to this task.
  const chatHref = `/chat?task=${encodeURIComponent(taskId)}`;
  if (status === "cancelled" || status === "rejected")
    return (
      <div className="grid gap-3">
        <div
          role="status"
          className="rounded-xl border border-red-200 bg-red-50 p-4 font-semibold text-red-700"
        >
          Task tidak aktif.
        </div>
        {/* The assigned provider opens the chat from the "Pemberi task" card. */}
        {providerId && perspective !== "provider" && (
          <a href={chatHref} className={`${secondaryButton} w-full`}>
            <MessageSquareText className="size-5" /> Lihat percakapan
          </a>
        )}
      </div>
    );

  const paid = Boolean(payment && PAID_STATUSES.includes(payment.status));
  const onlineUnpaid = payment?.method === "online" && !paid;
  // Cash still to be confirmed. Older tasks without a payment record are settled in cash too.
  const cashToConfirm = payment !== undefined && !paid && (payment === null || (payment.method === "cash" && payment.status === "pending"));

  function changed(next: TaskStatus) {
    setStatus(next);
    onStatus?.(next);
    if (next === "cancelled") onCancelled?.();
  }
  function showError(cause: unknown, fallback: string) {
    setError(cause instanceof Error ? cause.message : fallback);
  }
  async function cancel() {
    if (!window.confirm("Batalkan task ini?")) return;
    setLoading(true);
    setError("");
    try {
      await cancelTask(taskId);
      changed("cancelled");
    } catch (cause) {
      showError(cause, "Task gagal dibatalkan.");
    } finally {
      setLoading(false);
    }
  }
  async function transition(
    action: "accept" | "reject" | "start" | "complete",
    next: TaskStatus,
    options: { cashReceived?: boolean } = {},
  ) {
    setLoading(true);
    setError("");
    try {
      await transitionTask(taskId, action, options);
      changed(next);
      if (action === "complete") {
        setCashSheetOpen(false);
        setHint("");
        getPayment(taskId).then((value) => setPayment(value ?? null)).catch(() => undefined);
      }
    } catch (cause) {
      // The payment may have changed since this page loaded: ask for the cash confirmation now.
      if (cause instanceof ApiError && cause.code === "CASH_CONFIRMATION_REQUIRED") {
        setCashSheetOpen(true);
      } else {
        setCashSheetOpen(false);
        showError(cause, "Status task gagal diperbarui.");
      }
    } finally {
      setLoading(false);
    }
  }
  function finish() {
    setHint("");
    if (cashToConfirm) setCashSheetOpen(true);
    else void transition("complete", "history");
  }
  function notYetPaid() {
    setCashSheetOpen(false);
    setHint("Selesaikan task setelah pembayaran diterima.");
  }
  async function submitRating(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!providerId) return;
    const form = new FormData(event.currentTarget);
    setLoading(true);
    setError("");
    try {
      await rateTask(
        taskId,
        providerId,
        Number(form.get("score")),
        String(form.get("review")),
      );
      setExistingRating(await getTaskRating(taskId));
      setRating(false);
    } catch (cause) {
      showError(cause, "Rating gagal dikirim.");
    } finally {
      setLoading(false);
    }
  }
  const errorBox = error && (
    <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
      {error}
    </p>
  );

  if (perspective === "provider") {
    if (status === "waiting")
      return (
        <div className="grid gap-3">
          {errorBox}
          <button
            disabled={loading}
            onClick={() => transition("accept", "scheduled")}
            className={`${primaryButton} w-full`}
          >
            <Check className="size-5" /> Terima task
          </button>
          <button
            disabled={loading}
            onClick={() => transition("reject", "rejected")}
            className={`${secondaryButton} w-full border-red-200 text-red-700`}
          >
            <X className="size-5" /> Tolak task
          </button>
        </div>
      );
    if (status === "scheduled")
      return (
        <div className="grid gap-3">
          {errorBox}
          <button
            disabled={loading}
            onClick={() => transition("start", "ongoing")}
            className={`${primaryButton} w-full`}
          >
            <Play className="size-5" /> Mulai pekerjaan
          </button>
          <button
            disabled={loading}
            onClick={cancel}
            className={`${secondaryButton} w-full border-red-200 text-red-700`}
          >
            <Ban className="size-5" /> Batalkan task
          </button>
        </div>
      );
    if (status === "ongoing")
      return (
        <div className="grid gap-3">
          {errorBox}
          <button
            disabled={loading || payment === undefined || onlineUnpaid}
            onClick={finish}
            aria-describedby={onlineUnpaid ? "finish-blocked-reason" : hint ? "finish-hint" : undefined}
            className={`${primaryButton} w-full`}
          >
            <Check className="size-5" /> Tandai selesai
          </button>
          {onlineUnpaid && (
            <p id="finish-blocked-reason" className="text-sm leading-6 text-slate-600">
              Pembayaran online dari client belum lunas. Task bisa ditandai selesai setelah pembayaran dikonfirmasi.
            </p>
          )}
          {hint && (
            <p id="finish-hint" role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-800">
              {hint}
            </p>
          )}
          {cashSheetOpen && (
            <CashConfirmSheet
              amount={task?.budget ?? payment?.amount ?? 0}
              clientName={task?.clientName}
              loading={loading}
              onConfirm={() => transition("complete", "history", { cashReceived: true })}
              onCancel={notYetPaid}
            />
          )}
        </div>
      );
    // Finished: the chat is in the "Pemberi task" card.
    return errorBox || null;
  }

  // Client: after the provider finished a cash task, show what was confirmed and how to dispute it.
  const cashConfirmedNotice = status === "history" && payment?.method === "cash" && payment.cashConfirmedAt && (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="flex items-center gap-2 text-sm font-bold text-slate-900">
        <Banknote className="size-4 text-emerald-600" /> Selesai dan dibayar tunai
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Penyedia menandai task ini selesai dan pembayaran tunai {rupiah(payment.amount)} diterima pada{" "}
        {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(payment.cashConfirmedAt))}.
      </p>
      <a
        href={reportMailto(taskId, task?.title, payment.amount)}
        className="mt-3 inline-flex min-h-10 items-center gap-2 text-sm font-bold text-red-700 hover:underline"
      >
        <Flag className="size-4" /> Laporkan masalah
      </a>
      <p className="text-xs leading-5 text-slate-500">Gunakan jika Anda belum membayar atau pekerjaan belum selesai.</p>
    </section>
  );

  if (status === "history" && providerId)
    return (
      <div className="grid gap-3">
        {errorBox}
        {cashConfirmedNotice}
        <a href={chatHref} className={`${secondaryButton} w-full`}>
          <MessageSquareText className="size-5" /> Hubungi penyedia
        </a>
        {existingRating ? (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-bold text-slate-700">Rating Anda</p>
            <div className="mt-2 flex items-center gap-1" aria-label={`Rating ${existingRating.score} dari 5`}>
              {Array.from({ length: 5 }, (_, index) => (
                <Star key={index} className={`size-4 ${index < existingRating.score ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />
              ))}
            </div>
            {existingRating.review && <p className="mt-2 text-sm leading-6 text-slate-600">{existingRating.review}</p>}
          </div>
        ) : rating ? (
          <form
            onSubmit={submitRating}
            className="space-y-3 rounded-xl border border-slate-200 bg-white p-4"
          >
            <label className="block text-sm font-bold">
              Rating
              <select
                name="score"
                className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 px-3"
              >
                <option value="5">5 - Sangat baik</option>
                <option value="4">4 - Baik</option>
                <option value="3">3 - Cukup</option>
                <option value="2">2 - Kurang</option>
                <option value="1">1 - Buruk</option>
              </select>
            </label>
            <label className="block text-sm font-bold">
              Ulasan
              <textarea
                name="review"
                placeholder="Ceritakan pengalaman Anda dengan penyedia..."
                className="mt-2 w-full rounded-lg border border-slate-300 p-3"
                rows={3}
              />
            </label>
            <button disabled={loading} className={`${primaryButton} w-full`}>
              Kirim rating
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setRating(true)}
            className={`${primaryButton} w-full`}
          >
            <Star className="size-5" /> Beri rating
          </button>
        )}
      </div>
    );
  return (
    <div className="grid gap-3">
      {errorBox}
      {providerId && (
        <a href={chatHref} className={`${primaryButton} w-full`}>
          <MessageSquareText className="size-5" /> Hubungi penyedia
        </a>
      )}
      {(status === "awaiting_payment" || status === "waiting" || status === "scheduled") && (
        <button
          disabled={loading}
          type="button"
          onClick={cancel}
          className={`${secondaryButton} w-full border-red-200 text-red-700 hover:bg-red-50`}
        >
          <Ban className="size-5" /> Batalkan task
        </button>
      )}
    </div>
  );
}

function reportMailto(taskId: string, title: string | undefined, amount: number) {
  const subject = `Laporan masalah task ${taskId}`;
  const body = [
    `Task: ${taskId}${title ? ` - ${title}` : ""}`,
    `Pembayaran tunai: ${rupiah(amount)}`,
    "",
    "Jelaskan masalahnya (misalnya: belum membayar, pekerjaan belum selesai):",
    "",
  ].join("\n");
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/** Bottom sheet asking the provider to confirm the cash payment before finishing. */
function CashConfirmSheet({
  amount,
  clientName,
  loading,
  onConfirm,
  onCancel,
}: {
  amount: number;
  clientName?: string;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const confirmRef = useRef<HTMLButtonElement | null>(null);
  const cancelRef = useRef(onCancel);
  useEffect(() => {
    cancelRef.current = onCancel;
  });
  useEffect(() => {
    confirmRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") cancelRef.current();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/50 sm:items-center sm:p-4" onClick={onCancel}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cash-confirm-title"
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-md rounded-t-3xl bg-white p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-2xl sm:rounded-3xl sm:pb-6"
      >
        <span className="mx-auto mb-5 block h-1.5 w-12 rounded-full bg-slate-200 sm:hidden" aria-hidden="true" />
        <span className="grid size-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
          <Banknote className="size-6" />
        </span>
        <h2 id="cash-confirm-title" className="mt-4 font-[var(--font-manrope)] text-xl font-extrabold text-slate-950">
          Sudah terima pembayaran tunai {rupiah(amount)} dari {clientName || "client"}?
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Task akan ditandai selesai dan pembayaran dicatat lunas sekaligus.
        </p>
        <div className="mt-6 grid gap-3">
          <button ref={confirmRef} type="button" disabled={loading} onClick={onConfirm} className={`${primaryButton} w-full`}>
            <Check className="size-5" /> Ya, sudah diterima
          </button>
          <button type="button" disabled={loading} onClick={onCancel} className={`${secondaryButton} w-full`}>
            Belum
          </button>
        </div>
      </div>
    </div>
  );
}
