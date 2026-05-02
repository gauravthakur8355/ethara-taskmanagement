import { prisma } from "../../config/database";
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
} from "../../shared/errors/AppError";
import { CreateTaskInput, UpdateTaskInput } from "./task.validation";
import {
  validateTaskTransition,
  type TaskStatus,
  type ProjectRole,
} from "../../shared/utils/taskStateMachine";

/**
 * Task Service — handles all task CRUD operations with strict RBAC.
 *
 * Rules:
 * - Only ADMINs can create, assign, reassign, and delete tasks
 * - MEMBERs can only view and update tasks assigned to them
 * - Status transitions enforced via state machine (see taskStateMachine.ts)
 */

const ensureProjectMember = async (projectId: string, userId: string) => {
  const membership = await prisma.projectMember.findUnique({
    where: {
      userId_projectId: { userId, projectId },
    },
  });

  if (!membership) {
    throw new ForbiddenError(
      "You must be a member of this project to manage its tasks"
    );
  }

  return membership;
};

export const taskService = {
  /** Create a new task — ADMIN only */
  async create(data: CreateTaskInput, userId: string) {
    const membership = await ensureProjectMember(data.projectId, userId);

    if (membership.role !== "ADMIN") {
      throw new ForbiddenError(
        "Only project admins can create tasks. Members can only view and update their assigned tasks."
      );
    }

    if (data.assignedToId) {
      const assigneeMembership = await prisma.projectMember.findUnique({
        where: {
          userId_projectId: {
            userId: data.assignedToId,
            projectId: data.projectId,
          },
        },
      });

      if (!assigneeMembership) {
        throw new BadRequestError(
          "The assigned user is not a member of this project"
        );
      }
    }

    // Auto-position: place new tasks at the end of their status column
    const lastTask = await prisma.task.findFirst({
      where: { projectId: data.projectId, status: data.status as any },
      orderBy: { position: "desc" },
      select: { position: true },
    });

    const nextPosition = (lastTask?.position ?? -1) + 1;

    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        status: data.status as any,
        priority: data.priority as any,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        position: nextPosition,
        projectId: data.projectId,
        assignedToId: data.assignedToId,
        createdById: userId,
      },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        _count: { select: { comments: true } },
      },
    });

    return task;
  },

  /** Get tasks by project — ADMINs see all, MEMBERs see only assigned */
  async findByProject(
    projectId: string,
    userId: string,
    options: {
      page: number;
      limit: number;
      status?: string;
      priority?: string;
      assignedToId?: string;
      search?: string;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
    }
  ) {
    const membership = await ensureProjectMember(projectId, userId);

    const { page, limit, status, priority, assignedToId, search, sortBy, sortOrder } =
      options;
    const skip = (page - 1) * limit;

    // Members can only see their own tasks
    const memberFilter =
      membership.role !== "ADMIN" ? { assignedToId: userId } : {};

    const where: any = {
      projectId,
      ...memberFilter,
      ...(status && { status }),
      ...(priority && { priority }),
      ...(assignedToId && { assignedToId }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [tasks, totalCount] = await Promise.all([
      prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy || "position"]: sortOrder || "asc" },
        include: {
          assignedTo: {
            select: { id: true, name: true, email: true, avatar: true },
          },
          createdBy: {
            select: { id: true, name: true },
          },
          _count: { select: { comments: true } },
        },
      }),
      prisma.task.count({ where }),
    ]);

    return { tasks, totalCount };
  },

  /** Get a single task by ID */
  async findById(taskId: string, userId: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          select: { id: true, name: true, slug: true },
        },
        assignedTo: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        comments: {
          include: {
            author: {
              select: { id: true, name: true, avatar: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        _count: { select: { comments: true } },
      },
    });

    if (!task) {
      throw new NotFoundError("Task");
    }

    const membership = await ensureProjectMember(task.projectId, userId);

    // Members can only view their own assigned tasks
    if (membership.role !== "ADMIN" && task.assignedToId !== userId) {
      throw new ForbiddenError(
        "Members can only view tasks that are assigned to them"
      );
    }

    return task;
  },

  /**
   * Update a task with strict RBAC checks:
   * - Members can only update their own tasks and only change status
   * - Status transitions validated against the state machine
   * - Only admins can reassign or change priority
   */
  async update(taskId: string, data: UpdateTaskInput, userId: string) {
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        projectId: true,
        status: true,
        assignedToId: true,
      },
    });

    if (!existingTask) {
      throw new NotFoundError("Task");
    }

    const membership = await ensureProjectMember(existingTask.projectId, userId);
    const role = membership.role as ProjectRole;

    // Member restrictions
    if (role !== "ADMIN") {
      if (existingTask.assignedToId !== userId) {
        throw new ForbiddenError(
          "Members can only update tasks that are assigned to them"
        );
      }

      if (data.assignedToId !== undefined) {
        throw new ForbiddenError("Only admins can assign or reassign tasks");
      }

      if (data.priority !== undefined) {
        throw new ForbiddenError("Only admins can change task priority");
      }
    }

    // Validate status transition against the state machine
    if (data.status) {
      validateTaskTransition(
        existingTask.status as TaskStatus,
        data.status as TaskStatus,
        role
      );
    }

    // Validate new assignee is a project member
    if (data.assignedToId) {
      const assigneeMembership = await prisma.projectMember.findUnique({
        where: {
          userId_projectId: {
            userId: data.assignedToId,
            projectId: existingTask.projectId,
          },
        },
      });

      if (!assigneeMembership) {
        throw new BadRequestError(
          "Cannot assign task to someone who isn't a project member"
        );
      }
    }

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...data,
        status: data.status as any,
        priority: data.priority as any,
        dueDate: data.dueDate ? new Date(data.dueDate) : data.dueDate,
      },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        createdBy: {
          select: { id: true, name: true },
        },
        _count: { select: { comments: true } },
      },
    });

    return updated;
  },

  /** Delete a task — ADMIN only */
  async delete(taskId: string, userId: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { projectId: true, createdById: true },
    });

    if (!task) {
      throw new NotFoundError("Task");
    }

    const membership = await ensureProjectMember(task.projectId, userId);

    if (membership.role !== "ADMIN") {
      throw new ForbiddenError("Only project admins can delete tasks");
    }

    await prisma.task.delete({ where: { id: taskId } });

    return { deleted: true };
  },
};
