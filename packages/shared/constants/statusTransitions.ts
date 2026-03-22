// constants/statusTransitions.ts
import {
  AGREEMENT_STATUS,
  USER_ROLES,
  type AgreementStatus,
} from "@shared/constants";

interface StatusTransitionConfig {
  [role: string]: {
    [status: string]: AgreementStatus[]; // из какого статуса в какие можно перейти
  };
}

export const STATUS_TRANSITIONS: StatusTransitionConfig = {
  // Гл. администратор может делать что угодно со статусами
  [USER_ROLES.SUPER_ADMIN]: {
    [AGREEMENT_STATUS.DRAFT]: Object.values(AGREEMENT_STATUS),
    [AGREEMENT_STATUS.PENDING]: Object.values(AGREEMENT_STATUS),
    [AGREEMENT_STATUS.ACTIVE]: Object.values(AGREEMENT_STATUS),
    [AGREEMENT_STATUS.IN_PROGRESS]: Object.values(AGREEMENT_STATUS),
    [AGREEMENT_STATUS.COMPLETED]: Object.values(AGREEMENT_STATUS),
    [AGREEMENT_STATUS.CANCELLED]: Object.values(AGREEMENT_STATUS),
    [AGREEMENT_STATUS.EXPIRED]: Object.values(AGREEMENT_STATUS),
  },

  // Администратор может делать что угодно со статусами
  [USER_ROLES.ADMIN]: {
    [AGREEMENT_STATUS.DRAFT]: Object.values(AGREEMENT_STATUS),
    [AGREEMENT_STATUS.PENDING]: Object.values(AGREEMENT_STATUS),
    [AGREEMENT_STATUS.ACTIVE]: Object.values(AGREEMENT_STATUS),
    [AGREEMENT_STATUS.IN_PROGRESS]: Object.values(AGREEMENT_STATUS),
    [AGREEMENT_STATUS.COMPLETED]: Object.values(AGREEMENT_STATUS),
    [AGREEMENT_STATUS.CANCELLED]: Object.values(AGREEMENT_STATUS),
    [AGREEMENT_STATUS.EXPIRED]: Object.values(AGREEMENT_STATUS),
  },

  // Менеджер может двигать статусы только вперёд после активации
  [USER_ROLES.MANAGER]: {
    // До активации - любые статусы доступны
    [AGREEMENT_STATUS.DRAFT]: Object.values(AGREEMENT_STATUS),
    [AGREEMENT_STATUS.PENDING]: Object.values(AGREEMENT_STATUS),

    // После активации - только движение вперёд (нельзя откатить)
    [AGREEMENT_STATUS.ACTIVE]: [
      AGREEMENT_STATUS.ACTIVE,
      AGREEMENT_STATUS.IN_PROGRESS,
      AGREEMENT_STATUS.COMPLETED,
    ],
    [AGREEMENT_STATUS.IN_PROGRESS]: [
      AGREEMENT_STATUS.IN_PROGRESS,
      AGREEMENT_STATUS.COMPLETED,
    ],

    // Конечные статусы - только сами себя
    [AGREEMENT_STATUS.COMPLETED]: [AGREEMENT_STATUS.COMPLETED],
    [AGREEMENT_STATUS.CANCELLED]: [AGREEMENT_STATUS.CANCELLED],
    [AGREEMENT_STATUS.EXPIRED]: [AGREEMENT_STATUS.EXPIRED],
  },
};

export const getTransitions = (
  role: string,
  currentStatus: string,
): AgreementStatus[] => {
  return STATUS_TRANSITIONS[role]?.[currentStatus] || [currentStatus];
};
