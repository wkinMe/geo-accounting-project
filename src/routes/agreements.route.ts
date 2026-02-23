import { AgreementController } from "@src/controllers";
import { pool } from "@src/db";
import { Router } from "express";

const agreementsRouter = Router();
const agreementController = new AgreementController(pool);

// GET /api/agreements - получить все соглашения
agreementsRouter.get("/", (req, res) => {
  agreementController.findAll(req, res);
});

// GET /api/agreements/search?q=query - поиск соглашений
agreementsRouter.get("/search", (req, res) => {
  agreementController.search(req, res);
});

// GET /api/agreements/:id - получить соглашение по ID
agreementsRouter.get("/:id", (req, res) => {
  agreementController.findById(req, res);
});

// POST /api/agreements - создать новое соглашение
agreementsRouter.post("/", (req, res) => {
  agreementController.create(req, res);
});

// PATCH /api/agreements/:id - обновить соглашение
agreementsRouter.patch("/:id", (req, res) => {
  agreementController.update(req, res);
});

// DELETE /api/agreements/:id - удалить соглашение
agreementsRouter.delete("/:id", (req, res) => {
  agreementController.delete(req, res);
});

export default agreementsRouter;
