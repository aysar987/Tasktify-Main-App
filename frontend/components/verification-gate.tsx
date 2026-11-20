import { BadgeCheck, Briefcase, Clock, ShieldAlert, ShieldCheck, Store } from "lucide-react";
import Link from "next/link";
import type { AccountVerification } from "@/types";
import { primaryButton } from "./ui";

/** Where the "Verifikasi akun" form lives; `next` is where to come back to after approval. */
export function verificationHref(returnTo?: string) {
  return `/profile${returnTo ? `?next=${encodeURIComponent(returnTo)}` : ""}#verifikasi-akun`;
}

/** What a verified account unlocks; shown on the gate and on the profile. */
export function VerificationUnlocks() {
  return (
    <ul className="space-y-2 text-left text-sm text-slate-700">
      <li className="flex items-start gap-2">
        <Briefcase className="mt-0.5 size-4 shrink-0 text-orange-600" /> Menerima dan mengerjakan task dari klien
      </li>
      <li className="flex items-start gap-2">
        <Store className="mt-0.5 size-4 shrink-0 text-orange-600" /> Membuka lapak dan menjual jasa di marketplace
      </li>
    </ul>
  );
}

/**
 * Shown when an unverified account tries to take a task or open a lapak.
 * One "Verifikasi akun" unlocks both. `returnTo` is where the approval
 * notification sends the user back to.
 */
export function VerificationGate({ verification, returnTo, children }: { verification: AccountVerification; returnTo?: string; children?: React.ReactNode }) {
  const submitted = verification.submittedAt
    ? new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(verification.submittedAt))
    : undefined;
  return (
    <section className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center shadow-sm">
      {children}
      {verification.status === "pending" ? (
        <>
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-amber-50 text-amber-600">
            <Clock className="size-7" />
          </span>
          <h2 className="mt-4 font-[var(--font-manrope)] text-xl font-extrabold text-slate-950">Verifikasi sedang ditinjau</h2>
          <p className="mt-2 leading-7 text-slate-600">
            Biasanya selesai dalam 1×24 jam. Kami akan memberi tahu kamu lewat notifikasi begitu akunmu terverifikasi.
          </p>
          {submitted && <p className="mt-2 text-sm text-slate-500">Dikirim {submitted}</p>}
        </>
      ) : verification.status === "rejected" ? (
        <>
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-red-50 text-red-600">
            <ShieldAlert className="size-7" />
          </span>
          <h2 className="mt-4 font-[var(--font-manrope)] text-xl font-extrabold text-slate-950">Verifikasi akun ditolak</h2>
          {verification.note ? (
            <p className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-left text-sm text-red-800">
              <strong>Alasan:</strong> {verification.note}
            </p>
          ) : (
            <p className="mt-2 text-slate-600">Admin belum dapat menyetujui verifikasi akunmu.</p>
          )}
          <p className="mt-3 text-sm text-slate-600">Perbaiki lalu kirim ulang foto KTP untuk ditinjau kembali.</p>
          <Link href={verificationHref(returnTo)} className={`${primaryButton} mt-6 inline-flex`}>
            Kirim ulang verifikasi
          </Link>
        </>
      ) : (
        <>
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-orange-50 text-orange-600">
            <ShieldCheck className="size-7" />
          </span>
          <h2 className="mt-4 font-[var(--font-manrope)] text-xl font-extrabold text-slate-950">Verifikasi akun dulu, yuk</h2>
          <p className="mt-2 leading-7 text-slate-600">
            Verifikasi akun untuk mulai menerima task dan membuka lapak. Cukup sekali, kamu bisa melakukan keduanya.
          </p>
          <div className="mx-auto mt-5 max-w-xs">
            <VerificationUnlocks />
          </div>
          <Link href={verificationHref(returnTo)} className={`${primaryButton} mt-6 inline-flex`}>
            <BadgeCheck className="size-5" /> Verifikasi sekarang
          </Link>
          <p className="mt-3 text-xs text-slate-500">Siapkan foto KTP. Nomor HP dan email di profilmu juga perlu diisi.</p>
        </>
      )}
    </section>
  );
}
