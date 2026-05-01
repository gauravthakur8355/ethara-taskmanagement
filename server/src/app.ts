import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import { errorHandler } from "./middleware/error.middleware";

// ── Module routes ──
import authRoutes from "./modules/auth/auth.routes";
import projectRoutes from "./modules/project/project.routes";
import taskRoutes from "./modules/task/task.routes";

// task listing by project — needs a seperate import because
// its mounted under /api/projects/:projectId/tasks
// (nested resource pattern)
import { authenticate } from "./middleware/auth.middleware";
import { asyncHandler } from "./middleware/error.middleware";
import { taskController } from "./modules/task/task.controller";
import { validateQuery } from "./middleware/validate.middleware";
import { listTasksQuerySchema } from "./modules/task/task.validation";

// ══════════════════════════════════════════════════════════════
// Express App Setup
//
// this file creates and configurs the Express app
// its seperate from server.ts so we can import the app in tests
// without actualy starting the HTTP server
// (this pattern is called "app/server split" and its preety standard)
//
// the order of middleware matters A LOT here:
// 1. security headers (helmet)
// 2. cors
// 3. body parsing
// 4. logging
// 5. routes
// 6. error handler (MUST be last)
//
// i've seen codebases where someone put the error handler before
// the routes and then wonderd why errors werent being caught...
// dont be that person
// ══════════════════════════════════════════════════════════════

const app = express();

// ─── Security ───
// helmet sets a bunch of HTTP security hedders (X-Frame-Options,
// X-Content-Type-Options, etc). just trust it and keep it first.
app.use(helmet());

// CORS — only allow reqests from our frontend URL
// in production, this should be the actual deplyed frontend domain
// had an incedent where someone forgot to update this after deplying
// and the frontend couldnt talk to the API for 3 hours... fun weekend
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true, // needed for cookies/auth headers
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ─── Body Parsing ───
// limit request body size to 10mb — dont let anyone upload a 500mb
// JSON payload and crash our server (yes, this is a real atack vector)
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// ─── Logging ───
// "dev" format in development (colorized, concise)
// "combined" in production (Apache-style, good for log aggregaton)
app.use(morgan(env.IS_PRODUCTION ? "combined" : "dev"));

// ─── Health Check ───
// every production API needs a health endpint
// load balancers and monitoring tools hit this to check if the server is alive
// keep it simple — if it responds, the server is running
app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Ethara API is running 🚀",
    timestamp: new Date().toISOString(),
    enviroment: env.NODE_ENV,
    uptime: `${Math.floor(process.uptime())}s`, // how long the server has been up
  });
});

// ─── API Routes ───
// all routes are prefixed with /api for clarity
// makes it easy to put a reverse proxy (nginx) in front later
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);

// nested route: GET /api/projects/:projectId/tasks
// this is the "list tasks by project" endpoint
// mounted here becuase it crosses module boundaries
app.get(
  "/api/projects/:projectId/tasks",
  authenticate as any,
  validateQuery(listTasksQuerySchema),
  asyncHandler(taskController.findByProject as any)
);

// ─── 404 Handler ───
// if no route matched, return a proper 404 instead of Express's default HTML
// (nothign worse than getting HTML back when you expected JSON)
app.use("*", (_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Route not found — check the URL and try agian",
    code: "ROUTE_NOT_FOUND",
  });
});

// ─── Global Error Handler ───
// MUST be the very last middleware — catches all errors from above
// see error.middleware.ts for the implementation
app.use(errorHandler);

export default app;
