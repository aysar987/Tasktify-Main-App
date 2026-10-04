"use client";

import { LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { getSiteUrl } from "@/lib/site-url";
import { getSupabase } from "@/lib/supabase";
import { inputClass, primaryButton } from "./ui";

export function AuthForm({ mode }: { mode: "login" | "register" | "reset" | "update" }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function signInWithGoogle() {
    setGoogleLoading(true);
    setError("");
    try {
      const requestedNext = new URLSearchParams(window.location.search).get("next") || "/dashboard";
      const next = requestedNext.startsWith("/") && !requestedNext.startsWith("//")
        ? requestedNext
        : "/dashboard";
      const { error: authError } = await getSupabase().auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${getSiteUrl()}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (authError) throw authError;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Login dengan Google gagal dimulai.");
      setGoogleLoading(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
  return <form onSubmit={submit} className="space-y-5">
    <div><p className="text-sm font-bold uppercase tracking-wider text-orange-700">Akun Tasktify</p><h1 className="mt-2 font-[var(--font-manrope)] text-3xl font-extrabold">{title}</h1></div>
    {mode === "register" && <><label className="block text-sm font-bold">Nama lengkap<input name="fullName" required autoComplete="name" placeholder="Contoh: Boy Steven" className={inputClass} /></label><label className="block text-sm font-bold">Username<input name="username" required minLength={3} autoComplete="username" placeholder="Contoh: boysteven" className={inputClass} /></label><label className="block text-sm font-bold">Nomor telepon<input name="phone" type="tel" autoComplete="tel" placeholder="Contoh: +62 812 3456 7890" className={inputClass} /></label></>}
    {mode !== "update" && <label className="block text-sm font-bold">Email<input name="email" type="email" required autoComplete="email" placeholder="nama@email.com" className={inputClass} /></label>}
    {mode !== "reset" && <label className="block text-sm font-bold">{mode === "update" ? "Password baru" : "Password"}<input name="password" type="password" required minLength={8} autoComplete={mode === "login" ? "current-password" : "new-password"} placeholder={mode === "update" ? "Minimal 8 karakter" : "Masukkan password"} className={inputClass} /></label>}
    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
    {message && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{message}</p>}
    {(mode === "login" || mode === "register") && <>
      <button type="button" onClick={signInWithGoogle} disabled={googleLoading || loading} className="flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-4 font-bold text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
        {googleLoading ? <LoaderCircle className="size-5 animate-spin" /> : <svg aria-hidden="true" viewBox="0 0 48 48" className="size-5"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.77 7.18l7.73 6C44.4 37.88 46.98 31.7 46.98 24.55Z"/><path fill="#FBBC05" d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.2A23.9 23.9 0 0 0 0 24c0 3.87.93 7.52 2.56 10.78l7.97-6.19Z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.8l-7.73-6c-2.14 1.44-4.88 2.3-8.17 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"/></svg>}
        Lanjutkan dengan Google
      </button>
      <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-slate-400"><span className="h-px flex-1 bg-slate-200" />atau<span className="h-px flex-1 bg-slate-200" /></div>
    </>}
    <button disabled={loading} className={`${primaryButton} w-full disabled:cursor-not-allowed disabled:opacity-50`}>{loading && <LoaderCircle className="size-5 animate-spin" />}{mode === "login" ? "Masuk" : mode === "register" ? "Daftar" : mode === "update" ? "Simpan password baru" : "Kirim tautan reset"}</button>
    <div className="flex min-h-11 items-center justify-between text-sm font-semibold">{mode === "login" ? <><Link href="/reset-password" className="text-orange-700">Lupa password?</Link><Link href="/register" className="text-orange-700">Buat akun</Link></> : <Link href="/login" className="text-orange-700">Kembali ke login</Link>}</div>
  </form>;
}
