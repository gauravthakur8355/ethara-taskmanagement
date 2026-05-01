import app from "./app";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { disconnectDB } from "./config/database";

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

const startServer = async (): Promise<void> => {
  try {
    const server = app.listen(env.PORT, () => {
      console.log(`
  ╔═══════════════════════════════════════════════════╗
  ║                                                   ║
  ║   🚀 Ethara API Server v1.0.0                     ║
  ║                                                   ║
  ║   Port:        ${String(env.PORT).padEnd(33)}║
  ║   Environment: ${env.NODE_ENV.padEnd(33)}║
  ║   API Base:    http://localhost:${env.PORT}/api/v1      ║
  ║   Health:      http://localhost:${env.PORT}/api/v1/health║
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

      logger.info("Server started successfully", {
        port: env.PORT,
        enviroment: env.NODE_ENV,
        apiBase: `/api/v1`,
      });
    });

    // ─── Graceful Shutdown ───
    // when the process gets a terminaton signal:
    // 1. stop accepting new conections
    // 2. finish in-flight requsts
    // 3. close database connection
    // 4. exit cleanly
    const gracefulShutdown = async (signal: string) => {
      logger.warn(`Received ${signal} — starting gracful shutdown...`);

      server.close(async () => {
        logger.info("HTTP server closed — no more incomming connections");

        await disconnectDB();
        logger.info("Database disconneted — graceful shutdown complete 👋");

        process.exit(0);
      });

      // safty net — force kill after 10 seconds
      // if somthing is hanging, we definately dont want to wait forever
      setTimeout(() => {
        logger.error("Forced shutdwon — server took too long to close");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

    // ─── Uncaught Error Handlers ───
    process.on("unhandledRejection", (reason: unknown) => {
      logger.error("UNHANDLED PROMISE REJECTION", { reason });
      // dont exit — let the error handler deal with it
      // but in production you'd want to send this to Sentry/Datadog
    });

    process.on("uncaughtException", (error: Error) => {
      logger.error("UNCAUGHT EXCEPTION — this is fatal", {
        error: error.message,
        stack: error.stack,
      });
      // this IS fatal — must exit and let PM2/Docker restart us
      gracefulShutdown("uncaughtException");
    });
  } catch (error) {
    logger.error("Failed to start server", { error });
    await disconnectDB();
    process.exit(1);
  }
};

startServer();
