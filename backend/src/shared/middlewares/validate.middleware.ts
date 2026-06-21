import { type NextFunction, type Request, type Response } from "express";
import asyncHandler from "express-async-handler";
import { validationResult } from "express-validator";
import createHttpError from "http-errors";

export const validateRequest = asyncHandler(
  (req: Request, _res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createHttpError(400, {
        message: "Validation error",
        data: { errors: errors.array() },
      });
    }
    next();
  }
);
