import { Response, NextFunction } from "express";
import { AuthenticatedRequest, UserRole } from "../shared/types";
export declare const authorize: (...allowedRoles: UserRole[]) => (req: AuthenticatedRequest, _res: Response, next: NextFunction) => void;
export declare const adminOnly: (req: AuthenticatedRequest, _res: Response, next: NextFunction) => void;
export declare const managerOrAbove: (req: AuthenticatedRequest, _res: Response, next: NextFunction) => void;
export declare const anyRole: (req: AuthenticatedRequest, _res: Response, next: NextFunction) => void;
//# sourceMappingURL=rbac.middleware.d.ts.map