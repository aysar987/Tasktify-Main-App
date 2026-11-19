"use client";

import { ArrowLeft, Check, CheckCheck, ChevronRight, Lock, MessageSquareText, Search, Send, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ApiError, getConversations, getMessages, getTask, markConversationRead, sendMessage, startMarketplaceListingChat, startProviderChat, startTaskChat } from "@/lib/api";
import { CHAT_UNREAD_CHANGED } from "@/lib/chat-events";
import { useConversationOpen } from "@/lib/chat-view";
import { getSupabase } from "@/lib/supabase";
import { rupiah } from "@/lib/format";
import type { Conversation, ConversationTask, Message } from "@/types";
import { ChatPushPrompt } from "./chat-push-prompt";
import { TaskThumbnail } from "./task-photos";
import { PageHeader, StatusBadge } from "./ui";

function newestFirst(chats: Conversation[]) {
  return [...chats].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}

const NO_MESSAGES: Message[] = [];
const messageTime = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

// Bubble corners are fully round (50) except the "tail" corner (15) at the bottom
// on the sender's side. A bubble stacked under one from the same person also
// flattens its top corner on that side, so a run of messages reads as one block.
function bubbleRadius(mine: boolean, joinsPrevious: boolean) {
  const round = "50px";
  const tail = "15px";
  // top-left top-right bottom-right bottom-left
  return mine
    ? `${round} ${joinsPrevious ? tail : round} ${tail} ${round}`
    : `${joinsPrevious ? tail : round} ${round} ${round} ${tail}`;
}

function formatChatDate(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const startOfDay = (value: Date) => new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
  const diffDays = Math.round((startOfDay(now) - startOfDay(date)) / 86400000);
  if (diffDays === 0) return "Hari ini";
  if (diffDays === 1) return "Kemarin";
  if (diffDays > 1 && diffDays < 7) return date.toLocaleDateString("id-ID", { weekday: "long" });
  return date.toLocaleDateString("id-ID");
}

// Only a visible, focused tab counts as reading; a chat left open in the
// background must still receive push notifications.
function isReading() {
  return document.visibilityState === "visible" && document.hasFocus();
}

export function ChatPanel({
  initialProviderId,
  initialMarketplaceListingId,
  initialConversationId,
  initialTaskId,
}: { initialProviderId?: string; initialMarketplaceListingId?: string; initialConversationId?: string; initialTaskId?: string } = {}) {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [active, setActive] = useState<Conversation>();
  // Messages are kept together with the conversation they belong to, so a
  // previously opened chat never flashes while the next one loads.
  const [thread, setThread] = useState<{ id: string; items: Message[] }>();
  const [userId, setUserId] = useState("");
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const [startingChat, setStartingChat] = useState(Boolean(initialProviderId || initialMarketplaceListingId || initialConversationId || initialTaskId));
  // Opened from a task page: the back button returns there instead of to the chat list.
  const [returnTo, setReturnTo] = useState<string>();
  const openChatId = useRef<string>(undefined);
  const lastMarkedRead = useRef("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrolledFor = useRef<string>(undefined);
  const stickToBottom = useRef(true);
  const setConversationOpen = useConversationOpen((state) => state.setOpen);
  const messages = thread && active && thread.id === active.id ? thread.items : NO_MESSAGES;

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
        if (initialConversationId) {
          // Opened from a push notification: go straight to that conversation.
          const target = items.find((chat) => chat.id === initialConversationId);
          if (target) {
            setActive({ ...target, unreadCount: 0 });
            setMobileView("chat");
          }
          setStartingChat(false);
          router.replace("/chat");
          return;
        }
        if (!initialProviderId && !initialMarketplaceListingId && !initialTaskId) return;
        try {
          const conversation = initialTaskId
            ? await startTaskChat(initialTaskId)
            : initialMarketplaceListingId
              ? await startMarketplaceListingChat(initialMarketplaceListingId)
              : await startProviderChat(initialProviderId!);
          if (initialTaskId) setReturnTo(`/tasks/${encodeURIComponent(initialTaskId)}`);
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
  useEffect(() => {
    setConversationOpen(mobileView === "chat" && Boolean(active));
  }, [mobileView, active, setConversationOpen]);
  useEffect(() => () => setConversationOpen(false), [setConversationOpen]);
  // Opening a chat lands on the newest message; afterwards new messages only
  // pull the view down while the reader is already near the bottom.
  useLayoutEffect(() => {
    const list = scrollRef.current;
    if (!list || !active || !messages.length) return;
    if (scrolledFor.current !== active.id) {
      scrolledFor.current = active.id;
      stickToBottom.current = true;
    }
    if (stickToBottom.current) list.scrollTop = list.scrollHeight;
  }, [messages, active, mobileView]);
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
        const next = await getMessages(active.id, isReading());
        setThread({ id: active.id, items: next });
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
  // Keep the pinned task card's status current while the conversation is open.
  const activeTaskId = mobileView === "chat" ? active?.task?.id : undefined;
  useEffect(() => {
    if (!activeTaskId) return;
    const refresh = () => {
      if (document.hidden) return;
      getTask(activeTaskId)
        .then((task) =>
          setActive((current) =>
            current?.task?.id === task.id && current.task.status !== task.status
              ? { ...current, task: { ...current.task, status: task.status } }
              : current,
          ),
        )
        .catch(() => undefined);
    };
    const timer = window.setInterval(refresh, 10000);
    return () => window.clearInterval(timer);
  }, [activeTaskId]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!active || !draft.trim() || active.readOnly) return;
    try {
      const sent = await sendMessage(active.id, draft);
      stickToBottom.current = true;
      setThread({ id: active.id, items: await getMessages(active.id, isReading()) });
      setConversations((current) =>
        newestFirst(
          current.map((chat) =>
            chat.id === active.id ? { ...chat, lastMessage: sent.body, updatedAt: sent.createdAt } : chat,
          ),
        ),
      );
      setDraft("");
    } catch (cause) {
      // The 7-day window may have passed while the chat was open.
      if (cause instanceof ApiError && cause.code === "CHAT_CLOSED") {
        setActive((current) => (current ? { ...current, readOnly: true } : current));
      }
      setError(cause instanceof Error ? cause.message : "Pesan gagal dikirim.");
    }
  }

  if (startingChat)
    return (
      <>
        <PageHeader title="Chat" />
        <p className="py-16 text-center text-slate-500">Memulai percakapan...</p>
      </>
    );

  if (!conversations.length)
    return (
      <>
      <PageHeader title="Chat" />
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
      </>
    );

  const filtered = newestFirst(conversations).filter((chat) =>
    `${chat.counterpartName} ${chat.task?.title ?? ""}`.toLowerCase().includes(query.toLowerCase()),
  );

  if (mobileView === "chat" && active)
    return (
      <div className="flex h-[calc(100dvh-3.5rem)] min-h-[420px] flex-col lg:h-[calc(100dvh-5rem)]">
        <header className="flex min-h-16 shrink-0 items-center gap-3 border-b border-slate-200 pb-4">
          <button
            type="button"
            onClick={() => {
              scrolledFor.current = undefined;
              if (returnTo) {
                router.push(returnTo);
                return;
              }
              setMobileView("list");
              void refreshConversations().catch(() => undefined);
            }}
            aria-label={returnTo ? "Kembali ke task" : "Kembali ke daftar percakapan"}
            className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-lg hover:bg-slate-100"
          >
            <ArrowLeft className="size-5" />
          </button>
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-blue-500 text-white">
            <UserRound className="size-6" strokeWidth={1.6} />
          </span>
          <span className="min-w-0">
            <strong className="block truncate">{active.counterpartName}</strong>
            <span className="block truncate text-xs text-slate-500">{conversationSubtitle(active)}</span>
          </span>
        </header>
        {active.task && <PinnedTaskCard task={active.task} />}
        <div
          ref={scrollRef}
          onScroll={(event) => {
            const list = event.currentTarget;
            stickToBottom.current = list.scrollHeight - list.scrollTop - list.clientHeight < 120;
          }}
          className="flex flex-1 flex-col overflow-y-auto bg-slate-50 p-4 sm:p-5"
        >
          {messages.map((message, index) => {
            const mine = message.senderId === userId;
            const joinsPrevious = index > 0 && messages[index - 1].senderId === message.senderId;
            return (
              <div
                key={message.id}
                className={`flex ${mine ? "justify-end" : "justify-start"} ${index === 0 ? "" : joinsPrevious ? "mt-1" : "mt-3"}`}
              >
                <div
                  style={{ borderRadius: bubbleRadius(mine, joinsPrevious) }}
                  className={`flex max-w-[80%] items-end gap-2 px-5 py-2 text-sm leading-6 ${mine ? "bg-[#1B8FDF] text-white" : "border border-slate-200 bg-white text-slate-700"}`}
                >
                  <p className="min-w-0 whitespace-pre-wrap break-words">{message.body}</p>
                  <span className={`flex shrink-0 items-center gap-1 text-xs leading-6 ${mine ? "text-white/85" : "text-slate-400"}`}>
                    <time dateTime={message.createdAt}>{messageTime.format(new Date(message.createdAt))}</time>
                    {mine &&
                      (message.readAt ? (
                        <span role="img" aria-label="Sudah dibaca" title="Sudah dibaca">
                          <CheckCheck className="size-4 text-[#45DF1B]" />
                        </span>
                      ) : (
                        <span role="img" aria-label="Terkirim" title="Terkirim">
                          <Check className="size-4 text-white/70" />
                        </span>
                      ))}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        {error && (
          <p role="alert" className="mt-3 shrink-0 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
            {error}
          </p>
        )}
        {active.readOnly ? (
          <p role="status" className="flex shrink-0 items-start gap-2 border-t border-slate-200 pt-4 text-sm leading-6 text-slate-600">
            <Lock className="mt-1 size-4 shrink-0 text-slate-400" />
            Percakapan ini sudah ditutup karena task telah berakhir lebih dari 7 hari. Anda masih bisa membaca pesan sebelumnya.
          </p>
        ) : (
        <>
        {active.closesAt && (
          <p className="shrink-0 pt-3 text-xs text-slate-500">
            Task sudah berakhir. Anda masih bisa mengirim pesan sampai {closingDate.format(new Date(active.closesAt))}.
          </p>
        )}
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
        </>
        )}
      </div>
    );

  return (
    <div>
      <PageHeader title="Chat" />
      <label className="relative block">
        <span className="sr-only">Cari percakapan</span>
        <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Cari nama atau task..."
          className="min-h-12 w-full rounded-2xl border-0 bg-slate-100 pl-12 pr-4 text-base outline-none placeholder:text-slate-400 focus:ring-4 focus:ring-blue-100"
        />
      </label>

      <ChatPushPrompt />

      <h2 className="mb-1 mt-6 font-[var(--font-manrope)] text-2xl font-extrabold text-slate-950">
        Percakapan Anda
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
              setError("");
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
                {conversationSubtitle(chat)}
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

const closingDate = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" });
const taskDate = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" });

/** Second line under the other person's name: the task, the lapak, or "Chat umum". */
function conversationSubtitle(chat: Conversation) {
  if (chat.task) return chat.task.title;
  if (chat.listing) return `Lapak · ${chat.listing.category}`;
  return "Chat umum";
}

/** The task this conversation is about, pinned above the messages. */
function PinnedTaskCard({ task }: { task: ConversationTask }) {
  return (
    <Link
      href={`/tasks/${encodeURIComponent(task.id)}`}
      className="mt-3 flex shrink-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 transition hover:border-orange-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200"
    >
      <TaskThumbnail images={task.images} className="size-12" />
      <span className="min-w-0 flex-1">
        <strong className="block truncate text-sm text-slate-950">{task.title}</strong>
        <span className="mt-0.5 block truncate text-xs text-slate-500">
          {rupiah(task.budget)} · {taskDate.format(new Date(task.schedule))}
        </span>
      </span>
      <StatusBadge status={task.status} />
      <ChevronRight className="size-4 shrink-0 text-slate-400" />
    </Link>
  );
}
