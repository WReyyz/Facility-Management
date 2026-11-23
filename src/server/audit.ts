import { prisma } from "@/server/db";

export interface CreateAuditLogParams {
  actorId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  diff?: any;
  ip?: string | null;
}

/**
 * Creates an immutable audit log entry
 */
export async function createAuditLog({
  actorId,
  action,
  entity,
  entityId,
  diff,
  ip,
}: CreateAuditLogParams) {
  try {
    return await prisma.auditLog.create({
      data: {
        actorId: actorId || null,
        action,
        entity,
        entityId: entityId || null,
        diff: diff ? JSON.parse(JSON.stringify(diff)) : undefined,
        ip: ip || null,
      },
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
    return null;
  }
}
