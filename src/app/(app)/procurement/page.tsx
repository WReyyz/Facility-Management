"use client";

import * as React from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  RefreshCw,
  Gavel,
  CheckCircle2,
  Receipt,
  Coins,
  ShieldCheck,
  Building2,
  ExternalLink,
  X,
  CreditCard,
  UserCheck,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface InvitedVendorItem {
  id: string;
  vendorId: string;
  vendorName: string;
  category: string;
  bidAmount: number | null;
  isWinner: boolean;
  score: number | null;
  isEligible: boolean;
}

interface ProcurementItem {
  id: string;
  projectName: string;
  department: string;
  tenderNo: string;
  tenderId: string | null;
  invitedCount: number;
  eligibleCount: number;
  invitedVendors: InvitedVendorItem[];
  winnerVendor: string | null;
  poNo: string | null;
  poAmount: number | null;
  paymentStagesCount: number;
  status: "Vendors Invited" | "Evaluation" | "Winner Selected" | "PO Issued";
}

interface VendorOption {
  id: string;
  name: string;
  category: string;
  ratingScore?: number;
  isEligible?: boolean;
}

export default function ProcurementPage() {
  const [items, setItems] = React.useState<ProcurementItem[]>([]);
  const [allVendors, setAllVendors] = React.useState<VendorOption[]>([]);
  const [stats, setStats] = React.useState({
    activeTenders: 0,
    inEvaluation: 0,
    poIssuedThisMonth: 0,
    totalPoValue: 0,
  });
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");

  // Modals state
  const [selectedProject, setSelectedProject] = React.useState<ProcurementItem | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = React.useState(false);
  const [isPoModalOpen, setIsPoModalOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [modalError, setModalError] = React.useState("");

  // Invite Vendor inputs
  const [inviteVendorId, setInviteVendorId] = React.useState("");
  const [inviteBidAmount, setInviteBidAmount] = React.useState("");

  // Issue PO inputs
  const [poVendorId, setPoVendorId] = React.useState("");
  const [poNo, setPoNo] = React.useState("");
  const [poAmount, setPoAmount] = React.useState("");
  const [paymentStages, setPaymentStages] = React.useState([
    { name: "DP (Uang Muka)", percentage: 20, dueDate: "" },
    { name: "Termin 1 (50% Progress)", percentage: 30, dueDate: "" },
    { name: "Termin 2 (80% Progress)", percentage: 30, dueDate: "" },
    { name: "Pelunasan (BAST)", percentage: 20, dueDate: "" },
  ]);

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm.trim()) params.set("q", searchTerm.trim());
      if (statusFilter !== "all") params.set("status", statusFilter);

      const [resProc, resVendors] = await Promise.all([
        fetch(`/api/procurement?${params.toString()}`),
        fetch("/api/vendors"),
      ]);

      if (resProc.ok) {
        const data = await resProc.json();
        setItems(data.items || []);
        if (data.stats) setStats(data.stats);
      }

      if (resVendors.ok) {
        const vData = await resVendors.json();
        setAllVendors(vData.vendors || []);
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

  const handleInviteVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !inviteVendorId) return;

    setIsSubmitting(true);
    setModalError("");
    try {
      const res = await fetch("/api/procurement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "INVITE_VENDOR",
          projectId: selectedProject.id,
          vendorId: inviteVendorId,
          bidAmount: inviteBidAmount ? parseInt(inviteBidAmount) : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to invite vendor");

      setInviteVendorId("");
      setInviteBidAmount("");
      setIsInviteModalOpen(false);
      fetchData();
    } catch (err: any) {
      setModalError(err.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleIssuePo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !poVendorId || !poNo.trim() || !poAmount) {
      setModalError("Please complete all required fields.");
      return;
    }

    const sumPct = paymentStages.reduce((sum, s) => sum + Number(s.percentage), 0);
    if (Math.round(sumPct) !== 100) {
      setModalError(`Payment stages percentage must sum to exactly 100% (currently ${sumPct}%).`);
      return;
    }

    setIsSubmitting(true);
    setModalError("");
    try {
      const res = await fetch("/api/procurement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ISSUE_PO",
          projectId: selectedProject.id,
          vendorId: poVendorId,
          poNo,
          amount: parseInt(poAmount),
          paymentStages,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to issue PO");

      setIsPoModalOpen(false);
      setPoNo("");
      setPoAmount("");
      fetchData();
    } catch (err: any) {
      setModalError(err.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PO Issued":
        return <Badge variant="success">PO Issued</Badge>;
      case "Winner Selected":
        return <Badge variant="info">Winner Selected</Badge>;
      case "Evaluation":
        return <Badge variant="warning">Evaluation</Badge>;
      default:
        return <Badge variant="neutral">Vendors Invited</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mb-1">
            <span>Facility Management</span>
            <span>/</span>
            <span className="text-[var(--text)] font-medium">Procurement</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[var(--text)]">
            Procurement
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Vendor invitations, bid evaluation, winner selection, and Purchase Order issuance.
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
                const target = items.find((i) => i.status !== "PO Issued") || items[0];
                setSelectedProject(target);
                setPoVendorId(target.invitedVendors[0]?.vendorId || "");
                setPoNo(`PO-2026-${Math.floor(100 + Math.random() * 900)}`);
                setPoAmount(target.invitedVendors[0]?.bidAmount?.toString() || "150000000");
                setModalError("");
                setIsPoModalOpen(true);
              } else {
                alert("No projects available for PO issuance.");
              }
            }}
          >
            <Plus className="w-4 h-4 mr-1" />
            Issue PO
          </Button>
        </div>
      </div>

      {/* 4 Summary Stat Cards matching Google Stitch */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <Card className="p-4 bg-[var(--bg)] border border-[var(--border)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span className="font-medium">Active Tenders</span>
            <div className="w-7 h-7 rounded-[var(--r-sm)] bg-[var(--info-bg)] flex items-center justify-center text-[var(--info)]">
              <Gavel className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-[var(--text)]">{stats.activeTenders}</span>
          </div>
          <p className="text-[11px] text-[var(--text-muted)] mt-2">Bidding & invitation stages</p>
        </Card>

        {/* Card 2 */}
        <Card className="p-4 bg-[var(--bg)] border border-[var(--border)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span className="font-medium">In Evaluation</span>
            <div className="w-7 h-7 rounded-[var(--r-sm)] bg-[var(--warning-bg)] flex items-center justify-center text-[var(--warning)]">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-[var(--text)]">{stats.inEvaluation}</span>
            <Badge variant="warning" size="sm">2 Due Soon</Badge>
          </div>
          <p className="text-[11px] text-[var(--text-muted)] mt-2">Comparing bid submissions</p>
        </Card>

        {/* Card 3 */}
        <Card className="p-4 bg-[var(--bg)] border border-[var(--border)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span className="font-medium">PO Issued</span>
            <div className="w-7 h-7 rounded-[var(--r-sm)] bg-[var(--success-bg)] flex items-center justify-center text-[var(--success)]">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-[var(--text)]">{stats.poIssuedThisMonth}</span>
            <Badge variant="success" size="sm">+1 vs Last Mo</Badge>
          </div>
          <p className="text-[11px] text-[var(--text-muted)] mt-2">Ready for execution & down payment</p>
        </Card>

        {/* Card 4 */}
        <Card className="p-4 bg-[var(--bg)] border border-[var(--border)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span className="font-medium">Total PO Value</span>
            <div className="w-7 h-7 rounded-[var(--r-sm)] bg-[var(--assignee-purple-bg)] flex items-center justify-center text-[var(--assignee-purple)]">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-bold text-[var(--text)]">
              {formatCurrency(stats.totalPoValue)}
            </span>
          </div>
          <p className="text-[11px] text-[var(--text-muted)] mt-2">Cumulative procurement commitments</p>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="p-5 bg-[var(--bg)] border border-[var(--border)] space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search project, tender no., PO, vendor..."
              className="pl-9 h-10 w-full"
            />
          </div>

          {/* Segmented Filter Buttons matching Google Stitch */}
          <div className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-[var(--bg-subtle)]">
            {["all", "Vendors Invited", "Evaluation", "Winner Selected", "PO Issued"].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 text-xs font-medium rounded-[var(--r-sm)] transition-all ${
                  statusFilter === st
                    ? "bg-[var(--bg)] text-[var(--text)] shadow-xs border border-[var(--border)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text)]"
                }`}
              >
                {st === "all" ? "All Statuses" : st}
              </button>
            ))}
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[950px] text-xs">
            <thead>
              <tr className="border-b border-[var(--border-soft)] text-[var(--text-muted)] font-medium">
                <th className="py-3 px-3">Project & Tender No.</th>
                <th className="py-3 px-3">Invited Vendors</th>
                <th className="py-3 px-3">Winner Vendor</th>
                <th className="py-3 px-3">PO No.</th>
                <th className="py-3 px-3 text-right">PO Amount</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-soft)]">
              {isLoading && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[var(--text-muted)]">
                    Loading procurement records...
                  </td>
                </tr>
              )}

              {!isLoading && items.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-[var(--text-muted)]">
                    No procurement records match your filter.
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
                        {item.tenderNo}
                      </p>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[var(--text)]">{item.invitedCount}</span>
                        {item.eligibleCount > 0 && (
                          <Badge variant="success" size="sm">
                            {item.eligibleCount} Eligible
                          </Badge>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedProject(item);
                            setInviteVendorId("");
                            setInviteBidAmount("");
                            setModalError("");
                            setIsInviteModalOpen(true);
                          }}
                          className="text-[11px] text-[var(--link)] hover:underline ml-1"
                        >
                          + Invite
                        </button>
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      {item.winnerVendor ? (
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-[var(--info-bg)] text-[var(--info)] text-[10px] font-bold flex items-center justify-center shrink-0">
                            {item.winnerVendor.slice(0, 2).toUpperCase()}
                          </span>
                          <span className="font-medium text-[var(--text)]">{item.winnerVendor}</span>
                        </div>
                      ) : (
                        <span className="text-[var(--text-muted)]">Pending selection</span>
                      )}
                    </td>

                    <td className="py-3.5 px-3 font-mono text-[var(--text-secondary)]">
                      {item.poNo || "—"}
                    </td>

                    <td className="py-3.5 px-3 text-right font-medium text-[var(--text)]">
                      {formatCurrency(item.poAmount)}
                    </td>

                    <td className="py-3.5 px-3">{getStatusBadge(item.status)}</td>

                    <td className="py-3.5 px-3 text-right">
                      {item.status === "PO Issued" ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-7 text-xs px-2.5"
                          onClick={() => {
                            setSelectedProject(item);
                            setPoVendorId(item.invitedVendors.find((i) => i.vendorName === item.winnerVendor)?.vendorId || "");
                            setPoNo(item.poNo || "");
                            setPoAmount(item.poAmount?.toString() || "");
                            setIsPoModalOpen(true);
                          }}
                        >
                          View PO
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          className="h-7 text-xs px-2.5"
                          onClick={() => {
                            setSelectedProject(item);
                            setPoVendorId(item.invitedVendors[0]?.vendorId || "");
                            setPoNo(`PO-2026-${Math.floor(100 + Math.random() * 900)}`);
                            setPoAmount(item.invitedVendors[0]?.bidAmount?.toString() || "150000000");
                            setModalError("");
                            setIsPoModalOpen(true);
                          }}
                        >
                          Manage
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal 1: Invite Vendors */}
      {isInviteModalOpen && selectedProject && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg bg-[var(--bg)] border border-[var(--border)] shadow-xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-[var(--border-soft)] pb-3">
              <div>
                <h3 className="text-base font-semibold text-[var(--text)]">Invite Vendor to Tender</h3>
                <p className="text-[11px] text-[var(--text-muted)] font-mono">{selectedProject.tenderNo} · {selectedProject.projectName}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsInviteModalOpen(false)}
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

            {/* Currently Invited Vendors List */}
            <div>
              <p className="font-semibold text-[var(--text)] mb-2">
                Invited Vendors ({selectedProject.invitedVendors.length})
              </p>
              {selectedProject.invitedVendors.length === 0 ? (
                <p className="text-[var(--text-muted)] italic">No vendors invited yet.</p>
              ) : (
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {selectedProject.invitedVendors.map((v) => (
                    <div
                      key={v.id}
                      className="p-2.5 rounded bg-[var(--bg-subtle)] border border-[var(--border-soft)] flex items-center justify-between"
                    >
                      <div>
                        <span className="font-medium text-[var(--text)]">{v.vendorName}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-[var(--text-muted)]">{v.category}</span>
                          {v.isEligible ? (
                            <Badge variant="success" size="sm">Score: {v.score}% · Eligible</Badge>
                          ) : (
                            <Badge variant="danger" size="sm">Score: {v.score ?? "Unrated"}% · Not Eligible</Badge>
                          )}
                        </div>
                      </div>
                      <span className="font-medium text-[var(--text)]">
                        {v.bidAmount ? formatCurrency(v.bidAmount) : "Awaiting bid"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <form onSubmit={handleInviteVendor} className="space-y-3 pt-3 border-t border-[var(--border-soft)]">
              <div>
                <label className="block font-medium text-[var(--text)] mb-1">
                  Select Vendor to Invite *
                </label>
                <select
                  required
                  value={inviteVendorId}
                  onChange={(e) => setInviteVendorId(e.target.value)}
                  className="w-full h-9 px-3 bg-[var(--bg)] border border-[var(--border)] rounded-[var(--r-md)] text-[var(--text)]"
                >
                  <option value="">Select a vendor...</option>
                  {allVendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-[var(--text)] mb-1">
                  Initial Bid Amount (IDR)
                </label>
                <Input
                  type="number"
                  value={inviteBidAmount}
                  onChange={(e) => setInviteBidAmount(e.target.value)}
                  placeholder="e.g. 150000000"
                  className="h-9 w-full"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsInviteModalOpen(false)}
                >
                  Close
                </Button>
                <Button type="submit" size="sm" isLoading={isSubmitting}>
                  Save Invitation
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Modal 2: Issue PO & Setup Staged Payments */}
      {isPoModalOpen && selectedProject && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <Card className="w-full max-w-xl bg-[var(--bg)] border border-[var(--border)] shadow-xl p-6 space-y-4 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--border-soft)] pb-3">
              <div>
                <h3 className="text-base font-semibold text-[var(--text)]">Issue Purchase Order (PO)</h3>
                <p className="text-[11px] text-[var(--text-muted)]">{selectedProject.projectName}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsPoModalOpen(false)}
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

            <form onSubmit={handleIssuePo} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[var(--text)] mb-1">
                    Winning Vendor *
                  </label>
                  <select
                    required
                    value={poVendorId}
                    onChange={(e) => setPoVendorId(e.target.value)}
                    className="w-full h-9 px-3 bg-[var(--bg)] border border-[var(--border)] rounded-[var(--r-md)] text-[var(--text)]"
                  >
                    <option value="">Select winner...</option>
                    {allVendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-[var(--text)] mb-1">
                    PO Number (Unique) *
                  </label>
                  <Input
                    required
                    value={poNo}
                    onChange={(e) => setPoNo(e.target.value)}
                    placeholder="e.g. PO-2026-081"
                    className="h-9 w-full font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-[var(--text)] mb-1">
                  Total PO Contract Value (IDR) *
                </label>
                <Input
                  type="number"
                  required
                  value={poAmount}
                  onChange={(e) => setPoAmount(e.target.value)}
                  placeholder="e.g. 165000000"
                  className="h-9 w-full"
                />
              </div>

              {/* Staged Payments Section */}
              <div className="space-y-2 pt-2 border-t border-[var(--border-soft)]">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[var(--text)]">
                    Payment Stages (Total: {paymentStages.reduce((s, p) => s + Number(p.percentage), 0)}%)
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setPaymentStages([
                        ...paymentStages,
                        { name: `Termin ${paymentStages.length + 1}`, percentage: 0, dueDate: "" },
                      ])
                    }
                    className="text-[11px] text-[var(--link)] hover:underline"
                  >
                    + Add Stage
                  </button>
                </div>

                <div className="space-y-2">
                  {paymentStages.map((stage, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded bg-[var(--bg-subtle)] border border-[var(--border-soft)] grid grid-cols-12 gap-2 items-center"
                    >
                      <div className="col-span-5">
                        <Input
                          value={stage.name}
                          onChange={(e) => {
                            const updated = [...paymentStages];
                            updated[idx].name = e.target.value;
                            setPaymentStages(updated);
                          }}
                          placeholder="Stage Name"
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="col-span-3">
                        <Input
                          type="number"
                          value={stage.percentage}
                          onChange={(e) => {
                            const updated = [...paymentStages];
                            updated[idx].percentage = parseFloat(e.target.value) || 0;
                            setPaymentStages(updated);
                          }}
                          placeholder="%"
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                      <div className="col-span-3">
                        <Input
                          type="date"
                          value={stage.dueDate}
                          onChange={(e) => {
                            const updated = [...paymentStages];
                            updated[idx].dueDate = e.target.value;
                            setPaymentStages(updated);
                          }}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="col-span-1 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            if (paymentStages.length > 1) {
                              setPaymentStages(paymentStages.filter((_, i) => i !== idx));
                            }
                          }}
                          className="text-[var(--text-muted)] hover:text-[var(--danger)]"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-soft)]">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsPoModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" isLoading={isSubmitting}>
                  Confirm & Issue PO
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
