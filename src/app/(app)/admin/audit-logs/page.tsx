"use client";

import * as React from "react";
import {
  FileText,
  Search,
  Filter,
  RefreshCw,
  Clock,
  User as UserIcon,
  Shield,
  Eye,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";

interface AuditLogItem {
  id: string;
  actorId: string | null;
  actorName: string;
  actorUsername: string | null;
  actorRole: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  diff: any;
  ip: string;
  createdAt: string;
}

interface PaginationData {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = React.useState<AuditLogItem[]>([]);
  const [pagination, setPagination] = React.useState<PaginationData>({
    page: 1,
    limit: 50,
    totalCount: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [entityFilter, setEntityFilter] = React.useState("");
  const [actionFilter, setActionFilter] = React.useState("");
  const [error, setError] = React.useState("");

  // Inspect diff modal
  const [selectedLog, setSelectedLog] = React.useState<AuditLogItem | null>(null);

  const fetchLogs = React.useCallback(async (pageToFetch: number = 1) => {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams();
      params.set("page", String(pageToFetch));
      params.set("limit", "50");
      if (searchQuery) params.set("q", searchQuery);
      if (entityFilter) params.set("entity", entityFilter);
      if (actionFilter) params.set("action", actionFilter);

      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);
      if (res.status === 403) {
        setError("Forbidden: Only ADMIN accounts can view audit logs.");
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (data.logs) {
        setLogs(data.logs);
        setPagination(data.pagination);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load audit logs.");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, entityFilter, actionFilter]);

  React.useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  const getActionBadgeVariant = (action: string) => {
    if (action.includes("CREATE")) return "success";
    if (action.includes("DELETE") || action.includes("DEACTIVAT") || action.includes("REJECT"))
      return "danger";
    if (action.includes("UPDATE") || action.includes("CHANGED") || action.includes("RESET"))
      return "info";
    return "warning";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">
            Audit Trail
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Immutable, compliance-grade log of administrative and workflow operations.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => fetchLogs(pagination.page)}
          className="flex items-center gap-1.5"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-[var(--r-md)] text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter toolbar */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
            <Input
              placeholder="Search action, entity, user..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="h-9 px-3 bg-[var(--bg)] border border-[var(--border)] rounded-[var(--r-md)] text-xs text-[var(--text)]"
            >
              <option value="">All Entities</option>
              <option value="USER">USER</option>
              <option value="PROJECT">PROJECT</option>
              <option value="PPC">PPC</option>
              <option value="TENDER">TENDER</option>
              <option value="PO">PO</option>
              <option value="HANDOVER">HANDOVER</option>
              <option value="VENDOR_REVIEW">VENDOR_REVIEW</option>
            </select>

            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="h-9 px-3 bg-[var(--bg)] border border-[var(--border)] rounded-[var(--r-md)] text-xs text-[var(--text)]"
            >
              <option value="">All Actions</option>
              <option value="USER_CREATED">USER_CREATED</option>
              <option value="USER_ACTIVATED">USER_ACTIVATED</option>
              <option value="USER_DEACTIVATED">USER_DEACTIVATED</option>
              <option value="USER_ROLE_CHANGED">USER_ROLE_CHANGED</option>
              <option value="USER_PASSWORD_RESET">USER_PASSWORD_RESET</option>
              <option value="USER_UNLOCKED">USER_UNLOCKED</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--bg-subtle)] text-[var(--text-muted)] font-medium text-xs">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target Entity</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[var(--text-muted)]">
                    Loading audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[var(--text-muted)]">
                    No audit logs recorded yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[var(--bg-subtle)] transition-colors">
                    <td className="py-3 px-4 text-xs font-mono text-[var(--text-muted)] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString("id-ID", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Avatar name={log.actorName} size="sm" />
                        <div>
                          <div className="font-medium text-xs text-[var(--text)]">
                            {log.actorName}
                          </div>
                          {log.actorUsername && (
                            <div className="text-[10px] text-[var(--text-muted)] font-mono">
                              @{log.actorUsername}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <Badge variant={getActionBadgeVariant(log.action) as any}>
                        {log.action}
                      </Badge>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-semibold text-xs text-[var(--text)]">
                        {log.entity}
                      </span>
                      {log.entityId && (
                        <span className="block text-[11px] font-mono text-[var(--text-muted)] truncate max-w-[140px]">
                          {log.entityId}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-xs font-mono text-[var(--text-muted)]">
                      {log.ip}
                    </td>

                    <td className="py-3 px-4 text-right">
                      {log.diff ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setSelectedLog(log)}
                          className="h-7 px-2 text-xs"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" /> View Diff
                        </Button>
                      ) : (
                        <span className="text-xs text-[var(--text-muted)]">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--text-muted)]">
            <div>
              Showing page {pagination.page} of {pagination.totalPages} ({pagination.totalCount} total events)
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => fetchLogs(pagination.page - 1)}
                className="h-8 px-2.5"
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchLogs(pagination.page + 1)}
                className="h-8 px-2.5"
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Modal: View Diff */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-[var(--bg)] border border-[var(--border)] rounded-[var(--r-lg)] max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[var(--text)]">
                Audit Event Payload
              </h3>
              <Badge variant={getActionBadgeVariant(selectedLog.action) as any}>
                {selectedLog.action}
              </Badge>
            </div>

            <div className="text-xs space-y-1 text-[var(--text-muted)]">
              <div>
                <strong>Actor:</strong> {selectedLog.actorName} (
                {selectedLog.actorUsername ? `@${selectedLog.actorUsername}` : "System"})
              </div>
              <div>
                <strong>Target:</strong> {selectedLog.entity} (ID: {selectedLog.entityId || "—"})
              </div>
              <div>
                <strong>Timestamp:</strong> {new Date(selectedLog.createdAt).toLocaleString("id-ID")}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">
                Payload / Diff Data:
              </label>
              <pre className="p-3 bg-zinc-900 text-emerald-400 rounded-[var(--r-md)] text-xs font-mono overflow-x-auto max-h-64">
                {JSON.stringify(selectedLog.diff, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setSelectedLog(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
