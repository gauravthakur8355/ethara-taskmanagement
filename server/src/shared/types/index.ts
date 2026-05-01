import { Request } from "express";

// ──────────────────────────────────────────────────
// Shared types used accross the entire applicaiton
// putting them here so we dont have circular depandency issues
// (been there, done that, got the t-shirt)
// ──────────────────────────────────────────────────

// the roles a user can have — we mite add more later
// for now keeping it simple with three teirs
export enum UserRole {
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  MEMBER = "MEMBER",
}

// task status — preety standard kanban-style flow
// i debated adding a "BLOCKED" status but decided agianst it for v1
export enum TaskStatus {
  TODO = "TODO",
  IN_PROGRESS = "IN_PROGRESS",
  IN_REVIEW = "IN_REVIEW",
  DONE = "DONE",
}

// task prioriy levels — keeping it classic
export enum TaskPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT", // for when everyting is on fire 🔥
}

// exteneded request type that includes the autenticated user payload
// this gets attached by the auth midleware after JWT verificaton
export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

// whats actualy stored inside the JWT token
// keep this minimal — tokens travel with evey request
// so dont stuff unecessary data in here
export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
}

// standard pagination params — used by list endpoints
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
