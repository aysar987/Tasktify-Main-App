"use client";

import { LoaderCircle, LocateFixed, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { getTaskLocation, publishTaskLocation } from "@/lib/api";
import type { TaskLocation } from "@/types";
import { primaryButton } from "./ui";

export function LiveLocation({ taskId, perspective, active }: { taskId: string; perspective?: "client" | "provider"; active: boolean }) {
  const [location, setLocation] = useState<TaskLocation>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const refresh = () => getTaskLocation(taskId).then(setLocation).catch(() => undefined);
    void refresh();
    const timer = window.setInterval(refresh, 5000);
    return () => window.clearInterval(timer);
  }, [taskId]);
  function share() {
    if (!navigator.geolocation) { setError("Browser tidak mendukung lokasi."); return; }
    setLoading(true); setError("");
    navigator.geolocation.getCurrentPosition(async (position) => {
      try { await publishTaskLocation(taskId, position.coords.latitude, position.coords.longitude); setLocation(await getTaskLocation(taskId)); }
      catch (cause) { setError(cause instanceof Error ? cause.message : "Lokasi gagal dibagikan."); } finally { setLoading(false); }
    }, () => { setError("Izin lokasi ditolak."); setLoading(false); }, { enableHighAccuracy: true });
  }
  return <section className="rounded-2xl border border-slate-200 bg-white p-6"><div className="flex items-center gap-3"><MapPin className="size-6 text-orange-600" /><div><h2 className="font-[var(--font-manrope)] text-lg font-extrabold">Lokasi pekerjaan</h2><p className="text-sm text-slate-500">{location ? `Diperbarui ${new Intl.DateTimeFormat("id-ID", { timeStyle: "short" }).format(new Date(location.updatedAt))}` : "Belum ada lokasi live."}</p></div></div>{location && <a target="_blank" rel="noreferrer" href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`} className={`${primaryButton} mt-5 w-full`}><LocateFixed className="size-5" /> Buka lokasi live</a>}{perspective === "provider" && active && <button type="button" onClick={share} disabled={loading} className={`${primaryButton} mt-3 w-full`}>{loading ? <LoaderCircle className="size-5 animate-spin" /> : <LocateFixed className="size-5" />} Bagikan lokasi saya</button>}{error && <p role="alert" className="mt-3 text-sm font-semibold text-red-700">{error}</p>}</section>;
}
