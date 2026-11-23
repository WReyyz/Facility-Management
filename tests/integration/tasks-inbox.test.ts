import { describe, it } from "node:test";
import assert from "node:assert/strict";

const BASE_URL = "http://localhost:3000";

describe("My Tasks & Inbox Modules Tests", async () => {
  let sessionCookie = "";
  let firstTaskId = "";
  let unreadNotifIds: string[] = [];

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
    assert.ok(cookieHeader);
    sessionCookie = cookieHeader.split(";")[0];
  });

  it("Step 2: My Tasks - Query assigned tasks and telemetry strip", async () => {
    const res = await fetch(`${BASE_URL}/api/tasks`, {
      headers: { Cookie: sessionCookie },
    });

    assert.equal(res.status, 200, "My Tasks API must return 200");
    const data = await res.json();
    assert.ok(Array.isArray(data.tasks), "Must return tasks array");
    assert.ok(data.telemetry, "Must return telemetry object");
    assert.ok(typeof data.telemetry.avgCompletion === "number");
    assert.ok(typeof data.telemetry.attentionRequired === "number");
    assert.ok(typeof data.telemetry.activeStageLoad === "number");

    if (data.tasks.length > 0) {
      firstTaskId = data.tasks[0].id;
    }

    console.log(
      `✓ My Tasks fetched: ${data.tasks.length} tasks. Avg completion: ${data.telemetry.avgCompletion}%, Attention required: ${data.telemetry.attentionRequired}`
    );
  });

  it("Step 3: My Tasks - Filter tasks by status tab (overdue / in-progress)", async () => {
    const res = await fetch(`${BASE_URL}/api/tasks?status=in-progress`, {
      headers: { Cookie: sessionCookie },
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data.tasks));
    console.log(`✓ Filtered in-progress tasks count: ${data.tasks.length}`);
  });

  it("Step 4: Inbox - Fetch notification feeds and unread count", async () => {
    const res = await fetch(`${BASE_URL}/api/inbox`, {
      headers: { Cookie: sessionCookie },
    });

    assert.equal(res.status, 200, "Inbox API must return 200");
    const data = await res.json();
    assert.ok(Array.isArray(data.notifications), "Must return notifications list");
    assert.ok(typeof data.unreadCount === "number", "Must return unread count");

    unreadNotifIds = data.notifications.filter((n: any) => n.isUnread).map((n: any) => n.id);
    console.log(
      `✓ Inbox fetched: ${data.notifications.length} notifications, ${data.unreadCount} unread`
    );
  });

  it("Step 5: Inbox - Mark notification as read", async () => {
    if (unreadNotifIds.length > 0) {
      const targetId = unreadNotifIds[0];
      const res = await fetch(`${BASE_URL}/api/inbox`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: sessionCookie,
        },
        body: JSON.stringify({
          notificationId: targetId,
        }),
      });

      assert.equal(res.status, 200, "Mark read must return 200");
      console.log(`✓ Marked notification ${targetId} as read`);
    } else {
      console.log("✓ No unread notifications to mark");
    }
  });

  it("Step 6: Verify HTML Pages for /tasks and /inbox", async () => {
    const routes = ["/tasks", "/inbox"];

    for (const route of routes) {
      const res = await fetch(`${BASE_URL}${route}`, {
        headers: { Cookie: sessionCookie },
      });
      assert.equal(res.status, 200, `Page ${route} must render 200 OK`);
      const html = await res.text();
      assert.ok(html.includes("<!DOCTYPE html>"), `Page ${route} must be HTML`);
    }

    console.log("✓ HTML pages verified for /tasks and /inbox");
  });
});
