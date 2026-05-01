import rateLimit from "express-rate-limit";
import { env } from "../config/env";
import { logger } from "../config/logger";

// ══════════════════════════════════════════════════════════════
// Rate Limiting — prevents abuse and brute-force atacks
//
// without this, someone could:
// - spam your login endpoint trying passwords (brute force)
// - DDoS your API with thousends of requests per second
// - scrape all your data by hitting list endpoints rapidly
//
// we have diffrent limiters for diffrent endpoints becuase
// not all routes need the same protection level:
// - auth endpoints: STRICT (prevent brute-force)
// - general API: MODERATE (prevent abuse)
// - health check: RELAXED (monitoring tools hit this frequntly)
//
// in production, you'd also want a WAF (like Cloudflare) in front
// but application-level rate limiting is still a good practise
// ══════════════════════════════════════════════════════════════

// ─── General API Rate Limiter ───
// 100 requests per 15 minutes per IP — generous enoguh for normal use
// but stops automated scrapers and abusive clients
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minute window
  max: env.IS_PRODUCTION ? 100 : 1000, // way more relaxed in dev (dont want to rate-limit ourselves while testing lol)
  standardHeaders: true, // return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // disable the old `X-RateLimit-*` headers (depracated)
  message: {
    success: false,
    message: "Too many requests from this IP — slow down buddy 🐌",
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

// ─── Auth Rate Limiter (Strict) ───
// only 20 attempts per 15 minutes — stops brute-force login atacks
// this is agressive on purpose — if a legit user fails 20 times
// they probaly forgot their password and should use reset
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.IS_PRODUCTION ? 20 : 500, // very strict in prod
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication atempts — please try again later",
    code: "AUTH_RATE_LIMIT_EXCEEDED",
  },
  handler: (_req, res, _next, options) => {
    // this one gets a warning log becuase its suspicious behavior
    logger.warn("Auth rate limit exceeded — possible brute force", {
      ip: _req.ip,
      path: _req.path,
      limiter: "auth",
    });
    res.status(429).json(options.message);
  },
  // skip succesful requests — only count failed ones
  // (so a user who logs in succesfully on first try doesnt burn a slot)
  skipSuccessfulRequests: true,
});

// ─── Health Check Limiter ───
// more relaxed — monitoring tools hit this every 30 seconds
// but we still dont want unlimited access
export const healthLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: 60, // once per second is fine
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Health check rate limit exceeed",
    code: "RATE_LIMIT_EXCEEDED",
  },
});
