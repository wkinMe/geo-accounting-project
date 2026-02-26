import { Request, Response, NextFunction } from "express";
import { UnauthorizedError } from "@src/errors/service";

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (err instanceof UnauthorizedError) {
    return res.status(401).json({
      ...err,
    });
  }

  // Другие типы ошибок
  return res.status(500).json({
    error: "Internal Server Error",
    message: err.message,
  });
}
