"use client";

import { CircleCheck, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function finish() {
      const params = new URLSearchParams(window.location.search);
      const hash = new URLSearchParams(window.location.hash.slice(1));
      const authError = params.get("error_description") || hash.get("error_description");
      if (authError) { if (active) setError(authError); return; }
      const code = params.get("code");
      if (code) {
        const { error: exchangeError } = await getSupabase().auth.exchangeCodeForSession(code);
        if (exchangeError) { if (active) setError(exchangeError.message); return; }
      }
      const { data } = await getSupabase().auth.getSession();
      if (!data.session) { if (active) setError("Tautan tidak valid atau sudah kedaluwarsa."); return; }
      const next = params.get("next") || "/dashboard";
      router.replace(next.startsWith("/") ? next : "/dashboard");
      router.refresh();
    }
    finish();
    return () => { active = false; };
  }, [router]);

  return <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl">{error ? <><CircleCheck className="mx-auto size-12 text-red-600" /><h1 className="mt-5 text-2xl font-extrabold">Konfirmasi gagal</h1><p role="alert" className="mt-3 leading-6 text-slate-600">{error}</p><a href="/login" className="mt-6 inline-flex min-h-11 items-center font-bold text-orange-700">Kembali ke login</a></> : <><LoaderCircle className="mx-auto size-12 animate-spin text-orange-600" /><h1 className="mt-5 text-2xl font-extrabold">Memverifikasi akun</h1><p className="mt-3 text-slate-600">Tunggu sebentar, Anda akan diarahkan otomatis.</p></>}</div>;
}
