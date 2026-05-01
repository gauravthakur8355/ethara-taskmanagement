import app from "./app";
import { env } from "./config/env";
import { disconnectDB } from "./config/database";

// ══════════════════════════════════════════════════════════════
// Server Entry Point — this is where eveything starts
//
// why is this seperate from app.ts?
// becuase in tests, we want to import the app WITHOUT starting
// the actual HTTP server. this file ONLY handles:
// 1. starting the server
// 2. graceful shutdwon
// 3. uncaught error handling
//
// if the server crashes in production and you find yourself reading
// this file — im sorry. check the logs, grab some coffe, you got this.
// ══════════════════════════════════════════════════════════════

const startServer = async (): Promise<void> => {
  try {
    const server = app.listen(env.PORT, () => {
      console.log(`
  ╔═══════════════════════════════════════════════════╗
  ║                                                   ║
  ║   🚀 Ethara API Server                            ║
  ║                                                   ║
  ║   Port:        ${String(env.PORT).padEnd(33)}║
  ║   Environment: ${env.NODE_ENV.padEnd(33)}║
  ║   Health:      http://localhost:${env.PORT}/api/health   ║
  ║                                                   ║
  ║   Ready to recieve requests! 💪                   ║
  ║                                                   ║
  ╚═══════════════════════════════════════════════════╝
      `);
    });

    // ─── Graceful Shutdown ───
    // when the process gets a termination signal (SIGTERM from Docker,
    // SIGINT from Ctrl+C), we want to:
    // 1. stop accepting new conections
    // 2. finish processing in-flight requsts
    // 3. close the database connection
    // 4. exit cleanly
    //
    // without this, active requests would get abruptly killed
    // and database connections would leak. not great for producton.

    const gracefulShutdown = async (signal: string) => {
      console.log(`\n⚠️  Received ${signal} — starting gracful shutdown...`);

      // stop accepting new connections
      server.close(async () => {
        console.log("📡 HTTP server closed — no more incomming connections");

        // disconnect from database
        await disconnectDB();
        console.log("✅ Graceful shutdwon complete — goodbye! 👋");

        process.exit(0);
      });

      // if the server doesnt close within 10 seconds, force kill
      // this is a safty net — should never happen in practice
      // but if it does, we definately dont want the process hanging forever
      setTimeout(() => {
        console.error("❌ Forced shutdwon — server took too long to close");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

    // ─── Uncaught Error Handlers ───
    // these are the absolute last resort — if an error makes it here,
    // somthing went seriously wrong and we probaly need to restart
    //
    // unhandledRejection = a Promise rejected without a .catch()
    // uncaughtException = a synchronous throw that nobody caught

    process.on("unhandledRejection", (reason: unknown) => {
      console.error("💥 UNHANDLED PROMISE REJECTION:");
      console.error(reason);
      // in production, you'd want to send this to an error tracking service
      // like Sentry before shutting down
      // dont exit here — let the error handler deal with it
    });

    process.on("uncaughtException", (error: Error) => {
      console.error("💥 UNCAUGHT EXCEPTION — this is bad:");
      console.error(error);
      // this one IS fatal — the app is in an unknown state
      // we MUST exit and let the process manager (PM2, Docker) restart us
      // tryng to continue after an uncaught exception is dangrous
      gracefulShutdown("uncaughtException");
    });
  } catch (error) {
    // if we cant even START the server, something is very wrong
    // (probably a port conflict or database connection issue)
    console.error("💥 Failed to start server:", error);
    await disconnectDB();
    process.exit(1);
  }
};

// kick it off — this is where the magic happnes
startServer();
