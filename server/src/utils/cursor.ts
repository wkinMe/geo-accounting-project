// server/src/utils/cursor.ts
export interface CursorValue {
  [key: string]: any;
  id: number;
}

export function encodeCursor(cursor: Record<string, any>): string {
  return Buffer.from(JSON.stringify(cursor)).toString("base64");
}

export function decodeCursor(cursor: string): Record<string, any> | null {
  try {
    return JSON.parse(Buffer.from(cursor, "base64").toString());
  } catch {
    return null;
  }
}

export function buildWhereClauseForKeyset(
  sortField: string,
  sortOrder: "ASC" | "DESC",
  cursorValue: CursorValue | null,
): { whereClause: string; params: any[] } {
  const params: any[] = [];

  if (!cursorValue) {
    return { whereClause: "", params };
  }

  let whereClause = "";
  if (sortOrder === "ASC") {
    whereClause = `WHERE (${sortField} > $1 OR (${sortField} = $1 AND id > $2))`;
    params.push(cursorValue[sortField], cursorValue.id);
  } else {
    whereClause = `WHERE (${sortField} < $1 OR (${sortField} = $1 AND id < $2))`;
    params.push(cursorValue[sortField], cursorValue.id);
  }

  return { whereClause, params };
}
