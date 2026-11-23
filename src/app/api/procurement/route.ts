import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { getCurrentUser } from "@/server/auth";
import { Stage, ProcurementStatus, PaymentStageStatus, ProjectExecutionStatus } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.toLowerCase();
    const status = searchParams.get("status");

    // Fetch projects that are in procurement or have tender/PO
    const projects = await prisma.project.findMany({
      where: {
        deletedAt: null,
        OR: [
          { currentStage: Stage.PROCUREMENT },
          { tenderDocuments: { some: {} } },
          { purchaseOrder: { isNot: null } },
        ],
      },
      include: {
        tenderDocuments: {
          orderBy: { revision: "desc" },
          take: 1,
        },
        tenderInvitations: {
          include: {
            vendor: {
              include: {
                vendorReviews: true,
              },
            },
          },
        },
        purchaseOrder: {
          include: {
            vendor: true,
            paymentStages: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const scoreConfig = await prisma.scoreConfig.findFirst({
      orderBy: { id: "desc" },
    });
    const threshold = scoreConfig?.threshold ? Number(scoreConfig.threshold) : 70;
    const techWeight = scoreConfig?.technicalWeight ? Number(scoreConfig.technicalWeight) : 0.6;
    const nonTechWeight = scoreConfig?.nonTechnicalWeight ? Number(scoreConfig.nonTechnicalWeight) : 0.4;

    let totalPoAmount = BigInt(0);
    let poIssuedCount = 0;
    let evaluationCount = 0;
    let activeTendersCount = 0;

    const formatted = projects.map((p) => {
      const tender = p.tenderDocuments[0] || null;
      const po = p.purchaseOrder || null;

      // Status resolution
      let procStatus = "Vendors Invited";
      if (po?.status === ProcurementStatus.PO_ISSUED) {
        procStatus = "PO Issued";
        poIssuedCount++;
        totalPoAmount += po.amount;
      } else if (p.tenderInvitations.some((i) => i.isWinner)) {
        procStatus = "Winner Selected";
        evaluationCount++;
      } else if (p.tenderInvitations.some((i) => i.bidAmount !== null)) {
        procStatus = "Evaluation";
        evaluationCount++;
      } else {
        activeTendersCount++;
      }

      // Calculate invited vendors eligibility
      let eligibleCount = 0;
      const invitedVendors = p.tenderInvitations.map((inv) => {
        let finalScore: number | null = null;
        if (inv.vendor.vendorReviews.length > 0) {
          const avgTech =
            inv.vendor.vendorReviews.reduce((sum, r) => sum + Number(r.technicalScore), 0) /
            inv.vendor.vendorReviews.length;
          const avgNonTech =
            inv.vendor.vendorReviews.reduce((sum, r) => sum + Number(r.nonTechnicalScore), 0) /
            inv.vendor.vendorReviews.length;
          finalScore = avgTech * techWeight + avgNonTech * nonTechWeight;
        }

        const isEligible = finalScore !== null && finalScore >= threshold;
        if (isEligible) eligibleCount++;

        return {
          id: inv.id,
          vendorId: inv.vendorId,
          vendorName: inv.vendor.name,
          category: inv.vendor.category,
          bidAmount: inv.bidAmount ? Number(inv.bidAmount) : null,
          isWinner: inv.isWinner,
          score: finalScore !== null ? Math.round(finalScore) : null,
          isEligible,
        };
      });

      const winnerVendor =
        po?.vendor?.name ||
        invitedVendors.find((i) => i.isWinner)?.vendorName ||
        null;

      return {
        id: p.id,
        projectName: p.name,
        department: p.department || "—",
        tenderNo: tender?.tenderNo || `TDR-${p.createdAt.getFullYear()}-${p.id.slice(0, 4)}`,
        tenderId: tender?.id || null,
        invitedCount: invitedVendors.length,
        eligibleCount,
        invitedVendors,
        winnerVendor,
        poNo: po?.poNo || null,
        poAmount: po?.amount ? Number(po.amount) : null,
        paymentStagesCount: po?.paymentStages?.length || 0,
        status: procStatus,
      };
    });

    // Apply filtering
    const filtered = formatted.filter((item) => {
      const matchQ =
        !q ||
        item.projectName.toLowerCase().includes(q) ||
        item.tenderNo.toLowerCase().includes(q) ||
        (item.poNo && item.poNo.toLowerCase().includes(q)) ||
        (item.winnerVendor && item.winnerVendor.toLowerCase().includes(q));

      const matchStatus = !status || status === "all" || item.status === status;
      return matchQ && matchStatus;
    });

    return NextResponse.json({
      items: filtered,
      stats: {
        activeTenders: activeTendersCount,
        inEvaluation: evaluationCount,
        poIssuedThisMonth: poIssuedCount,
        totalPoValue: Number(totalPoAmount),
      },
    });
  } catch (error) {
    console.error("Procurement API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch procurement data." },
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

    // Action 1: Invite Vendor
    if (action === "INVITE_VENDOR") {
      const { projectId, vendorId, bidAmount } = body;
      if (!projectId || !vendorId) {
        return NextResponse.json({ error: "Project and Vendor required" }, { status: 400 });
      }

      const invitation = await prisma.tenderInvitation.upsert({
        where: {
          projectId_vendorId: { projectId, vendorId },
        },
        update: {
          bidAmount: bidAmount ? BigInt(bidAmount) : null,
        },
        create: {
          projectId,
          vendorId,
          bidAmount: bidAmount ? BigInt(bidAmount) : null,
        },
      });

      return NextResponse.json({ success: true, invitation: { ...invitation, bidAmount: bidAmount ? Number(bidAmount) : null } });
    }

    // Action 2: Issue PO & Staged Payments
    if (action === "ISSUE_PO") {
      const { projectId, vendorId, poNo, amount, paymentStages } = body;

      if (!projectId || !vendorId || !poNo?.trim() || !amount) {
        return NextResponse.json({ error: "Missing required PO fields" }, { status: 400 });
      }

      // Validate payment stages sum = 100%
      if (Array.isArray(paymentStages) && paymentStages.length > 0) {
        const sumPct = paymentStages.reduce(
          (sum: number, s: { percentage: number }) => sum + Number(s.percentage),
          0
        );
        if (Math.round(sumPct) !== 100) {
          return NextResponse.json(
            { error: `Payment stages must sum to exactly 100% (currently ${sumPct}%).` },
            { status: 400 }
          );
        }
      }

      const result = await prisma.$transaction(async (tx) => {
        // Mark winner
        await tx.tenderInvitation.updateMany({
          where: { projectId },
          data: { isWinner: false },
        });

        await tx.tenderInvitation.upsert({
          where: { projectId_vendorId: { projectId, vendorId } },
          update: { isWinner: true },
          create: { projectId, vendorId, isWinner: true, bidAmount: BigInt(amount) },
        });

        // Create or update PurchaseOrder
        const po = await tx.purchaseOrder.upsert({
          where: { projectId },
          update: {
            vendorId,
            poNo: poNo.trim(),
            amount: BigInt(amount),
            issuedAt: new Date(),
            status: ProcurementStatus.PO_ISSUED,
          },
          create: {
            projectId,
            vendorId,
            poNo: poNo.trim(),
            amount: BigInt(amount),
            issuedAt: new Date(),
            status: ProcurementStatus.PO_ISSUED,
          },
        });

        // Delete old stages if any and recreate
        await tx.paymentStage.deleteMany({ where: { poId: po.id } });

        if (Array.isArray(paymentStages) && paymentStages.length > 0) {
          for (const st of paymentStages) {
            const stAmount = Math.round((Number(amount) * Number(st.percentage)) / 100);
            await tx.paymentStage.create({
              data: {
                poId: po.id,
                name: st.name || "Termin",
                percentage: Number(st.percentage),
                amount: BigInt(stAmount),
                dueDate: st.dueDate ? new Date(st.dueDate) : null,
                status: PaymentStageStatus.PLANNED,
              },
            });
          }
        }

        // Advance Project to Stage PROJECT & ensure ProjectExecution exists
        await tx.project.update({
          where: { id: projectId },
          data: { currentStage: Stage.PROJECT },
        });

        await tx.projectExecution.upsert({
          where: { projectId },
          update: {
            status: ProjectExecutionStatus.IN_PROGRESS,
          },
          create: {
            projectId,
            status: ProjectExecutionStatus.IN_PROGRESS,
            progressPct: 0,
          },
        });

        // Audit Trail
        await tx.progressUpdate.create({
          data: {
            projectId,
            actorId: user.id,
            stage: Stage.PROCUREMENT,
            oldValue: "Evaluation",
            newValue: "PO_ISSUED",
            note: `PO ${poNo} issued to vendor. Total value: Rp ${Number(amount).toLocaleString("id-ID")}`,
          },
        });

        return po;
      });

      return NextResponse.json({ success: true, poId: result.id });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Procurement POST error:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Purchase Order number (PO No.) already exists. Must be unique." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to process procurement operation." },
      { status: 500 }
    );
  }
}
