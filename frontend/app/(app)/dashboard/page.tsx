import { ArrowUpRight, CheckCircle2, Clock3, Plus, Search, Star, UsersRound } from "lucide-react";
import Link from "next/link";
import { ProviderCard } from "@/components/provider-card";
import { TaskCard } from "@/components/task-card";
import { primaryButton, secondaryButton } from "@/components/ui";
import { providers, tasks } from "@/lib/mock-data";

export default function DashboardPage() {
  return (
    <div>
      <section className="relative overflow-hidden rounded-3xl bg-slate-950 px-6 py-10 text-white md:px-10 md:py-12">
        <div className="absolute inset-y-0 right-0 hidden w-2/5 border-l border-white/10 bg-orange-600 lg:block" />
        <div className="relative max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-[.18em] text-orange-400">Selasa, 28 Juli 2026</p>
          <h1 className="mt-4 font-[var(--font-manrope)] text-3xl font-extrabold tracking-tight md:text-5xl">Selamat datang, Matthew.</h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-300 md:text-lg">Apa yang bisa kami bantu selesaikan hari ini?</p>
          <div className="mt-7 flex flex-wrap gap-3"><Link href="/request-task" className={primaryButton}><Plus className="size-5" /> Buat task baru</Link><Link href="/marketplace" className={`${secondaryButton} border-slate-600 bg-transparent text-white hover:bg-white/10`}><Search className="size-5" /> Cari penyedia</Link></div>
        </div>
      </section>
      <section aria-label="Ringkasan akun" className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[{ icon: Clock3, label: "Task berjalan", value: "1", color: "bg-blue-50 text-blue-700" }, { icon: CheckCircle2, label: "Task selesai", value: "12", color: "bg-emerald-50 text-emerald-700" }, { icon: UsersRound, label: "Penyedia tersimpan", value: "6", color: "bg-violet-50 text-violet-700" }, { icon: Star, label: "Rata-rata rating", value: "4.9", color: "bg-amber-50 text-amber-700" }].map(({ icon: Icon, label, value, color }) => <article key={label} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5"><span className={`grid size-12 place-items-center rounded-xl ${color}`}><Icon className="size-6" /></span><div><strong className="block font-[var(--font-manrope)] text-2xl">{value}</strong><span className="text-sm text-slate-500">{label}</span></div></article>)}
      </section>
      <section className="mt-10">
        <div className="mb-5 flex items-end justify-between gap-4"><div><p className="text-sm font-bold uppercase tracking-wider text-orange-700">Aktivitas terbaru</p><h2 className="mt-1 font-[var(--font-manrope)] text-2xl font-extrabold">Task Anda</h2></div><Link href="/activity" className="flex min-h-11 items-center gap-1 font-bold text-orange-700">Lihat semua <ArrowUpRight className="size-4" /></Link></div>
        <div className="grid gap-4 xl:grid-cols-2">{tasks.slice(0, 2).map((task) => <TaskCard key={task.id} task={task} />)}</div>
      </section>
      <section className="mt-10">
        <div className="mb-5 flex items-end justify-between gap-4"><div><p className="text-sm font-bold uppercase tracking-wider text-orange-700">Pilihan teratas</p><h2 className="mt-1 font-[var(--font-manrope)] text-2xl font-extrabold">Penyedia rekomendasi</h2></div><Link href="/marketplace" className="flex min-h-11 items-center gap-1 font-bold text-orange-700">Jelajahi marketplace <ArrowUpRight className="size-4" /></Link></div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{providers.slice(0, 3).map((provider) => <ProviderCard key={provider.id} provider={provider} />)}</div>
      </section>
    </div>
  );
}
