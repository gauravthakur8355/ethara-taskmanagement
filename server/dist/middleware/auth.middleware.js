"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const AppError_1 = require("../shared/errors/AppError");
// this midleware sits in front of any protected route
// it grabs the JWT from the Authorization hedder, verifies it,
// and attaches the user paylaod to req.user so downstream handlers can use it
//
// if the token is missing or invalide, we throw a 401 imediately
// no point letting bad requests go futher down the pipeline
const authenticate = (req, _res, next) => {
    try {
        // expecting format: "Bearer <token>"
        // some pepole send just the token without "Bearer" prefix
        // we handle both becuase why not be nice about it
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            throw new AppError_1.UnauthorizedError("No authenication token provided");
        }
        const token = authHeader.startsWith("Bearer ")
            ? authHeader.split(" ")[1]
            : authHeader;
        if (!token) {
            throw new AppError_1.UnauthorizedError("Malfromed authorization header");
        }
        // verify the token and extract the paylaod
        // if the token is expired or tampered with, jwt.verify will throw
        const decoded = jsonwebtoken_1.default.verify(token, env_1.env.JWT_ACCESS_SECRET);
        // attach user info to the reqest object
        // now any controller/service downstream can access req.user
        req.user = decoded;
        next();
    }
    catch (error) {
        // jwt.verify throws diffrent error types for expired vs invalid tokens
        // we catch them all and convert to our custome UnauthorizedError
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            next(new AppError_1.UnauthorizedError("Token has expird — please login again"));
        }
        else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            next(new AppError_1.UnauthorizedError("Invalid token — nice try tho 😏"));
        }
        else {
            next(error);
        }
    }
};
exports.authenticate = authenticate;
//# sourceMappingURL=auth.middleware.js.map