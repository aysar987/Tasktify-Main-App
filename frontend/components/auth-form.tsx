"use client";

import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { isAxiosError } from "axios";
import { login, register, resetPassword } from "@/lib/api";
import { inputClass, primaryButton } from "./ui";

export function AuthForm({ mode }: { mode: "login" | "register" | "reset" }) {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      if (mode === "login") {
        const result = await login(String(form.get("identifier")), String(form.get("password")));
        localStorage.setItem("tasktify-token", result.accessToken);
        router.push("/dashboard");
      } else if (mode === "register") {
        const result = await register(String(form.get("username")), String(form.get("phone")), String(form.get("email") ?? ""), String(form.get("password")));
        router.push(`/verify?userId=${result.user.id}`);
      } else {
        await resetPassword(String(form.get("identifier")));
        router.push("/login?reset=success");
      }
    } catch (cause) {
      setError(isAxiosError(cause) ? cause.response?.data?.message ?? "Tidak dapat terhubung ke server." : "Terjadi kesalahan. Coba lagi.");
      setLoading(false);
    }
  };
  return (
    <form onSubmit={submit} className="mt-8 space-y-5">
      {mode === "register" && <><label className="block text-sm font-bold text-slate-700">Nama pengguna<input className={inputClass} name="username" autoComplete="username" required placeholder="matthew.a" /></label><label className="block text-sm font-bold text-slate-700">Nomor telepon<input className={inputClass} name="phone" type="tel" autoComplete="tel" required placeholder="+62 812 3456 7890" /></label></>}
      {mode === "register" && <label className="block text-sm font-bold text-slate-700">Email (opsional)<input className={inputClass} name="email" type="email" autoComplete="email" placeholder="matthew@email.com" /></label>}
      {mode !== "register" && <label className="block text-sm font-bold text-slate-700">Email atau username<input className={inputClass} name="identifier" autoComplete="username" required placeholder="matthew@email.com" /></label>}
      <label className="block text-sm font-bold text-slate-700">{mode === "reset" ? "Password baru" : "Password"}<span className="relative block"><input className={`${inputClass} pr-12`} name="password" type={show ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={8} placeholder="Minimal 8 karakter" /><button type="button" onClick={() => setShow(!show)} aria-label={show ? "Sembunyikan password" : "Tampilkan password"} className="absolute right-2 top-[calc(50%+.25rem)] grid size-10 -translate-y-1/2 place-items-center rounded-lg text-slate-500 hover:bg-slate-100">{show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}</button></span></label>
      {mode === "reset" && <label className="block text-sm font-bold text-slate-700">Konfirmasi password<input className={inputClass} name="confirmation" type="password" autoComplete="new-password" required minLength={8} /></label>}
      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
      <button type="submit" disabled={loading} className={`${primaryButton} w-full`}>{loading && <LoaderCircle className="size-5 animate-spin" />}{mode === "login" ? "Masuk ke Tasktify" : mode === "register" ? "Buat akun" : "Kirim instruksi reset"}</button>
    </form>
  );
}
