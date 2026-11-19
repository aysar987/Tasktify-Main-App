"use client";

import { CheckCircle2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getTasks } from "@/lib/api";
import type { Task, TaskStatus } from "@/types";
import { secondaryButton } from "./ui";
import { TaskCard } from "./task-card";

// `slug` is the value of the Activity page's `?tab=` query param.
// `empty` completes the sentence "Belum ada task ..." for that tab.
const tabs: { value: TaskStatus; label: string; slug: string; empty: string }[] = [
  { value: "awaiting_payment", label: "Menunggu pembayaran", slug: "menunggu-pembayaran", empty: "yang menunggu pembayaran" },
  { value: "ongoing", label: "Berjalan", slug: "berjalan", empty: "berjalan" },
  { value: "scheduled", label: "Terjadwal", slug: "terjadwal", empty: "terjadwal" },
  { value: "history", label: "Riwayat", slug: "riwayat", empty: "di riwayat" },
  { value: "waiting", label: "Menunggu", slug: "menunggu", empty: "yang menunggu" },
  { value: "cancelled", label: "Dibatalkan", slug: "dibatalkan", empty: "yang dibatalkan" },
  { value: "rejected", label: "Ditolak", slug: "ditolak", empty: "yang ditolak" },
];

const DEFAULT_TAB: TaskStatus = "ongoing";
// Which non-empty tab an empty state points to first: things needing attention before history.
const SUGGESTION_ORDER: TaskStatus[] = ["waiting", "awaiting_payment", "scheduled", "ongoing", "history", "cancelled", "rejected"];

function tabFromSlug(slug?: string): TaskStatus {
  return tabs.find((tab) => tab.slug === slug)?.value ?? DEFAULT_TAB;
}

/** `tab` is the `?tab=` slug (e.g. "menunggu"); unknown or missing opens Berjalan. */
export function ActivityList({ tab, newTaskId }: { tab?: string; newTaskId?: string }) {
  const [active, setActive] = useState<TaskStatus>(() => tabFromSlug(tab));
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toastOpen, setToastOpen] = useState(Boolean(newTaskId));
  const tabBarRef = useRef<HTMLDivElement | null>(null);
  const tabRefs = useRef<Partial<Record<TaskStatus, HTMLButtonElement | null>>>({});

  useEffect(() => {
    getTasks()
      .then(setTasks)
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Aktivitas gagal dimuat."))
      .finally(() => setLoading(false));
  }, []);

  // Drop `?new=` from the URL so a refresh doesn't repeat the toast and highlight.
  useEffect(() => {
    if (!newTaskId) return;
    const url = new URL(window.location.href);
    url.searchParams.delete("new");
    window.history.replaceState(window.history.state, "", url);
    const timer = window.setTimeout(() => setToastOpen(false), 4000);
    return () => window.clearTimeout(timer);
  }, [newTaskId]);

  // Keep the active tab fully visible in the horizontally scrollable tab bar.
  useEffect(() => {
    const bar = tabBarRef.current;
    const tab = tabRefs.current[active];
    if (!bar || !tab) return;
    const left = tab.offsetLeft;
    const right = left + tab.offsetWidth;
    if (left < bar.scrollLeft || right > bar.scrollLeft + bar.clientWidth) {
      bar.scrollTo({ left: Math.max(0, left - 16), behavior: "smooth" });
    }
  }, [active]);

  const countFor = (status: TaskStatus) => tasks.filter((task) => task.status === status).length;
  const filtered = tasks.filter((task) => task.status === active);
  // The new task goes first so its highlight is at the top of the list.
  const ordered = newTaskId
    ? [...filtered.filter((task) => task.id === newTaskId), ...filtered.filter((task) => task.id !== newTaskId)]
    : filtered;
  const activeTab = tabs.find((tab) => tab.value === active) ?? tabs[0];
  const suggestion = SUGGESTION_ORDER.filter((status) => status !== active && countFor(status) > 0)
    .map((status) => tabs.find((tab) => tab.value === status)!)[0];

  return (
    <>
      <div ref={tabBarRef} role="tablist" aria-label="Status task" className="relative flex gap-2 overflow-x-auto border-b border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            ref={(element) => { tabRefs.current[tab.value] = element; }}
            type="button"
            role="tab"
            aria-selected={active === tab.value}
            onClick={() => setActive(tab.value)}
            className={`relative min-h-12 shrink-0 cursor-pointer px-4 text-sm font-bold transition ${active === tab.value ? "text-orange-700 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-orange-600" : "text-slate-500 hover:text-slate-900"}`}
          >
            {tab.label}
            <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs">{loading ? "-" : countFor(tab.value)}</span>
          </button>
        ))}
      </div>
      {error && <p role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p>}
      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        {loading ? (
          <p className="col-span-full py-12 text-center text-slate-500">Memuat aktivitas...</p>
        ) : ordered.length ? (
          ordered.map((task) => <TaskCard key={task.id} task={task} highlighted={task.id === newTaskId} />)
        ) : (
          <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <h2 className="font-[var(--font-manrope)] text-xl font-extrabold">Belum ada task {activeTab.empty}</h2>
            {suggestion ? (
              <>
                <p className="mt-2 text-slate-500">
                  {suggestion.value === "waiting" ? "Task baru kamu ada di Menunggu." : `Task kamu ada di ${suggestion.label}.`}
                </p>
                <button type="button" onClick={() => setActive(suggestion.value)} className={`${secondaryButton} mt-5 rounded-full`}>
                  Lihat {suggestion.label}
                </button>
              </>
            ) : (
              <p className="mt-2 text-slate-500">Task pada status ini akan muncul secara otomatis.</p>
            )}
          </div>
        )}
      </div>
      {toastOpen && (
        <div
          role="status"
          className="fixed inset-x-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-50 mx-auto flex max-w-sm items-center gap-3 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-xl lg:bottom-8"
        >
          <CheckCircle2 className="size-5 shrink-0 text-emerald-400" />
          <span className="flex-1">Task berhasil dibuat</span>
          <button type="button" aria-label="Tutup notifikasi" onClick={() => setToastOpen(false)} className="grid size-8 cursor-pointer place-items-center rounded-full hover:bg-white/10">
            <X className="size-4" />
          </button>
        </div>
      )}
    </>
  );
}
