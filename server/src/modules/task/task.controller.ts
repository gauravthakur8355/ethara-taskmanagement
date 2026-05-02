import { Response } from "express";
import { taskService } from "./task.service";
import { sendSuccess, buildPaginationMeta } from "../../shared/utils/response";
import { AuthenticatedRequest } from "../../shared/types";

/** Task Controller — thin HTTP adapter over the service layer */
export const taskController = {
  async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    const task = await taskService.create(req.body, req.user!.userId);
    sendSuccess(res, task, "Task created successfully", 201);
  },

  async findByProject(req: AuthenticatedRequest, res: Response): Promise<void> {
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

    const meta = buildPaginationMeta(Number(page) || 1, Number(limit) || 20, totalCount);
    sendSuccess(res, tasks, "Tasks retrieved successfully", 200, meta);
  },

  async findById(req: AuthenticatedRequest, res: Response): Promise<void> {
    const task = await taskService.findById(req.params.id as string, req.user!.userId);
    sendSuccess(res, task, "Task details retrieved");
  },

  async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    const task = await taskService.update(
      req.params.id as string,
      req.body,
      req.user!.userId
    );
    sendSuccess(res, task, "Task updated successfully");
  },

  async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    await taskService.delete(req.params.id as string, req.user!.userId);
    sendSuccess(res, null, "Task deleted permanently");
  },
};
