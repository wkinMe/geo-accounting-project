import { pool } from "@src/db";
import { UnauthorizedError } from "@src/errors/service";
import { TokenService } from "@src/services/TokenService";
import { Request, Response, NextFunction } from "express";

// Расширяем интерфейс Request прямо здесь
interface RequestWithUser extends Request {
  user?: any;
}

export function authMiddleware(
  req: RequestWithUser,
  res: Response,
  next: NextFunction,
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedError("Invalid or expired token", "auth");
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      throw new UnauthorizedError("Invalid or expired token", "auth");
    }

    const tokenService = new TokenService(pool);
    const decoded = tokenService.verifyAccessToken(token);
    req.user = decoded;

    return next();
  } catch (e: unknown) {
    next(e);
  }
}
