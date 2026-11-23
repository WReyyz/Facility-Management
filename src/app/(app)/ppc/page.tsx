"use client";

import * as React from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  RefreshCw,
  Inbox,
  Hourglass,
  CheckCircle2,
  ShieldCheck,
  Building2,
  Calendar,
  User,
  ArrowRight,
  X,
  ExternalLink,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PpcRequestItem {
  id: string;
  projectId: string;
  requestNo: string;
  projectName: string;
  department: string;
  letterNo: string;
  letterDate: string | null;
  typeCode: string;
  targetDate: string;
  handoffTo: string;
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "COMPLETED";
  picName: string;
  picId: string | null;
}

interface UserLookup {
  id: string;
  fullName: string;
  username: string;
}

export default function PpcRequestsPage() {
  const [requests, setRequests] = React.useState<PpcRequestItem[]>([]);
  const [stats, setStats] = React.useState({
    total: 0,
    pendingApproval: 0,
    approved: 0,
    completed: 0,
  });
  const [users, setUsers] = React.useState<UserLookup[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("ALL");
  const [yearFilter, setYearFilter] = React.useState("2026");

  // Modal states
  const [isNewModalOpen, setIsNewModalOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [modalError, setModalError] = React.useState("");

  // Review modal state
  const [selectedReq, setSelectedReq] = React.useState<PpcRequestItem | null>(null);
  const [reviewStatus, setReviewStatus] = React.useState("");
  const [reviewNote, setReviewNote] = React.useState("");

  // Form inputs
  const [projectName, setProjectName] = React.useState("");
  const [department, setDepartment] = React.useState("");
  const [letterNo, setLetterNo] = React.useState("");
  const [letterDate, setLetterDate] = React.useState("");
  const [targetDate, setTargetDate] = React.useState("");
  const [typeCode, setTypeCode] = React.useState("TC");
  const [handoffTo, setHandoffTo] = React.useState("To Engineering");
  const [picId, setPicId] = React.useState("");

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm.trim()) params.set("q", searchTerm.trim());
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (yearFilter) params.set("year", yearFilter);

      const [resReq, resLookups] = await Promise.all([
        fetch(`/api/ppc?${params.toString()}`),
        fetch("/api/engineering/lookups"),
      ]);

      if (resReq.ok) {
        const data = await resReq.json();
        setRequests(data.requests || []);
        if (data.stats) setStats(data.stats);
      }

      if (resLookups.ok) {
        const lData = await resLookups.json();
        setUsers(lData.engineers || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, statusFilter, yearFilter]);

  React.useEffect(() => {
    const t = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(t);
  }, [fetchData]);

  // Auto-open modal if navigated from Create New action
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("action") === "new") {
        setModalError("");
        setIsNewModalOpen(true);
      }
    }
  }, []);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError("");

    if (!projectName.trim() || !targetDate) {
      setModalError("Please provide project name and target date.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/ppc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectName,
          department,
          letterNo,
          letterDate: letterDate || null,
          targetDate,
          typeCode,
          handoffTo,
          picId: picId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create PPC request");
      }

      // Reset form & close
      setProjectName("");
      setDepartment("");
      setLetterNo("");
      setLetterDate("");
      setTargetDate("");
      setIsNewModalOpen(false);
      fetchData();
    } catch (err: any) {
      setModalError(err.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedReq || !reviewStatus) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/ppc/${selectedReq.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: reviewStatus,
          note: reviewNote.trim() || undefined,
        }),
      });

      if (!res.ok) throw new Error("Failed to update status");

      setSelectedReq(null);
      setReviewStatus("");
      setReviewNote("");
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to update PPC request status.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <Badge variant="success">Completed</Badge>;
      case "APPROVED":
        return <Badge variant="info">Approved</Badge>;
      case "SUBMITTED":
      case "IN_REVIEW":
        return <Badge variant="warning">Submitted</Badge>;
      case "REJECTED":
        return <Badge variant="danger">Rejected</Badge>;
      default:
        return <Badge variant="neutral">Draft</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header matching Google Stitch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mb-1">
            <span className="bg-[var(--bg-subtle)] px-2 py-0.5 rounded font-medium">Intake Queue</span>
            <span>/</span>
            <span>FY {yearFilter}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[var(--text)]">
            PPC Requests
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Incoming facility work requests, letter numbers, and target handoffs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchData}
            isLoading={isLoading}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>

          <Button
            size="default"
            onClick={() => {
              setModalError("");
              setIsNewModalOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-1" />
            + New PPC Request
          </Button>
        </div>
      </div>

      {/* 4 Summary Stat Cards matching Google Stitch */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Requests */}
        <Card className="p-4 bg-[var(--bg)] border border-[var(--border)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span className="font-medium">Total Requests</span>
            <div className="w-7 h-7 rounded-[var(--r-sm)] bg-[var(--bg-subtle)] flex items-center justify-center text-[var(--text)]">
              <Inbox className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-[var(--text)]">{stats.total}</span>
            <span className="text-xs font-semibold text-[var(--success)]">+12% vs last Q</span>
          </div>
          <div className="w-full h-1.5 bg-[var(--track)] rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-[var(--text)] rounded-full" style={{ width: "100%" }} />
          </div>
        </Card>

        {/* 2. Pending Approval */}
        <Card className="p-4 bg-[var(--bg)] border border-[var(--border)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span className="font-medium">Pending Approval</span>
            <div className="w-7 h-7 rounded-[var(--r-sm)] bg-[var(--warning-bg)] flex items-center justify-center text-[var(--warning)]">
              <Hourglass className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-[var(--text)]">{stats.pendingApproval}</span>
            <Badge variant="warning" size="sm">Action Needed</Badge>
          </div>
          <div className="w-full h-1.5 bg-[var(--track)] rounded-full mt-3 overflow-hidden">
            <div
              className="h-full bg-[var(--warning)] rounded-full"
              style={{ width: `${stats.total > 0 ? (stats.pendingApproval / stats.total) * 100 : 0}%` }}
            />
          </div>
        </Card>

        {/* 3. Approved */}
        <Card className="p-4 bg-[var(--bg)] border border-[var(--border)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span className="font-medium">Approved</span>
            <div className="w-7 h-7 rounded-[var(--r-sm)] bg-[var(--info-bg)] flex items-center justify-center text-[var(--info)]">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-[var(--text)]">{stats.approved}</span>
            <Badge variant="info" size="sm">Ready Handoff</Badge>
          </div>
          <div className="w-full h-1.5 bg-[var(--track)] rounded-full mt-3 overflow-hidden">
            <div
              className="h-full bg-[var(--info)] rounded-full"
              style={{ width: `${stats.total > 0 ? (stats.approved / stats.total) * 100 : 0}%` }}
            />
          </div>
        </Card>

        {/* 4. Completed */}
        <Card className="p-4 bg-[var(--bg)] border border-[var(--border)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span className="font-medium">Completed</span>
            <div className="w-7 h-7 rounded-[var(--r-sm)] bg-[var(--success-bg)] flex items-center justify-center text-[var(--success)]">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-[var(--text)]">{stats.completed}</span>
            <span className="text-xs text-[var(--text-muted)]">
              {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}% Rate
            </span>
          </div>
          <div className="w-full h-1.5 bg-[var(--track)] rounded-full mt-3 overflow-hidden">
            <div
              className="h-full bg-[var(--success)] rounded-full"
              style={{ width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%` }}
            />
          </div>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="p-5 bg-[var(--bg)] border border-[var(--border)] space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search request no., project, department..."
              className="pl-9 h-10 w-full"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 px-3 text-xs bg-[var(--bg-subtle)] border border-[var(--border)] rounded-[var(--r-md)] text-[var(--text)]"
            >
              <option value="ALL">All Statuses</option>
              <option value="DRAFT">DRAFT</option>
              <option value="SUBMITTED">SUBMITTED</option>
              <option value="APPROVED">APPROVED</option>
              <option value="COMPLETED">COMPLETED</option>
            </select>

            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="h-10 px-3 text-xs bg-[var(--bg-subtle)] border border-[var(--border)] rounded-[var(--r-md)] text-[var(--text)]"
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px] text-xs">
            <thead>
              <tr className="border-b border-[var(--border-soft)] text-[var(--text-muted)] font-medium">
                <th className="py-3 px-3">Request No.</th>
                <th className="py-3 px-3">Project & Department</th>
                <th className="py-3 px-3">Letter No. & Date</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Target Date</th>
                <th className="py-3 px-3">Handoff To</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-soft)]">
              {isLoading && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[var(--text-muted)]">
                    Loading PPC requests...
                  </td>
                </tr>
              )}

              {!isLoading && requests.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-[var(--text-muted)]">
                    No matching PPC requests found.
                  </td>
                </tr>
              )}

              {!isLoading &&
                requests.map((req) => (
                  <tr key={req.id} className="hover:bg-[var(--hover)] transition-colors">
                    <td className="py-3.5 px-3 font-mono font-medium text-[var(--text)]">
                      {req.requestNo}
                    </td>
                    <td className="py-3.5 px-3">
                      <Link
                        href={`/projects/${req.projectId}`}
                        className="font-medium text-[var(--text)] hover:underline inline-flex items-center gap-1"
                      >
                        {req.projectName}
                        <ExternalLink className="w-3 h-3 text-[var(--text-muted)]" />
                      </Link>
                      <p className="text-[11px] text-[var(--text-muted)]">{req.department}</p>
                    </td>
                    <td className="py-3.5 px-3">
                      <p className="font-mono text-[var(--text)]">{req.letterNo}</p>
                      <p className="text-[11px] text-[var(--text-muted)]">{formatDate(req.letterDate)}</p>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="px-2 py-0.5 rounded bg-[var(--bg-subtle)] text-[var(--text-secondary)] font-medium">
                        {req.typeCode}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-[var(--text)] font-medium">
                      {formatDate(req.targetDate)}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="inline-flex items-center gap-1.5 text-[var(--text-secondary)]">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          req.handoffTo === "To Engineering" ? "bg-[var(--assignee-purple)]" : "bg-[var(--info)]"
                        }`} />
                        {req.handoffTo}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      {getStatusBadge(req.status)}
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-7 text-xs px-2.5"
                        onClick={() => {
                          setSelectedReq(req);
                          setReviewStatus(req.status);
                          setReviewNote("");
                        }}
                      >
                        Review
                      </Button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal: Create New PPC Request */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg bg-[var(--bg)] border border-[var(--border)] shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-soft)] pb-3">
              <div>
                <h3 className="text-base font-semibold text-[var(--text)]">New PPC Request</h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Creates project intake and auto-generates NNN/PPC/2026.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsNewModalOpen(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded bg-[var(--danger-bg)] text-[var(--danger)] text-xs">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateRequest} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-[var(--text)] mb-1">
                  Project Title *
                </label>
                <Input
                  required
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g. Overhaul Trafo 2500kVA Gardu Induk"
                  className="h-9 w-full"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[var(--text)] mb-1">
                    Department (Dinas Pengusul)
                  </label>
                  <Input
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Dinas Facility"
                    className="h-9 w-full"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[var(--text)] mb-1">
                    Target Completion Date *
                  </label>
                  <Input
                    type="date"
                    required
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="h-9 w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[var(--text)] mb-1">
                    Letter No. (Nomor Surat)
                  </label>
                  <Input
                    value={letterNo}
                    onChange={(e) => setLetterNo(e.target.value)}
                    placeholder="e.g. 022/FAC/I/2026"
                    className="h-9 w-full"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[var(--text)] mb-1">
                    Letter Date
                  </label>
                  <Input
                    type="date"
                    value={letterDate}
                    onChange={(e) => setLetterDate(e.target.value)}
                    className="h-9 w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[var(--text)] mb-1">
                    Type Code
                  </label>
                  <select
                    value={typeCode}
                    onChange={(e) => setTypeCode(e.target.value)}
                    className="w-full h-9 px-3 bg-[var(--bg)] border border-[var(--border)] rounded-[var(--r-md)] text-[var(--text)]"
                  >
                    <option value="TC">TC (Tender Cepat)</option>
                    <option value="TA">TA (Tender Terbuka)</option>
                    <option value="MEP">MEP</option>
                    <option value="Civil">Civil</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-[var(--text)] mb-1">
                    Handoff Destination
                  </label>
                  <select
                    value={handoffTo}
                    onChange={(e) => setHandoffTo(e.target.value)}
                    className="w-full h-9 px-3 bg-[var(--bg)] border border-[var(--border)] rounded-[var(--r-md)] text-[var(--text)]"
                  >
                    <option value="To Engineering">To Engineering</option>
                    <option value="To Project">To Project</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-[var(--text)] mb-1">
                  Assign PIC
                </label>
                <select
                  value={picId}
                  onChange={(e) => setPicId(e.target.value)}
                  className="w-full h-9 px-3 bg-[var(--bg)] border border-[var(--border)] rounded-[var(--r-md)] text-[var(--text)]"
                >
                  <option value="">Select PIC (optional)</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} ({u.username})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-soft)]">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsNewModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" isLoading={isSubmitting}>
                  Save & Register
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Modal: Review & Update PPC Status */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-[var(--bg)] border border-[var(--border)] shadow-xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-[var(--border-soft)] pb-3">
              <div>
                <h3 className="text-base font-semibold text-[var(--text)]">Review PPC Request</h3>
                <p className="text-[11px] font-mono text-[var(--text-muted)]">{selectedReq.requestNo}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReq(null)}
                className="text-[var(--text-muted)] hover:text-[var(--text)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded bg-[var(--bg-subtle)] space-y-1">
              <p className="font-semibold text-[var(--text)]">{selectedReq.projectName}</p>
              <p className="text-[var(--text-muted)]">Department: {selectedReq.department}</p>
              <p className="text-[var(--text-muted)]">Target: {formatDate(selectedReq.targetDate)}</p>
              <p className="text-[var(--text-muted)]">Handoff: {selectedReq.handoffTo}</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-medium text-[var(--text)] mb-1">
                  Change Status
                </label>
                <select
                  value={reviewStatus}
                  onChange={(e) => setReviewStatus(e.target.value)}
                  className="w-full h-9 px-3 bg-[var(--bg)] border border-[var(--border)] rounded-[var(--r-md)] text-[var(--text)]"
                >
                  <option value="DRAFT">DRAFT</option>
                  <option value="SUBMITTED">SUBMITTED</option>
                  <option value="APPROVED">APPROVED (Ready for Handoff)</option>
                  <option value="COMPLETED">COMPLETED</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-[var(--text)] mb-1">
                  Audit Note / Disposition Reason
                </label>
                <textarea
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder="e.g. Approved and dispatched to Engineering for BoQ calculation."
                  rows={3}
                  className="w-full p-2.5 rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--bg)] text-[var(--text)]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-soft)]">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setSelectedReq(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleUpdateStatus}
                isLoading={isSubmitting}
              >
                Update Status
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
