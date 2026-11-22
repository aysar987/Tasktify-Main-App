import Image from "next/image";
import { MapPin, MessageSquareText, Navigation, ShieldCheck, UserRound } from "lucide-react";
import type { Provider, Task, TaskClient } from "@/types";
import { RatingBadge } from "./rating-badge";
import { secondaryButton } from "./ui";

const cardTitle = "text-sm font-bold uppercase tracking-wider text-orange-700";

function initialsOf(name: string) {
  return (name || "U")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

/** "Penyedia bertugas": the provider assigned to the task, as the client (or an admin) sees it. */
export function AssignedProviderCard({ provider, title = "Penyedia bertugas" }: { provider: Provider; title?: string }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <p className={cardTitle}>{title}</p>
      <div className="mt-5 flex items-center gap-4">
        <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-slate-900 font-bold text-white">
          {provider.initials}
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h2 className="truncate font-[var(--font-manrope)] font-extrabold">{provider.name}</h2>
            <ShieldCheck className="size-4 shrink-0 text-blue-600" />
          </div>
          <p className="mt-1 text-sm text-slate-500">{provider.title}</p>
          <RatingBadge rating={provider.rating} reviewCount={provider.reviewCount} className="mt-2" />
        </div>
      </div>
    </section>
  );
}

/** Shown to the client (and admins) while nobody has taken the task yet. */
export function NoProviderCard() {
  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
      <p className={cardTitle}>Penyedia bertugas</p>
      <div className="mt-4 flex items-center gap-3">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white text-amber-600 ring-1 ring-amber-200">
          <UserRound className="size-6" />
        </span>
        <div>
          <h2 className="font-extrabold">Belum ada penyedia</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Task ini terbuka sampai penyedia menerima pekerjaan.
          </p>
        </div>
      </div>
    </section>
  );
}

/**
 * "Pemberi task": the client, as the provider assigned to the task sees it.
 * The backend only sends the client and the full address to that provider
 * (and admins); the full address is withheld 7 days after the task ended.
 */
export function TaskClientCard({
  client,
  task,
  showChat,
}: {
  client: TaskClient;
  task: Pick<Task, "id" | "location" | "addressHidden">;
  showChat: boolean;
}) {
  const hasFullAddress = !task.addressHidden && Boolean(task.location);
  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(task.location)}`;
  // Opens this task's conversation, the same one "Hubungi penyedia" opens for the client.
  const chatHref = `/chat?task=${encodeURIComponent(task.id)}`;
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <p className={cardTitle}>Pemberi task</p>
      <div className="mt-5 flex items-center gap-4">
        {client.avatarUrl ? (
          <Image unoptimized src={client.avatarUrl} alt={`Foto ${client.name}`} width={56} height={56} className="size-14 shrink-0 rounded-2xl object-cover" />
        ) : (
          <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-slate-900 font-bold text-white">
            {initialsOf(client.name)}
          </span>
        )}
        <div className="min-w-0">
          <h2 className="truncate font-[var(--font-manrope)] font-extrabold">{client.name}</h2>
          <p className="mt-1 text-sm text-slate-500">Klien</p>
        </div>
      </div>

      <div className="mt-5 border-t border-slate-200 pt-5">
        <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
          <MapPin className="size-3.5" /> Alamat pengerjaan
        </span>
        {hasFullAddress ? (
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-800">{task.location}</p>
        ) : (
          <p className="mt-1 text-sm leading-6 text-slate-500">
            {task.addressHidden === "expired"
              ? "Alamat lengkap disembunyikan karena task telah berakhir lebih dari 7 hari."
              : "Alamat lengkap belum tersedia."}
            {task.location && <span className="block font-semibold text-slate-700">Area: {task.location}</span>}
          </p>
        )}
      </div>

      <div className="mt-5 grid gap-3">
        {showChat && (
          <a href={chatHref} className={`${secondaryButton} w-full`}>
            <MessageSquareText className="size-5" /> Chat
          </a>
        )}
        {hasFullAddress && (
          <a href={mapsHref} target="_blank" rel="noreferrer" className={`${secondaryButton} w-full`}>
            <Navigation className="size-5" /> Buka di Maps
          </a>
        )}
      </div>
    </section>
  );
}
