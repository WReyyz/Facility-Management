import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { getCurrentUser } from "@/server/auth";
import { EngineeringStatus, ProjectExecutionStatus, PpcStatus, Stage } from "@prisma/client";

interface NotificationItem {
  id: string;
  category: "overdue" | "assignment" | "procurement" | "warranty" | "comment";
  title: string;
  docNo: string;
  stage: string;
  meta: string;
  timestamp: string;
  projectId: string;
  isUnread: boolean;
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const in7Days = new Date(Date.now() + 7 * 24 * 3600 * 1000);
    const in30Days = new Date(Date.now() + 30 * 24 * 3600 * 1000);

    // Fetch user's read notification IDs from Setting
    const readSetting = await prisma.setting.findUnique({
      where: { settingKey: `inbox_read_${user.id}` },
    });
    const readIds = new Set<string>(
      Array.isArray(readSetting?.settingValue) ? (readSetting.settingValue as string[]) : []
    );

    const notifications: NotificationItem[] = [];

    // 1. Check Overdue & Due Soon Tenders
    const activeTenders = await prisma.tenderDocument.findMany({
      where: { status: { in: [EngineeringStatus.NOT_STARTED, EngineeringStatus.IN_PROGRESS] } },
      include: { project: true, engineer: true },
      take: 10,
    });

    activeTenders.forEach((t) => {
      if (t.finishDate) {
        const finish = new Date(t.finishDate);
        if (finish < now) {
          const daysOver = Math.max(1, Math.ceil((now.getTime() - finish.getTime()) / (1000 * 3600 * 24)));
          const id = `notif_tender_overdue_${t.id}`;
          notifications.push({
            id,
            category: "overdue",
            title: `${t.tenderNo} is overdue by ${daysOver} day${daysOver > 1 ? "s" : ""}`,
            docNo: t.tenderNo,
            stage: "Engineering",
            meta: `SLA Deadline: ${finish.toLocaleDateString("id-ID")} • ${t.project.name}`,
            timestamp: "Recently",
            projectId: t.projectId,
            isUnread: !readIds.has(id),
          });
        } else if (finish <= in7Days) {
          const daysLeft = Math.ceil((finish.getTime() - now.getTime()) / (1000 * 3600 * 24));
          const id = `notif_tender_duesoon_${t.id}`;
          notifications.push({
            id,
            category: "overdue",
            title: `${t.tenderNo} deadline approaching in ${daysLeft} day${daysLeft > 1 ? "s" : ""}`,
            docNo: t.tenderNo,
            stage: "Engineering",
            meta: `Due: ${finish.toLocaleDateString("id-ID")} • Assigned to ${t.engineer?.fullName || "Engineering"}`,
            timestamp: "Upcoming",
            projectId: t.projectId,
            isUnread: !readIds.has(id),
          });
        }
      }
    });

    // 2. Check Recent PPC Requests
    const recentPpcs = await prisma.ppcRequest.findMany({
      where: { status: { in: [PpcStatus.SUBMITTED, PpcStatus.APPROVED] } },
      include: { project: true, pic: true },
      take: 5,
      orderBy: { targetDate: "desc" },
    });

    recentPpcs.forEach((p) => {
      const id = `notif_ppc_${p.id}`;
      notifications.push({
        id,
        category: "assignment",
        title: `PPC Request ${p.requestNo} - ${p.project.name}`,
        docNo: p.requestNo,
        stage: "PPC Request",
        meta: `Target: ${new Date(p.targetDate).toLocaleDateString("id-ID")} • PIC: ${p.pic?.fullName || "PPC Team"}`,
        timestamp: "Stage Handoff",
        projectId: p.projectId,
        isUnread: !readIds.has(id),
      });
    });

    // 3. Check Recent Purchase Orders Issued
    const recentPos = await prisma.purchaseOrder.findMany({
      include: { project: true, vendor: true },
      take: 5,
      orderBy: { issuedAt: "desc" },
    });

    recentPos.forEach((po) => {
      const id = `notif_po_${po.id}`;
      notifications.push({
        id,
        category: "procurement",
        title: `Procurement issued PO ${po.poNo} to ${po.vendor.name}`,
        docNo: po.poNo,
        stage: "Procurement",
        meta: `Total PO: Rp ${Number(po.amount).toLocaleString("id-ID")} • ${po.project.name}`,
        timestamp: "PO Released",
        projectId: po.projectId,
        isUnread: !readIds.has(id),
      });
    });

    // 4. Check Warranty Alerts (expiring in 30 days)
    const expiringHandovers = await prisma.handover.findMany({
      where: {
        warrantyEnd: {
          gt: now,
          lte: in30Days,
        },
      },
      include: { project: true },
      take: 5,
    });

    expiringHandovers.forEach((h) => {
      const id = `notif_warranty_${h.id}`;
      const daysLeft = Math.ceil((new Date(h.warrantyEnd!).getTime() - now.getTime()) / (1000 * 3600 * 24));
      notifications.push({
        id,
        category: "warranty",
        title: `Warranty expiring in ${daysLeft} days for ${h.project.name}`,
        docNo: `BAST-${h.projectId.slice(0, 8)}`,
        stage: "Operations",
        meta: `Warranty End: ${new Date(h.warrantyEnd!).toLocaleDateString("id-ID")} • Retention: Rp ${Number(h.retentionAmount || 0).toLocaleString("id-ID")}`,
        timestamp: "Warranty Alert",
        projectId: h.projectId,
        isUnread: !readIds.has(id),
      });
    });

    // 5. Recent Progress Updates / Comments
    const recentUpdates = await prisma.progressUpdate.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { project: true, actor: true },
    });

    recentUpdates.forEach((pu) => {
      const id = `notif_update_${pu.id}`;
      notifications.push({
        id,
        category: "comment",
        title: `${pu.actor.fullName} updated ${pu.project.name}`,
        docNo: `STAGE-${pu.stage}`,
        stage: pu.stage,
        meta: pu.note || `Status transition: ${pu.oldValue || "—"} → ${pu.newValue || "—"}`,
        timestamp: new Date(pu.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        projectId: pu.projectId,
        isUnread: !readIds.has(id),
      });
    });

    const unreadCount = notifications.filter((n) => n.isUnread).length;

    return NextResponse.json({
      notifications,
      unreadCount,
      totalCount: notifications.length,
    });
  } catch (error) {
    console.error("Inbox GET error:", error);
    return NextResponse.json({ error: "Failed to fetch notifications." }, { status: 500 });
  }
}

// POST /api/inbox - Mark notification(s) as read
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, notificationId, allIds } = body;

    const key = `inbox_read_${user.id}`;
    const setting = await prisma.setting.findUnique({ where: { settingKey: key } });
    const current = new Set<string>(
      Array.isArray(setting?.settingValue) ? (setting.settingValue as string[]) : []
    );

    if (action === "MARK_ALL" && Array.isArray(allIds)) {
      allIds.forEach((id: string) => current.add(id));
    } else if (notificationId) {
      current.add(notificationId);
    }

    await prisma.setting.upsert({
      where: { settingKey: key },
      update: { settingValue: Array.from(current) },
      create: { settingKey: key, settingValue: Array.from(current) },
    });

    return NextResponse.json({ success: true, readCount: current.size });
  } catch (error) {
    console.error("Inbox POST error:", error);
    return NextResponse.json({ error: "Failed to update notifications." }, { status: 500 });
  }
}
