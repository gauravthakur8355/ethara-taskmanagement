import { PrismaClient } from "@prisma/client";
import { env } from "./env";

// singletone pattern for prisma client
// we definately dont want multiple connections floating around
// that would be a disaster for our conection pool (learnt this the hard way)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// only log queries in devlopment — in prod we dont want to spam the logs
// also the "warn" and "error" levels are always on becuase duh
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.IS_PRODUCTION
      ? ["warn", "error"]
      : ["query", "info", "warn", "error"],
    datasourceUrl: env.DATABASE_URL,
  });

// in dev, stash the client on globalThis so hot-reloding doesnt
// create a bajillion new connections and crash our databse
if (!env.IS_PRODUCTION) {
  globalForPrisma.prisma = prisma;
}

// gracful shutdown — close the prisma connection when the process exits
// without this we leak connections and neon gets angery
export const disconnectDB = async (): Promise<void> => {
  await prisma.$disconnect();
  console.log("🔌 Database disconneted gracefully");
};
