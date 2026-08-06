"use client";

import { CalendarDays, Check, CircleDollarSign, LoaderCircle, MapPin, Navigation } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PageHeader, primaryButton } from "@/components/ui";
import { claimTask, getOpenTask } from "@/lib/api";
import { rupiah } from "@/lib/format";
import type { Task } from "@/types";

export default function MarketplaceTaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [task, setTask] = useState<Task>();
  const [error, setError] = useState("");
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    getOpenTask(id)
      .then(setTask)
      .catch((cause: unknown) =>
        setError(cause instanceof Error ? cause.message : "Task gagal dimuat."),
      );
  }, [id]);

  async function claim() {
    setClaiming(true);
    try {
      await claimTask(id);
      router.push(`/tasks/${id}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Task gagal diambil.");
      setClaiming(false);
    }
  }

  if (error)
    return (
      <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 font-semibold text-red-700">
        {error}
      </div>
    );
  if (!task) return <p className="py-16 text-center text-slate-500">Memuat detail task...</p>;

  return (
    <>
      <PageHeader eyebrow={task.id} title={task.title} description="Detail permintaan dari client, siap diambil siapa cepat." backHref="/marketplace" />
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="font-[var(--font-manrope)] text-xl font-extrabold">Informasi task</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {[
              { icon: MapPin, label: "Lokasi", value: task.location },
              { icon: CalendarDays, label: "Jadwal", value: task.date },
              { icon: CircleDollarSign, label: "Anggaran", value: rupiah(task.budget) },
              { icon: Navigation, label: "Kategori", value: task.category },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600">
                  <Icon className="size-5" />
                </span>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</span>
                  <strong className="mt-1 block text-sm">{value}</strong>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 border-t border-slate-200 pt-6">
            <h3 className="font-bold">Catatan</h3>
            <p className="mt-2 leading-7 text-slate-600">{task.note}</p>
          </div>
        </section>
        <aside className="h-fit space-y-4 rounded-2xl border border-orange-200 bg-orange-50 p-6 xl:sticky xl:top-28">
          <div>
            <span className="block text-xs text-slate-500">Harga tetap</span>
            <strong className="text-lg text-slate-950">{rupiah(task.budget)}</strong>
          </div>
          <button type="button" disabled={claiming} onClick={claim} className={`${primaryButton} w-full`}>
            {claiming ? <LoaderCircle className="size-5 animate-spin" /> : <Check className="size-5" />} Ambil task ini
          </button>
        </aside>
      </div>
    </>
  );
}
