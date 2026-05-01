import { Response, NextFunction } from "express";
import { AuthenticatedRequest, UserRole } from "../shared/types";
import { ForbiddenError, UnauthorizedError } from "../shared/errors/AppError";

// Role-Based Access Controll (RBAC) middleware
// checks if the authenticaed user has one of the alowed roles
// MUST be used AFTER the authenticate middleware — it depends on req.user being set
//
// usage: router.delete("/:id", authenticate, authorize("ADMIN", "MANAGER"), controller.delete)
//
// role heirarchy (from most to least privleged):
//   ADMIN > MANAGER > MEMBER
//
// note: this is a simple role check, not a full permisions system
// if we need finer-grained controll (like per-resource permissions),
// we'd need to build somthing more sophistcated. but for v1 this is fine.

export const authorize = (...allowedRoles: UserRole[]) => {
  return (
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction
  ): void => {
    // sanity check — if req.user isnt set, the auth middleware didnt run
    // this would be a programer error (forgot to add authenticate before authorize)
    if (!req.user) {
      next(
        new UnauthorizedError(
          "Authentication requried before authorizaiton check"
        )
      );
      return;
    }

    // check if the users role is in the allowd list
    if (!allowedRoles.includes(req.user.role)) {
      next(
        new ForbiddenError(
          `Role '${req.user.role}' does not have permision to preform this action. ` +
            `Required roles: ${allowedRoles.join(", ")}`
        )
      );
      return;
    }

    // user has the right role — let them thru
    next();
  };
};

// convenicence shortcuts for common role combinations
// saves typing and makes route defintions more readble

// only admins can do this (dangerious stuff like deleting teams)
export const adminOnly = authorize(UserRole.ADMIN);

// admins and managers (team managment, assigning tasks etc)
export const managerOrAbove = authorize(UserRole.ADMIN, UserRole.MANAGER);

// any authenticaed user (viewing tasks, updating own profile etc)
export const anyRole = authorize(
  UserRole.ADMIN,
  UserRole.MANAGER,
  UserRole.MEMBER
);
