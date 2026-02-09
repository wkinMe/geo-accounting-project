import { Response } from "express";

export function baseErrorHandling(e: unknown, res: Response) {
  if (e instanceof Error) {
    res.send(500).json({
      message: e.message,
    });
  }
}
