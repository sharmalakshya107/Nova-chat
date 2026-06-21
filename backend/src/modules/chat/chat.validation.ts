import { body, checkExact, param } from "express-validator";
import { MAX_MESSAGE_LENGTH } from "@config/constants";

export const sendMessage = checkExact([
  body("message")
    .trim()
    .notEmpty()
    .withMessage("Message is required")
    .bail()
    .isString()
    .withMessage("Message must be a string")
    .bail()
    .isLength({ max: MAX_MESSAGE_LENGTH })
    .withMessage(`Message must be ${MAX_MESSAGE_LENGTH} characters or fewer`),
  body("sessionId")
    .optional({ values: "null" })
    .isString()
    .withMessage("sessionId must be a string"),
]);

export const getHistory = [
  param("sessionId")
    .notEmpty()
    .withMessage("sessionId is required")
    .bail()
    .isString()
    .withMessage("sessionId must be a string"),
];
