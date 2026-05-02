import dotenv from "dotenv";
import path from "path";

// only load .env file in development — production uses Railway env vars
if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: path.resolve(__dirname, "../../.env") });
}

const getEnvVar = (key: string, fallback?: string): string => {
  const value = process.env[key] ?? fallback;
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
};

export const env = Object.freeze({
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "3000", 10),
  IS_PRODUCTION: process.env.NODE_ENV === "production",

  DATABASE_URL: getEnvVar("DATABASE_URL"),

  JWT_ACCESS_SECRET: getEnvVar("JWT_ACCESS_SECRET"),
  JWT_REFRESH_SECRET: getEnvVar("JWT_REFRESH_SECRET"),
  JWT_ACCESS_EXPIRY: getEnvVar("JWT_ACCESS_EXPIRY", "15m"),
  JWT_REFRESH_EXPIRY: getEnvVar("JWT_REFRESH_EXPIRY", "7d"),

  CLIENT_URL: getEnvVar("CLIENT_URL", "http://localhost:5173"),
});