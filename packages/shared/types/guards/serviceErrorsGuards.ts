import {
  DatabaseError,
  NotFoundError,
  ServiceError,
  ValidationError,
} from "@src/errors/service";

export function isServiceError(error: unknown): error is ServiceError {
  return error instanceof Error && "service" in error;
}

export function isDatabaseError(error: unknown): error is DatabaseError {
  return isServiceError(error) && error.name === "DatabaseError";
}

export function isNotFoundError(error: unknown): error is NotFoundError {
  return isServiceError(error) && error.name === "NotFoundError";
}

export function isValidationError(error: unknown): error is ValidationError {
  return isServiceError(error) && error.name === "ValidationError";
}
