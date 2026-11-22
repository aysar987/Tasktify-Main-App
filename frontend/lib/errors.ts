import { ApiError } from "@/lib/api";

export const GENERIC_ERROR = "Terjadi kesalahan. Coba lagi.";

/** No response at all: offline, blocked, or timed out. */
export function isConnectionError(cause: unknown) {
  return cause instanceof ApiError && (cause.code === "NETWORK_ERROR" || cause.code === "TIMEOUT");
}

/**
 * The message to show a user for a failed action. Only ApiError messages are
 * written for users (backend messages, plus the client's own network/session
 * messages in lib/api.ts). Anything else - a bug such as "Cannot read
 * properties of null", a browser or library error - is logged for debugging
 * and replaced by `fallback`, never shown as is.
 */
export function userErrorMessage(cause: unknown, fallback = GENERIC_ERROR) {
  if (cause instanceof ApiError) {
    if (cause.code === "INTERNAL_ERROR") return fallback;
    return cause.message || fallback;
  }
  console.error(cause);
  return fallback;
}
