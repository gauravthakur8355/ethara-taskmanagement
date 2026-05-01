import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { AuthenticatedRequest, JWTPayload } from "../shared/types";
import { UnauthorizedError } from "../shared/errors/AppError";

// this midleware sits in front of any protected route
// it grabs the JWT from the Authorization hedder, verifies it,
// and attaches the user paylaod to req.user so downstream handlers can use it
//
// if the token is missing or invalide, we throw a 401 imediately
// no point letting bad requests go futher down the pipeline

export const authenticate = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void => {
  try {
    // expecting format: "Bearer <token>"
    // some pepole send just the token without "Bearer" prefix
    // we handle both becuase why not be nice about it
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedError("No authenication token provided");
    }

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;

    if (!token) {
      throw new UnauthorizedError("Malfromed authorization header");
    }

    // verify the token and extract the paylaod
    // if the token is expired or tampered with, jwt.verify will throw
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JWTPayload;

    // attach user info to the reqest object
    // now any controller/service downstream can access req.user
    req.user = decoded;

    next();
  } catch (error) {
    // jwt.verify throws diffrent error types for expired vs invalid tokens
    // we catch them all and convert to our custome UnauthorizedError
    if (error instanceof jwt.TokenExpiredError) {
      next(new UnauthorizedError("Token has expird — please login again"));
    } else if (error instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedError("Invalid token — nice try tho 😏"));
    } else {
      next(error);
    }
  }
};
