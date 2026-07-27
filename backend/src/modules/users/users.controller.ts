import { Request, Response, NextFunction } from "express";
import { userService } from "./users.service";
import { updateProfileSchema } from "./users.validation";
import { ok } from "@/utils/response";

export const userController = {
  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      ok(res, await userService.me(user.id), "Profil saya");
    } catch (e) { next(e); }
  },
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const data = updateProfileSchema.parse(req.body);
      ok(res, await userService.update(user.id, data), "Profil diperbarui");
    } catch (e) { next(e); }
  },
};