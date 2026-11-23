import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { getCurrentUser } from "@/server/auth";
import { PpcStatus, Stage } from "@prisma/client";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, note } = body;

    if (!status || !Object.values(PpcStatus).includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const ppc = await prisma.ppcRequest.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!ppc) {
      return NextResponse.json({ error: "PPC request not found." }, { status: 404 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const oldStatus = ppc.status;
      const res = await tx.ppcRequest.update({
        where: { id },
        data: { status },
      });

      // If approved or completed, advance project stage if needed
      if (status === PpcStatus.APPROVED || status === PpcStatus.COMPLETED) {
        const nextStage = ppc.handoffTo === "To Engineering" ? Stage.ENGINEERING : Stage.PROJECT;
        await tx.project.update({
          where: { id: ppc.projectId },
          data: { currentStage: nextStage },
        });
      }

      await tx.progressUpdate.create({
        data: {
          projectId: ppc.projectId,
          actorId: user.id,
          stage: Stage.PPC,
          oldValue: oldStatus,
          newValue: status,
          note: note || `PPC request status updated to ${status}.`,
        },
      });

      return res;
    });

    return NextResponse.json({ success: true, ppc: updated });
  } catch (error) {
    console.error("Update PPC request error:", error);
    return NextResponse.json(
      { error: "Failed to update PPC request." },
      { status: 500 }
    );
  }
}
