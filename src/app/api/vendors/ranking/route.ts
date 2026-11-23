import { NextResponse } from "next/server";
import { prisma } from "@/server/db";

export async function GET() {
  try {
    // 1. Fetch score configuration
    const config = await prisma.scoreConfig.findUnique({
      where: { id: 1 },
    });

    const techWeight = config ? Number(config.technicalWeight) : 0.6;
    const nonTechWeight = config ? Number(config.nonTechnicalWeight) : 0.4;
    const threshold = config ? Number(config.threshold) : 70.0;

    // 2. Fetch all active vendors with their reviews
    const vendors = await prisma.vendor.findMany({
      where: { isActive: true },
      include: {
        vendorReviews: {
          select: {
            technicalScore: true,
            nonTechnicalScore: true,
          },
        },
      },
    });

    // 3. Compute rankings
    const rankings = vendors.map((v) => {
      const reviewCount = v.vendorReviews.length;

      if (reviewCount === 0) {
        return {
          id: v.id,
          name: v.name,
          category: v.category,
          reviewsCount: 0,
          technicalScore: null,
          nonTechnicalScore: null,
          totalScore: null,
          eligibility: "NOT_RATED" as const,
        };
      }

      const totalTech = v.vendorReviews.reduce(
        (acc, r) => acc + Number(r.technicalScore),
        0
      );
      const totalNonTech = v.vendorReviews.reduce(
        (acc, r) => acc + Number(r.nonTechnicalScore),
        0
      );

      const avgTech = Math.round((totalTech / reviewCount) * 10) / 10;
      const avgNonTech = Math.round((totalNonTech / reviewCount) * 10) / 10;
      const totalScore =
        Math.round((avgTech * techWeight + avgNonTech * nonTechWeight) * 10) / 10;

      const eligibility =
        totalScore >= threshold ? ("ELIGIBLE" as const) : ("NOT_ELIGIBLE" as const);

      return {
        id: v.id,
        name: v.name,
        category: v.category,
        reviewsCount: reviewCount,
        technicalScore: avgTech,
        nonTechnicalScore: avgNonTech,
        totalScore: totalScore,
        eligibility,
      };
    });

    // 4. Sort: Total descending, unrated vendors at the bottom
    rankings.sort((a, b) => {
      if (a.totalScore === null && b.totalScore === null) return a.name.localeCompare(b.name);
      if (a.totalScore === null) return 1;
      if (b.totalScore === null) return -1;
      return b.totalScore - a.totalScore;
    });

    return NextResponse.json({
      config: {
        technicalWeight: techWeight,
        nonTechnicalWeight: nonTechWeight,
        threshold: threshold,
      },
      rankings,
    });
  } catch (error) {
    console.error("Fetch vendor rankings error:", error);
    return NextResponse.json(
      { error: "Failed to compute vendor rankings." },
      { status: 500 }
    );
  }
}
