// client/src/constants/agreement.ts

export const AGREEMENT_STATUS = {
  DRAFT: "draft",
  PENDING: "pending",
  ACTIVE: "active",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  EXPIRED: "expired",
} as const;

// Тип на основе значений объекта
export type AgreementStatus =
  (typeof AGREEMENT_STATUS)[keyof typeof AGREEMENT_STATUS];

// Для отображения на русском
export const AGREEMENT_STATUS_LABELS: Record<AgreementStatus, string> = {
  [AGREEMENT_STATUS.DRAFT]: "Черновик",
  [AGREEMENT_STATUS.PENDING]: "Ожидает подтверждения",
  [AGREEMENT_STATUS.ACTIVE]: "Активен",
  [AGREEMENT_STATUS.IN_PROGRESS]: "В процессе выполнения",
  [AGREEMENT_STATUS.COMPLETED]: "Завершён",
  [AGREEMENT_STATUS.CANCELLED]: "Отменён",
  [AGREEMENT_STATUS.EXPIRED]: "Просрочен",
};

// Порядок статусов (для проверки возможности повышения)
export const STATUS_ORDER = [
  AGREEMENT_STATUS.DRAFT,
  AGREEMENT_STATUS.PENDING,
  AGREEMENT_STATUS.ACTIVE,
  AGREEMENT_STATUS.IN_PROGRESS,
  AGREEMENT_STATUS.COMPLETED,
  AGREEMENT_STATUS.CANCELLED,
  AGREEMENT_STATUS.EXPIRED,
];

// Для цветов (опционально)
export const AGREEMENT_STATUS_COLORS: Record<AgreementStatus, string> = {
  [AGREEMENT_STATUS.DRAFT]: "bg-gray-100 text-gray-800",
  [AGREEMENT_STATUS.PENDING]: "bg-yellow-100 text-yellow-800",
  [AGREEMENT_STATUS.ACTIVE]: "bg-green-100 text-green-800",
  [AGREEMENT_STATUS.IN_PROGRESS]: "bg-blue-100 text-blue-800",
  [AGREEMENT_STATUS.COMPLETED]: "bg-purple-100 text-purple-800",
  [AGREEMENT_STATUS.CANCELLED]: "bg-red-100 text-red-800",
  [AGREEMENT_STATUS.EXPIRED]: "bg-orange-100 text-orange-800",
};


// Статусы, которые нельзя откатить (только движение вперед)
export const IRREVERSIBLE_STATUSES: AgreementStatus[] = [
	AGREEMENT_STATUS.ACTIVE,
	AGREEMENT_STATUS.IN_PROGRESS,
	AGREEMENT_STATUS.COMPLETED,
];
