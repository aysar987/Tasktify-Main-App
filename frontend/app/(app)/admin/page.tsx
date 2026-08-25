"use client";

import { ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { AdminBannerManager } from "@/components/admin-banner-manager";
import { AdminProviderCard } from "@/components/admin-provider-card";
import { PageHeader } from "@/components/ui";
import { getAdminProviders, getProfile } from "@/lib/api";
import type { Profile, Provider, ProviderVerificationStatus } from "@/types";

const tabs: { value: ProviderVerificationStatus | "all"; label: string }[] = [
  { value: "pending", label: "Menunggu" },
  { value: "verified", label: "Terverifikasi" },
  { value: "rejected", label: "Ditolak" },
  { value: "all", label: "Semua" },
];

const sections = [
  { value: "providers", label: "Verifikasi penyedia" },
  { value: "banners", label: "Banner dashboard" },
] as const;

export default function AdminPage() {
  const [profile, setProfile] = useState<Profile>();
  const [section, setSection] = useState<(typeof sections)[number]["value"]>("providers");
  const [tab, setTab] = useState<ProviderVerificationStatus | "all">("pending");
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getProfile().then(setProfile).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!profile || profile.role !== "admin" || section !== "providers") return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const items = await getAdminProviders(tab === "all" ? undefined : tab);
        if (!cancelled) setProviders(items);
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Data gagal dimuat.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profile, section, tab]);

  if (profile && profile.role !== "admin")
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
        <ShieldAlert className="mx-auto size-9 text-red-600" />
        <h2 className="mt-4 font-[var(--font-manrope)] text-xl font-extrabold">Akses ditolak</h2>
        <p className="mt-2 text-slate-600">Halaman ini khusus untuk admin.</p>
      </div>
    );

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title={section === "providers" ? "Verifikasi penyedia" : "Banner dashboard"}
        description={
          section === "providers"
            ? "Review pendaftar penyedia layanan sebelum mereka bisa menerima task."
            : "Atur banner promosi yang tampil di dashboard pengguna tanpa perlu mengubah kode."
        }
      />
      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {sections.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setSection(item.value)}
            className={`min-h-10 shrink-0 cursor-pointer rounded-full border px-4 text-sm font-bold transition ${section === item.value ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-600 hover:border-slate-400"}`}
          >
            {item.label}
          </button>
        ))}
      </div>
      {section === "banners" ? (
        <AdminBannerManager />
      ) : (
        <>
          <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
            {tabs.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setTab(item.value)}
                className={`min-h-10 shrink-0 cursor-pointer rounded-full border px-4 text-sm font-bold transition ${tab === item.value ? "border-orange-600 bg-orange-600 text-white" : "border-slate-300 bg-white text-slate-600 hover:border-orange-400"}`}
              >
                {item.label}
              </button>
            ))}
          </div>
          {error && (
            <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
              {error}
            </p>
          )}
          {loading ? (
            <p className="py-16 text-center text-slate-500">Memuat...</p>
          ) : providers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center text-slate-500">
              Tidak ada penyedia di kategori ini.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {providers.map((provider) => (
                <AdminProviderCard
                  key={provider.id}
                  provider={provider}
                  onUpdated={(updated) => setProviders((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))}
                />
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
