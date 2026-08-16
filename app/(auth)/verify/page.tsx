import { MailCheck } from "lucide-react";
import Link from "next/link";
import { primaryButton } from "@/components/ui";

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const { email } = await searchParams;
  return <div className="text-center"><MailCheck className="mx-auto size-14 text-orange-600" /><p className="mt-6 text-sm font-bold uppercase tracking-wider text-orange-700">Verifikasi email</p><h1 className="mt-2 font-[var(--font-manrope)] text-3xl font-extrabold">Periksa kotak masuk Anda</h1><p className="mt-4 leading-7 text-slate-600">Kami mengirim tautan konfirmasi ke {email ? <strong>{email}</strong> : "email Anda"}. Klik tautan tersebut sebelum masuk.</p><Link href="/login" className={`${primaryButton} mt-7 w-full`}>Kembali ke login</Link></div>;
}
