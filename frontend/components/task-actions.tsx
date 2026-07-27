"use client";

import { Ban, MessageSquareText, Star } from "lucide-react";
import { useState } from "react";
import { primaryButton, secondaryButton } from "./ui";

export function TaskActions({ completed = false }: { completed?: boolean }) {
  const [cancelled, setCancelled] = useState(false);
  if (cancelled) return <div role="status" className="rounded-xl border border-red-200 bg-red-50 p-4 font-semibold text-red-700">Task telah dibatalkan. Penyedia akan menerima notifikasi.</div>;
  return completed ? <button type="button" className={`${primaryButton} w-full`}><Star className="size-5" /> Beri rating</button> : <div className="grid gap-3"><button type="button" className={`${primaryButton} w-full`}><MessageSquareText className="size-5" /> Hubungi penyedia</button><button type="button" onClick={() => setCancelled(true)} className={`${secondaryButton} w-full border-red-200 text-red-700 hover:bg-red-50`}><Ban className="size-5" /> Batalkan task</button></div>;
}
