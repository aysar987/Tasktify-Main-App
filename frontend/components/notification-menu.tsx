"use client";

import { Bell, CheckCheck, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { getNotifications, markNotificationRead } from "@/lib/api";
import type { Notification } from "@/types";

type Toast = { id: string; title: string; body: string; href?: string };

export function NotificationMenu() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seen = useRef(new Set<string>());
  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);
  const refresh = useCallback(async (showToasts = false) => {
    const next = await getNotifications();
    if (showToasts) {
      const fresh = next.filter((item) => !seen.current.has(item.id));
      for (const item of fresh) {
        setToasts((prev) => [...prev, { id: item.id, title: item.title, body: item.body, href: item.href }]);
        window.setTimeout(() => dismissToast(item.id), 6000);
      }
    }
    seen.current = new Set(next.map((item) => item.id));
    setItems(next);
  }, [dismissToast]);
  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(true), 5000);
    return () => window.clearInterval(timer);
  }, [refresh]);
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
