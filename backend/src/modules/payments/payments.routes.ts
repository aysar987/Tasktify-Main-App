import { Router } from "express";
import { paymentController } from "./payments.controller";
import { authenticate } from "@/middlewares/authenticate";

const router = Router();
router.post("/task/:taskId", authenticate, paymentController.create);
router.post("/notification", paymentController.notification);          // ⚠️ TANPA authenticate
router.patch("/task/:taskId/release", authenticate, paymentController.release);

export default router;