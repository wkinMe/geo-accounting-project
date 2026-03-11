export class ServiceError extends Error {
  constructor(
    message: string,
    public readonly service?: string,
    public readonly operation?: string,
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
    service?: string,
    public readonly query?: string,
    cause?: unknown,
  ) {
    super(message, service, operation, cause);
    this.name = "DatabaseError";
  }
}

export class NotFoundError extends ServiceError {
  constructor(
    message: string,
    operation: string,
    service?: string,
    public readonly id?: string | number,
  ) {
    super(message, service, operation);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends ServiceError {
  constructor(
    message: string,
    operation: string,
    service?: string,
    public readonly field?: string,
    public readonly value?: unknown,
  ) {
    super(message, service, operation);
    this.name = "ValidationError";
  }
}

export class UnauthorizedError extends ServiceError {
  constructor(message: string, operation: string, service?: string) {
    super(message, service, operation);
    this.name = "UnauthorizedError";
  }
}

/**
 * Ошибка доступа - возникает, когда у пользователя недостаточно прав
 * для выполнения операции, даже если он аутентифицирован
 */
export class ForbiddenError extends ServiceError {
  constructor(
    message: string,
    operation: string,
    service?: string,
    public readonly requiredRole?: string,
    public readonly userRole?: string,
  ) {
    super(message, service, operation);
    this.name = "ForbiddenError";
  }
}
