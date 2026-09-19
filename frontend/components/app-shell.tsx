"use client";

import { Briefcase, Bell, ChevronDown, Home, LogOut, MessageSquareText, Search, ShieldCheck } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getProfile, getUnreadConversationCount } from "@/lib/api";
import { CHAT_UNREAD_CHANGED } from "@/lib/chat-events";
import { disablePush } from "@/lib/push";
import { getSupabase } from "@/lib/supabase";
import type { Profile } from "@/types";
import { Brand } from "./brand";

const baseNavigation = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/market", label: "Market", icon: Briefcase },
  { href: "/notifications", label: "Notification", icon: Bell },
  { href: "/chat", label: "Chat", icon: MessageSquareText },
];

function UnreadBadge({ count, className = "" }: { count: number; className?: string }) {
  return (
    <span role="status" aria-label={`${count} percakapan belum dibaca`} className={`grid h-[18px] min-w-[18px] place-items-center rounded-full bg-blue-600 px-1 text-[10px] font-bold leading-none text-white ${className}`}>
      {count > 99 ? "99+" : count}
    </span>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profile, setProfile] = useState<Profile>();
  const [unreadChats, setUnreadChats] = useState(0);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { getProfile().then(setProfile).catch(() => undefined); }, []);
  useEffect(() => {
    let cancelled = false;
    const refresh = () =>
      getUnreadConversationCount()
        .then((count) => { if (!cancelled) setUnreadChats(count); })
        .catch(() => undefined);
    const refreshWhenVisible = () => { if (!document.hidden) void refresh(); };
    void refresh();
    const timer = window.setInterval(refreshWhenVisible, 10000);
    window.addEventListener(CHAT_UNREAD_CHANGED, refresh);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener(CHAT_UNREAD_CHANGED, refresh);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, []);
  useEffect(() => {
    // Dot/number on the installed app icon where the platform supports it.
    const badgeApi = navigator as Navigator & { setAppBadge?: (count?: number) => Promise<void>; clearAppBadge?: () => Promise<void> };
    const update = unreadChats > 0 ? badgeApi.setAppBadge?.(unreadChats) : badgeApi.clearAppBadge?.();
    update?.catch(() => undefined);
  }, [unreadChats]);
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isHome = pathname === "/dashboard";
  const navigation =
    profile?.role === "admin"
      ? [...baseNavigation, { href: "/admin", label: "Admin", icon: ShieldCheck }]
      : baseNavigation;
  const initials = (profile?.fullName || profile?.username || "U").split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

  async function logout() {
    await disablePush();
    await getSupabase().auth.signOut();
    window.location.assign("/login");
  }

  function search(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = String(new FormData(event.currentTarget).get("query") ?? "").trim();
    if (query) window.location.assign(`/market?q=${encodeURIComponent(query)}`);
  }

  return (
    <div className="min-h-dvh bg-slate-50">
      <a href="#main-content" className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-lg bg-slate-950 px-4 py-3 font-bold text-white focus:translate-y-0">Lewati ke konten</a>
      {isHome && (
        <header className="sticky top-0 z-40 hidden border-b border-slate-200 bg-white/95 backdrop-blur sm:block">
          <div className="flex h-18 items-center gap-3 px-4 sm:gap-5 sm:px-6 lg:px-8">
            <div className="shrink-0 sm:hidden"><Brand compact showLogo={false} /></div>
            <div className="hidden shrink-0 sm:block"><Brand showLogo={false} /></div>
            <div className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-3 sm:gap-4">
              <form onSubmit={search} className="relative min-w-0 flex-1 sm:max-w-56 lg:max-w-72">
                <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
                <input name="query" aria-label="Search" placeholder="Search..." className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100" />
              </form>
              <div ref={menuRef} className="relative shrink-0">
                <button
                  type="button"
                  aria-label="Account menu"
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                  onClick={() => setMenuOpen((current) => !current)}
                  className="flex size-11 items-center justify-center rounded-full border border-slate-200 bg-slate-50 p-0.5 transition hover:border-orange-300 hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200"
                >
                  {profile?.avatarUrl ? (
                    <Image unoptimized src={profile.avatarUrl} alt="Profile" width={40} height={40} className="size-10 rounded-full object-cover" />
                  ) : (
                    <span className="grid size-10 place-items-center rounded-full bg-slate-900 text-xs font-bold text-white">{initials}</span>
                  )}
                </button>

                {menuOpen && (
                  <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                    <div className="border-b border-slate-200 px-3 py-2">
                      <p className="text-xs font-semibold uppercase tracking-[.15em] text-slate-400">Account</p>
                      <p className="mt-1 truncate text-sm font-semibold text-slate-900">{profile?.fullName || profile?.username || "Pengguna"}</p>
                    </div>
                    <div className="py-1.5">
                      <Link href="/profile" onClick={() => setMenuOpen(false)} className="flex items-center justify-between px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-950">
                        <span>Manage Account</span>
                        <ChevronDown className="size-4 rotate-[-90deg]" />
                      </Link>
                      <Link href="/activity" onClick={() => setMenuOpen(false)} className="flex items-center justify-between px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-950">
                        <span>Activities</span>
                        <ChevronDown className="size-4 rotate-[-90deg]" />
                      </Link>
                      <button type="button" onClick={() => setMenuOpen(false)} className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-950">
                        <span>Settings</span>
                        <ChevronDown className="size-4 rotate-[-90deg]" />
                      </button>
                      <button type="button" onClick={() => { setMenuOpen(false); void logout(); }} className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-medium text-red-600 transition hover:bg-red-50">
                        <span>Logout</span>
                        <LogOut className="size-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
      )}
      <div className={`flex ${isHome ? "min-h-dvh sm:min-h-[calc(100dvh-4.5rem)]" : "min-h-dvh"}`}>
        <aside className={`sticky hidden w-64 shrink-0 self-stretch border-r border-slate-200 bg-white p-5 lg:block ${isHome ? "top-0 sm:top-18" : "top-0"}`}>
          <nav aria-label="Navigasi utama" className="space-y-1.5">
            {navigation.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return <Link key={href} href={href} className={`flex min-h-12 items-center gap-3 rounded-xl px-4 font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 ${active ? "bg-orange-50 text-orange-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"}`}><Icon className="size-7" />{label}{href === "/chat" && unreadChats > 0 && <UnreadBadge count={unreadChats} className="ml-auto" />}</Link>;
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

      {/* Mobile bottom navbar: show only icons for Home, Tasks, Notification, Pesan */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white shadow-[0_-8px_24px_rgba(15,23,42,0.08)] lg:hidden">
        <div className="mx-auto max-w-[1440px] px-4">
          <div className="flex justify-around py-2">
            {baseNavigation.slice(0, 4).map(({ href, icon: Icon, label }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`inline-flex flex-col items-center gap-1 py-1 ${active ? "text-orange-600" : "text-slate-600"}`}
                >
                  <span className="relative">
                    <Icon className="size-5" />
                    {href === "/chat" && unreadChats > 0 && <UnreadBadge count={unreadChats} className="absolute -right-2.5 -top-1.5" />}
                  </span>
                  <span className="mt-0.5 text-[11px] leading-3">{label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
      
    </div>
  );
}
