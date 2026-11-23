import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { getCurrentUser } from "@/server/auth";
import { EngineeringStatus, ProjectExecutionStatus, PpcStatus, Role, Stage } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filterStatus = searchParams.get("status") || "all"; // all, overdue, due-soon, in-progress
    const filterStage = searchParams.get("stage") || "all"; // all, Engineering, Project, etc.

    const now = new Date();
    const in7Days = new Date(Date.now() + 7 * 24 * 3600 * 1000);

    const isAdmin = user.role === Role.ADMIN;

    // 1. Fetch Engineering tenders assigned to user (or all if admin)
    const tenders = await prisma.tenderDocument.findMany({
      where: {
        ...(isAdmin ? {} : { engineerId: user.id }),
        status: { in: [EngineeringStatus.NOT_STARTED, EngineeringStatus.IN_PROGRESS] },
      },
      include: {
        project: {
          select: { id: true, name: true, department: true },
        },
      },
      orderBy: { finishDate: "asc" },
    });

    // 2. Fetch Project Executions assigned to user (or all if admin)
    const executions = await prisma.projectExecution.findMany({
      where: {
        ...(isAdmin ? {} : { picId: user.id }),
        status: { in: [ProjectExecutionStatus.NOT_STARTED, ProjectExecutionStatus.IN_PROGRESS] },
      },
      include: {
        project: {
          select: { id: true, name: true, department: true, purchaseOrder: true },
        },
      },
      orderBy: { finishDate: "asc" },
    });

    // 3. Fetch PPC requests assigned to user (or all if admin)
    const ppcRequests = await prisma.ppcRequest.findMany({
      where: {
        ...(isAdmin ? {} : { picId: user.id }),
        status: { in: [PpcStatus.DRAFT, PpcStatus.SUBMITTED] },
      },
      include: {
        project: {
          select: { id: true, name: true, department: true },
        },
      },
      orderBy: { targetDate: "asc" },
    });

    // Map tasks into unified TaskItem format
    const allTasks: Array<{
      id: string;
      docId: string;
      projectId: string;
      title: string;
      department: string;
      stage: string;
      status: "overdue" | "due-soon" | "in-progress";
      statusLabel: string;
      targetDate: string | null;
      daysRemaining: number | null;
      progressPct: number;
      type: "ENGINEERING" | "PROJECT" | "PPC";
    }> = [];

    // Map Tenders
    tenders.forEach((t) => {
      let isOverdue = false;
      let isDueSoon = false;
      let daysRemaining: number | null = null;

      if (t.finishDate) {
        const finish = new Date(t.finishDate);
        daysRemaining = Math.ceil((finish.getTime() - now.getTime()) / (1000 * 3600 * 24));
        if (finish < now) isOverdue = true;
        else if (finish <= in7Days) isDueSoon = true;
      }

      const status = isOverdue ? "overdue" : isDueSoon ? "due-soon" : "in-progress";
      const statusLabel = isOverdue ? "Overdue" : isDueSoon ? "Due Soon" : "On Track";

      allTasks.push({
        id: t.id,
        docId: t.tenderNo,
        projectId: t.projectId,
        title: t.project.name,
        department: t.project.department || "Facility",
        stage: "Engineering",
        status,
        statusLabel,
        targetDate: t.finishDate ? t.finishDate.toISOString().split("T")[0] : null,
        daysRemaining,
        progressPct: t.progressPct,
        type: "ENGINEERING",
      });
    });

    // Map Executions
    executions.forEach((e) => {
      let isOverdue = false;
      let isDueSoon = false;
      let daysRemaining: number | null = null;

      if (e.finishDate) {
        const finish = new Date(e.finishDate);
        daysRemaining = Math.ceil((finish.getTime() - now.getTime()) / (1000 * 3600 * 24));
        if (finish < now) isOverdue = true;
        else if (finish <= in7Days) isDueSoon = true;
      }

      const status = isOverdue ? "overdue" : isDueSoon ? "due-soon" : "in-progress";
      const statusLabel = isOverdue ? "Overdue" : isDueSoon ? "Due Soon" : "On Track";

      allTasks.push({
        id: e.id,
        docId: e.project.purchaseOrder?.poNo || `PRJ-${e.projectId.slice(0, 8)}`,
        projectId: e.projectId,
        title: e.project.name,
        department: e.project.department || "Operations",
        stage: "Project",
        status,
        statusLabel,
        targetDate: e.finishDate ? e.finishDate.toISOString().split("T")[0] : null,
        daysRemaining,
        progressPct: e.progressPct,
        type: "PROJECT",
      });
    });

    // Map PPCs
    ppcRequests.forEach((p) => {
      let isOverdue = false;
      let isDueSoon = false;
      let daysRemaining: number | null = null;

      if (p.targetDate) {
        const finish = new Date(p.targetDate);
        daysRemaining = Math.ceil((finish.getTime() - now.getTime()) / (1000 * 3600 * 24));
        if (finish < now) isOverdue = true;
        else if (finish <= in7Days) isDueSoon = true;
      }

      const status = isOverdue ? "overdue" : isDueSoon ? "due-soon" : "in-progress";
      const statusLabel = isOverdue ? "Overdue" : isDueSoon ? "Due Soon" : "In Intake";

      allTasks.push({
        id: p.id,
        docId: p.requestNo,
        projectId: p.projectId,
        title: p.project.name,
        department: p.project.department || "PPC",
        stage: "PPC",
        status,
        statusLabel,
        targetDate: p.targetDate ? p.targetDate.toISOString().split("T")[0] : null,
        daysRemaining,
        progressPct: p.status === PpcStatus.SUBMITTED ? 50 : 25,
        type: "PPC",
      });
    });

    // Calculate Summary Telemetry
    const totalCount = allTasks.length;
    const overdueCount = allTasks.filter((t) => t.status === "overdue").length;
    const dueSoonCount = allTasks.filter((t) => t.status === "due-soon").length;
    const inProgressCount = allTasks.filter((t) => t.status === "in-progress").length;

    const totalProgress = allTasks.reduce((sum, t) => sum + t.progressPct, 0);
    const avgCompletion = totalCount > 0 ? Math.round(totalProgress / totalCount) : 0;

    // Filter tasks by status tab and stage dropdown
    const filtered = allTasks.filter((t) => {
      let matchStatus = true;
      if (filterStatus === "overdue") matchStatus = t.status === "overdue";
      if (filterStatus === "due-soon") matchStatus = t.status === "due-soon";
      if (filterStatus === "in-progress") matchStatus = t.status === "in-progress";

      let matchStage = true;
      if (filterStage !== "all") {
        matchStage = t.stage.toLowerCase() === filterStage.toLowerCase();
      }

      return matchStatus && matchStage;
    });

    return NextResponse.json({
      tasks: filtered,
      counts: {
        all: totalCount,
        overdue: overdueCount,
        dueSoon: dueSoonCount,
        inProgress: inProgressCount,
      },
      telemetry: {
        avgCompletion,
        attentionRequired: overdueCount + dueSoonCount,
        overdueCount,
        dueSoonCount,
        activeStageLoad: totalCount,
      },
      user: {
        id: user.id,
        fullName: user.fullName,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("My Tasks GET error:", error);
    return NextResponse.json({ error: "Failed to fetch tasks." }, { status: 500 });
  }
}
