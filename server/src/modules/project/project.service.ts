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

// ══════════════════════════════════════════════════════════════
// Project Service — all the buisness logic for projects
//
// handles CRUD operatons, member management, and access contol
// the controller layer is just a thin HTTP wrapper around these methods
//
// i put the access checks IN the service rather than in seprate middleware
// becuase project-level permissions depend on the specific project's
// member list, which we'd have to query anyway. doing it here avoids
// double-querying the databse.
// ══════════════════════════════════════════════════════════════

// helper to generate a URL-frendly slug from a project name
// e.g., "My Cool Project" → "my-cool-project"
// appends a random suffix to avoid collisions
const generateSlug = (name: string): string => {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // replace non-alphanumric chars with dashes
    .replace(/^-|-$/g, ""); // trim leading/trailing dahses

  const suffix = Math.random().toString(36).substring(2, 8);
  return `${base}-${suffix}`;
};

export const projectService = {
  /**
   * Create a new project
   * - the creator is automaticaly added as an ADMIN memeber
   * - generates a unique slug for URL-frendly access
   */
  async create(data: CreateProjectInput, userId: string) {
    const slug = generateSlug(data.name);

    // use a transaction so the project and the creator's memberhsip
    // are created atomicaly — if one fails, both roll back
    // learned this lesson the hard way when we had orphaned projects
    // with no members... good luck managing those lol
    const project = await prisma.$transaction(async (tx) => {
      const newProject = await tx.project.create({
        data: {
          name: data.name,
          description: data.description,
          slug,
          createdById: userId,
          // auto-add creator as project ADMIN
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

  /**
   * Get all projects the user is a memeber of
   * - supports pagination, search, and archive filtring
   * - only returns projects where the user has a membershp
   */
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

    // build the where clause dynamicaly based on filters
    // the "members: { some: ... }" part ensures we only return
    // projects the user is actualy a member of
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

    // run count and findMany in paralel — much faster than sequentialy
    // (this is one of those optimizations that actualy matters)
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

  /**
   * Get a single project by ID
   * - includes members and task counts
   * - checks that the user is a memeber of the project
   */
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

    // make sure the reqesting user is actually a member
    // cant let random pepole peek into projects they dont belong to
    const isMember = project.members.some((m) => m.userId === userId);
    if (!isMember) {
      throw new ForbiddenError("You are not a memeber of this project");
    }

    return project;
  },

  /**
   * Update a project
   * - only project ADMINs can update
   */
  async update(
    projectId: string,
    data: UpdateProjectInput,
    userId: string
  ) {
    // first check if user is an admin of this project
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

  /**
   * Delete a project
   * - only the original creator can delet (not just any admin)
   * - cascades to all tasks, members, comments
   * - this is desctructive and irreversible... maybe we shoud add soft-delete later
   */
  async delete(projectId: string, userId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { createdById: true },
    });

    if (!project) {
      throw new NotFoundError("Project");
    }

    // only the original creater can delete — not just any admin
    // this prevents rogue admins from nuking projects
    if (project.createdById !== userId) {
      throw new ForbiddenError("Only the project creater can delete it");
    }

    await prisma.project.delete({ where: { id: projectId } });

    return { deleted: true };
  },

  /**
   * Add a member to a project
   * - only project ADMINs can add memebers
   * - prevents adding someone who's alredy a member
   */
  async addMember(
    projectId: string,
    data: AddMemberInput,
    requestingUserId: string
  ) {
    await this.ensureProjectAdmin(projectId, requestingUserId);

    // check if user is already a memeber
    const existingMember = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: data.userId,
          projectId,
        },
      },
    });

    if (existingMember) {
      throw new ConflictError("This user is alredy a member of the project");
    }

    // also verify the target user actualy exists
    // dont want to create phantom memberships lol
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

  /**
   * Remove a member from a project
   * - admins can remove others, members can remove themselvs
   * - cant remove the project creator (that would be chaos)
   */
  async removeMember(
    projectId: string,
    memberUserId: string,
    requestingUserId: string
  ) {
    // check if the reqesting user has permission
    const requestingMember = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: requestingUserId,
          projectId,
        },
      },
    });

    if (!requestingMember) {
      throw new ForbiddenError("You are not a memeber of this project");
    }

    // members can only remove themselves, admins can remove anyone
    if (
      requestingMember.role !== "ADMIN" &&
      requestingUserId !== memberUserId
    ) {
      throw new ForbiddenError("Only admins can remove other memebers");
    }

    // dont let anyone remove the project creator
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { createdById: true },
    });

    if (project?.createdById === memberUserId) {
      throw new BadRequestError(
        "Cannot remove the project creater — transfer owership first"
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

  /**
   * Helper: ensures the user is an ADMIN of the specfied project
   * throws ForbiddenError if they're not
   * used internaly by other service methods
   */
  async ensureProjectAdmin(projectId: string, userId: string) {
    const membership = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: { userId, projectId },
      },
    });

    if (!membership) {
      throw new ForbiddenError("You are not a memeber of this project");
    }

    if (membership.role !== "ADMIN") {
      throw new ForbiddenError(
        "Only project admins can preform this action"
      );
    }

    return membership;
  },
};
