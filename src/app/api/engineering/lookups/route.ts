import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { Role } from "@prisma/client";

export async function GET() {
  try {
    const [engineers, projects, holidays] = await Promise.all([
      prisma.user.findMany({
        where: { isActive: true },
        select: { id: true, fullName: true, username: true, role: true },
        orderBy: { fullName: "asc" },
      }),
      prisma.project.findMany({
        where: { deletedAt: null },
        select: { id: true, name: true, department: true, currentStage: true },
        orderBy: { name: "asc" },
      }),
      prisma.holiday.findMany({
        select: { holidayDate: true, name: true },
        orderBy: { holidayDate: "asc" },
      }),
    ]);

    const holidayStrings = holidays.map(
      (h) => new Date(h.holidayDate).toISOString().split("T")[0]
    );

    return NextResponse.json({
      engineers,
      projects,
      holidays: holidayStrings,
    });
  } catch (error) {
    console.error("Lookups error:", error);
    return NextResponse.json(
      { error: "Failed to fetch lookups." },
      { status: 500 }
    );
  }
}
