import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db";
import { getCurrentUser } from "@/server/auth";
import { VendorCategory } from "@prisma/client";

const updateVendorSchema = z.object({
  name: z.string().min(2).max(150).optional(),
  category: z.nativeEnum(VendorCategory).optional(),
  contactName: z.string().max(120).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PROCUREMENT")) {
      return NextResponse.json(
        { error: "Unauthorized: only ADMIN or PROCUREMENT can update vendors." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = updateVendorSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    // Check if name is being changed and conflicts with another vendor
    if (parsed.data.name) {
      const existing = await prisma.vendor.findFirst({
        where: {
          name: { equals: parsed.data.name.trim() },
          id: { not: id },
        },
      });

      if (existing) {
        return NextResponse.json(
          { error: `Vendor with name "${parsed.data.name.trim()}" already exists.` },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.vendor.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json({ vendor: updated });
  } catch (error) {
    console.error("Update vendor error:", error);
    return NextResponse.json(
      { error: "Failed to update vendor." },
      { status: 500 }
    );
  }
}
