import { type Request, type Response } from "express";
import asyncHandler from "express-async-handler";
import { createResponse } from "@shared/utils/response";
import { logger, toErrorMessage } from "@shared/utils/logger";
import { FRIENDLY_LLM_UNAVAILABLE_MESSAGE } from "@config/constants";
import { type SendMessageInput } from "./chat.types";
import * as chatService from "./chat.service";

export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  const { message, sessionId } = req.body as SendMessageInput;
  const result = await chatService.sendMessage(message, sessionId);
  res.send(createResponse(result, "Message processed"));
});

export const streamMessage = asyncHandler(
  async (req: Request, res: Response) => {
    const { message, sessionId } = req.body as SendMessageInput;

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });
    res.flushHeaders();

    const send = (event: unknown): void => {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    };

    let aborted = false;
    req.on("close", () => {
      aborted = true;
    });

    try {
      for await (const event of chatService.streamMessage(message, sessionId)) {
        if (aborted) break;
        send(event);
      }
    } catch (error) {
      logger.error("Chat stream failed", { error: toErrorMessage(error) });
      if (!aborted) {
        send({ type: "error", message: FRIENDLY_LLM_UNAVAILABLE_MESSAGE });
      }
    } finally {
      res.end();
    }
  }
);

export const getHistory = asyncHandler(async (req: Request, res: Response) => {
  const result = await chatService.getConversationHistory(req.params.sessionId);
  res.send(createResponse(result));
});
