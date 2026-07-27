import { prisma } from "@/config/database";

export const reviewService = {
  async create(taskId: string, reviewerId: string, data: {
    revieweeId: string; rating: number; comment?: string;
  }) {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw { status: 404, message: "Task tidak ditemukan" };
    if (task.status !== "COMPLETED")
      throw { status: 400, message: "Hanya task yang sudah selesai bisa diulas" };

    // cegah ulasan ganda dari orang yang sama untuk task yang sama
    const existing = await prisma.review.findFirst({ where: { taskId, reviewerId } });
    if (existing) throw { status: 409, message: "Anda sudah memberi ulasan untuk task ini" };

    const review = await prisma.review.create({
      data: {
        taskId, reviewerId,
        revieweeId: data.revieweeId,
        rating: data.rating,
        comment: data.comment,
      },
    });

    await reviewService.recalcRating(data.revieweeId);   // hitung ulang rata-rata
    return review;
  },

  // hitung ulang rata-rata & jumlah ulasan, simpan ke profil tasker
  async recalcRating(userId: string) {
    const agg = await prisma.review.aggregate({
      where: { revieweeId: userId },
      _avg: { rating: true },
      _count: { rating: true },
    });
    const profile = await prisma.taskerProfile.findUnique({ where: { userId } });
    if (profile) {
      await prisma.taskerProfile.update({
        where: { userId },
        data: {
          ratingAvg: agg._avg.rating ?? 0,
          totalJobs: agg._count.rating,
        },
      });
    }
  },

  async listForTasker(userId: string) {
    return prisma.review.findMany({
      where: { revieweeId: userId },
      include: { reviewer: { select: { id: true, fullName: true } } },
      orderBy: { createdAt: "desc" },
    });
  },
};