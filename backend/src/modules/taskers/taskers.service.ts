import { prisma } from "@/config/database";

export const taskerService = {
  async apply(userId: string, data: { bio?: string; skills: string[]; ktpUrl: string }) {
    const existing = await prisma.taskerProfile.findUnique({ where: { userId } });
    if (existing) throw { status: 409, message: "Anda sudah terdaftar sebagai tasker" };

    const profile = await prisma.taskerProfile.create({
      data: { userId, bio: data.bio, skills: data.skills, ktpUrl: data.ktpUrl },
    });
    await prisma.user.update({ where: { id: userId }, data: { role: "TASKER" } });
    return profile;
  },

  async getPublicProfile(userId: string) {
    const profile = await prisma.taskerProfile.findUnique({
      where: { userId },
      include: { user: { select: { id: true, fullName: true, avatarUrl: true } } },
    });
    if (!profile) throw { status: 404, message: "Tasker tidak ditemukan" };
    return profile;
  },

  async updateProfile(userId: string, data: { bio?: string; skills?: string[] }) {
    return prisma.taskerProfile.update({ where: { userId }, data });
  },

  // dipakai admin untuk approve/reject verifikasi
  async setKyc(userId: string, status: "APPROVED" | "REJECTED") {
    return prisma.taskerProfile.update({ where: { userId }, data: { ktpStatus: status } });
  },
};