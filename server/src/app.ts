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

import authRoutes from "./modules/auth/auth.routes";
import projectRoutes from "./modules/project/project.routes";
import taskRoutes from "./modules/task/task.routes";
import dashboardRoutes from "./modules/dashboard/dashboard.routes";
import userRoutes from "./modules/user/user.routes";

import { authenticate } from "./middleware/auth.middleware";
import { asyncHandler } from "./middleware/error.middleware";
import { taskController } from "./modules/task/task.controller";
import { validateQuery } from "./middleware/validate.middleware";
import { listTasksQuerySchema } from "./modules/task/task.validation";

/**
 * Express app setup — separated from server.ts for testability.
 *
 * Middleware order matters:
 * 1. trust proxy  2. helmet  3. rate limiting  4. cors
 * 5. body parsing 6. logging 7. routes 8. 404 9. error handler
 */

const app = express();

// Trust proxy for accurate client IPs behind Railway/Nginx
if (env.IS_PRODUCTION) {
  app.set("trust proxy", 1);
}

// Security headers
app.use(helmet());

// Rate limiting — applied before routes
app.use("/api/auth", authLimiter);
app.use("/api/health", healthLimiter);
app.use("/api", generalLimiter);

// CORS — supports comma-separated CLIENT_URL for multiple origins
const allowedOrigins = env.CLIENT_URL
  .split(",")
  .map((url) => url.trim().replace(/\/$/, ""));

if (!env.IS_PRODUCTION) {
  allowedOrigins.push("http://localhost:3000", "http://localhost:5173");
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      const normalized = origin.replace(/\/$/, "");
      if (allowedOrigins.includes(normalized)) {
        return callback(null, true);
      }

      callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["RateLimit-Limit", "RateLimit-Remaining", "RateLimit-Reset"],
  })
);

// Body parsing with size limits
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// HTTP request logging via Winston
app.use(
  morgan(env.IS_PRODUCTION ? "combined" : "dev", {
    stream: morganStream,
    skip: (req) => env.IS_PRODUCTION && req.path === "/api/v1/health",
  })
);

// Health check endpoint
app.get("/api/v1/health", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Ethara API is running",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    uptime: `${Math.floor(process.uptime())}s`,
  });
});

app.get("/api/health", (_req: Request, res: Response) => {
  res.redirect(301, "/api/v1/health");
});

// API v1 routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/projects", projectRoutes);
app.use("/api/v1/tasks", taskRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/users", userRoutes);

// Nested route: GET /api/v1/projects/:projectId/tasks
app.get(
  "/api/v1/projects/:projectId/tasks",
  authenticate as any,
  validateQuery(listTasksQuerySchema),
  asyncHandler(taskController.findByProject as any)
);

// Backwards-compatible aliases (unversioned)
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

// API info
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

// 404 handler
app.use("*", (_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Route not found — check the URL and method",
    code: "ROUTE_NOT_FOUND",
    hint: "Try GET /api/v1/health to verify the API is running",
  });
});

// Global error handler (must be last)
app.use(errorHandler);

export default app;
