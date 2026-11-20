"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { termsAcceptedOnDevice, termsChangedSinceDevice } from "@/lib/legal";

export const CONSENT_REQUIRED_MESSAGE = "Centang persetujuan Syarat & Ketentuan untuk melanjutkan.";

const noSubscribe = () => () => undefined;

/**
 * Consent state for the login/registration forms. Starts ticked on a device
 * that already accepted the current version; the user can still untick it.
 */
export function useLegalConsent() {
  const rememberedOnDevice = useSyncExternalStore(noSubscribe, termsAcceptedOnDevice, () => false);
  const termsChanged = useSyncExternalStore(noSubscribe, termsChangedSinceDevice, () => false);
  const [choice, setChoice] = useState<boolean>();
  const [showRequired, setShowRequired] = useState(false);
  const accepted = choice ?? rememberedOnDevice;
  return {
    accepted,
    termsChanged,
    showRequired,
    setAccepted(value: boolean) {
      setChoice(value);
      if (value) setShowRequired(false);
    },
    /** Returns true when ticked; otherwise shows the inline message next to the checkbox. */
    require() {
      setShowRequired(!accepted);
      return accepted;
    },
  };
}

/** Checkbox shown above every sign-in button; it applies to email and Google alike. */
export function LegalConsent({ consent }: { consent: ReturnType<typeof useLegalConsent> }) {
  return (
    <div>
      {consent.termsChanged && (
        <p className="mb-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Syarat & Ketentuan dan Kebijakan Privasi telah diperbarui. Baca dan setujui versi terbaru untuk melanjutkan.
        </p>
      )}
      <label className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-slate-700">
        <input
          type="checkbox"
          checked={consent.accepted}
          onChange={(event) => consent.setAccepted(event.target.checked)}
          aria-invalid={consent.showRequired}
          aria-describedby={consent.showRequired ? "legal-consent-required" : undefined}
          className="mt-1 size-4 shrink-0 accent-[#4294F7]"
        />
        <span>
          Saya menyetujui{" "}
          {/* New tab: what the user already typed on this page stays as it is. */}
          <Link href="/terms-of-service" target="_blank" rel="noreferrer" className="font-bold text-[#2879D8] underline">
            Syarat & Ketentuan
          </Link>{" "}
          dan{" "}
          <Link href="/privacy-policy" target="_blank" rel="noreferrer" className="font-bold text-[#2879D8] underline">
            Kebijakan Privasi
          </Link>
        </span>
      </label>
      {consent.showRequired && (
        <p id="legal-consent-required" role="alert" className="mt-1.5 pl-7 text-sm font-semibold text-red-700">
          {CONSENT_REQUIRED_MESSAGE}
        </p>
      )}
    </div>
  );
}
