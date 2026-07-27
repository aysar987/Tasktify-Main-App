"use client";

import { Ban, Check, MessageSquareText, Play, Star, X } from "lucide-react";
import { useEffect, useState } from "react";
import { cancelTask, getTask, rateTask, transitionTask } from "@/lib/api";
import type { TaskStatus } from "@/types";
import { primaryButton, secondaryButton } from "./ui";

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
  useEffect(() => {
    getTask(taskId)
      .then((task) => {
        setStatus(task.status);
        setPerspective(task.perspective ?? "client");
        setProviderId(task.provider?.id);
      })
      .catch(() => undefined);
  }, [taskId]);
  if (status === "cancelled" || status === "rejected")
    return (
      <div
        role="status"
        className="rounded-xl border border-red-200 bg-red-50 p-4 font-semibold text-red-700"
      >
        Task tidak aktif.
      </div>
    );
  function changed(next: TaskStatus) {
    setStatus(next);
    onStatus?.(next);
    if (next === "cancelled") onCancelled?.();
  }
  async function cancel() {
    if (!window.confirm("Batalkan task ini?")) return;
    setLoading(true);
    try {
      await cancelTask(taskId);
      changed("cancelled");
    } finally {
      setLoading(false);
    }
  }
  async function transition(
    action: "accept" | "reject" | "start" | "complete",
    next: TaskStatus,
  ) {
    setLoading(true);
    try {
      await transitionTask(taskId, action);
      changed(next);
    } finally {
      setLoading(false);
    }
  }
  async function submitRating(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!providerId) return;
    const form = new FormData(event.currentTarget);
    setLoading(true);
    try {
      await rateTask(
        taskId,
        providerId,
        Number(form.get("score")),
        String(form.get("review")),
      );
      setRating(false);
    } finally {
      setLoading(false);
    }
  }
  if (perspective === "provider") {
    if (status === "waiting")
      return (
        <div className="grid gap-3">
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
        <button
          disabled={loading}
          onClick={() => transition("start", "ongoing")}
          className={`${primaryButton} w-full`}
        >
          <Play className="size-5" /> Mulai pekerjaan
        </button>
      );
    if (status === "ongoing")
      return (
        <button
          disabled={loading}
          onClick={() => transition("complete", "history")}
          className={`${primaryButton} w-full`}
        >
          <Check className="size-5" /> Tandai selesai
        </button>
      );
    return null;
  }
  if (status === "history" && providerId)
    return rating ? (
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
    );
  return (
    <div className="grid gap-3">
      {providerId && (
        <a href="/chat" className={`${primaryButton} w-full`}>
          <MessageSquareText className="size-5" /> Hubungi penyedia
        </a>
      )}
      {(status === "waiting" || status === "scheduled") && (
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
