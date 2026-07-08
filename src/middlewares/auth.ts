import { NextFunction, Request, Response } from "express";
import config from "../config";
import { prisma } from "../lib/prisma";
import { jwtUtils } from "../utils/jwt";
import { Role } from "../../generated/prisma/enums";
import { AppError } from "../utils/AppError";

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email: string;
                role: Role;
            };
        }
    }
}

export const auth =
    (...roles: Role[]) =>
        async (req: Request, res: Response, next: NextFunction) => {
            try {
                const token = req.cookies.accessToken ?
                    req.cookies.accessToken
                    :
                    req.headers.authorization?.startsWith("Bearer ") ?
                        req.headers.authorization?.split(" ")[1]
                        : req.headers.authorization;

                if (!token) {
                    throw new AppError(401, "Unauthorized Access", [
                        {
                            field: "authorization",
                            message: "Access token is required",
                        },
                    ]);
                }

                const decoded = jwtUtils.verifyToken(
                    token,
                    config.jwt_access_secret
                );

                const user = await prisma.user.findUnique({
                    where: {
                        id: decoded.id,
                    },
                });

                if (!user) {
                    throw new AppError(401, "User not found");
                }

                if (user.isBanned) {
                    throw new AppError(403, "Your account has been banned");
                }

                if (roles.length && !roles.includes(user.role)) {
                    throw new AppError(403, "Forbidden");
                }

                req.user = {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                };

                next();
            } catch (error) {
                next(error);
            }
        };