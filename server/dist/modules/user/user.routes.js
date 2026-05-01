"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const error_middleware_1 = require("../../middleware/error.middleware");
const database_1 = require("../../config/database");
const response_1 = require("../../shared/utils/response");
// ══════════════════════════════════════════════════════════════
// User routes — search users for inviting to projects
// keeping this lightweight — just the search endpoint for now
// ══════════════════════════════════════════════════════════════
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
// GET /api/v1/users/search?email=xxx
// searches users by email (exact or partial match)
// returns basic user info — no passwords or sensitive data obviously
router.get("/search", (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { email } = req.query;
    if (!email || typeof email !== "string" || email.trim().length < 2) {
        (0, response_1.sendSuccess)(res, [], "Provide at least 2 characters to search");
        return;
    }
    const users = await database_1.prisma.user.findMany({
        where: {
            email: { contains: email.trim(), mode: "insensitive" },
            isActive: true,
        },
        select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
        },
        take: 10,
    });
    (0, response_1.sendSuccess)(res, users, `Found ${users.length} users`);
}));
exports.default = router;
//# sourceMappingURL=user.routes.js.map