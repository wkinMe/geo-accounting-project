import { UserController } from "@src/controllers";
import { pool } from "@src/db";
import { Router } from "express";

const usersRouter = Router();
const userController = new UserController(pool);

// GET /api/users - получить всех пользователей
usersRouter.get("/", (req, res) => {
  userController.findAll(req, res);
});

// GET /api/users/search?q=name - поиск пользователей
usersRouter.get("/search", (req, res) => {
  userController.search(req, res);
});

// GET /api/users/admins - получить всех администраторов
usersRouter.get("/admins", (req, res) => {
  userController.getAdmins(req, res);
});

// GET /api/users/available-managers - получить доступных менеджеров
usersRouter.get("/available-managers", (req, res) => {
  userController.getAvailableManagers(req, res);
});

// GET /api/users/organization/:orgId - получить пользователей по организации
usersRouter.get("/organization/:id", (req, res) => {
  userController.findByOrganizationId(req, res);
});

// GET /api/users/:id - получить пользователя по ID
usersRouter.get("/:id", (req, res) => {
  userController.findById(req, res);
});

// POST /api/users - создать нового пользователя
usersRouter.post("/", (req, res) => {
  userController.create(req, res);
});

// PATCH /api/users/:id - обновить пользователя
usersRouter.patch("/:id", (req, res) => {
  userController.update(req, res);
});

// DELETE /api/users/:id - удалить пользователя
usersRouter.delete("/:id", (req, res) => {
  userController.delete(req, res);
});

export default usersRouter;
