/**
 * Version of the Syarat & Ketentuan and Kebijakan Privasi (both effective
 * 4 Oktober 2026). Must match CurrentTermsVersion in the backend (terms.go);
 * bump both when the legal pages change and every user accepts once more.
 */
export const TERMS_VERSION = "2026-10-04";

const DEVICE_KEY = "tasktify_terms_accepted_version";

/** True when this device already accepted the current version (pre-ticks the checkbox). */
export function termsAcceptedOnDevice() {
  try {
    return window.localStorage.getItem(DEVICE_KEY) === TERMS_VERSION;
  } catch {
    return false;
  }
}

/** Remembered after a successful sign-in so returning users don't have to tick again. */
export function rememberTermsOnDevice() {
  try {
    window.localStorage.setItem(DEVICE_KEY, TERMS_VERSION);
  } catch {
    // Private mode or blocked storage: the user just ticks again next time.
  }
}

/** True when this device accepted an older version, i.e. the terms changed since. */
export function termsChangedSinceDevice() {
  try {
    const stored = window.localStorage.getItem(DEVICE_KEY);
    return Boolean(stored) && stored !== TERMS_VERSION;
  } catch {
    return false;
  }
}
