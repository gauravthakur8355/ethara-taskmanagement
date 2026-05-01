import { RegisterInput, LoginInput } from "./auth.validation";
export declare const authService: {
    /**
     * Register a new user
     * - checks if email is alredy taken
     * - hashes the password (NEVER store plaintext)
     * - creates the user record
     * - returns tokens so the user is logged in imediately after registring
     */
    register(data: RegisterInput): Promise<{
        user: {
            name: string;
            id: string;
            email: string;
            role: import(".prisma/client").$Enums.Role;
            createdAt: Date;
        };
        accessToken: string;
        refreshToken: string;
    }>;
    /**
     * Login with email and pasword
     * - finds user by email
     * - compares password hash
     * - returns fresh tokens
     *
     * note: we intentionaly use the same error message for both
     * "user not found" and "wrong password" — so attackers cant
     * figure out wich emails are registred in our system
     */
    login(data: LoginInput): Promise<{
        user: {
            name: string;
            id: string;
            email: string;
            avatar: string | null;
            role: import(".prisma/client").$Enums.Role;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
        accessToken: string;
        refreshToken: string;
    }>;
    /**
     * Refresh the access token using a valid refesh token
     * - verifies the refresh token
     * - checks if user still exisits and is active
     * - issues new token pair
     *
     * this is why we have two tokens — the access token is short-lived (15min)
     * so if its comprommised, the damage window is small.
     * the refresh token is long-lived but can only be used to get new tokens.
     */
    refreshToken(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    /**
     * Get the current user's profile
     * just a simple lookup by ID — nothing fancy
     */
    getMe(userId: string): Promise<{
        name: string;
        id: string;
        email: string;
        avatar: string | null;
        role: import(".prisma/client").$Enums.Role;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        _count: {
            projectMembers: number;
            assignedTasks: number;
        };
    }>;
};
//# sourceMappingURL=auth.service.d.ts.map