"use client";

import * as React from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  RefreshCw,
  ShieldCheck,
  Clock,
  Wallet,
  CheckCircle2,
  ExternalLink,
  X,
  Award,
  Download,
  AlertTriangle,
  Building2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface OperationItem {
  id: string;
  handoverId: string | null;
  projectName: string;
  department: string;
  vendorId: string | null;
  vendorName: string;
  poNo: string;
  poAmount: number;
  bastNo: string;
  handoverDate: string | null;
  warrantyMonths: number;
  warrantyEnd: string | null;
  daysRemaining: number | null;
  retentionPct: number;
  retentionAmount: number;
  retentionReleasedAt: string | null;
  status: "WARRANTY" | "HANDED_OVER" | "CLOSED";
  hasReview: boolean;
  reviewScores: { technical: number; nonTechnical: number } | null;
}

export default function OperationsPage() {
  const [items, setItems] = React.useState<OperationItem[]>([]);
  const [stats, setStats] = React.useState({
    inWarranty: 0,
    expiringSoon: 0,
    retentionHeld: 0,
    closed: 0,
  });
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("ALL");

  // Modals state
  const [selectedItem, setSelectedItem] = React.useState<OperationItem | null>(null);
  const [isRecordModalOpen, setIsRecordModalOpen] = React.useState(false);
  const [isBastModalOpen, setIsBastModalOpen] = React.useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [modalError, setModalError] = React.useState("");

  // Record Handover inputs
  const [handoverProjectId, setHandoverProjectId] = React.useState("");
  const [bastNoInput, setBastNoInput] = React.useState("");
  const [handoverDateInput, setHandoverDateInput] = React.useState(new Date().toISOString().split("T")[0]);
  const [warrantyMonthsInput, setWarrantyMonthsInput] = React.useState("12");
  const [retentionPctInput, setRetentionPctInput] = React.useState("5");

  // Vendor Review inputs
  const [techScore, setTechScore] = React.useState(85);
  const [nonTechScore, setNonTechScore] = React.useState(80);
  const [reviewNotes, setReviewNotes] = React.useState("");

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm.trim()) params.set("q", searchTerm.trim());
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const res = await fetch(`/api/operations?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, statusFilter]);

  React.useEffect(() => {
    const t = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(t);
  }, [fetchData]);

  const formatCurrency = (amount?: number | null) => {
    if (!amount) return "—";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleRecordHandover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handoverProjectId || !handoverDateInput) return;

    setModalError("");
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/operations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "RECORD_HANDOVER",
          projectId: handoverProjectId,
          bastNo: bastNoInput,
          handoverDate: handoverDateInput,
          warrantyMonths: parseInt(warrantyMonthsInput) || 12,
          retentionPct: parseFloat(retentionPctInput) || 5,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to record handover");

      setIsRecordModalOpen(false);
      fetchData();
    } catch (err: any) {
      setModalError(err.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReleaseRetention = async (projectId: string) => {
    if (!confirm("Release retention bond and officially mark project as CLOSED?")) return;

    try {
      const res = await fetch("/api/operations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "RELEASE_RETENTION",
          projectId,
        }),
      });

      if (!res.ok) throw new Error("Failed to release retention");
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to release retention.");
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !selectedItem.vendorId) return;

    setModalError("");
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/operations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "VENDOR_REVIEW",
          projectId: selectedItem.id,
          vendorId: selectedItem.vendorId,
          technicalScore: techScore,
          nonTechnicalScore: nonTechScore,
          notes: reviewNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit review");

      setIsReviewModalOpen(false);
      setReviewNotes("");
      fetchData();
    } catch (err: any) {
      setModalError(err.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculatedTotal = Math.round(techScore * 0.6 + nonTechScore * 0.4);

  return (
    <div className="space-y-6">
      {/* Header matching Google Stitch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mb-1">
            <span>Facility Management</span>
            <span>/</span>
            <span className="text-[var(--text)] font-medium">Operations</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[var(--text)]">
            Operations & Handover
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Project handover certificates, warranty periods, and retention bond release.
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
              if (items.length > 0) {
                const target = items[0];
                setHandoverProjectId(target.id);
                setBastNoInput(`BAST-${Math.floor(10 + Math.random() * 90)}/2026`);
                setHandoverDateInput(new Date().toISOString().split("T")[0]);
                setIsRecordModalOpen(true);
              }
            }}
          >
            <Plus className="w-4 h-4 mr-1" />
            Record Handover
          </Button>
        </div>
      </div>

      {/* 4 Summary Stat Cards matching Google Stitch */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: In Warranty */}
        <Card className="p-4 bg-[var(--bg)] border border-[var(--border)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span className="font-medium">In Warranty</span>
            <div className="w-7 h-7 rounded-[var(--r-sm)] bg-[var(--info-bg)] flex items-center justify-center text-[var(--info)]">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-[var(--text)]">{stats.inWarranty}</span>
            <Badge variant="info" size="sm">Active Assets</Badge>
          </div>
          <p className="text-[11px] text-[var(--text-muted)] mt-2">Under contractor warranty</p>
        </Card>

        {/* Card 2: Expiring <= 30d */}
        <Card className="p-4 bg-[var(--bg)] border border-[var(--border)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span className="font-medium">Expiring ≤ 30d</span>
            <div className="w-7 h-7 rounded-[var(--r-sm)] bg-[var(--warning-bg)] flex items-center justify-center text-[var(--warning)]">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-[var(--text)]">{stats.expiringSoon}</span>
            <Badge variant="warning" size="sm">Needs Inspection</Badge>
          </div>
          <p className="text-[11px] text-[var(--text-muted)] mt-2">Requires site defect verification</p>
        </Card>

        {/* Card 3: Retention Held */}
        <Card className="p-4 bg-[var(--bg)] border border-[var(--border)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span className="font-medium">Retention Held</span>
            <div className="w-7 h-7 rounded-[var(--r-sm)] bg-[var(--neutral-bg)] flex items-center justify-center text-[var(--neutral)]">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-bold text-[var(--text)]">
              {formatCurrency(stats.retentionHeld)}
            </span>
          </div>
          <p className="text-[11px] text-[var(--text-muted)] mt-2">5% security retention bonds</p>
        </Card>

        {/* Card 4: Closed Projects */}
        <Card className="p-4 bg-[var(--bg)] border border-[var(--border)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span className="font-medium">Closed Projects</span>
            <div className="w-7 h-7 rounded-[var(--r-sm)] bg-[var(--success-bg)] flex items-center justify-center text-[var(--success)]">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-[var(--text)]">{stats.closed}</span>
            <Badge variant="success" size="sm">Bond Released</Badge>
          </div>
          <p className="text-[11px] text-[var(--text-muted)] mt-2">Completed lifecycle archive</p>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="p-5 bg-[var(--bg)] border border-[var(--border)] space-y-4">
        {/* Toolbar with tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="inline-flex p-0.5 rounded-lg bg-[var(--bg-subtle)]">
            {[
              { id: "ALL", label: `All (${items.length})` },
              { id: "WARRANTY", label: "In Warranty" },
              { id: "HANDED_OVER", label: "Handed Over" },
              { id: "CLOSED", label: "Closed" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-[var(--r-sm)] transition-all ${
                  statusFilter === tab.id
                    ? "bg-[var(--bg)] text-[var(--text)] shadow-xs border border-[var(--border)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text)]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter project or vendor..."
              className="pl-9 h-9 text-xs w-full"
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[950px] text-xs">
            <thead>
              <tr className="border-b border-[var(--border-soft)] text-[var(--text-muted)] font-medium">
                <th className="py-3 px-3">Project & Vendor</th>
                <th className="py-3 px-3">Handover Date</th>
                <th className="py-3 px-3">Warranty & End Date</th>
                <th className="py-3 px-3">Retention</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-soft)]">
              {isLoading && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[var(--text-muted)]">
                    Loading handover records...
                  </td>
                </tr>
              )}

              {!isLoading && items.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-[var(--text-muted)]">
                    No handover records match your filter.
                  </td>
                </tr>
              )}

              {!isLoading &&
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-[var(--hover)] transition-colors">
                    <td className="py-3.5 px-3">
                      <Link
                        href={`/projects/${item.id}`}
                        className="font-medium text-[var(--text)] hover:underline inline-flex items-center gap-1"
                      >
                        {item.projectName}
                        <ExternalLink className="w-3 h-3 text-[var(--text-muted)]" />
                      </Link>
                      <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                        {item.vendorName} · <span className="font-mono">{item.bastNo}</span>
                      </p>
                    </td>

                    <td className="py-3.5 px-3 whitespace-nowrap text-[var(--text-secondary)]">
                      {formatDate(item.handoverDate)}
                    </td>

                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-[var(--text)]">
                          {item.warrantyMonths} Mo · {formatDate(item.warrantyEnd)}
                        </span>
                        {item.daysRemaining !== null && item.daysRemaining > 0 && item.daysRemaining <= 30 && (
                          <Badge variant="warning" size="sm">
                            Expiring in {item.daysRemaining}d
                          </Badge>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span className="font-medium text-[var(--text)]">
                        {item.retentionPct}% · {formatCurrency(item.retentionAmount)}
                      </span>
                    </td>

                    <td className="py-3.5 px-3">
                      {item.status === "CLOSED" ? (
                        <Badge variant="success">CLOSED</Badge>
                      ) : item.status === "WARRANTY" ? (
                        <Badge variant="info">WARRANTY</Badge>
                      ) : (
                        <Badge variant="warning">HANDED_OVER</Badge>
                      )}
                    </td>

                    <td className="py-3.5 px-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-7 text-xs px-2"
                          onClick={() => {
                            setSelectedItem(item);
                            setIsBastModalOpen(true);
                          }}
                        >
                          View BAST
                        </Button>

                        {item.status !== "CLOSED" && (
                          <Button
                            size="sm"
                            className="h-7 text-xs px-2"
                            onClick={() => handleReleaseRetention(item.id)}
                          >
                            Release
                          </Button>
                        )}

                        <Button
                          variant={item.hasReview ? "secondary" : "dashed"}
                          size="sm"
                          className="h-7 text-xs px-2"
                          onClick={() => {
                            setSelectedItem(item);
                            setTechScore(item.reviewScores?.technical || 85);
                            setNonTechScore(item.reviewScores?.nonTechnical || 80);
                            setReviewNotes("");
                            setIsReviewModalOpen(true);
                          }}
                        >
                          <Award className="w-3 h-3 mr-1" />
                          {item.hasReview ? "Review ✓" : "Rate Vendor"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal 1: Record Handover & BAST */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg bg-[var(--bg)] border border-[var(--border)] shadow-xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-[var(--border-soft)] pb-3">
              <div>
                <h3 className="text-base font-semibold text-[var(--text)]">Record Handover & Issue BAST</h3>
                <p className="text-[11px] text-[var(--text-muted)]">Official project completion and warranty activation.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsRecordModalOpen(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-2.5 rounded bg-[var(--danger-bg)] text-[var(--danger)]">
                {modalError}
              </div>
            )}

            <form onSubmit={handleRecordHandover} className="space-y-3.5">
              <div>
                <label className="block font-medium text-[var(--text)] mb-1">
                  Select Project *
                </label>
                <select
                  required
                  value={handoverProjectId}
                  onChange={(e) => setHandoverProjectId(e.target.value)}
                  className="w-full h-9 px-3 bg-[var(--bg)] border border-[var(--border)] rounded-[var(--r-md)] text-[var(--text)]"
                >
                  {items.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.projectName} ({p.vendorName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[var(--text)] mb-1">
                    BAST Number *
                  </label>
                  <Input
                    required
                    value={bastNoInput}
                    onChange={(e) => setBastNoInput(e.target.value)}
                    placeholder="e.g. BAST-014/2026"
                    className="h-9 w-full font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[var(--text)] mb-1">
                    Handover Date *
                  </label>
                  <Input
                    type="date"
                    required
                    value={handoverDateInput}
                    onChange={(e) => setHandoverDateInput(e.target.value)}
                    className="h-9 w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[var(--text)] mb-1">
                    Warranty Duration (Months)
                  </label>
                  <Input
                    type="number"
                    value={warrantyMonthsInput}
                    onChange={(e) => setWarrantyMonthsInput(e.target.value)}
                    placeholder="12"
                    className="h-9 w-full"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[var(--text)] mb-1">
                    Retention Security (%)
                  </label>
                  <Input
                    type="number"
                    value={retentionPctInput}
                    onChange={(e) => setRetentionPctInput(e.target.value)}
                    placeholder="5"
                    className="h-9 w-full"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-soft)]">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsRecordModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" isLoading={isSubmitting}>
                  Confirm Handover
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Modal 2: View BAST Certificate */}
      {isBastModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-[var(--bg)] border border-[var(--border)] shadow-xl p-6 space-y-4 text-xs">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-[11px] text-[var(--text-muted)] uppercase tracking-wider">
                  {selectedItem.bastNo}
                </span>
                <h3 className="text-base font-semibold text-[var(--text)] mt-0.5">
                  {selectedItem.projectName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBastModalOpen(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="divide-y divide-[var(--border-soft)] border-y border-[var(--border-soft)] py-1">
              <div className="h-9 flex items-center justify-between">
                <span className="text-[var(--text-muted)]">Vendor</span>
                <span className="font-semibold text-[var(--text)]">{selectedItem.vendorName}</span>
              </div>
              <div className="h-9 flex items-center justify-between">
                <span className="text-[var(--text-muted)]">PO Contract</span>
                <span className="font-mono text-[var(--text)]">{selectedItem.poNo}</span>
              </div>
              <div className="h-9 flex items-center justify-between">
                <span className="text-[var(--text-muted)]">Handover Date</span>
                <span className="text-[var(--text)]">{formatDate(selectedItem.handoverDate)}</span>
              </div>
              <div className="h-9 flex items-center justify-between">
                <span className="text-[var(--text-muted)]">Warranty Period</span>
                <span className="text-[var(--text)]">
                  {selectedItem.warrantyMonths} Months (until {formatDate(selectedItem.warrantyEnd)})
                </span>
              </div>
              <div className="h-9 flex items-center justify-between">
                <span className="text-[var(--text-muted)]">Retention Bond</span>
                <span className="font-semibold text-[var(--text)]">
                  {formatCurrency(selectedItem.retentionAmount)} ({selectedItem.retentionPct}%)
                </span>
              </div>
              <div className="h-9 flex items-center justify-between">
                <span className="text-[var(--text-muted)]">Status</span>
                <Badge variant="success" size="sm">Verified & Signed</Badge>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsBastModalOpen(false)}
              >
                Close
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  alert(`BAST certificate ${selectedItem.bastNo} generated.`);
                }}
              >
                <Download className="w-3.5 h-3.5 mr-1" />
                Download PDF
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Modal 3: Review Vendor KPI */}
      {isReviewModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-[var(--bg)] border border-[var(--border)] shadow-xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-[var(--border-soft)] pb-3">
              <div>
                <h3 className="text-base font-semibold text-[var(--text)]">Vendor Performance Review</h3>
                <p className="text-[11px] text-[var(--text-muted)]">{selectedItem.vendorName}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsReviewModalOpen(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-2.5 rounded bg-[var(--danger-bg)] text-[var(--danger)]">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSubmitReview} className="space-y-4">
              {/* Technical Score Slider (60% weight) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-[var(--text)]">Technical Score (60% Weight)</span>
                  <span className="font-bold text-sm text-[var(--text)]">{techScore}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={techScore}
                  onChange={(e) => setTechScore(parseInt(e.target.value))}
                  className="w-full accent-[var(--text)] cursor-pointer"
                />
              </div>

              {/* Non-Technical Score Slider (40% weight) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-[var(--text)]">Non-Technical Score (40% Weight)</span>
                  <span className="font-bold text-sm text-[var(--text)]">{nonTechScore}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={nonTechScore}
                  onChange={(e) => setNonTechScore(parseInt(e.target.value))}
                  className="w-full accent-[var(--text)] cursor-pointer"
                />
              </div>

              {/* Live Preview of Calculated KPI */}
              <div className="p-3 rounded-[var(--r-md)] bg-[var(--bg-subtle)] flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-[var(--text-muted)] block">Calculated Total Score</span>
                  <span className="text-xl font-bold text-[var(--text)]">{calculatedTotal}%</span>
                </div>
                <div>
                  {calculatedTotal >= 70 ? (
                    <Badge variant="success">Eligible (≥ 70%)</Badge>
                  ) : (
                    <Badge variant="danger">Not Eligible (&lt; 70%)</Badge>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-medium text-[var(--text)] mb-1">
                  Evaluation Notes & Feedback
                </label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="e.g. Work completed according to specifications with excellent response time."
                  rows={3}
                  className="w-full p-2.5 rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--bg)] text-[var(--text)]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-soft)]">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsReviewModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" isLoading={isSubmitting}>
                  Submit Review
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
