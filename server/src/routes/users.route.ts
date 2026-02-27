import { UserController } from "@src/controllers";
import { pool } from "@src/db";
import { authMiddleware } from "@src/middleware/auth-middleware";
import { Router } from "express";
import { Request, Response } from "express";

const usersRouter = Router();
const userController = new UserController(pool);

usersRouter.get("/profile", authMiddleware, (req: Request, res: Response) => {
  userController.getProfile(req, res);
});

// GET /api/users - получить всех пользователей
usersRouter.get("/", authMiddleware, (req: Request, res: Response) => {
  userController.findAll(req, res);
});

// GET /api/users/search?q=name - поиск пользователей
usersRouter.get("/search", authMiddleware, (req: Request, res: Response) => {
  userController.search(req, res);
});

// GET /api/users/admins - получить всех администраторов
usersRouter.get("/admins", authMiddleware, (req: Request, res: Response) => {
  userController.getAdmins(req, res);
});

// GET /api/users/available-managers - получить доступных менеджеров
usersRouter.get(
  "/available-managers",
  authMiddleware,
  (req: Request, res: Response) => {
    userController.getAvailableManagers(req, res);
  },
);

// GET /api/users/organization/:id - получить пользователей по организации
usersRouter.get(
  "/organization/:id",
  authMiddleware,
  (req: Request<{ id: string }>, res: Response) => {
    userController.findByOrganizationId(req, res);
  },
);

// POST /api/users/register - регистрация пользователя
usersRouter.post("/register", (req: Request, res: Response) => {
  userController.register(req, res);
});

// POST /api/users/login - вход пользователя
usersRouter.post("/login", (req: Request, res: Response) => {
  userController.login(req, res);
});

// POST /api/users/logout - выход пользователя
usersRouter.post("/logout", authMiddleware, (req: Request, res: Response) => {
  userController.logout(req, res);
});

// POST /api/users/refresh - обновление токена
usersRouter.post("/refresh", (req: Request, res: Response) => {
  userController.refreshToken(req, res);
});

// GET /api/users/:id - получить пользователя по ID
usersRouter.get(
  "/:id",
  authMiddleware,
  (req: Request<{ id: string }>, res: Response) => {
    userController.findById(req, res);
  },
);

// PATCH /api/users/:id - обновить пользователя
usersRouter.patch(
  "/:id",
  authMiddleware,
  (req: Request<{ id: string }>, res: Response) => {
    userController.update(req, res);
  },
);

// DELETE /api/users/:id - удалить пользователя
usersRouter.delete(
  "/:id",
  authMiddleware,
  (req: Request<{ id: string }>, res: Response) => {
    userController.delete(req, res);
  },
);

export default usersRouter;
