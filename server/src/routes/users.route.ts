// server/src/routes/users.ts
import { UserController } from "@src/controllers";
import { authMiddleware } from "@src/middleware/auth-middleware";
import { Router } from "express";
import { Request, Response } from "express";
import { roleMiddleware } from "@src/middleware/role-middleware";
import { USER_ROLES } from "@shared/constants";

const usersRouter = Router();
const userController = new UserController();

usersRouter.post("/register", (req: Request, res: Response) => {
  userController.register(req, res);
});

usersRouter.post("/login", (req: Request, res: Response) => {
  userController.login(req, res);
});

usersRouter.post("/refresh", (req: Request, res: Response) => {
  userController.refresh(req, res);
});

usersRouter.post("/logout", authMiddleware, (req: Request, res: Response) => {
  userController.logout(req, res);
});

usersRouter.get("/profile", authMiddleware, (req: Request, res: Response) => {
  userController.getProfile(req, res);
});

usersRouter.get("/", authMiddleware, (req: Request, res: Response) => {
  userController.getAll(req, res);
});

usersRouter.get("/search", authMiddleware, (req: Request, res: Response) => {
  userController.search(req, res);
});

usersRouter.get(
  "/admins",
  authMiddleware,
  roleMiddleware([USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]),
  (req: Request, res: Response) => {
    userController.getAdmins(req, res);
  },
);

usersRouter.get(
  "/super-admins",
  authMiddleware,
  roleMiddleware([USER_ROLES.SUPER_ADMIN]),
  (req: Request, res: Response) => {
    userController.getSuperAdmins(req, res);
  },
);

usersRouter.get(
  "/available-managers",
  authMiddleware,
  roleMiddleware([USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]),
  (req: Request, res: Response) => {
    userController.getAvailableManagers(req, res);
  },
);

usersRouter.get(
  "/available-managers/search",
  authMiddleware,
  roleMiddleware([USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]),
  (req: Request, res: Response) => {
    userController.searchAvailableManagers(req, res);
  },
);

usersRouter.get(
  "/organization/:id",
  authMiddleware,
  (req: Request<{ id: string }>, res: Response) => {
    userController.findByOrganizationId(req, res);
  },
);

usersRouter.get(
  "/:id",
  authMiddleware,
  (req: Request<{ id: string }>, res: Response) => {
    userController.getById(req, res);
  },
);

usersRouter.put(
  "/:id",
  authMiddleware,
  roleMiddleware([USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]),
  (req: Request<{ id: string }>, res: Response) => {
    userController.update(req, res);
  },
);

usersRouter.delete(
  "/:id",
  authMiddleware,
  roleMiddleware([USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]),
  (req: Request<{ id: string }>, res: Response) => {
    userController.delete(req, res);
  },
);

export default usersRouter;
