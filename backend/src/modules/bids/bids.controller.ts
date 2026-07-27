import { Request, Response, NextFunction } from "express";
import { bidService } from "./bids.service";
import { createBidSchema } from "./bids.validation";
import { ok } from "@/utils/response";

export const bidController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const data = createBidSchema.parse(req.body);
      const bid = await bidService.create(String(req.params.taskId), user.id, data);
      ok(res, bid, "Tawaran terkirim");
    } catch (e) { next(e); }
  },
  async listForTask(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const bids = await bidService.listForTask(String(req.params.taskId), user.id);
      ok(res, bids, "Daftar tawaran");
    } catch (e) { next(e); }
  },
  async accept(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const bid = await bidService.accept(String(req.params.id), user.id);
      ok(res, bid, "Tawaran diterima");
    } catch (e) { next(e); }
  },
  async myBids(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const bids = await bidService.myBids(user.id);
      ok(res, bids, "Riwayat tawaran");
    } catch (e) { next(e); }
  },
};