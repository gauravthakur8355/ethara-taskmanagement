"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskService = void 0;
const database_1 = require("../../config/database");
const AppError_1 = require("../../shared/errors/AppError");
const taskStateMachine_1 = require("../../shared/utils/taskStateMachine");
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
const ensureProjectMember = async (projectId, userId) => {
    const membership = await database_1.prisma.projectMember.findUnique({
        where: {
            userId_projectId: { userId, projectId },
        },
    });
    if (!membership) {
        throw new AppError_1.ForbiddenError("You must be a member of this project to manage its tasks");
    }
    return membership;
};
exports.taskService = {
    /**
     * Create a new task within a project
     * ADMIN ONLY — members cannot create tasks
     */
    async create(data, userId) {
        // verify the creator is a project ADMIN
        const membership = await ensureProjectMember(data.projectId, userId);
        if (membership.role !== "ADMIN") {
            throw new AppError_1.ForbiddenError("Only project admins can create tasks. Members can only view and update their assigned tasks.");
        }
        // if assigning to someone, make sure they're also a project member
        if (data.assignedToId) {
            const assigneeMembership = await database_1.prisma.projectMember.findUnique({
                where: {
                    userId_projectId: {
                        userId: data.assignedToId,
                        projectId: data.projectId,
                    },
                },
            });
            if (!assigneeMembership) {
                throw new AppError_1.BadRequestError("The assigned user is not a member of this project");
            }
        }
        // figure out the next position value (put new tasks at the end)
        const lastTask = await database_1.prisma.task.findFirst({
            where: { projectId: data.projectId, status: data.status },
            orderBy: { position: "desc" },
            select: { position: true },
        });
        const nextPosition = (lastTask?.position ?? -1) + 1;
        const task = await database_1.prisma.task.create({
            data: {
                title: data.title,
                description: data.description,
                status: data.status,
                priority: data.priority,
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
    async findByProject(projectId, userId, options) {
        const membership = await ensureProjectMember(projectId, userId);
        const { page, limit, status, priority, assignedToId, search, sortBy, sortOrder } = options;
        const skip = (page - 1) * limit;
        // ROLE-BASED FILTERING:
        // ADMINs see all tasks, MEMBERs see only their assigned tasks
        const memberFilter = membership.role !== "ADMIN" ? { assignedToId: userId } : {};
        const where = {
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
            database_1.prisma.task.findMany({
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
            database_1.prisma.task.count({ where }),
        ]);
        return { tasks, totalCount };
    },
    /**
     * Get a single task by ID
     */
    async findById(taskId, userId) {
        const task = await database_1.prisma.task.findUnique({
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
            throw new AppError_1.NotFoundError("Task");
        }
        // make sure the user is a member of the task's project
        const membership = await ensureProjectMember(task.projectId, userId);
        // MEMBER can only view tasks assigned to them
        if (membership.role !== "ADMIN" && task.assignedToId !== userId) {
            throw new AppError_1.ForbiddenError("Members can only view tasks that are assigned to them");
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
    async update(taskId, data, userId) {
        // get the full task to check current state
        const existingTask = await database_1.prisma.task.findUnique({
            where: { id: taskId },
            select: {
                projectId: true,
                status: true,
                assignedToId: true,
            },
        });
        if (!existingTask) {
            throw new AppError_1.NotFoundError("Task");
        }
        // verify requestor is a project member
        const membership = await ensureProjectMember(existingTask.projectId, userId);
        const role = membership.role;
        // ─── MEMBER RESTRICTIONS ───
        if (role !== "ADMIN") {
            // members can only update their own assigned tasks
            if (existingTask.assignedToId !== userId) {
                throw new AppError_1.ForbiddenError("Members can only update tasks that are assigned to them");
            }
            // members cannot reassign tasks
            if (data.assignedToId !== undefined) {
                throw new AppError_1.ForbiddenError("Only admins can assign or reassign tasks");
            }
            // members cannot change priority
            if (data.priority !== undefined) {
                throw new AppError_1.ForbiddenError("Only admins can change task priority");
            }
        }
        // ─── STATUS TRANSITION VALIDATION ───
        if (data.status) {
            (0, taskStateMachine_1.validateTaskTransition)(existingTask.status, data.status, role);
        }
        // ─── ASSIGNEE VALIDATION (admin-only, validated above) ───
        if (data.assignedToId) {
            const assigneeMembership = await database_1.prisma.projectMember.findUnique({
                where: {
                    userId_projectId: {
                        userId: data.assignedToId,
                        projectId: existingTask.projectId,
                    },
                },
            });
            if (!assigneeMembership) {
                throw new AppError_1.BadRequestError("Cannot assign task to someone who isn't a project member");
            }
        }
        const updated = await database_1.prisma.task.update({
            where: { id: taskId },
            data: {
                ...data,
                status: data.status,
                priority: data.priority,
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
    async delete(taskId, userId) {
        const task = await database_1.prisma.task.findUnique({
            where: { id: taskId },
            select: { projectId: true, createdById: true },
        });
        if (!task) {
            throw new AppError_1.NotFoundError("Task");
        }
        const membership = await ensureProjectMember(task.projectId, userId);
        if (membership.role !== "ADMIN") {
            throw new AppError_1.ForbiddenError("Only project admins can delete tasks");
        }
        await database_1.prisma.task.delete({ where: { id: taskId } });
        return { deleted: true };
    },
};
//# sourceMappingURL=task.service.js.map