"use client";

import {
  CalendarDays,
  CircleDollarSign,
  MapPin,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { TaskActions } from "@/components/task-actions";
import { LiveLocation } from "@/components/live-location";
import { PaymentPanel } from "@/components/payment-panel";
import { TaskGallery } from "@/components/task-photos";
import { PageHeader, StatusBadge } from "@/components/ui";
import { getTask } from "@/lib/api";
import { rupiah } from "@/lib/format";
import type { Task } from "@/types";
import { AssignedProviderCard, NoProviderCard, TaskClientCard } from "@/components/task-people";

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [task, setTask] = useState<Task>();
  const [error, setError] = useState("");
  useEffect(() => {
    getTask(id)
      .then(setTask)
      .catch((cause: unknown) =>
        setError(cause instanceof Error ? cause.message : "Task gagal dimuat."),
      );
  }, [id]);
  if (error)
    return (
      <div
        role="alert"
        className="rounded-2xl border border-red-200 bg-red-50 p-6 font-semibold text-red-700"
      >
        {error}
      </div>
    );
  if (!task)
    return (
      <p className="py-16 text-center text-slate-500">Memuat detail task...</p>
    );
  // Decided by the backend per task: the same account can be the client of
  // one task and the provider of another.
  const perspective = task.perspective ?? "client";
  const isAdmin = perspective === "admin";
  const location =
    task.location ||
    (task.addressHidden === "expired"
      ? "Alamat disembunyikan"
      : "Ditampilkan setelah task diambil");
  return (
    <>
      <PageHeader
        eyebrow={task.id}
        title={task.title}
        description="Detail pekerjaan dan perkembangan penyedia."
        backHref="/activity"
        action={<StatusBadge status={task.status} />}
      />
      <TaskGallery images={task.images} />
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="font-[var(--font-manrope)] text-xl font-extrabold">
              Informasi task
            </h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              {[
                { icon: MapPin, label: "Lokasi", value: location },
                { icon: CalendarDays, label: "Jadwal", value: task.date },
                {
                  icon: CircleDollarSign,
                  label: "Anggaran",
                  value: rupiah(task.budget),
                },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600">
                    <Icon className="size-5" />
                  </span>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      {label}
                    </span>
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
        </div>
        <aside className="h-fit space-y-5 xl:sticky xl:top-28">
          {/* The assigned provider sees the client; the client sees the provider; admins see both. */}
          {perspective === "provider" ? (
            task.client && <TaskClientCard client={task.client} task={task} showChat />
          ) : task.provider ? (
            <AssignedProviderCard provider={task.provider} />
          ) : task.status === "awaiting_payment" ? (
            <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
              <h2 className="font-extrabold">Menunggu pembayaran</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Task akan dipublikasikan ke penyedia setelah pembayaran Anda selesai.
              </p>
            </section>
          ) : (
            <NoProviderCard />
          )}
          {isAdmin && task.client && (
            <TaskClientCard client={task.client} task={task} showChat={false} />
          )}
          {!isAdmin && (
            <>
              {(task.provider || task.status === "awaiting_payment") &&
                task.status !== "cancelled" &&
                task.status !== "rejected" && (
                  <PaymentPanel taskId={task.id} amount={task.budget} perspective={perspective} />
                )}
              <TaskActions
                taskId={task.id}
                status={task.status}
                perspective={perspective}
                providerId={task.provider?.id}
                onStatus={(status) => setTask({ ...task, status })}
              />
              <LiveLocation taskId={task.id} perspective={perspective} active={task.status === "ongoing"} />
            </>
          )}
        </aside>
      </div>
    </>
  );
}
