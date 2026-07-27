"use client";

import { MoreHorizontal, Phone, Search, Send } from "lucide-react";
import { FormEvent, useState } from "react";
import { conversations } from "@/lib/mock-data";

export function ChatPanel() {
  const [active, setActive] = useState(conversations[0]);
  const [messages, setMessages] = useState(["Halo Pak Ari, apakah masih sesuai jadwal?", "Tentu. Saya sudah dalam perjalanan ke lokasi."]);
  const [draft, setDraft] = useState("");
  const submit = (event: FormEvent) => { event.preventDefault(); if (!draft.trim()) return; setMessages([...messages, draft]); setDraft(""); };
  return (
    <div className="grid min-h-[650px] overflow-hidden rounded-2xl border border-slate-200 bg-white lg:grid-cols-[340px_1fr]">
      <aside className="border-b border-slate-200 lg:border-b-0 lg:border-r"><div className="p-4"><label className="relative block"><span className="sr-only">Cari percakapan</span><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><input placeholder="Cari percakapan..." className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 outline-none focus:border-orange-500" /></label></div><div>{conversations.map((chat) => <button key={chat.id} type="button" onClick={() => setActive(chat)} className={`flex min-h-20 w-full cursor-pointer items-center gap-3 border-t border-slate-100 px-4 text-left transition ${active.id === chat.id ? "bg-orange-50" : "hover:bg-slate-50"}`}><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-slate-900 text-sm font-bold text-white">{chat.initials}</span><span className="min-w-0 flex-1"><span className="flex justify-between gap-2"><strong className="truncate text-sm">{chat.name}</strong><small className="shrink-0 text-slate-400">{chat.time}</small></span><span className="mt-1 block truncate text-sm text-slate-500">{chat.message}</span></span>{chat.unread > 0 && <span className="grid size-5 place-items-center rounded-full bg-orange-600 text-[10px] font-bold text-white">{chat.unread}</span>}</button>)}</div></aside>
      <section className="flex min-h-[520px] flex-col"><header className="flex min-h-18 items-center gap-3 border-b border-slate-200 px-5"><span className="grid size-11 place-items-center rounded-xl bg-slate-900 text-sm font-bold text-white">{active.initials}</span><div className="flex-1"><strong className="block">{active.name}</strong><span className="text-xs font-semibold text-emerald-700">Online</span></div><button type="button" aria-label="Telepon" className="grid size-11 place-items-center rounded-xl hover:bg-slate-100"><Phone className="size-5" /></button><button type="button" aria-label="Opsi percakapan" className="grid size-11 place-items-center rounded-xl hover:bg-slate-100"><MoreHorizontal className="size-5" /></button></header>
        <div className="flex-1 space-y-4 bg-slate-50 p-5">{messages.map((message, index) => <div key={`${message}-${index}`} className={`flex ${index % 2 === 0 ? "justify-end" : "justify-start"}`}><p className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-6 ${index % 2 === 0 ? "rounded-br-sm bg-orange-600 text-white" : "rounded-bl-sm border border-slate-200 bg-white text-slate-700"}`}>{message}</p></div>)}</div>
        <form onSubmit={submit} className="flex gap-3 border-t border-slate-200 p-4"><input value={draft} onChange={(event) => setDraft(event.target.value)} aria-label="Tulis pesan" placeholder="Tulis pesan..." className="min-h-12 flex-1 rounded-xl border border-slate-300 px-4 outline-none focus:border-orange-600 focus:ring-4 focus:ring-orange-100" /><button type="submit" aria-label="Kirim pesan" className="grid size-12 cursor-pointer place-items-center rounded-xl bg-orange-600 text-white hover:bg-orange-700"><Send className="size-5" /></button></form>
      </section>
    </div>
  );
}
