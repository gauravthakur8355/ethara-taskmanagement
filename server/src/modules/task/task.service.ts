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

// ══════════════════════════════════════════════════════════════
// Task Service — Strict RBAC Implementation
//
// KEY RULES:
// 1. Only ADMINs can create tasks
// 2. Only ADMINs can assign/reassign tasks
// 3. MEMBERs see ONLY tasks assigned to them
// 4. MEMBERs can update ONLY their assigned tasks
// 5. Status transitions follow strict state machine:
//    - MEMBER: TODO → IN_PROGRESS → IN_REVIEW
//    - ADMIN:  + IN_REVIEW → DONE, IN_REVIEW → IN_PROGRESS (reject)
// 6. No one can skip states (no TODO → DONE)
// ══════════════════════════════════════════════════════════════

// helper to check project membership and return role
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
  /**
   * Create a new task within a project
   * ADMIN ONLY — members cannot create tasks
   */
  async create(data: CreateTaskInput, userId: string) {
    // verify the creator is a project ADMIN
    const membership = await ensureProjectMember(data.projectId, userId);

    if (membership.role !== "ADMIN") {
      throw new ForbiddenError(
        "Only project admins can create tasks. Members can only view and update their assigned tasks."
      );
    }

    // if assigning to someone, make sure they're also a project member
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

    // figure out the next position value (put new tasks at the end)
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

  /**
   * Get all tasks for a project
   * - ADMINs see ALL tasks
   * - MEMBERs see ONLY tasks assigned to them
   */
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

    // ROLE-BASED FILTERING:
    // ADMINs see all tasks, MEMBERs see only their assigned tasks
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

  /**
   * Get a single task by ID
   */
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

    // make sure the user is a member of the task's project
    const membership = await ensureProjectMember(task.projectId, userId);

    // MEMBER can only view tasks assigned to them
    if (membership.role !== "ADMIN" && task.assignedToId !== userId) {
      throw new ForbiddenError(
        "Members can only view tasks that are assigned to them"
      );
    }

    return task;
  },

  /**
   * Update a task — the core of the RBAC logic lives here
   *
   * PERMISSION RULES:
   * - ADMINs can update any task in the project
   * - MEMBERs can only update tasks assigned to THEM
   *
   * STATUS TRANSITION RULES (via state machine):
   * - MEMBER: TODO → IN_PROGRESS, IN_PROGRESS → IN_REVIEW
   * - ADMIN:  all above + IN_REVIEW → DONE, IN_REVIEW → IN_PROGRESS
   * - No state skipping (TODO → DONE is ALWAYS invalid)
   *
   * ASSIGNMENT RULES:
   * - Only ADMINs can change assignedToId
   */
  async update(taskId: string, data: UpdateTaskInput, userId: string) {
    // get the full task to check current state
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

    // verify requestor is a project member
    const membership = await ensureProjectMember(existingTask.projectId, userId);
    const role = membership.role as ProjectRole;

    // ─── MEMBER RESTRICTIONS ───
    if (role !== "ADMIN") {
      // members can only update their own assigned tasks
      if (existingTask.assignedToId !== userId) {
        throw new ForbiddenError(
          "Members can only update tasks that are assigned to them"
        );
      }

      // members cannot reassign tasks
      if (data.assignedToId !== undefined) {
        throw new ForbiddenError(
          "Only admins can assign or reassign tasks"
        );
      }

      // members cannot change priority
      if (data.priority !== undefined) {
        throw new ForbiddenError(
          "Only admins can change task priority"
        );
      }
    }

    // ─── STATUS TRANSITION VALIDATION ───
    if (data.status) {
      validateTaskTransition(
        existingTask.status as TaskStatus,
        data.status as TaskStatus,
        role
      );
    }

    // ─── ASSIGNEE VALIDATION (admin-only, validated above) ───
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

  /**
   * Delete a task — ADMIN ONLY
   */
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
      throw new ForbiddenError(
        "Only project admins can delete tasks"
      );
    }

    await prisma.task.delete({ where: { id: taskId } });

    return { deleted: true };
  },
};
