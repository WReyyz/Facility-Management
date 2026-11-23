import { prisma } from "@/server/db";
import {
  Stage,
  OverallStatus,
  PpcStatus,
  EngineeringStatus,
  ProcurementStatus,
  ProjectExecutionStatus,
  HandoverStatus,
} from "@prisma/client";

export async function seedRichSampleProjects() {
  console.log("📦 Seeding rich sample projects for Dashboard & Search...");

  const users = await prisma.user.findMany();
  const admin = users.find((u) => u.role === "ADMIN") || users[0];
  const priyo = users.find((u) => u.username === "priyo") || users[0];
  const afrianto = users.find((u) => u.username === "afrianto") || users[0];
  const ppcUser = users.find((u) => u.username === "ppc_user") || users[0];

  const vendors = await prisma.vendor.findMany();
  const dexa = vendors.find((v) => v.name.includes("Dexa")) || vendors[0];
  const kencana = vendors.find((v) => v.name.includes("Kencana")) || vendors[0];
  const berkah = vendors.find((v) => v.name.includes("Berkah")) || vendors[0];

  const now = new Date();
  const in3Days = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  const in5Days = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
  const in14Days = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  const past5Days = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
  const past20Days = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000);

  // 1. Project: Rehab Chiller Gedung B (Procurement stage, Due Soon in 5 days)
  const p1 = await prisma.project.upsert({
    where: { id: "proj-sample-chiller-01" },
    update: {},
    create: {
      id: "proj-sample-chiller-01",
      name: "Rehab Chiller Gedung B",
      department: "Dinas Pemeliharaan Fasilitas",
      currentStage: Stage.PROCUREMENT,
      overallStatus: OverallStatus.IN_PROGRESS,
      createdBy: admin.id,
      ppcRequest: {
        create: {
          requestNo: "001/PPC/2026",
          letterNo: "088/DPF/X/2026",
          letterDate: past20Days,
          typeCode: "TC",
          picId: ppcUser.id,
          targetDate: in5Days,
          handoffTo: "To Project",
          status: PpcStatus.COMPLETED,
        },
      },
      tenderDocuments: {
        create: {
          tenderNo: "001/FEO/2026/R0",
          engineerId: priyo.id,
          startDate: past20Days,
          finishDate: past5Days,
          workingDays: 10,
          progressPct: 100,
          status: EngineeringStatus.COMPLETED,
        },
      },
      purchaseOrder: {
        create: {
          vendorId: dexa.id,
          poNo: "PO/2026/FEO/018",
          amount: BigInt(45000000),
          issuedAt: past5Days,
          status: ProcurementStatus.PO_ISSUED,
          paymentStages: {
            create: [
              {
                name: "Uang Muka (DP 30%)",
                percentage: 30.0,
                amount: BigInt(13500000),
                paidAt: past5Days,
                status: "PAID",
              },
              {
                name: "Pelunasan (70%)",
                percentage: 70.0,
                amount: BigInt(31500000),
                dueDate: in14Days,
                status: "PLANNED",
              },
            ],
          },
        },
      },
      progressUpdates: {
        create: [
          {
            stage: Stage.PPC,
            oldValue: "Draft",
            newValue: "Completed",
            note: "Surat permintaan disetujui dinas.",
            actorId: ppcUser.id,
            createdAt: past20Days,
          },
          {
            stage: Stage.ENGINEERING,
            oldValue: "0%",
            newValue: "100%",
            note: "Gambar teknik dan BoQ final selesai.",
            actorId: priyo.id,
            createdAt: past5Days,
          },
          {
            stage: Stage.PROCUREMENT,
            oldValue: "Evaluation",
            newValue: "PO Issued",
            note: "PO diterbitkan ke PT Dexa Energy (Rp 45,000,000).",
            actorId: admin.id,
            createdAt: past5Days,
          },
        ],
      },
    },
  });

  // 2. Project: Penggantian Filter AHU Cleanroom (PPC Stage, Due Soon in 3 days)
  const p2 = await prisma.project.upsert({
    where: { id: "proj-sample-ahu-02" },
    update: {},
    create: {
      id: "proj-sample-ahu-02",
      name: "Penggantian Filter AHU Cleanroom",
      department: "Dinas Fasilitas Medis",
      currentStage: Stage.PPC,
      overallStatus: OverallStatus.IN_PROGRESS,
      createdBy: ppcUser.id,
      ppcRequest: {
        create: {
          requestNo: "002/PPC/2026",
          letterNo: "012/MED/IX/2026",
          letterDate: past5Days,
          typeCode: "TC",
          picId: ppcUser.id,
          targetDate: in3Days,
          handoffTo: "To Engineering",
          status: PpcStatus.APPROVED,
        },
      },
      progressUpdates: {
        create: [
          {
            stage: Stage.PPC,
            oldValue: "Draft",
            newValue: "Approved",
            note: "Surat pengajuan filter AHU disetujui.",
            actorId: ppcUser.id,
            createdAt: past5Days,
          },
        ],
      },
    },
  });

  // 3. Project: Pemasangan Sensor Suhu Ruang Server (Project Execution Stage, OVERDUE!)
  const p3 = await prisma.project.upsert({
    where: { id: "proj-sample-server-03" },
    update: {},
    create: {
      id: "proj-sample-server-03",
      name: "Pemasangan Sensor Suhu Ruang Server",
      department: "Dinas Teknologi Informasi",
      currentStage: Stage.PROJECT,
      overallStatus: OverallStatus.IN_PROGRESS,
      createdBy: admin.id,
      ppcRequest: {
        create: {
          requestNo: "003/PPC/2026",
          letterNo: "044/DTI/XI/2026",
          letterDate: past20Days,
          typeCode: "TC",
          picId: ppcUser.id,
          targetDate: past5Days,
          handoffTo: "To Project",
          status: PpcStatus.COMPLETED,
        },
      },
      tenderDocuments: {
        create: {
          tenderNo: "002/FEO/2026/R0",
          engineerId: priyo.id,
          startDate: past20Days,
          finishDate: past5Days,
          workingDays: 8,
          progressPct: 100,
          status: EngineeringStatus.COMPLETED,
        },
      },
      purchaseOrder: {
        create: {
          vendorId: kencana.id,
          poNo: "PO/2026/FEO/019",
          amount: BigInt(28000000),
          issuedAt: past5Days,
          status: ProcurementStatus.PO_ISSUED,
        },
      },
      projectExecution: {
        create: {
          picId: afrianto.id,
          startDate: past5Days,
          finishDate: past5Days, // Passed! -> Overdue
          progressPct: 60,
          status: ProjectExecutionStatus.IN_PROGRESS,
        },
      },
      progressUpdates: {
        create: [
          {
            stage: Stage.PROJECT,
            oldValue: "0%",
            newValue: "60%",
            note: "Sensor terpasang di 6 rack, menunggu wiring panel utama.",
            actorId: afrianto.id,
            createdAt: past5Days,
          },
        ],
      },
    },
  });

  // 4. Project: Retrofit Lampu LED Gudang Logistik (Operations Stage, Completed)
  const p4 = await prisma.project.upsert({
    where: { id: "proj-sample-led-04" },
    update: {},
    create: {
      id: "proj-sample-led-04",
      name: "Retrofit Lampu LED Gudang Logistik",
      department: "Dinas Logistik & Sarpras",
      currentStage: Stage.OPERATIONS,
      overallStatus: OverallStatus.COMPLETED,
      createdBy: admin.id,
      ppcRequest: {
        create: {
          requestNo: "004/PPC/2026",
          letterNo: "009/LOG/VIII/2026",
          letterDate: past20Days,
          typeCode: "TC",
          picId: ppcUser.id,
          targetDate: past5Days,
          handoffTo: "To Operations",
          status: PpcStatus.COMPLETED,
        },
      },
      tenderDocuments: {
        create: {
          tenderNo: "003/FEO/2026/R0",
          engineerId: priyo.id,
          startDate: past20Days,
          finishDate: past20Days,
          workingDays: 5,
          progressPct: 100,
          status: EngineeringStatus.COMPLETED,
        },
      },
      purchaseOrder: {
        create: {
          vendorId: berkah.id,
          poNo: "PO/2026/FEO/020",
          amount: BigInt(18500000),
          issuedAt: past20Days,
          status: ProcurementStatus.PO_ISSUED,
        },
      },
      projectExecution: {
        create: {
          picId: afrianto.id,
          startDate: past20Days,
          finishDate: past5Days,
          progressPct: 100,
          status: ProjectExecutionStatus.COMPLETED,
        },
      },
      handover: {
        create: {
          handoverDate: past5Days,
          warrantyMonths: 12,
          warrantyEnd: new Date(Date.now() + 350 * 24 * 60 * 60 * 1000),
          retentionPct: 5.0,
          retentionAmount: BigInt(925000),
          status: HandoverStatus.WARRANTY,
        },
      },
      progressUpdates: {
        create: [
          {
            stage: Stage.OPERATIONS,
            oldValue: "Not started",
            newValue: "Handed over",
            note: "BAST ditandatangani, masa garansi 12 bulan aktif.",
            actorId: admin.id,
            createdAt: past5Days,
          },
        ],
      },
    },
  });

  console.log("✓ 4 sample projects seeded with full lifecycle data!");
}

// Run if called directly
if (require.main === module) {
  seedRichSampleProjects()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}
