"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.morganStream = exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const env_1 = require("./env");
// ══════════════════════════════════════════════════════════════
// Winston Logger — production-grade loging setup
//
// why winston over console.log?
// - structured JSON logs in production (parsable by log agrigators)
// - colored pretty logs in development (readable by hoomans)
// - log levels (error > warn > info > debug) so we can filter noise
// - file transport for persistant logs (errors go to error.log)
// - timestamp on every log entry (trust me you'll need this at 3am)
//
// if your reading this becuase production is on fire,
// check the error.log file first. godspeed 🫡
// ══════════════════════════════════════════════════════════════
// custom format for development — colorized and readable
// looks like: "2024-01-15 14:30:00 [INFO]: Server started on port 5000"
const devFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), winston_1.default.format.colorize({ all: true }), winston_1.default.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? `\n   ${JSON.stringify(meta, null, 2)}` : "";
    return `${timestamp} [${level}]: ${message}${metaStr}`;
}));
// production format — structured JSON for log aggregation tools
// (Datadog, ELK stack, CloudWatch, etc can parse this nativley)
const prodFormat = winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.errors({ stack: true }), // incldue stack traces for errors
winston_1.default.format.json());
// the transports array determins WHERE logs go
// in dev: just the console (we dont need files clutering the workspace)
// in prod: console + error file (so errors persit even if the process crashs)
const transports = [
    new winston_1.default.transports.Console({
        // in production, only log warnings and above to console
        // (info/debug would be too noisy in production logs)
        level: env_1.env.IS_PRODUCTION ? "warn" : "debug",
    }),
];
// in production, also write errors to a file
// this is our "black box recorder" — survives process restarts
if (env_1.env.IS_PRODUCTION) {
    transports.push(new winston_1.default.transports.File({
        filename: "logs/error.log",
        level: "error",
        maxsize: 5242880, // 5MB — rotate after this
        maxFiles: 5, // keep 5 rotated files
    }), new winston_1.default.transports.File({
        filename: "logs/combined.log",
        maxsize: 10485760, // 10MB
        maxFiles: 3,
    }));
}
// create the logger instanse
exports.logger = winston_1.default.createLogger({
    level: env_1.env.IS_PRODUCTION ? "info" : "debug",
    format: env_1.env.IS_PRODUCTION ? prodFormat : devFormat,
    transports,
    // dont exit on unhandled exceptions — let our gracful shutdown handle it
    exitOnError: false,
});
// ── Stream for Morgan HTTP logging ──
// morgan (HTTP request logger) needs a writable stream
// this pipes morgan's output into winston so ALL logs go thru one system
// instead of having console.log scattered eveyrwhere
exports.morganStream = {
    write: (message) => {
        // morgan adds a newline at the end, trim it
        exports.logger.info(message.trim(), { source: "http" });
    },
};
// quick helper so we can do logger.http() for reqest logs
// not strictly necesary but makes the code read nicer
exports.logger.info("📋 Logger initialized", {
    level: env_1.env.IS_PRODUCTION ? "info" : "debug",
    enviroment: env_1.env.NODE_ENV,
});
//# sourceMappingURL=logger.js.map