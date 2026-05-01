"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.anyRole = exports.managerOrAbove = exports.adminOnly = exports.authorize = void 0;
const types_1 = require("../shared/types");
const AppError_1 = require("../shared/errors/AppError");
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
const authorize = (...allowedRoles) => {
    return (req, _res, next) => {
        // sanity check — if req.user isnt set, the auth middleware didnt run
        // this would be a programer error (forgot to add authenticate before authorize)
        if (!req.user) {
            next(new AppError_1.UnauthorizedError("Authentication requried before authorizaiton check"));
            return;
        }
        // check if the users role is in the allowd list
        if (!allowedRoles.includes(req.user.role)) {
            next(new AppError_1.ForbiddenError(`Role '${req.user.role}' does not have permision to preform this action. ` +
                `Required roles: ${allowedRoles.join(", ")}`));
            return;
        }
        // user has the right role — let them thru
        next();
    };
};
exports.authorize = authorize;
// convenicence shortcuts for common role combinations
// saves typing and makes route defintions more readble
// only admins can do this (dangerious stuff like deleting teams)
exports.adminOnly = (0, exports.authorize)(types_1.UserRole.ADMIN);
// admins and managers (team managment, assigning tasks etc)
exports.managerOrAbove = (0, exports.authorize)(types_1.UserRole.ADMIN, types_1.UserRole.MANAGER);
// any authenticaed user (viewing tasks, updating own profile etc)
exports.anyRole = (0, exports.authorize)(types_1.UserRole.ADMIN, types_1.UserRole.MANAGER, types_1.UserRole.MEMBER);
//# sourceMappingURL=rbac.middleware.js.map