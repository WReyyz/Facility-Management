/**
 * Facility Management - Google Sheets / Legacy Apps Script Data Migration Utility
 * 
 * Usage:
 *   npx tsx scripts/import-sheets.ts --generate-templates
 *   npx tsx scripts/import-sheets.ts --type=vendors --file=data/legacy-vendors.csv --dry-run
 *   npx tsx scripts/import-sheets.ts --type=vendors --file=data/legacy-vendors.csv --execute
 *   npx tsx scripts/import-sheets.ts --type=projects --file=data/legacy-projects.csv --dry-run
 *   npx tsx scripts/import-sheets.ts --type=projects --file=data/legacy-projects.csv --execute
 */

import * as fs from "fs";
import * as path from "path";
import { prisma } from "../src/server/db";
import { VendorCategory, Stage, OverallStatus, HandoverStatus, ProcurementStatus } from "@prisma/client";

function parseCsv(content: string): Array<Record<string, string>> {
  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const rows: Array<Record<string, string>> = [];

  for (let i = 1; i < lines.length; i++) {
    // Basic CSV splitting handling quoted values
    const line = lines[i];
    const values: string[] = [];
    let insideQuotes = false;
    let currentValue = "";

    for (let charIdx = 0; charIdx < line.length; charIdx++) {
      const char = line[charIdx];
      if (char === '"' && (charIdx === 0 || line[charIdx - 1] !== "\\")) {
        insideQuotes = !insideQuotes;
      } else if (char === "," && !insideQuotes) {
        values.push(currentValue.trim().replace(/^"|"$/g, ""));
        currentValue = "";
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue.trim().replace(/^"|"$/g, ""));

    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || "";
    });
    rows.push(row);
  }

  return rows;
}

function parseCurrency(val: string): bigint {
  if (!val) return BigInt(0);
  const clean = val.replace(/[^0-9]/g, "");
  return clean ? BigInt(clean) : BigInt(0);
}

function parseDate(val: string): Date | null {
  if (!val) return null;
  // Handle DD/MM/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(val)) {
    const [d, m, y] = val.split("/").map(Number);
    return new Date(Date.UTC(y, m - 1, d));
  }
  const parsed = new Date(val);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function mapCategory(raw: string): VendorCategory {
  const upper = raw.toUpperCase().trim();
  if (upper.includes("CIVIL")) return VendorCategory.CIVIL;
  if (upper.includes("MEP")) return VendorCategory.MEP;
  if (upper.includes("HVAC")) return VendorCategory.HVAC;
  if (upper.includes("MECHANIC")) return VendorCategory.MECHANICAL;
  if (upper.includes("MULTI")) return VendorCategory.MULTI_DISCIPLINE;
  return VendorCategory.OTHERS;
}

function mapStage(raw: string): Stage {
  const upper = raw.toUpperCase().trim();
  if (upper.includes("PPC")) return Stage.PPC;
  if (upper.includes("ENG")) return Stage.ENGINEERING;
  if (upper.includes("PROC") || upper.includes("TENDER")) return Stage.PROCUREMENT;
  if (upper.includes("OPER") || upper.includes("BAST") || upper.includes("WARRANTY"))
    return Stage.OPERATIONS;
  return Stage.PROJECT;
}

async function generateTemplates() {
  const dir = path.join(process.cwd(), "data", "templates");
  fs.mkdirSync(dir, { recursive: true });

  const vendorCsv = [
    "name,category,email,phone,contact_name",
    '"PT Mega Tehnik Mandiri",MEP,sales@megatehnik.co.id,021-5582910,"Budi Santoso"',
    '"CV Cipta Karya Persada",CIVIL,kontak@ciptakarya.com,021-8849201,"Ahmad Fauzi"',
    '"PT Sarana Pendingin",HVAC,info@saranapendingin.com,021-3920194,"Hendra Wijaya"',
  ].join("\n");

  const projectCsv = [
    "name,department,stage,status,vendor_name,po_no,po_amount,bast_date,warranty_months",
    '"Overhaul Chiller Plant Gedung Utama",Utility,OPERATIONS,COMPLETED,"PT Sarana Pendingin",PO-2025-014,185000000,2025-10-15,12',
    '"Perbaikan Pintu Otomatis Loading Dock",Logistik,PROJECT,IN_PROGRESS,"CV Cipta Karya Persada",PO-2026-002,45000000,,12',
    '"Pemasangan Lampu LED Highbay Workshop",Facility,PPC,IN_PROGRESS,,,,,',
  ].join("\n");

  fs.writeFileSync(path.join(dir, "legacy-vendors.csv"), vendorCsv, "utf-8");
  fs.writeFileSync(path.join(dir, "legacy-projects.csv"), projectCsv, "utf-8");

  console.log(`✓ Migration templates generated at: ${dir}`);
  console.log(`  - legacy-vendors.csv`);
  console.log(`  - legacy-projects.csv`);
}

async function importVendors(filePath: string, isDryRun: boolean) {
  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found at ${filePath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, "utf-8");
  const rows = parseCsv(content);
  console.log(`Found ${rows.length} vendor rows to process.`);

  let imported = 0;
  let skipped = 0;

  for (const row of rows) {
    const name = row.name?.trim();
    if (!name) {
      skipped++;
      continue;
    }

    const category = mapCategory(row.category || "OTHERS");
    const email = row.email?.trim() || null;
    const phone = row.phone?.trim() || null;
    const contactName = row.contact_name?.trim() || row.address?.trim() || null;

    if (isDryRun) {
      console.log(`[DRY-RUN] Valid vendor: "${name}" [${category}] - email: ${email}`);
      imported++;
    } else {
      await prisma.vendor.upsert({
        where: { name },
        update: { category, email, phone, contactName, isActive: true },
        create: { name, category, email, phone, contactName, isActive: true },
      });
      imported++;
    }
  }

  console.log(`\nVendor Migration Summary (${isDryRun ? "DRY RUN" : "COMMITTED"}):`);
  console.log(`✓ Imported / Updated: ${imported}`);
  console.log(`↷ Skipped (Invalid): ${skipped}`);
}

async function importProjects(filePath: string, isDryRun: boolean) {
  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found at ${filePath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, "utf-8");
  const rows = parseCsv(content);
  console.log(`Found ${rows.length} project rows to process.`);

  let imported = 0;
  let skipped = 0;

  for (const row of rows) {
    const name = row.name?.trim();
    if (!name) {
      skipped++;
      continue;
    }

    const department = row.department?.trim() || null;
    const stage = mapStage(row.stage || "PROJECT");
    const status =
      row.status?.toUpperCase() === "COMPLETED"
        ? OverallStatus.COMPLETED
        : row.status?.toUpperCase() === "CANCELLED"
        ? OverallStatus.CANCELLED
        : OverallStatus.IN_PROGRESS;

    const vendorName = row.vendor_name?.trim();
    const poNo = row.po_no?.trim();
    const poAmount = parseCurrency(row.po_amount);
    const bastDate = parseDate(row.bast_date);
    const warrantyMonths = parseInt(row.warranty_months, 10) || 12;

    if (isDryRun) {
      console.log(`[DRY-RUN] Valid project: "${name}" (${department}) - Stage: ${stage}, PO: ${poNo || "None"}`);
      imported++;
    } else {
      await prisma.$transaction(async (tx) => {
        // 1. Create or Find Project
        const project = await tx.project.create({
          data: {
            name,
            department,
            currentStage: stage,
            overallStatus: status,
          },
        });

        // 2. Link Vendor and PO if provided
        if (vendorName && poNo && poAmount > BigInt(0)) {
          let vendor = await tx.vendor.findUnique({ where: { name: vendorName } });
          if (!vendor) {
            vendor = await tx.vendor.create({
              data: {
                name: vendorName,
                category: VendorCategory.OTHERS,
                isActive: true,
              },
            });
          }

          const po = await tx.purchaseOrder.create({
            data: {
              projectId: project.id,
              vendorId: vendor.id,
              poNo,
              amount: poAmount,
              issuedAt: new Date(),
              status: ProcurementStatus.PO_ISSUED,
            },
          });

          // Single default payment stage
          await tx.paymentStage.create({
            data: {
              poId: po.id,
              name: "Pelunasan",
              percentage: 100,
              amount: poAmount,
              dueDate: new Date(),
              status: status === OverallStatus.COMPLETED ? "PAID" : "PLANNED",
              paidAt: status === OverallStatus.COMPLETED ? new Date() : null,
            },
          });
        }

        // 3. Create Handover if BAST present
        if (bastDate) {
          const wEnd = new Date(bastDate);
          wEnd.setMonth(wEnd.getMonth() + warrantyMonths);
          const retention = BigInt(Math.round((Number(poAmount) * 5) / 100));

          await tx.handover.create({
            data: {
              projectId: project.id,
              handoverDate: bastDate,
              warrantyMonths,
              warrantyEnd: wEnd,
              retentionPct: 5,
              retentionAmount: retention,
              status: status === OverallStatus.COMPLETED ? HandoverStatus.CLOSED : HandoverStatus.WARRANTY,
            },
          });
        }
      });
      imported++;
    }
  }

  console.log(`\nProject Migration Summary (${isDryRun ? "DRY RUN" : "COMMITTED"}):`);
  console.log(`✓ Imported: ${imported}`);
  console.log(`↷ Skipped: ${skipped}`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--generate-templates")) {
    await generateTemplates();
    process.exit(0);
  }

  const typeArg = args.find((a) => a.startsWith("--type="))?.split("=")[1];
  const fileArg = args.find((a) => a.startsWith("--file="))?.split("=")[1];
  const isExecute = args.includes("--execute");
  const isDryRun = args.includes("--dry-run") || !isExecute;

  if (!typeArg || !fileArg) {
    console.log("Facility Management - Google Sheets Data Migration Utility\n");
    console.log("Usage:");
    console.log("  npx tsx scripts/import-sheets.ts --generate-templates");
    console.log("  npx tsx scripts/import-sheets.ts --type=vendors --file=<csv-path> [--dry-run|--execute]");
    console.log("  npx tsx scripts/import-sheets.ts --type=projects --file=<csv-path> [--dry-run|--execute]");
    process.exit(0);
  }

  const targetPath = path.resolve(process.cwd(), fileArg);

  if (typeArg === "vendors") {
    await importVendors(targetPath, isDryRun);
  } else if (typeArg === "projects") {
    await importProjects(targetPath, isDryRun);
  } else {
    console.error(`Unknown type: ${typeArg}. Expected 'vendors' or 'projects'.`);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error("Migration fatal error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
