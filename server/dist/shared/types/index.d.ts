import { Request } from "express";
export declare enum UserRole {
    ADMIN = "ADMIN",
    MANAGER = "MANAGER",
    MEMBER = "MEMBER"
}
export declare enum TaskStatus {
    TODO = "TODO",
    IN_PROGRESS = "IN_PROGRESS",
    IN_REVIEW = "IN_REVIEW",
    DONE = "DONE"
}
export declare enum TaskPriority {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    URGENT = "URGENT"
}
export interface AuthenticatedRequest extends Request {
    user?: JWTPayload;
}
export interface JWTPayload {
    userId: string;
    email: string;
    role: UserRole;
}
export interface PaginationParams {
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}
//# sourceMappingURL=index.d.ts.map