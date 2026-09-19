"use client";

import { ArrowLeft, MessageSquareText, Search, Send, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { getConversations, getMessages, markConversationRead, sendMessage, startProviderChat } from "@/lib/api";
import { CHAT_UNREAD_CHANGED } from "@/lib/chat-events";
import { getSupabase } from "@/lib/supabase";
import type { Conversation, Message } from "@/types";
import { ChatPushPrompt } from "./chat-push-prompt";

function newestFirst(chats: Conversation[]) {
  return [...chats].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}

function formatChatDate(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const startOfDay = (value: Date) => new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
  const diffDays = Math.round((startOfDay(now) - startOfDay(date)) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays > 1 && diffDays < 7) return date.toLocaleDateString("en-US", { weekday: "long" });
  return date.toLocaleDateString("en-GB");
}

export function ChatPanel({ initialProviderId }: { initialProviderId?: string } = {}) {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [active, setActive] = useState<Conversation>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [userId, setUserId] = useState("");
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const [startingChat, setStartingChat] = useState(Boolean(initialProviderId));
  const openChatId = useRef<string>(undefined);
  const lastMarkedRead = useRef("");

  const refreshConversations = useCallback(async () => {
    const items = await getConversations();
    setConversations(
      items.map((chat) => (chat.id === openChatId.current ? { ...chat, unreadCount: 0 } : chat)),
    );
  }, []);

  useEffect(() => {
    getSupabase()
      .auth.getUser()
      .then(({ data }) => setUserId(data.user?.id ?? ""));
    getConversations()
      .then(async (items) => {
        setConversations(items);
        if (!initialProviderId) return;
        try {
          const conversation = await startProviderChat(initialProviderId);
          setConversations((current) => [
            conversation,
            ...current.filter((chat) => chat.id !== conversation.id),
          ]);
          setActive(conversation);
          setMobileView("chat");
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : "Chat gagal dimulai.");
        } finally {
          setStartingChat(false);
          router.replace("/chat");
        }
      })
      .catch((cause: unknown) => {
        setError(
          cause instanceof Error ? cause.message : "Pesan gagal dimuat.",
        );
        setStartingChat(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Keep the list (order, last message, unread markers) current while it is on screen.
  useEffect(() => {
    if (mobileView !== "list") return;
    const timer = window.setInterval(() => {
      if (!document.hidden) void refreshConversations().catch(() => undefined);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [mobileView, refreshConversations]);
  // Poll the open chat; messages the viewer received count as read while it is open.
  useEffect(() => {
    if (!active || mobileView !== "chat") return;
    openChatId.current = active.id;
    lastMarkedRead.current = "";
    const refresh = async () => {
      try {
        const next = await getMessages(active.id);
        setMessages(next);
        const latestIncoming = userId ? next.findLast((message) => message.senderId !== userId) : undefined;
        if (latestIncoming && latestIncoming.id !== lastMarkedRead.current) {
          lastMarkedRead.current = latestIncoming.id;
          markConversationRead(active.id)
            .then(() => window.dispatchEvent(new Event(CHAT_UNREAD_CHANGED)))
            .catch(() => {
              lastMarkedRead.current = "";
            });
        }
      } catch {
        setError("Isi percakapan gagal dimuat.");
      }
    };
    void refresh();
    const timer = window.setInterval(refresh, 3000);
    return () => {
      window.clearInterval(timer);
      openChatId.current = undefined;
    };
  }, [active, mobileView, userId]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!active || !draft.trim()) return;
    try {
      const sent = await sendMessage(active.id, draft);
      setMessages(await getMessages(active.id));
      setConversations((current) =>
        newestFirst(
          current.map((chat) =>
            chat.id === active.id ? { ...chat, lastMessage: sent.body, updatedAt: sent.createdAt } : chat,
          ),
        ),
      );
      setDraft("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Pesan gagal dikirim.");
    }
  }

  if (startingChat)
    return <p className="py-16 text-center text-slate-500">Memulai percakapan...</p>;

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

  const filtered = newestFirst(conversations).filter((chat) =>
    chat.counterpartName.toLowerCase().includes(query.toLowerCase()),
  );

  if (mobileView === "chat" && active)
    return (
      <div className="flex h-[70dvh] min-h-[420px] flex-col lg:h-[650px]">
        <header className="flex min-h-16 shrink-0 items-center gap-3 border-b border-slate-200 pb-4">
          <button
            type="button"
            onClick={() => {
              setMobileView("list");
              void refreshConversations().catch(() => undefined);
            }}
            aria-label="Kembali ke daftar percakapan"
            className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-lg hover:bg-slate-100"
          >
            <ArrowLeft className="size-5" />
          </button>
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-blue-500 text-white">
            <UserRound className="size-6" strokeWidth={1.6} />
          </span>
          <span className="min-w-0">
            <strong className="block truncate">{active.counterpartName}</strong>
            <span className="block truncate text-xs text-slate-500">{active.provider.title}</span>
          </span>
        </header>
        <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50 p-4 sm:p-5">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.senderId === userId ? "justify-end" : "justify-start"}`}
            >
              <p
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.senderId === userId ? "rounded-br-sm bg-blue-600 text-white" : "rounded-bl-sm border border-slate-200 bg-white text-slate-700"}`}
              >
                {message.body}
              </p>
            </div>
          ))}
        </div>
        <form onSubmit={submit} className="flex shrink-0 gap-3 border-t border-slate-200 pt-4">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            aria-label="Tulis pesan"
            placeholder="Tulis pesan..."
            className="min-h-12 flex-1 rounded-xl border border-slate-300 px-4 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            aria-label="Kirim pesan"
            className="grid size-12 cursor-pointer place-items-center rounded-xl bg-blue-600 text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="size-5" />
          </button>
        </form>
      </div>
    );

  return (
    <div>
      <label className="relative block">
        <span className="sr-only">Cari percakapan</span>
        <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search..."
          className="min-h-12 w-full rounded-2xl border-0 bg-slate-100 pl-12 pr-4 text-base outline-none placeholder:text-slate-400 focus:ring-4 focus:ring-blue-100"
        />
      </label>

      <ChatPushPrompt />

      <h2 className="mb-1 mt-6 font-[var(--font-manrope)] text-2xl font-extrabold text-slate-950">
        Your chats
      </h2>

      {error && (
        <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </p>
      )}

      <div>
        {filtered.map((chat) => (
          <button
            key={chat.id}
            type="button"
            onClick={() => {
              setActive(chat);
              setConversations((current) =>
                current.map((item) => (item.id === chat.id ? { ...item, unreadCount: 0 } : item)),
              );
              setMobileView("chat");
            }}
            className="flex w-full cursor-pointer items-center gap-3 border-b border-slate-100 py-4 text-left"
          >
            <span className="grid size-14 shrink-0 place-items-center rounded-full bg-blue-500 text-white">
              <UserRound className="size-7" strokeWidth={1.6} />
            </span>
            <span className="min-w-0 flex-1">
              <strong className={`block truncate text-base text-slate-950 ${chat.unreadCount > 0 ? "font-extrabold" : ""}`}>
                {chat.counterpartName}
              </strong>
              <span className={`mt-0.5 block truncate text-sm ${chat.unreadCount > 0 ? "font-semibold text-slate-800" : "text-slate-500"}`}>
                {chat.provider.title}
              </span>
            </span>
            <span className="flex shrink-0 flex-col items-end gap-1.5">
              <span className={`text-sm ${chat.unreadCount > 0 ? "font-semibold text-blue-600" : "text-slate-400"}`}>
                {formatChatDate(chat.updatedAt)}
              </span>
              {chat.unreadCount > 0 && (
                <span
                  role="status"
                  aria-label={`${chat.unreadCount} pesan belum dibaca`}
                  className="grid h-6 min-w-6 place-items-center rounded-full bg-blue-600 px-1.5 text-xs font-bold text-white"
                >
                  {chat.unreadCount > 99 ? "99+" : chat.unreadCount}
                </span>
              )}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
