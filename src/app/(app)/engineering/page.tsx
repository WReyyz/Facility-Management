"use client";

import * as React from "react";
import {
  PenTool,
  Search,
  Plus,
  Calendar,
  AlertCircle,
  X,
  Sliders,
  CheckCircle2,
  Clock,
  User,
  Filter,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Avatar } from "@/components/ui/avatar";
import { formatDate } from "@/lib/utils";
import { previewWorkingDays } from "@/lib/working-days";

export default function EngineeringPage() {
  const [tenderDocs, setTenderDocs] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("ALL");
  const [mineOnly, setMineOnly] = React.useState(false);

  // Lookups data
  const [lookups, setLookups] = React.useState<{
    engineers: any[];
    projects: any[];
    holidays: string[];
  }>({ engineers: [], projects: [], holidays: [] });

  // Current session user
  const [currentUser, setCurrentUser] = React.useState<any | null>(null);

  // Modal 1: Create Tender Document
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [createForm, setCreateForm] = React.useState({
    projectId: "",
    newProjectName: "",
    department: "",
    engineerId: "",
    startDate: "",
    finishDate: "",
    notes: "",
  });
  const [isCreatingNewProj, setIsCreatingNewProj] = React.useState(false);
  const [createError, setCreateError] = React.useState<string | null>(null);
  const [isSubmittingCreate, setIsSubmittingCreate] = React.useState(false);

  // Modal 2: Update Progress
  const [isProgressOpen, setIsProgressOpen] = React.useState(false);
  const [selectedTender, setSelectedTender] = React.useState<any | null>(null);
  const [progressValue, setProgressValue] = React.useState(0);
  const [progressNote, setProgressNote] = React.useState("");
  const [progressError, setProgressError] = React.useState<string | null>(null);
  const [isSubmittingProgress, setIsSubmittingProgress] = React.useState(false);

  // Toast
  const [toastMsg, setToastMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) setCurrentUser(d.user);
      })
      .catch(console.error);

    fetchLookups();
  }, []);

  React.useEffect(() => {
    fetchTenderDocs();
  }, [searchQuery, statusFilter, mineOnly]);

  const fetchLookups = async () => {
    try {
      const res = await fetch("/api/engineering/lookups");
      const data = await res.json();
      setLookups(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTenderDocs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("q", searchQuery);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (mineOnly) params.set("mine", "1");

      const res = await fetch(`/api/engineering?${params.toString()}`);
      const data = await res.json();
      if (data.tenderDocs) setTenderDocs(data.tenderDocs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Live calculation of preview working days
  const previewedDays = React.useMemo(() => {
    if (!createForm.startDate || !createForm.finishDate) return null;
    return previewWorkingDays(
      createForm.startDate,
      createForm.finishDate,
      lookups.holidays
    );
  }, [createForm.startDate, createForm.finishDate, lookups.holidays]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setCreateForm({
      projectId: lookups.projects[0]?.id || "",
      newProjectName: "",
      department: "",
      engineerId: currentUser?.id || lookups.engineers[0]?.id || "",
      startDate: new Date().toISOString().split("T")[0],
      finishDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      notes: "",
    });
    setIsCreatingNewProj(lookups.projects.length === 0);
    setCreateError(null);
    setIsCreateOpen(true);
  };

  // Auto-open create modal if navigated from Create New action
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("action") === "new") {
        handleOpenCreate();
      }
    }
  }, []);

  // Submit Create Tender Document
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setIsSubmittingCreate(true);

    try {
      const payload: any = {
        engineerId: createForm.engineerId,
        startDate: createForm.startDate,
        finishDate: createForm.finishDate,
        notes: createForm.notes,
      };

      if (isCreatingNewProj) {
        payload.projectName = createForm.newProjectName;
        payload.department = createForm.department;
      } else {
        payload.projectId = createForm.projectId;
      }

      const res = await fetch("/api/engineering", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setCreateError(data.error || "Failed to create tender document.");
        setIsSubmittingCreate(false);
        return;
      }

      setIsCreateOpen(false);
      fetchTenderDocs();
      fetchLookups();
      showToast(`Created tender document ${data.tenderDoc.tenderNo}`);
    } catch {
      setCreateError("An unexpected network error occurred.");
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  // Open Update Progress Modal
  const handleOpenProgress = (td: any) => {
    setSelectedTender(td);
    setProgressValue(td.progressPct);
    setProgressNote("");
    setProgressError(null);
    setIsProgressOpen(true);
  };

  // Submit Update Progress
  const handleProgressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTender) return;

    setProgressError(null);
    setIsSubmittingProgress(true);

    try {
      const res = await fetch(
        `/api/engineering/${selectedTender.id}/progress`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            progressPct: Number(progressValue),
            note: progressNote,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setProgressError(data.error || "Failed to update progress.");
        setIsSubmittingProgress(false);
        return;
      }

      setIsProgressOpen(false);
      fetchTenderDocs();
      showToast(
        `Progress for ${selectedTender.tenderNo} updated to ${progressValue}%`
      );
    } catch {
      setProgressError("An unexpected network error occurred.");
    } finally {
      setIsSubmittingProgress(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const canCreate =
    currentUser?.role === "ENGINEERING" || currentUser?.role === "ADMIN";

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-50 p-3.5 rounded-[var(--r-md)] bg-white border border-[var(--border)] shadow-xl flex items-center gap-2.5 text-xs text-[var(--text)] animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-[var(--success)] shrink-0" />
          <span className="font-medium">{toastMsg}</span>
        </div>
      )}

      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[var(--border-soft)]">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--text)]">
            Engineering
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">
            Tender documents, design drawings, BoQ preparation, and working days tracking.
          </p>
        </div>

        {canCreate && (
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenCreate}
            className="text-xs h-8"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            New Tender Document
          </Button>
        )}
      </div>

      {/* 2. Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search tender no., project name, department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-3 text-xs rounded-[var(--r-md)] border border-[var(--border)] bg-white placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--text)] transition-colors"
          />
        </div>

        {/* Status Dropdown & Checkbox */}
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 text-xs rounded-[var(--r-md)] border border-[var(--border)] bg-white text-[var(--text)] focus:outline-none focus:border-[var(--text)]"
          >
            <option value="ALL">All statuses</option>
            <option value="NOT_STARTED">Not started</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="OVERDUE">Overdue</option>
          </select>

          <label className="flex items-center gap-2 text-xs font-medium text-[var(--text)] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={mineOnly}
              onChange={(e) => setMineOnly(e.target.checked)}
              className="rounded-[var(--r-sm)] border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)] w-3.5 h-3.5"
            />
            <span>Assigned to me</span>
          </label>
        </div>
      </div>

      {/* 3. Tender Documents Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--bg-sidebar)] border-b border-[var(--border)] text-[var(--text-muted)] font-medium">
              <tr>
                <th className="py-3 px-4">Tender No.</th>
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4">Engineer</th>
                <th className="py-3 px-4">Start</th>
                <th className="py-3 px-4">Finish</th>
                <th className="py-3 px-4 text-center">Working Days</th>
                <th className="py-3 px-4 w-44">Progress</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-soft)]">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-[var(--text-muted)]">
                    Loading tender documents...
                  </td>
                </tr>
              ) : tenderDocs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-[var(--text-muted)]">
                    No tender documents found. Click &quot;New Tender Document&quot; to create one.
                  </td>
                </tr>
              ) : (
                tenderDocs.map((td) => (
                  <tr key={td.id} className="hover:bg-[var(--hover)] transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[var(--text)]">
                      {td.tenderNo}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[var(--text)]">
                        {td.projectName}
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)]">
                        {td.department}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <Avatar name={td.engineerName} size="sm" />
                        <span className="font-medium text-[var(--text)] truncate max-w-[120px]">
                          {td.engineerName}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[var(--text-muted)]">
                      {formatDate(td.startDate)}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[var(--text-muted)]">
                      {formatDate(td.finishDate)}
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono font-medium text-[var(--text)]">
                      {td.workingDays !== null ? `${td.workingDays} days` : "—"}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-mono">
                          <span className="text-[var(--text-muted)]">Progress</span>
                          <span
                            className={
                              td.isOverdue ? "text-[var(--danger)] font-bold" : "text-[var(--text)] font-semibold"
                            }
                          >
                            {td.progressPct}%
                          </span>
                        </div>
                        <Progress value={td.progressPct} isOverdue={td.isOverdue} />
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {td.isOverdue ? (
                        <Badge variant="danger">Overdue</Badge>
                      ) : td.status === "COMPLETED" ? (
                        <Badge variant="success">Completed</Badge>
                      ) : td.status === "IN_PROGRESS" ? (
                        <Badge variant="info">In progress</Badge>
                      ) : (
                        <Badge variant="neutral">Not started</Badge>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {canCreate && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleOpenProgress(td)}
                          className="h-7 text-xs font-medium px-2.5"
                        >
                          Update progress
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* MODAL 1: NEW TENDER DOCUMENT */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-in fade-in">
          <div className="bg-white rounded-[var(--r-lg)] border border-[var(--border)] w-full max-w-lg shadow-2xl p-6 relative">
            <button
              onClick={() => setIsCreateOpen(false)}
              className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text)]"
            >
              <X className="w-4 h-4" />
            </button>

            <h2 className="text-base font-bold text-[var(--text)] mb-1">
              New Tender Document
            </h2>
            <p className="text-xs text-[var(--text-muted)] mb-4">
              Create a tender package. A sequential FEO number (e.g. 001/FEO/2026/R0) will be assigned.
            </p>

            {createError && (
              <div className="mb-4 p-2.5 rounded-[var(--r-md)] bg-[var(--danger-bg)] border border-[#F8B4B4] text-[var(--danger)] text-xs flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {/* Project Selection / Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-[var(--text)]">
                    Project *
                  </label>
                  {lookups.projects.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsCreatingNewProj(!isCreatingNewProj)}
                      className="text-xs text-[var(--link)] underline"
                    >
                      {isCreatingNewProj ? "Select existing project" : "+ Create new project"}
                    </button>
                  )}
                </div>

                {isCreatingNewProj || lookups.projects.length === 0 ? (
                  <div className="space-y-2">
                    <Input
                      type="text"
                      value={createForm.newProjectName}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, newProjectName: e.target.value })
                      }
                      placeholder="Project name (e.g. Perbaikan Hoist Crane Plating)"
                      required
                    />
                    <Input
                      type="text"
                      value={createForm.department}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, department: e.target.value })
                      }
                      placeholder="Department / Unit peminta (e.g. Fasilitas Produksi)"
                    />
                  </div>
                ) : (
                  <select
                    value={createForm.projectId}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, projectId: e.target.value })
                    }
                    className="w-full h-10 px-3 text-sm rounded-[var(--r-md)] border border-[var(--border)] bg-white text-[var(--text)] focus:outline-none focus:border-[var(--text)]"
                    required
                  >
                    {lookups.projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.department ? `(${p.department})` : ""}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Engineer Assignment */}
              <div>
                <label className="block text-xs font-medium text-[var(--text)] mb-1">
                  Assigned Engineer *
                </label>
                <select
                  value={createForm.engineerId}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, engineerId: e.target.value })
                  }
                  className="w-full h-10 px-3 text-sm rounded-[var(--r-md)] border border-[var(--border)] bg-white text-[var(--text)] focus:outline-none focus:border-[var(--text)]"
                  required
                >
                  {lookups.engineers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} ({u.username} · {u.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Start & Finish Dates with live Working Days preview */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--text)] mb-1">
                    Start Date *
                  </label>
                  <Input
                    type="date"
                    value={createForm.startDate}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, startDate: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text)] mb-1">
                    Finish Date *
                  </label>
                  <Input
                    type="date"
                    value={createForm.finishDate}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, finishDate: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              {/* Live working days preview badge */}
              {previewedDays !== null && (
                <div className="p-2.5 rounded-[var(--r-md)] bg-[var(--bg-subtle)] border border-[var(--border-soft)] text-xs flex items-center justify-between">
                  <span className="text-[var(--text-muted)]">Calculated Working Days:</span>
                  <span className="font-mono font-bold text-[var(--text)]">
                    {previewedDays} working day(s) (Mon–Fri, holidays excluded)
                  </span>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-[var(--text)] mb-1">
                  Notes / Scope Summary
                </label>
                <textarea
                  value={createForm.notes}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, notes: e.target.value })
                  }
                  rows={2}
                  placeholder="Design brief, BoQ scope, or engineering details..."
                  className="w-full p-2.5 text-xs rounded-[var(--r-md)] border border-[var(--border)] bg-white placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--text)]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-soft)]">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsCreateOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSubmittingCreate}
                >
                  Create Tender Document
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: UPDATE PROGRESS (design.md 5.9) */}
      {isProgressOpen && selectedTender && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-in fade-in">
          <div className="bg-white rounded-[var(--r-lg)] border border-[var(--border)] w-full max-w-[480px] shadow-2xl p-6 relative">
            <button
              onClick={() => setIsProgressOpen(false)}
              className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text)]"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <Sliders className="w-4 h-4 text-[var(--text)]" />
              <h2 className="text-base font-bold text-[var(--text)]">
                Update Progress
              </h2>
            </div>
            <p className="text-xs text-[var(--text-muted)] mb-4 font-mono">
              {selectedTender.tenderNo} · {selectedTender.projectName}
            </p>

            {progressError && (
              <div className="mb-4 p-2.5 rounded-[var(--r-md)] bg-[var(--danger-bg)] border border-[#F8B4B4] text-[var(--danger)] text-xs flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{progressError}</span>
              </div>
            )}

            <form onSubmit={handleProgressSubmit} className="space-y-4">
              {/* Slider + Number Input synced */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-medium text-[var(--text)]">
                    Progress Percentage (0–100%)
                  </label>
                  <div className="flex items-center gap-1 font-mono">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={progressValue}
                      onChange={(e) =>
                        setProgressValue(
                          Math.min(100, Math.max(0, Number(e.target.value)))
                        )
                      }
                      className="w-14 h-7 text-center font-bold text-xs rounded-[var(--r-sm)] border border-[var(--border)]"
                    />
                    <span>%</span>
                  </div>
                </div>

                <input
                  type="range"
                  min={0}
                  max={100}
                  value={progressValue}
                  onChange={(e) => setProgressValue(Number(e.target.value))}
                  className="w-full accent-[var(--primary)] cursor-pointer"
                />

                <div className="flex justify-between text-[10px] text-[var(--text-faint)] font-mono">
                  <span>0% (Not started)</span>
                  <span>50% (In progress)</span>
                  <span>100% (Completed)</span>
                </div>
              </div>

              {/* Progress Bar Preview */}
              <Progress value={progressValue} isOverdue={selectedTender.isOverdue} />

              {/* Note / History Textarea */}
              <div>
                <label className="block text-xs font-medium text-[var(--text)] mb-1">
                  Progress Note / Accomplishment
                </label>
                <textarea
                  value={progressNote}
                  onChange={(e) => setProgressNote(e.target.value)}
                  rows={3}
                  placeholder="Explain what was accomplished or revised in this milestone..."
                  className="w-full p-2.5 text-xs rounded-[var(--r-md)] border border-[var(--border)] bg-white placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--text)]"
                />
                <span className="text-[11px] text-[var(--text-muted)] block mt-0.5">
                  Every update is logged into the project audit history.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-soft)]">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsProgressOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSubmittingProgress}
                >
                  Save Progress
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
