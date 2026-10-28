"use client";

import { LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { getSiteUrl } from "@/lib/site-url";
import { getSupabase } from "@/lib/supabase";

const authInputClass = "mt-2 min-h-12 w-full rounded-full border-0 bg-[#C2E2FB] px-5 text-base text-slate-950 outline-none transition placeholder:text-slate-600 focus:ring-4 focus:ring-[#4294F7]/35";
const authPrimaryButton = "inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-full bg-[#4294F7] px-5 font-bold text-white transition hover:bg-[#2879D8] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#4294F7]/35 disabled:cursor-not-allowed disabled:opacity-50";

export function AuthForm({ mode }: { mode: "login" | "register" | "reset" | "update" }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function signInWithGoogle() {
    if (!legalAccepted) {
      setError("Baca dan setujui Syarat Layanan serta Kebijakan Privasi untuk melanjutkan dengan Google.");
      return;
    }
    setGoogleLoading(true);
    setError("");
    try {
      const requestedNext = new URLSearchParams(window.location.search).get("next") || "/dashboard";
      const next = requestedNext.startsWith("/") && !requestedNext.startsWith("//")
        ? requestedNext
        : "/dashboard";
      sessionStorage.setItem("tasktify_legal_consent", JSON.stringify({
        acceptedAt: new Date().toISOString(),
        termsVersion: "2026-10-04",
        privacyVersion: "2026-10-04",
      }));
      const { error: authError } = await getSupabase().auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${getSiteUrl()}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (authError) throw authError;
    } catch (cause) {
      sessionStorage.removeItem("tasktify_legal_consent");
      setError(cause instanceof Error ? cause.message : "Login dengan Google gagal dimulai.");
      setGoogleLoading(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mode === "register" && !legalAccepted) {
      setError("Baca dan setujui Syarat Layanan serta Kebijakan Privasi untuk membuat akun.");
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));
    const supabase = getSupabase();

    try {
      if (mode === "login") {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
        router.replace(new URLSearchParams(window.location.search).get("next") ?? "/dashboard");
        router.refresh();
      } else if (mode === "register") {
        const callback = `${getSiteUrl()}/auth/callback?next=${encodeURIComponent("/dashboard")}`;
        const { error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: callback,
            data: {
              username: String(form.get("username")),
              full_name: String(form.get("fullName")),
              phone: String(form.get("phone")),
              terms_accepted_at: new Date().toISOString(),
              terms_version: "2026-10-04",
              privacy_version: "2026-10-04",
            },
          },
        });
        if (authError) throw authError;
        router.replace(`/verify?email=${encodeURIComponent(email)}`);
      } else if (mode === "reset") {
        const next = encodeURIComponent("/reset-password?update=true");
        const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${getSiteUrl()}/auth/callback?next=${next}`,
        });
        if (authError) throw authError;
        setMessage("Tautan reset password sudah dikirim ke email Anda.");
      } else {
        const { error: authError } = await supabase.auth.updateUser({ password });
        if (authError) throw authError;
        setMessage("Password berhasil diperbarui. Anda akan diarahkan ke dashboard.");
        window.setTimeout(() => router.replace("/dashboard"), 1200);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Permintaan gagal diproses.");
    } finally {
      setLoading(false);
    }
  }





  
  const title = mode === "login" ? "Masuk ke Tasktify" : mode === "register" ? "Buat akun baru" : mode === "update" ? "Buat password baru" : "Reset password";

  if (mode === "login") {
    return (
      <form onSubmit={submit} className="space-y-5 text-slate-950">
        <div className="text-center">
          <h1 tabIndex={-1} className="text-4xl font-bold tracking-tight">Selamat Datang</h1>
          <p className="mt-2 text-sm text-slate-600">silahkan login untuk masuk ke Tasktify</p>
        </div>

        <label className="block text-sm font-semibold">
          Alamat Email
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="nama@email.com"
            className={authInputClass}
          />
        </label>

        <label className="block text-sm font-semibold">
          Kata Sandi
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="current-password"
            placeholder="Masukkan kata sandi"
            className={authInputClass}
          />
          <Link href="/reset-password" className="mt-2 inline-flex text-sm font-semibold text-[#2879D8] hover:underline">
            Lupa Sandi ?
          </Link>
        </label>

        <button
          disabled={loading}
          className="inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#4294F7] px-5 font-bold text-white transition hover:bg-[#2879D8] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#4294F7]/35 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading && <LoaderCircle className="size-5 animate-spin" />}
          Masuk
        </button>

        <label className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-slate-700">
          <input
            type="checkbox"
            checked={legalAccepted}
            onChange={(event) => setLegalAccepted(event.target.checked)}
            className="mt-1 size-4 shrink-0 accent-[#4294F7]"
          />
          <span>
            Saya telah membaca dan menyetujui{" "}
            <Link href="/terms-of-service" target="_blank" rel="noreferrer" className="font-bold text-[#2879D8] underline">
              Syarat Layanan
            </Link>{" "}
            dan telah membaca{" "}
            <Link href="/privacy-policy" target="_blank" rel="noreferrer" className="font-bold text-[#2879D8] underline">
              Kebijakan Privasi
            </Link>.
          </span>
        </label>

        {error && <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
        {message && <p role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{message}</p>}

        <div className="flex items-center gap-3 text-xs font-semibold text-slate-400">
          <span className="h-px flex-1 bg-slate-200" />
          atau
          <span className="h-px flex-1 bg-slate-200" />
        </div>

        <button
          type="button"
          onClick={signInWithGoogle}
          disabled={!legalAccepted || googleLoading || loading}
          className="flex min-h-12 w-full items-center justify-center gap-3 rounded-full border border-[#B8D9FA] bg-white px-4 font-semibold text-[#2879D8] transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#4294F7]/25 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {googleLoading ? <LoaderCircle className="size-5 animate-spin" /> : <svg aria-hidden="true" viewBox="0 0 48 48" className="size-5"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.77 7.18l7.73 6C44.4 37.88 46.98 31.7 46.98 24.55Z"/><path fill="#FBBC05" d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.2A23.9 23.9 0 0 0 0 24c0 3.87.93 7.52 2.56 10.78l7.97-6.19Z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.8l-7.73-6c-2.14 1.44-4.88 2.3-8.17 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"/></svg>}
          Lanjutkan dengan Google
        </button>

        <p className="text-center text-sm font-semibold text-slate-600">
          Belum punya akun?{" "}
          <Link href="/register" className="text-[#2879D8] hover:underline">Daftar</Link>
        </p>
      </form>
    );
  }

  return (
    <form onSubmit={submit} className={`${mode === "register" ? "space-y-4" : "space-y-5"} text-slate-950`}>
      <div className="text-center">
        <h1 tabIndex={-1} className="text-4xl font-bold tracking-tight">{title}</h1>
      </div>

      {mode === "register" && (
        <>
          <label className="block text-sm font-semibold">
            Nama lengkap
            <input name="fullName" required autoComplete="name" placeholder="Contoh: Boy Steven" className={authInputClass} />
          </label>
          <label className="block text-sm font-semibold">
            Username
            <input name="username" required minLength={3} autoComplete="username" placeholder="Contoh: boysteven" className={authInputClass} />
          </label>
          <label className="block text-sm font-semibold">
            Nomor telepon
            <input name="phone" type="tel" autoComplete="tel" placeholder="Contoh: +62 812 3456 7890" className={authInputClass} />
          </label>
        </>
      )}
      {mode !== "update" && (
        <label className="block text-sm font-semibold">
          Email
          <input name="email" type="email" required autoComplete="email" placeholder="nama@email.com" className={authInputClass} />
        </label>
      )}
      {mode !== "reset" && (
        <label className="block text-sm font-semibold">
          {mode === "update" ? "Password baru" : "Password"}
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder={mode === "update" ? "Minimal 8 karakter" : "Masukkan password"}
            className={authInputClass}
          />
        </label>
      )}

      {error && <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
      {message && <p role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{message}</p>}

      {mode === "register" && (
        <label className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-slate-700">
          <input
            type="checkbox"
            checked={legalAccepted}
            onChange={(event) => setLegalAccepted(event.target.checked)}
            className="mt-1 size-4 shrink-0 accent-[#4294F7]"
          />
          <span>
            Saya telah membaca dan menyetujui{" "}
            <Link href="/terms-of-service" target="_blank" rel="noreferrer" className="font-bold text-[#2879D8] underline">
              Syarat Layanan
            </Link>{" "}
            dan telah membaca{" "}
            <Link href="/privacy-policy" target="_blank" rel="noreferrer" className="font-bold text-[#2879D8] underline">
              Kebijakan Privasi
            </Link>.
          </span>
        </label>
      )}

      <button disabled={loading} className={`${authPrimaryButton} w-full`}>
        {loading && <LoaderCircle className="size-5 animate-spin" />}
        {mode === "register" ? "Daftar" : mode === "update" ? "Simpan password baru" : "Kirim tautan reset"}
      </button>

      {mode === "register" && (
        <>
          <div className="flex items-center gap-3 text-xs font-semibold text-slate-400">
            <span className="h-px flex-1 bg-slate-200" />
            atau
            <span className="h-px flex-1 bg-slate-200" />
          </div>
          <button
            type="button"
            onClick={signInWithGoogle}
            disabled={!legalAccepted || googleLoading || loading}
            className="flex min-h-12 w-full items-center justify-center gap-3 rounded-full border border-[#B8D9FA] bg-white px-4 font-semibold text-[#2879D8] transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#4294F7]/25 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {googleLoading ? <LoaderCircle className="size-5 animate-spin" /> : <svg aria-hidden="true" viewBox="0 0 48 48" className="size-5"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.77 7.18l7.73 6C44.4 37.88 46.98 31.7 46.98 24.55Z"/><path fill="#FBBC05" d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.2A23.9 23.9 0 0 0 0 24c0 3.87.93 7.52 2.56 10.78l7.97-6.19Z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.8l-7.73-6c-2.14 1.44-4.88 2.3-8.17 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"/></svg>}
            Lanjutkan dengan Google
          </button>
        </>
      )}

      <p className="text-center text-sm font-semibold text-[#2879D8]">
        <Link href="/login" className="hover:underline">Kembali ke login</Link>
      </p>
    </form>
  );
}
