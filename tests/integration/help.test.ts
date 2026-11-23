import test from "node:test";
import assert from "node:assert";

test("Help Center & Operational SOP Route Verification", async (t) => {
  const baseUrl = "http://localhost:3000";

  await t.test("Step 1: Unauthenticated request to /help redirects to /login", async () => {
    const res = await fetch(`${baseUrl}/help`, {
      redirect: "manual",
    });
    // In Next.js middleware, unauth redirects with status 307
    assert.strictEqual(res.status, 307);
    const location = res.headers.get("location");
    assert.ok(location?.includes("/login"), `Expected redirect to /login, got ${location}`);
    console.log("✓ Unauthenticated /help correctly redirects to /login");
  });

  let authCookie = "";

  await t.test("Step 2: Authenticate as Admin user", async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "admin", password: "adminpassword123" }),
    });
    assert.strictEqual(res.status, 200);
    const cookies = res.headers.getSetCookie ? res.headers.getSetCookie() : [res.headers.get("set-cookie")];
    authCookie = (cookies as string[]).map((c) => c.split(";")[0]).join("; ");
    assert.ok(authCookie.includes("facility_session="), "Auth cookie facility_session received");
    console.log("✓ Authenticated as admin, cookie acquired");
  });

  await t.test("Step 3: Access /help with authenticated session", async () => {
    const res = await fetch(`${baseUrl}/help`, {
      headers: { cookie: authCookie },
    });
    assert.strictEqual(res.status, 200);
    const html = await res.text();

    // Verify key titles and modules
    assert.ok(html.includes("Help Center &amp; Operational SOP") || html.includes("Help Center & Operational SOP"), "Contains header title");
    assert.ok(html.includes("Documentation &amp; Knowledge Base") || html.includes("Documentation & Knowledge Base"), "Contains supertitle");
    assert.ok(html.includes("SOP-01"), "Contains SOP-01 Project Lifecycle");
    assert.ok(html.includes("REF-04"), "Contains REF-04 Working Days Formula");
    assert.ok(html.includes("MTR-09"), "Contains MTR-09 Vendor Scoring");
    assert.ok(html.includes("SEC-02"), "Contains SEC-02 RBAC Authority");
    assert.ok(html.includes("Standard Operating Blueprint"), "Contains Operating Workflow Blueprint");
    assert.ok(html.includes("Role-Based Access Matrix"), "Contains RBAC table");
    assert.ok(html.includes("Helpdesk &amp; Eskalasi") || html.includes("Helpdesk & Eskalasi"), "Contains Helpdesk card");
    assert.ok(html.includes("Siti Rahma"), "Contains Lead System Administrator");

    console.log("✓ /help loaded with 200 OK and all operational SOP & RBAC modules rendered");
  });
});
