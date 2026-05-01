import { Response } from "express";
import { taskService } from "./task.service";
import { sendSuccess, buildPaginationMeta } from "../../shared/utils/response";
import { AuthenticatedRequest } from "../../shared/types";

// ══════════════════════════════════════════════════════════════
// Task Controller — HTTP adapter for task operatons
//
// same thin-controller pattern as eveywhere else
// if your reading this and thinking "these controllers all look the same"
// — thats the point. consistancy > cleverness. always.
// ══════════════════════════════════════════════════════════════

export const taskController = {
  // POST /api/tasks
  async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    const task = await taskService.create(req.body, req.user!.userId);

    sendSuccess(res, task, "Task created succesfully ✅", 201);
  },

  // GET /api/projects/:projectId/tasks
  async findByProject(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    const projectId = req.params.projectId as string;
    const { page, limit, status, priority, assignedToId, search, sortBy, sortOrder } =
      req.query as any;

    const { tasks, totalCount } = await taskService.findByProject(
      projectId,
      req.user!.userId,
      {
        page: Number(page) || 1,
        limit: Number(limit) || 20,
        status,
        priority,
        assignedToId,
        search,
        sortBy,
        sortOrder,
      }
    );

    const meta = buildPaginationMeta(
      Number(page) || 1,
      Number(limit) || 20,
      totalCount
    );

    sendSuccess(res, tasks, "Tasks retrived successfully", 200, meta);
  },

  // GET /api/tasks/:id
  async findById(req: AuthenticatedRequest, res: Response): Promise<void> {
    const task = await taskService.findById(req.params.id as string, req.user!.userId);

    sendSuccess(res, task, "Task detials retrieved");
  },

  // PATCH /api/tasks/:id
  async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    const task = await taskService.update(
      req.params.id as string,
      req.body,
      req.user!.userId
    );

    sendSuccess(res, task, "Task updaated successfully");
  },

  // DELETE /api/tasks/:id
  async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    await taskService.delete(req.params.id as string, req.user!.userId);

    sendSuccess(res, null, "Task delted permanently");
  },
};
