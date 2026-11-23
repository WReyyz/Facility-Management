import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db";
import { getCurrentUser } from "@/server/auth";
import { VendorCategory } from "@prisma/client";

const createVendorSchema = z.object({
  name: z.string().min(2, "Vendor name must be at least 2 characters").max(150),
  category: z.nativeEnum(VendorCategory),
  contactName: z.string().max(120).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  email: z.string().email("Invalid email format").optional().nullable().or(z.literal("")),
});

// GET /api/vendors - List all vendors
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.toLowerCase();
    const category = searchParams.get("category") as VendorCategory | null;

    const where: any = {};
    if (q) {
      where.OR = [
        { name: { contains: q } },
        { contactName: { contains: q } },
        { phone: { contains: q } },
      ];
    }
    if (category && Object.values(VendorCategory).includes(category)) {
      where.category = category;
    }

    const vendors = await prisma.vendor.findMany({
      where,
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ vendors });
  } catch (error) {
    console.error("Fetch vendors error:", error);
    return NextResponse.json(
      { error: "Failed to fetch vendors." },
      { status: 500 }
    );
  }
}

// POST /api/vendors - Create vendor (PROCUREMENT or ADMIN)
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PROCUREMENT")) {
      return NextResponse.json(
        { error: "Unauthorized: only ADMIN or PROCUREMENT can add vendors." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = createVendorSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { name, category, contactName, phone, email } = parsed.data;

    // Check unique name case-insensitive
    const existing = await prisma.vendor.findFirst({
      where: { name: { equals: name.trim() } },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Vendor with name "${name.trim()}" already exists.` },
        { status: 409 }
      );
    }

    const newVendor = await prisma.vendor.create({
      data: {
        name: name.trim(),
        category,
        contactName: contactName?.trim() || null,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        isActive: true,
      },
    });

    return NextResponse.json({ vendor: newVendor }, { status: 201 });
  } catch (error) {
    console.error("Create vendor error:", error);
    return NextResponse.json(
      { error: "Failed to create vendor." },
      { status: 500 }
    );
  }
}
