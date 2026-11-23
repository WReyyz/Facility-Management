"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CheckSquare,
  Mail,
  Search,
  CircleDot,
  PenTool,
  Coins,
  Flag,
  Home,
  Star,
  Settings,
  ChevronDown,
  ChevronRight,
  Plus,
  HelpCircle,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  currentUser?: {
    name: string;
    username: string;
    role: string;
  };
}

export function Sidebar({
  collapsed = false,
  onToggleCollapse,
  currentUser: initialUser,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [pinnedOpen, setPinnedOpen] = React.useState(true);
  const [profileMenuOpen, setProfileMenuOpen] = React.useState(false);
  const [createMenuOpen, setCreateMenuOpen] = React.useState(false);
  const createMenuRef = React.useRef<HTMLDivElement>(null);
  const profileMenuRef = React.useRef<HTMLDivElement>(null);

  const [user, setUser] = React.useState(
    initialUser || {
      name: "Loading...",
      username: "...",
      role: "...",
    }
  );
  const [unreadInboxCount, setUnreadInboxCount] = React.useState<number | null>(null);
  const [pinnedProjects, setPinnedProjects] = React.useState<Array<{ id: string; name: string }>>([]);

  React.useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          setUser({
            name: data.user.fullName,
            username: data.user.username,
            role: data.user.role,
          });
        }
      })
      .catch(console.error);

    fetch("/api/inbox")
      .then((r) => r.json())
      .then((data) => {
        if (typeof data.unreadCount === "number") {
          setUnreadInboxCount(data.unreadCount);
        }
      })
      .catch(console.error);

    fetch("/api/projects")
      .then((r) => r.json())
      .then((data) => {
        if (data.projects && Array.isArray(data.projects) && data.projects.length > 0) {
          setPinnedProjects(
            data.projects.slice(0, 3).map((p: any) => ({
              id: p.id,
              name: p.name,
            }))
          );
        }
      })
      .catch(console.error);
  }, []);

  // Handle click outside to close menus
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (createMenuRef.current && !createMenuRef.current.contains(e.target as Node)) {
        setCreateMenuOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard shortcut: 'c' opens Create New menu, 'Escape' closes
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setCreateMenuOpen(false);
        setProfileMenuOpen(false);
      } else if (
        e.key.toLowerCase() === "c" &&
        !["input", "textarea"].includes((e.target as HTMLElement)?.tagName?.toLowerCase()) &&
        !(e.metaKey || e.ctrlKey || e.altKey)
      ) {
        e.preventDefault();
        setCreateMenuOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  };

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "My Tasks", href: "/tasks", icon: CheckSquare },
    {
      label: "Inbox",
      href: "/inbox",
      icon: Mail,
      badge: unreadInboxCount !== null && unreadInboxCount > 0 ? String(unreadInboxCount) : undefined,
    },
    { label: "Project Search", href: "/projects", icon: Search },
    { label: "PPC Requests", href: "/ppc", icon: CircleDot },
    { label: "Engineering", href: "/engineering", icon: PenTool },
    { label: "Procurement", href: "/procurement", icon: Coins },
    { label: "Project", href: "/project", icon: Flag },
    { label: "Operations", href: "/operations", icon: Home },
    { label: "Vendor Performance", href: "/vendors", icon: Star },
    ...(user.role === "ADMIN"
      ? [
          { label: "Admin › Users", href: "/admin/users", icon: Settings },
          { label: "Admin › Audit Logs", href: "/admin/audit-logs", icon: CheckSquare },
        ]
      : []),
  ];

  // Role-tailored creation options
  const createOptions = React.useMemo(() => {
    const role = (user.role || "").toUpperCase();
    const list = [];

    // All roles can submit a PPC request
    list.push({
      label: "New PPC Request",
      desc: "Pengajuan kebutuhan fasilitas / project intake",
      href: "/ppc?action=new",
      icon: CircleDot,
      badge: "Intake",
    });

    if (role === "ADMIN" || role === "ENGINEERING") {
      list.push({
        label: "New Tender Document",
        desc: "Kajian teknis & pembuatan dokumen FEO",
        href: "/engineering?action=new",
        icon: PenTool,
        badge: "FEO",
      });
    }

    if (role === "ADMIN" || role === "PROCUREMENT") {
      list.push({
        label: "New Vendor Record",
        desc: "Pendaftaran rekanan kontraktor baru",
        href: "/vendors?action=new",
        icon: Star,
        badge: "Vendor",
      });
    }

    if (role === "ADMIN" || role === "PROJECT" || role === "ENGINEERING") {
      list.push({
        label: "Update Site Progress",
        desc: "Pembaruan progres fisik & Kurva-S proyek",
        href: "/tasks",
        icon: CheckSquare,
        badge: "BR-09",
      });
    }

    if (role === "ADMIN" || role === "OPERATIONS") {
      list.push({
        label: "New Handover BAST",
        desc: "Serah terima proyek & aktivasi garansi",
        href: "/operations",
        icon: Home,
        badge: "BAST",
      });
    }

    if (role === "ADMIN") {
      list.push({
        label: "New User Account",
        desc: "Pendaftaran akun & hak akses peran",
        href: "/admin/users?action=new",
        icon: Settings,
        badge: "Admin",
      });
    }

    return list;
  }, [user.role]);

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-[var(--bg-sidebar)] border-r border-[var(--border)] transition-all duration-200 select-none relative",
        collapsed ? "w-[68px]" : "w-[260px]"
      )}
    >
      {/* 1. Profile Block */}
      <div className="relative border-b border-[var(--border-soft)]">
        <div className="flex items-center justify-between p-3.5">
          <div
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="flex items-center gap-2.5 overflow-hidden cursor-pointer hover:opacity-85 transition-opacity"
            title="Account Menu"
          >
            <Avatar name={user.name} size="default" />
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-[var(--text)] truncate">
                  {user.name}
                </span>
                <span className="text-xs text-[var(--text-muted)] truncate">
                  {user.username} · {user.role}
                </span>
              </div>
            )}
          </div>
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="p-1 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-active)] rounded-[var(--r-sm)] transition-colors cursor-pointer"
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? (
                <PanelLeftOpen className="w-4 h-4" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>
          )}
        </div>

        {/* Profile Popover Menu */}
        {profileMenuOpen && (
          <div className="absolute left-3 top-14 z-50 w-52 bg-white rounded-[var(--r-md)] border border-[var(--border)] shadow-lg py-1.5 space-y-0.5">
            <div className="px-3 py-1.5 border-b border-[var(--border-soft)] mb-1">
              <p className="text-xs font-semibold text-[var(--text)] truncate">{user.name}</p>
              <p className="text-[11px] text-[var(--text-muted)] truncate">Role: {user.role}</p>
            </div>
            <Link
              href="/account"
              onClick={() => setProfileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-1.5 text-xs text-[var(--text)] hover:bg-[var(--bg-subtle)]"
            >
              <User className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <span>My Account</span>
            </Link>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-[var(--danger)] hover:bg-[var(--danger-bg)] text-left cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign out</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. Action Button: + Create New */}
      <div className="p-3 relative" ref={createMenuRef}>
        {collapsed ? (
          <Button
            variant="primary"
            size="icon"
            onClick={() => setCreateMenuOpen(!createMenuOpen)}
            className="w-full h-9 bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] rounded-[var(--r-md)] cursor-pointer"
            title="Create New (c)"
          >
            <Plus className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={() => setCreateMenuOpen(!createMenuOpen)}
            className="w-full h-9 justify-between bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] rounded-[var(--r-md)] font-medium text-xs tracking-wide px-3 cursor-pointer"
            title="Create New (Tekan 'c' untuk membuka)"
          >
            <div className="flex items-center gap-1.5">
              <Plus className="w-4 h-4" />
              <span>Create New</span>
            </div>
            <ChevronDown
              className={cn(
                "w-3.5 h-3.5 opacity-70 transition-transform duration-200",
                createMenuOpen && "rotate-180"
              )}
            />
          </Button>
        )}

        {/* Create New Popover Dropdown */}
        {createMenuOpen && (
          <div
            className={cn(
              "absolute z-50 bg-white rounded-xl border border-[var(--border)] shadow-xl py-2 animate-in fade-in zoom-in-95 duration-150",
              collapsed ? "left-[72px] top-2 w-72" : "left-3 right-3 top-[52px]"
            )}
          >
            <div className="px-3 py-1.5 border-b border-[var(--border-soft)] mb-1 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Create Quick Action
              </span>
              <span className="text-[10px] text-[var(--text-faint)] font-mono">
                {user.role}
              </span>
            </div>
            <div className="space-y-0.5 px-1 max-h-[360px] overflow-y-auto">
              {createOptions.map((opt) => {
                const Icon = opt.icon;
                return (
                  <Link
                    key={opt.label}
                    href={opt.href}
                    onClick={() => setCreateMenuOpen(false)}
                    className="flex items-start gap-2.5 px-2.5 py-2 rounded-lg hover:bg-[var(--bg-active)] text-left transition-colors group cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-md bg-[var(--bg-subtle)] group-hover:bg-[#111113] group-hover:text-white flex items-center justify-center shrink-0 text-[var(--text)] transition-colors mt-0.5">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs font-semibold text-[var(--text)] group-hover:text-[#111113] truncate">
                          {opt.label}
                        </p>
                        {opt.badge && (
                          <span className="text-[9px] font-mono font-medium px-1.5 py-0.2 rounded bg-[var(--bg-subtle)] text-[var(--text-muted)]">
                            {opt.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-[var(--text-muted)] leading-tight truncate">
                        {opt.desc}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 3. Main Navigation */}
      <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 h-[34px] px-2.5 rounded-[var(--r-md)] text-[13px] font-medium transition-colors",
                isActive
                  ? "bg-[var(--bg-active)] text-[var(--text)] font-semibold"
                  : "text-[#3F3F46] hover:bg-[#F0F0F2] hover:text-[var(--text)]",
                collapsed && "justify-center px-0"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon
                className={cn(
                  "w-4 h-4 shrink-0",
                  isActive ? "text-[var(--text)]" : "text-[var(--text-muted)]"
                )}
              />
              {!collapsed && (
                <>
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge && (
                    <span className="px-1.5 py-0.2 text-[11px] font-semibold bg-[#E4E4E7] text-[#111113] rounded-[var(--r-sm)]">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </Link>
          );
        })}

        {/* 4. Collapsible Pinned Projects */}
        {!collapsed && pinnedProjects.length > 0 && (
          <div className="pt-4 pb-2">
            <div className="flex items-center justify-between px-2.5 py-1 text-xs font-semibold text-[var(--text-muted)]">
              <button
                onClick={() => setPinnedOpen(!pinnedOpen)}
                className="flex items-center gap-1.5 hover:text-[var(--text)] cursor-pointer"
              >
                {pinnedOpen ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
                <span>Pinned Projects</span>
              </button>
              <button
                className="p-0.5 hover:bg-[var(--bg-active)] rounded text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer"
                title="Add to Pinned"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            {pinnedOpen && (
              <div className="mt-1 space-y-0.5">
                {pinnedProjects.map((p) => (
                  <Link
                    key={p.id}
                    href={`/projects/${p.id}`}
                    className="flex items-center gap-2 h-7 px-2.5 text-xs text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[#F0F0F2] rounded-[var(--r-md)] truncate"
                  >
                    <span className="text-[var(--text-faint)]">≡</span>
                    <span className="truncate">{p.name}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5. Bottom: Help Center */}
      <div className="p-3 border-t border-[var(--border-soft)]">
        <Link
          href="/help"
          className={cn(
            "flex items-center gap-2.5 h-[34px] px-2.5 text-[13px] rounded-[var(--r-md)] transition-colors",
            pathname === "/help"
              ? "bg-[var(--bg-active)] text-[var(--text)] font-semibold"
              : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-active)]",
            collapsed && "justify-center px-0"
          )}
          title="Help Center"
        >
          <HelpCircle
            className={cn(
              "w-4 h-4 shrink-0",
              pathname === "/help" ? "text-[var(--text)]" : "text-[var(--text-muted)]"
            )}
          />
          {!collapsed && <span>Help Center</span>}
        </Link>
      </div>
    </aside>
  );
}
