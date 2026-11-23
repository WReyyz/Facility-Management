"use client";

import * as React from "react";
import Link from "next/link";
import { Search, Filter, RefreshCw, FileText, ChevronDown, ChevronUp, Clock, CheckCircle2, AlertCircle, Building2, User, Calendar, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface UpdateHistoryItem {
  id: string;
  stage: string;
  oldValue: string | null;
  newValue: string;
  note: string | null;
  actorName: string;
  createdAt: string;
}

interface ProjectItem {
  id: string;
  name: string;
  department: string;
  currentStage: string;
  overallStatus: "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  createdAt: string;
  stageProgressPct: number;
  ppc: {
    requestNo: string;
    typeCode: string;
    picName: string;
    targetDate: string;
    handoffTo: string;
    status: string;
  } | null;
  engineering: {
    tenderNo: string;
    engineerName: string;
    startDate: string;
    finishDate: string;
    workingDays: number;
    progressPct: number;
    status: string;
  } | null;
  procurement: {
    poNo: string;
    vendorName: string;
    amount: number;
    issuedAt: string | null;
    status: string;
    vendorCount: number;
  } | null;
  project: {
    picName: string;
    startDate: string | null;
    finishDate: string | null;
    progressPct: number;
    status: string;
  } | null;
  handover: {
    handoverDate: string | null;
    warrantyEnd: string | null;
    status: string;
  } | null;
  recentUpdates: UpdateHistoryItem[];
  historyCount: number;
  attachmentsCount: number;
}

export default function ProjectsPage() {
  const [projects, setProjects] = React.useState<ProjectItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [stageFilter, setStageFilter] = React.useState<string>("ALL");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [expandedHistory, setExpandedHistory] = React.useState<Record<string, boolean>>({});

  const fetchProjects = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm.trim()) params.set("q", searchTerm.trim());
      if (stageFilter !== "ALL") params.set("stage", stageFilter);
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const res = await fetch(`/api/projects?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch projects");
      const data = await res.json();
      setProjects(data.projects || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, stageFilter, statusFilter]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      fetchProjects();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchProjects]);

  const toggleHistory = (id: string) => {
    setExpandedHistory((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const getStatusBadge = (status: string, stageProgress: number) => {
    if (status === "COMPLETED" || stageProgress === 100) {
      return <Badge variant="success">Completed</Badge>;
    }
    if (status === "CANCELLED") {
      return <Badge variant="danger">Cancelled</Badge>;
    }
    return <Badge variant="info">In progress</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[var(--text)]">
            Project Search & Tracking
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            End-to-end tracking across PPC, Engineering, Procurement, Project Execution, and Handover.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchProjects}
            isLoading={isLoading}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Toolbar / Filters */}
      <Card className="p-3 sm:p-4 bg-[var(--bg)] border border-[var(--border)]">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by project name, PPC no, PO no, vendor, or department..."
              className="pl-9 h-10 w-full"
            />
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-2">
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="h-10 px-3 py-2 text-sm bg-[var(--bg-subtle)] border border-[var(--border)] rounded-[var(--r-md)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)]"
            >
              <option value="ALL">All Stages</option>
              <option value="PPC">PPC Request</option>
              <option value="ENGINEERING">Engineering</option>
              <option value="PROCUREMENT">Procurement</option>
              <option value="PROJECT">Project Execution</option>
              <option value="OPERATIONS">Operations & Warranty</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 px-3 py-2 text-sm bg-[var(--bg-subtle)] border border-[var(--border)] rounded-[var(--r-md)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)]"
            >
              <option value="ALL">All Statuses</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <Card key={n} className="p-5 animate-pulse bg-[var(--bg)]">
              <div className="h-4 bg-[var(--border-soft)] rounded w-1/3 mb-3"></div>
              <div className="h-3 bg-[var(--border-soft)] rounded w-1/4 mb-6"></div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="h-20 bg-[var(--border-soft)] rounded"></div>
                <div className="h-20 bg-[var(--border-soft)] rounded"></div>
                <div className="h-20 bg-[var(--border-soft)] rounded"></div>
                <div className="h-20 bg-[var(--border-soft)] rounded"></div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && projects.length === 0 && (
        <Card className="p-12 text-center bg-[var(--bg)] border border-[var(--border)]">
          <Building2 className="w-10 h-10 mx-auto text-[var(--text-faint)] mb-3" />
          <h3 className="text-base font-medium text-[var(--text)]">No projects found</h3>
          <p className="text-sm text-[var(--text-muted)] max-w-sm mx-auto mt-1">
            Try adjusting your search keywords or filter criteria to find the project you are looking for.
          </p>
          {(searchTerm || stageFilter !== "ALL" || statusFilter !== "ALL") && (
            <Button
              variant="secondary"
              size="sm"
              className="mt-4"
              onClick={() => {
                setSearchTerm("");
                setStageFilter("ALL");
                setStatusFilter("ALL");
              }}
            >
              Clear filters
            </Button>
          )}
        </Card>
      )}

      {/* Project Cards List */}
      {!isLoading && projects.length > 0 && (
        <div className="space-y-5">
          {projects.map((project) => {
            const isHistoryOpen = !!expandedHistory[project.id];

            return (
              <Card
                key={project.id}
                className="overflow-hidden border border-[var(--border)] hover:border-[#CFCFD4] transition-colors bg-[var(--bg)]"
              >
                {/* Thin progress bar on top */}
                <div className="w-full h-1.5 bg-[var(--track)]">
                  <div
                    className="h-full bg-[var(--progress)] transition-all duration-500"
                    style={{ width: `${project.stageProgressPct}%` }}
                  />
                </div>

                <div className="p-5 sm:p-6 space-y-5">
                  {/* Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div>
                      <Link
                        href={`/projects/${project.id}`}
                        className="text-base sm:text-lg font-semibold text-[var(--text)] hover:underline inline-flex items-center gap-1.5"
                      >
                        {project.name}
                        <ExternalLink className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                      </Link>
                      <div className="text-xs text-[var(--text-muted)] mt-1 flex flex-wrap items-center gap-2">
                        <span className="font-medium text-[var(--text)]">
                          {project.ppc?.requestNo || "—"}
                        </span>
                        <span>·</span>
                        <span>{project.ppc?.typeCode || "TC"}</span>
                        <span>·</span>
                        <span>PIC: {project.ppc?.picName || project.engineering?.engineerName || "Unassigned"}</span>
                        <span>·</span>
                        <span className="bg-[var(--bg-subtle)] px-2 py-0.5 rounded text-[var(--text-secondary)]">
                          {project.department}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start">
                      {getStatusBadge(project.overallStatus, project.stageProgressPct)}
                      <Link href={`/projects/${project.id}#report`}>
                        <Button variant="secondary" size="sm" className="h-7 text-xs px-2.5">
                          <FileText className="w-3 h-3 mr-1" />
                          Report
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* 4-Stage Stepper Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-[var(--border-soft)]">
                    {/* Stage 1: PPC */}
                    <div className="p-3 rounded-[var(--r-md)] bg-[var(--bg-subtle)] border border-[var(--border-soft)] space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[var(--text)]">1. PPC Request</span>
                        {project.ppc?.status === "COMPLETED" ? (
                          <Badge variant="success" size="sm">Completed</Badge>
                        ) : (
                          <Badge variant="info" size="sm">Active</Badge>
                        )}
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)] space-y-0.5">
                        <p>No: <span className="font-mono text-[var(--text)]">{project.ppc?.requestNo || "—"}</span></p>
                        <p>Target: {formatDate(project.ppc?.targetDate)}</p>
                        <p>Handoff: {project.ppc?.handoffTo || "To Project"}</p>
                      </div>
                    </div>

                    {/* Stage 2: Engineering */}
                    <div className="p-3 rounded-[var(--r-md)] bg-[var(--bg-subtle)] border border-[var(--border-soft)] space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[var(--text)]">2. Engineering</span>
                        {project.engineering ? (
                          project.engineering.progressPct === 100 ? (
                            <Badge variant="success" size="sm">100%</Badge>
                          ) : (
                            <Badge variant="info" size="sm">{project.engineering.progressPct}%</Badge>
                          )
                        ) : (
                          <Badge variant="neutral" size="sm">Pending</Badge>
                        )}
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)] space-y-0.5">
                        <p>Tender: <span className="font-mono text-[var(--text)]">{project.engineering?.tenderNo || "—"}</span></p>
                        <p>Engineer: {project.engineering?.engineerName || "—"}</p>
                        <p>Work Days: {project.engineering?.workingDays ? `${project.engineering.workingDays} days` : "—"}</p>
                      </div>
                    </div>

                    {/* Stage 3: Procurement */}
                    <div className="p-3 rounded-[var(--r-md)] bg-[var(--bg-subtle)] border border-[var(--border-soft)] space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[var(--text)]">3. Procurement</span>
                        {project.procurement?.status === "PO_ISSUED" ? (
                          <Badge variant="success" size="sm">PO Issued</Badge>
                        ) : project.procurement ? (
                          <Badge variant="warning" size="sm">Evaluation</Badge>
                        ) : (
                          <Badge variant="neutral" size="sm">Pending</Badge>
                        )}
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)] space-y-0.5">
                        <p>PO: <span className="font-mono text-[var(--text)]">{project.procurement?.poNo || "—"}</span></p>
                        <p className="truncate">Vendor: <span className="font-medium text-[var(--text)]">{project.procurement?.vendorName || "—"}</span></p>
                        <p>Amount: {project.procurement?.amount ? formatCurrency(project.procurement.amount) : "—"}</p>
                      </div>
                    </div>

                    {/* Stage 4: Project Execution */}
                    <div className="p-3 rounded-[var(--r-md)] bg-[var(--bg-subtle)] border border-[var(--border-soft)] space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[var(--text)]">4. Project</span>
                        {project.project ? (
                          project.project.progressPct === 100 ? (
                            <Badge variant="success" size="sm">Done</Badge>
                          ) : (
                            <Badge variant="info" size="sm">{project.project.progressPct}%</Badge>
                          )
                        ) : (
                          <Badge variant="neutral" size="sm">Pending</Badge>
                        )}
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)] space-y-0.5">
                        <p>PIC: {project.project?.picName || "—"}</p>
                        <p>Target: {formatDate(project.project?.finishDate)}</p>
                        <div className="flex items-center gap-1.5 pt-0.5">
                          <div className="flex-1 h-1.5 bg-[var(--track)] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[var(--progress)]"
                              style={{ width: `${project.project?.progressPct || 0}%` }}
                            />
                          </div>
                          <span className="font-mono text-[10px]">{project.project?.progressPct || 0}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom: Toggle Update History */}
                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => toggleHistory(project.id)}
                      className="text-xs text-[var(--text-muted)] hover:text-[var(--text)] font-medium inline-flex items-center gap-1 py-1 px-2 rounded hover:bg-[var(--bg-subtle)] transition-colors"
                    >
                      {isHistoryOpen ? (
                        <>
                          <ChevronUp className="w-3.5 h-3.5" />
                          Hide update history
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3.5 h-3.5" />
                          Show update history ({project.historyCount})
                        </>
                      )}
                    </button>

                    <Link
                      href={`/projects/${project.id}`}
                      className="text-xs text-[var(--link)] hover:underline font-medium inline-flex items-center gap-1"
                    >
                      View Details →
                    </Link>
                  </div>

                  {/* Collapsible History Drawer */}
                  {isHistoryOpen && (
                    <div className="pt-3 border-t border-[var(--border-soft)] space-y-2">
                      <p className="text-xs font-medium text-[var(--text)]">Recent Activity</p>
                      {project.recentUpdates.length === 0 ? (
                        <p className="text-xs text-[var(--text-muted)]">No updates recorded yet.</p>
                      ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {project.recentUpdates.map((update) => (
                            <div
                              key={update.id}
                              className="text-xs p-2.5 rounded bg-[var(--bg-subtle)] border border-[var(--border-soft)] flex items-start justify-between gap-3"
                            >
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-medium text-[var(--text)]">{update.actorName}</span>
                                  <span className="text-[var(--text-muted)]">·</span>
                                  <Badge variant="neutral" size="sm">{update.stage}</Badge>
                                  {update.oldValue && (
                                    <span className="text-[var(--text-muted)]">
                                      {update.oldValue}% → {update.newValue}%
                                    </span>
                                  )}
                                </div>
                                {update.note && (
                                  <p className="text-[var(--text-muted)] italic">"{update.note}"</p>
                                )}
                              </div>
                              <span className="text-[10px] text-[var(--text-faint)] whitespace-nowrap">
                                {new Date(update.createdAt).toLocaleDateString("en-GB", {
                                  day: "2-digit",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
