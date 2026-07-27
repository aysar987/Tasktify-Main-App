import { Camera, Mail, MapPin, Phone, ShieldCheck, UserRound } from "lucide-react";
import { PageHeader, inputClass, primaryButton } from "@/components/ui";

export default function ProfilePage() {
  return <><PageHeader eyebrow="Akun" title="Profil pengguna" description="Perbarui identitas dan informasi kontak yang digunakan untuk setiap task." />
    <form className="grid gap-6 xl:grid-cols-[300px_1fr]">
      <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6 text-center"><div className="relative mx-auto w-fit"><span className="grid size-28 place-items-center rounded-3xl bg-slate-900 text-2xl font-bold text-white">MA</span><button type="button" aria-label="Ganti foto profil" className="absolute -bottom-2 -right-2 grid size-11 place-items-center rounded-xl border-4 border-white bg-orange-600 text-white"><Camera className="size-5" /></button></div><h2 className="mt-6 font-[var(--font-manrope)] text-xl font-extrabold">Matthew Alden</h2><p className="mt-1 text-sm text-slate-500">@matthew.a</p><div className="mt-5 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700"><ShieldCheck className="size-4" /> Akun terverifikasi</div></aside>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-7"><h2 className="font-[var(--font-manrope)] text-xl font-extrabold">Informasi pribadi</h2><div className="mt-6 grid gap-5 md:grid-cols-2"><ProfileField icon={UserRound} label="Username" type="text" defaultValue="matthew.a" /><ProfileField icon={Phone} label="Nomor telepon" type="tel" defaultValue="+62 812 3456 7890" /><ProfileField icon={Mail} label="Email (opsional)" type="email" defaultValue="matthew.alden@email.com" /><ProfileField icon={MapPin} label="Alamat" type="text" defaultValue="Jl. Merdeka No. 12, Jakarta Pusat" /></div><div className="mt-7 flex justify-end border-t border-slate-200 pt-6"><button type="submit" className={primaryButton}>Simpan perubahan</button></div></section>
    </form>
  </>;
}

function ProfileField({ icon: Icon, label, ...props }: { icon: typeof UserRound; label: string; type: string; defaultValue: string }) {
  return <label className="block text-sm font-bold text-slate-700">{label}<span className="relative block"><Icon className="absolute left-4 top-[calc(50%+.25rem)] size-5 -translate-y-1/2 text-slate-400" /><input className={`${inputClass} pl-12`} {...props} /></span></label>;
}
