import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { getCurrentUser } from "@/server/auth";
import { Stage, HandoverStatus, OverallStatus } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.toLowerCase();
    const status = searchParams.get("status");

    // Fetch projects with handover or completed execution
    const projects = await prisma.project.findMany({
      where: {
        deletedAt: null,
        OR: [
          { currentStage: Stage.OPERATIONS },
          { handover: { isNot: null } },
          { projectExecution: { progressPct: 100 } },
        ],
      },
      include: {
        handover: true,
        purchaseOrder: {
          include: { vendor: true },
        },
        vendorReviews: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const now = new Date();
    const in30Days = new Date(Date.now() + 30 * 24 * 3600 * 1000);

    let inWarrantyCount = 0;
    let expiringSoonCount = 0;
    let retentionHeldSum = BigInt(0);
    let closedCount = 0;

    const formatted = projects.map((p) => {
      const ho = p.handover;
      const po = p.purchaseOrder;
      const review = p.vendorReviews[0] || null;

      const isClosed = ho?.status === HandoverStatus.CLOSED;
      const hasRetention = !ho?.retentionReleasedAt && (ho?.retentionAmount || BigInt(0)) > BigInt(0);

      if (isClosed) {
        closedCount++;
      } else if (ho?.warrantyEnd && new Date(ho.warrantyEnd) > now) {
        inWarrantyCount++;
        if (new Date(ho.warrantyEnd) <= in30Days) {
          expiringSoonCount++;
        }
      }

      if (hasRetention && ho?.retentionAmount) {
        retentionHeldSum += ho.retentionAmount;
      }

      // Check days remaining
      let daysRemaining: number | null = null;
      if (ho?.warrantyEnd) {
        daysRemaining = Math.ceil((new Date(ho.warrantyEnd).getTime() - now.getTime()) / (1000 * 3600 * 24));
      }

      return {
        id: p.id,
        handoverId: ho?.id || null,
        projectName: p.name,
        department: p.department || "—",
        vendorId: po?.vendorId || null,
        vendorName: po?.vendor?.name || "Unassigned",
        poNo: po?.poNo || "—",
        poAmount: po?.amount ? Number(po.amount) : 0,
        bastNo: `BAST-${p.id.slice(0, 8).toUpperCase()}/${p.createdAt.getFullYear()}`,
        handoverDate: ho?.handoverDate,
        warrantyMonths: ho?.warrantyMonths || 12,
        warrantyEnd: ho?.warrantyEnd,
        daysRemaining,
        retentionPct: ho?.retentionPct ? Number(ho.retentionPct) : 5,
        retentionAmount: ho?.retentionAmount ? Number(ho.retentionAmount) : 0,
        retentionReleasedAt: ho?.retentionReleasedAt,
        status: isClosed ? "CLOSED" : ho?.handoverDate ? "WARRANTY" : "HANDED_OVER",
        hasReview: !!review,
        reviewScores: review
          ? {
              technical: Number(review.technicalScore),
              nonTechnical: Number(review.nonTechnicalScore),
            }
          : null,
      };
    });

    const filtered = formatted.filter((item) => {
      const matchQ =
        !q ||
        item.projectName.toLowerCase().includes(q) ||
        item.vendorName.toLowerCase().includes(q) ||
        item.bastNo.toLowerCase().includes(q);

      const matchStatus =
        !status ||
        status === "ALL" ||
        item.status === status;

      return matchQ && matchStatus;
    });

    return NextResponse.json({
      items: filtered,
      stats: {
        inWarranty: inWarrantyCount,
        expiringSoon: expiringSoonCount,
        retentionHeld: Number(retentionHeldSum),
        closed: closedCount,
      },
    });
  } catch (error) {
    console.error("Operations API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch operations data." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    // Action 1: Record Handover & BAST
    if (action === "RECORD_HANDOVER") {
      const {
        projectId,
        bastNo,
        handoverDate,
        warrantyMonths,
        retentionPct,
      } = body;

      if (!projectId || !handoverDate) {
        return NextResponse.json({ error: "Project and Handover Date required" }, { status: 400 });
      }

      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { purchaseOrder: true },
      });

      if (!project) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
      }

      const months = parseInt(warrantyMonths) || 12;
      const hDate = new Date(handoverDate);
      const wEnd = new Date(hDate);
      wEnd.setMonth(wEnd.getMonth() + months);

      const poAmount = project.purchaseOrder?.amount || BigInt(0);
      const rPct = parseFloat(retentionPct) || 5;
      const rAmount = BigInt(Math.round((Number(poAmount) * rPct) / 100));

      const result = await prisma.$transaction(async (tx) => {
        const effectiveBastNo = bastNo?.trim() || `BAST-${project.id.slice(0, 8).toUpperCase()}/${new Date().getFullYear()}`;

        const ho = await tx.handover.upsert({
          where: { projectId },
          update: {
            handoverDate: hDate,
            warrantyMonths: months,
            warrantyEnd: wEnd,
            retentionPct: rPct,
            retentionAmount: rAmount,
            status: HandoverStatus.WARRANTY,
          },
          create: {
            projectId,
            handoverDate: hDate,
            warrantyMonths: months,
            warrantyEnd: wEnd,
            retentionPct: rPct,
            retentionAmount: rAmount,
            status: HandoverStatus.WARRANTY,
          },
        });

        // Advance project to Stage OPERATIONS
        await tx.project.update({
          where: { id: projectId },
          data: { currentStage: Stage.OPERATIONS },
        });

        // Audit Trail
        await tx.progressUpdate.create({
          data: {
            projectId,
            actorId: user.id,
            stage: Stage.OPERATIONS,
            oldValue: "In Execution",
            newValue: "HANDED_OVER",
            note: `Project officially handed over. BAST: ${effectiveBastNo}. Warranty valid until ${wEnd.toISOString().split("T")[0]}.`,
          },
        });

        return ho;
      });

      return NextResponse.json({
        success: true,
        handover: {
          ...result,
          retentionAmount: result.retentionAmount ? Number(result.retentionAmount) : null,
        },
      });
    }

    // Action 2: Release Retention
    if (action === "RELEASE_RETENTION") {
      const { projectId } = body;
      if (!projectId) {
        return NextResponse.json({ error: "Project ID required" }, { status: 400 });
      }

      const result = await prisma.$transaction(async (tx) => {
        const ho = await tx.handover.update({
          where: { projectId },
          data: {
            retentionReleasedAt: new Date(),
            status: HandoverStatus.CLOSED,
          },
        });

        await tx.project.update({
          where: { id: projectId },
          data: {
            overallStatus: OverallStatus.COMPLETED,
          },
        });

        await tx.progressUpdate.create({
          data: {
            projectId,
            actorId: user.id,
            stage: Stage.OPERATIONS,
            oldValue: "WARRANTY",
            newValue: "CLOSED",
            note: "Retention bond released. Project closed with full completion.",
          },
        });

        return ho;
      });

      return NextResponse.json({
        success: true,
        handover: {
          ...result,
          retentionAmount: result.retentionAmount ? Number(result.retentionAmount) : null,
        },
      });
    }

    // Action 3: Review Vendor KPI
    if (action === "VENDOR_REVIEW") {
      const { projectId, vendorId, technicalScore, nonTechnicalScore, notes } = body;

      if (!vendorId || technicalScore === undefined || nonTechnicalScore === undefined) {
        return NextResponse.json({ error: "Vendor and scores required" }, { status: 400 });
      }

      const tScore = parseFloat(technicalScore);
      const ntScore = parseFloat(nonTechnicalScore);

      if (isNaN(tScore) || tScore < 0 || tScore > 100 || isNaN(ntScore) || ntScore < 0 || ntScore > 100) {
        return NextResponse.json({ error: "Scores must be between 0 and 100" }, { status: 400 });
      }

      const review = await prisma.$transaction(async (tx) => {
        const rev = await tx.vendorReview.create({
          data: {
            projectId: projectId || null,
            vendorId,
            reviewerId: user.id,
            technicalScore: tScore,
            nonTechnicalScore: ntScore,
            notes: notes?.trim() || null,
          },
        });

        if (projectId) {
          await tx.progressUpdate.create({
            data: {
              projectId,
              actorId: user.id,
              stage: Stage.OPERATIONS,
              oldValue: "Unrated",
              newValue: `Score: ${Math.round(tScore * 0.6 + ntScore * 0.4)}%`,
              note: `Vendor performance review submitted. Tech: ${tScore}, Non-Tech: ${ntScore}.`,
            },
          });
        }

        return rev;
      });

      return NextResponse.json({
        success: true,
        review: {
          ...review,
          technicalScore: Number(review.technicalScore),
          nonTechnicalScore: Number(review.nonTechnicalScore),
        },
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Operations POST error:", error);
    return NextResponse.json(
      { error: "Failed to process operations request." },
      { status: 500 }
    );
  }
}
