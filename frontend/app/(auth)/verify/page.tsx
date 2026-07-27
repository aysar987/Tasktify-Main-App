import { Suspense } from "react";
import { VerifyForm } from "@/components/verify-form";

export default function VerifyPage() {
  return <><p className="text-sm font-bold uppercase tracking-[.16em] text-orange-700">Verifikator</p><h1 className="mt-3 font-[var(--font-manrope)] text-4xl font-extrabold tracking-tight">Verifikasi akun Anda</h1><p className="mt-3 leading-7 text-slate-600">Masukkan enam digit kode yang kami kirim ke nomor telepon Anda.</p><Suspense fallback={<div className="mt-8 h-40 animate-pulse rounded-2xl bg-slate-100" />}><VerifyForm /></Suspense></>;
}
