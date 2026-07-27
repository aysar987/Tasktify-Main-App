"use client";
/* eslint-disable @next/next/no-img-element */

import {
  BriefcaseBusiness,
  Camera,
  LoaderCircle,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { PageHeader, inputClass, primaryButton } from "@/components/ui";
import {
  getProfile,
  saveProviderProfile,
  updateProfile,
  uploadAvatar,
} from "@/lib/api";
import type { Profile } from "@/types";

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile>();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    getProfile()
      .then(setProfile)
      .catch((cause: unknown) =>
        setError(
          cause instanceof Error ? cause.message : "Profil gagal dimuat.",
        ),
      );
  }, []);
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
    setSaving(true);
    setError("");
    setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      await saveProviderProfile({
        title: String(form.get("title")),
        category: String(form.get("category")),
        location: String(form.get("location")),
        priceFrom: Number(form.get("priceFrom")),
        bio: String(form.get("bio")),
      });
      setProfile(await getProfile());
      setMessage("Profil provider berhasil disimpan.");
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
                  defaultValue={profile.fullName}
                />
                <Field
                  icon={UserRound}
                  label="Username"
                  name="username"
                  defaultValue={profile.username}
                />
                <Field
                  icon={Phone}
                  label="Nomor telepon"
                  name="phone"
                  type="tel"
                  defaultValue={profile.phone}
                />
                <Field
                  icon={Mail}
                  label="Email"
                  name="email"
                  type="email"
                  defaultValue={profile.email}
                />
                <Field
                  icon={MapPin}
                  label="Alamat"
                  name="address"
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
                  Profil provider
                </h2>
                <p className="text-sm text-slate-500">
                  Aktifkan akun Anda untuk menerima pekerjaan.
                </p>
              </div>
            </div>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <Field
                icon={BriefcaseBusiness}
                label="Nama layanan"
                name="title"
                defaultValue={profile?.provider?.title || ""}
              />
              <label className="block text-sm font-bold text-slate-700">
                Kategori
                <select
                  name="category"
                  defaultValue={profile?.provider?.category || "Listrik"}
                  className={inputClass}
                >
                  <option>Listrik</option>
                  <option>Plumbing</option>
                  <option>AC</option>
                  <option>Pertukangan</option>
                  <option>Kebersihan</option>
                </select>
              </label>
              <Field
                icon={MapPin}
                label="Lokasi layanan"
                name="location"
                defaultValue={profile?.provider?.location || ""}
              />
              <Field
                icon={BriefcaseBusiness}
                label="Harga mulai"
                name="priceFrom"
                type="number"
                defaultValue={String(profile?.provider?.priceFrom || 0)}
              />
            </div>
            <label className="mt-5 block text-sm font-bold text-slate-700">
              Tentang layanan
              <textarea name="bio" rows={4} defaultValue={profile?.provider?.bio || ""} className={`${inputClass} py-3`} />
            </label>
            <div className="mt-7 flex justify-end border-t border-slate-200 pt-6">
              <button disabled={saving || !profile} className={primaryButton}>
                Simpan profil provider
              </button>
            </div>
          </form>
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
}: {
  icon: typeof UserRound;
  label: string;
  name: string;
  type?: string;
  defaultValue: string;
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
          required={name === "username" || name === "fullName"}
          className={`${inputClass} pl-12`}
        />
      </span>
    </label>
  );
}
