"use client";

import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { UsernameField, type UsernameStatus } from "@/components/username-field";
import { ApiError, confirmUsername, getProfile } from "@/lib/api";
import { userErrorMessage } from "@/lib/errors";
import { USERNAME_TAKEN_MESSAGE, hasRandomSuffix, normalizeUsername, usernameRuleError } from "@/lib/forms/username";
import { getSupabase } from "@/lib/supabase";
import type { Profile } from "@/types";

const inputClass =
  "mt-2 min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#4294F7] focus:ring-4 focus:ring-[#4294F7]/20";

/**
 * Shown once after sign-in when the username was not the user's own choice:
 * generated for a Google account, the chosen one was taken meanwhile, or the
 * old random suffix ("budi_6468e8e3"). Keeping it or saving a new one both
 * count as confirmed, so it is not shown again.
 */
export default function UsernamePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile>();
  // The username typed at sign-up, when it was taken before the account was set up.
  const [requested, setRequested] = useState("");
  const [username, setUsername] = useState("");
  const [status, setStatus] = useState<UsernameStatus>("idle");
  const [serverError, setServerError] = useState("");
  const [recheck, setRecheck] = useState(0);
  const [saving, setSaving] = useState<"new" | "keep" | null>(null);
  const [error, setError] = useState("");

  function nextPath() {
    const next = new URLSearchParams(window.location.search).get("next");
    return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/username") ? next : "/dashboard";
  }

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await getSupabase().auth.getSession();
      if (!data.session) {
        router.replace("/login");
        return;
      }
      try {
        const loaded = await getProfile();
        if (!active) return;
        if (loaded.usernameConfirmed) {
          router.replace(nextPath());
          return;
        }
        const wanted = normalizeUsername(String(data.session.user.user_metadata?.username ?? ""));
        const lostChoice = Boolean(wanted) && wanted !== loaded.username;
        setRequested(lostChoice ? wanted : "");
        setProfile(loaded);
        // Start from the name they asked for (to show alternatives), else from the current one.
        setUsername(lostChoice ? wanted : loaded.username);
      } catch (cause) {
        if (active) setError(userErrorMessage(cause, "Profil gagal dimuat. Coba lagi."));
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once on open
  }, []);

  async function save(kind: "new" | "keep") {
    if (!profile) return;
    const value = kind === "keep" ? profile.username : normalizeUsername(username);
    if (kind === "new") {
      const ruleError = usernameRuleError(value);
      if (ruleError || status === "taken") {
        setError(ruleError || `${USERNAME_TAKEN_MESSAGE} Pilih salah satu saran.`);
        return;
      }
    }
    setSaving(kind);
    setError("");
    setServerError("");
    try {
      await confirmUsername(value);
      router.replace(nextPath());
    } catch (cause) {
      setSaving(null);
      if (cause instanceof ApiError && cause.field === "username") {
        // Taken by someone else just now: say so and check again for fresh suggestions.
        setServerError(cause.message);
        setRecheck((count) => count + 1);
        return;
      }
      setError(userErrorMessage(cause, "Username gagal disimpan. Coba lagi."));
    }
  }

  if (!profile) {
    return error ? (
      <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>
    ) : (
      <p className="py-10 text-center text-slate-500">Memuat...</p>
    );
  }

  const suffixed = !requested && hasRandomSuffix(profile.username);
  const title = requested ? "Pilih username lain" : suffixed ? "Ganti username kamu?" : "Pilih username kamu";
  const changed = normalizeUsername(username) !== profile.username;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void save("new");
      }}
      className="space-y-5 text-slate-950"
    >
      <div className="text-center">
        <h1 tabIndex={-1} className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {requested ? (
            <>Username <strong>@{requested}</strong> sudah dipakai orang lain sebelum akun kamu aktif. Pilih username lain.</>
          ) : suffixed ? (
            <>Saat ini: <strong>@{profile.username}</strong>. Kamu bisa menggantinya sekarang satu kali di sini, atau nanti di Profil.</>
          ) : (
            <>Kami membuatkan <strong>@{profile.username}</strong> dari nama kamu. Pakai ini atau ganti dengan pilihanmu.</>
          )}
        </p>
      </div>
      <label className="block text-sm font-semibold">
        Username
        <UsernameField
          value={username}
          onChange={(next) => {
            setUsername(next);
            setServerError("");
            setError("");
          }}
          onStatus={setStatus}
          fullName={profile.fullName}
          currentUsername={profile.username}
          serverError={serverError}
          recheck={recheck}
          inputClassName={inputClass}
          autoFocus
        />
      </label>
      {error && <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
      <button
        type="submit"
        disabled={saving !== null || !changed}
        className="inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#4294F7] px-5 font-bold text-white transition hover:bg-[#2879D8] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#4294F7]/35 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving === "new" && <LoaderCircle className="size-5 animate-spin" />}
        Simpan username
      </button>
      <button
        type="button"
        disabled={saving !== null}
        onClick={() => void save("keep")}
        className="inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-5 font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving === "keep" && <LoaderCircle className="size-5 animate-spin" />}
        Tetap pakai @{profile.username}
      </button>
    </form>
  );
}
