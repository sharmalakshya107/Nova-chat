import rateLimit from "express-rate-limit";
import { env } from "@config/env";

export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

export const chatRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.chatRateLimitMax,
  message: "Too many messages, please slow down.",
  standardHeaders: true,
  legacyHeaders: false,
});
