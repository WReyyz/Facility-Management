import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db";
import { getCurrentUser } from "@/server/auth";
import { EngineeringStatus, Stage } from "@prisma/client";

const updateProgressSchema = z.object({
  progressPct: z
    .number()
    .min(0, "Progress must be at least 0%")
    .max(100, "Progress cannot exceed 100%"),
  note: z.string().optional().nullable(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ENGINEERING" && user.role !== "ADMIN")) {
      return NextResponse.json(
        { error: "Unauthorized: only ENGINEERING or ADMIN can update progress." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = updateProgressSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid progress value" },
        { status: 400 }
      );
    }

    const { progressPct, note } = parsed.data;

    // 1. Fetch current tender document
    const tender = await prisma.tenderDocument.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!tender) {
      return NextResponse.json(
        { error: "Tender document not found." },
        { status: 404 }
      );
    }

    // BR-09: Progres only increases, unless with correction note
    const oldPct = tender.progressPct;
    if (progressPct < oldPct && (!note || note.trim().length === 0)) {
      return NextResponse.json(
        {
          error:
            "Decreasing progress requires an explanatory note explaining the correction.",
        },
        { status: 400 }
      );
    }

    // Determine status transition
    let newStatus: EngineeringStatus = tender.status;
    if (progressPct === 100) {
      newStatus = EngineeringStatus.COMPLETED;
    } else if (progressPct > 0) {
      newStatus = EngineeringStatus.IN_PROGRESS;
    } else {
      newStatus = EngineeringStatus.NOT_STARTED;
    }

    // 2. Update tender document in DB
    const updated = await prisma.tenderDocument.update({
      where: { id },
      data: {
        progressPct,
        status: newStatus,
      },
      include: {
        project: true,
        engineer: true,
      },
    });

    // 3. Record history in progress_updates
    await prisma.progressUpdate.create({
      data: {
        projectId: tender.projectId,
        stage: Stage.ENGINEERING,
        oldValue: `${oldPct}% (${tender.status})`,
        newValue: `${progressPct}% (${newStatus})`,
        note: note?.trim() || `Progress updated from ${oldPct}% to ${progressPct}%`,
        actorId: user.id,
      },
    });

    return NextResponse.json({
      success: true,
      tenderDoc: updated,
    });
  } catch (error) {
    console.error("Update progress error:", error);
    return NextResponse.json(
      { error: "Failed to update progress." },
      { status: 500 }
    );
  }
}
