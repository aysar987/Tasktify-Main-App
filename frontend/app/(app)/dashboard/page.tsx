"use client";

import {
  ArrowUpRight,
  BriefcaseBusiness,
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

  useEffect(() => {
    if (banners.length < 2) return;
    const interval = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % banners.length);
    }, 4000);
    return () => window.clearInterval(interval);
  }, [banners.length]);

  const activeBanner = banners[activeSlide];

  return (
    <div>
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 px-6 py-8 text-white md:px-8 md:py-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.28),transparent_30%)]" />
        <div className="relative">
          <p className="text-sm font-bold uppercase tracking-[.18em] text-orange-100/90">
            {new Intl.DateTimeFormat("id-ID", { dateStyle: "full" }).format(new Date())}
          </p>
          <h1 className="mt-4 font-[var(--font-manrope)] text-3xl font-extrabold tracking-tight md:text-5xl">
            Selamat datang, {profile?.fullName || profile?.username || "Pengguna"}.
          </h1>
          {activeBanner && (
            <>
              <Link
                href={activeBanner.href}
                className="mt-6 block h-40 w-full overflow-hidden rounded-2xl border border-white/20 sm:h-56"
              >
                <div className="relative size-full">
                  <Image unoptimized src={activeBanner.imageUrl} alt="" fill className="object-cover" />
                </div>
              </Link>
              {banners.length > 1 && (
                <div className="mt-4 flex items-center gap-2">
                  {banners.map((banner, index) => (
                    <button
                      key={banner.id}
                      type="button"
                      aria-label={`Pilih banner ${index + 1}`}
                      onClick={() => setActiveSlide(index)}
                      className={`h-2.5 rounded-full transition ${
                        activeSlide === index ? "w-10 bg-white" : "w-2.5 bg-white/45 hover:bg-white/75"
                      }`}
                    />
                  ))}
                </div>
              )}
            </>
          )}
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
