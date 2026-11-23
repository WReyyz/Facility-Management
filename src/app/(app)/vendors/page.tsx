"use client";

import * as React from "react";
import {
  Award,
  Building2,
  Search,
  Plus,
  Filter,
  CheckCircle2,
  AlertCircle,
  X,
  Phone,
  Mail,
  User,
  Edit2,
  Power,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const CATEGORIES = [
  "MECHANICAL",
  "MULTI_DISCIPLINE",
  "CIVIL",
  "HVAC",
  "MEP",
  "OTHERS",
] as const;

export default function VendorsPage() {
  const [activeTab, setActiveTab] = React.useState<"ranking" | "master">("ranking");

  // Ranking State
  const [rankings, setRankings] = React.useState<any[]>([]);
  const [rankingsLoading, setRankingsLoading] = React.useState(true);

  // Vendor Master State
  const [vendors, setVendors] = React.useState<any[]>([]);
  const [masterLoading, setMasterLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<string>("ALL");

  // Modal State
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingVendor, setEditingVendor] = React.useState<any | null>(null);
  const [formData, setFormData] = React.useState({
    name: "",
    category: "MECHANICAL",
    contactName: "",
    phone: "",
    email: "",
  });
  const [modalError, setModalError] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  // User session
  const [currentUser, setCurrentUser] = React.useState<any | null>(null);

  React.useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) setCurrentUser(d.user);
      })
      .catch(console.error);

    fetchRankings();
    fetchVendors();
  }, []);

  const fetchRankings = async () => {
    setRankingsLoading(true);
    try {
      const res = await fetch("/api/vendors/ranking");
      const data = await res.json();
      if (data.rankings) setRankings(data.rankings);
    } catch (e) {
      console.error(e);
    } finally {
      setRankingsLoading(false);
    }
  };

  const fetchVendors = async () => {
    setMasterLoading(true);
    try {
      let url = "/api/vendors";
      const params = new URLSearchParams();
      if (searchQuery) params.set("q", searchQuery);
      if (selectedCategory !== "ALL") params.set("category", selectedCategory);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.vendors) setVendors(data.vendors);
    } catch (e) {
      console.error(e);
    } finally {
      setMasterLoading(false);
    }
  };

  // Open modal for Create
  const handleOpenAdd = () => {
    setEditingVendor(null);
    setFormData({
      name: "",
      category: "MECHANICAL",
      contactName: "",
      phone: "",
      email: "",
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  // Auto-open add vendor modal if navigated from Create New action
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("action") === "new") {
        handleOpenAdd();
      }
    }
  }, []);

  // Open modal for Edit
  const handleOpenEdit = (v: any) => {
    setEditingVendor(v);
    setFormData({
      name: v.name,
      category: v.category,
      contactName: v.contactName || "",
      phone: v.phone || "",
      email: v.email || "",
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  // Save Vendor (Create or Update)
  const handleSaveVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setIsSaving(true);

    try {
      const url = editingVendor ? `/api/vendors/${editingVendor.id}` : "/api/vendors";
      const method = editingVendor ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setModalError(data.error || "Failed to save vendor.");
        setIsSaving(false);
        return;
      }

      setIsModalOpen(false);
      fetchVendors();
      fetchRankings();
    } catch {
      setModalError("Network error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle Active/Inactive
  const handleToggleActive = async (v: any) => {
    try {
      await fetch(`/api/vendors/${v.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !v.isActive }),
      });
      fetchVendors();
      fetchRankings();
    } catch (e) {
      console.error(e);
    }
  };

  const isProcurementOrAdmin =
    currentUser?.role === "ADMIN" || currentUser?.role === "PROCUREMENT";

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[var(--border-soft)]">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--text)]">
            Vendor Performance
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">
            Total Score = 60% Technical + 40% Non-technical. Minimum 70% threshold for eligibility.
          </p>
        </div>

        {activeTab === "master" && isProcurementOrAdmin && (
          <Button variant="primary" size="sm" onClick={handleOpenAdd} className="text-xs h-8">
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add Vendor
          </Button>
        )}
      </div>

      {/* 2. Segmented Tabs (Ranking & Vendor Master) */}
      <div className="inline-flex p-1 rounded-[var(--r-md)] bg-[var(--bg-subtle)] border border-[var(--border)]">
        <button
          onClick={() => setActiveTab("ranking")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-[var(--r-sm)] text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "ranking"
              ? "bg-white text-[var(--text)] shadow-xs border border-[var(--border)]"
              : "text-[var(--text-muted)] hover:text-[var(--text)]"
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Ranking</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[var(--bg-active)]">
            {rankings.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("master")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-[var(--r-sm)] text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "master"
              ? "bg-white text-[var(--text)] shadow-xs border border-[var(--border)]"
              : "text-[var(--text-muted)] hover:text-[var(--text)]"
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Vendor Master</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[var(--bg-active)]">
            {vendors.length}
          </span>
        </button>
      </div>

      {/* TAB 1: RANKING */}
      {activeTab === "ranking" && (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--bg-sidebar)] border-b border-[var(--border)] text-[var(--text-muted)] font-medium">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4">Vendor Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-center">Reviews</th>
                  <th className="py-3 px-4 text-right">Technical (60%)</th>
                  <th className="py-3 px-4 text-right">Non-Technical (40%)</th>
                  <th className="py-3 px-4 text-right font-bold">Total</th>
                  <th className="py-3 px-4 text-center">Eligibility</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-soft)]">
                {rankingsLoading ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-[var(--text-muted)]">
                      Loading rankings...
                    </td>
                  </tr>
                ) : rankings.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-[var(--text-muted)]">
                      No vendor reviews yet.
                    </td>
                  </tr>
                ) : (
                  rankings.map((r, idx) => (
                    <tr key={r.id} className="hover:bg-[var(--hover)] transition-colors">
                      <td className="py-3 px-4 text-center font-mono text-[var(--text-muted)]">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4 font-semibold text-[var(--text)]">
                        {r.name}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[11px] bg-[var(--bg-subtle)] border border-[var(--border-soft)] text-[var(--text-muted)] font-mono">
                          {r.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-[var(--text-muted)]">
                        {r.reviewsCount} review{r.reviewsCount > 1 ? "s" : ""}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[var(--text)]">
                        {r.technicalScore !== null ? `${r.technicalScore}` : "—"}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[var(--text)]">
                        {r.nonTechnicalScore !== null ? `${r.nonTechnicalScore}` : "—"}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-[var(--text)]">
                        {r.totalScore !== null ? `${r.totalScore}%` : "—"}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {r.eligibility === "ELIGIBLE" && (
                          <Badge variant="success">Eligible</Badge>
                        )}
                        {r.eligibility === "NOT_ELIGIBLE" && (
                          <Badge variant="danger">Not eligible</Badge>
                        )}
                        {r.eligibility === "NOT_RATED" && (
                          <Badge variant="neutral">Not rated yet</Badge>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 2: VENDOR MASTER */}
      {activeTab === "master" && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Search vendor name, contact, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchVendors()}
                  className="w-full h-9 pl-9 pr-3 text-xs rounded-[var(--r-md)] border border-[var(--border)] bg-white placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--text)] transition-colors"
                />
              </div>
              <Button variant="secondary" size="sm" onClick={fetchVendors} className="h-9 px-3">
                <Search className="w-3.5 h-3.5" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setTimeout(fetchVendors, 100);
                }}
                className="h-9 px-3 text-xs rounded-[var(--r-md)] border border-[var(--border)] bg-white text-[var(--text)] focus:outline-none focus:border-[var(--text)]"
              >
                <option value="ALL">All Categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Vendors Table */}
          <Card className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--bg-sidebar)] border-b border-[var(--border)] text-[var(--text-muted)] font-medium">
                  <tr>
                    <th className="py-3 px-4">Vendor Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Contact Person</th>
                    <th className="py-3 px-4">Phone</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    {isProcurementOrAdmin && (
                      <th className="py-3 px-4 text-right">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-soft)]">
                  {masterLoading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-[var(--text-muted)]">
                        Loading vendors...
                      </td>
                    </tr>
                  ) : vendors.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-[var(--text-muted)]">
                        No vendors found matching your filter.
                      </td>
                    </tr>
                  ) : (
                    vendors.map((v) => (
                      <tr key={v.id} className="hover:bg-[var(--hover)] transition-colors">
                        <td className="py-3 px-4 font-semibold text-[var(--text)]">
                          {v.name}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[11px] bg-[var(--bg-subtle)] border border-[var(--border-soft)] text-[var(--text-muted)] font-mono">
                            {v.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[var(--text-muted)]">
                          {v.contactName || "—"}
                        </td>
                        <td className="py-3 px-4 font-mono text-[var(--text)]">
                          {v.phone || "—"}
                        </td>
                        <td className="py-3 px-4 text-[var(--text-muted)]">
                          {v.email || "—"}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {v.isActive ? (
                            <Badge variant="success" size="sm">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="neutral" size="sm">
                              Inactive
                            </Badge>
                          )}
                        </td>
                        {isProcurementOrAdmin && (
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleOpenEdit(v)}
                                className="h-7 px-2 text-[11px]"
                                title="Edit Vendor"
                              >
                                <Edit2 className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleToggleActive(v)}
                                className={`h-7 px-2 text-[11px] ${
                                  v.isActive ? "hover:text-[var(--danger)]" : "text-[var(--success)]"
                                }`}
                                title={v.isActive ? "Deactivate" : "Activate"}
                              >
                                <Power className="w-3 h-3" />
                              </Button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* MODAL: ADD / EDIT VENDOR */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-[var(--r-lg)] border border-[var(--border)] w-full max-w-md shadow-2xl p-6 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text)]"
            >
              <X className="w-4 h-4" />
            </button>

            <h2 className="text-base font-bold text-[var(--text)] mb-1">
              {editingVendor ? "Edit Vendor" : "Add New Vendor"}
            </h2>
            <p className="text-xs text-[var(--text-muted)] mb-4">
              Enter vendor details for procurement catalog and project assignment.
            </p>

            {modalError && (
              <div className="mb-4 p-2.5 rounded-[var(--r-md)] bg-[var(--danger-bg)] border border-[#F8B4B4] text-[var(--danger)] text-xs flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveVendor} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-[var(--text)] mb-1">
                  Vendor Name *
                </label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. PT Mandiri Solusi Teknik"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text)] mb-1">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full h-10 px-3 text-sm rounded-[var(--r-md)] border border-[var(--border)] bg-white text-[var(--text)] focus:outline-none focus:border-[var(--text)]"
                  required
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text)] mb-1">
                  Contact Person
                </label>
                <Input
                  type="text"
                  value={formData.contactName}
                  onChange={(e) =>
                    setFormData({ ...formData, contactName: e.target.value })
                  }
                  placeholder="e.g. Budi Santoso"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text)] mb-1">
                  Phone Number
                </label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g. 08123456789"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text)] mb-1">
                  Email
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. contact@vendor.com"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-soft)]">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={isSaving}>
                  {editingVendor ? "Save Changes" : "Create Vendor"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
