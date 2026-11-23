"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Mail,
  CheckCheck,
  AlertTriangle,
  ShoppingBag,
  Shield,
  MessageSquare,
  Clock,
  ArrowRight,
  RefreshCw,
  Bell,
  CheckCircle2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

export default function InboxPage() {
  const router = useRouter();
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [currentTab, setCurrentTab] = React.useState<"unread" | "all" | "overdue">("unread");

  const fetchInbox = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/inbox");
      const data = await res.json();
      if (data.notifications) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchInbox();
  }, [fetchInbox]);

  const handleMarkAllRead = async () => {
    const unreadIds = notifications.filter((n) => n.isUnread).map((n) => n.id);
    if (unreadIds.length === 0) return;

    try {
      await fetch("/api/inbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "MARK_ALL",
          allIds: unreadIds,
        }),
      });

      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isUnread: false }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleItemClick = async (notif: NotificationItem) => {
    if (notif.isUnread) {
      fetch("/api/inbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: notif.id }),
      }).catch(console.error);

      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isUnread: false } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    }

    router.push(`/projects/${notif.projectId}`);
  };

  const filteredNotifications = notifications.filter((n) => {
    if (currentTab === "unread") return n.isUnread;
    if (currentTab === "overdue") return n.category === "overdue" || n.category === "warranty";
    return true; // all
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "overdue":
        return (
          <div className="w-9 h-9 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4" />
          </div>
        );
      case "assignment":
        return (
          <div className="w-9 h-9 rounded-full bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-xs">
            PIC
          </div>
        );
      case "procurement":
        return (
          <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <ShoppingBag className="w-4 h-4" />
          </div>
        );
      case "warranty":
        return (
          <div className="w-9 h-9 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center">
            <Shield className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="w-9 h-9 rounded-full bg-zinc-100 text-zinc-700 flex items-center justify-center">
            <MessageSquare className="w-4 h-4" />
          </div>
        );
    }
  };

  const getBadgeVariant = (category: string) => {
    switch (category) {
      case "overdue":
        return "danger";
      case "assignment":
        return "info";
      case "procurement":
        return "success";
      case "warranty":
        return "warning";
      default:
        return "neutral";
    }
  };

  return (
    <div className="max-w-[1040px] mx-auto space-y-6">
      {/* Header matching Stitch screen */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">
              Inbox
            </h1>
            {unreadCount > 0 ? (
              <span className="px-2 py-0.5 rounded-full bg-black text-white text-xs font-semibold">
                {unreadCount} New
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-[var(--bg-subtle)] text-[var(--text-muted)] text-xs font-medium">
                All Read
              </span>
            )}
          </div>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Assignments, overdue alerts, and stage handoffs
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchInbox}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
            className="flex items-center gap-1.5"
          >
            <CheckCheck className="h-4 w-4 text-[var(--text-muted)]" />
            Mark all as read
          </Button>
        </div>
      </div>

      {/* Segmented Tabs & Synced status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="inline-flex p-1 rounded-[var(--r-md)] bg-[var(--bg-subtle)] gap-1">
          <button
            onClick={() => setCurrentTab("unread")}
            className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
              currentTab === "unread"
                ? "bg-[var(--bg)] text-[var(--text)] shadow-sm font-semibold"
                : "text-[var(--text-muted)] hover:text-[var(--text)]"
            }`}
          >
            Unread ({unreadCount})
          </button>
          <button
            onClick={() => setCurrentTab("all")}
            className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
              currentTab === "all"
                ? "bg-[var(--bg)] text-[var(--text)] shadow-sm font-semibold"
                : "text-[var(--text-muted)] hover:text-[var(--text)]"
            }`}
          >
            All Notifications
          </button>
          <button
            onClick={() => setCurrentTab("overdue")}
            className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
              currentTab === "overdue"
                ? "bg-[var(--bg)] text-[var(--text)] shadow-sm font-semibold"
                : "text-[var(--text-muted)] hover:text-[var(--text)]"
            }`}
          >
            <span>Overdue & Alerts</span>
            <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
          <Clock className="w-3.5 h-3.5" />
          <span>Synced just now</span>
        </div>
      </div>

      {/* Notifications List Card */}
      <Card className="divide-y divide-[var(--border)] overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-[var(--text-muted)]">
            Loading notifications...
          </div>
        ) : filteredNotifications.length === 0 ? (
          /* Empty State matching design.md 353 and Stitch */
          <div className="py-16 px-6 flex flex-col items-center justify-center text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-[var(--bg-subtle)] text-[var(--text-muted)] flex items-center justify-center mb-1">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
            <p className="font-semibold text-base text-[var(--text)]">
              All caught up
            </p>
            <p className="text-xs text-[var(--text-muted)] max-w-sm">
              You have no unread notifications in this view. Switch to All Notifications to review past activity.
            </p>
          </div>
        ) : (
          filteredNotifications.map((item) => (
            <div
              key={item.id}
              className={`p-4 flex items-start sm:items-center justify-between gap-4 transition-colors hover:bg-[var(--bg-subtle)] ${
                item.isUnread ? "bg-[var(--bg)] font-medium" : "bg-[var(--bg)] opacity-75"
              }`}
            >
              <div className="flex items-start gap-3.5 min-w-0 flex-1">
                {/* Category Icon with relative unread dot */}
                <div className="relative shrink-0 mt-0.5 sm:mt-0">
                  {getCategoryIcon(item.category)}
                  {item.isUnread && (
                    <span className="absolute -top-0.5 -left-0.5 w-2.5 h-2.5 rounded-full bg-black ring-2 ring-white" />
                  )}
                </div>

                {/* Content */}
                <div className="flex flex-col gap-1 min-w-0 flex-1 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-sm text-[var(--text)] ${item.isUnread ? "font-semibold" : "font-normal"}`}>
                      {item.title}
                    </span>
                    <Badge variant={getBadgeVariant(item.category) as any}>
                      {item.stage}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[var(--text-muted)]">
                    <span>{item.meta}</span>
                    <span>•</span>
                    <span>{item.timestamp}</span>
                  </div>
                </div>
              </div>

              {/* View Action Button */}
              <div className="shrink-0">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleItemClick(item)}
                  className="h-8 px-3 text-xs"
                >
                  View <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
