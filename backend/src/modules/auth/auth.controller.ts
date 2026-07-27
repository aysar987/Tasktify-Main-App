import { Request, Response, NextFunction } from "express";
import { authService } from "./auth.service";
import { registerSchema, loginSchema } from "./auth.validation";
import { ok } from "@/utils/response";
import { isProd } from "@/config/env";

// 🔄 helper set cookie yang aman untuk web
const cookieOpts = (maxAgeMs: number) => ({
  httpOnly: true,               // JS di browser tidak bisa baca -> aman dari XSS
  secure: isProd,               // hanya HTTPS di produksi
  sameSite: "lax" as const,
  maxAge: maxAgeMs,
});

export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, fullName } = registerSchema.parse(req.body);
      const user = await authService.register(email, password, fullName);
      ok(res, user, "Registrasi berhasil");
    } catch (e) { next(e); }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const { accessToken, refreshToken, user } = await authService.login(email, password);

      // 🔄 kirim token via cookie, bukan di body
      res.cookie("accessToken", accessToken, cookieOpts(15 * 60 * 1000));       // 15 menit
      res.cookie("refreshToken", refreshToken, cookieOpts(7 * 24 * 60 * 60 * 1000)); // 7 hari

      ok(res, { user }, "Login berhasil");   // body cukup kirim data user
    } catch (e) { next(e); }
  },

  // 🔄 endpoint baru: logout menghapus cookie
  async logout(_req: Request, res: Response) {
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    ok(res, null, "Logout berhasil");
  },
};