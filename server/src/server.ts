import app from "./app";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { disconnectDB } from "./config/database";

/**
 * Server entry point.
 * Separated from app.ts so tests can import the Express app without binding to a port.
 */

const startServer = async (): Promise<void> => {
  try {
    const server = app.listen(env.PORT, () => {
      logger.info("Server started successfully", {
        port: env.PORT,
        environment: env.NODE_ENV,
        apiBase: `/api/v1`,
      });

      console.log(`
  Ethara API Server v1.0.0
  Port:        ${env.PORT}
  Environment: ${env.NODE_ENV}
  API Base:    http://localhost:${env.PORT}/api/v1
      `);
    });

    // Graceful shutdown handler
    const gracefulShutdown = async (signal: string) => {
      logger.warn(`Received ${signal} — starting graceful shutdown...`);

      server.close(async () => {
        logger.info("HTTP server closed");
        await disconnectDB();
        logger.info("Database disconnected — shutdown complete");
        process.exit(0);
      });

      // Force kill after 10s if something hangs
      setTimeout(() => {
        logger.error("Forced shutdown — server took too long to close");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

    process.on("unhandledRejection", (reason: unknown) => {
      logger.error("UNHANDLED PROMISE REJECTION", { reason });
    });

    process.on("uncaughtException", (error: Error) => {
      logger.error("UNCAUGHT EXCEPTION", {
        error: error.message,
        stack: error.stack,
      });
      gracefulShutdown("uncaughtException");
    });
  } catch (error) {
    logger.error("Failed to start server", { error });
    await disconnectDB();
    process.exit(1);
  }
};

startServer();
