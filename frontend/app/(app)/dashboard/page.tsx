"use client";

import { ArrowUpRight, ChevronDown, LogOut, Search, Store } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ProviderCard } from "@/components/provider-card";
import { TaskCard } from "@/components/task-card";
import { getBanners, getProfile, getProviders, getTasks } from "@/lib/api";
import { getSupabase } from "@/lib/supabase";
import type { Banner, Profile, Provider, Task } from "@/types";

type Slide = { kind: "default" } | { kind: "photo"; banner: Banner };

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

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
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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

  function search(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = String(new FormData(event.currentTarget).get("query") ?? "").trim();
    if (query) window.location.assign(`/penyedia?q=${encodeURIComponent(query)}`);
  }

  async function logout() {
    await getSupabase().auth.signOut();
    window.location.assign("/login");
  }

  return (
    <div>
      <section className="relative -mx-4 -mt-7 min-h-[220px] overflow-hidden sm:-mx-6 sm:min-h-[300px] lg:-mx-10 lg:-mt-10">
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
        <div className="absolute inset-x-4 top-4 z-20 flex items-center gap-3 sm:hidden">
          <form onSubmit={search} className="relative min-w-0 flex-1">
            <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-500" />
            <input name="query" aria-label="Search" placeholder="Search..." className="min-h-11 w-full rounded-full border-0 bg-white/95 pl-12 pr-4 text-slate-900 shadow-sm outline-none focus:ring-4 focus:ring-white/50" />
          </form>
          <div ref={menuRef} className="relative shrink-0">
            <button
              type="button"
              aria-label="Account menu"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              onClick={() => setMenuOpen((current) => !current)}
              className="flex size-11 items-center justify-center rounded-full border-2 border-white bg-white/95 p-0.5 shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/50"
            >
              {profile?.avatarUrl ? (
                <Image unoptimized src={profile.avatarUrl} alt="Profile" width={40} height={40} className="size-9 rounded-full object-cover" />
              ) : (
                <span className="grid size-9 place-items-center rounded-full bg-slate-900 text-xs font-bold text-white">{initials}</span>
              )}
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full z-30 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                <div className="border-b border-slate-200 px-3 py-2">
                  <p className="text-xs font-semibold uppercase tracking-[.15em] text-slate-400">Account</p>
                  <p className="mt-1 truncate text-sm font-semibold text-slate-900">{profile?.fullName || profile?.username || "Pengguna"}</p>
                </div>
                <div className="py-1.5">
                  <Link href="/profile" onClick={() => setMenuOpen(false)} className="flex items-center justify-between px-3 py-2 text-sm font-medium text-slate-700"><span>Manage Account</span><ChevronDown className="size-4 -rotate-90" /></Link>
                  <Link href="/activity" onClick={() => setMenuOpen(false)} className="flex items-center justify-between px-3 py-2 text-sm font-medium text-slate-700"><span>Activities</span><ChevronDown className="size-4 -rotate-90" /></Link>
                  <button type="button" onClick={() => { setMenuOpen(false); void logout(); }} className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-medium text-red-600"><span>Logout</span><LogOut className="size-4" /></button>
                </div>
              </div>
            )}
          </div>
        </div>
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

      <div className="relative z-10 -mt-10 -mx-4 -mb-7 rounded-3xl bg-orange-600 pb-10 pt-6 sm:-mx-6 sm:-mt-12 lg:-mx-10 lg:-mt-14 lg:-mb-10">
        <div className="px-4 sm:px-6 lg:px-10">
          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
            {profile?.avatarUrl ? (
              <Image unoptimized src={profile.avatarUrl} alt="" width={56} height={56} className="size-14 shrink-0 rounded-full object-cover" />
            ) : (
              <span className="grid size-14 shrink-0 place-items-center rounded-full bg-slate-900 text-lg font-bold text-white">
                {initials}
              </span>
            )}
            <div className="min-w-0">
              <h1 className="truncate font-[var(--font-manrope)] text-xl font-bold text-slate-950 sm:text-xl">
                {profile?.fullName || profile?.username || "Pengguna"}.
              </h1>
            </div>
          </div>

          <section className="mt-6">
            <div className="grid grid-cols-3 gap-6">
              <Link href="/request-task" className="flex flex-col items-center">
                <div className="flex h-16 w-16 items-center justify-center">
                  <Image src="/images/AddTask.svg" alt="Add Task" width={100} height={100} />
                </div>
                <span className="mt-2 text-sm font-semibold text-white">Buat Task</span>
              </Link>

              <Link href="/marketplace" className="flex flex-col items-center">
                <div className="flex h-16 w-16 items-center justify-center">
                  <Image src="/images/DoTask.svg" alt="Do Task" width={100} height={100} />
                </div>
                <span className="mt-2 text-sm font-semibold text-white">Ambil Task</span>
              </Link>

              <Link href="/penyedia" className="flex flex-col items-center">
                <div className="flex h-16 w-16 items-center justify-center">
                  <Image src="/images/MarketPlace.svg" alt="Marketplace" width={100} height={100} />
                </div>
                <span className="mt-2 text-sm font-semibold text-white">Marketplace</span>
              </Link>
            </div>
          </section>
          <section className="mt-10">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-wider text-white/70">
                  Aktivitas terbaru
                </p>
                <h2 className="mt-1 font-[var(--font-manrope)] text-2xl font-extrabold text-white">
                  Task Anda
                </h2>
              </div>
              <Link
                href="/activity"
                className="flex min-h-11 items-center gap-1 font-bold text-white"
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
                <p className="text-sm font-bold uppercase tracking-wider text-white/70">
                  Pilihan teratas
                </p>
                <h2 className="mt-1 font-[var(--font-manrope)] text-2xl font-extrabold text-white">
                  Penyedia rekomendasi
                </h2>
              </div>
              <Link
                href="/penyedia"
                className="flex min-h-11 items-center gap-1 font-bold text-white"
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
      </div>
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
