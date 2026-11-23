import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import {
  Stage,
  PpcStatus,
  EngineeringStatus,
  ProcurementStatus,
  ProjectExecutionStatus,
  HandoverStatus,
} from "@prisma/client";

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sevenDaysLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    sevenDaysLater.setHours(23, 59, 59, 999);

    // 1. Fetch Stage Cards Counts in parallel
    const [
      ppcTotal,
      ppcCompleted,
      engTotal,
      engCompleted,
      poTotal,
      poCompleted,
      execTotal,
      execCompleted,
      opsTotal,
      opsCompleted,
      projectsByStage,
      vendorsWithReviews,
      scoreConfig,
      ppcOverdue,
      engOverdue,
      execOverdue,
      ppcDueSoon,
      engDueSoon,
      execDueSoon,
    ] = await Promise.all([
      // PPC
      prisma.ppcRequest.count(),
      prisma.ppcRequest.count({ where: { status: PpcStatus.COMPLETED } }),
      // Engineering
      prisma.tenderDocument.count(),
      prisma.tenderDocument.count({
        where: { status: EngineeringStatus.COMPLETED },
      }),
      // Procurement
      prisma.purchaseOrder.count(),
      prisma.purchaseOrder.count({
        where: { status: ProcurementStatus.PO_ISSUED },
      }),
      // Project / Execution
      prisma.projectExecution.count(),
      prisma.projectExecution.count({
        where: { status: ProjectExecutionStatus.COMPLETED },
      }),
      // Operations
      prisma.handover.count(),
      prisma.handover.count({ where: { status: HandoverStatus.CLOSED } }),

      // Project Flow (distribution by current_stage)
      prisma.project.groupBy({
        by: ["currentStage"],
        where: { deletedAt: null },
        _count: { id: true },
      }),

      // Vendors & Scores
      prisma.vendor.findMany({
        where: { isActive: true },
        include: {
          vendorReviews: {
            select: { technicalScore: true, nonTechnicalScore: true },
          },
        },
      }),
      prisma.scoreConfig.findUnique({ where: { id: 1 } }),

      // Overdue Items
      prisma.ppcRequest.findMany({
        where: {
          status: { not: PpcStatus.COMPLETED },
          targetDate: { lt: today },
        },
        include: { project: true, pic: true },
      }),
      prisma.tenderDocument.findMany({
        where: {
          status: { not: EngineeringStatus.COMPLETED },
          finishDate: { lt: today },
        },
        include: { project: true, engineer: true },
      }),
      prisma.projectExecution.findMany({
        where: {
          status: { not: ProjectExecutionStatus.COMPLETED },
          finishDate: { lt: today },
        },
        include: { project: true, pic: true },
      }),

      // Due Soon (≤ 7 days)
      prisma.ppcRequest.findMany({
        where: {
          status: { not: PpcStatus.COMPLETED },
          targetDate: { gte: today, lte: sevenDaysLater },
        },
        include: { project: true, pic: true },
      }),
      prisma.tenderDocument.findMany({
        where: {
          status: { not: EngineeringStatus.COMPLETED },
          finishDate: { gte: today, lte: sevenDaysLater },
        },
        include: { project: true, engineer: true },
      }),
      prisma.projectExecution.findMany({
        where: {
          status: { not: ProjectExecutionStatus.COMPLETED },
          finishDate: { gte: today, lte: sevenDaysLater },
        },
        include: { project: true, pic: true },
      }),
    ]);

    // Format 5 Stage Cards
    const statCards = [
      {
        stage: "PPC Requests",
        active: ppcTotal - ppcCompleted,
        total: ppcTotal,
        completed: ppcCompleted,
        pct: ppcTotal > 0 ? Math.round((ppcCompleted / ppcTotal) * 100) : 0,
      },
      {
        stage: "Engineering",
        active: engTotal - engCompleted,
        total: engTotal,
        completed: engCompleted,
        pct: engTotal > 0 ? Math.round((engCompleted / engTotal) * 100) : 0,
      },
      {
        stage: "Procurement",
        active: poTotal - poCompleted,
        total: poTotal,
        completed: poCompleted,
        pct: poTotal > 0 ? Math.round((poCompleted / poTotal) * 100) : 0,
      },
      {
        stage: "Project",
        active: execTotal - execCompleted,
        total: execTotal,
        completed: execCompleted,
        pct: execTotal > 0 ? Math.round((execCompleted / execTotal) * 100) : 0,
      },
      {
        stage: "Operations",
        active: opsTotal - opsCompleted,
        total: opsTotal,
        completed: opsCompleted,
        pct: opsTotal > 0 ? Math.round((opsCompleted / opsTotal) * 100) : 0,
      },
    ];

    // Format Project Flow
    const stageCounts: Record<Stage, number> = {
      PPC: 0,
      ENGINEERING: 0,
      PROCUREMENT: 0,
      PROJECT: 0,
      OPERATIONS: 0,
    };
    projectsByStage.forEach((p) => {
      stageCounts[p.currentStage] = p._count.id;
    });

    const projectFlow = [
      { stage: "PPC Request", count: stageCounts.PPC },
      { stage: "Engineering", count: stageCounts.ENGINEERING },
      { stage: "Procurement", count: stageCounts.PROCUREMENT },
      { stage: "Project Execution", count: stageCounts.PROJECT },
      { stage: "Operations & Handover", count: stageCounts.OPERATIONS },
    ];

    // Compute Vendor Readiness
    const techWeight = scoreConfig ? Number(scoreConfig.technicalWeight) : 0.6;
    const nonTechWeight = scoreConfig ? Number(scoreConfig.nonTechnicalWeight) : 0.4;
    const threshold = scoreConfig ? Number(scoreConfig.threshold) : 70.0;

    let eligibleCount = 0;
    let notEligibleCount = 0;
    let notRatedCount = 0;

    vendorsWithReviews.forEach((v) => {
      if (v.vendorReviews.length === 0) {
        notRatedCount++;
        return;
      }
      const sumTech = v.vendorReviews.reduce(
        (acc, r) => acc + Number(r.technicalScore),
        0
      );
      const sumNonTech = v.vendorReviews.reduce(
        (acc, r) => acc + Number(r.nonTechnicalScore),
        0
      );
      const avgTech = sumTech / v.vendorReviews.length;
      const avgNonTech = sumNonTech / v.vendorReviews.length;
      const total = avgTech * techWeight + avgNonTech * nonTechWeight;

      if (total >= threshold) eligibleCount++;
      else notEligibleCount++;
    });

    // Format Overdue Items
    const overdueItems = [
      ...ppcOverdue.map((p) => ({
        id: p.id,
        projectId: p.projectId,
        projectName: p.project.name,
        stage: "PPC",
        picName: p.pic?.fullName || "Unassigned",
        targetDate: p.targetDate,
        daysOverdue: Math.ceil((today.getTime() - new Date(p.targetDate).getTime()) / (1000 * 3600 * 24)),
      })),
      ...engOverdue.map((td) => ({
        id: td.id,
        projectId: td.projectId,
        projectName: td.project.name,
        stage: "Engineering",
        picName: td.engineer?.fullName || "Unassigned",
        targetDate: td.finishDate!,
        daysOverdue: Math.ceil((today.getTime() - new Date(td.finishDate!).getTime()) / (1000 * 3600 * 24)),
      })),
      ...execOverdue.map((e) => ({
        id: e.id,
        projectId: e.projectId,
        projectName: e.project.name,
        stage: "Project Execution",
        picName: e.pic?.fullName || "Unassigned",
        targetDate: e.finishDate!,
        daysOverdue: Math.ceil((today.getTime() - new Date(e.finishDate!).getTime()) / (1000 * 3600 * 24)),
      })),
    ];

    // Format Due Soon Items (≤ 7 days)
    const dueSoonItems = [
      ...ppcDueSoon.map((p) => ({
        id: p.id,
        projectId: p.projectId,
        projectName: p.project.name,
        stage: "PPC",
        picName: p.pic?.fullName || "Unassigned",
        targetDate: p.targetDate,
        daysRemaining: Math.ceil((new Date(p.targetDate).getTime() - today.getTime()) / (1000 * 3600 * 24)),
      })),
      ...engDueSoon.map((td) => ({
        id: td.id,
        projectId: td.projectId,
        projectName: td.project.name,
        stage: "Engineering",
        picName: td.engineer?.fullName || "Unassigned",
        targetDate: td.finishDate!,
        daysRemaining: Math.ceil((new Date(td.finishDate!).getTime() - today.getTime()) / (1000 * 3600 * 24)),
      })),
      ...execDueSoon.map((e) => ({
        id: e.id,
        projectId: e.projectId,
        projectName: e.project.name,
        stage: "Project Execution",
        picName: e.pic?.fullName || "Unassigned",
        targetDate: e.finishDate!,
        daysRemaining: Math.ceil((new Date(e.finishDate!).getTime() - today.getTime()) / (1000 * 3600 * 24)),
      })),
    ];

    return NextResponse.json({
      statCards,
      projectFlow,
      vendorReadiness: {
        eligible: eligibleCount,
        notEligible: notEligibleCount,
        notRated: notRatedCount,
        total: vendorsWithReviews.length,
      },
      overdueItems,
      dueSoonItems,
      updatedAt: new Date().toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    });
  } catch (error) {
    console.error("Dashboard metrics error:", error);
    return NextResponse.json(
      { error: "Failed to compute dashboard metrics." },
      { status: 500 }
    );
  }
}
