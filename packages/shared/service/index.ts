export class ServiceError extends Error {
  public readonly service?: string;
  public readonly operation?: string;
  public readonly cause?: unknown;

  constructor(
    message: string,
    service?: string,
    operation?: string,
    cause?: unknown,
  ) {
    super(message);
    this.name = "ServiceError";
    this.service = service;
    this.operation = operation;
    this.cause = cause;
  }
}

export class DatabaseError extends ServiceError {
  public readonly query?: string;

  constructor(
    message: string,
    operation: string,
    service?: string,
    query?: string,
    cause?: unknown,
  ) {
    super(message, service, operation, cause);
    this.name = "DatabaseError";
    this.query = query;
  }
}

export class NotFoundError extends ServiceError {
  public readonly id?: string | number;

  constructor(
    message: string,
    operation: string,
    service?: string,
    id?: string | number,
  ) {
    super(message, service, operation);
    this.name = "NotFoundError";
    this.id = id;
  }
}

export class ValidationError extends ServiceError {
  public readonly field?: string;
  public readonly value?: unknown;

  constructor(
    message: string,
    operation: string,
    service?: string,
    field?: string,
    value?: unknown,
  ) {
    super(message, service, operation);
    this.name = "ValidationError";
    this.field = field;
    this.value = value;
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
  public readonly requiredRole?: string;
  public readonly userRole?: string;

  constructor(
    message: string,
    operation: string,
    service?: string,
    requiredRole?: string,
    userRole?: string,
  ) {
    super(message, service, operation);
    this.name = "ForbiddenError";
    this.requiredRole = requiredRole;
    this.userRole = userRole;
  }
}
