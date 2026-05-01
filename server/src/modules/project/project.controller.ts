import { Response } from "express";
import { projectService } from "./project.service";
import { sendSuccess } from "../../shared/utils/response";
import { buildPaginationMeta } from "../../shared/utils/response";
import { AuthenticatedRequest } from "../../shared/types";

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

export const projectController = {
  // POST /api/projects
  async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    const project = await projectService.create(req.body, req.user!.userId);

    sendSuccess(res, project, "Project craeted successfully 🎉", 201);
  },

  // GET /api/projects
  async findAll(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { page, limit, search, isArchived } = req.query as any;

    const { projects, totalCount } = await projectService.findAll(
      req.user!.userId,
      { page: Number(page) || 1, limit: Number(limit) || 10, search, isArchived }
    );

    const meta = buildPaginationMeta(
      Number(page) || 1,
      Number(limit) || 10,
      totalCount
    );

    sendSuccess(res, projects, "Projects retreived successfully", 200, meta);
  },

  // GET /api/projects/:id
  async findById(req: AuthenticatedRequest, res: Response): Promise<void> {
    const project = await projectService.findById(
      req.params.id as string,
      req.user!.userId
    );

    sendSuccess(res, project, "Project detials retrieved");
  },

  // PATCH /api/projects/:id
  async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    const project = await projectService.update(
      req.params.id as string,
      req.body,
      req.user!.userId
    );

    sendSuccess(res, project, "Project updted successfully");
  },

  // DELETE /api/projects/:id
  async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    await projectService.delete(req.params.id as string, req.user!.userId);

    sendSuccess(res, null, "Project delted permanently");
  },

  // ─── Member Management ───

  // POST /api/projects/:id/members
  async addMember(req: AuthenticatedRequest, res: Response): Promise<void> {
    const member = await projectService.addMember(
      req.params.id as string,
      req.body,
      req.user!.userId
    );

    sendSuccess(res, member, "Member added to project succesfully", 201);
  },

  // DELETE /api/projects/:id/members/:userId
  async removeMember(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    await projectService.removeMember(
      req.params.id as string,
      req.params.userId as string,
      req.user!.userId
    );

    sendSuccess(res, null, "Member removd from project");
  },
};
