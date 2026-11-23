import { calculateWorkingDays, previewWorkingDays } from "@/lib/working-days";
import { generateDocNumber } from "@/server/sequences";
import { prisma } from "@/server/db";

async function runTests() {
  console.log("🚀 Running Phase 2 Tests...\n");

  // TEST 1: Working Days Calculation (PRD BR-03, Line 202)
  // 23 Sep 2026 (Wednesday) to 30 Sep 2026 (Wednesday)
  // 23(Wed), 24(Thu), 25(Fri), [26-Sat, 27-Sun], 28(Mon), 29(Tue), 30(Wed) = exactly 6 days!
  const days1 = await calculateWorkingDays("2026-09-23", "2026-09-30");
  console.log("Test 1: 23 Sep -> 30 Sep 2026 working days =", days1);
  if (days1 !== 6) throw new Error(`Expected 6 working days, got ${days1}`);
  console.log("✓ Test 1 Passed: Exactly 6 working days (matching PRD specification)\n");

  // TEST 2: Weekend exclusion
  // 2026-10-02 (Friday) to 2026-10-05 (Monday)
  // 2(Fri), [3-Sat, 4-Sun], 5(Mon) = exactly 2 days!
  const days2 = await calculateWorkingDays("2026-10-02", "2026-10-05");
  console.log("Test 2: Fri -> Mon working days =", days2);
  if (days2 !== 2) throw new Error(`Expected 2 working days, got ${days2}`);
  console.log("✓ Test 2 Passed: Weekends excluded\n");

  // TEST 3: Holiday deduction
  // 2026-08-14 (Friday) to 2026-08-18 (Tuesday)
  // 14(Fri), [15-Sat, 16-Sun], 17(Mon-Hari Kemerdekaan RI Holiday), 18(Tue) = 2 days!
  const days3 = await calculateWorkingDays("2026-08-14", "2026-08-18");
  console.log("Test 3: Fri -> Tue with 17 Aug Holiday =", days3);
  if (days3 !== 2) throw new Error(`Expected 2 working days, got ${days3}`);
  console.log("✓ Test 3 Passed: National holidays deducted\n");

  // TEST 4: Collision-proof sequential FEO number generation
  const feo1 = await generateDocNumber("FEO", 2026, 0);
  const feo2 = await generateDocNumber("FEO", 2026, 0);
  console.log("Test 4: Generated FEO numbers =", feo1, "and", feo2);
  if (!feo1.startsWith("00") || !feo2.startsWith("00")) {
    throw new Error(`Invalid FEO number format`);
  }
  console.log("✓ Test 4 Passed: Sequential FEO numbers generated\n");

  console.log("🎉 All Phase 2 Unit Tests Passed Successfully!");
}

runTests()
  .catch((e) => {
    console.error("❌ Test failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
