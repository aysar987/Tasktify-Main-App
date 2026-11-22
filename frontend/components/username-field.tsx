"use client";

import { Check, LoaderCircle, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { checkUsername } from "@/lib/api";
import { USERNAME_HELP, USERNAME_MAX, USERNAME_TAKEN_MESSAGE, normalizeUsername, usernameRuleError } from "@/lib/forms/username";

/**
 * "checking" and "error" (the check itself failed, e.g. offline) don't block
 * submitting: the server checks again when saving.
 */
export type UsernameStatus = "idle" | "checking" | "available" | "taken" | "invalid" | "error";

const CHECK_DELAY_MS = 500;

/**
 * Username input that checks availability while typing (500 ms after the last
 * key) and offers free alternatives to tap. Used at sign-up, on the username
 * confirmation screen and in the profile.
 */
export function UsernameField({
  value,
  onChange,
  onStatus,
  fullName = "",
  currentUsername,
  serverError,
  inputClassName,
  autoFocus,
  recheck = 0,
}: {
  value: string;
  onChange: (value: string) => void;
  onStatus?: (status: UsernameStatus) => void;
  /** Helps suggest alternatives, e.g. "budisantoso". */
  fullName?: string;
  /** The user's own username: not reported as taken. */
  currentUsername?: string;
  /** Error returned when saving (e.g. taken by someone else meanwhile). */
  serverError?: string;
  inputClassName: string;
  autoFocus?: boolean;
  /** Change it to check the same value again (e.g. after saving found it taken). */
  recheck?: number;
}) {
  const [status, setStatus] = useState<UsernameStatus>("idle");
  const [message, setMessage] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const latest = useRef(0);
  const statusRef = useRef(onStatus);
  useEffect(() => {
    statusRef.current = onStatus;
  });

  useEffect(() => {
    const request = ++latest.current;
    const username = normalizeUsername(value);
    const report = (next: UsernameStatus, text = "", alternatives: string[] = []) => {
      if (request !== latest.current) return; // a newer value was typed meanwhile
      setStatus(next);
      setMessage(text);
      setSuggestions(alternatives);
      statusRef.current?.(next);
    };
    if (!username || username === currentUsername) {
      report("idle");
      return;
    }
    const ruleError = usernameRuleError(username);
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      if (!ruleError) report("checking");
      try {
        const check = await checkUsername(username, fullName, controller.signal);
        if (ruleError) report("invalid", ruleError, check.suggestions);
        else report(check.available ? "available" : check.message === USERNAME_TAKEN_MESSAGE ? "taken" : "invalid", check.message, check.suggestions);
      } catch {
        // The rules are still checked here; availability is checked again on save.
        report(ruleError ? "invalid" : "error", ruleError);
      }
    }, CHECK_DELAY_MS);
    // Rule problems block submitting at once; their message appears after the pause.
    if (ruleError) statusRef.current?.("invalid");
    else statusRef.current?.("checking");
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [value, fullName, currentUsername, recheck]);

  const shownError = serverError || (status === "invalid" ? message : "");
  return (
    <>
      <input
        name="username"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
        maxLength={USERNAME_MAX + 1}
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        autoFocus={autoFocus}
        placeholder="Contoh: boysteven"
        aria-invalid={Boolean(shownError) || status === "taken" || undefined}
        aria-describedby="username-status username-help"
        className={inputClassName}
      />
      <span id="username-status" aria-live="polite" className="mt-2 block text-sm font-semibold">
        {status === "checking" && (
          <span className="flex items-center gap-1.5 font-normal text-slate-500">
            <LoaderCircle className="size-4 animate-spin" /> Memeriksa username...
          </span>
        )}
        {status === "available" && !serverError && (
          <span className="flex items-center gap-1.5 text-emerald-700">
            <Check className="size-4" /> Username tersedia
          </span>
        )}
        {(status === "taken" || serverError === USERNAME_TAKEN_MESSAGE) && (
          <span className="flex items-center gap-1.5 text-red-700">
            <X className="size-4" /> Username sudah dipakai
          </span>
        )}
        {shownError && shownError !== USERNAME_TAKEN_MESSAGE && <span className="block text-red-700">{shownError}</span>}
      </span>
      {suggestions.length > 0 && status !== "available" && (
        <span className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-xs font-normal text-slate-500">Coba:</span>
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => onChange(suggestion)}
              className="cursor-pointer rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-bold text-slate-700 hover:border-orange-400 hover:text-orange-700"
            >
              @{suggestion}
            </button>
          ))}
        </span>
      )}
      <span id="username-help" className="mt-2 block text-xs font-normal leading-5 text-slate-500">
        {USERNAME_HELP}
      </span>
    </>
  );
}
