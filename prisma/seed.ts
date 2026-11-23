import { PrismaClient, Role, VendorCategory } from "@prisma/client";
import * as crypto from "crypto";

const prisma = new PrismaClient();

// Fast secure salt + scrypt hash for local dev/seed (native Node.js)
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `scrypt:${salt}:${derivedKey.toString("hex")}`;
}

async function main() {
  console.log("🌱 Seeding database...");

  // 1. Initial Score Config
  await prisma.scoreConfig.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      technicalWeight: 0.6,
      nonTechnicalWeight: 0.4,
      threshold: 70.0,
    },
  });
  console.log("✓ Score configuration seeded");

  // 2. Initial Users
  const users = [
    {
      username: "admin",
      fullName: "System Administrator",
      role: Role.ADMIN,
      password: "adminpassword123",
    },
    {
      username: "priyo",
      fullName: "Priyo S.",
      role: Role.ENGINEERING,
      password: "password123",
    },
    {
      username: "afrianto",
      fullName: "Afrianto",
      role: Role.PROJECT,
      password: "password123",
    },
    {
      username: "ppc_user",
      fullName: "Budi PPC",
      role: Role.PPC,
      password: "password123",
    },
    {
      username: "proc_user",
      fullName: "Siti Procurement",
      role: Role.PROCUREMENT,
      password: "password123",
    },
    {
      username: "ops_user",
      fullName: "Rudi Operations",
      role: Role.OPERATIONS,
      password: "password123",
    },
    {
      username: "viewer",
      fullName: "Manajemen Viewer",
      role: Role.VIEWER,
      password: "password123",
    },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { username: u.username },
      update: {},
      create: {
        username: u.username,
        fullName: u.fullName,
        role: u.role,
        passwordHash: hashPassword(u.password),
        mustChangePassword: false,
        isActive: true,
      },
    });
  }
  console.log(`✓ ${users.length} Users seeded`);

  // 3. Initial Vendors
  const sampleVendors = [
    {
      name: "PT Dexa Energy",
      category: VendorCategory.MECHANICAL,
      contactName: "Bambang",
      phone: "08123456789",
      email: "info@dexaenergy.com",
    },
    {
      name: "PT Kencana Mekanika",
      category: VendorCategory.MULTI_DISCIPLINE,
      contactName: "Hendra",
      phone: "08119876543",
      email: "contact@kencanamekanika.co.id",
    },
    {
      name: "CV Berkah Mandiri Teknik",
      category: VendorCategory.HVAC,
      contactName: "Supriyanto",
      phone: "085712341234",
      email: "berkahmandiri@gmail.com",
    },
    {
      name: "PT Cipta Karya Prima",
      category: VendorCategory.CIVIL,
      contactName: "Agus Pratama",
      phone: "081399887766",
      email: "admin@ciptakarya.id",
    },
  ];

  for (const v of sampleVendors) {
    await prisma.vendor.upsert({
      where: { name: v.name },
      update: {},
      create: v,
    });
  }
  console.log(`✓ ${sampleVendors.length} Vendors seeded`);

  // 4. Initial Holidays (2026 Sample)
  const holidays = [
    { holidayDate: new Date("2026-01-01"), name: "Tahun Baru Masehi" },
    { holidayDate: new Date("2026-03-20"), name: "Hari Raya Idul Fitri" },
    { holidayDate: new Date("2026-03-21"), name: "Hari Raya Idul Fitri" },
    { holidayDate: new Date("2026-05-01"), name: "Hari Buruh Internasional" },
    { holidayDate: new Date("2026-08-17"), name: "Hari Kemerdekaan RI" },
    { holidayDate: new Date("2026-12-25"), name: "Hari Raya Natal" },
  ];

  for (const h of holidays) {
    await prisma.holiday.upsert({
      where: { holidayDate: h.holidayDate },
      update: {},
      create: h,
    });
  }
  console.log(`✓ ${holidays.length} Holidays seeded`);

  // 5. Initial Doc Sequences
  const currentYear = new Date().getFullYear();
  await prisma.docSequence.upsert({
    where: { docType_docYear: { docType: "PPC", docYear: currentYear } },
    update: {},
    create: { docType: "PPC", docYear: currentYear, lastNumber: 2 },
  });
  await prisma.docSequence.upsert({
    where: { docType_docYear: { docType: "FEO", docYear: currentYear } },
    update: {},
    create: { docType: "FEO", docYear: currentYear, lastNumber: 1 },
  });
  console.log("✓ Document sequences seeded");

  console.log("🎉 Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
