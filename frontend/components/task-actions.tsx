"use client";

import { Ban, Banknote, Check, Clock, Flag, LoaderCircle, MessageSquareText, Play, RotateCcw, Star, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ApiError, cancelTask, confirmTaskCompletion, getPayment, getTask, getTaskRating, rateTask, rejectTaskCompletion, subscribePayment, transitionTask } from "@/lib/api";
import { isConnectionError, userErrorMessage } from "@/lib/errors";
import { rupiah } from "@/lib/format";
import type { Payment, Rating, TaskStatus } from "@/types";
import { Toast, useToast } from "./toast";
import { inputClass, primaryButton, secondaryButton } from "./ui";

const SUPPORT_EMAIL = "admin@tasktify.id";
const PAID_STATUSES = ["settlement", "capture", "released"];
const ACTION_FAILED = "Gagal memperbarui task. Coba lagi.";
const STATUS_CHANGED = "Status task sudah berubah. Halaman diperbarui.";
// Same limits as the backend (task_confirmation.go).
const REOPEN_REASON_MIN = 5;
const REOPEN_REASON_MAX = 500;
const dateTimeFormat = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" });

// "confirm" and "reopen" are the client's answers to the provider's "complete".
type StatusAction = "cancel" | "accept" | "reject" | "start" | "complete" | "confirm" | "reopen";
type Action = StatusAction | "rate";

const NEXT_STATUS: Record<StatusAction, TaskStatus> = {
  cancel: "cancelled",
  accept: "scheduled",
  reject: "rejected",
  start: "ongoing",
  complete: "pending_confirmation",
  confirm: "history",
  reopen: "ongoing",
};
const SUCCESS_MESSAGE: Record<StatusAction, string> = {
  cancel: "Task dibatalkan",
  accept: "Task diterima",
  reject: "Task ditolak",
  start: "Pekerjaan dimulai",
  complete: "Task ditandai selesai. Menunggu konfirmasi klien.",
  confirm: "Task dikonfirmasi selesai",
  reopen: "Task dikembalikan ke penyedia",
};

/**
 * The server's message when it is written for users (validation, conflicts,
 * payment rules); otherwise - server errors, network errors, timeouts, bugs -
 * a generic one.
 */
function actionErrorMessage(cause: unknown, fallback = ACTION_FAILED) {
  return isConnectionError(cause) ? fallback : userErrorMessage(cause, fallback);
}

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
  // The action whose request is running; every button is disabled meanwhile.
  const [pending, setPending] = useState<Action | null>(null);
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
  const [cancelSheetOpen, setCancelSheetOpen] = useState(false);
  const [confirmSheetOpen, setConfirmSheetOpen] = useState(false);
  const [reopenSheetOpen, setReopenSheetOpen] = useState(false);
  const [reopenReason, setReopenReason] = useState("");
  // When a task waiting for the client's confirmation is confirmed automatically (ISO time).
  const [deadline, setDeadline] = useState<string>();
  const [hint, setHint] = useState("");
  const { toast, show: showToast, close: closeToast } = useToast();
  const busy = pending !== null;

  useEffect(() => {
    getTask(taskId)
      .then((task) => {
        setStatus(task.status);
        setPerspective(task.perspective === "provider" ? "provider" : "client");
        setProviderId(task.provider?.id);
        setTask({ title: task.title, budget: task.budget, clientName: task.clientName });
        setDeadline(task.confirmationDeadline);
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

  const paid = Boolean(payment && PAID_STATUSES.includes(payment.status));
  const onlineUnpaid = payment?.method === "online" && !paid;
  // Cash still to be confirmed. Older tasks without a payment record are settled in cash too.
  const cashToConfirm = payment !== undefined && !paid && (payment === null || (payment.method === "cash" && payment.status === "pending"));

  function changed(next: TaskStatus) {
    setStatus(next);
    onStatus?.(next);
    if (next === "cancelled") onCancelled?.();
  }

  /** Reloads the task after a conflict; returns its current status. */
  async function refresh() {
    try {
      const latest = await getTask(taskId);
      setProviderId(latest.provider?.id);
      setDeadline(latest.confirmationDeadline);
      changed(latest.status);
      return latest.status;
    } catch {
      return undefined;
    }
  }

  /**
   * Runs one status action: loading state while it runs, the new status and a
   * confirmation on success, an error toast on failure (the task stays as it
   * was). When someone else changed the task meanwhile, it is reloaded.
   */
  async function run(action: StatusAction, request: () => Promise<{ confirmationDeadline?: string }>) {
    if (busy) return false;
    setPending(action);
    const before = status;
    try {
      const updated = await request();
      setDeadline(updated.confirmationDeadline);
      changed(NEXT_STATUS[action]);
      showToast("success", SUCCESS_MESSAGE[action]);
      return true;
    } catch (cause) {
      // The payment may have changed since this page loaded: ask for the cash confirmation now.
      if (cause instanceof ApiError && cause.code === "CASH_CONFIRMATION_REQUIRED") {
        setCashSheetOpen(true);
        return false;
      }
      if (cause instanceof ApiError && cause.code === "CONFLICT") {
        const latest = await refresh();
        if (latest && latest !== before) {
          setCashSheetOpen(false);
          setConfirmSheetOpen(false);
          setReopenSheetOpen(false);
          showToast("error", STATUS_CHANGED);
          return false;
        }
      }
      showToast("error", actionErrorMessage(cause));
      return false;
    } finally {
      setPending(null);
    }
  }

  function confirmCancel() {
    setCancelSheetOpen(false);
    void run("cancel", () => cancelTask(taskId));
  }
  async function complete(cashReceived: boolean) {
    const done = await run("complete", () => transitionTask(taskId, "complete", { cashReceived }));
    if (!done) return;
    setCashSheetOpen(false);
    setHint("");
    getPayment(taskId).then((value) => setPayment(value ?? null)).catch(() => undefined);
  }
  function finish() {
    setHint("");
    if (cashToConfirm) setCashSheetOpen(true);
    else void complete(false);
  }
  async function confirmCompletion() {
    if (await run("confirm", () => confirmTaskCompletion(taskId))) {
      setConfirmSheetOpen(false);
      getPayment(taskId).then((value) => setPayment(value ?? null)).catch(() => undefined);
    }
  }
  async function reopen() {
    const reason = reopenReason.trim();
    if (reason.length < REOPEN_REASON_MIN) return;
    if (await run("reopen", () => rejectTaskCompletion(taskId, reason))) {
      setReopenSheetOpen(false);
      setReopenReason("");
    }
  }
  function notYetPaid() {
    setCashSheetOpen(false);
    setHint("Selesaikan task setelah pembayaran diterima.");
  }
  async function submitRating(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!providerId || busy) return;
    const form = new FormData(event.currentTarget);
    setPending("rate");
    try {
      await rateTask(taskId, providerId, Number(form.get("score")), String(form.get("review")));
      setExistingRating(await getTaskRating(taskId));
      setRating(false);
      showToast("success", "Rating terkirim");
    } catch (cause) {
      showToast("error", actionErrorMessage(cause, "Rating gagal dikirim. Coba lagi."));
    } finally {
      setPending(null);
    }
  }

  /** The action's icon, or a spinner while that action is running. */
  function icon(action: Action, Icon: typeof Check) {
    return pending === action ? <LoaderCircle className="size-5 animate-spin" /> : <Icon className="size-5" />;
  }

  const cancelButton = (
    <button
      type="button"
      disabled={busy}
      onClick={() => setCancelSheetOpen(true)}
      className={`${secondaryButton} w-full border-red-200 text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50`}
    >
      {icon("cancel", Ban)} Batalkan task
    </button>
  );

  function content(): ReactNode {
    // Cancelled or rejected: the page shows what happened; only reading the chat is left.
    if (status === "cancelled" || status === "rejected") {
      // The assigned provider opens the chat from the "Pemberi task" card.
      if (!providerId || perspective === "provider") return null;
      return (
        <a href={chatHref} className={`${secondaryButton} w-full`}>
          <MessageSquareText className="size-5" /> Lihat percakapan
        </a>
      );
    }

    if (perspective === "provider") {
      if (status === "waiting")
        return (
          <div className="grid gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => void run("accept", () => transitionTask(taskId, "accept"))}
              className={`${primaryButton} w-full`}
            >
              {icon("accept", Check)} Terima task
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void run("reject", () => transitionTask(taskId, "reject"))}
              className={`${secondaryButton} w-full border-red-200 text-red-700 disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {icon("reject", X)} Tolak task
            </button>
          </div>
        );
      if (status === "scheduled")
        return (
          <div className="grid gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => void run("start", () => transitionTask(taskId, "start"))}
              className={`${primaryButton} w-full`}
            >
              {icon("start", Play)} Mulai pekerjaan
            </button>
            {cancelButton}
          </div>
        );
      if (status === "ongoing")
        return (
          <div className="grid gap-3">
            <button
              type="button"
              disabled={busy || payment === undefined || onlineUnpaid}
              onClick={finish}
              aria-describedby={onlineUnpaid ? "finish-blocked-reason" : hint ? "finish-hint" : undefined}
              className={`${primaryButton} w-full`}
            >
              {icon("complete", Check)} Tandai selesai
            </button>
            {onlineUnpaid && (
              <p id="finish-blocked-reason" className="text-sm leading-6 text-slate-600">
                Pembayaran online dari klien belum lunas. Task bisa ditandai selesai setelah pembayaran dikonfirmasi.
              </p>
            )}
            {hint && (
              <p id="finish-hint" role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-800">
                {hint}
              </p>
            )}
          </div>
        );
      if (status === "pending_confirmation")
        return (
          <section role="status" className="rounded-xl border border-teal-200 bg-teal-50 p-4">
            <p className="flex items-center gap-2 text-sm font-bold text-teal-900">
              <Clock className="size-4" /> Menunggu konfirmasi klien
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Klien sedang memeriksa hasil pekerjaan.
              {payment?.method === "online" && " Pembayaran dicairkan setelah klien mengonfirmasi."}
              {deadline && ` Jika tidak ada respons, task otomatis selesai pada ${dateTimeFormat.format(new Date(deadline))}.`}
            </p>
          </section>
        );
      // Waiting for payment or finished: nothing to do; the chat is in the "Pemberi task" card.
      return null;
    }

    // Client: the provider marked the task done; accept it or send it back.
    if (status === "pending_confirmation")
      return (
        <div className="grid gap-3">
          <section role="status" className="rounded-xl border border-teal-200 bg-teal-50 p-4">
            <p className="flex items-center gap-2 text-sm font-bold text-teal-900">
              <Check className="size-4" /> Penyedia menandai task ini selesai
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Periksa hasil pekerjaannya.{" "}
              {payment?.method === "cash" && payment.cashConfirmedAt
                ? `Penyedia juga mencatat pembayaran tunai ${rupiah(payment.amount)} sudah diterima. `
                : payment?.method === "online"
                  ? "Pembayaran Anda baru diteruskan ke penyedia setelah Anda mengonfirmasi. "
                  : ""}
              {deadline && `Tanpa respons, task otomatis dianggap selesai pada ${dateTimeFormat.format(new Date(deadline))}.`}
            </p>
          </section>
          <button type="button" disabled={busy} onClick={() => setConfirmSheetOpen(true)} className={`${primaryButton} w-full`}>
            {icon("confirm", Check)} Konfirmasi selesai
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => setReopenSheetOpen(true)}
            className={`${secondaryButton} w-full disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {icon("reopen", RotateCcw)} Belum selesai
          </button>
          {providerId && (
            <a href={chatHref} className={`${secondaryButton} w-full`}>
              <MessageSquareText className="size-5" /> Hubungi penyedia
            </a>
          )}
        </div>
      );

    // Client: after the provider finished a cash task, show what was confirmed and how to dispute it.
    const cashConfirmedNotice = status === "history" && payment?.method === "cash" && payment.cashConfirmedAt && (
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <Banknote className="size-4 text-emerald-600" /> Selesai dan dibayar tunai
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Penyedia menandai task ini selesai dan pembayaran tunai {rupiah(payment.amount)} diterima pada{" "}
          {dateTimeFormat.format(new Date(payment.cashConfirmedAt))}.
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
              <button disabled={busy} className={`${primaryButton} w-full`}>
                {pending === "rate" && <LoaderCircle className="size-5 animate-spin" />} Kirim rating
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
    const cancellable = status === "awaiting_payment" || status === "waiting" || status === "scheduled";
    if (!providerId && !cancellable) return null;
    return (
      <div className="grid gap-3">
        {providerId && (
          <a href={chatHref} className={`${primaryButton} w-full`}>
            <MessageSquareText className="size-5" /> Hubungi penyedia
          </a>
        )}
        {cancellable && cancelButton}
      </div>
    );
  }

  return (
    <>
      {content()}
      {cancelSheetOpen && (
        <ConfirmSheet
          icon={<Ban className="size-6" />}
          tone="danger"
          title="Batalkan task ini?"
          description={
            perspective === "provider"
              ? "Klien akan diberi tahu bahwa Anda membatalkan task ini."
              : "Task tidak bisa diaktifkan lagi. Pembayaran online yang sudah masuk akan dikembalikan."
          }
          confirmLabel="Ya, batalkan"
          cancelLabel="Tidak"
          onConfirm={confirmCancel}
          onCancel={() => setCancelSheetOpen(false)}
        />
      )}
      {confirmSheetOpen && (
        <ConfirmSheet
          icon={<Check className="size-6" />}
          title="Pekerjaan sudah selesai dan sesuai?"
          description={
            payment?.method === "online"
              ? "Task akan ditandai selesai dan pembayaran Anda diteruskan ke penyedia. Langkah ini tidak bisa dibatalkan."
              : "Task akan ditandai selesai. Langkah ini tidak bisa dibatalkan."
          }
          confirmLabel="Ya, sudah selesai"
          cancelLabel="Periksa lagi"
          loading={pending === "confirm"}
          onConfirm={() => void confirmCompletion()}
          onCancel={() => setConfirmSheetOpen(false)}
        />
      )}
      {reopenSheetOpen && (
        <ConfirmSheet
          icon={<RotateCcw className="size-6" />}
          tone="danger"
          title="Apa yang belum selesai?"
          description="Penyedia akan menerima alasan ini dan melanjutkan pekerjaan, lalu menandai selesai lagi."
          confirmLabel="Kirim ke penyedia"
          cancelLabel="Batal"
          loading={pending === "reopen"}
          confirmDisabled={reopenReason.trim().length < REOPEN_REASON_MIN}
          focusConfirm={false}
          onConfirm={() => void reopen()}
          onCancel={() => setReopenSheetOpen(false)}
        >
          <label className="mt-4 block text-sm font-bold text-slate-700">
            Alasan
            <textarea
              autoFocus
              value={reopenReason}
              onChange={(event) => setReopenReason(event.target.value)}
              minLength={REOPEN_REASON_MIN}
              maxLength={REOPEN_REASON_MAX}
              rows={4}
              className={`${inputClass} py-3`}
              placeholder="Contoh: keran masih menetes setelah diperbaiki."
            />
          </label>
          <p className="mt-1 text-right text-xs text-slate-500">
            {reopenReason.trim().length}/{REOPEN_REASON_MAX}
          </p>
        </ConfirmSheet>
      )}
      {cashSheetOpen && (
        <ConfirmSheet
          icon={<Banknote className="size-6" />}
          title={`Sudah terima pembayaran tunai ${rupiah(task?.budget ?? payment?.amount ?? 0)} dari ${task?.clientName || "klien"}?`}
          description="Pembayaran dicatat lunas dan klien diminta mengonfirmasi bahwa pekerjaan sudah selesai."
          confirmLabel="Ya, sudah diterima"
          cancelLabel="Belum"
          loading={pending === "complete"}
          onConfirm={() => void complete(true)}
          onCancel={notYetPaid}
        />
      )}
      <Toast toast={toast} onClose={closeToast} />
    </>
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

/**
 * Bottom sheet asking to confirm an action (cancelling, confirming cash or the
 * finished work) before it is sent. `children` adds fields, e.g. a reason; give
 * one `autoFocus` and pass `focusConfirm={false}`.
 */
function ConfirmSheet({
  icon,
  tone = "default",
  title,
  description,
  confirmLabel,
  cancelLabel,
  loading = false,
  confirmDisabled = false,
  focusConfirm = true,
  children,
  onConfirm,
  onCancel,
}: {
  icon: ReactNode;
  tone?: "default" | "danger";
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  loading?: boolean;
  confirmDisabled?: boolean;
  focusConfirm?: boolean;
  children?: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const confirmRef = useRef<HTMLButtonElement | null>(null);
  const cancelRef = useRef(onCancel);
  const loadingRef = useRef(loading);
  useEffect(() => {
    cancelRef.current = onCancel;
    loadingRef.current = loading;
  });
  const focusConfirmRef = useRef(focusConfirm);
  useEffect(() => {
    if (focusConfirmRef.current) confirmRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !loadingRef.current) cancelRef.current();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/50 sm:items-center sm:p-4"
      onClick={() => !loading && onCancel()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-sheet-title"
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-md rounded-t-3xl bg-white p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-2xl sm:rounded-3xl sm:pb-6"
      >
        <span className="mx-auto mb-5 block h-1.5 w-12 rounded-full bg-slate-200 sm:hidden" aria-hidden="true" />
        <span className={`grid size-12 place-items-center rounded-2xl ${tone === "danger" ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"}`}>
          {icon}
        </span>
        <h2 id="confirm-sheet-title" className="mt-4 font-[var(--font-manrope)] text-xl font-extrabold text-slate-950">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        {children}
        <div className="mt-6 grid gap-3">
          <button ref={confirmRef} type="button" disabled={loading || confirmDisabled} onClick={onConfirm} className={`${primaryButton} w-full`}>
            {loading ? <LoaderCircle className="size-5 animate-spin" /> : <Check className="size-5" />} {confirmLabel}
          </button>
          <button type="button" disabled={loading} onClick={onCancel} className={`${secondaryButton} w-full`}>
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
