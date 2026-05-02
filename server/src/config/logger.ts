import winston from "winston";
import { env } from "./env";

// Development format — colorized, human-readable
const devFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? `\n   ${JSON.stringify(meta, null, 2)}` : "";
    return `${timestamp} [${level}]: ${message}${metaStr}`;
  })
);

// Production format — structured JSON for log aggregation (Datadog, ELK, etc.)
const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const transports: winston.transport[] = [
  new winston.transports.Console({
    level: env.IS_PRODUCTION ? "warn" : "debug",
  }),
];

if (env.IS_PRODUCTION) {
  transports.push(
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
      maxsize: 5242880,   // 5MB rotation
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: "logs/combined.log",
      maxsize: 10485760,  // 10MB
      maxFiles: 3,
    })
  );
}

export const logger = winston.createLogger({
  level: env.IS_PRODUCTION ? "info" : "debug",
  format: env.IS_PRODUCTION ? prodFormat : devFormat,
  transports,
  exitOnError: false,
});

// Morgan integration — pipes HTTP logs through Winston
export const morganStream = {
  write: (message: string) => {
    logger.info(message.trim(), { source: "http" });
  },
};

logger.info("Logger initialized", {
  level: env.IS_PRODUCTION ? "info" : "debug",
  environment: env.NODE_ENV,
});
