export const ADMIN_ROLE = "ADMIN";
export const SUPPORT_ROLE = "SUPPORT";

export const accessRole = (allowedRoles) => {
  const roles = ["ADMIN", "USER", "SUPPORT"];
  return roles.filter((item) => allowedRoles.includes(item));
};
