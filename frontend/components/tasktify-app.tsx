"use client";

import {
  Bell,
  BriefcaseBusiness,
  CalendarClock,
  ChevronRight,
  ClipboardList,
  Home,
  MapPin,
  MessageCircle,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Star,
  Store,
  UserRound,
  Wrench,
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { chats, providers, tasks } from "@/lib/data";
import type { Provider, Route, TaskStatus } from "@/types";
import {
  ActionButton,
  Avatar,
  buttonPrimary,
  buttonSecondary,
  fieldClass,
  ProviderCard,
  Topbar,
} from "./ui";

const navItems = [
  { route: "home" as const, label: "Beranda", icon: Home },
  { route: "market" as const, label: "Market", icon: Store },
  { route: "activity" as const, label: "Aktivitas", icon: ClipboardList },
  { route: "chat" as const, label: "Chat", icon: MessageCircle },
];

export function TasktifyApp() {
  const [route, setRoute] = useState<Route>("login");
  const [history, setHistory] = useState<Route[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<Provider>(providers[0]);
  const [search, setSearch] = useState("");
  const [taskFilter, setTaskFilter] = useState<TaskStatus>("Berjalan");
  const [toast, setToast] = useState("");

  const navigate = (next: Route) => {
    setHistory((current) => [...current, route]);
    setRoute(next);
  };

  const back = () => {
    const previous = history.at(-1) ?? "home";
    setHistory((current) => current.slice(0, -1));
    setRoute(previous);
  };

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 3000);
  };

  const selectProvider = (provider: Provider) => {
    setSelectedProvider(provider);
    navigate("provider");
  };

  const screens: Record<Route, React.ReactNode> = {
    login: <Login onLogin={() => setRoute("home")} onRegister={() => navigate("register")} />,
    register: <Register onBack={back} onSubmit={() => setRoute("home")} />,
    home: <HomeScreen navigate={navigate} selectProvider={selectProvider} />,
    market: (
      <Market
        query={search}
        setQuery={setSearch}
        selectProvider={selectProvider}
        onProfile={() => navigate("profile")}
      />
    ),
    provider: (
      <ProviderDetail
        provider={selectedProvider}
        onBack={back}
        onRequest={() => navigate("request")}
        onMessage={() => {
          notify("Percakapan dibuka");
          navigate("chat");
        }}
      />
    ),
    activity: (
      <Activity
        filter={taskFilter}
        setFilter={setTaskFilter}
        onCreate={() => navigate("request")}
      />
    ),
    request: <RequestTask onBack={back} onSubmit={() => { notify("Permintaan berhasil dibuat"); setRoute("activity"); }} />,
    chat: <ChatScreen onProfile={() => navigate("profile")} />,
    profile: <Profile onBack={back} notify={notify} />,
  };

  const showNavigation = !["login", "register", "provider", "request"].includes(route);

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-slate-50 text-slate-950 sm:my-7 sm:h-[860px] sm:min-h-0 sm:rounded-[2.25rem] sm:border-8 sm:border-slate-950 sm:shadow-2xl">
      <div className="min-h-0 flex-1 overflow-y-auto">{screens[route]}</div>
      {showNavigation && <BottomNavigation route={route} navigate={setRoute} />}
      <div
        aria-live="polite"
        className={`pointer-events-none absolute bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold whitespace-nowrap text-white shadow-xl transition ${
          toast ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
        }`}
      >
        {toast}
      </div>
    </div>
  );
}

function Login({ onLogin, onRegister }: { onLogin: () => void; onRegister: () => void }) {
  return (
    <main className="flex min-h-full flex-col px-7 py-10">
      <div className="mb-12 flex items-center gap-3">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-600 text-white">
          <Wrench className="size-6" />
        </div>
        <span className="text-xl font-black tracking-tight">Tasktify</span>
      </div>
      <div className="mb-8">
        <p className="mb-2 text-sm font-bold text-blue-700">Selamat datang kembali</p>
        <h1 className="text-3xl font-black tracking-tight">Masuk ke akun Anda</h1>
        <p className="mt-3 leading-6 text-slate-500">Temukan tenaga profesional tepercaya untuk kebutuhan sehari-hari.</p>
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onLogin();
        }}
        className="space-y-5"
      >
        <label className="block text-sm font-semibold text-slate-700">
          Email
          <input className={`${fieldClass} mt-2`} type="email" autoComplete="email" placeholder="nama@email.com" required />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Password
          <input className={`${fieldClass} mt-2`} type="password" autoComplete="current-password" placeholder="Masukkan password" required />
        </label>
        <button type="submit" className={buttonPrimary}>Masuk</button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        Belum punya akun?{" "}
        <button type="button" onClick={onRegister} className="min-h-11 cursor-pointer font-bold text-blue-700 hover:underline">
          Daftar
        </button>
      </p>
    </main>
  );
}

function Register({ onBack, onSubmit }: { onBack: () => void; onSubmit: () => void }) {
  return (
    <main>
      <Topbar title="Buat akun" onBack={onBack} />
      <form onSubmit={(event) => { event.preventDefault(); onSubmit(); }} className="space-y-5 px-6 pb-10 pt-4">
        <div>
          <h2 className="text-2xl font-black">Mulai bersama Tasktify</h2>
          <p className="mt-2 text-slate-500">Gunakan satu akun untuk meminta bantuan atau menawarkan keahlian.</p>
        </div>
        {[
          ["Nama lengkap", "text", "Nama Anda", "name"],
          ["Nomor telepon", "tel", "+62 ...", "tel"],
          ["Email", "email", "nama@email.com", "email"],
          ["Password", "password", "Minimal 8 karakter", "new-password"],
        ].map(([label, type, placeholder, autocomplete]) => (
          <label key={label} className="block text-sm font-semibold text-slate-700">
            {label}
            <input className={`${fieldClass} mt-2`} type={type} placeholder={placeholder} autoComplete={autocomplete} required />
          </label>
        ))}
        <ActionButton type="submit">Daftar sekarang</ActionButton>
      </form>
    </main>
  );
}

function HomeScreen({
  navigate,
  selectProvider,
}: {
  navigate: (route: Route) => void;
  selectProvider: (provider: Provider) => void;
}) {
  return (
    <main>
      <header className="flex items-center gap-3 px-5 pb-3 pt-5">
        <button type="button" onClick={() => navigate("profile")} aria-label="Buka profil" className="cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200">
          <Avatar name="Matthew Alden" />
        </button>
        <div className="flex-1">
          <span className="text-xs text-slate-500">Selamat datang,</span>
          <h1 className="font-extrabold">Matthew Alden</h1>
        </div>
        <button type="button" aria-label="Notifikasi" className="flex size-11 cursor-pointer items-center justify-center rounded-full bg-white shadow-sm focus-visible:ring-4 focus-visible:ring-blue-200">
          <Bell className="size-5" />
        </button>
      </header>
      <div className="space-y-6 px-5 pb-8">
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-500 to-blue-800 p-6 text-white shadow-lg shadow-blue-200">
          <div className="absolute -bottom-8 -right-5 size-32 rounded-full bg-white/10" />
          <p className="text-sm font-medium text-blue-100">Butuh bantuan hari ini?</p>
          <h2 className="mt-2 max-w-60 text-2xl font-black tracking-tight">Serahkan tugasnya kepada ahlinya.</h2>
          <button type="button" onClick={() => navigate("request")} className="mt-5 flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-white px-4 font-bold text-blue-700 transition hover:bg-blue-50">
            <Plus className="size-4" /> Buat permintaan
          </button>
        </section>
        <section>
          <h2 className="mb-3 text-base font-extrabold">Akses cepat</h2>
          <div className="grid grid-cols-2 gap-3">
            <QuickAction icon={Search} title="Cari tenaga ahli" subtitle="Lihat marketplace" onClick={() => navigate("market")} />
            <QuickAction icon={CalendarClock} title="Aktivitas saya" subtitle="Pantau pesanan" onClick={() => navigate("activity")} />
          </div>
        </section>
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-extrabold">Profesional terbaik</h2>
            <button type="button" onClick={() => navigate("market")} className="min-h-11 cursor-pointer text-sm font-bold text-blue-700">Lihat semua</button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {providers.slice(0, 4).map((provider) => <ProviderCard key={provider.id} provider={provider} onClick={() => selectProvider(provider)} />)}
          </div>
        </section>
      </div>
    </main>
  );
}

function QuickAction({ icon: Icon, title, subtitle, onClick }: { icon: typeof Search; title: string; subtitle: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200">
      <span className="mb-4 flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><Icon className="size-5" /></span>
      <strong className="block text-sm">{title}</strong>
      <span className="mt-1 block text-xs text-slate-500">{subtitle}</span>
    </button>
  );
}

function Market({ query, setQuery, selectProvider, onProfile }: { query: string; setQuery: (value: string) => void; selectProvider: (provider: Provider) => void; onProfile: () => void }) {
  const results = useMemo(() => providers.filter((provider) => `${provider.name} ${provider.role} ${provider.category}`.toLowerCase().includes(query.toLowerCase())), [query]);
  return (
    <main>
      <Topbar title="Marketplace" action={<button type="button" onClick={onProfile} aria-label="Profil" className="cursor-pointer rounded-full"><Avatar name="Matthew Alden" size="sm" /></button>} />
      <div className="px-5 pb-8">
        <label className="relative block">
          <span className="sr-only">Cari tenaga profesional</span>
          <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} className={`${fieldClass} pl-12`} placeholder="Cari layanan atau nama..." />
        </label>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
          {["Semua", "Listrik", "Plumbing", "AC", "Medis"].map((category) => <button key={category} type="button" className="min-h-10 shrink-0 cursor-pointer rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold hover:border-blue-500 hover:text-blue-700">{category}</button>)}
        </div>
        <p className="mb-3 mt-4 text-sm font-semibold text-slate-500">{results.length} profesional ditemukan</p>
        <div className="grid grid-cols-2 gap-3">
          {results.map((provider) => <ProviderCard key={provider.id} provider={provider} onClick={() => selectProvider(provider)} />)}
        </div>
      </div>
    </main>
  );
}

function ProviderDetail({ provider, onBack, onRequest, onMessage }: { provider: Provider; onBack: () => void; onRequest: () => void; onMessage: () => void }) {
  return (
    <main>
      <Topbar title="Profil profesional" onBack={onBack} />
      <div className="px-6 pb-10">
        <section className="flex flex-col items-center py-5 text-center">
          <Avatar name={provider.name} size="lg" />
          <h2 className="mt-4 text-2xl font-black">{provider.name}</h2>
          <p className="mt-1 text-sm font-semibold text-blue-700">{provider.role}</p>
          <p className="mt-2 flex items-center gap-1 text-sm text-slate-500"><MapPin className="size-4" /> {provider.location}</p>
        </section>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center"><Star className="mx-auto size-5 fill-amber-400 text-amber-400" /><strong className="mt-2 block">{provider.rating.toFixed(1)}</strong><span className="text-xs text-slate-500">Rating</span></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center"><BriefcaseBusiness className="mx-auto size-5 text-blue-700" /><strong className="mt-2 block">{provider.experience}</strong><span className="text-xs text-slate-500">Pengalaman</span></div>
        </div>
        <section className="mt-6">
          <h3 className="font-extrabold">Tentang</h3>
          <p className="mt-2 leading-7 text-slate-600">{provider.about}</p>
        </section>
        <div className="mt-7 space-y-3">
          <ActionButton type="button" onClick={onRequest}>Minta bantuan</ActionButton>
          <button type="button" onClick={onMessage} className={buttonSecondary}>Kirim pesan</button>
        </div>
      </div>
    </main>
  );
}

function Activity({ filter, setFilter, onCreate }: { filter: TaskStatus; setFilter: (status: TaskStatus) => void; onCreate: () => void }) {
  const filtered = tasks.filter((task) => task.status === filter);
  return (
    <main>
      <Topbar title="Aktivitas" action={<button type="button" onClick={onCreate} aria-label="Buat permintaan" className="flex size-11 cursor-pointer items-center justify-center rounded-full bg-blue-600 text-white"><Plus className="size-5" /></button>} />
      <div className="px-5 pb-8">
        <div className="mb-5 grid grid-cols-3 rounded-full border border-slate-200 bg-white p-1">
          {(["Berjalan", "Terjadwal", "Selesai"] as TaskStatus[]).map((status) => <button key={status} type="button" onClick={() => setFilter(status)} className={`min-h-10 cursor-pointer rounded-full text-xs font-bold transition ${filter === status ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-50"}`}>{status}</button>)}
        </div>
        {filtered.length ? filtered.map((task) => (
          <article key={task.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3"><Avatar name={task.provider} size="sm" /><div className="min-w-0 flex-1"><strong className="block truncate text-sm">{task.provider}</strong><span className="text-xs text-slate-500">{task.date}</span></div><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{task.status}</span></div>
            <h2 className="mt-4 font-extrabold">{task.title}</h2><p className="mt-1 text-sm text-slate-500">{task.description}</p>
          </article>
        )) : <EmptyState onCreate={onCreate} />}
      </div>
    </main>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return <div className="flex flex-col items-center px-7 py-16 text-center"><ClipboardList className="size-12 text-slate-300" /><h2 className="mt-4 font-extrabold">Belum ada aktivitas</h2><p className="mt-2 text-sm text-slate-500">Buat permintaan baru untuk mulai mencari tenaga profesional.</p><ActionButton type="button" onClick={onCreate} className="mt-6">Buat permintaan</ActionButton></div>;
}

function RequestTask({ onBack, onSubmit }: { onBack: () => void; onSubmit: () => void }) {
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); onSubmit(); };
  return (
    <main>
      <Topbar title="Buat permintaan" onBack={onBack} />
      <form onSubmit={submit} className="space-y-5 px-6 pb-10">
        <label className="block text-sm font-semibold">Judul tugas<input className={`${fieldClass} mt-2`} placeholder="Contoh: Perbaiki pipa bocor" required /></label>
        <label className="block text-sm font-semibold">Kategori<select className={`${fieldClass} mt-2`} defaultValue=""><option value="" disabled>Pilih kategori</option><option>Listrik</option><option>Plumbing</option><option>AC</option><option>Pertukangan</option></select></label>
        <label className="block text-sm font-semibold">Deskripsi<textarea className={`${fieldClass} mt-2 min-h-28 py-3`} placeholder="Jelaskan kebutuhan dan kondisi di lokasi..." required /></label>
        <label className="block text-sm font-semibold">Anggaran<input className={`${fieldClass} mt-2`} type="number" inputMode="numeric" placeholder="Rp" min="0" required /></label>
        <label className="block text-sm font-semibold">Tanggal pengerjaan<input className={`${fieldClass} mt-2`} type="date" required /></label>
        <ActionButton type="submit"><Send className="size-4" /> Kirim permintaan</ActionButton>
      </form>
    </main>
  );
}

function ChatScreen({ onProfile }: { onProfile: () => void }) {
  return (
    <main>
      <Topbar title="Pesan" action={<button type="button" onClick={onProfile} aria-label="Profil" className="cursor-pointer rounded-full"><Avatar name="Matthew Alden" size="sm" /></button>} />
      <div className="px-5 pb-8">
        {chats.map((chat) => <button key={chat.id} type="button" className="flex min-h-20 w-full cursor-pointer items-center gap-3 border-b border-slate-200 py-3 text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"><Avatar name={chat.name} /><div className="min-w-0 flex-1"><div className="flex justify-between gap-2"><strong className="truncate text-sm">{chat.name}</strong><span className="shrink-0 text-xs text-slate-400">{chat.date}</span></div><p className="mt-1 truncate text-sm text-slate-500">{chat.lastMessage}</p></div>{chat.unread ? <span className="size-2.5 rounded-full bg-blue-600" aria-label="Pesan belum dibaca" /> : <ChevronRight className="size-4 text-slate-300" />}</button>)}
      </div>
    </main>
  );
}

function Profile({ onBack, notify }: { onBack: () => void; notify: (message: string) => void }) {
  return (
    <main>
      <Topbar title="Profil saya" onBack={onBack} />
      <div className="px-6 pb-10">
        <div className="flex flex-col items-center py-5 text-center"><Avatar name="Matthew Alden" size="lg" /><h2 className="mt-4 text-xl font-black">Matthew Alden</h2><p className="text-sm text-slate-500">@matthew.a</p></div>
        <div className="space-y-3">
          {[{ icon: UserRound, label: "Informasi pribadi", value: "Matthew Alden" }, { icon: MapPin, label: "Alamat", value: "Jakarta Pusat" }, { icon: ShieldCheck, label: "Verifikasi", value: "Terverifikasi" }].map(({ icon: Icon, label, value }) => <div key={label} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4"><span className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><Icon className="size-5" /></span><div className="min-w-0 flex-1"><span className="block text-xs text-slate-500">{label}</span><strong className="block truncate text-sm">{value}</strong></div></div>)}
        </div>
        <button type="button" onClick={() => notify("Profil siap diedit")} className={`${buttonSecondary} mt-6`}>Edit profil</button>
      </div>
    </main>
  );
}

function BottomNavigation({ route, navigate }: { route: Route; navigate: (route: Route) => void }) {
  return (
    <nav aria-label="Navigasi utama" className="z-30 grid grid-cols-4 border-t border-slate-200 bg-white px-2 pb-[max(.5rem,env(safe-area-inset-bottom))] pt-2">
      {navItems.map(({ route: itemRoute, label, icon: Icon }) => {
        const active = route === itemRoute;
        return <button key={itemRoute} type="button" onClick={() => navigate(itemRoute)} aria-current={active ? "page" : undefined} className={`flex min-h-14 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 ${active ? "text-blue-700" : "text-slate-400 hover:bg-slate-50 hover:text-slate-700"}`}><Icon className={`size-5 ${active ? "stroke-[2.5]" : ""}`} />{label}</button>;
      })}
    </nav>
  );
}
