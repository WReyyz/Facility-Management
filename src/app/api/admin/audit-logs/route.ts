import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { getCurrentUser } from "@/server/auth";
import { Role } from "@prisma/client";

// GET /api/admin/audit-logs - Query audit trail with filters (Admin only)
export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (currentUser.role !== Role.ADMIN) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.toLowerCase() || "";
    const entity = searchParams.get("entity") || "";
    const action = searchParams.get("action") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(10, parseInt(searchParams.get("limit") || "50", 10)));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (entity) {
      where.entity = entity;
    }
    if (action) {
      where.action = action;
    }
    if (q) {
      where.OR = [
        { action: { contains: q } },
        { entity: { contains: q } },
        { entityId: { contains: q } },
        { actor: { fullName: { contains: q } } },
        { actor: { username: { contains: q } } },
      ];
    }

    const [logs, totalCount] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          actor: {
            select: {
              id: true,
              username: true,
              fullName: true,
              role: true,
            },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    // Format logs with String(id) to avoid BigInt serialization error
    const formatted = logs.map((log) => ({
      id: String(log.id),
      actorId: log.actorId,
      actorName: log.actor?.fullName || "System / Automated",
      actorUsername: log.actor?.username || null,
      actorRole: log.actor?.role || null,
      action: log.action,
      entity: log.entity,
      entityId: log.entityId,
      diff: log.diff,
      ip: log.ip || "—",
      createdAt: log.createdAt.toISOString(),
    }));

    return NextResponse.json({
      logs: formatted,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Admin Audit Logs GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch audit logs." },
      { status: 500 }
    );
  }
}
