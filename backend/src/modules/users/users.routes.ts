import { Router } from "express";
import { userController } from "./users.controller";
import { authenticate } from "@/middlewares/authenticate";

const router = Router();
router.get("/me", authenticate, userController.me);
router.put("/profile", authenticate, userController.update);

export default router;