import { Request, Response, NextFunction } from "express";
import { reviewService } from "./reviews.service";
import { createReviewSchema } from "./reviews.validation";
import { ok } from "@/utils/response";

export const reviewController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const data = createReviewSchema.parse(req.body);
      const review = await reviewService.create(String(req.params.taskId), user.id, data);
      ok(res, review, "Ulasan terkirim");
    } catch (e) { next(e); }
  },
  async listForTasker(req: Request, res: Response, next: NextFunction) {
    try {
      const reviews = await reviewService.listForTasker(String(req.params.id));
      ok(res, reviews, "Daftar ulasan");
    } catch (e) { next(e); }
  },
};