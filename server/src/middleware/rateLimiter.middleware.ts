import rateLimit from "express-rate-limit";
import { env } from "../config/env";
import { logger } from "../config/logger";

// General API limiter — 100 req/15min in production
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.IS_PRODUCTION ? 100 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests — please slow down",
    code: "RATE_LIMIT_EXCEEDED",
  },
  handler: (_req, res, _next, options) => {
    logger.warn("Rate limit exceeded", {
      ip: _req.ip,
      path: _req.path,
      limiter: "general",
    });
    res.status(429).json(options.message);
  },
});

// Auth limiter — strict, 20 req/15min to prevent brute-force
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.IS_PRODUCTION ? 20 : 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication attempts — please try again later",
    code: "AUTH_RATE_LIMIT_EXCEEDED",
  },
  handler: (_req, res, _next, options) => {
    logger.warn("Auth rate limit exceeded — possible brute force", {
      ip: _req.ip,
      path: _req.path,
      limiter: "auth",
    });
    res.status(429).json(options.message);
  },
  skipSuccessfulRequests: true,
});

// Health check limiter — relaxed for monitoring tools
export const healthLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Health check rate limit exceeded",
    code: "RATE_LIMIT_EXCEEDED",
  },
});
