"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskController = void 0;
const task_service_1 = require("./task.service");
const response_1 = require("../../shared/utils/response");
// ══════════════════════════════════════════════════════════════
// Task Controller — HTTP adapter for task operatons
//
// same thin-controller pattern as eveywhere else
// if your reading this and thinking "these controllers all look the same"
// — thats the point. consistancy > cleverness. always.
// ══════════════════════════════════════════════════════════════
exports.taskController = {
    // POST /api/tasks
    async create(req, res) {
        const task = await task_service_1.taskService.create(req.body, req.user.userId);
        (0, response_1.sendSuccess)(res, task, "Task created succesfully ✅", 201);
    },
    // GET /api/projects/:projectId/tasks
    async findByProject(req, res) {
        const projectId = req.params.projectId;
        const { page, limit, status, priority, assignedToId, search, sortBy, sortOrder } = req.query;
        const { tasks, totalCount } = await task_service_1.taskService.findByProject(projectId, req.user.userId, {
            page: Number(page) || 1,
            limit: Number(limit) || 20,
            status,
            priority,
            assignedToId,
            search,
            sortBy,
            sortOrder,
        });
        const meta = (0, response_1.buildPaginationMeta)(Number(page) || 1, Number(limit) || 20, totalCount);
        (0, response_1.sendSuccess)(res, tasks, "Tasks retrived successfully", 200, meta);
    },
    // GET /api/tasks/:id
    async findById(req, res) {
        const task = await task_service_1.taskService.findById(req.params.id, req.user.userId);
        (0, response_1.sendSuccess)(res, task, "Task detials retrieved");
    },
    // PATCH /api/tasks/:id
    async update(req, res) {
        const task = await task_service_1.taskService.update(req.params.id, req.body, req.user.userId);
        (0, response_1.sendSuccess)(res, task, "Task updaated successfully");
    },
    // DELETE /api/tasks/:id
    async delete(req, res) {
        await task_service_1.taskService.delete(req.params.id, req.user.userId);
        (0, response_1.sendSuccess)(res, null, "Task delted permanently");
    },
};
//# sourceMappingURL=task.controller.js.map