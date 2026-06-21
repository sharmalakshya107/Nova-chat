import { Router } from "express";
import chatRoutes from "@modules/chat/chat.routes";
import healthRoutes from "@modules/health/health.routes";

const router = Router();

router.use("/health", healthRoutes);
router.use("/chat", chatRoutes);

export default router;
