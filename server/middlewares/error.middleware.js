import AppError from "../utils/appError.js";
import { logger } from "../utils/logger.js";

export const notFound = (req, res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

export const errorHandler = (error, req, res, next) => {
  const statusCode = error.statusCode || 500;
  const message =
    error.message || "Something went wrong while processing the request";

  logger.error("Request failed", {
    method: req.method,
    path: req.originalUrl,
    statusCode,
    message,
    details: error.details,
    stack:
      process.env.NODE_ENV === "production" ? undefined : error.stack,
  });

  res.status(statusCode).json({
    success: false,
    message,
    ...(error.details ? { details: error.details } : {}),
  });
};
