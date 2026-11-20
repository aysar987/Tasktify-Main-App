"use client";

import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LegalConsent, useLegalConsent } from "@/components/legal-consent";
import { acceptTerms } from "@/lib/api";
import { TERMS_VERSION, rememberTermsOnDevice } from "@/lib/legal";
import { getSupabase } from "@/lib/supabase";

/**
 * Shown once when the app's API asks for acceptance: the Syarat & Ketentuan
 * changed since the user last accepted them, or were never recorded.
 */
export default function TermsAcceptPage() {
  const router = useRouter();
  const consent = useLegalConsent();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getSupabase().auth.getSession().then(({ data }) => {
      if (!data.session) router.replace("/login");
    });
  }, [router]);

  function nextPath() {
    const next = new URLSearchParams(window.location.search).get("next");
    return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/terms-accept") ? next : "/dashboard";
  }

  async function accept() {
    if (!consent.require()) return;
    setLoading(true);
    setError("");
    try {
      await acceptTerms(TERMS_VERSION);
      rememberTermsOnDevice();
      router.replace(nextPath());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Persetujuan gagal disimpan.");
      setLoading(false);
    }
  }

  async function logout() {
    await getSupabase().auth.signOut();
    window.location.assign("/login");
  }

  return (
    <div className="space-y-5 text-slate-950">
      <div className="text-center">
        <h1 tabIndex={-1} className="text-3xl font-bold tracking-tight">Syarat & Ketentuan diperbarui</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Kami memperbarui Syarat & Ketentuan dan Kebijakan Privasi. Baca dan setujui versi terbaru untuk melanjutkan menggunakan Tasktify.
        </p>
      </div>
      <LegalConsent consent={consent} />
      {error && <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
      <button
        type="button"
        onClick={accept}
        disabled={loading}
        aria-disabled={!consent.accepted}
        className={`inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#4294F7] px-5 font-bold text-white transition hover:bg-[#2879D8] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#4294F7]/35 disabled:cursor-not-allowed disabled:opacity-50 ${consent.accepted ? "" : "opacity-50"}`}
      >
        {loading && <LoaderCircle className="size-5 animate-spin" />}
        Setuju dan lanjutkan
      </button>
      <button type="button" onClick={logout} className="w-full text-center text-sm font-semibold text-[#2879D8] hover:underline">
        Keluar
      </button>
    </div>
  );
}
