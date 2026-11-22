/**
 * Username rules, the same as the backend (TasktifyBE/internal/tasktify/username.go)
 * with the same messages. The backend also checks reserved names and availability.
 */

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 20;

export const USERNAME_TAKEN_MESSAGE = "Username sudah dipakai.";

export const USERNAME_HELP = "3–20 karakter: huruf kecil, angka, titik (.), atau garis bawah (_). Tidak diawali atau diakhiri titik/garis bawah.";

// Names that could be mistaken for the platform or its staff (dots and underscores ignored).
const RESERVED = new Set([
  "admin", "administrator", "support", "cs", "kerjain", "tasktify", "help", "bantuan", "official", "resmi",
  "moderator", "mod", "staff", "root", "system", "sistem", "info", "halo", "customerservice", "security", "keamanan",
]);

/** How a username is stored: trimmed, without a leading "@", lowercase. */
export function normalizeUsername(raw: string) {
  return raw.trim().replace(/^@/, "").toLowerCase();
}

/** Why a (normalized) username breaks the rules, or "". */
export function usernameRuleError(username: string) {
  const length = [...username].length;
  if (length === 0) return "Username wajib diisi.";
  if (length < USERNAME_MIN || length > USERNAME_MAX) return "Username harus 3–20 karakter.";
  if (!/^[a-z0-9._]+$/.test(username)) return "Username hanya boleh berisi huruf kecil, angka, titik (.), dan garis bawah (_).";
  if (/^[._]|[._]$/.test(username)) return "Username tidak boleh diawali atau diakhiri titik atau garis bawah.";
  if (RESERVED.has(username.replace(/[._]/g, ""))) return "Username ini tidak bisa dipakai. Pilih username lain.";
  return "";
}

/** Usernames given by the old sign-up, e.g. "budi_6468e8e3". */
export function hasRandomSuffix(username: string) {
  return /_[0-9a-f]{8}$/.test(username);
}
