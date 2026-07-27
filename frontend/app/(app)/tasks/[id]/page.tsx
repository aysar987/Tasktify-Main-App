import { CalendarDays, CircleDollarSign, MapPin, Navigation, ShieldCheck, Star } from "lucide-react";
import { notFound } from "next/navigation";
import { TaskActions } from "@/components/task-actions";
import { PageHeader, StatusBadge } from "@/components/ui";
import { rupiah } from "@/lib/format";
import { tasks } from "@/lib/mock-data";

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const task = tasks.find((item) => item.id === id);
  if (!task) notFound();
  return (
    <><PageHeader eyebrow={task.id} title={task.title} description="Detail pekerjaan dan perkembangan penyedia secara langsung." backHref="/activity" action={<StatusBadge status={task.status} />} />
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6"><h2 className="font-[var(--font-manrope)] text-xl font-extrabold">Informasi task</h2><div className="mt-6 grid gap-5 sm:grid-cols-2">{[{ icon: MapPin, label: "Lokasi", value: task.location }, { icon: CalendarDays, label: "Jadwal", value: task.date }, { icon: CircleDollarSign, label: "Anggaran", value: rupiah(task.budget) }, { icon: Navigation, label: "Kategori", value: task.category }].map(({ icon: Icon, label, value }) => <div key={label} className="flex gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600"><Icon className="size-5" /></span><div><span className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</span><strong className="mt-1 block text-sm">{value}</strong></div></div>)}</div><div className="mt-6 border-t border-slate-200 pt-6"><h3 className="font-bold">Catatan</h3><p className="mt-2 leading-7 text-slate-600">{task.note}</p></div></section>
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="flex h-64 items-center justify-center bg-[linear-gradient(45deg,#e2e8f0_25%,transparent_25%),linear-gradient(-45deg,#e2e8f0_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#e2e8f0_75%),linear-gradient(-45deg,transparent_75%,#e2e8f0_75%)] bg-[size:32px_32px]"><div className="rounded-2xl bg-slate-950 px-5 py-3 font-bold text-white"><Navigation className="mr-2 inline size-5 text-orange-400" />Live map penyedia</div></div></section>
        </div>
        <aside className="h-fit space-y-5 xl:sticky xl:top-28">
          {task.provider ? <section className="rounded-2xl border border-slate-200 bg-white p-6"><p className="text-sm font-bold uppercase tracking-wider text-orange-700">Penyedia bertugas</p><div className="mt-5 flex items-center gap-4"><span className="grid size-14 place-items-center rounded-2xl bg-slate-900 font-bold text-white">{task.provider.initials}</span><div><div className="flex items-center gap-1.5"><h2 className="font-[var(--font-manrope)] font-extrabold">{task.provider.name}</h2><ShieldCheck className="size-4 text-blue-600" /></div><p className="mt-1 text-sm text-slate-500">{task.provider.title}</p><span className="mt-2 flex items-center gap-1 text-sm font-bold"><Star className="size-4 fill-amber-400 text-amber-400" />{task.provider.rating}</span></div></div></section> : <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6"><h2 className="font-extrabold">Menunggu penyedia</h2><p className="mt-2 text-sm leading-6 text-slate-600">Kami sedang mencocokkan task ini dengan penyedia terbaik.</p></section>}
          <TaskActions completed={task.status === "history"} />
        </aside>
      </div>
    </>
  );
}
