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
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ProviderCard } from "@/components/provider-card";
import { TaskCard } from "@/components/task-card";
import { primaryButton } from "@/components/ui";
import { getBanners, getProfile, getProviders, getTasks } from "@/lib/api";
import type { Banner, Profile, Provider, Task } from "@/types";

type Slide = { kind: "default" } | { kind: "photo"; banner: Banner };

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    Promise.all([getProfile(), getTasks(), getProviders(), getBanners()]).then(
      ([nextProfile, nextTasks, nextProviders, nextBanners]) => {
        setProfile(nextProfile);
        setTasks(nextTasks);
        setProviders(nextProviders);
        setBanners(nextBanners);
      },
    );
  }, []);

  const slides: Slide[] = [
    { kind: "default" },
    ...banners.map((banner): Slide => ({ kind: "photo", banner })),
  ];

  useEffect(() => {
    if (slides.length < 2) return;
    const interval = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, 4000);
    return () => window.clearInterval(interval);
  }, [slides.length]);

  const activeSlideItem = slides[activeSlide] ?? slides[0];

  return (
    <div>
      <section className="relative min-h-[220px] overflow-hidden rounded-3xl border border-slate-200 sm:min-h-[300px]">
        {activeSlideItem.kind === "photo" ? (
          <>
            <Image unoptimized src={activeSlideItem.banner.imageUrl} alt="" fill className="object-cover" />
            <Link href={activeSlideItem.banner.href} className="absolute inset-0" aria-label="Buka banner" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.28),transparent_30%)]" />
            <div className="relative flex min-h-[220px] flex-col justify-between gap-6 px-6 pb-12 pt-8 text-white sm:min-h-[300px] md:px-8 md:pb-14 md:pt-10">
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
                  <p className="text-sm font-bold uppercase tracking-[.18em] text-white/80">Ambil Task</p>
                  <h2 className="mt-2 font-[var(--font-manrope)] text-2xl font-extrabold md:text-3xl">
                    Ambil task yang sesuai
                  </h2>
                  <p className="mt-2 max-w-lg text-sm leading-6 text-slate-100 md:text-base">
                    Jelajahi tugas yang tersedia dan mulai bekerja dengan cepat.
                  </p>
                </div>
                <Link
                  href="/marketplace"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 font-bold text-slate-900 transition hover:bg-slate-100"
                >
                  Ambil Task <ChevronRight className="size-4" />
                </Link>
              </div>
            </div>
          </>
        )}
        {slides.length > 1 && (
          <div className="pointer-events-none absolute inset-x-0 bottom-4 flex items-center justify-center gap-2">
            {slides.map((slide, index) => (
              <button
                key={slide.kind === "default" ? "default" : slide.banner.id}
                type="button"
                aria-label={`Pilih banner ${index + 1}`}
                onClick={() => setActiveSlide(index)}
                className={`pointer-events-auto h-2.5 rounded-full shadow transition ${
                  activeSlide === index ? "w-10 bg-white" : "w-2.5 bg-white/60 hover:bg-white/85"
                }`}
              />
            ))}
          </div>
        )}
      </section>

      <section className="mt-6">
        <div className="grid grid-cols-3 gap-6">
          <Link href="/request-task" className="flex flex-col items-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white shadow-sm">
              <Image src="/images/AddTask.svg" alt="Add Task" width={44} height={44} />
            </div>
            <span className="mt-2 text-sm font-semibold text-slate-700">Buat Task</span>
          </Link>

          <Link href="/marketplace" className="flex flex-col items-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white shadow-sm">
              <Image src="/images/DoTask.svg" alt="Do Task" width={44} height={44} />
            </div>
            <span className="mt-2 text-sm font-semibold text-slate-700">Ambil Task</span>
          </Link>

          <Link href="/penyedia" className="flex flex-col items-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white shadow-sm">
              <Image src="/images/MarketPlace.svg" alt="Marketplace" width={44} height={44} />
            </div>
            <span className="mt-2 text-sm font-semibold text-slate-700">Marketplace</span>
          </Link>
        </div>
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
