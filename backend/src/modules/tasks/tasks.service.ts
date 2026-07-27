import { prisma } from "@/config/database";

export const taskService = {
  // client posting task
  async create(clientId: string, data: {
    title: string; description: string; category: string;
    budget: number; deadline?: string;
  }) {
    return prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
        budget: data.budget,
        deadline: data.deadline ? new Date(data.deadline) : undefined,
        clientId,                         // dari user yang login
      },
    });
  },

  // browse marketplace dengan filter + pagination
  async list(filters: {
    category?: string; minBudget?: number; maxBudget?: number;
    page: number; limit: number;
  }) {
    const { category, minBudget, maxBudget, page, limit } = filters;

    // bangun kondisi filter secara dinamis
    const where: any = { status: "OPEN" };   // marketplace hanya tampilkan yang terbuka
    if (category) where.category = category;
    if (minBudget || maxBudget) {
      where.budget = {};
      if (minBudget) where.budget.gte = minBudget;   // gte = lebih besar / sama dengan
      if (maxBudget) where.budget.lte = maxBudget;   // lte = lebih kecil / sama dengan
    }

    // jalankan query data + hitung total secara paralel
    const [items, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip: (page - 1) * limit,          // lompati data halaman sebelumnya
        take: limit,                        // ambil sebanyak limit
        orderBy: { createdAt: "desc" },     // terbaru dulu
        include: {
          client: { select: { id: true, fullName: true } },  // tampilkan nama pemosting
        },
      }),
      prisma.task.count({ where }),
    ]);

    return {
      items,
      pagination: { total, page, totalPages: Math.ceil(total / limit) },
    };
  },

  // detail satu task
  async findById(id: string) {
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, fullName: true } },
        bids: true,
      },
    });
    if (!task) throw { status: 404, message: "Task tidak ditemukan" };
    return task;
  },

  // tandai task selesai — HANYA pemilik task yang boleh
  async complete(id: string, userId: string) {
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) throw { status: 404, message: "Task tidak ditemukan" };
    if (task.clientId !== userId)
      throw { status: 403, message: "Ini bukan task milik Anda" };   // pengecekan kepemilikan
    return prisma.task.update({
      where: { id },
      data: { status: "COMPLETED" },
    });
  },
};