import { Router } from "express";
import { bidController } from "./bids.controller";
import { authenticate } from "@/middlewares/authenticate";

const router = Router();
router.post("/task/:taskId", authenticate, bidController.create);      // tasker menawar
router.get("/task/:taskId", authenticate, bidController.listForTask);  // client lihat tawaran
router.patch("/:id/accept", authenticate, bidController.accept);       // client terima
router.get("/mine", authenticate, bidController.myBids);               // riwayat tasker

export default router;