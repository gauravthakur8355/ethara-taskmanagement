import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";
import { logger } from "../config/logger";
import { AppError, ValidationError } from "../shared/errors/AppError";
import { sendError } from "../shared/utils/response";

// ──────────────────────────────────────────────────────────────
// THE BIG ONE — centralized error handler
// every error in the entire app eventualy ends up here
// this is the last line of defence before the client gets a response
//
// now using Winston for structred logging instead of console.log
// so errors show up properly in log aggregation tools
// (Datadog, ELK, CloudWatch etc)
// ──────────────────────────────────────────────────────────────

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // log the full error internaly with Winston
  // structured format makes it searchible in production
  logger.error("Error caught by global handler", {
    name: err.name,
    message: err.message,
    path: _req.path,
    method: _req.method,
    ip: _req.ip,
    ...((!env.IS_PRODUCTION) && { stack: err.stack }),
  });

  // handle our custom ValidationError — includes field-level errors
  if (err instanceof ValidationError) {
    sendError(res, err.message, err.statusCode, err.code, err.errors);
    return;
  }

  // handle our custom AppError — "expected" errors (404, 401, etc)
  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode, err.code);
    return;
  }

  // handle Prisma-specific errors — ORM database errors
  if (err.name === "PrismaClientKnownRequestError") {
    const prismaError = err as any;

    switch (prismaError.code) {
      case "P2002":
        // unique constraint voilation
        sendError(
          res,
          `A record with this ${prismaError.meta?.target?.join(", ") || "value"} already exisits`,
          409,
          "DUPLICATE_ENTRY"
        );
        return;

      case "P2025":
        // record not found
        sendError(res, "Record not found", 404, "NOT_FOUND");
        return;

      case "P2003":
        // foreign key constraint failed
        sendError(
          res,
          "Related record not found — check your refrences",
          400,
          "INVALID_REFERENCE"
        );
        return;

      default:
        logger.error("Unhandled Prisma error", {
          code: prismaError.code,
          meta: prismaError.meta,
        });
        sendError(res, "Database operaton failed", 500, "DATABASE_ERROR");
        return;
    }
  }

  // unhandeled error — probaly a bug in our code
  const message = env.IS_PRODUCTION
    ? "Something went wrong — our team has been notifed"
    : err.message || "Unknown error occured";

  sendError(res, message, 500, "INTERNAL_ERROR");
};

// catches async errors so we dont need try/catch in every controller
// wraps the handler and forwards rejections to the error handler
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
