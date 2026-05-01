"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = exports.errorHandler = void 0;
const env_1 = require("../config/env");
const logger_1 = require("../config/logger");
const AppError_1 = require("../shared/errors/AppError");
const response_1 = require("../shared/utils/response");
// ──────────────────────────────────────────────────────────────
// THE BIG ONE — centralized error handler
// every error in the entire app eventualy ends up here
// this is the last line of defence before the client gets a response
//
// now using Winston for structred logging instead of console.log
// so errors show up properly in log aggregation tools
// (Datadog, ELK, CloudWatch etc)
// ──────────────────────────────────────────────────────────────
const errorHandler = (err, _req, res, _next) => {
    // log the full error internaly with Winston
    // structured format makes it searchible in production
    logger_1.logger.error("Error caught by global handler", {
        name: err.name,
        message: err.message,
        path: _req.path,
        method: _req.method,
        ip: _req.ip,
        ...((!env_1.env.IS_PRODUCTION) && { stack: err.stack }),
    });
    // handle our custom ValidationError — includes field-level errors
    if (err instanceof AppError_1.ValidationError) {
        (0, response_1.sendError)(res, err.message, err.statusCode, err.code, err.errors);
        return;
    }
    // handle our custom AppError — "expected" errors (404, 401, etc)
    if (err instanceof AppError_1.AppError) {
        (0, response_1.sendError)(res, err.message, err.statusCode, err.code);
        return;
    }
    // handle Prisma-specific errors — ORM database errors
    if (err.name === "PrismaClientKnownRequestError") {
        const prismaError = err;
        switch (prismaError.code) {
            case "P2002":
                // unique constraint voilation
                (0, response_1.sendError)(res, `A record with this ${prismaError.meta?.target?.join(", ") || "value"} already exisits`, 409, "DUPLICATE_ENTRY");
                return;
            case "P2025":
                // record not found
                (0, response_1.sendError)(res, "Record not found", 404, "NOT_FOUND");
                return;
            case "P2003":
                // foreign key constraint failed
                (0, response_1.sendError)(res, "Related record not found — check your refrences", 400, "INVALID_REFERENCE");
                return;
            default:
                logger_1.logger.error("Unhandled Prisma error", {
                    code: prismaError.code,
                    meta: prismaError.meta,
                });
                (0, response_1.sendError)(res, "Database operaton failed", 500, "DATABASE_ERROR");
                return;
        }
    }
    // unhandeled error — probaly a bug in our code
    const message = env_1.env.IS_PRODUCTION
        ? "Something went wrong — our team has been notifed"
        : err.message || "Unknown error occured";
    (0, response_1.sendError)(res, message, 500, "INTERNAL_ERROR");
};
exports.errorHandler = errorHandler;
// catches async errors so we dont need try/catch in every controller
// wraps the handler and forwards rejections to the error handler
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
//# sourceMappingURL=error.middleware.js.map