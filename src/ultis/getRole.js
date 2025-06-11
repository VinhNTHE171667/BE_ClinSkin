export const ADMIN_ROLE = "ADMIN";

export const accessRole = (allowedRoles) => {
  const roles = ["ADMIN", "USER"];
  return roles.filter((item) => allowedRoles.includes(item));
};
