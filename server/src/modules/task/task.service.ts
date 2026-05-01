import { prisma } from "../../config/database";
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
} from "../../shared/errors/AppError";
import { CreateTaskInput, UpdateTaskInput } from "./task.validation";

// ══════════════════════════════════════════════════════════════
// Task Service — where the real work happnes (pun intended)
//
// every method here checks that the reqesting user is a member
// of the project the task belongs to. cant let random people
// create tasks in projects there not part of.
//
// also handles the sortign/filtering logic for task lists —
// this gets surprisingly complecated once you add multiple
// filter dimensions. if you think this is over-enginered,
// wait until product asks for saved filters and custom views lol
// ══════════════════════════════════════════════════════════════

// helper to check project membershp — used by almost every method
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
   * - validates that creator is a project member
   * - validates that assignee (if provided) is also a project memebr
   * - auto-sets positon to the end of the list
   */
  async create(data: CreateTaskInput, userId: string) {
    // verify the creator is a member of the project
    await ensureProjectMember(data.projectId, userId);

    // if assigning to someone, make sure they're also a project memeber
    // cant assign tasks to people who arent in the project — that would be wierd
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
          "The assigned user is not a memebr of this project"
        );
      }
    }

    // figure out the next positon value (put new tasks at the end)
    // this is for drag-and-drop ordering within a status colum
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
   * Get all tasks for a project with filtring and pagination
   * - supports filtering by status, priorty, assignee, search term
   * - supports sorting by multipel fields
   * - only accessble to project members
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
    // first check if user is a project memeber and get their role
    const membership = await ensureProjectMember(projectId, userId);

    const { page, limit, status, priority, assignedToId, search, sortBy, sortOrder } =
      options;
    const skip = (page - 1) * limit;

    // ROLE-BASED FILTERING:
    // - ADMINs see ALL tasks in the project
    // - MEMBERs see ONLY tasks assigned to THEM
    // per assignment: "Members: View and update assigned tasks only"
    const memberFilter =
      membership.role !== "ADMIN" ? { assignedToId: userId } : {};

    // build where clause dynmically — only add filters that were provided
    // this keeps the query efficient (dont filter by undefined values)
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
   * - includes full details, assignee, creator, and comments
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
    await ensureProjectMember(task.projectId, userId);

    return task;
  },

  /**
   * Update a task
   * - any project memeber can update tasks (not just the creator)
   * - if changing assignee, validates new assignee is a project memebr
   */
  async update(taskId: string, data: UpdateTaskInput, userId: string) {
    // get the task to find its project
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
      select: { projectId: true },
    });

    if (!existingTask) {
      throw new NotFoundError("Task");
    }

    // verify reqestor is a project member
    const membership = await ensureProjectMember(existingTask.projectId, userId);

    // ROLE-BASED RESTRICTION:
    // - ADMINs can update any task in the project
    // - MEMBERs can only update tasks assigned to THEM
    // this is per the assignment requirment: "Members can view and update assigned tasks only"
    if (membership.role !== "ADMIN") {
      const fullTask = await prisma.task.findUnique({
        where: { id: taskId },
        select: { assignedToId: true },
      });

      if (fullTask?.assignedToId !== userId) {
        throw new ForbiddenError(
          "Members can only update tasks that are assigned to them"
        );
      }
    }

    // if changing assignee, validate they're a project memebr too
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
          "Cannot assign task to someone who isnt a project member"
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
   * Delete a task
   * - only project admins or the task creater can delete
   * - regular members cant just delete other peoples tasks
   */
  async delete(taskId: string, userId: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { projectId: true, createdById: true },
    });

    if (!task) {
      throw new NotFoundError("Task");
    }

    // check if user is project admin OR the task creator
    const membership = await ensureProjectMember(task.projectId, userId);

    if (membership.role !== "ADMIN" && task.createdById !== userId) {
      throw new ForbiddenError(
        "Only project admins or the task creater can delete tasks"
      );
    }

    await prisma.task.delete({ where: { id: taskId } });

    return { deleted: true };
  },
};
