import { prisma } from "../../config/database";

/**
 * Dashboard Service — aggregates stats across the user's projects.
 * All stats are scoped to projects the user is a member of.
 */
export const dashboardService = {
  async getStats(userId: string) {
    const memberships = await prisma.projectMember.findMany({
      where: { userId },
      select: { projectId: true },
    });

    const projectIds = memberships.map((m) => m.projectId);

    if (projectIds.length === 0) {
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

    // Run all queries in parallel for performance
    const [
      totalTasks,
      totalProjects,
      todoCount,
      inProgressCount,
      inReviewCount,
      doneCount,
      overdueTasks,
      myTasks,
      tasksPerUser,
    ] = await Promise.all([
      prisma.task.count({
        where: { projectId: { in: projectIds } },
      }),

      projectIds.length,

      prisma.task.count({
        where: { projectId: { in: projectIds }, status: "TODO" },
      }),
      prisma.task.count({
        where: { projectId: { in: projectIds }, status: "IN_PROGRESS" },
      }),
      prisma.task.count({
        where: { projectId: { in: projectIds }, status: "IN_REVIEW" },
      }),
      prisma.task.count({
        where: { projectId: { in: projectIds }, status: "DONE" },
      }),

      // Overdue tasks — past due and not completed
      prisma.task.findMany({
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
        take: 10,
      }),

      // Active tasks assigned to the current user
      prisma.task.count({
        where: {
          projectId: { in: projectIds },
          assignedToId: userId,
          status: { not: "DONE" },
        },
      }),

      // Tasks grouped by assignee
      prisma.task.groupBy({
        by: ["assignedToId"],
        where: {
          projectId: { in: projectIds },
          assignedToId: { not: null },
        },
        _count: { id: true },
      }),
    ]);

    // Enrich tasksPerUser with user info (groupBy doesn't support includes)
    const userIds = tasksPerUser
      .map((t) => t.assignedToId)
      .filter((id): id is string => id !== null);

    const users = await prisma.user.findMany({
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
