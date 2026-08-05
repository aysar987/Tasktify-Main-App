"use client";

import { Briefcase, CircleUserRound, ClipboardList, LayoutDashboard, LogOut, Menu, MessageSquareText, Plus, Search, Store, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getProfile } from "@/lib/api";
import { getSupabase } from "@/lib/supabase";
import type { Profile } from "@/types";
import { Brand } from "./brand";
import { NotificationMenu } from "./notification-menu";
import { primaryButton } from "./ui";

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/marketplace", label: "Marketplace", icon: Briefcase },
  { href: "/penyedia", label: "Cari Penyedia", icon: Store },
  { href: "/activity", label: "Aktivitas", icon: ClipboardList },
  { href: "/chat", label: "Pesan", icon: MessageSquareText },
  { href: "/profile", label: "Profil", icon: CircleUserRound },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<Profile>();
  useEffect(() => { getProfile().then(setProfile).catch(() => undefined); }, []);
  const initials = (profile?.fullName || profile?.username || "U").split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  async function logout() {
    await getSupabase().auth.signOut();
    window.location.assign("/login");
  }
  function search(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = String(new FormData(event.currentTarget).get("query") ?? "").trim();
    if (query) window.location.assign(`/penyedia?q=${encodeURIComponent(query)}`);
  }

  return (
    <div className="min-h-dvh bg-slate-50">
      <a href="#main-content" className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-lg bg-slate-950 px-4 py-3 font-bold text-white focus:translate-y-0">Lewati ke konten</a>
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-18 max-w-[1440px] items-center gap-5 px-4 sm:px-6 lg:px-8">
          <button type="button" onClick={() => setOpen(true)} aria-label="Buka menu" className="grid size-11 place-items-center rounded-xl border border-slate-200 lg:hidden"><Menu className="size-5" /></button>
          <Brand />
          <form onSubmit={search} className="relative ml-auto hidden max-w-md flex-1 md:block">
            <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
            <input name="query" aria-label="Cari penyedia" placeholder="Cari penyedia..." className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100" />
          </form>
          <Link href="/request-task" className={`${primaryButton} ml-auto hidden sm:inline-flex`}><Plus className="size-5" /> Buat task</Link>
          <NotificationMenu />
          <Link href="/profile" className="flex min-h-11 items-center gap-3 rounded-xl p-1.5 hover:bg-slate-50">
            {profile?.avatarUrl ? <Image unoptimized src={profile.avatarUrl} alt="" width={36} height={36} className="size-9 rounded-lg object-cover" /> : <span className="grid size-9 place-items-center rounded-lg bg-slate-900 text-sm font-bold text-white">{initials}</span>}
            <span className="hidden text-left xl:block"><strong className="block max-w-36 truncate text-sm">{profile?.fullName || profile?.username || "Pengguna"}</strong><span className="text-xs text-slate-500">{profile?.provider ? "Provider" : "Client"}</span></span>
          </Link>
          <button type="button" onClick={logout} aria-label="Keluar" className="grid size-11 cursor-pointer place-items-center rounded-xl border border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-700"><LogOut className="size-5" /></button>
        </div>
      </header>
      <div className="mx-auto flex max-w-[1440px]">
        <aside className="sticky top-18 hidden h-[calc(100vh-4.5rem)] w-64 shrink-0 border-r border-slate-200 bg-white p-5 lg:block">
          <nav aria-label="Navigasi utama" className="space-y-1.5">
            {navigation.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return <Link key={href} href={href} className={`flex min-h-12 items-center gap-3 rounded-xl px-4 font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 ${active ? "bg-orange-50 text-orange-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"}`}><Icon className="size-5" />{label}</Link>;
            })}
          </nav>
          <div className="mt-8 rounded-2xl border border-orange-200 bg-orange-50 p-4">
            <p className="text-sm font-extrabold text-slate-950">Butuh bantuan cepat?</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">Buat task dan temukan ahlinya dalam beberapa menit.</p>
            <Link href="/request-task" className="mt-4 inline-flex min-h-10 items-center font-bold text-orange-700">Mulai sekarang →</Link>
          </div>
        </aside>
        <main id="main-content" className="min-w-0 flex-1 px-4 py-7 sm:px-6 lg:px-10 lg:py-10">{children}</main>
      </div>
      {open && <div className="fixed inset-0 z-50 lg:hidden"><button type="button" aria-label="Tutup menu" onClick={() => setOpen(false)} className="absolute inset-0 bg-slate-950/50" /><aside className="relative h-full w-[min(86vw,320px)] bg-white p-5"><div className="flex items-center justify-between"><Brand /><button type="button" onClick={() => setOpen(false)} aria-label="Tutup menu" className="grid size-11 place-items-center rounded-xl border border-slate-200"><X className="size-5" /></button></div><nav className="mt-8 space-y-2">{navigation.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={() => setOpen(false)} className="flex min-h-12 items-center gap-3 rounded-xl px-4 font-semibold text-slate-700 hover:bg-slate-50"><Icon className="size-5" />{label}</Link>)}</nav></aside></div>}
    </div>
  );
}
