"use client";

import { Briefcase, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getActiveMarketplaceTask, getOpenTasks, getProfile } from "@/lib/api";
import type { Task } from "@/types";
import { TaskMarketCard } from "./task-market-card";
import { primaryButton } from "./ui";

const categories = ["Semua", "Listrik", "Plumbing", "AC", "Pertukangan", "Kebersihan"];

export function TaskMarketBrowser({ initialQuery = "" }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState("Semua");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTask, setActiveTask] = useState<Task>();
  const [isProvider, setIsProvider] = useState<boolean>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const profile = await getProfile();
        if (cancelled) return;
        setIsProvider(Boolean(profile.provider));
        if (profile.provider) {
          const [openTasks, active] = await Promise.all([getOpenTasks(), getActiveMarketplaceTask()]);
          if (cancelled) return;
          setTasks(openTasks);
          setActiveTask(active);
        }
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Marketplace gagal dimuat.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tasks.filter((task) => {
      const matchesCategory = category === "Semua" || task.category === category;
      const matchesQuery = !q || task.title.toLowerCase().includes(q) || task.location.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [tasks, query, category]);

  if (loading) return <p className="py-16 text-center text-slate-500">Memuat marketplace...</p>;

  if (isProvider === false)
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
        <Briefcase className="mx-auto size-9 text-slate-400" />
        <h2 className="mt-4 font-[var(--font-manrope)] text-xl font-extrabold">Daftar sebagai penyedia dulu</h2>
        <p className="mt-2 text-slate-500">Lengkapi profil penyedia Anda di halaman Profil untuk mulai mengambil task dari marketplace.</p>
        <Link href="/profile" className={`${primaryButton} mt-5 inline-flex`}>Lengkapi profil penyedia</Link>
      </div>
    );

  return (
    <>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5">
        <div className="flex flex-col gap-3 md:flex-row">
          <label className="relative flex-1"><span className="sr-only">Cari task</span><Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari nama task atau lokasi..." className="min-h-12 w-full rounded-xl border border-slate-300 pl-12 pr-4 outline-none focus:border-orange-600 focus:ring-4 focus:ring-orange-100" /></label>
        </div>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">{categories.map((item) => <button key={item} type="button" onClick={() => setCategory(item)} className={`min-h-10 shrink-0 cursor-pointer rounded-full border px-4 text-sm font-bold transition ${category === item ? "border-orange-600 bg-orange-600 text-white" : "border-slate-300 bg-white text-slate-600 hover:border-orange-400"}`}>{item}</button>)}</div>
      </div>
      <div className="mb-5 mt-7 flex items-center justify-between"><p className="font-bold text-slate-700">{`${filtered.length} task tersedia`}</p></div>
      {error && <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p>}
      {activeTask && (
        <p className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
          Anda masih mengerjakan task <Link href={`/tasks/${activeTask.id}`} className="underline">{activeTask.title}</Link>. Selesaikan atau batalkan task itu dulu untuk bisa mengambil task lain dari sini.
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{filtered.map((task) => <TaskMarketCard key={task.id} task={task} locked={Boolean(activeTask)} onClaimed={(id) => setTasks((prev) => prev.filter((item) => item.id !== id))} onError={setError} />)}</div>
      {!error && filtered.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center"><Briefcase className="mx-auto size-9 text-slate-400" /><h2 className="mt-4 font-[var(--font-manrope)] text-xl font-extrabold">Belum ada task yang cocok</h2><p className="mt-2 text-slate-500">Ubah kata pencarian, pilih kategori lain, atau cek lagi nanti.</p></div>}
    </>
  );
}
