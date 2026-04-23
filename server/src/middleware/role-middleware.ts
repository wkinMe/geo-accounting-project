// server/src/middleware/role-middleware.ts
import { Request, Response, NextFunction } from "express";
import { UserRole } from "@shared/models";

export const roleMiddleware = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // @ts-ignore - пользователь добавляется в authMiddleware
      const user = req.user;

      if (!user) {
        return res.status(401).json({
          success: false,
          error: "Требуется авторизация",
        });
      }

      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          error: "Доступ запрещён. Недостаточно прав.",
          required_roles: allowedRoles,
          user_role: user.role,
        });
      }

      next();
    } catch (error) {
      console.error("Ошибка в roleMiddleware:", error);
      return res.status(500).json({
        success: false,
        error: "Внутренняя ошибка сервера при проверке прав",
      });
    }
  };
};
