import { Router } from "express";
import authRoutes from "@/modules/auth/auth.routes";
import taskRoutes from "@/modules/tasks/tasks.routes";
import taskerRoutes from "@/modules/taskers/taskers.routes";
import bidRoutes from "@/modules/bids/bids.routes";
import reviewRoutes from "@/modules/reviews/reviews.routes";
import userRoutes from "@/modules/users/users.routes";
//import paymentRoutes from "@/modules/payments/payments.routes";

const router = Router();
router.use("/auth", authRoutes);
router.use("/tasks", taskRoutes); 
router.use("/taskers", taskerRoutes);
router.use("/bids", bidRoutes);
router.use("/reviews", reviewRoutes);
router.use("/users", userRoutes);
//router.use("/payments", paymentRoutes);

export default router;