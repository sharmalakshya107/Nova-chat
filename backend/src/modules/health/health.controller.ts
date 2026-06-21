import { type Request, type Response } from "express";
import asyncHandler from "express-async-handler";
import { isLlmAvailable } from "@shared/llm";
import { isDatabaseReachable } from "@shared/services/prisma.service";
import { createResponse } from "@shared/utils/response";

export const getHealth = asyncHandler(async (_req: Request, res: Response) => {
  const databaseConnected = await isDatabaseReachable();
  res.send(
    createResponse({
      status: "ok",
      database: databaseConnected ? "connected" : "disconnected",
      assistant: isLlmAvailable() ? "live" : "offline",
    })
  );
});
