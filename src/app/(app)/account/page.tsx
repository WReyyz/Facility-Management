"use client";

import * as React from "react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CheckCircle2, AlertCircle, KeyRound, User as UserIcon } from "lucide-react";

export default function AccountPage() {
  const [user, setUser] = React.useState<{
    id: string;
    username: string;
    fullName: string;
    role: string;
  } | null>(null);

  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [statusMsg, setStatusMsg] = React.useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setUser(data.user);
      })
      .catch(console.error);
  }, []);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    if (newPassword.length < 8) {
      setStatusMsg({
        type: "error",
        text: "New password must be at least 8 characters.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatusMsg({
        type: "error",
        text: "New passwords do not match.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatusMsg({ type: "error", text: data.error || "Failed to update password." });
        setIsSubmitting(false);
        return;
      }

      setStatusMsg({ type: "success", text: "Password updated." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setStatusMsg({ type: "error", text: "An unexpected error occurred." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-[760px] mx-auto space-y-6">
      {/* Header */}
      <div className="pb-2 border-b border-[var(--border-soft)]">
        <h1 className="text-xl font-bold tracking-tight text-[var(--text)]">My Account</h1>
        <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">
          Manage your personal account profile and security credentials.
        </p>
      </div>

      {/* 1. Profile Information Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar name={user?.fullName || "User"} size="lg" />
              <div>
                <h2 className="text-base font-semibold text-[var(--text)]">
                  {user?.fullName || "Loading..."}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-[var(--text-muted)] font-mono">
                    @{user?.username || "..."}
                  </span>
                  <span className="text-xs text-[var(--text-faint)]">·</span>
                  <Badge variant="neutral" size="sm">
                    {user?.role || "ROLE"}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
              <UserIcon className="w-4 h-4" />
              <span>Created by Administrator</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Change Password Card */}
      <Card>
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center gap-2 border-b border-[var(--border-soft)] pb-3">
            <KeyRound className="w-4 h-4 text-[var(--text)]" />
            <h2 className="text-sm font-semibold text-[var(--text)]">Change Password</h2>
          </div>

          {statusMsg && (
            <div
              className={`p-3 rounded-[var(--r-md)] text-xs flex items-center gap-2 border ${
                statusMsg.type === "success"
                  ? "bg-[var(--success-bg)] text-[var(--success)] border-[#B7E4C7]"
                  : "bg-[var(--danger-bg)] text-[var(--danger)] border-[#F8B4B4]"
              }`}
            >
              {statusMsg.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{statusMsg.text}</span>
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4 max-w-[480px]">
            <div>
              <label
                htmlFor="currentPassword"
                className="block text-xs font-medium text-[var(--text)] mb-1.5"
              >
                Current Password
              </label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                required
              />
            </div>

            <div>
              <label
                htmlFor="newPassword"
                className="block text-xs font-medium text-[var(--text)] mb-1.5"
              >
                New Password
              </label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                required
              />
              <span className="text-[11px] text-[var(--text-muted)] mt-1 block">
                Must be at least 8 characters long.
              </span>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-xs font-medium text-[var(--text)] mb-1.5"
              >
                Confirm New Password
              </label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              className="mt-2 text-xs h-9 px-4 font-medium"
            >
              Change password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
