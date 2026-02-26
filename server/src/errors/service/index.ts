export class ServiceError extends Error {
  constructor(
    message: string,
    public readonly service: string,
    public readonly operation: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "ServiceError";
  }
}

export class DatabaseError extends ServiceError {
  constructor(
    message: string,
    operation: string,
    public readonly query?: string,
    cause?: unknown,
  ) {
    super(message, "DatabaseService", operation, cause);
    this.name = "DatabaseError";
  }
}

export class NotFoundError extends ServiceError {
  constructor(
    message: string,
    operation: string,
    public readonly id?: string | number,
  ) {
    super(message, "MaterialService", operation);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends ServiceError {
  constructor(
    message: string,
    operation: string,
    public readonly field?: string,
    public readonly value?: unknown,
  ) {
    super(message, "ValidationError", operation);
    this.name = "ValidationError";
  }
}

export class UnauthorizedError extends ServiceError {
  constructor(message: string, operation: string) {
    super(message, "AuthService", operation);
    this.name = "UnauthorizedError";
  }
}
