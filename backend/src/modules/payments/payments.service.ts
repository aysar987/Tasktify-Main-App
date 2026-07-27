import midtransClient from "midtrans-client";
import { prisma } from "@/config/database";
import { env } from "@/config/env";

// Snap = untuk membuat transaksi/halaman bayar
const snap = new midtransClient.Snap({
  isProduction: false,                    // Sandbox dulu
  serverKey: env.midtransServerKey,
  clientKey: env.midtransClientKey,
});

// CoreApi = untuk MEMVERIFIKASI notifikasi webhook (wajib demi keamanan)
const core = new midtransClient.CoreApi({
  isProduction: false,
  serverKey: env.midtransServerKey,
  clientKey: env.midtransClientKey,
});

export const paymentService = {
  // dipanggil client untuk membayar task yang bid-nya sudah diterima
  async createForTask(taskId: string, userId: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId }, include: { transaction: true },
    });
    if (!task) throw { status: 404, message: "Task tidak ditemukan" };
    if (task.clientId !== userId) throw { status: 403, message: "Bukan task milik Anda" };
    if (task.transaction) throw { status: 409, message: "Transaksi sudah dibuat" };

    const amount = task.budget;
    const commission = Math.round(amount * 0.1);      // komisi 10% milik Tasktify
    const orderId = `TASK-${taskId}-${Date.now()}`;   // harus unik

    const tx = await prisma.transaction.create({
      data: { taskId, amount, commission, midtransId: orderId, status: "PENDING" },
    });

    const snapTx = await snap.createTransaction({
      transaction_details: { order_id: orderId, gross_amount: amount },
    });

    // frontend web pakai redirect_url ini untuk membuka halaman bayar Midtrans
    return { token: snapTx.token, redirectUrl: snapTx.redirect_url, transaction: tx };
  },

  // dipanggil oleh MIDTRANS (webhook), bukan oleh user
  async handleNotification(payload: any) {
    // verifikasi keaslian notifikasi ke server Midtrans — JANGAN percaya payload mentah
    const status = await core.transaction.notification(payload);
    const orderId = status.order_id;
    const trxStatus = status.transaction_status;

    const tx = await prisma.transaction.findFirst({ where: { midtransId: orderId } });
    if (!tx) return;

    if (trxStatus === "settlement" || trxStatus === "capture") {
      // dana masuk -> DITAHAN (escrow), belum ke tasker
      await prisma.transaction.update({ where: { id: tx.id }, data: { status: "HELD" } });
    } else if (["expire", "cancel", "deny"].includes(trxStatus)) {
      await prisma.transaction.update({ where: { id: tx.id }, data: { status: "REFUNDED" } });
    }
  },

  // client konfirmasi pekerjaan selesai -> dana dilepas ke tasker
  async release(taskId: string, userId: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId }, include: { transaction: true },
    });
    if (!task || !task.transaction) throw { status: 404, message: "Transaksi tidak ditemukan" };
    if (task.clientId !== userId) throw { status: 403, message: "Bukan task milik Anda" };
    if (task.transaction.status !== "HELD")
      throw { status: 400, message: "Dana belum bisa dilepas (status bukan HELD)" };
    return prisma.transaction.update({
      where: { id: task.transaction.id }, data: { status: "RELEASED" },
    });
  },
};