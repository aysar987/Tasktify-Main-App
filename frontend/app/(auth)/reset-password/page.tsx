import { AuthForm } from "@/components/auth-form";
import Link from "next/link";

export default function ResetPasswordPage() {
  return <><p className="text-sm font-bold uppercase tracking-[.16em] text-orange-700">Pemulihan akun</p><h1 className="mt-3 font-[var(--font-manrope)] text-4xl font-extrabold tracking-tight">Atur ulang password</h1><p className="mt-3 leading-7 text-slate-600">Masukkan email dan password baru untuk kembali mengakses akun.</p><AuthForm mode="reset" /><Link href="/login" className="mt-5 inline-flex min-h-11 items-center font-bold text-orange-700 hover:underline">← Kembali ke halaman masuk</Link></>;
}
