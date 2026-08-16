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
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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
    <button disabled={loading} className={`${primaryButton} w-full disabled:cursor-not-allowed disabled:opacity-50`}>{loading && <LoaderCircle className="size-5 animate-spin" />}{mode === "login" ? "Masuk" : mode === "register" ? "Daftar" : mode === "update" ? "Simpan password baru" : "Kirim tautan reset"}</button>
    <div className="flex min-h-11 items-center justify-between text-sm font-semibold">{mode === "login" ? <><Link href="/reset-password" className="text-orange-700">Lupa password?</Link><Link href="/register" className="text-orange-700">Buat akun</Link></> : <Link href="/login" className="text-orange-700">Kembali ke login</Link>}</div>
  </form>;
}
