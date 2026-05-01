"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardController = void 0;
const dashboard_service_1 = require("./dashboard.service");
const response_1 = require("../../shared/utils/response");
// dashboard controller — just one endpoint for now
// returns all the stats the frontend needs for the dashbaord page
exports.dashboardController = {
    async getStats(req, res) {
        const stats = await dashboard_service_1.dashboardService.getStats(req.user.userId);
        (0, response_1.sendSuccess)(res, stats, "Dashboard stats retreived");
    },
};
//# sourceMappingURL=dashboard.controller.js.map