import { prisma } from "@/config/database";
import { hashPassword, comparePassword } from "@/utils/hash";
import { signAccess, signRefresh } from "@/utils/token";

export const authService = {
  async register(email: string, password: string, fullName: string) {
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) throw { status: 409, message: "Email sudah terdaftar" };
    const user = await prisma.user.create({
      data: { email, passwordHash: await hashPassword(password), fullName },
    });
    return { id: user.id, email: user.email, fullName: user.fullName };
  },

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await comparePassword(password, user.passwordHash)))
      throw { status: 401, message: "Email atau password salah" };
    const payload = { id: user.id, role: user.role };
    return {
      accessToken: signAccess(payload),
      refreshToken: signRefresh(payload),
      user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
    };
  },
};