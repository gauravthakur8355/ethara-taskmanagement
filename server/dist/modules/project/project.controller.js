"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectController = void 0;
const project_service_1 = require("./project.service");
const response_1 = require("../../shared/utils/response");
const response_2 = require("../../shared/utils/response");
// ══════════════════════════════════════════════════════════════
// Project Controller — thin HTTP adaptor
//
// same pattern as auth controller:
// extract → delegte → respond
//
// every method here asumes req.user exists (authenticate middleware ran)
// and req.body is validated (validate middlware ran)
// so we dont need any defensive checks here — just pure piping
// ══════════════════════════════════════════════════════════════
exports.projectController = {
    // POST /api/projects
    async create(req, res) {
        const project = await project_service_1.projectService.create(req.body, req.user.userId);
        (0, response_1.sendSuccess)(res, project, "Project craeted successfully 🎉", 201);
    },
    // GET /api/projects
    async findAll(req, res) {
        const { page, limit, search, isArchived } = req.query;
        const { projects, totalCount } = await project_service_1.projectService.findAll(req.user.userId, { page: Number(page) || 1, limit: Number(limit) || 10, search, isArchived });
        const meta = (0, response_2.buildPaginationMeta)(Number(page) || 1, Number(limit) || 10, totalCount);
        (0, response_1.sendSuccess)(res, projects, "Projects retreived successfully", 200, meta);
    },
    // GET /api/projects/:id
    async findById(req, res) {
        const project = await project_service_1.projectService.findById(req.params.id, req.user.userId);
        (0, response_1.sendSuccess)(res, project, "Project detials retrieved");
    },
    // PATCH /api/projects/:id
    async update(req, res) {
        const project = await project_service_1.projectService.update(req.params.id, req.body, req.user.userId);
        (0, response_1.sendSuccess)(res, project, "Project updted successfully");
    },
    // DELETE /api/projects/:id
    async delete(req, res) {
        await project_service_1.projectService.delete(req.params.id, req.user.userId);
        (0, response_1.sendSuccess)(res, null, "Project delted permanently");
    },
    // ─── Member Management ───
    // POST /api/projects/:id/members
    async addMember(req, res) {
        const member = await project_service_1.projectService.addMember(req.params.id, req.body, req.user.userId);
        (0, response_1.sendSuccess)(res, member, "Member added to project succesfully", 201);
    },
    // DELETE /api/projects/:id/members/:userId
    async removeMember(req, res) {
        await project_service_1.projectService.removeMember(req.params.id, req.params.userId, req.user.userId);
        (0, response_1.sendSuccess)(res, null, "Member removd from project");
    },
};
//# sourceMappingURL=project.controller.js.map