import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { getCurrentUser } from "@/server/auth";
import { Stage, ProjectExecutionStatus, PaymentStageStatus, OverallStatus } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.toLowerCase();
    const status = searchParams.get("status");

    // Fetch projects with projectExecution or PO
    const projects = await prisma.project.findMany({
      where: {
        deletedAt: null,
        OR: [
          { currentStage: { in: [Stage.PROJECT, Stage.OPERATIONS] } },
          { projectExecution: { isNot: null } },
        ],
      },
      include: {
        projectExecution: {
          include: { pic: true },
        },
        purchaseOrder: {
          include: {
            vendor: true,
            paymentStages: { orderBy: { dueDate: "asc" } },
          },
        },
        progressUpdates: {
          where: { stage: Stage.PROJECT },
          orderBy: { createdAt: "desc" },
          take: 3,
          include: { actor: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    let totalPoValue = BigInt(0);
    let settledPaymentsValue = BigInt(0);
    let activeExecCount = 0;
    let totalProgressSum = 0;

    const formatted = projects.map((p) => {
      const exec = p.projectExecution;
      const po = p.purchaseOrder;

      const progressPct = exec?.progressPct || 0;
      totalProgressSum += progressPct;

      if (exec?.status !== ProjectExecutionStatus.COMPLETED) {
        activeExecCount++;
      }

      if (po?.amount) {
        totalPoValue += po.amount;
      }

      const stages = (po?.paymentStages || []).map((st) => {
        const isPaid = st.status === PaymentStageStatus.PAID || !!st.paidAt;
        if (isPaid) {
          settledPaymentsValue += st.amount;
        }
        return {
          id: st.id,
          name: st.name,
          percentage: Number(st.percentage),
          amount: Number(st.amount),
          dueDate: st.dueDate,
          paidAt: st.paidAt,
          status: st.status,
        };
      });

      return {
        id: p.id,
        executionId: exec?.id || null,
        projectName: p.name,
        department: p.department || "—",
        poNo: po?.poNo || "—",
        poAmount: po?.amount ? Number(po.amount) : 0,
        vendorName: po?.vendor?.name || "Unassigned",
        picName: exec?.pic?.fullName || "Unassigned",
        startDate: exec?.startDate,
        finishDate: exec?.finishDate,
        progressPct,
        status: exec?.status || ProjectExecutionStatus.NOT_STARTED,
        paymentStages: stages,
      };
    });

    const filtered = formatted.filter((item) => {
      const matchQ =
        !q ||
        item.projectName.toLowerCase().includes(q) ||
        item.poNo.toLowerCase().includes(q) ||
        item.vendorName.toLowerCase().includes(q) ||
        item.picName.toLowerCase().includes(q);

      const matchStatus =
        !status ||
        status === "all" ||
        (status === "In Progress" && item.status === ProjectExecutionStatus.IN_PROGRESS) ||
        (status === "Completed" && item.status === ProjectExecutionStatus.COMPLETED);

      return matchQ && matchStatus;
    });

    const avgProgress =
      formatted.length > 0 ? Math.round(totalProgressSum / formatted.length) : 0;

    return NextResponse.json({
      items: filtered,
      stats: {
        activeExecutions: activeExecCount,
        avgProgress,
        totalPoValue: Number(totalPoValue),
        settledPayments: Number(settledPaymentsValue),
      },
    });
  } catch (error) {
    console.error("Project execution API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch project execution data." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    // Action 1: Update Physical Progress (with BR-09 Decreasing Progress check)
    if (action === "UPDATE_PROGRESS") {
      const { projectId, progressPct, note } = body;

      if (!projectId || progressPct === undefined || progressPct === null) {
        return NextResponse.json({ error: "Project and progress percentage required" }, { status: 400 });
      }

      const newPct = parseInt(progressPct);
      if (isNaN(newPct) || newPct < 0 || newPct > 100) {
        return NextResponse.json({ error: "Progress must be between 0 and 100" }, { status: 400 });
      }

      // Check current progress for rule BR-09
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { projectExecution: true },
      });

      if (!project) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
      }

      const currentPct = project.projectExecution?.progressPct || 0;

      // BR-09 Rule: Decreasing progress requires an explanation note
      if (newPct < currentPct && !note?.trim()) {
        return NextResponse.json(
          { error: "Decreasing progress requires an explanation note (BR-09)." },
          { status: 400 }
        );
      }

      let newStatus: ProjectExecutionStatus = ProjectExecutionStatus.IN_PROGRESS;
      if (newPct === 0) newStatus = ProjectExecutionStatus.NOT_STARTED;
      if (newPct === 100) newStatus = ProjectExecutionStatus.COMPLETED;

      const result = await prisma.$transaction(async (tx) => {
        const exec = await tx.projectExecution.upsert({
          where: { projectId },
          update: {
            progressPct: newPct,
            status: newStatus,
          },
          create: {
            projectId,
            progressPct: newPct,
            status: newStatus,
          },
        });

        // Audit Trail
        await tx.progressUpdate.create({
          data: {
            projectId,
            actorId: user.id,
            stage: Stage.PROJECT,
            oldValue: String(currentPct),
            newValue: String(newPct),
            note: note?.trim() || `Progress updated to ${newPct}%.`,
          },
        });

        // If completed, ensure Handover record exists
        if (newPct === 100) {
          await tx.handover.upsert({
            where: { projectId },
            update: {},
            create: {
              projectId,
              warrantyMonths: 12,
            },
          });
        }

        return exec;
      });

      return NextResponse.json({ success: true, execution: result });
    }

    // Action 2: Update Payment Stage Status (mark as PAID)
    if (action === "UPDATE_PAYMENT_STAGE") {
      const { stageId, status: newStatus } = body;
      if (!stageId || !newStatus) {
        return NextResponse.json({ error: "Stage ID and status required" }, { status: 400 });
      }

      const updated = await prisma.paymentStage.update({
        where: { id: stageId },
        data: {
          status: newStatus,
          paidAt: newStatus === PaymentStageStatus.PAID ? new Date() : null,
        },
      });

      return NextResponse.json({
        success: true,
        stage: {
          ...updated,
          amount: Number(updated.amount),
        },
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Project execution PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update project execution." },
      { status: 500 }
    );
  }
}
