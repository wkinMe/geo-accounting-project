import type { UserRole } from "@shared/models";

export function isAdminRole(role: UserRole) {
  return role === "admin" || role === "super_admin";
}