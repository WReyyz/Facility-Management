"use client";

import * as React from "react";
import Link from "next/link";
import {
  CheckSquare,
  AlertTriangle,
  Clock,
  TrendingUp,
  Filter,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Layers,
  Calendar,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface TaskItem {
  id: string;
  docId: string;
  projectId: string;
  title: string;
  department: string;
  stage: string;
  status: "overdue" | "due-soon" | "in-progress";
  statusLabel: string;
  targetDate: string | null;
  daysRemaining: number | null;
  progressPct: number;
  type: "ENGINEERING" | "PROJECT" | "PPC";
}

interface TelemetryData {
  avgCompletion: number;
  attentionRequired: number;
  overdueCount: number;
  dueSoonCount: number;
  activeStageLoad: number;
}

export default function MyTasksPage() {
  const [tasks, setTasks] = React.useState<TaskItem[]>([]);
  const [counts, setCounts] = React.useState({ all: 0, overdue: 0, dueSoon: 0, inProgress: 0 });
  const [telemetry, setTelemetry] = React.useState<TelemetryData>({
    avgCompletion: 0,
    attentionRequired: 0,
    overdueCount: 0,
    dueSoonCount: 0,
    activeStageLoad: 0,
  });
  const [currentUser, setCurrentUser] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [stageFilter, setStageFilter] = React.useState("all");

  // Modal State
  const [selectedTask, setSelectedTask] = React.useState<TaskItem | null>(null);
  const [newProgress, setNewProgress] = React.useState<number>(0);
  const [updateNote, setUpdateNote] = React.useState("");
  const [modalSubmitting, setModalSubmitting] = React.useState(false);
  const [modalError, setModalError] = React.useState("");
  const [modalSuccess, setModalSuccess] = React.useState("");

  const fetchTasks = React.useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (stageFilter !== "all") params.set("stage", stageFilter);

      const res = await fetch(`/api/tasks?${params.toString()}`);
      const data = await res.json();
      if (data.tasks) {
        setTasks(data.tasks);
        setCounts(data.counts);
        setTelemetry(data.telemetry);
        setCurrentUser(data.user);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, stageFilter]);

  React.useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleOpenModal = (task: TaskItem) => {
    setSelectedTask(task);
    setNewProgress(task.progressPct);
    setUpdateNote("");
    setModalError("");
    setModalSuccess("");
  };

  const handleSaveProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;

    // BR-09 check: decreasing progress requires an explanation note
    if (newProgress < selectedTask.progressPct && !updateNote.trim()) {
      setModalError("BR-09: Decreasing progress requires an explanation note.");
      return;
    }

    setModalSubmitting(true);
    setModalError("");

    try {
      let res: Response;

      if (selectedTask.type === "ENGINEERING") {
        res = await fetch(`/api/engineering/${selectedTask.id}/progress`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            progressPct: newProgress,
            note: updateNote.trim() || undefined,
          }),
        });
      } else {
        res = await fetch("/api/project-execution", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "UPDATE_PROGRESS",
            projectId: selectedTask.projectId,
            progressPct: newProgress,
            note: updateNote.trim() || undefined,
          }),
        });
      }

      const d = await res.json();
      if (!res.ok) {
        setModalError(d.error || "Failed to update progress.");
        return;
      }

      setModalSuccess("Progress updated successfully.");
      setTimeout(() => {
        setSelectedTask(null);
        fetchTasks();
      }, 700);
    } catch (err) {
      console.error(err);
      setModalError("Network error. Please try again.");
    } finally {
      setModalSubmitting(false);
    }
  };

  const getStageBadgeVariant = (stage: string) => {
    switch (stage.toLowerCase()) {
      case "engineering":
        return "info";
      case "project":
        return "warning";
      case "ppc":
        return "neutral";
      case "procurement":
        return "warning";
      case "operations":
        return "success";
      default:
        return "neutral";
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumbs matching Stitch */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider mb-1">
            <span>Workspace</span>
            <span>/</span>
            <span>{currentUser?.fullName || "Staff"} · {currentUser?.role || "ENGINEERING"}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">
            My Tasks
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            All active items assigned to {currentUser?.fullName || "you"} across operational stages
          </p>
        </div>

        {/* Segmented Filter Tabs & Stage Dropdown */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center p-1 rounded-[var(--r-md)] bg-[var(--bg-subtle)] gap-1">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                statusFilter === "all"
                  ? "bg-[var(--bg)] text-[var(--text)] shadow-sm font-semibold"
                  : "text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              All ({counts.all})
            </button>
            <button
              onClick={() => setStatusFilter("overdue")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                statusFilter === "overdue"
                  ? "bg-[var(--bg)] text-[var(--text)] shadow-sm font-semibold"
                  : "text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              Overdue ({counts.overdue})
            </button>
            <button
              onClick={() => setStatusFilter("due-soon")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                statusFilter === "due-soon"
                  ? "bg-[var(--bg)] text-[var(--text)] shadow-sm font-semibold"
                  : "text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              Due Soon ({counts.dueSoon})
            </button>
            <button
              onClick={() => setStatusFilter("in-progress")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                statusFilter === "in-progress"
                  ? "bg-[var(--bg)] text-[var(--text)] shadow-sm font-semibold"
                  : "text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              In Progress ({counts.inProgress})
            </button>
          </div>

          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="h-9 px-3 bg-[var(--bg)] border border-[var(--border)] rounded-[var(--r-md)] text-xs text-[var(--text)]"
          >
            <option value="all">Filter by Stage: All</option>
            <option value="Engineering">Stage: Engineering</option>
            <option value="Project">Stage: Project</option>
            <option value="PPC">Stage: PPC</option>
            <option value="Procurement">Stage: Procurement</option>
            <option value="Operations">Stage: Operations</option>
          </select>

          <Button
            variant="secondary"
            size="sm"
            onClick={fetchTasks}
            className="h-9"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* 3 Telemetry Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Overall Completion */}
        <Card className="p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-medium">
              Overall Completion
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-[var(--text)]">
                {telemetry.avgCompletion}%
              </span>
              <span className="text-xs text-emerald-600 font-medium">
                across {counts.all} active items
              </span>
            </div>
          </div>
          <div className="w-12 h-12 relative flex items-center justify-center">
            <svg className="w-12 h-12 -rotate-90 text-emerald-600" viewBox="0 0 48 48">
              <circle cx="24" cy="24" fill="none" r="20" stroke="currentColor" strokeOpacity="0.15" strokeWidth="4" />
              <circle
                cx="24"
                cy="24"
                fill="none"
                r="20"
                stroke="currentColor"
                strokeDasharray="125.6"
                strokeDashoffset={125.6 - (125.6 * telemetry.avgCompletion) / 100}
                strokeLinecap="round"
                strokeWidth="4"
              />
            </svg>
            <TrendingUp className="w-4 h-4 text-emerald-600 absolute" />
          </div>
        </Card>

        {/* Card 2: Attention Required */}
        <Card className="p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-medium">
              Attention Required
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-red-600">
                {telemetry.attentionRequired}
              </span>
              <span className="text-xs text-[var(--text-muted)]">
                {telemetry.overdueCount} overdue · {telemetry.dueSoonCount} due within 7d
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </Card>

        {/* Card 3: Active Stage Load */}
        <Card className="p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-medium">
              Active Stage Load
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-[var(--text)]">
                {telemetry.activeStageLoad}
              </span>
              <span className="text-xs text-[var(--text-muted)]">
                Engineering & Project focus
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
        </Card>
      </div>

      {/* Main Tasks Table / List */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--bg-subtle)] text-[var(--text-muted)] font-medium text-xs">
                <th className="py-3 px-4">Project & Document No.</th>
                <th className="py-3 px-4">Stage</th>
                <th className="py-3 px-4">Target Date</th>
                <th className="py-3 px-4 w-44">Progress</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[var(--text-muted)]">
                    Loading your assigned tasks...
                  </td>
                </tr>
              ) : tasks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[var(--text-muted)]">
                    No tasks match the selected filters. You are up to date!
                  </td>
                </tr>
              ) : (
                tasks.map((task) => {
                  const isOverdue = task.status === "overdue";
                  const isDueSoon = task.status === "due-soon";

                  return (
                    <tr key={task.id} className="hover:bg-[var(--bg-subtle)] transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-start gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs text-[var(--text-muted)]">
                                {task.docId}
                              </span>
                              <Badge
                                variant={
                                  isOverdue
                                    ? "danger"
                                    : isDueSoon
                                    ? "warning"
                                    : "success"
                                }
                              >
                                {task.statusLabel}
                              </Badge>
                            </div>
                            <Link
                              href={`/projects/${task.projectId}`}
                              className="font-semibold text-sm text-[var(--text)] hover:underline block mt-0.5"
                            >
                              {task.title}
                            </Link>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <Badge variant={getStageBadgeVariant(task.stage) as any}>
                          {task.stage}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4 text-xs">
                        {task.targetDate ? (
                          <div>
                            <div className={isOverdue ? "text-red-600 font-semibold" : isDueSoon ? "text-amber-700 font-medium" : "text-[var(--text)]"}>
                              {new Date(task.targetDate).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </div>
                            <div className="text-[11px] text-[var(--text-muted)]">
                              {task.daysRemaining !== null
                                ? task.daysRemaining < 0
                                  ? `${Math.abs(task.daysRemaining)} days overdue`
                                  : task.daysRemaining === 0
                                  ? "Due today"
                                  : `In ${task.daysRemaining} days`
                                : "—"}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[var(--text-muted)]">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-[var(--text)]">{task.progressPct}%</span>
                          </div>
                          <Progress
                            value={task.progressPct}
                            color={isOverdue ? "danger" : undefined}
                            className="h-1.5"
                          />
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleOpenModal(task)}
                          className="h-8 text-xs font-medium"
                        >
                          Update Progress
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal: Update Progress */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-[var(--bg)] border border-[var(--border)] rounded-[var(--r-lg)] max-w-md w-full p-6 shadow-xl space-y-4">
            <div>
              <span className="font-mono text-xs text-[var(--text-muted)]">
                {selectedTask.docId}
              </span>
              <h3 className="text-lg font-bold text-[var(--text)] mt-0.5">
                Update Task Progress
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                {selectedTask.title} ({selectedTask.stage})
              </p>
            </div>

            {modalError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-[var(--r-md)] text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                <span>{modalError}</span>
              </div>
            )}
            {modalSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-[var(--r-md)] text-xs text-emerald-700">
                {modalSuccess}
              </div>
            )}

            <form onSubmit={handleSaveProgress} className="space-y-4">
              <div className="p-4 bg-[var(--bg-subtle)] border border-[var(--border)] rounded-[var(--r-md)] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[var(--text)]">
                    Completion Percentage
                  </label>
                  <span className="text-lg font-bold text-emerald-600">
                    {newProgress}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={newProgress}
                  onChange={(e) => setNewProgress(parseInt(e.target.value, 10))}
                  className="w-full accent-black cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text)] mb-1">
                  Progress Note {newProgress < selectedTask.progressPct && (
                    <span className="text-red-600 font-semibold">* (Required: BR-09)</span>
                  )}
                </label>
                <textarea
                  rows={3}
                  value={updateNote}
                  onChange={(e) => setUpdateNote(e.target.value)}
                  placeholder={
                    newProgress < selectedTask.progressPct
                      ? "Explain reason for progress decrease (required by BR-09)..."
                      : "Add milestone update or field observation note..."
                  }
                  className="w-full p-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-[var(--r-md)] text-xs text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedTask(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={modalSubmitting}
                >
                  {modalSubmitting ? "Saving..." : "Save Progress"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
