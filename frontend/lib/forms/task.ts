/**
 * "Buat Task" field rules in one place: `required` drives the asterisk and the
 * "wajib diisi" check; limits and messages are the same as validateCreateTask
 * in the backend (TasktifyBE/internal/tasktify/task_validation.go), so an error
 * shown here is the one the server would return. Keep both in sync.
 */

export const TASK_LIMITS = {
  titleMin: 3,
  titleMax: 160,
  locationMax: 200,
  budgetMin: 15000,
  /** Frontend-only: "Buat Task" budgets are whole Rp500 steps. */
  budgetStep: 500,
  noteMin: 5,
  noteMax: 2000,
} as const;

export const taskFields = {
  title: { label: "Nama task", required: true },
  location: { label: "Lokasi", required: true },
  budget: { label: "Biaya", required: true },
  schedule: { label: "Jadwal yang diinginkan", required: true },
  note: { label: "Catatan pekerjaan", required: true },
  image: { label: "Foto task", required: false },
} as const;

export type TaskField = keyof typeof taskFields;

export const SCHEDULE_PAST_MESSAGE = "Tanggal dan waktu tidak boleh di masa lalu.";

/** StepField props for a task field. */
export function taskLabel(field: TaskField) {
  return { label: taskFields[field].label, required: taskFields[field].required };
}

/**
 * Characters after trimming spaces, counted like the backend does (Unicode
 * characters, not UTF-16 units), so "  ab  " is 2 and an emoji is 1.
 */
export function charCount(value: string) {
  return [...value.trim()].length;
}

/** Earliest schedule the picker allows: the current minute, in the datetime-local format (device time zone). */
export function nowForPicker(now = new Date()) {
  const local = new Date(now);
  local.setSeconds(0, 0);
  return new Date(local.getTime() - local.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

/**
 * Checks a datetime-local value (device time zone, e.g. WITA). The picker has
 * minute precision, so the current minute still counts as "now". Used by
 * "Buat Task" and "Pesan Jasa".
 */
export function validateSchedule(value: string, now = new Date()) {
  if (!value) return `${taskFields.schedule.label} wajib diisi.`;
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return "Jadwal tidak valid.";
  const currentMinute = new Date(now);
  currentMinute.setSeconds(0, 0);
  return time < currentMinute.getTime() ? SCHEDULE_PAST_MESSAGE : "";
}

function lengthError(label: string, value: string, min: number, max: number) {
  const count = charCount(value);
  if (count < min) return `${label} minimal ${min} karakter.`;
  if (count > max) return `${label} maksimal ${max} karakter.`;
  return "";
}

/** Error for one field, or "" when valid. Spaces around the value don't count. */
export function validateTaskField(field: TaskField, raw: string, now = new Date()) {
  const L = TASK_LIMITS;
  const value = raw.trim();
  const { label, required } = taskFields[field];
  if (required && !value) return `${label} wajib diisi.`;
  switch (field) {
    case "title":
      return lengthError(label, value, L.titleMin, L.titleMax);
    case "location":
      return lengthError(label, value, 1, L.locationMax);
    case "budget": {
      const budget = Number(value);
      if (!Number.isInteger(budget) || budget < L.budgetMin) return "Biaya minimal Rp15.000.";
      return budget % L.budgetStep !== 0 ? "Biaya harus diisi dengan kelipatan Rp500." : "";
    }
    case "schedule":
      return validateSchedule(value, now);
    case "note":
      return lengthError(label, value, L.noteMin, L.noteMax);
    default:
      return "";
  }
}
