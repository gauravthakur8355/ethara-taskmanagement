"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectDB = exports.prisma = void 0;
const client_1 = require("@prisma/client");
const env_1 = require("./env");
// singletone pattern for prisma client
// we definately dont want multiple connections floating around
// that would be a disaster for our conection pool (learnt this the hard way)
const globalForPrisma = globalThis;
// only log queries in devlopment — in prod we dont want to spam the logs
// also the "warn" and "error" levels are always on becuase duh
exports.prisma = globalForPrisma.prisma ??
    new client_1.PrismaClient({
        log: env_1.env.IS_PRODUCTION
            ? ["warn", "error"]
            : ["query", "info", "warn", "error"],
        datasourceUrl: env_1.env.DATABASE_URL,
    });
// in dev, stash the client on globalThis so hot-reloding doesnt
// create a bajillion new connections and crash our databse
if (!env_1.env.IS_PRODUCTION) {
    globalForPrisma.prisma = exports.prisma;
}
// gracful shutdown — close the prisma connection when the process exits
// without this we leak connections and neon gets angery
const disconnectDB = async () => {
    await exports.prisma.$disconnect();
    console.log("🔌 Database disconneted gracefully");
};
exports.disconnectDB = disconnectDB;
//# sourceMappingURL=database.js.map