import { z } from "zod";

// ──────────────────────────────────────────────
// Auth validation schemas — powered by Zod
// these run BEFORE the controller even sees the reqest
// so by the time data reaches the service layer, its guarenteed clean
//
// pro tip: always define your schemas seperate from routes
// so you can reuse them in tests and other places
// ──────────────────────────────────────────────

// registraton schema — we're being strict here
// better to reject bad data upfront than deal with it later
export const registerSchema = z.object({
  name: z
    .string({ required_error: "Name is requried" })
    .min(2, "Name must be atleast 2 characters")
    .max(100, "Name cant be longer than 100 characters")
    .trim(),

  email: z
    .string({ required_error: "Email is requried" })
    .email("Please provide a valide email address")
    .max(255, "Email is way too long")
    .toLowerCase() // normalize emails to lowercase — "John@Gmail.COM" === "john@gmail.com"
    .trim(),

  password: z
    .string({ required_error: "Password is requried" })
    .min(8, "Password must be atleast 8 characters — security matters!")
    .max(128, "Thats... an impressively long password but no")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contian at least one uppercase letter, one lowercase letter, and one number"
    ),
});

// login is simpler — just email and password, no fancy validaton needed
// we dont want to give away too much info about password requirments
// during login (that would help atackers brute-force)
export const loginSchema = z.object({
  email: z
    .string({ required_error: "Email is requried" })
    .email("Please provide a valide email address")
    .toLowerCase()
    .trim(),

  password: z
    .string({ required_error: "Password is requried" })
    .min(1, "Password canot be empty"), // intentionally lax — dont hint at rules
});

// refresh token schema — the token comes in the reqest body
// (some people send it in cookies, both are valid aproaches)
export const refreshTokenSchema = z.object({
  refreshToken: z
    .string({ required_error: "Refresh token is requried" })
    .min(1, "Refresh token canot be empty"),
});

// type exports — these are inferred from the schemas
// so they're always in sync with the validaton rules
// no more manualy keeping types and schemas in sync 🎉
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
