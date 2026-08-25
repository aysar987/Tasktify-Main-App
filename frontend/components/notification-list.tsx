"use client";

import { Bell, CheckCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getNotifications, markNotificationRead } from "@/lib/api";
import type { Notification } from "@/types";

export function NotificationList() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const next = await getNotifications();
        if (!cancelled) setItems(next);
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Notifikasi gagal dimuat.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    const timer = window.setInterval(load, 10000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  async function read(item: Notification) {
    if (item.readAt) return;
    setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, readAt: new Date().toISOString() } : n)));
    try {
      await markNotificationRead(item.id);
    } catch {
      setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, readAt: undefined } : n)));
    }
  }

  const unreadCount = items.filter((item) => !item.readAt).length;

  if (loading) return <p className="py-16 text-center text-slate-500">Memuat notifikasi...</p>;
  if (error)
    return (
      <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
        {error}
      </p>
    );
  if (!items.length)
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
        <Bell className="mx-auto mb-3 size-8 text-slate-400" />
        <h2 className="font-[var(--font-manrope)] text-xl font-extrabold">Belum ada notifikasi</h2>
        <p className="mt-2 text-slate-500">Kabar terbaru soal task Anda akan muncul di sini.</p>
      </div>
    );

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      {unreadCount > 0 && (
        <div className="flex items-center gap-2 bg-orange-50 px-5 py-3 text-sm font-semibold text-orange-700">
          <CheckCheck className="size-4" /> {unreadCount} belum dibaca
        </div>
      )}
      <div className="divide-y divide-slate-100">
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.href || "#"}
            onClick={() => void read(item)}
            className={`flex items-start gap-3 p-5 transition hover:bg-slate-50 ${item.readAt ? "" : "bg-orange-50/40"}`}
          >
            <span className={`mt-1.5 size-2 shrink-0 rounded-full ${item.readAt ? "bg-transparent" : "bg-orange-600"}`} />
            <div className="min-w-0 flex-1">
              <strong className="block text-sm">{item.title}</strong>
              <p className="mt-1 text-sm leading-6 text-slate-600">{item.body}</p>
              <span className="mt-2 block text-xs text-slate-400">
                {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.createdAt))}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
