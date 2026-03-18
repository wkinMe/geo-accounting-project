import type { UserRole } from "@shared/models";

export const USER_ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  MANAGER: "manager",
  USER: "user",
} as const satisfies Record<string, UserRole>;

export const USER_ROLES_MAP = {
  [USER_ROLES.SUPER_ADMIN]: "Главный администратор",
  [USER_ROLES.ADMIN]: "Администратор",
  [USER_ROLES.MANAGER]: "Менеджер",
  [USER_ROLES.USER]: "Пользователь",
};
