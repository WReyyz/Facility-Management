"use client";

import * as React from "react";
import {
  Users,
  UserCheck,
  UserX,
  ShieldAlert,
  Search,
  Plus,
  KeyRound,
  Shield,
  CheckCircle2,
  Lock,
  Unlock,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";

interface UserItem {
  id: string;
  username: string;
  fullName: string;
  role: "ADMIN" | "PPC" | "ENGINEERING" | "PROCUREMENT" | "PROJECT" | "OPERATIONS" | "VIEWER";
  isActive: boolean;
  mustChangePassword: boolean;
  failedAttempts: number;
  lockedUntil: string | null;
  createdAt: string;
}

interface UserStats {
  total: number;
  active: number;
  locked: number;
  inactive: number;
  roleCounts: Record<string, number>;
}

export default function AdminUsersPage() {
  const [users, setUsers] = React.useState<UserItem[]>([]);
  const [stats, setStats] = React.useState<UserStats>({
    total: 0,
    active: 0,
    locked: 0,
    inactive: 0,
    roleCounts: {},
  });
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");

  // Modals state
  const [createModalOpen, setCreateModalOpen] = React.useState(false);
  const [resetModalOpen, setResetModalOpen] = React.useState(false);
  const [roleModalOpen, setRoleModalOpen] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<UserItem | null>(null);

  // Form states
  const [newUsername, setNewUsername] = React.useState("");
  const [newFullName, setNewFullName] = React.useState("");
  const [newRole, setNewRole] = React.useState<string>("VIEWER");
  const [newPassword, setNewPassword] = React.useState("");
  const [newMustChange, setNewMustChange] = React.useState(true);

  const [resetPassword, setResetPassword] = React.useState("");
  const [resetMustChange, setResetMustChange] = React.useState(true);

  const [editRole, setEditRole] = React.useState<string>("VIEWER");

  const [formError, setFormError] = React.useState("");
  const [formSuccess, setFormSuccess] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const fetchUsers = React.useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.set("q", searchQuery);
      if (roleFilter) params.set("role", roleFilter);
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (res.status === 403) {
        setFormError("Forbidden: Only ADMIN users can access this page.");
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (data.users) {
        setUsers(data.users);
        setStats(data.stats);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, roleFilter, statusFilter]);

  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Auto-open create user modal if navigated from Create New action
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("action") === "new") {
        setFormError("");
        setFormSuccess("");
        setCreateModalOpen(true);
      }
    }
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: newUsername,
          fullName: newFullName,
          role: newRole,
          password: newPassword,
          mustChangePassword: newMustChange,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Failed to create user.");
        return;
      }

      setFormSuccess(`User ${data.user.username} successfully created.`);
      setCreateModalOpen(false);
      setNewUsername("");
      setNewFullName("");
      setNewPassword("");
      fetchUsers();
    } catch (err) {
      console.error(err);
      setFormError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (user: UserItem) => {
    setFormError("");
    setFormSuccess("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          action: "TOGGLE_ACTIVE",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Action failed.");
        return;
      }

      setFormSuccess(`User ${user.username} status updated.`);
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUnlockUser = async (user: UserItem) => {
    setFormError("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          action: "UNLOCK",
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        setFormError(d.error || "Unlock failed.");
        return;
      }

      setFormSuccess(`User ${user.username} unlocked successfully.`);
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setFormError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          action: "RESET_PASSWORD",
          newPassword: resetPassword,
          mustChangePassword: resetMustChange,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Reset failed.");
        return;
      }

      setFormSuccess(`Password for ${selectedUser.username} has been reset.`);
      setResetModalOpen(false);
      setResetPassword("");
      fetchUsers();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangeRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setFormError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          action: "CHANGE_ROLE",
          role: editRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Role change failed.");
        return;
      }

      setFormSuccess(`Role for ${selectedUser.username} changed to ${editRole}.`);
      setRoleModalOpen(false);
      fetchUsers();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "danger";
      case "PPC":
      case "ENGINEERING":
        return "info";
      case "PROCUREMENT":
      case "PROJECT":
        return "warning";
      case "OPERATIONS":
        return "success";
      default:
        return "neutral";
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">
            User Administration
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Manage system access, role permissions, and authentication security.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchUsers}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setFormError("");
              setCreateModalOpen(true);
            }}
            className="flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Add New User
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {formError && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-[var(--r-md)] text-sm text-red-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
            <span>{formError}</span>
          </div>
          <button
            onClick={() => setFormError("")}
            className="text-red-500 hover:text-red-700 font-bold ml-2"
          >
            ×
          </button>
        </div>
      )}
      {formSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-[var(--r-md)] text-sm text-emerald-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            <span>{formSuccess}</span>
          </div>
          <button
            onClick={() => setFormSuccess("")}
            className="text-emerald-500 hover:text-emerald-700 font-bold ml-2"
          >
            ×
          </button>
        </div>
      )}

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[var(--text-muted)]">
              Total Users
            </CardTitle>
            <Users className="h-4 w-4 text-[var(--text-muted)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[var(--text)]">{stats.total}</div>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Registered internal accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[var(--text-muted)]">
              Active Accounts
            </CardTitle>
            <UserCheck className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[var(--text)]">{stats.active}</div>
            <p className="text-xs text-emerald-600 mt-1">
              {stats.total > 0
                ? `${Math.round((stats.active / stats.total) * 100)}% active rate`
                : "No users"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[var(--text-muted)]">
              Locked / Inactive
            </CardTitle>
            <ShieldAlert className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[var(--text)]">
              {stats.locked + stats.inactive}
            </div>
            <p className="text-xs text-amber-600 mt-1">
              {stats.locked} locked by brute-force rule
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[var(--text-muted)]">
              Administrator Roles
            </CardTitle>
            <Shield className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[var(--text)]">
              {stats.roleCounts["ADMIN"] || 0}
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Full system privileges
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar / Filters */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
            <Input
              placeholder="Search by name or username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-9 px-3 bg-[var(--bg)] border border-[var(--border)] rounded-[var(--r-md)] text-xs text-[var(--text)]"
            >
              <option value="">All Roles</option>
              <option value="ADMIN">ADMIN</option>
              <option value="PPC">PPC</option>
              <option value="ENGINEERING">ENGINEERING</option>
              <option value="PROCUREMENT">PROCUREMENT</option>
              <option value="PROJECT">PROJECT</option>
              <option value="OPERATIONS">OPERATIONS</option>
              <option value="VIEWER">VIEWER</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-3 bg-[var(--bg)] border border-[var(--border)] rounded-[var(--r-md)] text-xs text-[var(--text)]"
            >
              <option value="">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
              <option value="locked">Locked Only</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Users Data Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--bg-subtle)] text-[var(--text-muted)] font-medium text-xs">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Security / Lockout</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[var(--text-muted)]">
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[var(--text-muted)]">
                    No users found matching current filters.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isLocked = Boolean(
                    u.lockedUntil && new Date(u.lockedUntil) > new Date()
                  );

                  return (
                    <tr key={u.id} className="hover:bg-[var(--bg-subtle)] transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={u.fullName} size="sm" />
                          <div>
                            <div className="font-semibold text-[var(--text)]">
                              {u.fullName}
                            </div>
                            <div className="text-xs font-mono text-[var(--text-muted)]">
                              @{u.username}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <Badge variant={getRoleBadgeVariant(u.role) as any}>
                          {u.role}
                        </Badge>
                      </td>

                      <td className="py-3 px-4">
                        {isLocked ? (
                          <Badge variant="danger" className="flex items-center gap-1 w-max">
                            <Lock className="h-3 w-3" /> Locked
                          </Badge>
                        ) : u.isActive ? (
                          <Badge variant="success">Active</Badge>
                        ) : (
                          <Badge variant="neutral">Inactive</Badge>
                        )}
                      </td>

                      <td className="py-3 px-4 text-xs text-[var(--text-muted)]">
                        {isLocked ? (
                          <span className="text-red-600 font-medium">
                            Locked until{" "}
                            {new Date(u.lockedUntil!).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        ) : u.failedAttempts > 0 ? (
                          <span className="text-amber-600">
                            {u.failedAttempts} failed attempt{u.failedAttempts > 1 ? "s" : ""}
                          </span>
                        ) : (
                          <span className="text-emerald-600">Healthy (0 failed)</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-xs text-[var(--text-muted)]">
                        {new Date(u.createdAt).toLocaleDateString("id-ID", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isLocked && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleUnlockUser(u)}
                              className="h-7 px-2 text-xs border-amber-300 text-amber-700 hover:bg-amber-50"
                              title="Unlock account"
                            >
                              <Unlock className="h-3.5 w-3.5 mr-1" /> Unlock
                            </Button>
                          )}

                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(u);
                              setResetPassword("");
                              setResetModalOpen(true);
                            }}
                            className="h-7 px-2 text-xs"
                            title="Reset Password"
                          >
                            <KeyRound className="h-3.5 w-3.5 mr-1" /> Reset
                          </Button>

                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(u);
                              setEditRole(u.role);
                              setRoleModalOpen(true);
                            }}
                            className="h-7 px-2 text-xs"
                            title="Change Role"
                          >
                            <Shield className="h-3.5 w-3.5 mr-1" /> Role
                          </Button>

                          <Button
                            variant={u.isActive ? "secondary" : "primary"}
                            size="sm"
                            onClick={() => handleToggleActive(u)}
                            className={`h-7 px-2 text-xs ${
                              u.isActive ? "text-red-600 hover:bg-red-50" : ""
                            }`}
                          >
                            {u.isActive ? "Deactivate" : "Activate"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal: Create User */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-[var(--bg)] border border-[var(--border)] rounded-[var(--r-lg)] max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-[var(--text)]">Create New User</h3>
            <p className="text-xs text-[var(--text-muted)]">
              Add a new staff member with specific stage authorization.
            </p>

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-[var(--text)] mb-1">
                  Username *
                </label>
                <Input
                  required
                  placeholder="e.g. bobby_procurement"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="h-9"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text)] mb-1">
                  Full Name *
                </label>
                <Input
                  required
                  placeholder="e.g. Bobby Pratama"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  className="h-9"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text)] mb-1">
                  Assigned Role *
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full h-9 px-3 bg-[var(--bg)] border border-[var(--border)] rounded-[var(--r-md)] text-sm text-[var(--text)]"
                >
                  <option value="ADMIN">ADMIN (Full Access)</option>
                  <option value="PPC">PPC (Intake & Disposition)</option>
                  <option value="ENGINEERING">ENGINEERING (Drawings & BOQ)</option>
                  <option value="PROCUREMENT">PROCUREMENT (Tenders & PO)</option>
                  <option value="PROJECT">PROJECT (Site Execution & Milestones)</option>
                  <option value="OPERATIONS">OPERATIONS (Handover & Warranty)</option>
                  <option value="VIEWER">VIEWER (Read-only)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text)] mb-1">
                  Initial Password (min 8 characters) *
                </label>
                <Input
                  type="password"
                  required
                  minLength={8}
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="h-9"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="mustChange"
                  checked={newMustChange}
                  onChange={(e) => setNewMustChange(e.target.checked)}
                  className="rounded border-[var(--border)] text-black focus:ring-black"
                />
                <label htmlFor="mustChange" className="text-xs text-[var(--text-muted)] cursor-pointer">
                  Require password change on first login (PRD rule)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setCreateModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={submitting}
                >
                  {submitting ? "Creating..." : "Save User"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reset Password */}
      {resetModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-[var(--bg)] border border-[var(--border)] rounded-[var(--r-lg)] max-w-sm w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-[var(--text)]">
              Reset Password
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Reset authentication password for user{" "}
              <strong className="text-[var(--text)]">@{selectedUser.username}</strong>.
            </p>

            <form onSubmit={handleResetPassword} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-[var(--text)] mb-1">
                  New Password (min 8 chars) *
                </label>
                <Input
                  type="password"
                  required
                  minLength={8}
                  placeholder="••••••••"
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  className="h-9"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="resetMustChange"
                  checked={resetMustChange}
                  onChange={(e) => setResetMustChange(e.target.checked)}
                  className="rounded border-[var(--border)]"
                />
                <label htmlFor="resetMustChange" className="text-xs text-[var(--text-muted)] cursor-pointer">
                  Require password change upon login
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setResetModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={submitting}
                >
                  {submitting ? "Resetting..." : "Confirm Reset"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Change Role */}
      {roleModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-[var(--bg)] border border-[var(--border)] rounded-[var(--r-lg)] max-w-sm w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-[var(--text)]">Change Role</h3>
            <p className="text-xs text-[var(--text-muted)]">
              Update stage permissions for{" "}
              <strong className="text-[var(--text)]">{selectedUser.fullName}</strong>.
            </p>

            <form onSubmit={handleChangeRole} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-[var(--text)] mb-1">
                  New Role *
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full h-9 px-3 bg-[var(--bg)] border border-[var(--border)] rounded-[var(--r-md)] text-sm text-[var(--text)]"
                >
                  <option value="ADMIN">ADMIN (Full Access)</option>
                  <option value="PPC">PPC (Intake & Disposition)</option>
                  <option value="ENGINEERING">ENGINEERING (Drawings & BOQ)</option>
                  <option value="PROCUREMENT">PROCUREMENT (Tenders & PO)</option>
                  <option value="PROJECT">PROJECT (Site Execution & Milestones)</option>
                  <option value="OPERATIONS">OPERATIONS (Handover & Warranty)</option>
                  <option value="VIEWER">VIEWER (Read-only)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setRoleModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={submitting}
                >
                  {submitting ? "Saving..." : "Update Role"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
