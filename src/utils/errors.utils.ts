import { Response } from "express";

export function baseErrorHandling(e: unknown, res: Response) {
  console.log("=== ERROR IN CONTROLLER ===");
  console.log("Error name:", e instanceof Error ? e.name : typeof e);
  console.log("Error message:", e instanceof Error ? e.message : e);
  console.log("Error cause:", e instanceof Error ? e.cause : "No stack");

  if (e instanceof Error) {
    res.status(500).json({
      message: e.message,
    });
  }
}
