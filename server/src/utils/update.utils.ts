// server/src/utils/updateTimestamp.ts
import { Pool } from "pg";
import { executeQuery } from "./query.utils";

/**
 * Обновляет поле updated_at в указанной таблице для записи с заданным id
 * @param db - подключение к базе данных
 * @param tableName - название таблицы
 * @param id - идентификатор записи
 * @param idColumnName - название колонки с идентификатором (по умолчанию 'id')
 */
export async function updateTimestamp(
  db: Pool,
  tableName: string,
  id: number,
  idColumnName: string = "id",
): Promise<void> {
  await executeQuery(
    db,
    "updateTimestamp",
    `UPDATE ${tableName} SET updated_at = CURRENT_TIMESTAMP WHERE ${idColumnName} = $1`,
    [id],
  );
}
