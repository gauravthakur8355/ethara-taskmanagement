"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardService = void 0;
const database_1 = require("../../config/database");
// ══════════════════════════════════════════════════════════════
// Dashboard Service — aggregated stats for the dashboard
//
// this quieries multiple tables to build a summary view
// of the user's workspace. runs several queries in paralel
// for performance (Promise.all is your frend)
//
// all stats are scoped to projects the user is a memebr of
// so admins dont magicaly see everyones data — only their projects
// ══════════════════════════════════════════════════════════════
exports.dashboardService = {
    /**
     * Get dashboard stats for a user
     * returns: total tasks, tasks by status, tasks per user, overdue tasks
     */
    async getStats(userId) {
        // first, get all project IDs the user is a memeber of
        const memberships = await database_1.prisma.projectMember.findMany({
            where: { userId },
            select: { projectId: true },
        });
        const projectIds = memberships.map((m) => m.projectId);
        if (projectIds.length === 0) {
            // user isnt in any projects — return empty stats
            return {
                totalTasks: 0,
                totalProjects: 0,
                tasksByStatus: { TODO: 0, IN_PROGRESS: 0, IN_REVIEW: 0, DONE: 0 },
                tasksPerUser: [],
                overdueTasks: [],
                myTasks: 0,
                completedTasks: 0,
            };
        }
        // run all queries in paralell — much faster than sequentialy
        // each query is scoped to the users projects only
        const [totalTasks, totalProjects, todoCount, inProgressCount, inReviewCount, doneCount, overdueTasks, myTasks, tasksPerUser,] = await Promise.all([
            // total task count accross all user's projects
            database_1.prisma.task.count({
                where: { projectId: { in: projectIds } },
            }),
            // total projects the user belongs too
            projectIds.length,
            // tasks by status — four seprate counts
            database_1.prisma.task.count({
                where: { projectId: { in: projectIds }, status: "TODO" },
            }),
            database_1.prisma.task.count({
                where: { projectId: { in: projectIds }, status: "IN_PROGRESS" },
            }),
            database_1.prisma.task.count({
                where: { projectId: { in: projectIds }, status: "IN_REVIEW" },
            }),
            database_1.prisma.task.count({
                where: { projectId: { in: projectIds }, status: "DONE" },
            }),
            // overdue tasks — due date in the past and not yet done
            // these are the ones that need atention ASAP
            database_1.prisma.task.findMany({
                where: {
                    projectId: { in: projectIds },
                    dueDate: { lt: new Date() },
                    status: { not: "DONE" },
                },
                include: {
                    assignedTo: {
                        select: { id: true, name: true, email: true, avatar: true },
                    },
                    project: {
                        select: { id: true, name: true },
                    },
                },
                orderBy: { dueDate: "asc" },
                take: 10, // limit to 10 most overdue — dont want a huge payload
            }),
            // tasks assigned to the curent user
            database_1.prisma.task.count({
                where: {
                    projectId: { in: projectIds },
                    assignedToId: userId,
                    status: { not: "DONE" },
                },
            }),
            // tasks per user — for the leaderboard/chart
            // groups by assignee and counts tasks
            database_1.prisma.task.groupBy({
                by: ["assignedToId"],
                where: {
                    projectId: { in: projectIds },
                    assignedToId: { not: null },
                },
                _count: { id: true },
            }),
        ]);
        // enrich tasksPerUser with user names (groupBy doesnt support includes)
        const userIds = tasksPerUser
            .map((t) => t.assignedToId)
            .filter((id) => id !== null);
        const users = await database_1.prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, name: true, email: true, avatar: true },
        });
        const enrichedTasksPerUser = tasksPerUser.map((t) => ({
            user: users.find((u) => u.id === t.assignedToId) || {
                id: t.assignedToId,
                name: "Unknown",
                email: "",
            },
            taskCount: t._count.id,
        }));
        return {
            totalTasks,
            totalProjects,
            tasksByStatus: {
                TODO: todoCount,
                IN_PROGRESS: inProgressCount,
                IN_REVIEW: inReviewCount,
                DONE: doneCount,
            },
            tasksPerUser: enrichedTasksPerUser,
            overdueTasks,
            myTasks,
            completedTasks: doneCount,
        };
    },
};
//# sourceMappingURL=dashboard.service.js.map