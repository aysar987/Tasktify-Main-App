"use client";

import { LoaderCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { verifyAccount } from "@/lib/api";
import { inputClass, primaryButton } from "./ui";

export function VerifyForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setLoading(true); setError("");
    const code = String(new FormData(event.currentTarget).get("code"));
    try { await verifyAccount(params.get("userId") ?? "", code); router.push("/login?verified=success"); }
    catch { setError("Kode verifikasi tidak valid. Periksa kembali kode Anda."); setLoading(false); }
  };
  return <form onSubmit={submit} className="mt-8 space-y-5"><label className="block text-sm font-bold text-slate-700">Kode verifikasi<input name="code" inputMode="numeric" maxLength={6} className={`${inputClass} text-center text-2xl font-bold tracking-[.5em]`} required placeholder="000000" /></label>{error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}<button disabled={loading} className={`${primaryButton} w-full`}>{loading && <LoaderCircle className="size-5 animate-spin" />} Verifikasi akun</button></form>;
}
