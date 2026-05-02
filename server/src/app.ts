import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import { logger, morganStream } from "./config/logger";
import { errorHandler } from "./middleware/error.middleware";
import {
  generalLimiter,
  authLimiter,
  healthLimiter,
} from "./middleware/rateLimiter.middleware";

// ── Module routes ──
import authRoutes from "./modules/auth/auth.routes";
import projectRoutes from "./modules/project/project.routes";
import taskRoutes from "./modules/task/task.routes";
import dashboardRoutes from "./modules/dashboard/dashboard.routes";
import userRoutes from "./modules/user/user.routes";

// task listing by project — seperate import for nested route
import { authenticate } from "./middleware/auth.middleware";
import { asyncHandler } from "./middleware/error.middleware";
import { taskController } from "./modules/task/task.controller";
import { validateQuery } from "./middleware/validate.middleware";
import { listTasksQuerySchema } from "./modules/task/task.validation";

// ══════════════════════════════════════════════════════════════
// Express App Setup — Production Hardened
//
// this file creates and configurs the Express app
// seperate from server.ts so we can import in tests without
// actualy starting the HTTP server
//
// middleware order is CRITCAL:
// 1. trust proxy (if behind reverse proxy)
// 2. security headers (helmet)
// 3. rate limiting (before anything else — block abusers early)
// 4. cors
// 5. body parsing
// 6. logging
// 7. routes
// 8. 404 handler
// 9. error handler (MUST be last)
//
// messing up this order will cause subttle bugs that
// take forever to debug. dont ask me how i know.
// ══════════════════════════════════════════════════════════════

const app = express();

// ─── Trust Proxy ───
// if your behind nginx, AWS ALB, or Cloudflare, you need this
// otherwise req.ip will always be the proxy's IP, not the client's
// and rate limiting will rate-limit EVERYONE as the same IP... bad
if (env.IS_PRODUCTION) {
  app.set("trust proxy", 1); // trust first proxy
}

// ─── Security Headers ───
// helmet sets ~15 HTTP security hedders in one line:
// - X-Content-Type-Options: nosniff (prevents MIME sniffing)
// - X-Frame-Options: SAMEORIGIN (prevents clickjacking)
// - Strict-Transport-Security (forces HTTPS)
// - X-XSS-Protection (legacy XSS filter)
// - and more... just trust it and keep it first
app.use(helmet());

// ─── Rate Limiting ───
// applied globally BEFORE routes — blocks abusers before
// they can even hit the database. differnt limits for diff endpoints
app.use("/api/auth", authLimiter); // strict — 20 req/15min
app.use("/api/health", healthLimiter); // relaxed — 60 req/min
app.use("/api", generalLimiter); // moderate — 100 req/15min

// ─── CORS ───
// supports comma-separated CLIENT_URL for multiple origins
// e.g., CLIENT_URL="https://app.example.com,https://staging.example.com"
const allowedOrigins = env.CLIENT_URL
  .split(",")
  .map((url) => url.trim().replace(/\/$/, "")); // strip trailing slashes

// in development, also allow localhost origins
if (!env.IS_PRODUCTION) {
  allowedOrigins.push("http://localhost:3000", "http://localhost:5173");
}

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (curl, server-to-server, mobile)
      if (!origin) return callback(null, true);

      const normalized = origin.replace(/\/$/, "");
      if (allowedOrigins.includes(normalized)) {
        return callback(null, true);
      }

      callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true, // needed for cookies and auth hedders
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["RateLimit-Limit", "RateLimit-Remaining", "RateLimit-Reset"],
  })
);

// ─── Body Parsing ───
// 10mb limit prevents giant payloads from crashing the server
// (someone actualy tried uploading a 200mb JSON once... fun times)
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// ─── HTTP Request Logging ───
// piped through Winston so all logs go to one place
// "dev" format in dev (colorized), "combined" in prod (Apache-style)
app.use(
  morgan(env.IS_PRODUCTION ? "combined" : "dev", {
    stream: morganStream,
    // skip health check logs in production — they're just noise
    skip: (req) => env.IS_PRODUCTION && req.path === "/api/v1/health",
  })
);

// ─── API Versioning ───
// all routes are under /api/v1 for versioning
// when we need breaking changes, we add /api/v2 without breaking existing clients
// also keeping /api/* as an alias for backwards compatability

// ─── Health Check ───
// monitoring tools and load balancers hit this to check if we're alive
// keep it fast — no database calls, no heavy computation
app.get("/api/v1/health", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Ethara API is running 🚀",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    enviroment: env.NODE_ENV,
    uptime: `${Math.floor(process.uptime())}s`,
  });
});

// alias for backwards compatability — /api/health still works
app.get("/api/health", (_req: Request, res: Response) => {
  res.redirect(301, "/api/v1/health");
});

// ─── API v1 Routes ───
// versioned routes — the "real" endpoints
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/projects", projectRoutes);
app.use("/api/v1/tasks", taskRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/users", userRoutes);

// nested route: GET /api/v1/projects/:projectId/tasks
app.get(
  "/api/v1/projects/:projectId/tasks",
  authenticate as any,
  validateQuery(listTasksQuerySchema),
  asyncHandler(taskController.findByProject as any)
);

// ─── Backwards Compatible Aliases ───
// /api/* still works but points to v1
// we can remove these once all clients migrate to /api/v1
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/users", userRoutes);
app.get(
  "/api/projects/:projectId/tasks",
  authenticate as any,
  validateQuery(listTasksQuerySchema),
  asyncHandler(taskController.findByProject as any)
);

// ─── API Info ───
// root endpoint — tells clients about the API
app.get("/api", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Ethara Task Management API",
    version: "1.0.0",
    docs: "/api/v1/health",
    endpoints: {
      auth: "/api/v1/auth",
      projects: "/api/v1/projects",
      tasks: "/api/v1/tasks",
    },
  });
});

// ─── 404 Handler ───
// if no route matchd, return proper JSON (not Express's defualt HTML)
app.use("*", (_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Route not found — check the URL and method",
    code: "ROUTE_NOT_FOUND",
    hint: "Try GET /api/v1/health to verify the API is running",
  });
});

// ─── Global Error Handler ───
// MUST be the very last middleware — cathces everything from above
app.use(errorHandler);

export default app;
