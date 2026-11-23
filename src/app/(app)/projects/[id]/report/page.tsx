"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Printer, ArrowLeft, CheckCircle2, Shield, Calendar, Building2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ProjectReportPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string;

  const [project, setProject] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (!projectId) return;

    fetch(`/api/projects/${projectId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load project details");
        return res.json();
      })
      .then((data) => {
        setProject(data.project);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Could not load project report.");
        setLoading(false);
      });
  }, [projectId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-8 flex items-center justify-center text-sm text-zinc-500">
        Generating official project report dossier...
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-white p-8 space-y-4">
        <p className="text-red-600">{error || "Project not found."}</p>
        <Button variant="secondary" size="sm" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  const ppc = project.ppcRequest;
  const tender = project.tenderDocuments?.[0];
  const po = project.purchaseOrder;
  const execution = project.projectExecution;
  const handover = project.handover;
  const review = project.vendorReviews?.[0];

  return (
    <div className="min-h-screen bg-zinc-100 py-8 px-4 sm:px-6 print:bg-white print:p-0 print:m-0">
      {/* Print Toolbar - Hidden in Print View */}
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between print:hidden">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => router.push(`/projects/${projectId}`)}
          className="flex items-center gap-1.5 bg-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Project
        </Button>
        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="sm"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 shadow-sm"
          >
            <Printer className="h-4 w-4" />
            Print / Save PDF
          </Button>
        </div>
      </div>

      {/* Main Printable Document Dossier */}
      <div className="max-w-4xl mx-auto bg-white border border-zinc-200 shadow-sm print:border-none print:shadow-none p-8 sm:p-12 text-zinc-900 font-sans">
        {/* Document Header */}
        <div className="border-b-2 border-zinc-900 pb-6 mb-8 flex justify-between items-start">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">
              Facility Management Department · Project Office
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900">
              PROJECT DOSSIER & AUDIT SUMMARY
            </h1>
            <p className="text-sm text-zinc-600 mt-1">
              End-to-End Governance, Procurement, Execution & KPI Records
            </p>
          </div>
          <div className="text-right text-xs font-mono text-zinc-500">
            <div>DOC ID: {project.id.slice(0, 8).toUpperCase()}</div>
            <div>DATE: {new Date().toLocaleDateString("id-ID")}</div>
            <div className="mt-2 inline-block px-2 py-0.5 bg-zinc-100 border border-zinc-300 font-semibold text-zinc-800">
              {project.overallStatus}
            </div>
          </div>
        </div>

        {/* Section 1: General Project Information */}
        <div className="mb-8">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500 border-b border-zinc-200 pb-1.5 mb-3">
            1. General Information
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-zinc-500 block">Project Title:</span>
              <strong className="text-zinc-900 text-sm block">{project.name}</strong>
            </div>
            <div>
              <span className="text-zinc-500 block">Requesting Dept:</span>
              <strong className="text-zinc-900 block">{project.department || "—"}</strong>
            </div>
            <div>
              <span className="text-zinc-500 block">Current Stage:</span>
              <strong className="text-zinc-900 block">{project.currentStage}</strong>
            </div>
            <div>
              <span className="text-zinc-500 block">Initiated Date:</span>
              <span className="text-zinc-800 block">
                {new Date(project.createdAt).toLocaleDateString("id-ID")}
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: PPC Intake Details */}
        <div className="mb-8">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500 border-b border-zinc-200 pb-1.5 mb-3">
            2. Stage 1 — PPC Intake & Registration
          </h2>
          {ppc ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-zinc-500 block">PPC Request No:</span>
                <span className="font-mono font-bold text-zinc-900">{ppc.requestNo}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Incoming Letter No:</span>
                <span className="text-zinc-800">{ppc.letterNo || "—"}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Target Completion:</span>
                <span className="text-zinc-800">
                  {new Date(ppc.targetDate).toLocaleDateString("id-ID")}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block">PPC Status:</span>
                <span className="font-semibold text-zinc-900">{ppc.status}</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-zinc-500 italic">No PPC intake records found.</p>
          )}
        </div>

        {/* Section 3: Engineering Tender */}
        <div className="mb-8">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500 border-b border-zinc-200 pb-1.5 mb-3">
            3. Stage 2 — Engineering & Tender Documents
          </h2>
          {tender ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-zinc-500 block">Tender Document No:</span>
                <span className="font-mono font-bold text-zinc-900">{tender.tenderNo}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Revision:</span>
                <span className="text-zinc-800">Rev {tender.revision}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Working Days Allocated:</span>
                <span className="text-zinc-800">{tender.workingDays || 0} Working Days</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Engineering Status:</span>
                <span className="font-semibold text-zinc-900">{tender.status}</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-zinc-500 italic">No engineering documents prepared.</p>
          )}
        </div>

        {/* Section 4 & 5: Procurement & Staged Payments */}
        <div className="mb-8">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500 border-b border-zinc-200 pb-1.5 mb-3">
            4. Stage 3 — Procurement & Staged Payments
          </h2>
          {po ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-zinc-500 block">Winning Vendor:</span>
                  <strong className="text-zinc-900 block">{po.vendor?.name || "—"}</strong>
                </div>
                <div>
                  <span className="text-zinc-500 block">Purchase Order No:</span>
                  <span className="font-mono font-bold text-zinc-900">{po.poNo}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Total Contract Value:</span>
                  <strong className="text-zinc-900 block">
                    Rp {Number(po.amount).toLocaleString("id-ID")}
                  </strong>
                </div>
                <div>
                  <span className="text-zinc-500 block">PO Issue Date:</span>
                  <span className="text-zinc-800">
                    {new Date(po.issuedAt).toLocaleDateString("id-ID")}
                  </span>
                </div>
              </div>

              {/* Payment Stages Table */}
              {po.paymentStages && po.paymentStages.length > 0 && (
                <div className="mt-3">
                  <span className="text-xs font-bold text-zinc-700 block mb-2">
                    Contracted Payment Milestones:
                  </span>
                  <table className="w-full text-left text-xs border border-zinc-200">
                    <thead className="bg-zinc-50 border-b border-zinc-200 font-semibold text-zinc-600">
                      <tr>
                        <th className="py-2 px-3">Milestone Name</th>
                        <th className="py-2 px-3 text-right">Percentage</th>
                        <th className="py-2 px-3 text-right">Amount (IDR)</th>
                        <th className="py-2 px-3">Due Date</th>
                        <th className="py-2 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200">
                      {po.paymentStages.map((st: any) => (
                        <tr key={st.id}>
                          <td className="py-2 px-3 font-medium text-zinc-900">{st.name}</td>
                          <td className="py-2 px-3 text-right">{Number(st.percentage)}%</td>
                          <td className="py-2 px-3 text-right font-mono">
                            Rp {Number(st.amount).toLocaleString("id-ID")}
                          </td>
                          <td className="py-2 px-3 text-zinc-600">
                            {st.dueDate ? new Date(st.dueDate).toLocaleDateString("id-ID") : "—"}
                          </td>
                          <td className="py-2 px-3 font-semibold">
                            {st.status === "PAID" ? (
                              <span className="text-emerald-700">PAID</span>
                            ) : (
                              <span className="text-zinc-600">{st.status}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-zinc-500 italic">No purchase order issued.</p>
          )}
        </div>

        {/* Section 6: Execution, Handover & Warranty */}
        <div className="mb-8">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500 border-b border-zinc-200 pb-1.5 mb-3">
            5. Stage 4 & 5 — Execution & Operations Handover
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-zinc-500 block">Physical Progress:</span>
              <strong className="text-zinc-900 text-sm block">
                {execution?.progressPct ?? 0}%
              </strong>
            </div>
            <div>
              <span className="text-zinc-500 block">Handover Date:</span>
              <span className="text-zinc-800">
                {handover?.handoverDate
                  ? new Date(handover.handoverDate).toLocaleDateString("id-ID")
                  : "Pending BAST"}
              </span>
            </div>
            <div>
              <span className="text-zinc-500 block">Warranty Period:</span>
              <span className="text-zinc-800">
                {handover?.warrantyMonths || 12} Months (Ends:{" "}
                {handover?.warrantyEnd
                  ? new Date(handover.warrantyEnd).toLocaleDateString("id-ID")
                  : "—"}
                )
              </span>
            </div>
            <div>
              <span className="text-zinc-500 block">Retention Held (5%):</span>
              <span className="font-mono font-semibold text-zinc-900">
                Rp {Number(handover?.retentionAmount || 0).toLocaleString("id-ID")}
              </span>
            </div>
          </div>
        </div>

        {/* Section 7: Vendor Evaluation Scorecard */}
        {review && (
          <div className="mb-10">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500 border-b border-zinc-200 pb-1.5 mb-3">
              6. Vendor KPI Evaluation
            </h2>
            <div className="p-4 bg-zinc-50 border border-zinc-200 rounded text-xs space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-zinc-500">Evaluated Vendor:</span>{" "}
                  <strong>{po?.vendor?.name || "Contractor"}</strong>
                </div>
                <div className="text-sm font-bold text-zinc-900">
                  Weighted Score:{" "}
                  {Math.round(
                    Number(review.technicalScore) * 0.6 +
                      Number(review.nonTechnicalScore) * 0.4
                  )}
                  /100
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div>Technical Score (60%): <strong>{Number(review.technicalScore)}</strong></div>
                <div>Non-Technical Score (40%): <strong>{Number(review.nonTechnicalScore)}</strong></div>
              </div>
              {review.notes && (
                <div className="pt-2 text-zinc-600 border-t border-zinc-200">
                  <span className="font-semibold text-zinc-800">Reviewer Notes:</span> {review.notes}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Section 8: Sign-off Matrix */}
        <div className="pt-8 border-t-2 border-zinc-900 mt-12">
          <div className="grid grid-cols-3 gap-6 text-center text-xs">
            <div>
              <div className="text-zinc-500 mb-16">Prepared By:</div>
              <div className="border-t border-zinc-400 pt-1 font-semibold text-zinc-900">
                Project Engineer / PIC
              </div>
              <div className="text-[10px] text-zinc-500">Facility Management</div>
            </div>
            <div>
              <div className="text-zinc-500 mb-16">Verified By:</div>
              <div className="border-t border-zinc-400 pt-1 font-semibold text-zinc-900">
                Procurement & Contract Lead
              </div>
              <div className="text-[10px] text-zinc-500">Procurement Committee</div>
            </div>
            <div>
              <div className="text-zinc-500 mb-16">Approved By:</div>
              <div className="border-t border-zinc-400 pt-1 font-semibold text-zinc-900">
                Head of Facility Management
              </div>
              <div className="text-[10px] text-zinc-500">Division Directorate</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
