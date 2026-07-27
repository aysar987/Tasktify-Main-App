import { AuthForm } from "@/components/auth-form";
import Link from "next/link";

export default function RegisterPage() {
  return <><p className="text-sm font-bold uppercase tracking-[.16em] text-orange-700">Bergabung dengan Tasktify</p><h1 className="mt-3 font-[var(--font-manrope)] text-4xl font-extrabold tracking-tight">Buat akun baru</h1><p className="mt-3 leading-7 text-slate-600">Satu akun untuk meminta bantuan maupun menawarkan keahlian.</p><AuthForm mode="register" /><p className="mt-5 text-center text-sm text-slate-500">Sudah punya akun? <Link href="/login" className="font-bold text-orange-700 hover:underline">Masuk</Link></p></>;
}
