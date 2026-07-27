import { Router } from "express";
import { taskerController } from "./taskers.controller";
import { authenticate } from "@/middlewares/authenticate";
import { upload } from "@/middlewares/upload";

const router = Router();
// upload.single("ktp") memproses satu file dari field bernama "ktp"
router.post("/apply", authenticate, upload.single("ktp"), taskerController.apply);
router.get("/:id", taskerController.publicProfile);
router.put("/profile", authenticate, taskerController.updateProfile);

export default router;