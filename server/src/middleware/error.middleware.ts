import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";
import { AppError, ValidationError } from "../shared/errors/AppError";
import { sendError } from "../shared/utils/response";

// ──────────────────────────────────────────────────────────────
// THE BIG ONE — centralized error handler
// every error in the entire app eventualy ends up here
// this is the last line of defence before the client gets a response
//
// fun fact: i once forgot to add this middleware and spent 3 hours
// debuging why my app was returning empty 500 responses. good times.
// ──────────────────────────────────────────────────────────────

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // log the full error internaly — we need this for debuging
  // but NEVER send the stack trace to the clent in production
  console.error("💥 Error caught by global handler:");
  console.error(`   Name: ${err.name}`);
  console.error(`   Message: ${err.message}`);

  if (!env.IS_PRODUCTION) {
    // in dev mode, print the full stack — makes life eazier
    console.error(`   Stack: ${err.stack}`);
  }

  // handle our custom AppError instances — these are "expected" errors
  // like 404s, 401s, validation failures etc
  if (err instanceof ValidationError) {
    sendError(res, err.message, err.statusCode, err.code, err.errors);
    return;
  }

  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode, err.code);
    return;
  }

  // handle Prisma-specific errors — these come from the ORM
  // and usally mean somthing went wrong with the database
  if (err.name === "PrismaClientKnownRequestError") {
    const prismaError = err as any; // yeah i know, "any" is bad, fight me

    switch (prismaError.code) {
      case "P2002":
        // unique constraint voilation — like trying to register with
        // an email thats already taken
        sendError(
          res,
          `A record with this ${prismaError.meta?.target?.join(", ") || "value"} already exisits`,
          409,
          "DUPLICATE_ENTRY"
        );
        return;

      case "P2025":
        // record not found — someone tried to update/delete somthing
        // that doesnt exist (or was already delted)
        sendError(res, "Record not found", 404, "NOT_FOUND");
        return;

      case "P2003":
        // foreign key constraint failed — orphaned refrence
        sendError(
          res,
          "Related record not found — check your refrences",
          400,
          "INVALID_REFERENCE"
        );
        return;

      default:
        // some other prisma error we havent handled specificaly
        sendError(res, "Database operaton failed", 500, "DATABASE_ERROR");
        return;
    }
  }

  // if we get here, its an unhandeled error — probaly a bug
  // in production, send a genric message (dont leak internals)
  // in dev, send the actual error mesage for debuging
  const message = env.IS_PRODUCTION
    ? "Something went wrong — our team has been notifed"
    : err.message || "Unknown error occured";

  sendError(res, message, 500, "INTERNAL_ERROR");
};

// catches async errors in route handlers so we dont need try/catch evrywhere
// wraps the controller function and forwards any rejectons to the error handler
// this is honestly one of the most usefull utilities in the entire codebase
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
