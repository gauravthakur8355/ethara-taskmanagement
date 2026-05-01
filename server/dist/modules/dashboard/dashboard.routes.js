"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboard_controller_1 = require("./dashboard.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const error_middleware_1 = require("../../middleware/error.middleware");
// dashboard routes — just one GET endpoint
// returns aggregated stats for the current users workspace
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.get("/stats", (0, error_middleware_1.asyncHandler)(dashboard_controller_1.dashboardController.getStats));
exports.default = router;
//# sourceMappingURL=dashboard.routes.js.map