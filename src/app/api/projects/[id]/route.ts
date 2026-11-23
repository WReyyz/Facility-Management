import { NextResponse } from "next/server";
import { prisma } from "@/server/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        creator: {
          select: { id: true, fullName: true, username: true },
        },
        ppcRequest: {
          include: { pic: { select: { id: true, fullName: true } } },
        },
        tenderDocuments: {
          orderBy: { revision: "desc" },
          include: { engineer: { select: { id: true, fullName: true } } },
        },
        purchaseOrder: {
          include: {
            vendor: true,
            paymentStages: { orderBy: { dueDate: "asc" } },
          },
        },
        projectExecution: {
          include: { pic: { select: { id: true, fullName: true } } },
        },
        handover: true,
        attachments: {
          orderBy: { createdAt: "desc" },
          include: { uploader: { select: { fullName: true } } },
        },
        progressUpdates: {
          orderBy: { createdAt: "desc" },
          include: { actor: { select: { fullName: true, username: true } } },
        },
        vendorReviews: {
          include: { reviewer: { select: { fullName: true } } },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    // Format BigInt fields to numbers/strings for clean JSON serialization
    const safePo = project.purchaseOrder
      ? {
          ...project.purchaseOrder,
          amount: Number(project.purchaseOrder.amount),
          paymentStages: project.purchaseOrder.paymentStages.map((ps) => ({
            ...ps,
            amount: Number(ps.amount),
            percentage: Number(ps.percentage),
          })),
        }
      : null;

    const safeHandover = project.handover
      ? {
          ...project.handover,
          retentionPct: project.handover.retentionPct
            ? Number(project.handover.retentionPct)
            : null,
          retentionAmount: project.handover.retentionAmount
            ? Number(project.handover.retentionAmount)
            : null,
        }
      : null;

    const safeAttachments = project.attachments.map((att) => ({
      ...att,
      sizeBytes: att.sizeBytes ? Number(att.sizeBytes) : null,
    }));

    return NextResponse.json({
      project: {
        ...project,
        purchaseOrder: safePo,
        handover: safeHandover,
        attachments: safeAttachments,
      },
    });
  } catch (error) {
    console.error("Fetch single project error:", error);
    return NextResponse.json(
      { error: "Failed to fetch project details." },
      { status: 500 }
    );
  }
}
