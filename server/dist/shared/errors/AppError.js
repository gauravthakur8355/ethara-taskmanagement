"use strict";
// custome error class that all our applicaton errors should extend
// this lets us diferentiate between "expected" errors (like 404, 401)
// and actual bugs/crashes that we didnt anticipate
//
// honestly this pattern has saved me so many times in produciton
// — knowing whether to page on-call or just log and move on
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationError = exports.ConflictError = exports.BadRequestError = exports.ForbiddenError = exports.UnauthorizedError = exports.NotFoundError = exports.AppError = void 0;
class AppError extends Error {
    statusCode;
    isOperational;
    code;
    constructor(message, statusCode = 500, code = "INTERNAL_ERROR", isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.code = code;
        // this is a weird JS thing — without this line, instanceof checks
        // wont work properly becuase we're extending a built-in class
        // took me embarassingly long to figure this out the first time
        Object.setPrototypeOf(this, AppError.prototype);
        // captures the stack trace but excludes the constructor call itself
        // makes debuging a tiny bit cleaner
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
// ─────────────────────────────────────────────
// pre-built error types so we dont have to remmber status codes
// (because who actually remembers if 401 is unauthorized or unauthentcated?)
// ─────────────────────────────────────────────
class NotFoundError extends AppError {
    constructor(resource = "Resource") {
        super(`${resource} not found`, 404, "NOT_FOUND");
    }
}
exports.NotFoundError = NotFoundError;
class UnauthorizedError extends AppError {
    constructor(message = "You are not autherized to do this") {
        super(message, 401, "UNAUTHORIZED");
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ForbiddenError extends AppError {
    constructor(message = "Access deneid") {
        super(message, 403, "FORBIDDEN");
    }
}
exports.ForbiddenError = ForbiddenError;
class BadRequestError extends AppError {
    constructor(message = "Bad requst") {
        super(message, 400, "BAD_REQUEST");
    }
}
exports.BadRequestError = BadRequestError;
class ConflictError extends AppError {
    constructor(message = "Resource alredy exists") {
        super(message, 409, "CONFLICT");
    }
}
exports.ConflictError = ConflictError;
class ValidationError extends AppError {
    errors;
    constructor(errors) {
        super("Validaton failed", 422, "VALIDATION_ERROR");
        this.errors = errors;
    }
}
exports.ValidationError = ValidationError;
//# sourceMappingURL=AppError.js.map