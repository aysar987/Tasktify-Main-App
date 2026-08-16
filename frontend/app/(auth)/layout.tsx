import { Brand } from "@/components/brand";
import { CheckCircle2, ShieldCheck, UsersRound } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-dvh bg-white lg:grid-cols-[1.05fr_.95fr]">
      <section className="relative hidden overflow-hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col">
        <div className="absolute inset-0 opacity-10 [background-image:linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] [background-size:40px_40px]" />
        <div className="relative"><Brand /><p className="mt-20 text-sm font-bold uppercase tracking-[.18em] text-orange-400">Layanan lokal tepercaya</p><h1 className="mt-4 max-w-xl font-[var(--font-manrope)] text-5xl font-extrabold leading-tight tracking-tight">Tugas selesai. Hari jadi lebih ringan.</h1><p className="mt-6 max-w-lg text-lg leading-8 text-slate-300">Temukan tenaga profesional terverifikasi, atur jadwal, dan pantau pekerjaan dalam satu tempat.</p></div>
        <div className="relative mt-auto grid grid-cols-3 gap-4">{[{ icon: UsersRound, label: "Penyedia lokal" }, { icon: CheckCircle2, label: "Status transparan" }, { icon: ShieldCheck, label: "Akun terlindungi" }].map(({ icon: Icon, label }) => <div key={label} className="border-l border-slate-700 pl-4"><Icon className="mb-3 size-5 text-orange-400" /><span className="text-sm font-semibold text-slate-300">{label}</span></div>)}</div>
      </section>
      <section className="flex items-center justify-center px-5 py-10 sm:px-10"><div className="w-full max-w-md"><div className="mb-12 lg:hidden"><Brand /></div>{children}</div></section>
    </main>
  );
}
