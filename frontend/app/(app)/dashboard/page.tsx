"use client";

import {
  ArrowUpRight,
  BriefcaseBusiness,
  ChevronRight,
  Plus,
  Search,
  ShoppingBag,
  Store,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ProviderCard } from "@/components/provider-card";
import { TaskCard } from "@/components/task-card";
import { primaryButton } from "@/components/ui";
import { getProfile, getProviders, getTasks } from "@/lib/api";
import type { Profile, Provider, Task } from "@/types";

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    Promise.all([getProfile(), getTasks(), getProviders()]).then(
      ([nextProfile, nextTasks, nextProviders]) => {
        setProfile(nextProfile);
        setTasks(nextTasks);
        setProviders(nextProviders);
      },
    );
  }, []);

  const slides = useMemo(
    () => [
      {
        title: "Buat task dengan mudah",
        description: "Tulis kebutuhan Anda dan biarkan tenaga yang tepat siap membantu.",
        href: "/request-task",
        cta: "Buat Task",
        accent: "from-orange-500 via-orange-600 to-amber-500",
      },
      {
        title: "Ambil task yang sesuai",
        description: "Jelajahi tugas yang tersedia dan mulai bekerja dengan cepat.",
        href: "/marketplace",
        cta: "Ambil Task",
        accent: "from-sky-500 via-blue-600 to-indigo-600",
      },
      {
        title: "Marketplace yang lebih luas",
        description: "Temukan penyedia terbaik untuk kebutuhan Anda hari ini.",
        href: "/penyedia",
        cta: "Marketplace",
        accent: "from-emerald-500 via-teal-600 to-cyan-600",
      },
    ],
    [],
  );

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, 4000);
    return () => window.clearInterval(interval);
  }, [slides.length]);

  const activeSlideContent = slides[activeSlide];

  return (
    <div>
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 px-6 py-8 text-white md:px-8 md:py-10">
        <div className={`absolute inset-0 bg-gradient-to-r ${activeSlideContent.accent} opacity-90`} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.28),transparent_30%)]" />
        <div className="relative flex min-h-[220px] flex-col justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[.18em] text-orange-100/90">
              {new Intl.DateTimeFormat("id-ID", { dateStyle: "full" }).format(new Date())}
            </p>
            <h1 className="mt-4 font-[var(--font-manrope)] text-3xl font-extrabold tracking-tight md:text-5xl">
              Selamat datang, {profile?.fullName || profile?.username || "Pengguna"}.
            </h1>
          </div>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl">
              <p className="text-sm font-bold uppercase tracking-[.18em] text-white/80">
                {activeSlideContent.cta}
              </p>
              <h2 className="mt-2 font-[var(--font-manrope)] text-2xl font-extrabold md:text-3xl">
                {activeSlideContent.title}
              </h2>
              <p className="mt-2 max-w-lg text-sm leading-6 text-slate-100 md:text-base">
                {activeSlideContent.description}
              </p>
            </div>
            <Link href={activeSlideContent.href} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 font-bold text-slate-900 transition hover:bg-slate-100">
              {activeSlideContent.cta} <ChevronRight className="size-4" />
            </Link>
          </div>
          <div className="flex items-center gap-2">
            {slides.map((slide, index) => (
              <button
                key={slide.cta}
                type="button"
                aria-label={`Pilih banner ${slide.cta}`}
                onClick={() => setActiveSlide(index)}
                className={`h-2.5 rounded-full transition ${
                  activeSlide === index ? "w-10 bg-white" : "w-2.5 bg-white/45 hover:bg-white/75"
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-3 sm:grid-cols-3">
        <Link href="/request-task" className={`${primaryButton} justify-center`}>
          <Plus className="size-5" /> Buat Task
        </Link>
        <Link href="/marketplace" className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 font-bold text-slate-800 transition hover:border-orange-400 hover:text-orange-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200">
          <BriefcaseBusiness className="size-5" /> Ambil Task
        </Link>
        <Link href="/penyedia" className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 font-bold text-slate-800 transition hover:border-orange-400 hover:text-orange-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200">
          <ShoppingBag className="size-5" /> Marketplace
        </Link>
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
