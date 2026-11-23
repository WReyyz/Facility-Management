import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { getCurrentUser } from "@/server/auth";
import { generateDocNumber } from "@/server/sequences";
import { PpcStatus, Stage } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.toLowerCase();
    const status = searchParams.get("status") as PpcStatus | null;
    const year = searchParams.get("year");

    const where: any = {};

    if (q) {
      where.OR = [
        { requestNo: { contains: q } },
        { letterNo: { contains: q } },
        { typeCode: { contains: q } },
        { project: { name: { contains: q } } },
        { project: { department: { contains: q } } },
        { pic: { fullName: { contains: q } } },
      ];
    }

    if (status && Object.values(PpcStatus).includes(status)) {
      where.status = status;
    }

    if (year) {
      const yr = parseInt(year);
      if (!isNaN(yr)) {
        where.requestNo = { contains: `/${yr}` };
      }
    }

    const [requests, totalCount, submittedCount, approvedCount, completedCount] =
      await Promise.all([
        prisma.ppcRequest.findMany({
          where,
          include: {
            project: { select: { id: true, name: true, department: true } },
            pic: { select: { id: true, fullName: true, username: true } },
          },
          orderBy: { project: { createdAt: "desc" } },
        }),
        prisma.ppcRequest.count(),
        prisma.ppcRequest.count({
          where: { status: PpcStatus.SUBMITTED },
        }),
        prisma.ppcRequest.count({ where: { status: PpcStatus.APPROVED } }),
        prisma.ppcRequest.count({ where: { status: PpcStatus.COMPLETED } }),
      ]);

    const formatted = requests.map((req) => ({
      id: req.id,
      projectId: req.projectId,
      requestNo: req.requestNo,
      projectName: req.project.name,
      department: req.project.department || "—",
      letterNo: req.letterNo || "—",
      letterDate: req.letterDate,
      typeCode: req.typeCode || "TC",
      targetDate: req.targetDate,
      handoffTo: req.handoffTo || "To Engineering",
      status: req.status,
      picName: req.pic?.fullName || "Unassigned",
      picId: req.picId,
    }));

    return NextResponse.json({
      requests: formatted,
      stats: {
        total: totalCount,
        pendingApproval: submittedCount,
        approved: approvedCount,
        completed: completedCount,
      },
    });
  } catch (error) {
    console.error("Fetch PPC requests error:", error);
    return NextResponse.json(
      { error: "Failed to fetch PPC requests." },
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
    const {
      projectName,
      department,
      letterNo,
      letterDate,
      targetDate,
      typeCode,
      handoffTo,
      picId,
    } = body;

    if (!projectName?.trim() || !targetDate) {
      return NextResponse.json(
        { error: "Project name and target date are required." },
        { status: 400 }
      );
    }

    const year = new Date().getFullYear();
    const requestNo = await generateDocNumber("PPC", year);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Project in PPC stage
      const project = await tx.project.create({
        data: {
          name: projectName.trim(),
          department: department?.trim() || null,
          currentStage: Stage.PPC,
          createdBy: user.id,
        },
      });

      // 2. Create PpcRequest
      const ppc = await tx.ppcRequest.create({
        data: {
          projectId: project.id,
          requestNo,
          letterNo: letterNo?.trim() || null,
          letterDate: letterDate ? new Date(letterDate) : null,
          targetDate: new Date(targetDate),
          typeCode: typeCode?.trim() || "TC",
          handoffTo: handoffTo || "To Engineering",
          picId: picId || null,
          status: PpcStatus.SUBMITTED,
        },
        include: {
          project: true,
          pic: true,
        },
      });

      // 3. Log initial audit update
      await tx.progressUpdate.create({
        data: {
          projectId: project.id,
          actorId: user.id,
          stage: Stage.PPC,
          oldValue: "0",
          newValue: "SUBMITTED",
          note: `New PPC request ${requestNo} intake registered.`,
        },
      });

      return ppc;
    });

    return NextResponse.json({ success: true, ppc: result }, { status: 201 });
  } catch (error) {
    console.error("Create PPC request error:", error);
    return NextResponse.json(
      { error: "Failed to create PPC request." },
      { status: 500 }
    );
  }
}
