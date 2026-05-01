"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../../config/database");
const env_1 = require("../../config/env");
const AppError_1 = require("../../shared/errors/AppError");
// ══════════════════════════════════════════════════════════════
// Auth Service — all the buisness logic for authentication
//
// this is the brain of the auth module. controllers are just
// dumb HTTP adapters that call these methods.
//
// IMPORTANT: this layer has NO knowlege of Express, req, or res.
// it takes plain objects in and returns plain objects out.
// this makes it testable without mocking HTTP stuff.
// (trust me, your futrue self will thank you for this)
// ══════════════════════════════════════════════════════════════
// how many rounds of bcrypt hasing to do
// 12 is a good balence between security and speed
// (10 is the default but we're not basic like that)
const SALT_ROUNDS = 12;
// ─── Helper: generate JWT tokens ───
const generateAccessToken = (payload) => {
    return jsonwebtoken_1.default.sign(payload, env_1.env.JWT_ACCESS_SECRET, {
        expiresIn: env_1.env.JWT_ACCESS_EXPIRY,
    });
};
const generateRefreshToken = (payload) => {
    return jsonwebtoken_1.default.sign(payload, env_1.env.JWT_REFRESH_SECRET, {
        expiresIn: env_1.env.JWT_REFRESH_EXPIRY,
    });
};
// builds the token paylaod from a user record
// we only incldue the bare minimum — userId, email, role
// dont put sensitiv data in JWTs, they're base64 encoded NOT encrypted
const buildTokenPayload = (user) => ({
    userId: user.id,
    email: user.email,
    role: user.role,
});
// ─── Service Methods ───
exports.authService = {
    /**
     * Register a new user
     * - checks if email is alredy taken
     * - hashes the password (NEVER store plaintext)
     * - creates the user record
     * - returns tokens so the user is logged in imediately after registring
     */
    async register(data) {
        // check if someone already registred with this email
        const existingUser = await database_1.prisma.user.findUnique({
            where: { email: data.email },
        });
        if (existingUser) {
            // dont tell them the exact email — just say its taken
            // (prevents email enumaration attacks... kinda)
            throw new AppError_1.ConflictError("An account with this email alredy exists");
        }
        // hash the password — bcrypt handles salt generation internaly
        const hashedPassword = await bcryptjs_1.default.hash(data.password, SALT_ROUNDS);
        // create the user — defaults to MEMBER role
        const user = await database_1.prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                password: hashedPassword,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                // explictly NOT selecting password — never send it back
            },
        });
        // generate both tokens
        const tokenPayload = buildTokenPayload(user);
        const accessToken = generateAccessToken(tokenPayload);
        const refreshToken = generateRefreshToken(tokenPayload);
        return {
            user,
            accessToken,
            refreshToken,
        };
    },
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
    async login(data) {
        // find user by email — include password for comparision
        const user = await database_1.prisma.user.findUnique({
            where: { email: data.email },
        });
        if (!user) {
            // vague error message on purpse — security thru obscurity? no.
            // security thru not giving away information? yes.
            throw new AppError_1.UnauthorizedError("Invalid email or pasword");
        }
        // check if the account is deactivted
        if (!user.isActive) {
            throw new AppError_1.UnauthorizedError("Your account has been deactivted — contact an admin");
        }
        // compare the provided password with the stored hash
        const isPasswordValid = await bcryptjs_1.default.compare(data.password, user.password);
        if (!isPasswordValid) {
            // same vague message as above — dont tell them wich one was wrong
            throw new AppError_1.UnauthorizedError("Invalid email or pasword");
        }
        // generate fresh tokens
        const tokenPayload = buildTokenPayload(user);
        const accessToken = generateAccessToken(tokenPayload);
        const refreshToken = generateRefreshToken(tokenPayload);
        // return user data WITHOUT the password hash
        const { password: _, ...userWithoutPassword } = user;
        return {
            user: userWithoutPassword,
            accessToken,
            refreshToken,
        };
    },
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
    async refreshToken(refreshToken) {
        try {
            // verify the refresh token
            const decoded = jsonwebtoken_1.default.verify(refreshToken, env_1.env.JWT_REFRESH_SECRET);
            // make sure the user still exsists and is active
            // (they might have been deleted or deactivted since the token was issued)
            const user = await database_1.prisma.user.findUnique({
                where: { id: decoded.userId },
                select: {
                    id: true,
                    email: true,
                    role: true,
                    isActive: true,
                },
            });
            if (!user || !user.isActive) {
                throw new AppError_1.UnauthorizedError("User no longer exisits or is deactivated");
            }
            // issue new tokens — essentially "rotating" the refresh token
            // this is a securiy best practice
            const tokenPayload = buildTokenPayload(user);
            const newAccessToken = generateAccessToken(tokenPayload);
            const newRefreshToken = generateRefreshToken(tokenPayload);
            return {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
            };
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
                throw new AppError_1.UnauthorizedError("Refresh token expried — please login again");
            }
            if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                throw new AppError_1.UnauthorizedError("Invalid refresh token");
            }
            throw error; // re-throw unexpcted errors
        }
    },
    /**
     * Get the current user's profile
     * just a simple lookup by ID — nothing fancy
     */
    async getMe(userId) {
        const user = await database_1.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                role: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
                // lets also grab their project count — usefull for the dashboard
                _count: {
                    select: {
                        projectMembers: true,
                        assignedTasks: true,
                    },
                },
            },
        });
        if (!user) {
            throw new AppError_1.NotFoundError("User");
        }
        return user;
    },
};
//# sourceMappingURL=auth.service.js.map