import { Router } from "express";
import { taskController } from "./tasks.controller";
import { authenticate } from "@/middlewares/authenticate";

const router = Router();

// PUBLIK — siapa saja boleh browse marketplace tanpa login
router.get("/", taskController.list);
router.get("/:id", taskController.detail);

// TERPROTEKSI — wajib login (authenticate dipasang sebagai middleware)
router.post("/", authenticate, taskController.create);
router.patch("/:id/complete", authenticate, taskController.complete);

export default router;