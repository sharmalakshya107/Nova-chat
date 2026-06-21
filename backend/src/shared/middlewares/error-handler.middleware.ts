import { type ErrorRequestHandler } from "express";
import { logger } from "@shared/utils/logger";
import { type ApiErrorResponse } from "@shared/types/api-response";

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  const status = typeof error?.status === "number" ? error.status : 500;
  const message =
    typeof error?.message === "string" ? error.message : "Something went wrong";

  if (status >= 500) {
    logger.error("Unhandled request error", {
      status,
      method: req.method,
      path: req.path,
      message,
    });
  }

  const body: ApiErrorResponse = {
    success: false,
    error_code: status,
    message,
    data: error?.data ?? {},
  };

  res.status(status).send(body);
};
