import { describe, it } from "node:test";
import assert from "node:assert/strict";

const BASE_URL = "http://localhost:3000";

describe("Phase 4 End-to-End Lifecycle Tests", async () => {
  let sessionCookie = "";
  let createdPpcId = "";
  let createdProjectId = "";
  let testVendorId = "";
  let testStageId = "";

  it("Step 1: Authenticate as Admin", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "admin",
        password: "adminpassword123",
      }),
    });

    assert.equal(res.status, 200, "Login must succeed");
    const cookieHeader = res.headers.get("set-cookie");
    assert.ok(cookieHeader, "Must return set-cookie header");
    sessionCookie = cookieHeader.split(";")[0];
  });

  it("Step 2: PPC Intake - Create new PPC Request & sequential doc number", async () => {
    const res = await fetch(`${BASE_URL}/api/ppc`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookie,
      },
      body: JSON.stringify({
        projectName: "Perbaikan Instalasi Listrik Workshop",
        department: "Dinas Kelistrikan",
        letterNo: "055/LISTRIK/XI/2026",
        letterDate: "2026-11-20",
        targetDate: "2026-12-25",
        typeCode: "MEP",
        handoffTo: "To Engineering",
      }),
    });

    assert.equal(res.status, 201, "PPC creation must return 201");
    const data = await res.json();
    assert.ok(data.ppc, "Must return created PPC record");
    assert.ok(data.ppc.requestNo.includes("/PPC/2026"), "Request number must follow NNN/PPC/2026 format");

    createdPpcId = data.ppc.id;
    createdProjectId = data.ppc.projectId;
    console.log("✓ PPC request created:", data.ppc.requestNo);
  });

  it("Step 3: PPC Review - Update status to APPROVED", async () => {
    const res = await fetch(`${BASE_URL}/api/ppc/${createdPpcId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookie,
      },
      body: JSON.stringify({
        status: "APPROVED",
        note: "Approved by Head of Division for Engineering tender prep.",
      }),
    });

    assert.equal(res.status, 200, "Update PPC status must return 200");
    const data = await res.json();
    assert.equal(data.ppc.status, "APPROVED");
    console.log("✓ PPC request approved successfully");
  });

  it("Step 4: Procurement - Invite Vendor & Check Eligibility", async () => {
    // Get existing vendors
    const resVendors = await fetch(`${BASE_URL}/api/vendors`, {
      headers: { Cookie: sessionCookie },
    });
    const vData = await resVendors.json();
    assert.ok(vData.vendors.length > 0, "Must have vendors");
    testVendorId = vData.vendors[0].id;

    // Invite vendor
    const resInvite = await fetch(`${BASE_URL}/api/procurement`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookie,
      },
      body: JSON.stringify({
        action: "INVITE_VENDOR",
        projectId: createdProjectId,
        vendorId: testVendorId,
        bidAmount: 120000000,
      }),
    });

    assert.equal(resInvite.status, 200, "Invite vendor must return 200");
    console.log("✓ Vendor invited to tender with bid Rp 120,000,000");
  });

  it("Step 5: Procurement - Reject Staged Payments not summing 100%", async () => {
    const res = await fetch(`${BASE_URL}/api/procurement`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookie,
      },
      body: JSON.stringify({
        action: "ISSUE_PO",
        projectId: createdProjectId,
        vendorId: testVendorId,
        poNo: `PO-TEST-${Date.now()}`,
        amount: 120000000,
        paymentStages: [
          { name: "DP", percentage: 20 },
          { name: "Pelunasan", percentage: 70 }, // Sum = 90% (Invalid!)
        ],
      }),
    });

    assert.equal(res.status, 400, "Must reject staged payments summing != 100%");
    console.log("✓ Business rule validation: sum != 100% properly rejected");
  });

  it("Step 6: Procurement - Issue PO with 100% Staged Payments & Advance to Execution", async () => {
    const poNo = `PO-2026-${Math.floor(100 + Math.random() * 900)}`;
    const res = await fetch(`${BASE_URL}/api/procurement`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookie,
      },
      body: JSON.stringify({
        action: "ISSUE_PO",
        projectId: createdProjectId,
        vendorId: testVendorId,
        poNo,
        amount: 120000000,
        paymentStages: [
          { name: "DP (Uang Muka)", percentage: 20 },
          { name: "Termin 1 (Progress 50%)", percentage: 30 },
          { name: "Termin 2 (Progress 80%)", percentage: 30 },
          { name: "Pelunasan (BAST)", percentage: 20 },
        ],
      }),
    });

    assert.equal(res.status, 200, "Issue PO must return 200");
    const data = await res.json();
    assert.ok(data.poId, "Must return created PO ID");
    console.log("✓ PO issued successfully:", poNo);
  });

  it("Step 7: Project Execution - Track Progress & Enforce BR-09", async () => {
    // 1. Advance to 60%
    const res1 = await fetch(`${BASE_URL}/api/project-execution`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookie,
      },
      body: JSON.stringify({
        action: "UPDATE_PROGRESS",
        projectId: createdProjectId,
        progressPct: 60,
        note: "Installation of cable trays completed.",
      }),
    });
    assert.equal(res1.status, 200, "Progress advance must succeed");

    // 2. Reject decrease without note (Rule BR-09)
    const res2 = await fetch(`${BASE_URL}/api/project-execution`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookie,
      },
      body: JSON.stringify({
        action: "UPDATE_PROGRESS",
        projectId: createdProjectId,
        progressPct: 40,
        note: "", // Empty note
      }),
    });
    assert.equal(res2.status, 400, "Decreasing progress without note must be rejected (BR-09)");

    // 3. Complete progress to 100%
    const res3 = await fetch(`${BASE_URL}/api/project-execution`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookie,
      },
      body: JSON.stringify({
        action: "UPDATE_PROGRESS",
        projectId: createdProjectId,
        progressPct: 100,
        note: "All electrical testing passed and commissioned.",
      }),
    });
    assert.equal(res3.status, 200, "100% completion must succeed");
    console.log("✓ Execution progress and BR-09 validation verified");
  });

  it("Step 8: Project Execution - Mark Payment Stage as PAID", async () => {
    // Fetch execution data to get stage ID
    const resExec = await fetch(`${BASE_URL}/api/project-execution`, {
      headers: { Cookie: sessionCookie },
    });
    const data = await resExec.json();
    const item = data.items.find((i: any) => i.id === createdProjectId);
    assert.ok(item, "Must find execution item");
    assert.ok(item.paymentStages.length > 0, "Must have payment stages");
    testStageId = item.paymentStages[0].id;

    const resPay = await fetch(`${BASE_URL}/api/project-execution`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookie,
      },
      body: JSON.stringify({
        action: "UPDATE_PAYMENT_STAGE",
        stageId: testStageId,
        status: "PAID",
      }),
    });

    assert.equal(resPay.status, 200, "Payment stage update must return 200");
    const pData = await resPay.json();
    assert.equal(pData.stage.status, "PAID");
    console.log("✓ Down payment stage marked as PAID");
  });

  it("Step 9: Operations - Record Handover & Auto-calculate Warranty & Retention", async () => {
    const bastNo = `BAST-088/${new Date().getFullYear()}`;
    const res = await fetch(`${BASE_URL}/api/operations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookie,
      },
      body: JSON.stringify({
        action: "RECORD_HANDOVER",
        projectId: createdProjectId,
        bastNo,
        handoverDate: "2026-11-21",
        warrantyMonths: 12,
        retentionPct: 5,
      }),
    });

    assert.equal(res.status, 200, "Record handover must return 200");
    const data = await res.json();
    assert.ok(data.handover, "Must return created handover");
    assert.equal(data.handover.warrantyMonths, 12);
    // 5% of 120,000,000 = 6,000,000
    assert.equal(Number(data.handover.retentionAmount), 6000000);
    console.log("✓ Handover recorded. Warranty: 12 months, Retention: Rp 6,000,000");
  });

  it("Step 10: Operations - Submit Vendor Performance Review & Release Retention", async () => {
    // 1. Submit review
    const resRev = await fetch(`${BASE_URL}/api/operations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookie,
      },
      body: JSON.stringify({
        action: "VENDOR_REVIEW",
        projectId: createdProjectId,
        vendorId: testVendorId,
        technicalScore: 85,
        nonTechnicalScore: 80,
        notes: "Timely delivery and safe working practices.",
      }),
    });
    assert.equal(resRev.status, 200, "Vendor review must return 200");

    // 2. Release retention
    const resRel = await fetch(`${BASE_URL}/api/operations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookie,
      },
      body: JSON.stringify({
        action: "RELEASE_RETENTION",
        projectId: createdProjectId,
      }),
    });
    assert.equal(resRel.status, 200, "Release retention must return 200");
    const rData = await resRel.json();
    assert.equal(rData.handover.status, "CLOSED");
    console.log("✓ Vendor review submitted & retention released -> CLOSED");
  });

  it("Step 11: Verify HTML Routes for all Phase 4 pages", async () => {
    const routes = ["/ppc", "/procurement", "/project", "/operations"];
    for (const route of routes) {
      const res = await fetch(`${BASE_URL}${route}`, {
        headers: { Cookie: sessionCookie },
      });
      assert.equal(res.status, 200, `${route} HTML page must return 200`);
    }
    console.log("✓ HTML pages verified for /ppc, /procurement, /project, /operations");
  });
});
