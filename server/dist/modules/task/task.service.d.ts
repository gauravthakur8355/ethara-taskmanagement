import { CreateTaskInput, UpdateTaskInput } from "./task.validation";
export declare const taskService: {
    /**
     * Create a new task within a project
     * ADMIN ONLY — members cannot create tasks
     */
    create(data: CreateTaskInput, userId: string): Promise<{
        createdBy: {
            name: string;
            id: string;
            email: string;
        };
        _count: {
            comments: number;
        };
        assignedTo: {
            name: string;
            id: string;
            email: string;
            avatar: string | null;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        createdById: string;
        projectId: string;
        title: string;
        status: import(".prisma/client").$Enums.TaskStatus;
        priority: import(".prisma/client").$Enums.Priority;
        dueDate: Date | null;
        position: number;
        assignedToId: string | null;
    }>;
    /**
     * Get all tasks for a project
     * - ADMINs see ALL tasks
     * - MEMBERs see ONLY tasks assigned to them
     */
    findByProject(projectId: string, userId: string, options: {
        page: number;
        limit: number;
        status?: string;
        priority?: string;
        assignedToId?: string;
        search?: string;
        sortBy?: string;
        sortOrder?: "asc" | "desc";
    }): Promise<{
        tasks: ({
            createdBy: {
                name: string;
                id: string;
            };
            _count: {
                comments: number;
            };
            assignedTo: {
                name: string;
                id: string;
                email: string;
                avatar: string | null;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            createdById: string;
            projectId: string;
            title: string;
            status: import(".prisma/client").$Enums.TaskStatus;
            priority: import(".prisma/client").$Enums.Priority;
            dueDate: Date | null;
            position: number;
            assignedToId: string | null;
        })[];
        totalCount: number;
    }>;
    /**
     * Get a single task by ID
     */
    findById(taskId: string, userId: string): Promise<{
        project: {
            name: string;
            id: string;
            slug: string;
        };
        createdBy: {
            name: string;
            id: string;
            email: string;
        };
        _count: {
            comments: number;
        };
        comments: ({
            author: {
                name: string;
                id: string;
                avatar: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            content: string;
            taskId: string;
            authorId: string;
        })[];
        assignedTo: {
            name: string;
            id: string;
            email: string;
            avatar: string | null;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        createdById: string;
        projectId: string;
        title: string;
        status: import(".prisma/client").$Enums.TaskStatus;
        priority: import(".prisma/client").$Enums.Priority;
        dueDate: Date | null;
        position: number;
        assignedToId: string | null;
    }>;
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
    update(taskId: string, data: UpdateTaskInput, userId: string): Promise<{
        createdBy: {
            name: string;
            id: string;
        };
        _count: {
            comments: number;
        };
        assignedTo: {
            name: string;
            id: string;
            email: string;
            avatar: string | null;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        createdById: string;
        projectId: string;
        title: string;
        status: import(".prisma/client").$Enums.TaskStatus;
        priority: import(".prisma/client").$Enums.Priority;
        dueDate: Date | null;
        position: number;
        assignedToId: string | null;
    }>;
    /**
     * Delete a task — ADMIN ONLY
     */
    delete(taskId: string, userId: string): Promise<{
        deleted: boolean;
    }>;
};
//# sourceMappingURL=task.service.d.ts.map