import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export type AuditAction = "CREATE" | "UPDATE" | "DELETE";

export type AuditEntityType =
  | "Appointment"
  | "Invoice"
  | "Service"
  | "Document"
  | "CompanySettings"
  | "WorkingHours";

export interface AuditLogParams {
  companyId: string;
  userId: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  changes?: Record<string, { old?: unknown; new?: unknown }>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log an audit event for tracking admin actions.
 *
 * @param params - The audit log parameters
 * @returns The created audit log entry
 *
 * @example
 * await logAuditEvent({
 *   companyId: company.id,
 *   userId: user.id,
 *   action: "UPDATE",
 *   entityType: "Appointment",
 *   entityId: appointment.id,
 *   changes: {
 *     status: { old: "PENDING", new: "CONFIRMED" }
 *   }
 * });
 */
export async function logAuditEvent({
  companyId,
  userId,
  action,
  entityType,
  entityId,
  changes,
  ipAddress,
  userAgent,
}: AuditLogParams) {
  try {
    return await prisma.auditLog.create({
      data: {
        companyId,
        userId,
        action,
        entityType,
        entityId,
        changes: changes as Prisma.InputJsonValue | undefined,
        ipAddress: ipAddress ?? null,
        userAgent: userAgent ?? null,
      },
    });
  } catch (error) {
    // Log error but don't throw - audit logging should not break the main operation
    console.error("Failed to create audit log:", error);
    return null;
  }
}

/**
 * Extract IP address from request headers.
 */
export function getClientIp(request: Request): string | undefined {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") ?? undefined;
}

/**
 * Extract user agent from request headers.
 */
export function getUserAgent(request: Request): string | undefined {
  return request.headers.get("user-agent") ?? undefined;
}

/**
 * Helper to compute changes between old and new objects.
 */
export function computeChanges<T extends Record<string, unknown>>(
  oldObj: T,
  newObj: Partial<T>,
  fieldsToTrack?: (keyof T)[]
): Record<string, { old?: unknown; new?: unknown }> | undefined {
  const changes: Record<string, { old?: unknown; new?: unknown }> = {};

  const fields = fieldsToTrack ?? (Object.keys(newObj) as (keyof T)[]);

  for (const field of fields) {
    const oldValue = oldObj[field];
    const newValue = newObj[field];

    // Only track if the value actually changed
    if (newValue !== undefined && oldValue !== newValue) {
      changes[field as string] = { old: oldValue, new: newValue };
    }
  }

  return Object.keys(changes).length > 0 ? changes : undefined;
}
