import { Request, Response, NextFunction } from "express";
import { taskService } from "./tasks.service";
import { createTaskSchema, listTaskQuerySchema } from "./tasks.validation";
import { ok } from "@/utils/response";

export const taskController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createTaskSchema.parse(req.body);
      const user = (req as any).user;                 // dari middleware authenticate
      const task = await taskService.create(user.id, data);
      ok(res, task, "Task berhasil dibuat");
    } catch (e) { next(e); }
  },

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = listTaskQuerySchema.parse(req.query);   // baca dari query URL
      const result = await taskService.list(filters);
      ok(res, result, "Daftar task");
    } catch (e) { next(e); }
  },

  async detail(req: Request, res: Response, next: NextFunction) {
    try {
      const task = await taskService.findById(String(req.params.id));
      ok(res, task, "Detail task");
    } catch (e) { next(e); }
  },

  async complete(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const task = await taskService.complete(String(req.params.id), user.id);
      ok(res, task, "Task ditandai selesai");
    } catch (e) { next(e); }
  },
};