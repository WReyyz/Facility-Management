"use client";

import * as React from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  RefreshCw,
  Sliders,
  CheckCircle2,
  Receipt,
  Wallet,
  Clock,
  ExternalLink,
  X,
  CreditCard,
  Building2,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PaymentStageItem {
  id: string;
  name: string;
  percentage: number;
  amount: number;
  dueDate: string | null;
  paidAt: string | null;
  status: "PLANNED" | "DUE" | "PAID" | "CANCELLED";
}

interface ExecutionItem {
  id: string;
  executionId: string | null;
  projectName: string;
  department: string;
  poNo: string;
  poAmount: number;
  vendorName: string;
  picName: string;
  startDate: string | null;
  finishDate: string | null;
  progressPct: number;
  status: "NOT_STARTED" | "IN_PROGRESS" | "PENDING_REVIEW" | "COMPLETED" | "CANCELLED";
  paymentStages: PaymentStageItem[];
}

export default function ProjectExecutionPage() {
  const [items, setItems] = React.useState<ExecutionItem[]>([]);
  const [stats, setStats] = React.useState({
    activeExecutions: 0,
    avgProgress: 0,
    totalPoValue: 0,
    settledPayments: 0,
  });
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");

  // Modals state
  const [selectedItem, setSelectedItem] = React.useState<ExecutionItem | null>(null);
  const [isProgressModalOpen, setIsProgressModalOpen] = React.useState(false);
  const [isPaymentDrawerOpen, setIsPaymentDrawerOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [modalError, setModalError] = React.useState("");

  // Progress update form
  const [progressValue, setProgressValue] = React.useState(0);
  const [progressNote, setProgressNote] = React.useState("");

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm.trim()) params.set("q", searchTerm.trim());
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`/api/project-execution?${params.toString()}`);
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

  const handleUpdateProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    setModalError("");
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/project-execution", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_PROGRESS",
          projectId: selectedItem.id,
          progressPct: progressValue,
          note: progressNote,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update progress");

      setIsProgressModalOpen(false);
      setProgressNote("");
      fetchData();
    } catch (err: any) {
      setModalError(err.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePaymentStage = async (stageId: string, currentStatus: string) => {
    const newStatus = currentStatus === "PAID" ? "PLANNED" : "PAID";
    try {
      const res = await fetch("/api/project-execution", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_PAYMENT_STAGE",
          stageId,
          status: newStatus,
        }),
      });

      if (!res.ok) throw new Error("Failed to update payment status");

      // Update local state in drawer
      if (selectedItem) {
        const updatedStages = selectedItem.paymentStages.map((s) =>
          s.id === stageId
            ? { ...s, status: newStatus as any, paidAt: newStatus === "PAID" ? new Date().toISOString() : null }
            : s
        );
        setSelectedItem({ ...selectedItem, paymentStages: updatedStages });
      }

      fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to update payment stage.");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <Badge variant="success">Completed</Badge>;
      case "IN_PROGRESS":
        return <Badge variant="info">In Progress</Badge>;
      case "PENDING_REVIEW":
        return <Badge variant="warning">In Review</Badge>;
      case "CANCELLED":
        return <Badge variant="danger">Cancelled</Badge>;
      default:
        return <Badge variant="neutral">Not Started</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header matching Google Stitch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mb-1">
            <span className="uppercase tracking-wider font-medium">Execution & Staged Payments</span>
            <span>/</span>
            <span>FY 2026</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[var(--text)]">
            Project Execution
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Field work progress, milestones, and staged PO payments.
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
                const target = items.find((i) => i.status !== "COMPLETED") || items[0];
                setSelectedItem(target);
                setProgressValue(target.progressPct);
                setProgressNote("");
                setModalError("");
                setIsProgressModalOpen(true);
              }
            }}
          >
            <Sliders className="w-4 h-4 mr-1" />
            Update Execution
          </Button>
        </div>
      </div>

      {/* 4 Summary Stat Cards matching Google Stitch */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Executions */}
        <Card className="p-4 bg-[var(--bg)] border border-[var(--border)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span className="font-medium">Active Executions</span>
            <div className="w-7 h-7 rounded-[var(--r-sm)] bg-[var(--bg-subtle)] flex items-center justify-center text-[var(--text)]">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-[var(--text)]">{stats.activeExecutions}</span>
            <Badge variant="info" size="sm">+2 this mo</Badge>
          </div>
          <p className="text-[11px] text-[var(--text-muted)] mt-2">Projects in physical field work</p>
        </Card>

        {/* Card 2: Avg Progress */}
        <Card className="p-4 bg-[var(--bg)] border border-[var(--border)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span className="font-medium">Avg. Progress</span>
            <div className="w-7 h-7 rounded-[var(--r-sm)] bg-[var(--success-bg)] flex items-center justify-center text-[var(--success)]">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-[var(--text)]">{stats.avgProgress}%</span>
            <Badge variant="success" size="sm">On Track</Badge>
          </div>
          <div className="w-full h-1.5 bg-[var(--track)] rounded-full mt-3 overflow-hidden">
            <div
              className="h-full bg-[var(--progress)] rounded-full"
              style={{ width: `${stats.avgProgress}%` }}
            />
          </div>
        </Card>

        {/* Card 3: Total PO Value */}
        <Card className="p-4 bg-[var(--bg)] border border-[var(--border)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span className="font-medium">Total PO Value</span>
            <div className="w-7 h-7 rounded-[var(--r-sm)] bg-[var(--bg-subtle)] flex items-center justify-center text-[var(--text)]">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-bold text-[var(--text)]">
              {formatCurrency(stats.totalPoValue)}
            </span>
          </div>
          <p className="text-[11px] text-[var(--text-muted)] mt-2">Across all active contracts</p>
        </Card>

        {/* Card 4: Settled Payments */}
        <Card className="p-4 bg-[var(--bg)] border border-[var(--border)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span className="font-medium">Settled Payments</span>
            <div className="w-7 h-7 rounded-[var(--r-sm)] bg-[var(--success-bg)] flex items-center justify-center text-[var(--success)]">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-bold text-[var(--text)]">
              {formatCurrency(stats.settledPayments)}
            </span>
          </div>
          <p className="text-[11px] text-[var(--success)] mt-2 font-medium">
            {stats.totalPoValue > 0
              ? `${Math.round((stats.settledPayments / stats.totalPoValue) * 100)}% of total PO value`
              : "0% settled"}
          </p>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="p-5 bg-[var(--bg)] border border-[var(--border)] space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-[var(--text)]">
              Execution & Payment Ledger
            </h2>
            <Badge variant="neutral" size="sm">{items.length} Projects</Badge>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search project, PO, vendor..."
                className="pl-9 h-8 text-xs w-full"
              />
            </div>

            <div className="inline-flex p-0.5 rounded-lg bg-[var(--bg-subtle)]">
              {["all", "In Progress", "Completed"].map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setStatusFilter(f)}
                  className={`px-3 py-1 text-xs font-medium rounded-[var(--r-sm)] transition-all ${
                    statusFilter === f
                      ? "bg-[var(--bg)] text-[var(--text)] shadow-xs border border-[var(--border)]"
                      : "text-[var(--text-muted)] hover:text-[var(--text)]"
                  }`}
                >
                  {f === "all" ? "All" : f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[950px] text-xs">
            <thead>
              <tr className="border-b border-[var(--border-soft)] text-[var(--text-muted)] font-medium">
                <th className="py-3 px-3">Project & PO No.</th>
                <th className="py-3 px-3">Field PIC</th>
                <th className="py-3 px-3">Start → Finish Date</th>
                <th className="py-3 px-3 w-48">Progress</th>
                <th className="py-3 px-3">Staged Payments</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-soft)]">
              {isLoading && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[var(--text-muted)]">
                    Loading project executions...
                  </td>
                </tr>
              )}

              {!isLoading && items.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-[var(--text-muted)]">
                    No execution records match your filter.
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
                      <p className="font-mono text-[11px] text-[var(--text-muted)] mt-0.5">
                        {item.poNo} · {formatCurrency(item.poAmount)}
                      </p>
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--info-bg)] text-[var(--info)] text-xs font-medium">
                        {item.picName}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-[var(--text-secondary)] whitespace-nowrap">
                      {formatDate(item.startDate)} → {formatDate(item.finishDate)}
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-[var(--track)] overflow-hidden">
                          <div
                            className="h-full bg-[var(--progress)] rounded-full transition-all duration-500"
                            style={{ width: `${item.progressPct}%` }}
                          />
                        </div>
                        <span className="font-mono text-xs font-medium w-8 text-right">
                          {item.progressPct}%
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="flex flex-wrap items-center gap-1">
                        {item.paymentStages.length === 0 ? (
                          <span className="text-[var(--text-muted)] italic">No stages setup</span>
                        ) : (
                          item.paymentStages.map((st) => (
                            <span
                              key={st.id}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                st.status === "PAID"
                                  ? "bg-[var(--success-bg)] text-[var(--success)]"
                                  : "bg-[var(--neutral-bg)] text-[var(--neutral)]"
                              }`}
                            >
                              {st.name} {st.percentage}% {st.status === "PAID" ? "✓" : ""}
                            </span>
                          ))
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-3">{getStatusBadge(item.status)}</td>

                    <td className="py-3.5 px-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-7 text-xs px-2"
                          onClick={() => {
                            setSelectedItem(item);
                            setIsPaymentDrawerOpen(true);
                          }}
                        >
                          Payment Stages
                        </Button>

                        <Button
                          size="sm"
                          className="h-7 text-xs px-2"
                          onClick={() => {
                            setSelectedItem(item);
                            setProgressValue(item.progressPct);
                            setProgressNote("");
                            setModalError("");
                            setIsProgressModalOpen(true);
                          }}
                        >
                          Progress
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal: Update Execution Progress */}
      {isProgressModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-[var(--bg)] border border-[var(--border)] shadow-xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-[var(--border-soft)] pb-3">
              <div>
                <h3 className="text-base font-semibold text-[var(--text)]">Update Execution Progress</h3>
                <p className="text-[11px] text-[var(--text-muted)]">{selectedItem.projectName}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsProgressModalOpen(false)}
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

            <form onSubmit={handleUpdateProgress} className="space-y-4">
              {/* Slider + Number Input synced */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-medium text-[var(--text)]">Physical Progress (%)</label>
                  <span className="font-bold text-base text-[var(--progress)]">{progressValue}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progressValue}
                  onChange={(e) => setProgressValue(parseInt(e.target.value))}
                  className="w-full accent-[var(--progress)] cursor-pointer"
                />
              </div>

              <div>
                <label className="block font-medium text-[var(--text)] mb-1">
                  Progress Note & Site Explanation {progressValue < selectedItem.progressPct && (
                    <span className="text-[var(--danger)] font-bold">* Required for progress decrease</span>
                  )}
                </label>
                <textarea
                  value={progressNote}
                  onChange={(e) => setProgressNote(e.target.value)}
                  placeholder="e.g. Completed plumbing installation and pressure testing on floor 2."
                  rows={3}
                  className="w-full p-2.5 rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--bg)] text-[var(--text)]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-soft)]">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsProgressModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" isLoading={isSubmitting}>
                  Save Progress
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Slide-over Drawer / Modal: Payment Stages */}
      {isPaymentDrawerOpen && selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg bg-[var(--bg)] border border-[var(--border)] shadow-xl p-6 space-y-4 text-xs max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--border-soft)] pb-3">
              <div>
                <h3 className="text-base font-semibold text-[var(--text)]">Payment Milestones</h3>
                <p className="text-[11px] text-[var(--text-muted)] font-mono">{selectedItem.poNo} · {formatCurrency(selectedItem.poAmount)}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsPaymentDrawerOpen(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {selectedItem.paymentStages.length === 0 ? (
                <p className="text-[var(--text-muted)] italic text-center py-6">
                  No staged payments defined for this contract.
                </p>
              ) : (
                selectedItem.paymentStages.map((stage) => {
                  const isPaid = stage.status === "PAID";

                  return (
                    <div
                      key={stage.id}
                      className="p-3 rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--bg)] flex items-center justify-between gap-3"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[var(--text)]">{stage.name}</span>
                          <span className="font-mono text-[var(--text-muted)]">({stage.percentage}%)</span>
                          {isPaid ? (
                            <Badge variant="success" size="sm">PAID ✓</Badge>
                          ) : (
                            <Badge variant="neutral" size="sm">PLANNED</Badge>
                          )}
                        </div>
                        <p className="font-semibold text-xs text-[var(--text)]">
                          {formatCurrency(stage.amount)}
                        </p>
                        <p className="text-[10px] text-[var(--text-muted)]">
                          Due: {formatDate(stage.dueDate)} {isPaid && `· Settled: ${formatDate(stage.paidAt)}`}
                        </p>
                      </div>

                      <Button
                        variant={isPaid ? "secondary" : "primary"}
                        size="sm"
                        className="h-7 text-xs px-2.5"
                        onClick={() => handleTogglePaymentStage(stage.id, stage.status)}
                      >
                        {isPaid ? "Mark as Unpaid" : "Mark as Paid"}
                      </Button>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-[var(--border-soft)]">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsPaymentDrawerOpen(false)}
              >
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
