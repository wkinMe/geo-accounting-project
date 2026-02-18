import { Response } from "express";
import {
  DatabaseError,
  NotFoundError,
  ServiceError,
  ValidationError,
} from "@src/errors/service";

export function baseErrorHandling(e: unknown, res: Response) {
  // NotFoundError - ресурс не найден (404)
  if (e instanceof NotFoundError) {
    return res.status(404).json({
      message: e.message,
      service: e.service,
      operation: e.operation,
      ...(e.id && { id: e.id }),
    });
  }

  // ValidationError - ошибка валидации (400)
  if (e instanceof ValidationError) {
    return res.status(400).json({
      message: e.message,
      service: e.service,
      operation: e.operation,
      ...(e.field && { field: e.field }),
      ...(e.value && { value: e.value }),
    });
  }

  // DatabaseError - ошибка базы данных (500)
  if (e instanceof DatabaseError) {
    return res.status(500).json({
      message: e.message,
      service: e.service,
      operation: e.operation,
      ...(e.query && { query: e.query }),
    });
  }

  // Остальные ServiceError (500)
  if (e instanceof ServiceError) {
    return res.status(500).json({
      message: e.message,
      service: e.service,
      operation: e.operation,
    });
  }

  // Стандартные ошибки (500)
  if (e instanceof Error) {
    return res.status(500).json({
      message: e.message,
    });
  }

  // Неизвестные ошибки (500)
  return res.status(500).json({
    message: "An unknown error occurred",
  });
}
