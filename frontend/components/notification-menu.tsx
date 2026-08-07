"use client";

import { Bell, CheckCheck, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getNotifications, markNotificationRead } from "@/lib/api";
import { getSupabase } from "@/lib/supabase";
import type { Notification } from "@/types";

type Toast = { id: string; title: string; body: string; href?: string };

export function NotificationMenu() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  async function refresh() { setItems(await getNotifications()); }
  function dismissToast(id: string) { setToasts((prev) => prev.filter((toast) => toast.id !== id)); }
  useEffect(() => {
    getNotifications().then(setItems).catch(() => undefined);
    const channel = getSupabase()
      .channel("notifications")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, (payload) => {
        refresh().catch(() => undefined);
        const row = payload.new as { id: string; title: string; body: string; href?: string };
        setToasts((prev) => [...prev, { id: row.id, title: row.title, body: row.body, href: row.href }]);
        window.setTimeout(() => dismissToast(row.id), 6000);
      })
      .subscribe();
    return () => { void getSupabase().removeChannel(channel); };
  }, []);
  const unread = items.filter((item) => !item.readAt).length;
  async function read(item: Notification) { if (!item.readAt) { await markNotificationRead(item.id); await refresh(); } setOpen(false); }
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(!open)} aria-label={`Notifikasi${unread ? `, ${unread} belum dibaca` : ""}`} aria-expanded={open} className="relative grid size-11 cursor-pointer place-items-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50"><Bell className="size-5" />{unread > 0 && <span className="absolute right-1 top-1 grid min-h-4 min-w-4 place-items-center rounded-full bg-orange-600 px-1 text-[10px] font-bold text-white">{unread}</span>}</button>
      {open && <div className="absolute right-0 top-13 z-50 w-[min(90vw,360px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"><div className="flex items-center justify-between border-b border-slate-100 p-4"><strong>Notifikasi</strong><CheckCheck className="size-5 text-slate-400" /></div><div className="max-h-96 overflow-y-auto">{items.length ? items.map((item) => <Link key={item.id} href={item.href || "#"} onClick={() => void read(item)} className={`block border-b border-slate-100 p-4 hover:bg-slate-50 ${item.readAt ? "" : "bg-orange-50"}`}><strong className="block text-sm">{item.title}</strong><span className="mt-1 block text-sm leading-5 text-slate-600">{item.body}</span></Link>) : <p className="p-8 text-center text-sm text-slate-500">Belum ada notifikasi.</p>}</div></div>}
      <div aria-live="polite" className="fixed bottom-4 right-4 z-[100] flex w-[min(92vw,360px)] flex-col gap-3">
        {toasts.map((toast) => (
          <div key={toast.id} role="status" className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-white p-4 shadow-xl">
            <Link href={toast.href || "#"} onClick={() => dismissToast(toast.id)} className="min-w-0 flex-1">
              <strong className="block text-sm">{toast.title}</strong>
              <p className="mt-1 text-sm leading-5 text-slate-600">{toast.body}</p>
            </Link>
            <button type="button" onClick={() => dismissToast(toast.id)} aria-label="Tutup notifikasi" className="shrink-0 cursor-pointer text-slate-400 hover:text-slate-600">
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
