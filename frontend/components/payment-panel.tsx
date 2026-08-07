"use client";

import { Banknote, Check, CreditCard, LoaderCircle, ShieldCheck } from "lucide-react";
import Script from "next/script";
import { useEffect, useState } from "react";
import { confirmCashPayment, createPayment, getPayment, subscribePayment } from "@/lib/api";
import { rupiah } from "@/lib/format";
import type { Payment, PaymentMethod, PaymentStatus } from "@/types";
import { primaryButton, secondaryButton } from "./ui";

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        callbacks?: {
          onSuccess?: (result: unknown) => void;
          onPending?: (result: unknown) => void;
          onError?: (result: unknown) => void;
          onClose?: () => void;
        },
      ) => void;
    };
  }
}

const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;
const isProduction = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true";
const snapScriptUrl = isProduction
  ? "https://app.midtrans.com/snap/snap.js"
  : "https://app.sandbox.midtrans.com/snap/snap.js";

const STATUS_LABEL: Record<PaymentStatus, string> = {
  pending: "Menunggu pembayaran",
  settlement: "Sudah dibayar",
  capture: "Sudah dibayar",
  deny: "Pembayaran ditolak",
  cancel: "Pembayaran dibatalkan",
  expire: "Pembayaran kedaluwarsa",
  failure: "Pembayaran gagal",
};

export function PaymentPanel({
  taskId,
  amount,
  perspective,
}: {
  taskId: string;
  amount: number;
  perspective: "client" | "provider";
}) {
  const [payment, setPayment] = useState<Payment>();
  const [scriptReady, setScriptReady] = useState(() => typeof window !== "undefined" && Boolean(window.snap));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getPayment(taskId).then(setPayment).catch(() => undefined);
    return subscribePayment(taskId, setPayment);
  }, [taskId]);

  const paid = payment?.status === "settlement" || payment?.status === "capture";
  const cashPendingLock = payment?.method === "cash" && payment.status === "pending";

  async function pay(method: PaymentMethod) {
    if (method === "online") {
      if (!clientKey) {
        setError("Midtrans belum dikonfigurasi. Hubungi admin.");
        return;
      }
      if (!window.snap) {
        setError("Modul pembayaran belum siap, coba lagi sebentar.");
        return;
      }
    }
    setLoading(true);
    setError("");
    try {
      const created = await createPayment(taskId, method);
      setPayment(created);
      if (method === "online") {
        if (!created.snapToken) {
          setError("Token pembayaran tidak tersedia.");
          return;
        }
        window.snap!.pay(created.snapToken, {
          onSuccess: () => getPayment(taskId).then(setPayment),
          onPending: () => getPayment(taskId).then(setPayment),
          onError: () => setError("Pembayaran gagal diproses."),
          onClose: () => getPayment(taskId).then(setPayment),
        });
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Pembayaran gagal dibuat.");
    } finally {
      setLoading(false);
    }
  }

  async function confirmCash() {
    setLoading(true);
    setError("");
    try {
      setPayment(await confirmCashPayment(taskId));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Konfirmasi gagal.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <Script src={snapScriptUrl} data-client-key={clientKey} strategy="afterInteractive" onLoad={() => setScriptReady(true)} />
      <h2 className="flex items-center gap-2 font-[var(--font-manrope)] text-lg font-extrabold">
        <CreditCard className="size-5 text-orange-600" /> Pembayaran
      </h2>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm text-slate-500">Total tagihan</span>
        <strong className="text-slate-950">{rupiah(amount)}</strong>
      </div>
      {payment && (
        <p
          className={`mt-3 rounded-xl border p-3 text-sm font-semibold ${paid ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-800"}`}
        >
          {paid && <ShieldCheck className="mr-1.5 inline size-4" />}
          {STATUS_LABEL[payment.status]} ({payment.method === "cash" ? "Tunai" : "Online"})
        </p>
      )}
      {error && (
        <p role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
          {error}
        </p>
      )}

      {perspective === "client" && !paid && !cashPendingLock && (
        <div className="mt-4 grid gap-3">
          <button type="button" disabled={loading || !scriptReady} onClick={() => pay("online")} className={`${primaryButton} w-full`}>
            {loading ? <LoaderCircle className="size-5 animate-spin" /> : <CreditCard className="size-5" />} Bayar Online
          </button>
          <button type="button" disabled={loading} onClick={() => pay("cash")} className={`${secondaryButton} w-full`}>
            <Banknote className="size-5" /> Bayar Tunai
          </button>
        </div>
      )}
      {perspective === "client" && cashPendingLock && (
        <p className="mt-3 text-xs text-slate-500">Menunggu konfirmasi dari penyedia bahwa pembayaran tunai sudah diterima.</p>
      )}
      {perspective === "client" && payment?.method === "online" && payment.status === "pending" && (
        <p className="mt-3 text-xs text-slate-500">Selesaikan pembayaran di jendela yang terbuka, atau pilih metode lain di atas.</p>
      )}

      {perspective === "provider" && !payment && (
        <p className="mt-3 text-xs text-slate-500">Menunggu client melakukan pembayaran.</p>
      )}
      {perspective === "provider" && cashPendingLock && (
        <button type="button" disabled={loading} onClick={confirmCash} className={`${primaryButton} mt-4 w-full`}>
          {loading ? <LoaderCircle className="size-5 animate-spin" /> : <Check className="size-5" />} Tandai tunai sudah diterima
        </button>
      )}
      {perspective === "provider" && payment?.method === "online" && payment.status === "pending" && (
        <p className="mt-3 text-xs text-slate-500">Menunggu client menyelesaikan pembayaran online.</p>
      )}
    </section>
  );
}
