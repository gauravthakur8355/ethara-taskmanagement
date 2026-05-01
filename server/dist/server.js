"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const env_1 = require("./config/env");
const logger_1 = require("./config/logger");
const database_1 = require("./config/database");
// ══════════════════════════════════════════════════════════════
// Server Entry Point — production ready
//
// seperate from app.ts so tests can import the app without
// binding to a port. this file ONLY handles:
// 1. starting the HTTP server
// 2. graceful shutdwon (SIGTERM, SIGINT)
// 3. uncaught error handling
//
// all logging goes thru Winston now — no more console.log
// (well except for the startup banner becuase it looks cool)
// ══════════════════════════════════════════════════════════════
const startServer = async () => {
    try {
        const server = app_1.default.listen(env_1.env.PORT, () => {
            console.log(`
  ╔═══════════════════════════════════════════════════╗
  ║                                                   ║
  ║   🚀 Ethara API Server v1.0.0                     ║
  ║                                                   ║
  ║   Port:        ${String(env_1.env.PORT).padEnd(33)}║
  ║   Environment: ${env_1.env.NODE_ENV.padEnd(33)}║
  ║   API Base:    http://localhost:${env_1.env.PORT}/api/v1      ║
  ║   Health:      http://localhost:${env_1.env.PORT}/api/v1/health║
  ║                                                   ║
  ║   Production features:                            ║
  ║   ✅ Winston logging                              ║
  ║   ✅ Rate limiting (tiered)                       ║
  ║   ✅ Helmet security headers                      ║
  ║   ✅ CORS configured                              ║
  ║   ✅ API versioning (v1)                          ║
  ║   ✅ Graceful shutdown                            ║
  ║                                                   ║
  ║   Ready to recieve requests! 💪                   ║
  ║                                                   ║
  ╚═══════════════════════════════════════════════════╝
      `);
            logger_1.logger.info("Server started successfully", {
                port: env_1.env.PORT,
                enviroment: env_1.env.NODE_ENV,
                apiBase: `/api/v1`,
            });
        });
        // ─── Graceful Shutdown ───
        // when the process gets a terminaton signal:
        // 1. stop accepting new conections
        // 2. finish in-flight requsts
        // 3. close database connection
        // 4. exit cleanly
        const gracefulShutdown = async (signal) => {
            logger_1.logger.warn(`Received ${signal} — starting gracful shutdown...`);
            server.close(async () => {
                logger_1.logger.info("HTTP server closed — no more incomming connections");
                await (0, database_1.disconnectDB)();
                logger_1.logger.info("Database disconneted — graceful shutdown complete 👋");
                process.exit(0);
            });
            // safty net — force kill after 10 seconds
            // if somthing is hanging, we definately dont want to wait forever
            setTimeout(() => {
                logger_1.logger.error("Forced shutdwon — server took too long to close");
                process.exit(1);
            }, 10000);
        };
        process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
        process.on("SIGINT", () => gracefulShutdown("SIGINT"));
        // ─── Uncaught Error Handlers ───
        process.on("unhandledRejection", (reason) => {
            logger_1.logger.error("UNHANDLED PROMISE REJECTION", { reason });
            // dont exit — let the error handler deal with it
            // but in production you'd want to send this to Sentry/Datadog
        });
        process.on("uncaughtException", (error) => {
            logger_1.logger.error("UNCAUGHT EXCEPTION — this is fatal", {
                error: error.message,
                stack: error.stack,
            });
            // this IS fatal — must exit and let PM2/Docker restart us
            gracefulShutdown("uncaughtException");
        });
    }
    catch (error) {
        logger_1.logger.error("Failed to start server", { error });
        await (0, database_1.disconnectDB)();
        process.exit(1);
    }
};
startServer();
//# sourceMappingURL=server.js.map