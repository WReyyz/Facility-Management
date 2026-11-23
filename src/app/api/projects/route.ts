import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { Stage, OverallStatus } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.toLowerCase();
    const stage = searchParams.get("stage") as Stage | null;
    const status = searchParams.get("status") as OverallStatus | null;

    const where: any = {
      deletedAt: null,
    };

    if (q) {
      where.OR = [
        { name: { contains: q } },
        { department: { contains: q } },
        { ppcRequest: { requestNo: { contains: q } } },
        { ppcRequest: { letterNo: { contains: q } } },
        { tenderDocuments: { some: { tenderNo: { contains: q } } } },
        { purchaseOrder: { poNo: { contains: q } } },
        { purchaseOrder: { vendor: { name: { contains: q } } } },
      ];
    }

    if (stage && Object.values(Stage).includes(stage)) {
      where.currentStage = stage;
    }

    if (status && Object.values(OverallStatus).includes(status)) {
      where.overallStatus = status;
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        creator: {
          select: { id: true, fullName: true, username: true },
        },
        ppcRequest: {
          include: { pic: { select: { fullName: true } } },
        },
        tenderDocuments: {
          orderBy: { revision: "desc" },
          take: 1,
          include: { engineer: { select: { fullName: true } } },
        },
        purchaseOrder: {
          include: {
            vendor: { select: { id: true, name: true, category: true } },
            paymentStages: true,
          },
        },
        projectExecution: {
          include: { pic: { select: { fullName: true } } },
        },
        handover: true,
        progressUpdates: {
          orderBy: { createdAt: "desc" },
          take: 5,
          include: { actor: { select: { fullName: true, username: true } } },
        },
        _count: {
          select: {
            progressUpdates: true,
            attachments: true,
            tenderInvitations: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Format for easy stepper display on client
    const formatted = projects.map((p) => {
      const tender = p.tenderDocuments[0] || null;
      const po = p.purchaseOrder || null;
      const exec = p.projectExecution || null;
      const ppc = p.ppcRequest || null;

      // Calculate progress percentage of completed stages
      let completedStages = 0;
      if (ppc?.status === "COMPLETED") completedStages++;
      if (tender?.status === "COMPLETED") completedStages++;
      if (po?.status === "PO_ISSUED") completedStages++;
      if (exec?.status === "COMPLETED") completedStages++;
      if (p.handover?.status === "CLOSED") completedStages++;

      const stageProgressPct = Math.round((completedStages / 5) * 100);

      return {
        id: p.id,
        name: p.name,
        department: p.department || "—",
        currentStage: p.currentStage,
        overallStatus: p.overallStatus,
        createdAt: p.createdAt,
        stageProgressPct,
        ppc: ppc
          ? {
              requestNo: ppc.requestNo,
              typeCode: ppc.typeCode || "TC",
              picName: ppc.pic?.fullName || "—",
              targetDate: ppc.targetDate,
              handoffTo: ppc.handoffTo || "To Project",
              status: ppc.status,
            }
          : null,
        engineering: tender
          ? {
              tenderNo: tender.tenderNo,
              engineerName: tender.engineer?.fullName || "—",
              startDate: tender.startDate,
              finishDate: tender.finishDate,
              workingDays: tender.workingDays,
              progressPct: tender.progressPct,
              status: tender.status,
            }
          : null,
        procurement: po
          ? {
              poNo: po.poNo,
              vendorName: po.vendor?.name || "—",
              amount: Number(po.amount),
              issuedAt: po.issuedAt,
              status: po.status,
              vendorCount: p._count.tenderInvitations || 1,
            }
          : null,
        project: exec
          ? {
              picName: exec.pic?.fullName || "—",
              startDate: exec.startDate,
              finishDate: exec.finishDate,
              progressPct: exec.progressPct,
              status: exec.status,
            }
          : null,
        handover: p.handover
          ? {
              handoverDate: p.handover.handoverDate,
              warrantyEnd: p.handover.warrantyEnd,
              status: p.handover.status,
            }
          : null,
        recentUpdates: p.progressUpdates.map((u) => ({
          id: u.id,
          stage: u.stage,
          oldValue: u.oldValue,
          newValue: u.newValue,
          note: u.note,
          actorName: u.actor.fullName,
          createdAt: u.createdAt,
        })),
        historyCount: p._count.progressUpdates,
        attachmentsCount: p._count.attachments,
      };
    });

    return NextResponse.json({ projects: formatted });
  } catch (error) {
    console.error("Fetch projects error:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects." },
      { status: 500 }
    );
  }
}
