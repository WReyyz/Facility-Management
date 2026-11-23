import { describe, it } from "node:test";
import assert from "node:assert/strict";

const BASE_URL = "http://localhost:3000";

describe("Phase 5 Administration, Governance & Reporting Tests", async () => {
  let adminCookie = "";
  let viewerCookie = "";
  let createdTestUserId = "";
  let testProjectId = "";

  it("Step 1: Authenticate as Admin", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "admin",
        password: "adminpassword123",
      }),
    });

    assert.equal(res.status, 200, "Admin login must succeed");
    const cookieHeader = res.headers.get("set-cookie");
    assert.ok(cookieHeader, "Must return set-cookie header");
    adminCookie = cookieHeader.split(";")[0];
  });

  it("Step 2: Admin Users - Query user list and administrative statistics", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/users`, {
      headers: { Cookie: adminCookie },
    });

    assert.equal(res.status, 200, "Admin users list must return 200");
    const data = await res.json();
    assert.ok(Array.isArray(data.users), "Must return users array");
    assert.ok(data.stats, "Must return stats object");
    assert.ok(data.stats.total >= 7, "Must have initial seeded users");
    assert.ok(data.stats.active >= 1, "Must have active users");
    console.log(`✓ Admin users fetched. Total: ${data.stats.total}, Active: ${data.stats.active}`);
  });

  it("Step 3: Admin Users - Create new user with scrypt password hash", async () => {
    const uniqueUsername = `eng_test_${Date.now().toString().slice(-4)}`;
    const res = await fetch(`${BASE_URL}/api/admin/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        username: uniqueUsername,
        fullName: "Test Engineer Lead",
        role: "ENGINEERING",
        password: "SecretPassword123!",
        mustChangePassword: true,
      }),
    });

    assert.equal(res.status, 201, "User creation must return 201");
    const data = await res.json();
    assert.ok(data.user, "Must return created user");
    assert.equal(data.user.role, "ENGINEERING");
    assert.equal(data.user.mustChangePassword, true);
    createdTestUserId = data.user.id;
    console.log(`✓ New user created: @${data.user.username} (ID: ${createdTestUserId})`);
  });

  it("Step 4: Admin Users - Update user role & reset password", async () => {
    assert.ok(createdTestUserId, "User ID must exist from Step 3");

    // Change role to PROJECT
    const roleRes = await fetch(`${BASE_URL}/api/admin/users`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        userId: createdTestUserId,
        action: "CHANGE_ROLE",
        role: "PROJECT",
      }),
    });

    assert.equal(roleRes.status, 200, "Role update must return 200");
    const roleData = await roleRes.json();
    assert.equal(roleData.user.role, "PROJECT");

    // Reset password
    const resetRes = await fetch(`${BASE_URL}/api/admin/users`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        userId: createdTestUserId,
        action: "RESET_PASSWORD",
        newPassword: "BrandNewSecurePassword456!",
        mustChangePassword: false,
      }),
    });

    assert.equal(resetRes.status, 200, "Password reset must return 200");
    console.log("✓ User role updated to PROJECT and password reset successfully");
  });

  it("Step 5: Authenticate as Viewer and verify 403 Forbidden for Admin endpoints", async () => {
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "viewer",
        password: "password123",
      }),
    });

    assert.equal(loginRes.status, 200, "Viewer login must succeed");
    const cookieHeader = loginRes.headers.get("set-cookie");
    assert.ok(cookieHeader);
    viewerCookie = cookieHeader.split(";")[0];

    // Attempt to access /api/admin/users as VIEWER
    const usersForbiddenRes = await fetch(`${BASE_URL}/api/admin/users`, {
      headers: { Cookie: viewerCookie },
    });
    assert.equal(usersForbiddenRes.status, 403, "Non-admin must be 403 Forbidden from users API");

    // Attempt to access /api/admin/audit-logs as VIEWER
    const auditForbiddenRes = await fetch(`${BASE_URL}/api/admin/audit-logs`, {
      headers: { Cookie: viewerCookie },
    });
    assert.equal(auditForbiddenRes.status, 403, "Non-admin must be 403 Forbidden from audit-logs API");
    console.log("✓ RBAC enforcement verified: Non-admin users strictly denied (403)");
  });

  it("Step 6: Admin Audit Trail - Fetch immutable audit logs and verify user events", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/audit-logs?entity=USER`, {
      headers: { Cookie: adminCookie },
    });

    assert.equal(res.status, 200, "Audit logs API must return 200");
    const data = await res.json();
    assert.ok(Array.isArray(data.logs), "Must return logs array");
    assert.ok(data.logs.length >= 1, "Must contain recorded audit logs");

    const createdEvent = data.logs.find((l: any) => l.action === "USER_CREATED");
    assert.ok(createdEvent, "Must find USER_CREATED audit log event");
    assert.ok(createdEvent.actorName, "Must record actor name in audit log");
    console.log(`✓ Audit trail verified: found ${data.logs.length} logged administrative events`);
  });

  it("Step 7: Project Report Dossier - Verify printable executive report route", async () => {
    // 1. Fetch an existing project ID from /api/projects
    const projRes = await fetch(`${BASE_URL}/api/projects`, {
      headers: { Cookie: adminCookie },
    });
    const projData = await projRes.json();
    assert.ok(projData.projects.length > 0, "Must have projects");
    testProjectId = projData.projects[0].id;

    // 2. Query project report route
    const reportHtmlRes = await fetch(`${BASE_URL}/projects/${testProjectId}/report`, {
      headers: { Cookie: adminCookie },
    });
    assert.equal(reportHtmlRes.status, 200, "Project report dossier page must return 200 HTML");
    const htmlText = await reportHtmlRes.text();
    assert.ok(
      htmlText.includes("Generating official project report dossier") ||
        htmlText.toLowerCase().includes("project dossier") ||
        htmlText.toLowerCase().includes("report"),
      "Must contain report initial view or headings"
    );
    console.log(`✓ Project executive report dossier verified for Project ID: ${testProjectId}`);
  });

  it("Step 8: Verify HTML Navigation & Pages for all Admin routes", async () => {
    const routes = ["/admin/users", "/admin/audit-logs"];

    for (const route of routes) {
      const res = await fetch(`${BASE_URL}${route}`, {
        headers: { Cookie: adminCookie },
      });
      assert.equal(res.status, 200, `Page ${route} must render HTML successfully`);
      const html = await res.text();
      assert.ok(html.includes("<!DOCTYPE html>"), `Page ${route} must be valid HTML`);
    }

    console.log("✓ HTML pages verified for /admin/users and /admin/audit-logs");
  });
});
