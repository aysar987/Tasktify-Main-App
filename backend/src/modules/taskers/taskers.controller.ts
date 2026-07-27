import { Request, Response, NextFunction } from "express";
import { taskerService } from "./taskers.service";
import { uploadToCloudinary } from "@/utils/upload";
import { ok } from "@/utils/response";

export const taskerController = {
  async apply(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      if (!req.file) throw { status: 400, message: "Foto KTP wajib diunggah" };

      // PENTING: di multipart/form-data, field teks datang sebagai STRING.
      // skills dikirim dipisah koma, mis. "desain,input data" -> jadi array.
      const bio = req.body.bio as string | undefined;
      const skills = String(req.body.skills || "")
        .split(",").map((s) => s.trim()).filter(Boolean);
      if (skills.length === 0) throw { status: 400, message: "Minimal satu keahlian" };

      const ktpUrl = await uploadToCloudinary(req.file.buffer, "tasktify/ktp");
      const profile = await taskerService.apply(user.id, { bio, skills, ktpUrl });
      ok(res, profile, "Pendaftaran tasker berhasil, menunggu verifikasi");
    } catch (e) { next(e); }
  },

  async publicProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const profile = await taskerService.getPublicProfile(String(req.params.id));
      ok(res, profile, "Profil tasker");
    } catch (e) { next(e); }
  },

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const profile = await taskerService.updateProfile(user.id, req.body);
      ok(res, profile, "Profil diperbarui");
    } catch (e) { next(e); }
  },
};