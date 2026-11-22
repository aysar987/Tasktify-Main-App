import type { TaskStatus } from "@/types";

/**
 * The one mapping from internal task status values to what users read. Use
 * taskStatusLabel() wherever a status is shown (badges, Activity tabs, chat,
 * notifications) so an internal value like "history" never reaches the screen.
 * "history" is the stored status of a finished task; cancelled and rejected
 * tasks have their own statuses.
 */
export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  awaiting_payment: "Menunggu pembayaran",
  waiting: "Menunggu penyedia",
  scheduled: "Terjadwal",
  ongoing: "Sedang dikerjakan",
  history: "Selesai",
  cancelled: "Dibatalkan",
  rejected: "Ditolak penyedia",
};

/** Shown for a status that has no label yet, instead of the raw value. */
export const UNKNOWN_TASK_STATUS_LABEL = "Status task diperbarui";

const reported = new Set<string>();

export function isKnownTaskStatus(status: string): status is TaskStatus {
  return Object.prototype.hasOwnProperty.call(TASK_STATUS_LABELS, status);
}

export function taskStatusLabel(status: string) {
  if (isKnownTaskStatus(status)) return TASK_STATUS_LABELS[status];
  if (!reported.has(status)) {
    reported.add(status);
    console.warn(`Task status without a label: "${status}". Add it to TASK_STATUS_LABELS.`);
  }
  return UNKNOWN_TASK_STATUS_LABEL;
}

const LEGACY_STATUS_SENTENCE = /Status task berubah menjadi ([a-z_]+)\./g;
// Task ids look like "TSK-123".
const LEGACY_TITLE_WITH_ID = /^Task TSK-\d+ /;

/**
 * Notifications sent before the wording fix contain raw status values
 * ("Status task berubah menjadi history.") and task ids in the title. New
 * notifications are written as sentences by the backend; this only cleans up
 * the old ones already stored.
 */
export function readableNotification(title: string, body: string) {
  return {
    title: title.replace(LEGACY_TITLE_WITH_ID, "Task "),
    body: body.replace(LEGACY_STATUS_SENTENCE, (_, status: string) =>
      isKnownTaskStatus(status) ? `Status task: ${taskStatusLabel(status)}.` : `${taskStatusLabel(status)}.`,
    ),
  };
}
