export const ADMIN_ROLE = "ADMIN";
export const STAFF_ROLE = "STAFF";
export const SUPPORT_ROLE = "SUPPORT";

export const accessRole = (allowedRoles) => {
  const roles = ["ADMIN", "USER", "STAFF", "SUPPORT"];
  return roles.filter((item) => allowedRoles.includes(item));
};
