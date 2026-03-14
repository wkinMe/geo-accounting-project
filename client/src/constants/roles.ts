import type { UserRole } from "@shared/models";

export const USER_ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  MANAGER: "manager",
  USER: "user",
} as const satisfies Record<string, UserRole>;