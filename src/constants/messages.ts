export const SUCCESS_MESSAGES = {
  // Базовые сообщения для всех сущностей
  FIND_ALL: (entity: string) => `${entity}s retrieved successfully`,
  FIND_BY_ID: (entity: string, id: number) =>
    `${entity} with ID ${id} retrieved successfully`,
  CREATE: (entity: string) => `${entity} created successfully`,
  UPDATE: (entity: string) => `${entity} updated successfully`,
  DELETE: (entity: string) => `${entity} deleted successfully`,
  SEARCH: (entity: string, count: number) =>
    count > 0 ? `Found ${count} ${entity}(s)` : `No ${entity}s found`,

  // Специфичные для User
  GET_ADMINS: (count: number) =>
    count > 0 ? `Found ${count} admin(s)` : "No administrators found",
  GET_AVAILABLE_MANAGERS: (count: number) =>
    count > 0
      ? `Found ${count} available manager(s)`
      : "No available managers found",
  FIND_BY_ORGANIZATION: (entity: string, count: number, orgId: number) =>
    count > 0
      ? `Found ${count} ${entity}(s) in organization ${orgId}`
      : `No ${entity}s found in organization ${orgId}`,
};

export const ERROR_MESSAGES = {
  // Общие ошибки
  INVALID_ID: (entity: string) => `Invalid ${entity} ID`,
  INVALID_ID_FORMAT: (entity: string) => `Invalid ${entity} ID format`,
  REQUIRED_FIELD: (field: string) => `${field} is required`,
  EMPTY_FIELD: (field: string) => `${field} cannot be empty`,
  REQUEST_BODY_REQUIRED: "Request body is required",
  UPDATE_DATA_REQUIRED: "Update data is required",
  SEARCH_QUERY_REQUIRED: "Search query is required",
  NOT_FOUND: (entity: string, id: number) =>
    `${entity} with ID ${id} not found`,
};
