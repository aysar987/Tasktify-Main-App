import { prisma } from "@/config/database";

export const bidService = {
  async create(taskId: string, taskerId: string, data: { amount: number; message?: string }) {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw { status: 404, message: "Task tidak ditemukan" };
    if (task.status !== "OPEN") throw { status: 400, message: "Task tidak lagi menerima tawaran" };
    if (task.clientId === taskerId) throw { status: 400, message: "Tidak bisa menawar task sendiri" };
    return prisma.bid.create({
      data: { taskId, taskerId, amount: data.amount, message: data.message },
    });
  },

  // hanya pemilik task yang boleh melihat tawaran yang masuk
  async listForTask(taskId: string, ownerId: string) {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw { status: 404, message: "Task tidak ditemukan" };
    if (task.clientId !== ownerId) throw { status: 403, message: "Bukan task milik Anda" };
    return prisma.bid.findMany({
      where: { taskId },
      include: { tasker: { select: { id: true, fullName: true } } },
      orderBy: { createdAt: "asc" },
    });
  },

  async accept(bidId: string, ownerId: string) {
    const bid = await prisma.bid.findUnique({ where: { id: bidId }, include: { task: true } });
    if (!bid) throw { status: 404, message: "Tawaran tidak ditemukan" };
    if (bid.task.clientId !== ownerId) throw { status: 403, message: "Bukan task milik Anda" };
    if (bid.task.status !== "OPEN") throw { status: 400, message: "Task sudah tidak terbuka" };

    // $transaction: ketiga aksi ini berhasil semua, atau dibatalkan semua
    const [accepted] = await prisma.$transaction([
      prisma.bid.update({ where: { id: bidId }, data: { status: "ACCEPTED" } }),
      prisma.bid.updateMany({
        where: { taskId: bid.taskId, id: { not: bidId } },   // tolak bid lainnya
        data: { status: "REJECTED" },
      }),
      prisma.task.update({ where: { id: bid.taskId }, data: { status: "ASSIGNED" } }),
    ]);
    return accepted;
  },

  async myBids(taskerId: string) {
    return prisma.bid.findMany({
      where: { taskerId },
      include: { task: { select: { id: true, title: true, status: true } } },
      orderBy: { createdAt: "desc" },
    });
  },
};