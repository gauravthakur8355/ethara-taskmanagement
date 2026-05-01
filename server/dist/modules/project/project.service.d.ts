import { CreateProjectInput, UpdateProjectInput, AddMemberInput } from "./project.validation";
export declare const projectService: {
    /**
     * Create a new project
     * - the creator is automaticaly added as an ADMIN memeber
     * - generates a unique slug for URL-frendly access
     */
    create(data: CreateProjectInput, userId: string): Promise<{
        createdBy: {
            name: string;
            id: string;
            email: string;
        };
        members: ({
            user: {
                name: string;
                id: string;
                email: string;
            };
        } & {
            id: string;
            role: import(".prisma/client").$Enums.ProjectRole;
            joinedAt: Date;
            userId: string;
            projectId: string;
        })[];
        _count: {
            tasks: number;
        };
    } & {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        slug: string;
        isArchived: boolean;
        createdById: string;
    }>;
    /**
     * Get all projects the user is a memeber of
     * - supports pagination, search, and archive filtring
     * - only returns projects where the user has a membershp
     */
    findAll(userId: string, options: {
        page: number;
        limit: number;
        search?: string;
        isArchived?: boolean;
    }): Promise<{
        projects: ({
            createdBy: {
                name: string;
                id: string;
                email: string;
            };
            _count: {
                members: number;
                tasks: number;
            };
        } & {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            slug: string;
            isArchived: boolean;
            createdById: string;
        })[];
        totalCount: number;
    }>;
    /**
     * Get a single project by ID
     * - includes members and task counts
     * - checks that the user is a memeber of the project
     */
    findById(projectId: string, userId: string): Promise<{
        createdBy: {
            name: string;
            id: string;
            email: string;
            avatar: string | null;
        };
        members: ({
            user: {
                name: string;
                id: string;
                email: string;
                avatar: string | null;
            };
        } & {
            id: string;
            role: import(".prisma/client").$Enums.ProjectRole;
            joinedAt: Date;
            userId: string;
            projectId: string;
        })[];
        _count: {
            tasks: number;
        };
    } & {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        slug: string;
        isArchived: boolean;
        createdById: string;
    }>;
    /**
     * Update a project
     * - only project ADMINs can update
     */
    update(projectId: string, data: UpdateProjectInput, userId: string): Promise<{
        createdBy: {
            name: string;
            id: string;
            email: string;
        };
        _count: {
            members: number;
            tasks: number;
        };
    } & {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        slug: string;
        isArchived: boolean;
        createdById: string;
    }>;
    /**
     * Delete a project
     * - only the original creator can delet (not just any admin)
     * - cascades to all tasks, members, comments
     * - this is desctructive and irreversible... maybe we shoud add soft-delete later
     */
    delete(projectId: string, userId: string): Promise<{
        deleted: boolean;
    }>;
    /**
     * Add a member to a project
     * - only project ADMINs can add memebers
     * - prevents adding someone who's alredy a member
     */
    addMember(projectId: string, data: AddMemberInput, requestingUserId: string): Promise<{
        user: {
            name: string;
            id: string;
            email: string;
            avatar: string | null;
        };
    } & {
        id: string;
        role: import(".prisma/client").$Enums.ProjectRole;
        joinedAt: Date;
        userId: string;
        projectId: string;
    }>;
    /**
     * Remove a member from a project
     * - admins can remove others, members can remove themselvs
     * - cant remove the project creator (that would be chaos)
     */
    removeMember(projectId: string, memberUserId: string, requestingUserId: string): Promise<{
        removed: boolean;
    }>;
    /**
     * Helper: ensures the user is an ADMIN of the specfied project
     * throws ForbiddenError if they're not
     * used internaly by other service methods
     */
    ensureProjectAdmin(projectId: string, userId: string): Promise<{
        id: string;
        role: import(".prisma/client").$Enums.ProjectRole;
        joinedAt: Date;
        userId: string;
        projectId: string;
    }>;
};
//# sourceMappingURL=project.service.d.ts.map