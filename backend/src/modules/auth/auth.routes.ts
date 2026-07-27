import { Router } from "express";
import { authController } from "./auth.controller";
import { authenticate } from "@/middlewares/authenticate";

const router = Router();
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/logout", authenticate, authController.logout);   // 🔄 BARU

export default router;