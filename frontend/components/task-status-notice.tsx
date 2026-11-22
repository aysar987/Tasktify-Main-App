import { Ban, XCircle } from "lucide-react";
import Link from "next/link";
import type { Task, TaskPerspective } from "@/types";
import { secondaryButton } from "./ui";

const endedFormat = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" });

/**
 * The one status block for a task that was cancelled or rejected, so the page
 * never also says the task is open or waiting. Who cancelled is not stored,
 * so it is only named when certain: a task without a provider can only have
 * been cancelled by its client. No cancellation reason is stored either.
 */
export function TaskEndedNotice({ task, perspective }: { task: Task; perspective: TaskPerspective }) {
  if (task.status !== "cancelled" && task.status !== "rejected") return null;
  const when = task.endedAt ? ` pada ${endedFormat.format(new Date(task.endedAt))}` : "";

  if (task.status === "rejected") {
    const who = perspective === "provider" ? "Anda" : task.provider?.name ?? "Penyedia";
    return (
      <section role="status" className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <h2 className="flex items-center gap-2 font-extrabold text-red-800">
          <XCircle className="size-5" /> Task ditolak penyedia
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          {who} menolak task ini{when}.
        </p>
        {perspective === "client" && (
          <Link href="/create-task" className={`${secondaryButton} mt-4 w-full`}>
            Buat task baru
          </Link>
        )}
      </section>
    );
  }

  let sentence = `Task ini dibatalkan${when}.`;
  if (!task.provider) sentence = perspective === "client" ? `Anda membatalkan task ini${when}.` : `Task ini dibatalkan oleh klien${when}.`;
  return (
    <section role="status" className="rounded-2xl border border-red-200 bg-red-50 p-6">
      <h2 className="flex items-center gap-2 font-extrabold text-red-800">
        <Ban className="size-5" /> Task dibatalkan
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-700">{sentence}</p>
      <p className="mt-1 text-sm leading-6 text-slate-600">Task ini tidak aktif lagi dan tidak bisa diambil atau dikerjakan.</p>
    </section>
  );
}
