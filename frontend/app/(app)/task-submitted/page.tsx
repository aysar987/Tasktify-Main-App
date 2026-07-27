import { CheckCircle2, Clock3, Search } from "lucide-react";
import Link from "next/link";
import { primaryButton, secondaryButton } from "@/components/ui";

export default function TaskSubmittedPage() {
  return (
    <div className="mx-auto max-w-3xl py-8 text-center md:py-16">
      <span className="mx-auto grid size-20 place-items-center rounded-full bg-emerald-100 text-emerald-700"><CheckCircle2 className="size-10" /></span>
      <p className="mt-7 text-sm font-bold uppercase tracking-[.18em] text-orange-700">Task berhasil dikirim</p>
      <h1 className="mt-3 font-[var(--font-manrope)] text-4xl font-extrabold tracking-tight md:text-5xl">Kami sedang mencari ahlinya.</h1>
      <p className="mx-auto mt-4 max-w-xl text-lg leading-8 text-slate-600">Permintaan <strong>TSK-1051</strong> sudah dipublikasikan. Anda akan mendapat notifikasi ketika penyedia mengirim penawaran.</p>
      <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-left"><div className="flex items-start gap-4"><Clock3 className="mt-0.5 size-6 shrink-0 text-amber-700" /><div><strong className="block">Status: Menunggu penyedia</strong><p className="mt-1 text-sm leading-6 text-slate-600">Rata-rata penyedia merespons dalam 5–15 menit. Anda tetap dapat menjelajahi marketplace.</p></div></div></div>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><Link href="/activity" className={primaryButton}>Pantau aktivitas</Link><Link href="/marketplace" className={secondaryButton}><Search className="size-5" /> Jelajahi marketplace</Link></div>
    </div>
  );
}
