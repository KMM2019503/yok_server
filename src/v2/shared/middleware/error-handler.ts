import type { ErrorRequestHandler } from "express";
import logger from "../../../v1/utils/logger";
import { AppError, ValidationError } from "../errors";

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
      ...(err instanceof ValidationError && err.errors
        ? { details: err.errors }
        : {}),
    });
    return;
  }

  logger.error("Unhandled v2 error", {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  res.status(500).json({ error: err.message });
};
