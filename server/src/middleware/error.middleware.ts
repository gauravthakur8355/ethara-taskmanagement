import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";
import { logger } from "../config/logger";
import { AppError, ValidationError } from "../shared/errors/AppError";
import { sendError } from "../shared/utils/response";

/**
 * Global error handler — every error in the app ends up here.
 * Must be the last middleware registered.
 */
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error("Error caught by global handler", {
    name: err.name,
    message: err.message,
    path: _req.path,
    method: _req.method,
    ip: _req.ip,
    ...((!env.IS_PRODUCTION) && { stack: err.stack }),
  });

  // Validation errors — include field-level details
  if (err instanceof ValidationError) {
    sendError(res, err.message, err.statusCode, err.code, err.errors);
    return;
  }

  // Known application errors (404, 401, 403, etc.)
  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode, err.code);
    return;
  }

  // Prisma ORM errors
  if (err.name === "PrismaClientKnownRequestError") {
    const prismaError = err as any;

    switch (prismaError.code) {
      case "P2002":
        sendError(
          res,
          `A record with this ${prismaError.meta?.target?.join(", ") || "value"} already exists`,
          409,
          "DUPLICATE_ENTRY"
        );
        return;

      case "P2025":
        sendError(res, "Record not found", 404, "NOT_FOUND");
        return;

      case "P2003":
        sendError(res, "Related record not found", 400, "INVALID_REFERENCE");
        return;

      default:
        logger.error("Unhandled Prisma error", {
          code: prismaError.code,
          meta: prismaError.meta,
        });
        sendError(res, "Database operation failed", 500, "DATABASE_ERROR");
        return;
    }
  }

  // Unexpected errors
  const message = env.IS_PRODUCTION
    ? "Something went wrong — our team has been notified"
    : err.message || "Unknown error occurred";

  sendError(res, message, 500, "INTERNAL_ERROR");
};

/** Wraps async route handlers to forward rejections to the error handler */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
