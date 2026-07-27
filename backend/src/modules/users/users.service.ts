import { prisma } from "@/config/database";

export const userService = {
  async me(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, fullName: true, phone: true, avatarUrl: true, role: true },
    });
    if (!user) throw { status: 404, message: "User tidak ditemukan" };
    return user;
  },
  async update(userId: string, data: { fullName?: string; phone?: string; avatarUrl?: string }) {
    return prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, email: true, fullName: true, phone: true, avatarUrl: true, role: true },
    });
  },
};