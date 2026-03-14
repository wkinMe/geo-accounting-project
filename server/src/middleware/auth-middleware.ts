// server/src/middleware/auth-middleware.ts
import { pool } from "@src/db";
import { UnauthorizedError } from "@src/errors/service";
import { TokenService } from "@src/services/TokenService";
import { Request, Response, NextFunction } from "express";
import { UserRole } from "@shared/models";

// Расширяем интерфейс Request с правильной типизацией пользователя
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
        "Authorization header is missing",
        "auth",
        "authMiddleware",
      );
    }

    // Проверяем формат заголовка
    if (!authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedError(
        "Invalid authorization header format. Expected 'Bearer <token>'",
        "auth",
        "authMiddleware",
      );
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      throw new UnauthorizedError("Token is missing", "auth", "authMiddleware");
    }

    const tokenService = new TokenService(pool);
    const decoded = tokenService.verifyAccessToken(token);

    // Проверяем, что декодированные данные содержат все необходимые поля
    if (!decoded || typeof decoded !== "object") {
      throw new UnauthorizedError(
        "Invalid token payload",
        "auth",
        "authMiddleware",
      );
    }

    // Проверяем наличие обязательных полей
    const requiredFields = ["id", "name", "organization_id", "role"];
    for (const field of requiredFields) {
      if (!(field in decoded)) {
        throw new UnauthorizedError(
          `Token missing required field: ${field}`,
          "auth",
          "authMiddleware",
        );
      }
    }

    // Проверяем, что роль является допустимой
    const validRoles: UserRole[] = ["super_admin", "admin", "manager", "user"];
    if (!validRoles.includes(decoded.role)) {
      throw new UnauthorizedError(
        `Invalid role in token: ${decoded.role}`,
        "auth",
        "authMiddleware",
      );
    }

    // Приводим decoded к типу UserPayload
    const userPayload: UserPayload = {
      id: decoded.id,
      name: decoded.name,
      organization_id: decoded.organization_id,
      role: decoded.role,
    };

    req.user = userPayload;

    return next();
  } catch (e: unknown) {
    // Логируем ошибку для отладки
    console.error("Auth middleware error:", e);

    // Передаём ошибку дальше для обработки в error-handling middleware
    next(e);
  }
}
