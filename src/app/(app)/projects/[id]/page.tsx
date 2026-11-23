"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  MessageSquare,
  Paperclip,
  Share2,
  Tag,
  User,
  AlertCircle,
  Plus,
  Send,
  MoreVertical,
  ChevronRight,
  ShieldCheck,
  FileSpreadsheet,
  FileCode,
  Printer,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";

interface ProjectDetail {
  id: string;
  name: string;
  department: string | null;
  currentStage: string;
  overallStatus: "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  createdAt: string;
  creator: { id: string; fullName: string; username: string };
  ppcRequest: {
    id: string;
    requestNo: string;
    letterNo: string | null;
    letterDate: string | null;
    receivedDate: string;
    targetDate: string;
    typeCode: string;
    handoffTo: string | null;
    status: string;
    pic: { id: string; fullName: string } | null;
  } | null;
  tenderDocuments: Array<{
    id: string;
    tenderNo: string;
    revision: number;
    startDate: string;
    finishDate: string;
    workingDays: number;
    progressPct: number;
    status: string;
    engineer: { id: string; fullName: string };
  }>;
  purchaseOrder: {
    id: string;
    poNo: string;
    amount: number;
    issuedAt: string | null;
    status: string;
    vendor: { id: string; name: string; category: string } | null;
    paymentStages: Array<{
      id: string;
      stageName: string;
      percentage: number;
      amount: number;
      dueDate: string | null;
      isPaid: boolean;
      paidAt: string | null;
    }>;
  } | null;
  projectExecution: {
    id: string;
    startDate: string | null;
    finishDate: string | null;
    progressPct: number;
    status: string;
    notes: string | null;
    pic: { id: string; fullName: string } | null;
  } | null;
  handover: {
    id: string;
    bastNo: string | null;
    bastDate: string | null;
    handoverDate: string | null;
    warrantyDurationMonths: number;
    warrantyEnd: string | null;
    retentionPct: number | null;
    retentionAmount: number | null;
    status: string;
  } | null;
  attachments: Array<{
    id: string;
    fileName: string;
    fileUrl: string;
    fileType: string | null;
    sizeBytes: number | null;
    stage: string;
    createdAt: string;
    uploader: { fullName: string };
  }>;
  progressUpdates: Array<{
    id: string;
    stage: string;
    oldValue: string | null;
    newValue: string;
    note: string | null;
    createdAt: string;
    actor: { fullName: string; username: string };
  }>;
  vendorReviews: Array<{
    id: string;
    technicalScore: number;
    nonTechnicalScore: number;
    totalScore: number;
    notes: string | null;
    reviewer: { fullName: string };
  }>;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = React.useState<ProjectDetail | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<"stages" | "comments" | "activity">("stages");
  const [comments, setComments] = React.useState<Array<{ id: string; text: string; author: string; time: string }>>([
    {
      id: "c1",
      author: "Afrianto",
      text: "Tender documents finalized with engineering team. Ready for vendor bidding.",
      time: "2 hours ago",
    },
  ]);
  const [newComment, setNewComment] = React.useState("");

  const fetchProject = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      if (!res.ok) {
        if (res.status === 404) router.push("/projects");
        throw new Error("Project not found");
      }
      const data = await res.json();
      setProject(data.project);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, router]);

  React.useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setComments((prev) => [
      ...prev,
      {
        id: `c-${Date.now()}`,
        author: "You",
        text: newComment.trim(),
        time: "Just now",
      },
    ]);
    setNewComment("");
  };

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

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return <FileText className="w-5 h-5 text-red-500" />;
    if (["xlsx", "xls", "csv"].includes(ext || "")) return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
    return <Paperclip className="w-5 h-5 text-blue-500" />;
  };

  if (isLoading) {
    return (
      <div className="max-w-[760px] mx-auto py-12 space-y-6 animate-pulse">
        <div className="h-4 bg-[var(--border-soft)] rounded w-24"></div>
        <div className="h-8 bg-[var(--border-soft)] rounded w-3/4"></div>
        <div className="h-48 bg-[var(--border-soft)] rounded"></div>
      </div>
    );
  }

  if (!project) return null;

  const currentTender = project.tenderDocuments[0] || null;
  const currentPic = project.ppcRequest?.pic?.fullName || currentTender?.engineer.fullName || "Unassigned";

  // Compute overall progress
  let completedCount = 0;
  if (project.ppcRequest?.status === "COMPLETED") completedCount++;
  if (currentTender?.status === "COMPLETED") completedCount++;
  if (project.purchaseOrder?.status === "PO_ISSUED") completedCount++;
  if (project.projectExecution?.status === "COMPLETED") completedCount++;
  if (project.handover?.status === "CLOSED") completedCount++;
  const overallProgressPct = Math.round((completedCount / 5) * 100);

  return (
    <div className="max-w-[760px] mx-auto space-y-6 pb-16">
      {/* Back Link & Report Button */}
      <div className="flex items-center justify-between">
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Projects
        </Link>
        <Link
          href={`/projects/${projectId}/report`}
          className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 bg-[var(--bg-subtle)] border border-[var(--border)] rounded-[var(--r-md)] text-[var(--text)] hover:bg-[var(--bg-hover)] transition-colors"
        >
          <Printer className="w-3.5 h-3.5" />
          Executive Dossier
        </Link>
      </div>

      {/* Main Header Card: Icon, Title, Badge */}
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-[var(--r-md)] bg-[var(--bg-subtle)] border border-[var(--border)] flex items-center justify-center shrink-0">
          <Building2 className="w-5 h-5 text-[var(--text)]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)]">
              {project.name}
            </h1>
            {project.overallStatus === "COMPLETED" ? (
              <Badge variant="success">Completed</Badge>
            ) : project.overallStatus === "CANCELLED" ? (
              <Badge variant="danger">Cancelled</Badge>
            ) : (
              <Badge variant="info">On Progress</Badge>
            )}
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Created by {project.creator.fullName} · {formatDate(project.createdAt)}
          </p>
        </div>
      </div>

      {/* Property List (40px rows, design.md 4.5) */}
      <Card className="divide-y divide-[var(--border-soft)] border border-[var(--border)] bg-[var(--bg)] overflow-hidden">
        {/* Status */}
        <div className="flex items-center justify-between px-4 h-10 text-xs">
          <span className="flex items-center gap-2 text-[var(--text-muted)]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Status
          </span>
          <span className="font-medium text-[var(--text)]">
            {project.overallStatus === "COMPLETED" ? "✓ Completed" : "◔ On Progress"}
          </span>
        </div>

        {/* Current stage */}
        <div className="flex items-center justify-between px-4 h-10 text-xs">
          <span className="flex items-center gap-2 text-[var(--text-muted)]">
            <Clock className="w-3.5 h-3.5" />
            Current stage
          </span>
          <Badge variant="info" size="sm">{project.currentStage}</Badge>
        </div>

        {/* Target date */}
        <div className="flex items-center justify-between px-4 h-10 text-xs">
          <span className="flex items-center gap-2 text-[var(--text-muted)]">
            <Calendar className="w-3.5 h-3.5" />
            Target date
          </span>
          <span className="font-medium text-[var(--text)]">
            {formatDate(project.ppcRequest?.targetDate || project.projectExecution?.finishDate)}
          </span>
        </div>

        {/* PIC */}
        <div className="flex items-center justify-between px-4 h-10 text-xs">
          <span className="flex items-center gap-2 text-[var(--text-muted)]">
            <User className="w-3.5 h-3.5" />
            PIC
          </span>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[var(--r-sm)] bg-[var(--info-bg)] text-[var(--info)] text-xs font-medium">
              {currentPic}
            </span>
            <button
              type="button"
              className="w-5 h-5 rounded border border-dashed border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:border-[var(--text)]"
              title="Add PIC"
            >
              +
            </button>
          </div>
        </div>

        {/* Department */}
        <div className="flex items-center justify-between px-4 h-10 text-xs">
          <span className="flex items-center gap-2 text-[var(--text-muted)]">
            <Building2 className="w-3.5 h-3.5" />
            Department (dinas)
          </span>
          <span className="font-medium text-[var(--text)]">{project.department || "—"}</span>
        </div>

        {/* Winner vendor */}
        <div className="flex items-center justify-between px-4 h-10 text-xs">
          <span className="flex items-center gap-2 text-[var(--text-muted)]">
            <ShieldCheck className="w-3.5 h-3.5" />
            Winner vendor
          </span>
          <span className="font-medium text-[var(--text)]">
            {project.purchaseOrder?.vendor?.name || "Not assigned yet"}
          </span>
        </div>

        {/* PO value */}
        <div className="flex items-center justify-between px-4 h-10 text-xs">
          <span className="flex items-center gap-2 text-[var(--text-muted)]">
            <Tag className="w-3.5 h-3.5" />
            PO value
          </span>
          <span className="font-semibold text-[var(--text)]">
            {formatCurrency(project.purchaseOrder?.amount)}
          </span>
        </div>

        {/* Tags */}
        <div className="flex items-center justify-between px-4 h-10 text-xs">
          <span className="flex items-center gap-2 text-[var(--text-muted)]">
            <Tag className="w-3.5 h-3.5" />
            Tags
          </span>
          <span className="px-2 py-0.5 rounded bg-[var(--bg-subtle)] text-[var(--text-secondary)] font-medium">
            Facility · Mechanical
          </span>
        </div>
      </Card>

      {/* Attachments Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[var(--text)]">
            Attachments ({project.attachments.length})
          </h3>
          {project.attachments.length > 0 && (
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                alert("Download package initiated.");
              }}
              className="text-xs text-[var(--link)] hover:underline font-medium"
            >
              Download All
            </a>
          )}
        </div>

        {project.attachments.length === 0 ? (
          <div className="p-4 rounded-[var(--r-md)] border border-dashed border-[var(--border)] text-center text-xs text-[var(--text-muted)]">
            No files attached to this project yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {project.attachments.map((file) => (
              <div
                key={file.id}
                className="h-14 px-3.5 rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--bg)] flex items-center justify-between gap-3 hover:border-[#CFCFD4] transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {getFileIcon(file.fileName)}
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-[var(--text)] truncate">
                      {file.fileName}
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      {formatFileSize(file.sizeBytes)} · {file.stage}
                    </p>
                  </div>
                </div>

                <a
                  href={file.fileUrl || "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-[var(--link)] hover:underline whitespace-nowrap"
                >
                  Download
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dashed Divider (design.md 4.5 #5) */}
      <div className="border-t border-dashed border-[var(--border-soft)]" />

      {/* Segmented Tabs (design.md 4.5 #6) */}
      <div className="p-1 rounded-[var(--r-md)] bg-[var(--bg-subtle)] inline-flex gap-1 border border-[var(--border-soft)]">
        <button
          type="button"
          onClick={() => setActiveTab("stages")}
          className={`px-3 py-1.5 text-xs font-medium rounded-[var(--r-sm)] transition-colors ${
            activeTab === "stages"
              ? "bg-[var(--bg)] text-[var(--text)] shadow-xs border border-[var(--border)]"
              : "text-[var(--text-muted)] hover:text-[var(--text)]"
          }`}
        >
          Stages
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("comments")}
          className={`px-3 py-1.5 text-xs font-medium rounded-[var(--r-sm)] transition-colors ${
            activeTab === "comments"
              ? "bg-[var(--bg)] text-[var(--text)] shadow-xs border border-[var(--border)]"
              : "text-[var(--text-muted)] hover:text-[var(--text)]"
          }`}
        >
          Comments {comments.length}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("activity")}
          className={`px-3 py-1.5 text-xs font-medium rounded-[var(--r-sm)] transition-colors ${
            activeTab === "activity"
              ? "bg-[var(--bg)] text-[var(--text)] shadow-xs border border-[var(--border)]"
              : "text-[var(--text-muted)] hover:text-[var(--text)]"
          }`}
        >
          Activity ({project.progressUpdates.length})
        </button>
      </div>

      {/* Tab 1: Stages View */}
      {activeTab === "stages" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[var(--text)]">Project Lifecycle Stages</span>
            <span className="font-medium text-[var(--text-muted)]">
              Overall Progress: <strong className="text-[var(--progress)]">{overallProgressPct}%</strong>
            </span>
          </div>

          <div className="w-full h-2 bg-[var(--track)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--progress)] transition-all duration-500"
              style={{ width: `${overallProgressPct}%` }}
            />
          </div>

          {/* Stage Cards */}
          <div className="space-y-2.5">
            {/* Stage 1: PPC */}
            <div className="p-3.5 rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--bg)] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--text-muted)] cursor-grab">⠿</span>
                  <span className="w-4 h-4 rounded-full bg-[var(--success-bg)] text-[var(--success)] flex items-center justify-center text-[10px] font-bold">
                    ✓
                  </span>
                  <span className="text-sm font-semibold text-[var(--text)]">1. PPC Incoming Request</span>
                </div>
                {project.ppcRequest?.status === "COMPLETED" ? (
                  <Badge variant="success" size="sm">Completed</Badge>
                ) : (
                  <Badge variant="info" size="sm">In Progress</Badge>
                )}
              </div>
              <div className="p-2.5 rounded bg-[var(--bg-subtle)] text-xs text-[var(--text-muted)] space-y-1">
                <p>Request No: <span className="font-mono text-[var(--text)]">{project.ppcRequest?.requestNo || "—"}</span></p>
                <p>Target Completion: {formatDate(project.ppcRequest?.targetDate)}</p>
                <p>Handoff Destination: {project.ppcRequest?.handoffTo || "To Project"}</p>
              </div>
            </div>

            {/* Stage 2: Engineering */}
            <div className="p-3.5 rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--bg)] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--text-muted)] cursor-grab">⠿</span>
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    currentTender?.status === "COMPLETED"
                      ? "bg-[var(--success-bg)] text-[var(--success)]"
                      : "bg-[var(--neutral-bg)] text-[var(--neutral)]"
                  }`}>
                    {currentTender?.status === "COMPLETED" ? "✓" : "2"}
                  </span>
                  <span className="text-sm font-semibold text-[var(--text)]">2. Engineering & BoQ</span>
                </div>
                {currentTender?.status === "COMPLETED" ? (
                  <Badge variant="success" size="sm">100%</Badge>
                ) : currentTender ? (
                  <Badge variant="info" size="sm">{currentTender.progressPct}%</Badge>
                ) : (
                  <Badge variant="neutral" size="sm">Pending</Badge>
                )}
              </div>
              <div className="p-2.5 rounded bg-[var(--bg-subtle)] text-xs text-[var(--text-muted)] space-y-1">
                <p>Tender Document: <span className="font-mono text-[var(--text)]">{currentTender?.tenderNo || "—"}</span></p>
                <p>Assigned Engineer: {currentTender?.engineer.fullName || "—"}</p>
                <p>Working Days: {currentTender?.workingDays ? `${currentTender.workingDays} working days` : "—"}</p>
              </div>
            </div>

            {/* Stage 3: Procurement */}
            <div className="p-3.5 rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--bg)] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--text-muted)] cursor-grab">⠿</span>
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    project.purchaseOrder?.status === "PO_ISSUED"
                      ? "bg-[var(--success-bg)] text-[var(--success)]"
                      : "bg-[var(--neutral-bg)] text-[var(--neutral)]"
                  }`}>
                    {project.purchaseOrder?.status === "PO_ISSUED" ? "✓" : "3"}
                  </span>
                  <span className="text-sm font-semibold text-[var(--text)]">3. Procurement & PO</span>
                </div>
                {project.purchaseOrder?.status === "PO_ISSUED" ? (
                  <Badge variant="success" size="sm">PO Issued</Badge>
                ) : (
                  <Badge variant="warning" size="sm">Bidding</Badge>
                )}
              </div>
              <div className="p-2.5 rounded bg-[var(--bg-subtle)] text-xs text-[var(--text-muted)] space-y-1">
                <p>PO No: <span className="font-mono text-[var(--text)]">{project.purchaseOrder?.poNo || "—"}</span></p>
                <p>Vendor: <strong className="text-[var(--text)]">{project.purchaseOrder?.vendor?.name || "Pending award"}</strong></p>
                <p>PO Amount: {formatCurrency(project.purchaseOrder?.amount)}</p>
              </div>
            </div>

            {/* Stage 4: Project Execution */}
            <div className="p-3.5 rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--bg)] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--text-muted)] cursor-grab">⠿</span>
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    project.projectExecution?.status === "COMPLETED"
                      ? "bg-[var(--success-bg)] text-[var(--success)]"
                      : "bg-[var(--neutral-bg)] text-[var(--neutral)]"
                  }`}>
                    {project.projectExecution?.status === "COMPLETED" ? "✓" : "4"}
                  </span>
                  <span className="text-sm font-semibold text-[var(--text)]">4. Project Execution</span>
                </div>
                {project.projectExecution?.status === "COMPLETED" ? (
                  <Badge variant="success" size="sm">Done</Badge>
                ) : project.projectExecution ? (
                  <Badge variant="info" size="sm">{project.projectExecution.progressPct}%</Badge>
                ) : (
                  <Badge variant="neutral" size="sm">Not Started</Badge>
                )}
              </div>
              <div className="p-2.5 rounded bg-[var(--bg-subtle)] text-xs text-[var(--text-muted)] space-y-1">
                <p>Execution PIC: {project.projectExecution?.pic?.fullName || "—"}</p>
                <p>Target Finish: {formatDate(project.projectExecution?.finishDate)}</p>
                <p>Physical Progress: {project.projectExecution?.progressPct || 0}%</p>
              </div>
            </div>

            {/* Stage 5: Handover */}
            <div className="p-3.5 rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--bg)] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--text-muted)] cursor-grab">⠿</span>
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    project.handover?.status === "CLOSED"
                      ? "bg-[var(--success-bg)] text-[var(--success)]"
                      : "bg-[var(--neutral-bg)] text-[var(--neutral)]"
                  }`}>
                    {project.handover?.status === "CLOSED" ? "✓" : "5"}
                  </span>
                  <span className="text-sm font-semibold text-[var(--text)]">5. Handover & Warranty</span>
                </div>
                {project.handover?.status === "CLOSED" ? (
                  <Badge variant="success" size="sm">Closed</Badge>
                ) : (
                  <Badge variant="neutral" size="sm">Pending</Badge>
                )}
              </div>
              <div className="p-2.5 rounded bg-[var(--bg-subtle)] text-xs text-[var(--text-muted)] space-y-1">
                <p>BAST No: <span className="font-mono text-[var(--text)]">{project.handover?.bastNo || "—"}</span></p>
                <p>Warranty End: {formatDate(project.handover?.warrantyEnd)}</p>
                <p>Retention: {project.handover?.retentionPct ? `${project.handover.retentionPct}%` : "—"}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Comments */}
      {activeTab === "comments" && (
        <div className="space-y-4">
          <form onSubmit={handleAddComment} className="space-y-2">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write an internal project note or comment..."
              rows={3}
              className="w-full p-3 text-xs rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)]"
            />
            <div className="flex justify-end">
              <Button type="submit" size="sm">
                <Send className="w-3.5 h-3.5 mr-1" />
                Post Comment
              </Button>
            </div>
          </form>

          <div className="space-y-2.5 pt-2">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="p-3 rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--bg)] space-y-1"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[var(--text)]">{comment.author}</span>
                  <span className="text-[11px] text-[var(--text-muted)]">{comment.time}</span>
                </div>
                <p className="text-xs text-[var(--text-secondary)]">{comment.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Activity Timeline (design.md 5.10) */}
      {activeTab === "activity" && (
        <div className="space-y-4">
          <h4 className="text-xs font-semibold text-[var(--text)]">Audit Trail & Updates</h4>
          {project.progressUpdates.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)]">No activity recorded for this project yet.</p>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[var(--border-soft)]">
              {project.progressUpdates.map((update) => (
                <div key={update.id} className="relative">
                  <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-[var(--text-muted)] border-2 border-[var(--bg)]" />
                  <div className="text-xs space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[var(--text)]">{update.actor.fullName}</span>
                      <span className="text-[var(--text-muted)]">updated</span>
                      <Badge variant="neutral" size="sm">{update.stage}</Badge>
                      {update.oldValue && (
                        <span className="font-medium text-[var(--text)]">
                          {update.oldValue}% → {update.newValue}%
                        </span>
                      )}
                    </div>
                    {update.note && (
                      <p className="p-2 rounded bg-[var(--bg-subtle)] text-[var(--text-muted)] italic">
                        "{update.note}"
                      </p>
                    )}
                    <span className="text-[10px] text-[var(--text-faint)]">
                      {new Date(update.createdAt).toLocaleString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
