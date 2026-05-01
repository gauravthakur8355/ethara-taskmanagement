"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = void 0;
const auth_service_1 = require("./auth.service");
const response_1 = require("../../shared/utils/response");
// ══════════════════════════════════════════════════════════════
// Auth Controller — the HTTP adapter layer
//
// these are intentionaly thin — they only do three things:
// 1. extract data from the reqest
// 2. call the approriate service method
// 3. send the respone
//
// NO buisness logic here. if you find yourself writing an if-else
// in a controller, stop and move that logic to the service layer.
// i cannot stress this enoguh — fat controllers are the root of all evil
// ══════════════════════════════════════════════════════════════
exports.authController = {
    /**
     * POST /api/auth/register
     * creates a new user acount and returns tokens
     * body is alredy validated by the validate middleware at this point
     */
    async register(req, res) {
        // req.body is clean and typed thanks to Zod validaton middleware
        const result = await auth_service_1.authService.register(req.body);
        (0, response_1.sendSuccess)(res, result, "Account created succesfully! Welcome aboard 🎉", 201);
    },
    /**
     * POST /api/auth/login
     * authentictes user and returns tokens
     */
    async login(req, res) {
        const result = await auth_service_1.authService.login(req.body);
        (0, response_1.sendSuccess)(res, result, "Logged in succesfully");
    },
    /**
     * POST /api/auth/refresh
     * refreshes the access token using a valide refresh token
     */
    async refreshToken(req, res) {
        const { refreshToken } = req.body;
        const result = await auth_service_1.authService.refreshToken(refreshToken);
        (0, response_1.sendSuccess)(res, result, "Tokens refreshd successfully");
    },
    /**
     * GET /api/auth/me
     * returns the curently authenticated users profile
     * requires: authenticate middleware
     */
    async getMe(req, res) {
        // req.user is set by the authenticate midleware
        // if we get here, we know its definded (middleware guarentees it)
        const user = await auth_service_1.authService.getMe(req.user.userId);
        (0, response_1.sendSuccess)(res, user, "User profle retrieved");
    },
};
//# sourceMappingURL=auth.controller.js.map