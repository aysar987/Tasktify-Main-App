"use client";

import {
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Plus,
  Search,
  Store,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ProviderCard } from "@/components/provider-card";
import { TaskCard } from "@/components/task-card";
import { primaryButton } from "@/components/ui";
import { getProfile, getProviders, getTasks } from "@/lib/api";
import type { Profile, Provider, Task } from "@/types";

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  useEffect(() => {
    Promise.all([getProfile(), getTasks(), getProviders()]).then(
      ([nextProfile, nextTasks, nextProviders]) => {
        setProfile(nextProfile);
        setTasks(nextTasks);
        setProviders(nextProviders);
      },
    );
  }, []);
  const active = tasks.filter(
    (task) => task.status === "ongoing" || task.status === "scheduled",
  ).length;
  const completed = tasks.filter((task) => task.status === "history").length;
  return (
    <div>
      <section className="relative overflow-hidden rounded-3xl bg-slate-950 px-6 py-10 text-white md:px-10 md:py-12">
        <div className="absolute inset-y-0 right-0 hidden w-[5%] border-l border-white/10 bg-orange-600 lg:block" />
        <div className="relative max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-[.18em] text-orange-400">
            {new Intl.DateTimeFormat("id-ID", { dateStyle: "full" }).format(
              new Date(),
            )}
          </p>
          <h1 className="mt-4 font-[var(--font-manrope)] text-3xl font-extrabold tracking-tight md:text-5xl">
            Selamat datang,{" "}
            {profile?.fullName || profile?.username || "Pengguna"}.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-300 md:text-lg">
            Apa yang bisa kami bantu selesaikan hari ini?
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/request-task" className={primaryButton}>
              <Plus className="size-5" /> Buat task baru
            </Link>
            <Link
              href="/penyedia"
              className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-600 bg-slate-900 px-5 font-bold text-white transition hover:border-slate-400 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30"
            >
              <Search className="size-5" /> Cari penyedia
            </Link>
          </div>
        </div>
      </section>
      <section
        aria-label="Ringkasan akun"
        className="mt-6 grid gap-4 sm:grid-cols-3"
      >
        {[
          { icon: Clock3, label: "Task aktif", value: active },
          { icon: CheckCircle2, label: "Task selesai", value: completed },
          {
            icon: UsersRound,
            label: "Penyedia tersedia",
            value: providers.length,
          },
        ].map(({ icon: Icon, label, value }) => (
          <article
            key={label}
            className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5"
          >
            <span className="grid size-12 place-items-center rounded-xl bg-orange-50 text-orange-700">
              <Icon className="size-6" />
            </span>
            <div>
              <strong className="block font-[var(--font-manrope)] text-2xl">
                {value}
              </strong>
              <span className="text-sm text-slate-500">{label}</span>
            </div>
          </article>
        ))}
      </section>
      <section className="mt-10">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-orange-700">
              Aktivitas terbaru
            </p>
            <h2 className="mt-1 font-[var(--font-manrope)] text-2xl font-extrabold">
              Task Anda
            </h2>
          </div>
          <Link
            href="/activity"
            className="flex min-h-11 items-center gap-1 font-bold text-orange-700"
          >
            Lihat semua <ArrowUpRight className="size-4" />
          </Link>
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          {tasks.length ? (
            tasks
              .slice(0, 2)
              .map((task) => <TaskCard key={task.id} task={task} />)
          ) : (
            <Empty
              icon={Store}
              text="Belum ada task. Buat task pertama Anda."
            />
          )}
        </div>
      </section>
      <section className="mt-10">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-orange-700">
              Pilihan teratas
            </p>
            <h2 className="mt-1 font-[var(--font-manrope)] text-2xl font-extrabold">
              Penyedia rekomendasi
            </h2>
          </div>
          <Link
            href="/penyedia"
            className="flex min-h-11 items-center gap-1 font-bold text-orange-700"
          >
            Jelajahi penyedia <ArrowUpRight className="size-4" />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {providers.slice(0, 3).map((provider) => (
            <ProviderCard key={provider.id} provider={provider} />
          ))}
        </div>
      </section>
    </div>
  );
}

function Empty({ icon: Icon, text }: { icon: typeof Store; text: string }) {
  return (
    <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
      <Icon className="mx-auto mb-3 size-7" />
      {text}
    </div>
  );
}
