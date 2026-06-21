import { Router } from "express";
import { validateRequest } from "@shared/middlewares/validate.middleware";
import { chatRateLimiter } from "@shared/middlewares/rate-limit.middleware";
import * as chatController from "./chat.controller";
import * as chatValidation from "./chat.validation";

const router = Router();

router.post(
  "/message",
  chatRateLimiter,
  chatValidation.sendMessage,
  validateRequest,
  chatController.sendMessage
);

router.post(
  "/message/stream",
  chatRateLimiter,
  chatValidation.sendMessage,
  validateRequest,
  chatController.streamMessage
);

router.get(
  "/history/:sessionId",
  chatValidation.getHistory,
  validateRequest,
  chatController.getHistory
);

export default router;
