/**
 * "Buat Task" field rules in one place: `required` drives the asterisk and the
 * "wajib diisi" check; limits mirror createTaskInput in the backend
 * (TasktifyBE/internal/tasktify/tasks.go).
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

/** StepField props for a task field. */
export function taskLabel(field: TaskField) {
  return { label: taskFields[field].label, required: taskFields[field].required };
}

/** Error for one field, or "" when valid. */
export function validateTaskField(field: TaskField, raw: string) {
  const L = TASK_LIMITS;
  const value = raw.trim();
  const { label, required } = taskFields[field];
  if (required && !value) return `${label} wajib diisi.`;
  switch (field) {
    case "title":
      return value.length < L.titleMin || value.length > L.titleMax ? `Nama task ${L.titleMin}-${L.titleMax} karakter.` : "";
    case "location":
      return value.length > L.locationMax ? `Lokasi maksimal ${L.locationMax} karakter.` : "";
    case "budget": {
      const budget = Number(value);
      if (!Number.isInteger(budget) || budget < L.budgetMin) return "Biaya minimal Rp15.000.";
      return budget % L.budgetStep !== 0 ? "Biaya harus diisi dengan kelipatan Rp500." : "";
    }
    case "note":
      return value.length < L.noteMin || value.length > L.noteMax ? `Catatan pekerjaan ${L.noteMin}-${L.noteMax} karakter.` : "";
    default:
      return "";
  }
}
