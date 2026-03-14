// server/src/middleware/role-middleware.ts
import { Request, Response, NextFunction } from "express";
import { UserRole } from "@shared/models";

/**
 * Middleware для проверки роли пользователя
 * @param allowedRoles - массив разрешённых ролей
 */
export const roleMiddleware = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // @ts-ignore - пользователь добавляется в authMiddleware
      const user = req.user;

      if (!user) {
        return res.status(401).json({
          message: "Authentication required",
        });
      }

      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({
          message: "Access denied. Insufficient permissions.",
          requiredRoles: allowedRoles,
          userRole: user.role,
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        message: "Error checking user permissions",
      });
    }
  };
};
