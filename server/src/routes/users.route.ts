// server/src/routes/users.ts
import { UserController } from "@src/controllers";
import { pool } from "@src/db";
import { authMiddleware } from "@src/middleware/auth-middleware";
import { Router } from "express";
import { Request, Response } from "express";
import { roleMiddleware } from "@src/middleware/role-middleware";
import { USER_ROLES } from "@shared/constants";

const usersRouter = Router();
const userController = new UserController(pool);

// ==================== Публичные маршруты (без аутентификации) ====================

/**
 * POST /api/users/register - регистрация пользователя
 * Доступ: публичный
 */
usersRouter.post("/register", (req: Request, res: Response) => {
  userController.register(req, res);
});

/**
 * POST /api/users/login - вход пользователя
 * Доступ: публичный
 */
usersRouter.post("/login", (req: Request, res: Response) => {
  userController.login(req, res);
});

/**
 * POST /api/users/refresh - обновление токена
 * Доступ: публичный
 */
usersRouter.post("/refresh", (req: Request, res: Response) => {
  userController.refreshToken(req, res);
});

// ==================== Маршруты с аутентификацией ====================

/**
 * POST /api/users/logout - выход пользователя
 * Доступ: любой аутентифицированный пользователь
 */
usersRouter.post("/logout", authMiddleware, (req: Request, res: Response) => {
  userController.logout(req, res);
});

/**
 * GET /api/users/profile - получить профиль текущего пользователя
 * Доступ: любой аутентифицированный пользователь
 */
usersRouter.get("/profile", authMiddleware, (req: Request, res: Response) => {
  userController.getProfile(req, res);
});

/**
 * GET /api/users - получить всех пользователей
 * Доступ: все аутентифицированные пользователи
 */
usersRouter.get("/", authMiddleware, (req: Request, res: Response) => {
  userController.findAll(req, res);
});

// ==================== СПЕЦИФИЧЕСКИЕ МАРШРУТЫ (ДОЛЖНЫ БЫТЬ ПЕРЕД /:id) ====================

/**
 * GET /api/users/search - поиск пользователей
 * Доступ: все аутентифицированные пользователи
 */
usersRouter.get("/search", authMiddleware, (req: Request, res: Response) => {
  userController.search(req, res);
});

/**
 * GET /api/users/admins - получить всех администраторов
 * Доступ: администраторы (admin и super_admin)
 */
usersRouter.get(
  "/admins",
  authMiddleware,
  roleMiddleware([USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]),
  (req: Request, res: Response) => {
    userController.getAdmins(req, res);
  },
);

/**
 * GET /api/users/super-admins - получить всех главных администраторов
 * Доступ: только super_admin
 */
usersRouter.get(
  "/super-admins",
  authMiddleware,
  roleMiddleware([USER_ROLES.SUPER_ADMIN]),
  (req: Request, res: Response) => {
    userController.getSuperAdmins(req, res);
  },
);

/**
 * GET /api/users/available-managers - получить доступных менеджеров
 * Доступ: администраторы (admin и super_admin)
 */
usersRouter.get(
  "/available-managers",
  authMiddleware,
  roleMiddleware([USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]),
  (req: Request, res: Response) => {
    userController.getAvailableManagers(req, res);
  },
);

/**
 * GET /api/users/organization/:id - получить пользователей по организации
 * Доступ: все аутентифицированные пользователи
 */
usersRouter.get(
  "/organization/:id",
  authMiddleware,
  (req: Request<{ id: string }>, res: Response) => {
    userController.findByOrganizationId(req, res);
  },
);

// ==================== ДИНАМИЧЕСКИЙ МАРШРУТ (ДОЛЖЕН БЫТЬ ПОСЛЕДНИМ) ====================

/**
 * GET /api/users/:id - получить пользователя по ID
 * Доступ: все аутентифицированные пользователи
 */
usersRouter.get(
  "/:id",
  authMiddleware,
  (req: Request<{ id: string }>, res: Response) => {
    userController.findById(req, res);
  },
);

// ==================== Маршруты для модификации (тоже должны быть после специфических GET) ====================

/**
 * PATCH /api/users/:id - обновить пользователя
 * Доступ: администраторы (admin и super_admin)
 */
usersRouter.patch(
  "/:id",
  authMiddleware,
  roleMiddleware([USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]),
  (req: Request<{ id: string }>, res: Response) => {
    userController.update(req, res);
  },
);

/**
 * DELETE /api/users/:id - удалить пользователя
 * Доступ: администраторы (admin и super_admin)
 */
usersRouter.delete(
  "/:id",
  authMiddleware,
  roleMiddleware([USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]),
  (req: Request<{ id: string }>, res: Response) => {
    userController.delete(req, res);
  },
);

export default usersRouter;
