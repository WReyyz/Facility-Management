"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Search,
  Share2,
  Bell,
  Menu,
  Check,
  Copy,
  Printer,
  Mail,
  ExternalLink,
  CheckCheck,
  AlertTriangle,
  ShoppingBag,
  Shield,
  Clock,
  FileText,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TopbarProps {
  onMobileMenuClick?: () => void;
}

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

const SECTION_NAMES: Record<string, string> = {
  dashboard: "Dashboard",
  tasks: "My Tasks",
  inbox: "Inbox",
  projects: "Project Search",
  ppc: "PPC Requests",
  engineering: "Engineering",
  procurement: "Procurement",
  project: "Project Execution",
  operations: "Operations & Handover",
  vendors: "Vendor Performance",
  admin: "Administration",
  account: "My Account",
  help: "Help Center",
};

export function Topbar({ onMobileMenuClick }: TopbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const segments = pathname.split("/").filter(Boolean);
  const currentSection = segments[0] ? SECTION_NAMES[segments[0]] || segments[0] : "Dashboard";
  const subSection = segments[1];

  // Search input state
  const [searchQuery, setSearchQuery] = React.useState("");
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Popover states
  const [shareOpen, setShareOpen] = React.useState(false);
  const [notifOpen, setNotifOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  // Notifications state
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = React.useState<number>(0);
  const [loadingNotifs, setLoadingNotifs] = React.useState<boolean>(false);

  // Container refs for click-outside
  const shareRef = React.useRef<HTMLDivElement>(null);
  const notifRef = React.useRef<HTMLDivElement>(null);

  // Fetch notifications for the topbar bell
  const fetchNotifications = React.useCallback(async () => {
    try {
      setLoadingNotifs(true);
      const res = await fetch("/api/inbox");
      if (res.ok) {
        const data = await res.json();
        if (data.notifications) {
          setNotifications(data.notifications.slice(0, 6));
          setUnreadCount(typeof data.unreadCount === "number" ? data.unreadCount : 0);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingNotifs(false);
    }
  }, []);

  React.useEffect(() => {
    fetchNotifications();
    // Poll notifications every 60 seconds
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Handle click outside to close popovers
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) {
        setShareOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard shortcut: '/' focuses search input, 'Escape' closes popovers
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShareOpen(false);
        setNotifOpen(false);
      } else if (
        e.key === "/" &&
        !["input", "textarea"].includes((e.target as HTMLElement)?.tagName?.toLowerCase())
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Handle Global Search Submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/projects?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Handle Copy Link
  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Handle Mark All as Read
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

      setNotifications((prev) => prev.map((n) => ({ ...n, isUnread: false })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Single Notification Click
  const handleNotifClick = async (notif: NotificationItem) => {
    if (notif.isUnread) {
      fetch("/api/inbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: notif.id }),
      }).catch(console.error);

      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isUnread: false } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
    setNotifOpen(false);

    if (notif.projectId) {
      router.push(`/projects/${notif.projectId}`);
    } else {
      router.push("/inbox");
    }
  };

  // Check if current page is project detail
  const isProjectDetail = segments[0] === "projects" && segments[1] && segments[1] !== "report";
  const currentProjectId = isProjectDetail ? segments[1] : null;

  return (
    <header className="h-14 border-b border-[var(--border)] bg-[var(--bg)] px-4 sm:px-6 flex items-center justify-between shrink-0 select-none relative z-30">
      {/* Left: Mobile Toggle & Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        {onMobileMenuClick && (
          <button
            onClick={onMobileMenuClick}
            className="md:hidden p-1.5 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-subtle)] rounded-[var(--r-md)] cursor-pointer"
            title="Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs sm:text-sm text-[var(--text-muted)] min-w-0">
          <span className="font-normal text-[var(--text-muted)] hidden sm:inline shrink-0">Facility Management</span>
          <span className="text-[var(--text-faint)] hidden sm:inline">›</span>
          <span className="px-2 py-0.5 rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--bg-subtle)] text-[var(--text)] font-medium shrink-0">
            {currentSection}
          </span>
          {subSection && (
            <>
              <span className="text-[var(--text-faint)]">›</span>
              <span className="font-medium text-[var(--text)] truncate max-w-[140px] sm:max-w-[200px]">
                {subSection}
              </span>
            </>
          )}
        </nav>
      </div>

      {/* Right: Search, Share, Notification */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Global Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative hidden md:block w-64 lg:w-80">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search project, tender no., PO, vendor..."
            className="w-full h-8 pl-8 pr-10 text-xs rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--bg)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--text)] transition-colors"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.2 rounded bg-[var(--bg-subtle)] text-[10px] font-mono text-[var(--text-muted)] border border-[var(--border)]">
            /
          </kbd>
        </form>

        {/* 1. Share & Export Button + Popover */}
        <div className="relative" ref={shareRef}>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            onClick={() => {
              setShareOpen(!shareOpen);
              setNotifOpen(false);
            }}
            className={cn(
              "h-8 w-8 text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer transition-colors",
              shareOpen && "bg-[var(--bg-active)] text-[var(--text)] border-[var(--border-hover)]"
            )}
            title="Share & Export Page"
          >
            <Share2 className="w-3.5 h-3.5" />
          </Button>

          {shareOpen && (
            <div className="absolute right-0 top-10 w-80 bg-white rounded-xl border border-[var(--border)] shadow-xl p-3.5 space-y-3 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border-soft)]">
                <div>
                  <h4 className="text-xs font-bold text-[var(--text)]">Bagikan &amp; Ekspor</h4>
                  <p className="text-[10px] text-[var(--text-muted)]">Salin link atau cetak tampilan dokumen ini</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShareOpen(false)}
                  className="text-[var(--text-muted)] hover:text-[var(--text)] text-xs cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Copy URL Input */}
              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                  Tautan Halaman
                </span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    readOnly
                    value={typeof window !== "undefined" ? window.location.href : ""}
                    className="flex-1 h-7 px-2 text-[11px] font-mono rounded border border-[var(--border)] bg-[var(--bg-subtle)] text-[var(--text-secondary)] truncate focus:outline-none select-all"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={handleCopyLink}
                    className="h-7 px-2.5 text-xs gap-1 shrink-0"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-700 font-semibold">Tersalin</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-[var(--text-muted)]" />
                        <span>Salin</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-1 pt-1 border-t border-[var(--border-soft)]">
                {/* Print / PDF */}
                <button
                  type="button"
                  onClick={() => {
                    setShareOpen(false);
                    setTimeout(() => window.print(), 100);
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-[var(--text)] hover:bg-[var(--bg-active)] transition-colors text-left cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  <div className="flex flex-col">
                    <span className="font-medium">Cetak Dokumen / Simpan PDF</span>
                    <span className="text-[10px] text-[var(--text-muted)]">Cetak lembar kerja via dialog cetak browser</span>
                  </div>
                </button>

                {/* Email Share */}
                <a
                  href={`mailto:?subject=${encodeURIComponent(
                    `Facility Management - ${currentSection}`
                  )}&body=${encodeURIComponent(
                    `Halo,\n\nBerikut tautan modul ${currentSection} pada sistem Facility Management:\n${
                      typeof window !== "undefined" ? window.location.href : ""
                    }`
                  )}`}
                  onClick={() => setShareOpen(false)}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-[var(--text)] hover:bg-[var(--bg-active)] transition-colors text-left cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  <div className="flex flex-col">
                    <span className="font-medium">Kirim via Email</span>
                    <span className="text-[10px] text-[var(--text-muted)]">Bagikan tautan ini ke tim melalui email</span>
                  </div>
                </a>

                {/* Project Executive Dossier Report shortcut */}
                {currentProjectId && (
                  <Link
                    href={`/projects/${currentProjectId}/report`}
                    onClick={() => setShareOpen(false)}
                    className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-emerald-800 bg-emerald-50 hover:bg-emerald-100/80 transition-colors text-left"
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-700" />
                    <div className="flex flex-col">
                      <span className="font-semibold">Executive Dossier Report</span>
                      <span className="text-[10px] text-emerald-700/80">Laporan cetak resmi dossier proyek ini</span>
                    </div>
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 2. Notifications Bell Button + Popover */}
        <div className="relative" ref={notifRef}>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            onClick={() => {
              setNotifOpen(!notifOpen);
              setShareOpen(false);
              if (!notifOpen) {
                fetchNotifications();
              }
            }}
            className={cn(
              "relative h-8 w-8 text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer transition-colors",
              notifOpen && "bg-[var(--bg-active)] text-[var(--text)] border-[var(--border-hover)]"
            )}
            title="Notifikasi & Peringatan Sistem"
          >
            <Bell className="w-3.5 h-3.5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[var(--danger)] ring-2 ring-white animate-pulse" />
            )}
          </Button>

          {notifOpen && (
            <div className="absolute right-0 top-10 w-80 sm:w-96 bg-white rounded-xl border border-[var(--border)] shadow-xl py-3 z-50 animate-in fade-in zoom-in-95 duration-150">
              {/* Header */}
              <div className="px-4 pb-2.5 border-b border-[var(--border-soft)] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-[var(--text)]">Notifikasi Sistem</h4>
                  {unreadCount > 0 && (
                    <Badge variant="danger" size="sm" className="font-mono text-[10px]">
                      {unreadCount} Baru
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      className="text-[11px] font-medium text-[var(--text-muted)] hover:text-[var(--text)] flex items-center gap-1 cursor-pointer transition-colors"
                      title="Tandai semua dibaca"
                    >
                      <CheckCheck className="w-3 h-3 text-emerald-600" />
                      <span>Baca Semua</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setNotifOpen(false)}
                    className="text-[var(--text-muted)] hover:text-[var(--text)] text-xs cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Feed List */}
              <div className="max-h-80 overflow-y-auto divide-y divide-[var(--border-soft)]">
                {loadingNotifs && notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[var(--text-muted)]">
                    Memuat notifikasi...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell className="w-7 h-7 text-[var(--text-faint)] mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-medium text-[var(--text)]">Semua sudah terpantau</p>
                    <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                      Tidak ada pemberitahuan baru saat ini
                    </p>
                  </div>
                ) : (
                  notifications.map((notif) => {
                    const isOverdue = notif.category === "overdue";
                    const isAssignment = notif.category === "assignment";
                    const isProcurement = notif.category === "procurement";
                    const isWarranty = notif.category === "warranty";

                    return (
                      <div
                        key={notif.id}
                        onClick={() => handleNotifClick(notif)}
                        className={cn(
                          "px-4 py-2.5 flex items-start gap-3 hover:bg-[var(--bg-active)] transition-colors cursor-pointer text-left relative",
                          notif.isUnread ? "bg-amber-50/30" : "bg-white"
                        )}
                      >
                        {/* Category Icon */}
                        <div
                          className={cn(
                            "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                            isOverdue && "bg-red-100 text-red-700",
                            isAssignment && "bg-blue-100 text-blue-700",
                            isProcurement && "bg-purple-100 text-purple-700",
                            isWarranty && "bg-emerald-100 text-emerald-700"
                          )}
                        >
                          {isOverdue && <AlertTriangle className="w-3.5 h-3.5" />}
                          {isAssignment && <Clock className="w-3.5 h-3.5" />}
                          {isProcurement && <ShoppingBag className="w-3.5 h-3.5" />}
                          {isWarranty && <Shield className="w-3.5 h-3.5" />}
                        </div>

                        {/* Text Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <p
                              className={cn(
                                "text-xs truncate",
                                notif.isUnread
                                  ? "font-semibold text-[var(--text)]"
                                  : "font-normal text-[var(--text-secondary)]"
                              )}
                            >
                              {notif.title}
                            </p>
                            {notif.isUnread && (
                              <span className="w-1.5 h-1.5 rounded-full bg-[var(--danger)] shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)] mt-0.5">
                            <span className="font-mono">{notif.docNo}</span>
                            <span>•</span>
                            <span className="truncate">{notif.meta}</span>
                          </div>
                          <span className="text-[9px] text-[var(--text-faint)] mt-1 block">
                            {notif.timestamp}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="px-4 pt-2.5 border-t border-[var(--border-soft)] text-center">
                <Link
                  href="/inbox"
                  onClick={() => setNotifOpen(false)}
                  className="text-xs font-semibold text-[var(--text)] hover:underline inline-flex items-center gap-1"
                >
                  <span>Buka Semua di Inbox ({unreadCount} unread)</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
