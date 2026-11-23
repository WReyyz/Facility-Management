import { describe, it } from "node:test";
import assert from "node:assert/strict";

const BASE_URL = "http://localhost:3000";

describe("Phase 3 Integration Tests", async () => {
  let sessionCookie = "";

  it("Step 1: Should authenticate as admin and obtain session cookie", async () => {
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
    assert.ok(sessionCookie.includes("facility_session="), "Must contain facility_session cookie");
  });

  it("Step 2: Should fetch dashboard KPI metrics", async () => {
    const res = await fetch(`${BASE_URL}/api/dashboard`, {
      headers: { Cookie: sessionCookie },
    });

    assert.equal(res.status, 200, "Dashboard API must return 200");
    const data = await res.json();
    assert.ok(Array.isArray(data.statCards), "statCards must be an array");
    assert.equal(data.statCards.length, 5, "Must have 5 stage cards");
    for (const card of data.statCards) {
      assert.ok(card.stage, "Card must have stage name");
      assert.ok(typeof card.active === "number", "Card active must be number");
      assert.ok(typeof card.total === "number", "Card total must be number");
      assert.ok(typeof card.completed === "number", "Card completed must be number");
    }

    assert.ok(Array.isArray(data.projectFlow), "ProjectFlow must be an array");
    assert.ok(data.vendorReadiness, "VendorReadiness must exist");
    assert.ok(Array.isArray(data.overdueItems), "OverdueItems must be an array");
    assert.ok(Array.isArray(data.dueSoonItems), "DueSoonItems must be an array");
    console.log("✓ Dashboard KPI check passed:", {
      stages: Object.keys(data.statCards),
      overdueCount: data.overdueItems.length,
      dueSoonCount: data.dueSoonItems.length,
    });
  });

  it("Step 3: Should fetch all projects list with 4-stage stepper data", async () => {
    const res = await fetch(`${BASE_URL}/api/projects`, {
      headers: { Cookie: sessionCookie },
    });

    assert.equal(res.status, 200, "Projects API must return 200");
    const data = await res.json();
    assert.ok(Array.isArray(data.projects), "Projects must be an array");
    assert.ok(data.projects.length >= 4, "Should have at least 4 projects");

    const p = data.projects[0];
    assert.ok(p.id, "Project must have id");
    assert.ok(p.name, "Project must have name");
    assert.ok(typeof p.stageProgressPct === "number", "Must calculate stageProgressPct");
    assert.ok(p.ppc !== undefined, "Must have ppc object or null");
    assert.ok(p.engineering !== undefined, "Must have engineering object or null");
    assert.ok(p.procurement !== undefined, "Must have procurement object or null");
    assert.ok(p.project !== undefined, "Must have project object or null");
    console.log("✓ Projects list check passed, total projects:", data.projects.length);
  });

  it("Step 4: Should filter projects by search keyword", async () => {
    const res = await fetch(`${BASE_URL}/api/projects?q=chiller`, {
      headers: { Cookie: sessionCookie },
    });

    assert.equal(res.status, 200, "Search query must return 200");
    const data = await res.json();
    assert.ok(data.projects.length >= 1, "Must find at least 1 chiller project");
    assert.ok(
      data.projects.some((p: any) => p.name.toLowerCase().includes("chiller")),
      "Results must match 'chiller'"
    );
    console.log("✓ Project search keyword filter passed:", data.projects.map((p: any) => p.name));
  });

  it("Step 5: Should fetch single project details with all properties and relations", async () => {
    const res = await fetch(`${BASE_URL}/api/projects/proj-sample-chiller-01`, {
      headers: { Cookie: sessionCookie },
    });

    assert.equal(res.status, 200, "Project detail must return 200");
    const data = await res.json();
    assert.ok(data.project, "Must return project object");
    assert.equal(data.project.id, "proj-sample-chiller-01");
    assert.ok(data.project.creator, "Must include creator");
    assert.ok(data.project.ppcRequest, "Must include PPC request");
    assert.ok(Array.isArray(data.project.tenderDocuments), "Must include tender documents");
    assert.ok(data.project.purchaseOrder, "Must include purchase order");
    assert.ok(Array.isArray(data.project.attachments), "Must include attachments");
    assert.ok(Array.isArray(data.project.progressUpdates), "Must include progress updates");
    console.log("✓ Project detail check passed for:", data.project.name);
  });

  it("Step 6: Should render projects list and detail pages as HTML", async () => {
    const resList = await fetch(`${BASE_URL}/projects`, {
      headers: { Cookie: sessionCookie },
    });
    assert.equal(resList.status, 200, "/projects HTML page must return 200");

    const resDetail = await fetch(`${BASE_URL}/projects/proj-sample-chiller-01`, {
      headers: { Cookie: sessionCookie },
    });
    assert.equal(resDetail.status, 200, "/projects/[id] HTML page must return 200");
    console.log("✓ Next.js HTML page routing verified for /projects and /projects/[id]");
  });
});
