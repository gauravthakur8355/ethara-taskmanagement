import dotenv from "dotenv";
import path from "path";

// loding the .env file befroe anything else runs
// this is critcal — if we dont do this first, all our secrets will be undefined lol
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// lil helper to yell at us if we forgot to set somthing important
const getEnvVar = (key: string, fallback?: string): string => {
  const value = process.env[key] ?? fallback;
  if (!value) {
    // yeah this will crash the app on startup — thats the point
    // better to fail loud than silnetly run with missing config
    throw new Error(`❌ Missing environment variable: ${key}`);
  }
  return value;
};

// froze this so nobody can accidently mutate the config at runtime
// had that happen once in production... never agian
export const env = Object.freeze({
  // genral server stuff
  NODE_ENV: getEnvVar("NODE_ENV", "development"),
  PORT: parseInt(getEnvVar("PORT", "5000"), 10),
  IS_PRODUCTION: getEnvVar("NODE_ENV", "development") === "production",

  // databse — using Neon PostgreSQL (serverles is the future btw)
  DATABASE_URL: getEnvVar("DATABASE_URL"),

  // JWT config — dont forget to rotate these periodicaly
  JWT_ACCESS_SECRET: getEnvVar("JWT_ACCESS_SECRET"),
  JWT_REFRESH_SECRET: getEnvVar("JWT_REFRESH_SECRET"),
  JWT_ACCESS_EXPIRY: getEnvVar("JWT_ACCESS_EXPIRY", "15m"),
  JWT_REFRESH_EXPIRY: getEnvVar("JWT_REFRESH_EXPIRY", "7d"),

  // cors — make sure frontend url matchs exactly or youll get weird errors
  CLIENT_URL: getEnvVar("CLIENT_URL", "http://localhost:5173"),
});

// quick sanity check — log what enviroment were running in
// (dont log secrets obviously, im not that dumb)
console.log(`🌍 Environment: ${env.NODE_ENV}`);
console.log(`🚀 Port: ${env.PORT}`);
