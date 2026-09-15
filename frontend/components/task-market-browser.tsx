"use client";

import { Briefcase, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getActiveMarketplaceTask, getOpenTasks, getProfile } from "@/lib/api";
import type { Task } from "@/types";
import { TaskMarketCard } from "./task-market-card";
import { primaryButton } from "./ui";

export function TaskMarketBrowser({ initialQuery = "" }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
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
      if (!q) return true;
      return task.title.toLowerCase().includes(q) || task.location.toLowerCase().includes(q);
    });
  }, [tasks, query]);

  if (loading) return <p className="py-16 text-center text-slate-500">Memuat marketplace...</p>;

  if (isProvider === false)
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
        <Briefcase className="mx-auto size-9 text-slate-400" />
        <h2 className="mt-4 font-[var(--font-manrope)] text-xl font-extrabold">Verifikasi untuk dapat Task</h2>
        <p className="mt-2 text-slate-500">Lengkapi profil penyedia Anda di halaman Profil untuk mulai mengambil task dari marketplace.</p>
        <Link href="/profile" className={`${primaryButton} mt-5 inline-flex`}>Lengkapi profil penyedia</Link>
      </div>
    );

  return (
    <>
      <label className="relative mb-5 block">
        <span className="sr-only">Cari task</span>
        <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Cari nama task atau lokasi..."
          className="min-h-12 w-full rounded-2xl border-0 bg-slate-100 pl-12 pr-4 text-base outline-none placeholder:text-slate-400 focus:ring-4 focus:ring-orange-100"
        />
      </label>

      <div className="mb-5 flex items-center justify-between">
        <p className="font-bold text-slate-700">{`${filtered.length} task tersedia`}</p>
      </div>

      {error && (
        <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </p>
      )}

      {activeTask && (
        <p className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
          Anda masih mengerjakan task <Link href={`/tasks/${activeTask.id}`} className="underline">{activeTask.title}</Link>. Selesaikan atau batalkan task itu dulu untuk bisa mengambil task lain dari sini.
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {filtered.map((task) => (
          <TaskMarketCard key={task.id} task={task} />
        ))}
      </div>

      {!error && filtered.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <Briefcase className="mx-auto size-9 text-slate-400" />
          <h2 className="mt-4 font-[var(--font-manrope)] text-xl font-extrabold">Belum ada task yang cocok</h2>
          <p className="mt-2 text-slate-500">Ubah kata pencarian atau cek lagi nanti.</p>
        </div>
      )}
    </>
  );
}
