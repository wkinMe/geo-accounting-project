// shared/constants/warehouseHistoryTypes.ts

// Создаём enum для TypeScript, который соответствует enum в БД
export const WAREHOUSE_HISTORY_TYPES = {
  MANUAL_ADD: "MANUAL_ADD",
  MANUAL_UPDATE: "MANUAL_UPDATE",
  MANUAL_REMOVE: "MANUAL_REMOVE",
  AGREEMENT_IN: "AGREEMENT_IN",
  AGREEMENT_OUT: "AGREEMENT_OUT",
} as const;

export type WarehouseHistoryType =
  (typeof WAREHOUSE_HISTORY_TYPES)[keyof typeof WAREHOUSE_HISTORY_TYPES];

// Для отображения на русском
export const WAREHOUSE_HISTORY_TYPE_LABELS: Record<
  WarehouseHistoryType,
  string
> = {
  [WAREHOUSE_HISTORY_TYPES.MANUAL_ADD]: "Ручное добавление",
  [WAREHOUSE_HISTORY_TYPES.MANUAL_UPDATE]: "Ручное обновление",
  [WAREHOUSE_HISTORY_TYPES.MANUAL_REMOVE]: "Ручное удаление",
  [WAREHOUSE_HISTORY_TYPES.AGREEMENT_IN]: "Прибыль по договору",
  [WAREHOUSE_HISTORY_TYPES.AGREEMENT_OUT]: "Убыль по договору",
};

// Для цветов (опционально)
export const WAREHOUSE_HISTORY_TYPE_COLORS: Record<
  WarehouseHistoryType,
  string
> = {
  [WAREHOUSE_HISTORY_TYPES.MANUAL_ADD]: "bg-green-100 text-green-800",
  [WAREHOUSE_HISTORY_TYPES.MANUAL_UPDATE]: "bg-blue-100 text-blue-800",
  [WAREHOUSE_HISTORY_TYPES.MANUAL_REMOVE]: "bg-red-100 text-red-800",
  [WAREHOUSE_HISTORY_TYPES.AGREEMENT_IN]: "bg-emerald-100 text-emerald-800",
  [WAREHOUSE_HISTORY_TYPES.AGREEMENT_OUT]: "bg-amber-100 text-amber-800",
};
