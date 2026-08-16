"use client";

import { ArrowLeft, MessageSquareText, Search, Send } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { getConversations, getMessages, sendMessage } from "@/lib/api";
import { getSupabase } from "@/lib/supabase";
import type { Conversation, Message } from "@/types";

export function ChatPanel() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [active, setActive] = useState<Conversation>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [userId, setUserId] = useState("");
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");

  useEffect(() => {
    getSupabase()
      .auth.getUser()
      .then(({ data }) => setUserId(data.user?.id ?? ""));
    getConversations()
      .then((items) => {
        setConversations(items);
        setActive(items[0]);
      })
      .catch((cause: unknown) =>
        setError(
          cause instanceof Error ? cause.message : "Pesan gagal dimuat.",
        ),
      );
  }, []);
  useEffect(() => {
    if (!active) return;
    const refresh = () =>
      getMessages(active.id)
        .then(setMessages)
        .catch(() => setError("Isi percakapan gagal dimuat."));
    void refresh();
    const timer = window.setInterval(refresh, 3000);
    return () => window.clearInterval(timer);
  }, [active]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!active || !draft.trim()) return;
    try {
      await sendMessage(active.id, draft);
      setMessages(await getMessages(active.id));
      setDraft("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Pesan gagal dikirim.");
    }
  }
  if (!conversations.length)
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-20 text-center">
        <MessageSquareText className="mx-auto size-10 text-slate-400" />
        <h2 className="mt-4 font-[var(--font-manrope)] text-xl font-extrabold">
          Belum ada percakapan
        </h2>
        <p className="mt-2 text-slate-500">
          Percakapan muncul setelah task memiliki penyedia.
        </p>
        {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
      </div>
    );
  const filtered = conversations.filter((chat) =>
    chat.counterpartName.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <div className="grid h-[70dvh] min-h-[420px] overflow-hidden rounded-2xl border border-slate-200 bg-white lg:h-[650px] lg:grid-cols-[340px_1fr]">
      <aside className={`flex-col overflow-y-auto border-slate-200 lg:flex lg:border-b-0 lg:border-r ${mobileView === "chat" ? "hidden" : "flex"}`}>
        <div className="shrink-0 p-4">
          <label className="relative block">
            <span className="sr-only">Cari percakapan</span>
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari percakapan..."
              className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 outline-none focus:border-orange-500"
            />
          </label>
        </div>
        {filtered.map((chat) => (
          <button
            key={chat.id}
            type="button"
            onClick={() => {
              setActive(chat);
              setMobileView("chat");
            }}
            className={`flex min-h-20 w-full shrink-0 cursor-pointer items-center gap-3 border-t border-slate-100 px-4 text-left ${active?.id === chat.id ? "bg-orange-50" : "hover:bg-slate-50"}`}
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-slate-900 text-sm font-bold text-white">
              {chat.counterpartInitials}
            </span>
            <span className="min-w-0">
              <strong className="block truncate text-sm">
                {chat.counterpartName}
              </strong>
              <span className="mt-1 block truncate text-sm text-slate-500">
                {chat.lastMessage || "Mulai percakapan"}
              </span>
            </span>
          </button>
        ))}
      </aside>
      <section className={`min-h-0 flex-col lg:flex ${mobileView === "list" ? "hidden" : "flex"}`}>
        <header className="flex min-h-18 shrink-0 items-center gap-3 border-b border-slate-200 px-4 sm:px-5">
          <button
            type="button"
            onClick={() => setMobileView("list")}
            aria-label="Kembali ke daftar percakapan"
            className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-lg hover:bg-slate-100 lg:hidden"
          >
            <ArrowLeft className="size-5" />
          </button>
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-slate-900 text-sm font-bold text-white">
            {active?.counterpartInitials}
          </span>
          <strong className="min-w-0 truncate">{active?.counterpartName}</strong>
        </header>
        <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50 p-4 sm:p-5">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.senderId === userId ? "justify-end" : "justify-start"}`}
            >
              <p
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.senderId === userId ? "rounded-br-sm bg-orange-600 text-white" : "rounded-bl-sm border border-slate-200 bg-white text-slate-700"}`}
              >
                {message.body}
              </p>
            </div>
          ))}
        </div>
        <form
          onSubmit={submit}
          className="flex shrink-0 gap-3 border-t border-slate-200 p-4"
        >
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            aria-label="Tulis pesan"
            placeholder="Tulis pesan..."
            className="min-h-12 flex-1 rounded-xl border border-slate-300 px-4 outline-none focus:border-orange-600 focus:ring-4 focus:ring-orange-100"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            aria-label="Kirim pesan"
            className="grid size-12 cursor-pointer place-items-center rounded-xl bg-orange-600 text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="size-5" />
          </button>
        </form>
      </section>
    </div>
  );
}
