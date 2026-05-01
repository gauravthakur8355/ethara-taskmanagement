export declare const dashboardService: {
    /**
     * Get dashboard stats for a user
     * returns: total tasks, tasks by status, tasks per user, overdue tasks
     */
    getStats(userId: string): Promise<{
        totalTasks: number;
        totalProjects: number;
        tasksByStatus: {
            TODO: number;
            IN_PROGRESS: number;
            IN_REVIEW: number;
            DONE: number;
        };
        tasksPerUser: {
            user: {
                name: string;
                id: string;
                email: string;
                avatar: string | null;
            } | {
                id: string | null;
                name: string;
                email: string;
            };
            taskCount: number;
        }[];
        overdueTasks: ({
            project: {
                name: string;
                id: string;
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
        myTasks: number;
        completedTasks: number;
    }>;
};
//# sourceMappingURL=dashboard.service.d.ts.map