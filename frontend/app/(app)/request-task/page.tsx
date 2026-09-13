import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { RequestTaskForm } from "@/components/request-task-form";

export default async function RequestTaskPage({ searchParams }: { searchParams: Promise<{ provider?: string }> }) {
  const { provider } = await searchParams;
  return (
    <div className="-mx-4 -my-7 min-h-[calc(100dvh+3.5rem)] bg-gradient-to-b from-sky-400 via-blue-700 to-slate-950 px-4 pb-28 pt-7 sm:-mx-6 sm:-my-10 sm:px-6 lg:-mx-10 lg:px-10 lg:pb-12">
      <header className="mx-auto mb-8 max-w-6xl">
        <Link href="/dashboard" aria-label="Kembali ke dashboard" className="grid size-11 place-items-center rounded-full bg-white/95 text-slate-900 shadow-lg transition hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/50">
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="mt-2 max-w-2xl font-[var(--font-manrope)] text-3xl font-extrabold tracking-tight text-white md:text-5xl">Buat Taskmu Sekarang!</h1>
      </header>
      <div className="mx-auto max-w-6xl">
        <RequestTaskForm providerId={provider} />
      </div>
    </div>
  );
}
