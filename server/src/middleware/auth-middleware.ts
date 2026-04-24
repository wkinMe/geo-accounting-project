// server/src/middleware/auth-middleware.ts
import { pool } from "@src/db";
import { UnauthorizedError } from "@shared/service";
import { TokenService } from "@src/services/TokenService";
import { Request, Response, NextFunction } from "express";
import { UserRole } from "@shared/models";

export interface UserPayload {
  id: number;
  name: string;
  organization_id: number;
  role: UserRole;
}

export interface RequestWithUser extends Request {
  user?: UserPayload;
}

export function authMiddleware(
  req: RequestWithUser,
  res: Response,
  next: NextFunction,
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedError(
        "Отсутствует заголовок авторизации",
        "auth",
        "authMiddleware",
      );
    }

    if (!authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedError(
        "Неверный формат заголовка авторизации. Ожидается 'Bearer <token>'",
        "auth",
        "authMiddleware",
      );
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      throw new UnauthorizedError(
        "Токен отсутствует",
        "auth",
        "authMiddleware",
      );
    }

    const tokenService = new TokenService();
    const decoded = tokenService.verifyAccessToken(token);

    if (!decoded || typeof decoded !== "object") {
      throw new UnauthorizedError(
        "Неверный формат токена",
        "auth",
        "authMiddleware",
      );
    }

    const requiredFields = ["id", "name", "organization_id", "role"];
    for (const field of requiredFields) {
      if (!(field in decoded)) {
        throw new UnauthorizedError(
          `В токене отсутствует обязательное поле: ${field}`,
          "auth",
          "authMiddleware",
        );
      }
    }

    const validRoles: UserRole[] = ["super_admin", "admin", "manager", "user"];
    if (!validRoles.includes(decoded.role)) {
      throw new UnauthorizedError(
        `Неверная роль в токене: ${decoded.role}`,
        "auth",
        "authMiddleware",
      );
    }

    const userPayload: UserPayload = {
      id: decoded.id,
      name: decoded.name,
      organization_id: decoded.organization_id,
      role: decoded.role,
    };

    req.user = userPayload;

    return next();
  } catch (e: unknown) {
    console.error("Ошибка в authMiddleware:", e);
    next(e);
  }
}
