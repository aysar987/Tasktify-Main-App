import { Router } from "express";
import { reviewController } from "./reviews.controller";
import { authenticate } from "@/middlewares/authenticate";

const router = Router();
router.post("/task/:taskId", authenticate, reviewController.create);
router.get("/tasker/:id", reviewController.listForTasker);   // publik

export default router;