export type StaffRole = "ADMIN" | "CATALOG_MANAGER" | "ORDER_MANAGER" | "FINANCE";
export type AppRole = "BUYER" | StaffRole;

export const STAFF_ROLES: StaffRole[] = [
  "ADMIN",
  "CATALOG_MANAGER",
  "ORDER_MANAGER",
  "FINANCE",
];

export function isStaffRole(role: string | undefined): role is StaffRole {
  return STAFF_ROLES.includes(role as StaffRole);
}

export function canAccessAdmin(role: string | undefined) {
  return isStaffRole(role);
}

export function canManageCatalog(role: string | undefined) {
  return role === "ADMIN" || role === "CATALOG_MANAGER";
}

export function canManageOrders(role: string | undefined) {
  return role === "ADMIN" || role === "ORDER_MANAGER";
}

export function canManageFinance(role: string | undefined) {
  return role === "ADMIN" || role === "FINANCE";
}
