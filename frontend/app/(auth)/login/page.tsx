import { AuthForm } from "@/components/auth-form";
import Link from "next/link";

export default function LoginPage() {
  return <><p className="text-sm font-bold uppercase tracking-[.16em] text-orange-700">Selamat datang kembali</p><h1 className="mt-3 font-[var(--font-manrope)] text-4xl font-extrabold tracking-tight">Masuk ke akun Anda</h1><p className="mt-3 leading-7 text-slate-600">Kelola task dan temukan penyedia jasa terbaik di sekitar Anda.</p><AuthForm mode="login" /><div className="mt-5 flex items-center justify-between text-sm"><Link href="/reset-password" className="font-bold text-orange-700 hover:underline">Lupa password?</Link><span className="text-slate-500">Belum punya akun? <Link href="/register" className="font-bold text-orange-700 hover:underline">Daftar</Link></span></div></>;
}
