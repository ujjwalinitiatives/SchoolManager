import { Role } from "@prisma/client";

export class AccessDeniedError extends Error {
  constructor(message: string = "Unauthorized access") {
    super(message);
    this.name = "AccessDeniedError";
  }
}

/**
 * Validates if the user role is among the allowed roles.
 */
export function validateRole(userRole: Role, allowedRoles: Role[]) {
  if (!allowedRoles.includes(userRole)) {
    throw new AccessDeniedError();
  }
}

/**
 * Validates if the requested schoolId matches the user's schoolId (Multi-tenant isolation).
 */
export function validateSchoolScope(userSchoolId: string, requestedSchoolId: string) {
  if (userSchoolId !== requestedSchoolId) {
    throw new AccessDeniedError("Cross-tenant access denied.");
  }
}
