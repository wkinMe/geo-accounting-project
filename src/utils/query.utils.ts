import { Pool, QueryResult, QueryResultRow } from "pg";
import { DatabaseError, NotFoundError } from "../errors/service";

// Вспомогательный метод для безопасного выполнения запросов
export async function executeQuery<T extends QueryResultRow>(
  db: Pool,
  operation: string,
  query: string,
  parameters?: any[],
): Promise<T[]> {
  try {
    const result = await db.query<T>(query, parameters);
    return result.rows;
  } catch (error) {
    // Обертываем все ошибки базы данных в DatabaseError
    throw new DatabaseError(
      `Database operation failed: ${operation}`,
      operation,
      query,
      error instanceof Error ? error : new Error(String(error)),
    );
  }
}

// Вспомогательный метод для получения одной записи
export async function getSingleResult<T extends QueryResultRow>(
  db: Pool,
  operation: string,
  query: string,
  parameters?: any[],
  entityName?: string,
  entityId?: string | number,
): Promise<T> {
  const rows = await executeQuery<T>(db, operation, query, parameters);

  if (rows.length === 0) {
    throw new NotFoundError(
      entityName
        ? `${entityName} with id ${entityId} not found`
        : "Record not found",
      entityName || "Record",
      entityId,
    );
  }

  return rows[0];
}
