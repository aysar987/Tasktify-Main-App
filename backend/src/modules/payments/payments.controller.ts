import { Request, Response, NextFunction } from "express";
import { paymentService } from "./payments.service";
import { ok } from "@/utils/response";

export const paymentController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const result = await paymentService.createForTask(String(req.params.taskId), user.id);
      ok(res, result, "Transaksi dibuat, silakan lanjut ke pembayaran");
    } catch (e) { next(e); }
  },
  // TANPA authenticate — ini dipanggil server Midtrans, bukan user
  async notification(req: Request, res: Response, next: NextFunction) {
    try {
      await paymentService.handleNotification(req.body);
      res.status(200).json({ ok: true });   // Midtrans wajib dijawab 200
    } catch (e) { next(e); }
  },
  async release(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const tx = await paymentService.release(String(req.params.taskId), user.id);
      ok(res, tx, "Dana dilepas ke tasker");
    } catch (e) { next(e); }
  },
};