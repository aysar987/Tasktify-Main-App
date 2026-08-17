"use client";
/* eslint-disable @next/next/no-img-element */

import {
  BriefcaseBusiness,
  Camera,
  IdCard,
  LoaderCircle,
  Mail,
  MapPin,
  Phone,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  UserRound,
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { ProviderReviews } from "@/components/provider-reviews";
import { PageHeader, inputClass, primaryButton } from "@/components/ui";
import {
  getOwnProviderKtpUrl,
  getProfile,
  getProviderRatings,
  saveProviderProfile,
  updateProfile,
  uploadAvatar,
} from "@/lib/api";
import type { Profile, Rating } from "@/types";

const VERIFICATION_META = {
  pending: { icon: ShieldQuestion, label: "Menunggu review admin", className: "bg-amber-50 text-amber-800" },
  verified: { icon: ShieldCheck, label: "Terverifikasi", className: "bg-emerald-50 text-emerald-700" },
  rejected: { icon: ShieldAlert, label: "Ditolak", className: "bg-red-50 text-red-700" },
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile>();
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [ktpPreview, setKtpPreview] = useState<string>();
  useEffect(() => {
    getProfile()
      .then(setProfile)
      .catch((cause: unknown) =>
        setError(
          cause instanceof Error ? cause.message : "Profil gagal dimuat.",
        ),
      );
  }, []);
  useEffect(() => {
    const providerId = profile?.provider?.id;
    if (!providerId) return;
    getProviderRatings(providerId).then(setRatings).catch(() => undefined);
  }, [profile?.provider?.id]);
  useEffect(() => {
    if (!profile?.provider?.hasKtp) return;
    let objectUrl: string | undefined;
    getOwnProviderKtpUrl()
      .then((url) => {
        objectUrl = url;
        setKtpPreview(url);
      })
      .catch(() => undefined);
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [profile?.provider?.hasKtp]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      await updateProfile({
        username: String(form.get("username")),
        fullName: String(form.get("fullName")),
        phone: String(form.get("phone")),
        email: String(form.get("email")),
        address: String(form.get("address")),
      });
      setMessage("Profil berhasil disimpan.");
      setProfile(await getProfile());
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Profil gagal disimpan.",
      );
    } finally {
      setSaving(false);
    }
  }
  async function avatarChanged(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setSaving(true);
    setError("");
    try {
      await uploadAvatar(file);
      setProfile(await getProfile());
      setMessage("Foto profil berhasil diperbarui.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Foto gagal diunggah.");
    } finally {
      setSaving(false);
    }
  }
  async function providerSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const ktpFile = form.get("ktp");
    if (!(ktpFile instanceof File) || ktpFile.size === 0) {
      setError("Unggah foto KTP terlebih dahulu.");
      return;
    }
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await saveProviderProfile(ktpFile);
      setProfile(await getProfile());
      setMessage("Pendaftaran penyedia terkirim, menunggu verifikasi admin.");
      event.currentTarget.reset();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Profil provider gagal disimpan.",
      );
    } finally {
      setSaving(false);
    }
  }
  const identityComplete = Boolean(profile?.phone) && Boolean(profile?.email);
  const isVerifiedProvider = profile?.provider?.verificationStatus === "verified";
  const initials = (profile?.fullName || profile?.username || "U")
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
  return (
    <>
      <PageHeader
        eyebrow="Akun"
        title="Profil pengguna"
        description="Kelola identitas client dan profil layanan provider Anda."
      />
      <div className="grid gap-6 xl:grid-cols-[300px_1fr]">
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6 text-center">
          <div className="relative mx-auto size-28">
            {profile?.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={`Foto ${profile.fullName}`}
                className="size-28 rounded-3xl object-cover"
              />
            ) : (
              <span className="grid size-28 place-items-center rounded-3xl bg-slate-900 text-2xl font-bold text-white">
                {initials}
              </span>
            )}
            <label className="absolute -bottom-2 -right-2 grid size-11 cursor-pointer place-items-center rounded-xl border-4 border-white bg-orange-600 text-white">
              <Camera className="size-5" />
              <span className="sr-only">Unggah foto profil</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={avatarChanged}
                className="sr-only"
              />
            </label>
          </div>
          <h2 className="mt-6 font-[var(--font-manrope)] text-xl font-extrabold">
            {profile?.fullName || "Memuat..."}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            @{profile?.username || "pengguna"}
          </p>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
            <ShieldCheck className="size-4" /> Email terverifikasi
          </div>
        </aside>
        <div className="space-y-6">
          <form
            onSubmit={submit}
            className="rounded-2xl border border-slate-200 bg-white p-5 md:p-7"
          >
            <h2 className="font-[var(--font-manrope)] text-xl font-extrabold">
              Informasi pribadi
            </h2>
            {profile && (
              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <Field
                  icon={UserRound}
                  label="Nama lengkap"
                  name="fullName"
                  placeholder="Contoh: Boy Steven"
                  defaultValue={profile.fullName}
                />
                <Field
                  icon={UserRound}
                  label="Username"
                  name="username"
                  placeholder="Contoh: boysteven"
                  defaultValue={profile.username}
                />
                <Field
                  icon={Phone}
                  label="Nomor telepon"
                  name="phone"
                  type="tel"
                  placeholder="Contoh: +62 812 3456 7890"
                  defaultValue={profile.phone}
                />
                <Field
                  icon={Mail}
                  label="Email"
                  name="email"
                  type="email"
                  placeholder="nama@email.com"
                  defaultValue={profile.email}
                />
                <Field
                  icon={MapPin}
                  label="Alamat"
                  name="address"
                  placeholder="Contoh: Jakarta Selatan"
                  defaultValue={profile.address}
                />
              </div>
            )}
            <div className="mt-7 flex justify-end border-t border-slate-200 pt-6">
              <button
                disabled={saving || !profile}
                className={`${primaryButton} disabled:opacity-50`}
              >
                {saving && <LoaderCircle className="size-5 animate-spin" />}
                Simpan perubahan
              </button>
            </div>
          </form>
          <form
            onSubmit={providerSubmit}
            className="rounded-2xl border border-slate-200 bg-white p-5 md:p-7"
          >
            <div className="flex items-center gap-3">
              <BriefcaseBusiness className="size-6 text-orange-600" />
              <div>
                <h2 className="font-[var(--font-manrope)] text-xl font-extrabold">
                  Daftar sebagai penyedia
                </h2>
                <p className="text-sm text-slate-500">
                  Verifikasi identitas untuk mulai menerima task.
                </p>
              </div>
            </div>
            {!isVerifiedProvider && profile?.provider && (() => {
              const meta = VERIFICATION_META[profile.provider.verificationStatus];
              const StatusIcon = meta.icon;
              return (
                <span className={`mt-5 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${meta.className}`}>
                  <StatusIcon className="size-4" />
                  {meta.label}
                </span>
              );
            })()}
            {isVerifiedProvider && (
              <span className="mt-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                <ShieldCheck className="size-4" />
                Tasker terverifikasi
              </span>
            )}
            {profile?.provider?.verificationNote && (
              <p className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <strong>Alasan ditolak:</strong> {profile.provider.verificationNote}
              </p>
            )}
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div>
                <span className="block text-sm font-bold text-slate-700">Nama lengkap</span>
                <p className="mt-2 flex min-h-12 items-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-slate-700">{profile?.fullName || "-"}</p>
              </div>
              <div>
                <span className="block text-sm font-bold text-slate-700">Username</span>
                <p className="mt-2 flex min-h-12 items-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-slate-700">@{profile?.username || "-"}</p>
              </div>
              <div>
                <span className="block text-sm font-bold text-slate-700">Nomor HP</span>
                <p className="mt-2 flex min-h-12 items-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-slate-700">{profile?.phone || "Belum diisi"}</p>
              </div>
              <div>
                <span className="block text-sm font-bold text-slate-700">Email</span>
                <p className="mt-2 flex min-h-12 items-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-slate-700">{profile?.email || "Belum diisi"}</p>
              </div>
            </div>
            {!identityComplete && !isVerifiedProvider && (
              <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-800">
                Lengkapi nomor HP dan email di bagian &quot;Informasi pribadi&quot; di atas sebelum mendaftar sebagai penyedia.
              </p>
            )}
            {!isVerifiedProvider && (
              <>
                <label className="mt-5 block text-sm font-bold text-slate-700">
                  Foto KTP <span className="text-red-600">*</span>
                  <span className="mt-2 flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-3">
                    <IdCard className="size-5 shrink-0 text-slate-400" />
                    <input type="file" name="ktp" accept="image/png,image/jpeg,image/webp" required disabled={!identityComplete} className="w-full text-sm" />
                  </span>
                  <span className="mt-2 block text-xs font-normal text-slate-500">JPG, PNG, atau WebP, maksimal 5 MB. Dipakai admin untuk verifikasi identitas, tidak ditampilkan ke publik.</span>
                </label>
                {ktpPreview && (
                  <div className="mt-4">
                    <span className="block text-sm font-bold text-slate-700">KTP tersimpan saat ini</span>
                    <img src={ktpPreview} alt="Foto KTP" className="mt-2 max-h-48 rounded-xl border border-slate-200 object-contain" />
                  </div>
                )}
              </>
            )}
            {!isVerifiedProvider && (
              <div className="mt-7 flex justify-end border-t border-slate-200 pt-6">
                <button disabled={saving || !profile || !identityComplete} className={`${primaryButton} disabled:opacity-50`}>
                  {saving && <LoaderCircle className="size-5 animate-spin" />}
                  {profile?.provider ? "Kirim ulang untuk verifikasi" : "Daftar sebagai penyedia"}
                </button>
              </div>
            )}
          </form>
          {profile?.provider && (
            <div>
              <h2 className="mb-4 font-[var(--font-manrope)] text-xl font-extrabold">
                Ulasan yang Anda terima ({ratings.length})
              </h2>
              <ProviderReviews ratings={ratings} />
            </div>
          )}
          {error && (
            <p
              role="alert"
              className="rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700"
            >
              {error}
            </p>
          )}
          {message && (
            <p
              role="status"
              className="rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700"
            >
              {message}
            </p>
          )}
        </div>
      </div>
    </>
  );
}
function Field({
  icon: Icon,
  label,
  name,
  type = "text",
  defaultValue,
  placeholder,
}: {
  icon: typeof UserRound;
  label: string;
  name: string;
  type?: string;
  defaultValue: string;
  placeholder: string;
}) {
  return (
    <label className="block text-sm font-bold text-slate-700">
      {label}
      <span className="relative block">
        <Icon className="absolute left-4 top-[calc(50%+.25rem)] size-5 -translate-y-1/2 text-slate-400" />
        <input
          name={name}
          type={type}
          defaultValue={defaultValue}
          placeholder={placeholder}
          required={name === "username" || name === "fullName"}
          className={`${inputClass} pl-12`}
        />
      </span>
    </label>
  );
}
