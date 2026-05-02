import { prisma } from "../../config/database";
import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
  BadRequestError,
} from "../../shared/errors/AppError";
import {
  CreateProjectInput,
  UpdateProjectInput,
  AddMemberInput,
} from "./project.validation";

/**
 * Project Service — business logic for projects, members, and access control.
 * Access checks are done here (not in middleware) because project-level
 * permissions depend on the member list which we'd query anyway.
 */

// Generate a URL-friendly slug from project name
const generateSlug = (name: string): string => {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const suffix = Math.random().toString(36).substring(2, 8);
  return `${base}-${suffix}`;
};

export const projectService = {
  /** Create a project — creator is auto-added as ADMIN */
  async create(data: CreateProjectInput, userId: string) {
    const slug = generateSlug(data.name);

    // Transaction ensures project + creator membership are atomic
    const project = await prisma.$transaction(async (tx) => {
      const newProject = await tx.project.create({
        data: {
          name: data.name,
          description: data.description,
          slug,
          createdById: userId,
          members: {
            create: {
              userId: userId,
              role: "ADMIN",
            },
          },
        },
        include: {
          createdBy: {
            select: { id: true, name: true, email: true },
          },
          members: {
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
            },
          },
          _count: { select: { tasks: true } },
        },
      });

      return newProject;
    });

    return project;
  },

  /** Get all projects the user is a member of, with pagination and search */
  async findAll(
    userId: string,
    options: {
      page: number;
      limit: number;
      search?: string;
      isArchived?: boolean;
    }
  ) {
    const { page, limit, search, isArchived } = options;
    const skip = (page - 1) * limit;

    const where: any = {
      members: {
        some: { userId },
      },
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(isArchived !== undefined && { isArchived }),
    };

    const [projects, totalCount] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          createdBy: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: { tasks: true, members: true },
          },
        },
      }),
      prisma.project.count({ where }),
    ]);

    return { projects, totalCount };
  },

  /** Get a single project with members and task counts */
  async findById(projectId: string, userId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
          orderBy: { joinedAt: "asc" },
        },
        _count: { select: { tasks: true } },
      },
    });

    if (!project) {
      throw new NotFoundError("Project");
    }

    const isMember = project.members.some((m) => m.userId === userId);
    if (!isMember) {
      throw new ForbiddenError("You are not a member of this project");
    }

    return project;
  },

  /** Update a project — ADMIN only */
  async update(projectId: string, data: UpdateProjectInput, userId: string) {
    await this.ensureProjectAdmin(projectId, userId);

    const updated = await prisma.project.update({
      where: { id: projectId },
      data,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        _count: { select: { tasks: true, members: true } },
      },
    });

    return updated;
  },

  /** Delete a project — only the original creator can delete */
  async delete(projectId: string, userId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { createdById: true },
    });

    if (!project) {
      throw new NotFoundError("Project");
    }

    if (project.createdById !== userId) {
      throw new ForbiddenError("Only the project creator can delete it");
    }

    await prisma.project.delete({ where: { id: projectId } });
    return { deleted: true };
  },

  /** Add a member to a project — ADMIN only */
  async addMember(
    projectId: string,
    data: AddMemberInput,
    requestingUserId: string
  ) {
    await this.ensureProjectAdmin(projectId, requestingUserId);

    const existingMember = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: data.userId,
          projectId,
        },
      },
    });

    if (existingMember) {
      throw new ConflictError("This user is already a member of the project");
    }

    const userExists = await prisma.user.findUnique({
      where: { id: data.userId },
      select: { id: true },
    });

    if (!userExists) {
      throw new NotFoundError("User");
    }

    const member = await prisma.projectMember.create({
      data: {
        userId: data.userId,
        projectId,
        role: data.role as any,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    });

    return member;
  },

  /** Remove a member — admins can remove others, members can remove themselves */
  async removeMember(
    projectId: string,
    memberUserId: string,
    requestingUserId: string
  ) {
    const requestingMember = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: requestingUserId,
          projectId,
        },
      },
    });

    if (!requestingMember) {
      throw new ForbiddenError("You are not a member of this project");
    }

    if (
      requestingMember.role !== "ADMIN" &&
      requestingUserId !== memberUserId
    ) {
      throw new ForbiddenError("Only admins can remove other members");
    }

    // Prevent removing the project creator
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { createdById: true },
    });

    if (project?.createdById === memberUserId) {
      throw new BadRequestError(
        "Cannot remove the project creator — transfer ownership first"
      );
    }

    await prisma.projectMember.delete({
      where: {
        userId_projectId: {
          userId: memberUserId,
          projectId,
        },
      },
    });

    return { removed: true };
  },

  /** Helper: verify the user is a project ADMIN */
  async ensureProjectAdmin(projectId: string, userId: string) {
    const membership = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: { userId, projectId },
      },
    });

    if (!membership) {
      throw new ForbiddenError("You are not a member of this project");
    }

    if (membership.role !== "ADMIN") {
      throw new ForbiddenError("Only project admins can perform this action");
    }

    return membership;
  },
};
