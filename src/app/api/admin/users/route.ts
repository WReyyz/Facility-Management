import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { getCurrentUser, hashPassword } from "@/server/auth";
import { Role } from "@prisma/client";
import { createAuditLog } from "@/server/audit";

// GET /api/admin/users - List users with stats (Admin only)
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
    const roleParam = searchParams.get("role") || "";
    const statusParam = searchParams.get("status") || "";

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
        failedAttempts: true,
        lockedUntil: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const now = new Date();
    let activeCount = 0;
    let lockedCount = 0;
    const roleCounts: Record<string, number> = {};

    users.forEach((u) => {
      if (u.isActive) activeCount++;
      if (u.lockedUntil && new Date(u.lockedUntil) > now) lockedCount++;
      roleCounts[u.role] = (roleCounts[u.role] || 0) + 1;
    });

    // Apply filters
    const filtered = users.filter((u) => {
      const matchQ =
        !q ||
        u.username.toLowerCase().includes(q) ||
        u.fullName.toLowerCase().includes(q);

      const matchRole = !roleParam || u.role === roleParam;

      let matchStatus = true;
      if (statusParam === "active") matchStatus = u.isActive;
      if (statusParam === "inactive") matchStatus = !u.isActive;
      if (statusParam === "locked")
        matchStatus = Boolean(u.lockedUntil && new Date(u.lockedUntil) > now);

      return matchQ && matchRole && matchStatus;
    });

    return NextResponse.json({
      users: filtered,
      stats: {
        total: users.length,
        active: activeCount,
        locked: lockedCount,
        inactive: users.length - activeCount,
        roleCounts,
      },
    });
  } catch (error) {
    console.error("Admin Users GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users." },
      { status: 500 }
    );
  }
}

// POST /api/admin/users - Create new user (Admin only)
export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (currentUser.role !== Role.ADMIN) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { username, fullName, role, password, mustChangePassword } = body;

    if (!username?.trim() || !fullName?.trim() || !role || !password) {
      return NextResponse.json(
        { error: "Username, full name, role, and password are required." },
        { status: 400 }
      );
    }

    if (!Object.values(Role).includes(role)) {
      return NextResponse.json({ error: "Invalid role specified." }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    const cleanUsername = username.trim().toLowerCase();

    // Check duplicate username
    const existing = await prisma.user.findUnique({
      where: { username: cleanUsername },
    });
    if (existing) {
      return NextResponse.json(
        { error: `Username "${cleanUsername}" is already taken.` },
        { status: 400 }
      );
    }

    const passwordHash = hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        username: cleanUsername,
        fullName: fullName.trim(),
        role,
        passwordHash,
        mustChangePassword: mustChangePassword !== false,
        isActive: true,
      },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
        createdAt: true,
      },
    });

    // Audit Log
    await createAuditLog({
      actorId: currentUser.id,
      action: "USER_CREATED",
      entity: "USER",
      entityId: newUser.id,
      diff: {
        username: newUser.username,
        role: newUser.role,
        fullName: newUser.fullName,
      },
    });

    return NextResponse.json({ success: true, user: newUser }, { status: 201 });
  } catch (error) {
    console.error("Admin Users POST error:", error);
    return NextResponse.json(
      { error: "Failed to create user." },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/users - Manage user (toggle active, role, reset password, unlock)
export async function PATCH(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (currentUser.role !== Role.ADMIN) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { userId, action } = body;

    if (!userId || !action) {
      return NextResponse.json(
        { error: "User ID and action are required." },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!targetUser) {
      return NextResponse.json({ error: "Target user not found." }, { status: 404 });
    }

    // Action 1: Toggle Active
    if (action === "TOGGLE_ACTIVE") {
      if (targetUser.id === currentUser.id) {
        return NextResponse.json(
          { error: "You cannot deactivate your own admin account." },
          { status: 400 }
        );
      }

      const updated = await prisma.user.update({
        where: { id: userId },
        data: { isActive: !targetUser.isActive },
        select: { id: true, username: true, isActive: true },
      });

      await createAuditLog({
        actorId: currentUser.id,
        action: updated.isActive ? "USER_ACTIVATED" : "USER_DEACTIVATED",
        entity: "USER",
        entityId: userId,
        diff: { previous: targetUser.isActive, current: updated.isActive },
      });

      return NextResponse.json({ success: true, user: updated });
    }

    // Action 2: Change Role
    if (action === "CHANGE_ROLE") {
      const { role: newRole } = body;
      if (!newRole || !Object.values(Role).includes(newRole)) {
        return NextResponse.json({ error: "Valid role is required." }, { status: 400 });
      }

      if (targetUser.id === currentUser.id && newRole !== Role.ADMIN) {
        return NextResponse.json(
          { error: "You cannot demote yourself from the ADMIN role." },
          { status: 400 }
        );
      }

      const updated = await prisma.user.update({
        where: { id: userId },
        data: { role: newRole },
        select: { id: true, username: true, role: true },
      });

      await createAuditLog({
        actorId: currentUser.id,
        action: "USER_ROLE_CHANGED",
        entity: "USER",
        entityId: userId,
        diff: { previousRole: targetUser.role, newRole },
      });

      return NextResponse.json({ success: true, user: updated });
    }

    // Action 3: Reset Password
    if (action === "RESET_PASSWORD") {
      const { newPassword, mustChangePassword } = body;
      if (!newPassword || newPassword.length < 8) {
        return NextResponse.json(
          { error: "New password must be at least 8 characters long." },
          { status: 400 }
        );
      }

      const passwordHash = hashPassword(newPassword);

      const updated = await prisma.user.update({
        where: { id: userId },
        data: {
          passwordHash,
          mustChangePassword: mustChangePassword !== false,
          failedAttempts: 0,
          lockedUntil: null,
        },
        select: { id: true, username: true, mustChangePassword: true },
      });

      await createAuditLog({
        actorId: currentUser.id,
        action: "USER_PASSWORD_RESET",
        entity: "USER",
        entityId: userId,
      });

      return NextResponse.json({ success: true, user: updated });
    }

    // Action 4: Unlock Account
    if (action === "UNLOCK") {
      const updated = await prisma.user.update({
        where: { id: userId },
        data: {
          failedAttempts: 0,
          lockedUntil: null,
        },
        select: { id: true, username: true, failedAttempts: true, lockedUntil: true },
      });

      await createAuditLog({
        actorId: currentUser.id,
        action: "USER_UNLOCKED",
        entity: "USER",
        entityId: userId,
      });

      return NextResponse.json({ success: true, user: updated });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (error) {
    console.error("Admin Users PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update user." },
      { status: 500 }
    );
  }
}
