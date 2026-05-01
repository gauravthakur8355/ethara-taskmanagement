// custome error class that all our applicaton errors should extend
// this lets us diferentiate between "expected" errors (like 404, 401)
// and actual bugs/crashes that we didnt anticipate
//
// honestly this pattern has saved me so many times in produciton
// — knowing whether to page on-call or just log and move on

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code: string;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = "INTERNAL_ERROR",
    isOperational: boolean = true
  ) {
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

// ─────────────────────────────────────────────
// pre-built error types so we dont have to remmber status codes
// (because who actually remembers if 401 is unauthorized or unauthentcated?)
// ─────────────────────────────────────────────

export class NotFoundError extends AppError {
  constructor(resource: string = "Resource") {
    super(`${resource} not found`, 404, "NOT_FOUND");
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "You are not autherized to do this") {
    super(message, 401, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Access deneid") {
    super(message, 403, "FORBIDDEN");
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = "Bad requst") {
    super(message, 400, "BAD_REQUEST");
  }
}

export class ConflictError extends AppError {
  constructor(message: string = "Resource alredy exists") {
    super(message, 409, "CONFLICT");
  }
}

export class ValidationError extends AppError {
  public readonly errors: Record<string, string[]>;

  constructor(errors: Record<string, string[]>) {
    super("Validaton failed", 422, "VALIDATION_ERROR");
    this.errors = errors;
  }
}
