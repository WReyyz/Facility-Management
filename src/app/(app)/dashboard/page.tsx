"use client";

import * as React from "react";
import Link from "next/link";
import {
  Clock,
  RefreshCw,
  Plus,
  MoreHorizontal,
  ArrowRight,
  AlertCircle,
  Calendar,
  Layers,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function DashboardPage() {
  const [data, setData] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch("/api/dashboard");
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  React.useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchDashboardData();
  };

  const statCards = data?.statCards || [
    { stage: "PPC Requests", active: 0, total: 0, completed: 0, pct: 0 },
    { stage: "Engineering", active: 0, total: 0, completed: 0, pct: 0 },
    { stage: "Procurement", active: 0, total: 0, completed: 0, pct: 0 },
    { stage: "Project", active: 0, total: 0, completed: 0, pct: 0 },
    { stage: "Operations", active: 0, total: 0, completed: 0, pct: 0 },
  ];

  const projectFlow = data?.projectFlow || [
    { stage: "PPC Request", count: 0 },
    { stage: "Engineering", count: 0 },
    { stage: "Procurement", count: 0 },
    { stage: "Project Execution", count: 0 },
    { stage: "Operations & Handover", count: 0 },
  ];

  const vendorReadiness = data?.vendorReadiness || {
    eligible: 0,
    notEligible: 0,
    notRated: 0,
  };

  const overdueItems = data?.overdueItems || [];
  const dueSoonItems = data?.dueSoonItems || [];

  return (
    <div className="space-y-6">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[var(--border-soft)]">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--text)]">Dashboard</h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">
            Realtime project administration, live progress, and stage tracking.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center text-xs text-[var(--text-muted)] gap-1.5 mr-1 font-mono">
            <Clock className="w-3.5 h-3.5" />
            <span>Updated {data?.updatedAt || "just now"}</span>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleRefresh}
            isLoading={isRefreshing}
            className="text-xs h-8"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Link href="/projects">
            <Button variant="primary" size="sm" className="text-xs h-8">
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Explore Projects
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Row 1: 5 Stage Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {statCards.map((c: any) => (
          <Card key={c.stage} className="hover:border-[#CFCFD4] transition-colors p-4">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-semibold text-[var(--text-muted)] tracking-tight">
                {c.stage}
              </span>
              <span className="text-xs font-mono font-medium text-[var(--text-muted)]">{c.pct}%</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text)] mb-2 font-mono">
              {c.active}
            </div>
            <div className="text-[11px] text-[var(--text-muted)] mb-3 font-mono">
              active of {c.total} · {c.completed} completed
            </div>
            <Progress value={c.pct} />
          </Card>
        ))}
      </div>

      {/* 3. Row 2: Project Flow & Vendor Readiness */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Project Flow (2 cols) */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[var(--text-muted)]" />
                <CardTitle className="text-sm font-semibold">Project Flow</CardTitle>
              </div>
              <span className="text-xs text-[var(--text-muted)]">Active stage distribution</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {projectFlow.map((s: any) => {
              const maxCount = Math.max(...projectFlow.map((p: any) => p.count), 1);
              const barPct = Math.round((s.count / maxCount) * 100);

              return (
                <div key={s.stage} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-[var(--text)]">{s.stage}</span>
                    <span className="text-[var(--text-muted)] font-mono">{s.count} project(s)</span>
                  </div>
                  <div className="h-2 w-full bg-[var(--track)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--progress)] rounded-full transition-all duration-500"
                      style={{ width: `${barPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Vendor Readiness (1 col) */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-[var(--text-muted)]" />
                <CardTitle className="text-sm font-semibold">Vendor Readiness</CardTitle>
              </div>
              <Link href="/vendors" className="text-xs text-[var(--link)] hover:underline">
                View all →
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-2.5 rounded-[var(--r-md)] border border-[var(--border-soft)] bg-[var(--bg-subtle)]">
              <Badge variant="success">Eligible (≥ 70%)</Badge>
              <span className="font-semibold text-sm font-mono text-[var(--text)]">
                {vendorReadiness.eligible} vendor(s)
              </span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-[var(--r-md)] border border-[var(--border-soft)] bg-[var(--bg-subtle)]">
              <Badge variant="danger">Not eligible (&lt; 70%)</Badge>
              <span className="font-semibold text-sm font-mono text-[var(--text)]">
                {vendorReadiness.notEligible} vendor(s)
              </span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-[var(--r-md)] border border-[var(--border-soft)] bg-[var(--bg-subtle)]">
              <Badge variant="neutral">Not rated yet</Badge>
              <span className="font-semibold text-sm font-mono text-[var(--text)]">
                {vendorReadiness.notRated} vendor(s)
              </span>
            </div>

            <div className="pt-2 border-t border-[var(--border-soft)]">
              <p className="text-xs text-[var(--text-muted)] italic">
                Scoring formula: 60% Technical + 40% Non-technical.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 4. Row 3: Overdue & Due in next 7 days */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Overdue Items */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[var(--danger)]" />
                <CardTitle className="text-sm font-semibold text-[var(--danger)]">
                  Overdue Items ({overdueItems.length})
                </CardTitle>
              </div>
              {overdueItems.length > 0 && <Badge variant="danger">Requires Action</Badge>}
            </div>
          </CardHeader>
          <CardContent>
            {overdueItems.length === 0 ? (
              <div className="text-center py-6 text-xs text-[var(--text-muted)]">
                <p className="font-medium">Nothing is past its target date.</p>
                <span className="text-[11px] text-[var(--text-faint)]">All milestones are on track</span>
              </div>
            ) : (
              <div className="space-y-2">
                {overdueItems.map((item: any) => (
                  <Link
                    key={item.id}
                    href={`/projects/${item.projectId}`}
                    className="flex items-center justify-between p-2.5 rounded-[var(--r-md)] border border-[var(--border-soft)] hover:bg-[var(--hover)] transition-colors group"
                  >
                    <div className="min-w-0 pr-3">
                      <div className="text-xs font-semibold text-[var(--text)] group-hover:text-[var(--link)] truncate">
                        {item.projectName}
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                        {item.stage} · PIC: {item.picName}
                      </div>
                    </div>
                    <Badge variant="danger" size="sm">
                      {item.daysOverdue}d overdue
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Due in next 7 days */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[var(--warning)]" />
                <CardTitle className="text-sm font-semibold text-[var(--warning)]">
                  Due in the Next 7 Days ({dueSoonItems.length})
                </CardTitle>
              </div>
              {dueSoonItems.length > 0 && <Badge variant="warning">Upcoming</Badge>}
            </div>
          </CardHeader>
          <CardContent>
            {dueSoonItems.length === 0 ? (
              <div className="text-center py-6 text-xs text-[var(--text-muted)]">
                <p className="font-medium">Nothing is close to its target date.</p>
                <span className="text-[11px] text-[var(--text-faint)]">No deadlines within 7 days</span>
              </div>
            ) : (
              <div className="space-y-2">
                {dueSoonItems.map((item: any) => (
                  <Link
                    key={item.id}
                    href={`/projects/${item.projectId}`}
                    className="flex items-center justify-between p-2.5 rounded-[var(--r-md)] border border-[var(--border-soft)] hover:bg-[var(--hover)] transition-colors group"
                  >
                    <div className="min-w-0 pr-3">
                      <div className="text-xs font-semibold text-[var(--text)] group-hover:text-[var(--link)] truncate">
                        {item.projectName}
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                        {item.stage} · PIC: {item.picName}
                      </div>
                    </div>
                    <Badge variant="warning" size="sm">
                      In {item.daysRemaining}d
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
