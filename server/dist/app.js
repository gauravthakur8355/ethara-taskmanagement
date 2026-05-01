"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const env_1 = require("./config/env");
const logger_1 = require("./config/logger");
const error_middleware_1 = require("./middleware/error.middleware");
const rateLimiter_middleware_1 = require("./middleware/rateLimiter.middleware");
// ── Module routes ──
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const project_routes_1 = __importDefault(require("./modules/project/project.routes"));
const task_routes_1 = __importDefault(require("./modules/task/task.routes"));
const dashboard_routes_1 = __importDefault(require("./modules/dashboard/dashboard.routes"));
const user_routes_1 = __importDefault(require("./modules/user/user.routes"));
// task listing by project — seperate import for nested route
const auth_middleware_1 = require("./middleware/auth.middleware");
const error_middleware_2 = require("./middleware/error.middleware");
const task_controller_1 = require("./modules/task/task.controller");
const validate_middleware_1 = require("./middleware/validate.middleware");
const task_validation_1 = require("./modules/task/task.validation");
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
const app = (0, express_1.default)();
// ─── Trust Proxy ───
// if your behind nginx, AWS ALB, or Cloudflare, you need this
// otherwise req.ip will always be the proxy's IP, not the client's
// and rate limiting will rate-limit EVERYONE as the same IP... bad
if (env_1.env.IS_PRODUCTION) {
    app.set("trust proxy", 1); // trust first proxy
}
// ─── Security Headers ───
// helmet sets ~15 HTTP security hedders in one line:
// - X-Content-Type-Options: nosniff (prevents MIME sniffing)
// - X-Frame-Options: SAMEORIGIN (prevents clickjacking)
// - Strict-Transport-Security (forces HTTPS)
// - X-XSS-Protection (legacy XSS filter)
// - and more... just trust it and keep it first
app.use((0, helmet_1.default)());
// ─── Rate Limiting ───
// applied globally BEFORE routes — blocks abusers before
// they can even hit the database. differnt limits for diff endpoints
app.use("/api/auth", rateLimiter_middleware_1.authLimiter); // strict — 20 req/15min
app.use("/api/health", rateLimiter_middleware_1.healthLimiter); // relaxed — 60 req/min
app.use("/api", rateLimiter_middleware_1.generalLimiter); // moderate — 100 req/15min
// ─── CORS ───
// only allow reqests from our frontend URL
// the methods and headers list should match what the frontend actualy uses
app.use((0, cors_1.default)({
    origin: env_1.env.IS_PRODUCTION
        ? env_1.env.CLIENT_URL // strict in production
        : [env_1.env.CLIENT_URL, "http://localhost:3000", "http://localhost:5173"], // multiple origins in dev
    credentials: true, // needed for cookies and auth hedders
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["RateLimit-Limit", "RateLimit-Remaining", "RateLimit-Reset"], // so frontend can show "X requests remaining"
}));
// ─── Body Parsing ───
// 10mb limit prevents giant payloads from crashing the server
// (someone actualy tried uploading a 200mb JSON once... fun times)
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "10mb" }));
app.use((0, cookie_parser_1.default)());
// ─── HTTP Request Logging ───
// piped through Winston so all logs go to one place
// "dev" format in dev (colorized), "combined" in prod (Apache-style)
app.use((0, morgan_1.default)(env_1.env.IS_PRODUCTION ? "combined" : "dev", {
    stream: logger_1.morganStream,
    // skip health check logs in production — they're just noise
    skip: (req) => env_1.env.IS_PRODUCTION && req.path === "/api/v1/health",
}));
// ─── API Versioning ───
// all routes are under /api/v1 for versioning
// when we need breaking changes, we add /api/v2 without breaking existing clients
// also keeping /api/* as an alias for backwards compatability
// ─── Health Check ───
// monitoring tools and load balancers hit this to check if we're alive
// keep it fast — no database calls, no heavy computation
app.get("/api/v1/health", (_req, res) => {
    res.status(200).json({
        success: true,
        message: "Ethara API is running 🚀",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
        enviroment: env_1.env.NODE_ENV,
        uptime: `${Math.floor(process.uptime())}s`,
    });
});
// alias for backwards compatability — /api/health still works
app.get("/api/health", (_req, res) => {
    res.redirect(301, "/api/v1/health");
});
// ─── API v1 Routes ───
// versioned routes — the "real" endpoints
app.use("/api/v1/auth", auth_routes_1.default);
app.use("/api/v1/projects", project_routes_1.default);
app.use("/api/v1/tasks", task_routes_1.default);
app.use("/api/v1/dashboard", dashboard_routes_1.default);
app.use("/api/v1/users", user_routes_1.default);
// nested route: GET /api/v1/projects/:projectId/tasks
app.get("/api/v1/projects/:projectId/tasks", auth_middleware_1.authenticate, (0, validate_middleware_1.validateQuery)(task_validation_1.listTasksQuerySchema), (0, error_middleware_2.asyncHandler)(task_controller_1.taskController.findByProject));
// ─── Backwards Compatible Aliases ───
// /api/* still works but points to v1
// we can remove these once all clients migrate to /api/v1
app.use("/api/auth", auth_routes_1.default);
app.use("/api/projects", project_routes_1.default);
app.use("/api/tasks", task_routes_1.default);
app.use("/api/dashboard", dashboard_routes_1.default);
app.use("/api/users", user_routes_1.default);
app.get("/api/projects/:projectId/tasks", auth_middleware_1.authenticate, (0, validate_middleware_1.validateQuery)(task_validation_1.listTasksQuerySchema), (0, error_middleware_2.asyncHandler)(task_controller_1.taskController.findByProject));
// ─── API Info ───
// root endpoint — tells clients about the API
app.get("/api", (_req, res) => {
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
app.use("*", (_req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found — check the URL and method",
        code: "ROUTE_NOT_FOUND",
        hint: "Try GET /api/v1/health to verify the API is running",
    });
});
// ─── Global Error Handler ───
// MUST be the very last middleware — cathces everything from above
app.use(error_middleware_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map