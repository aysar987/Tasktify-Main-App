"use client";

import { useEffect, useState } from "react";
import { getTasks } from "@/lib/api";
import type { Task, TaskStatus } from "@/types";
import { TaskCard } from "./task-card";

const tabs: { value: TaskStatus; label: string }[] = [
  { value: "ongoing", label: "Berjalan" },
  { value: "scheduled", label: "Terjadwal" },
  { value: "history", label: "Riwayat" },
  { value: "waiting", label: "Menunggu" },
];

export function ActivityList() {
  const [active, setActive] = useState<TaskStatus>("ongoing");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getTasks()
      .then(setTasks)
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Aktivitas gagal dimuat."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = tasks.filter((task) => task.status === active);
  return (
    <>
      <div className="flex gap-2 overflow-x-auto border-b border-slate-200">
        {tabs.map((tab) => <button key={tab.value} type="button" onClick={() => setActive(tab.value)} className={`relative min-h-12 shrink-0 cursor-pointer px-4 text-sm font-bold transition ${active === tab.value ? "text-orange-700 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-orange-600" : "text-slate-500 hover:text-slate-900"}`}>{tab.label}<span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs">{tasks.filter((task) => task.status === tab.value).length}</span></button>)}
      </div>
      {error && <p role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p>}
      <div className="mt-6 grid gap-4 xl:grid-cols-2">{loading ? <p className="col-span-full py-12 text-center text-slate-500">Memuat aktivitas...</p> : filtered.length ? filtered.map((task) => <TaskCard key={task.id} task={task} />) : <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center"><h2 className="font-[var(--font-manrope)] text-xl font-extrabold">Belum ada task di sini</h2><p className="mt-2 text-slate-500">Task pada status ini akan muncul secara otomatis.</p></div>}</div>
    </>
  );
}
