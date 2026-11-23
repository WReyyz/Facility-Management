import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db";
import { getCurrentUser } from "@/server/auth";
import { calculateWorkingDays } from "@/lib/working-days";
import { generateDocNumber } from "@/server/sequences";
import { EngineeringStatus, Stage } from "@prisma/client";

// GET /api/engineering - List tender documents
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.toLowerCase();
    const statusFilter = searchParams.get("status");
    const mineOnly = searchParams.get("mine") === "1";

    const where: any = {};

    if (q) {
      where.OR = [
        { tenderNo: { contains: q } },
        { project: { name: { contains: q } } },
        { project: { department: { contains: q } } },
      ];
    }

    if (mineOnly) {
      where.engineerId = user.id;
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (statusFilter && statusFilter !== "ALL") {
      if (statusFilter === "OVERDUE") {
        where.status = { not: EngineeringStatus.COMPLETED };
        where.finishDate = { lt: now };
      } else {
        where.status = statusFilter as EngineeringStatus;
      }
    }

    const tenderDocs = await prisma.tenderDocument.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            department: true,
            currentStage: true,
            overallStatus: true,
          },
        },
        engineer: {
          select: {
            id: true,
            fullName: true,
            username: true,
          },
        },
      },
      orderBy: { tenderNo: "desc" },
    });

    // Compute dynamic overdue flag
    const formatted = tenderDocs.map((td) => {
      const isOverdue =
        td.status !== EngineeringStatus.COMPLETED &&
        td.finishDate !== null &&
        new Date(td.finishDate) < now;

      return {
        id: td.id,
        tenderNo: td.tenderNo,
        revision: td.revision,
        projectId: td.projectId,
        projectName: td.project.name,
        department: td.project.department || "—",
        engineerId: td.engineerId,
        engineerName: td.engineer?.fullName || "Unassigned",
        startDate: td.startDate,
        finishDate: td.finishDate,
        workingDays: td.workingDays,
        progressPct: td.progressPct,
        status: td.status,
        isOverdue,
      };
    });

    return NextResponse.json({ tenderDocs: formatted });
  } catch (error) {
    console.error("Fetch tender documents error:", error);
    return NextResponse.json(
      { error: "Failed to fetch tender documents." },
      { status: 500 }
    );
  }
}

// Validation schema for creating a tender document
const createTenderSchema = z.object({
  projectId: z.string().optional(),
  projectName: z.string().min(2, "Project name is required").optional(),
  department: z.string().optional(),
  engineerId: z.string().min(1, "Engineer is required"),
  startDate: z.string().min(1, "Start date is required"),
  finishDate: z.string().min(1, "Finish date is required"),
  notes: z.string().optional(),
});

// POST /api/engineering - Create New Tender Document
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ENGINEERING" && user.role !== "ADMIN")) {
      return NextResponse.json(
        { error: "Unauthorized: only ENGINEERING or ADMIN can create tender documents." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = createTenderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { projectId, projectName, department, engineerId, startDate, finishDate, notes } =
      parsed.data;

    const start = new Date(startDate);
    const finish = new Date(finishDate);

    if (finish < start) {
      return NextResponse.json(
        { error: "Finish date cannot be earlier than start date." },
        { status: 400 }
      );
    }

    // 1. Resolve or Create Project
    let targetProjectId = projectId;
    if (!targetProjectId && projectName) {
      const newProj = await prisma.project.create({
        data: {
          name: projectName.trim(),
          department: department?.trim() || null,
          currentStage: Stage.ENGINEERING,
          createdBy: user.id,
        },
      });
      targetProjectId = newProj.id;
    }

    if (!targetProjectId) {
      return NextResponse.json(
        { error: "Please select or specify a project." },
        { status: 400 }
      );
    }

    // 2. Generate unique collision-proof tender number: 001/FEO/YYYY/R0
    const tenderNo = await generateDocNumber("FEO", start.getFullYear(), 0);

    // 3. Calculate Working Days (Monday - Friday, minus holidays)
    const workingDays = await calculateWorkingDays(start, finish);

    // 4. Create Tender Document in DB
    const newTender = await prisma.tenderDocument.create({
      data: {
        projectId: targetProjectId,
        tenderNo,
        revision: 0,
        engineerId,
        startDate: start,
        finishDate: finish,
        workingDays,
        progressPct: 0,
        status: EngineeringStatus.NOT_STARTED,
      },
      include: {
        project: true,
        engineer: true,
      },
    });

    // 5. Log update history
    await prisma.progressUpdate.create({
      data: {
        projectId: targetProjectId,
        stage: Stage.ENGINEERING,
        oldValue: "None",
        newValue: `Tender created: ${tenderNo}`,
        note: notes ? `Created tender document: ${notes}` : "Created tender document",
        actorId: user.id,
      },
    });

    return NextResponse.json({ tenderDoc: newTender }, { status: 201 });
  } catch (error) {
    console.error("Create tender document error:", error);
    return NextResponse.json(
      { error: "Failed to create tender document." },
      { status: 500 }
    );
  }
}
