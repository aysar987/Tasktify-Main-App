"use client";

import { ArrowUpRight, Store } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ProviderCard } from "@/components/provider-card";
import { TaskCard } from "@/components/task-card";
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
  const initials = (profile?.fullName || profile?.username || "U")
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div>
      <section className="relative -mx-4 min-h-[220px] overflow-hidden sm:-mx-6 sm:min-h-[300px] lg:-mx-10">
        {activeSlideItem.kind === "photo" ? (
          <>
            <Image unoptimized src={activeSlideItem.banner.imageUrl} alt="" fill className="object-cover" />
            <Link href={activeSlideItem.banner.href} className="absolute inset-0" aria-label="Buka banner" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.28),transparent_30%)]" />
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

      <div className="relative z-10 mx-4 -mt-8 flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
        {profile?.avatarUrl ? (
          <Image unoptimized src={profile.avatarUrl} alt="" width={56} height={56} className="size-14 shrink-0 rounded-full object-cover" />
        ) : (
          <span className="grid size-14 shrink-0 place-items-center rounded-full bg-slate-900 text-lg font-bold text-white">
            {initials}
          </span>
        )}
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[.14em] text-slate-400">
            {new Intl.DateTimeFormat("id-ID", { dateStyle: "full" }).format(new Date())}
          </p>
          <h1 className="mt-1 truncate font-[var(--font-manrope)] text-xl font-extrabold text-slate-950 sm:text-2xl">
            Selamat datang, {profile?.fullName || profile?.username || "Pengguna"}.
          </h1>
        </div>
      </div>

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
