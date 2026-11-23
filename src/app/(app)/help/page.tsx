"use client";

import * as React from "react";
import Link from "next/link";
import {
  BookOpen,
  Search,
  CheckCircle,
  HelpCircle,
  Calendar,
  Award,
  ShieldCheck,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  FileText,
  Download,
  PhoneCall,
  Mail,
  Send,
  Check,
  Eye,
  Minus,
  Sparkles,
  Server,
  Layers,
  Clock,
  AlertCircle,
  CheckSquare,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface FaqItem {
  id: string;
  category: "lifecycle" | "working-days" | "vendor" | "termin" | "security";
  code: string;
  question: string;
  answerText: string;
  points?: string[];
  note?: string;
  badge?: string;
}

const FAQ_DATA: FaqItem[] = [
  {
    id: "faq-1",
    category: "lifecycle",
    code: "01",
    question: "Bagaimana cara memperbarui dan mengirim progres fisik proyek? (Submit Progress Update)",
    answerText: "Pembaruan progres fisik pekerjaan di lapangan mengikuti aturan verifikasi 3-tier (Tiga Tingkat) untuk menjaga integritas data:",
    points: [
      "Progress Slider & Nilai Aktual: Buka modul Proyek Lapangan (atau menu My Tasks) > Pilih proyek terkait > Geser slider persentase atau masukkan angka realisasi fisik di lapangan.",
      "Checklist Detail Item BoQ: Centang dan isi progres tiap mata pembayaran / item pekerjaan sesuai Bill of Quantities (BoQ) yang disetujui. Sistem secara otomatis menghitung agregat bobot.",
      "Status DRAFT vs FINAL: Perubahan progres berstatus DRAFT tidak akan memicu review termin keuangan. Klik 'Submit for Verification' untuk mengirimkan dokumen ke Lead Project Engineer & QS.",
    ],
    note: "Pemberitahuan: Unggahan bukti foto dokumentasi lapangan dengan timestamp/lokasi wajib dilampirkan untuk klaim kenaikan progres di atas 20% dalam satu siklus verifikasi.",
    badge: "SOP-01 / BR-09",
  },
  {
    id: "faq-2",
    category: "working-days",
    code: "02",
    question: "Apa yang terjadi jika proyek melewati target tanggal selesai? (Overdue SLA)",
    answerText: "Ketika progres fisik proyek belum mencapai 100% dan melewati pukul 23:59 WIB pada Tanggal Target Selesai, mesin penjadwalan FacilityOS otomatis menjalankan 3 protokol eskalasi:",
    points: [
      "Peralihan Status Otomatis: Status badge proyek seketika beralih dari 'In Progress' menjadi 'Overdue' dengan highlight merah.",
      "Broadcast Eskalasi: Notifikasi prioritas tinggi dikirimkan melalui Inbox sistem ke PIC Pelaksana, Kepala Departemen, dan Operations Lead.",
      "Pencatatan Denda Keterlambatan (Liquidated Damages): Sistem mengaktifkan log kalkulator denda kontraktual (standar 1‰ per hari kalender keterlambatan) yang akan otomatis dipotongkan pada pembayaran Termin Pelunasan.",
    ],
    note: "Perpanjangan waktu hanya dapat disetujui melalui addendum kontrak resmi yang disahkan oleh Kepala Divisi Pengadaan & Fasilitas.",
    badge: "REF-04 / BR-01",
  },
  {
    id: "faq-3",
    category: "vendor",
    code: "03",
    question: "Bagaimana formula penentuan kelayakan vendor untuk tender pengadaan?",
    answerText: "Semua calon rekanan dan kontraktor harus melalui evaluasi matriks berbobot ganda sebelum berhak ditunjuk sebagai pemenang tender (PO):",
    points: [
      "Evaluasi Teknis (Bobot 60%): Meliputi ketersediaan peralatan kerja, sertifikasi personel K3/HSE, rekam jejak penyelesaian proyek sebelumnya, dan komitmen jadwal pelaksanaan.",
      "Evaluasi Non-Teknis / Komersial (Bobot 40%): Meliputi kewajaran harga penawaran terhadap OE (Owner Estimate), rasio kesehatan finansial perusahaan, kelengkapan legalitas (NIB, SIUJK, NPWP), dan masa garansi purnajual.",
    ],
    note: "Ambang batas kelulusan mutlak adalah skor minimal 70.0 / 100.0. Rekanan dengan skor di bawah 70.0 otomatis didiskualifikasi dari penetapan PO.",
    badge: "MTR-09 / BR-05",
  },
  {
    id: "faq-4",
    category: "termin",
    code: "04",
    question: "Bagaimana mekanisme pencatatan dan pencairan pembayaran bertahap (Termin)?",
    answerText: "Pencairan dana proyek dilakukan bertahap sesuai capaian milestone fisik terverifikasi. Sistem mengunci pencairan lompat tahap:",
    points: [
      "Uang Muka / Down Payment (DP): Maksimal 20% dari nilai kontrak total, dengan syarat jaminan uang muka bank (Bank Guarantee) telah terverifikasi legalitasnya.",
      "Termin 1 (Milestone Struktur): Cair apabila progres fisik minimal telah mencapai 50% yang disahkan oleh Berita Acara Progres Lapangan dari Konsultan/Engineer Pengawas.",
      "Termin Pelunasan (Final Payment): 100% pekerjaan selesai fisik, dipotong retensi pemeliharaan 5% (pembayaran setelah terbit BAST-1). Retensi 5% dicairkan setelah masa pemeliharaan berakhir dan terbit BAST-2.",
    ],
    note: "Setiap pengajuan termin wajib melampirkan invoice resmi, kwitansi bermaterai, dan rekonsiliasi checklist BoQ.",
    badge: "FIN-03",
  },
  {
    id: "faq-5",
    category: "security",
    code: "05",
    question: "Bagaimana prosedur permohonan reset kata sandi atau penyesuaian hak akses akun?",
    answerText: "Untuk menjaga standar keamanan tata kelola ISO 27001 dan audit kepatuhan korporat:",
    points: [
      "Fitur swalayan (self-service reset) dinonaktifkan secara terpusat untuk akun lokal guna mencegah pengambilalihan akun sensitif.",
      "Kirimkan tiket permohonan resmi dengan mencantumkan Nomor Induk Pegawai (NIP), departemen, dan justifikasi melalui kartu 'Helpdesk & Eskalasi' di panel sebelah kanan.",
      "Untuk kebutuhan mendesak di jam operasional kantor (08:00 - 17:00 WIB), hubungi administrator melalui telepon internal Ext 204.",
    ],
    note: "Akun dengan role ADMIN, PROCUREMENT, dan ENGINEERING memiliki jejak audit log permanen untuk setiap transaksi persetujuan.",
    badge: "SEC-02",
  },
];

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<string>("all");
  const [expandedFaqs, setExpandedFaqs] = React.useState<Record<string, boolean>>({
    "faq-1": true,
    "faq-2": true,
  });
  const [ticketModalOpen, setTicketModalOpen] = React.useState(false);
  const [ticketSubject, setTicketSubject] = React.useState("");
  const [ticketBody, setTicketBody] = React.useState("");
  const [ticketSubmitted, setTicketSubmitted] = React.useState(false);

  // Toggle single FAQ
  const toggleFaq = (id: string) => {
    setExpandedFaqs((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Toggle Expand All / Collapse All
  const allExpanded = FAQ_DATA.every((f) => expandedFaqs[f.id]);
  const handleToggleAll = () => {
    const nextState = !allExpanded;
    const update: Record<string, boolean> = {};
    FAQ_DATA.forEach((f) => {
      update[f.id] = nextState;
    });
    setExpandedFaqs(update);
  };

  // Filter FAQs based on category and search query
  const filteredFaqs = React.useMemo(() => {
    return FAQ_DATA.filter((faq) => {
      const matchesCategory = selectedCategory === "all" || faq.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesCategory;

      const matchesQuery =
        faq.question.toLowerCase().includes(q) ||
        faq.answerText.toLowerCase().includes(q) ||
        faq.code.toLowerCase().includes(q) ||
        (faq.points && faq.points.some((p) => p.toLowerCase().includes(q))) ||
        (faq.note && faq.note.toLowerCase().includes(q));

      return matchesCategory && matchesQuery;
    });
  }, [searchQuery, selectedCategory]);

  // Handle mock download
  const handleDownloadTemplate = (filename: string, content: string) => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Handle mock support ticket submit
  const handleSendTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject || !ticketBody) return;
    setTicketSubmitted(true);
    setTimeout(() => {
      setTicketSubmitted(false);
      setTicketModalOpen(false);
      setTicketSubject("");
      setTicketBody("");
      alert("Tiket bantuan berhasil dikirim ke Lead System Administrator (Siti Rahma). Nomor referensi: TKT-" + Math.floor(100000 + Math.random() * 900000));
    }, 800);
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-[1440px] mx-auto">
      {/* 1. Header & Quick Search Bar */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2 border-b border-[var(--border)]">
        <div className="flex flex-col gap-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-[#111113] text-white">
              <BookOpen className="w-3.5 h-3.5" />
            </span>
            <span className="text-[11px] font-bold tracking-wider text-[var(--text-muted)] uppercase">
              Documentation &amp; Knowledge Base
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--text)] tracking-tight">
            Help Center &amp; Operational SOP
          </h1>
          <p className="text-sm text-[var(--text-muted)] leading-relaxed">
            Panduan operasional standar (SOP), aturan formula hari kerja &amp; denda, pembobotan kelayakan vendor, matriks hak akses per role, formulir template, serta kontak bantuan teknis Facility Management.
          </p>
        </div>

        {/* Global Search Input */}
        <div className="w-full lg:w-96 flex flex-col gap-2">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari SOP, kode error, formula hari kerja, termin..."
              className="pl-9 pr-12 h-10 bg-white border-[var(--border)] text-sm shadow-sm focus-visible:ring-1 focus-visible:ring-[#111113]"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-[var(--bg-active)] text-[10px] font-mono text-[var(--text-muted)] border border-[var(--border)]">
              Ctrl+K
            </kbd>
          </div>
          <div className="flex items-center justify-between px-1 text-xs text-[var(--text-muted)]">
            <span>KB Versi 1.1 • Updated Today</span>
            <span className="inline-flex items-center gap-1.5 text-emerald-700 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Sistem Aktif
            </span>
          </div>
        </div>
      </div>

      {/* 2. Quick Access Bento Cards (4 Key SOP Modules) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: End-to-End Lifecycle */}
        <div
          onClick={() => {
            setSelectedCategory("lifecycle");
            const el = document.getElementById("faq-section");
            el?.scrollIntoView({ behavior: "smooth" });
          }}
          className="group relative flex flex-col justify-between p-5 rounded-xl bg-white border border-[var(--border)] hover:border-[#111113] hover:shadow-md transition-all cursor-pointer"
        >
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-lg bg-[var(--bg-active)] flex items-center justify-center text-[var(--text)] group-hover:bg-[#111113] group-hover:text-white transition-colors">
                <Layers className="w-5 h-5" />
              </div>
              <Badge variant="neutral" className="text-[11px] font-bold bg-[#F4F4F5] text-[var(--text)] border-none">
                SOP-01
              </Badge>
            </div>
            <div>
              <h3 className="text-base font-semibold text-[var(--text)] mb-1 group-hover:text-[#111113] transition-colors">
                Alur Siklus Proyek (PPC s/d BAST)
              </h3>
              <p className="text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                Standar operasional tahapan proyek dari pengajuan kebutuhan pemohon, evaluasi engineering, tender PO, hingga serah terima garansi.
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[var(--border-soft)] flex items-center justify-between text-xs text-[var(--text-secondary)] font-medium">
            <span>6 Tahap Tata Kelola</span>
            <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 2: Working Days & Formula Guide */}
        <div
          onClick={() => {
            setSelectedCategory("working-days");
            const el = document.getElementById("faq-section");
            el?.scrollIntoView({ behavior: "smooth" });
          }}
          className="group relative flex flex-col justify-between p-5 rounded-xl bg-white border border-[var(--border)] hover:border-[#111113] hover:shadow-md transition-all cursor-pointer"
        >
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-lg bg-[var(--bg-active)] flex items-center justify-center text-[var(--text)] group-hover:bg-[#111113] group-hover:text-white transition-colors">
                <Calendar className="w-5 h-5" />
              </div>
              <Badge variant="neutral" className="text-[11px] font-bold bg-[#F4F4F5] text-[var(--text)] border-none">
                REF-04
              </Badge>
            </div>
            <div>
              <h3 className="text-base font-semibold text-[var(--text)] mb-1 group-hover:text-[#111113] transition-colors">
                Panduan Hari Kerja &amp; SLA
              </h3>
              <p className="text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                Matriks kalkulasi hari kerja engineering: pengecualian Sabtu-Minggu, libur nasional SKB 3 Menteri, dan batas cut-off 23:59 WIB.
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[var(--border-soft)] flex items-center justify-between text-xs text-[var(--text-secondary)] font-medium">
            <span>Algorithmic SLA (BR-01)</span>
            <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 3: Vendor Scoring & Evaluation */}
        <div
          onClick={() => {
            setSelectedCategory("vendor");
            const el = document.getElementById("faq-section");
            el?.scrollIntoView({ behavior: "smooth" });
          }}
          className="group relative flex flex-col justify-between p-5 rounded-xl bg-white border border-[var(--border)] hover:border-[#111113] hover:shadow-md transition-all cursor-pointer"
        >
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-lg bg-[var(--bg-active)] flex items-center justify-center text-[var(--text)] group-hover:bg-[#111113] group-hover:text-white transition-colors">
                <Award className="w-5 h-5" />
              </div>
              <Badge variant="neutral" className="text-[11px] font-bold bg-[#F4F4F5] text-[var(--text)] border-none">
                MTR-09
              </Badge>
            </div>
            <div>
              <h3 className="text-base font-semibold text-[var(--text)] mb-1 group-hover:text-[#111113] transition-colors">
                Evaluasi &amp; Scoring Rekanan
              </h3>
              <p className="text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                Rubrik evaluasi berbobot 60% Teknis (peralatan, HSE, pengalaman) + 40% Non-Teknis (harga, legalitas). Syarat ambang kelulusan ≥ 70.0.
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[var(--border-soft)] flex items-center justify-between text-xs text-[var(--text-secondary)] font-medium">
            <span>Weighted Matrix (BR-05)</span>
            <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 4: Role-Based Access (RBAC) */}
        <div
          onClick={() => {
            const el = document.getElementById("rbac-section");
            el?.scrollIntoView({ behavior: "smooth" });
          }}
          className="group relative flex flex-col justify-between p-5 rounded-xl bg-white border border-[var(--border)] hover:border-[#111113] hover:shadow-md transition-all cursor-pointer"
        >
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-lg bg-[var(--bg-active)] flex items-center justify-center text-[var(--text)] group-hover:bg-[#111113] group-hover:text-white transition-colors">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <Badge variant="neutral" className="text-[11px] font-bold bg-[#F4F4F5] text-[var(--text)] border-none">
                SEC-02
              </Badge>
            </div>
            <div>
              <h3 className="text-base font-semibold text-[var(--text)] mb-1 group-hover:text-[#111113] transition-colors">
                Hak Akses &amp; Otoritas (RBAC)
              </h3>
              <p className="text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                Pembagian wewenang lintas peran: User Pemohon (PPC), Engineering, Procurement, Pengawas Lapangan, dan Administrator.
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[var(--border-soft)] flex items-center justify-between text-xs text-[var(--text-secondary)] font-medium">
            <span>5 Authority Levels</span>
            <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* 3. Main Content Split: Left (Blueprint & FAQs & RBAC Table) | Right (Support & Docs) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN (8 cols) */}
        <div className="lg:col-span-8 space-y-8">
          {/* Blueprint Visual Diagram */}
          <Card className="border-[var(--border)] shadow-sm bg-white overflow-hidden">
            <CardHeader className="pb-3 border-b border-[var(--border-soft)]">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Standard Operating Blueprint
                  </span>
                  <CardTitle className="text-base font-semibold text-[var(--text)] mt-0.5">
                    Alur Kerja Terpadu (Facility Project Lifecycle)
                  </CardTitle>
                </div>
                <Badge variant="success" className="bg-emerald-50 text-emerald-800 border-emerald-200 text-xs font-medium">
                  Live Protocol v1.1
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-xs text-[var(--text-muted)] mb-4 leading-relaxed">
                Setiap proyek fasilitas gedung dan mesin utilitas wajib melalui 5 tahapan sekuensial di bawah ini tanpa melompati proses verifikasi:
              </p>

              {/* Graphic Flow Stepper */}
              <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-soft)] overflow-x-auto">
                <div className="min-w-[620px] flex items-center justify-between gap-2">
                  {/* Step 1 */}
                  <div className="flex-1 bg-white border border-[var(--border)] rounded-lg p-3 text-center shadow-xs">
                    <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                      Fase 1
                    </span>
                    <h4 className="text-xs font-semibold text-[var(--text)] mt-1.5">PPC Request</h4>
                    <p className="text-[10px] text-[var(--text-muted)]">Pengajuan Kebutuhan</p>
                  </div>

                  <ArrowRight className="w-4 h-4 text-[var(--text-faint)] shrink-0" />

                  {/* Step 2 */}
                  <div className="flex-1 bg-white border border-[var(--border)] rounded-lg p-3 text-center shadow-xs">
                    <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      Fase 2
                    </span>
                    <h4 className="text-xs font-semibold text-[var(--text)] mt-1.5">Engineering</h4>
                    <p className="text-[10px] text-[var(--text-muted)]">BoQ &amp; Estimasi Hari</p>
                  </div>

                  <ArrowRight className="w-4 h-4 text-[var(--text-faint)] shrink-0" />

                  {/* Step 3 */}
                  <div className="flex-1 bg-white border border-[var(--border)] rounded-lg p-3 text-center shadow-xs">
                    <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                      Fase 3
                    </span>
                    <h4 className="text-xs font-semibold text-[var(--text)] mt-1.5">Procurement</h4>
                    <p className="text-[10px] text-[var(--text-muted)]">Tender &amp; Score ≥ 70</p>
                  </div>

                  <ArrowRight className="w-4 h-4 text-[var(--text-faint)] shrink-0" />

                  {/* Step 4 */}
                  <div className="flex-1 bg-white border border-[var(--border)] rounded-lg p-3 text-center shadow-xs">
                    <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                      Fase 4
                    </span>
                    <h4 className="text-xs font-semibold text-[var(--text)] mt-1.5">Execution</h4>
                    <p className="text-[10px] text-[var(--text-muted)]">Kurva-S &amp; Termin</p>
                  </div>

                  <ArrowRight className="w-4 h-4 text-[var(--text-faint)] shrink-0" />

                  {/* Step 5 */}
                  <div className="flex-1 bg-[#111113] text-white border border-[#111113] rounded-lg p-3 text-center shadow-xs">
                    <span className="text-[11px] font-bold text-emerald-300 bg-white/10 px-2 py-0.5 rounded">
                      Fase 5
                    </span>
                    <h4 className="text-xs font-semibold text-white mt-1.5">BAST Handover</h4>
                    <p className="text-[10px] text-white/70">Serah Terima &amp; Garansi</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Interactive FAQ Section */}
          <div id="faq-section" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[var(--text)]" />
                <h2 className="text-lg font-bold text-[var(--text)]">
                  Pertanyaan Sering Ditanyakan &amp; Protokol Detail (FAQ)
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleAll}
                  className="text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text)] underline underline-offset-4 cursor-pointer"
                >
                  {allExpanded ? "Tutup Semua" : "Buka Semua"}
                </button>
              </div>
            </div>

            {/* Category Filter Chips */}
            <div className="flex flex-wrap gap-1.5 pb-2">
              {[
                { id: "all", label: "Semua Kategori" },
                { id: "lifecycle", label: "Siklus Proyek (SOP-01)" },
                { id: "working-days", label: "Hari Kerja & SLA (REF-04)" },
                { id: "vendor", label: "Scoring Vendor (MTR-09)" },
                { id: "termin", label: "Termin Pembayaran" },
                { id: "security", label: "Keamanan & Akun (SEC-02)" },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1 text-xs rounded-full border transition-colors cursor-pointer ${
                    selectedCategory === cat.id
                      ? "bg-[#111113] text-white border-[#111113] font-medium"
                      : "bg-white text-[var(--text-secondary)] border-[var(--border)] hover:bg-[var(--bg-active)]"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Accordion Items */}
            {filteredFaqs.length === 0 ? (
              <div className="p-8 text-center bg-white border border-[var(--border)] rounded-xl">
                <Search className="w-8 h-8 text-[var(--text-faint)] mx-auto mb-2" />
                <p className="text-sm font-medium text-[var(--text)]">Tidak ditemukan panduan yang sesuai</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Coba gunakan kata kunci lain atau pilih &apos;Semua Kategori&apos;.
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("all");
                  }}
                  className="mt-4"
                >
                  Reset Pencarian
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredFaqs.map((faq) => {
                  const isOpen = !!expandedFaqs[faq.id];
                  return (
                    <div
                      key={faq.id}
                      className={`border rounded-xl bg-white transition-all overflow-hidden shadow-xs ${
                        isOpen ? "border-[var(--border-hover)] bg-white" : "border-[var(--border)]"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleFaq(faq.id)}
                        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-[var(--bg-active)] transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3 pr-2">
                          <span className="w-6 h-6 rounded bg-[var(--bg-active)] flex items-center justify-center text-[var(--text-muted)] font-mono text-[11px] font-bold shrink-0">
                            {faq.code}
                          </span>
                          <span className="text-sm font-semibold text-[var(--text)] leading-snug">
                            {faq.question}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {faq.badge && (
                            <span className="hidden sm:inline-block text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-[var(--bg-subtle)] text-[var(--text-muted)]">
                              {faq.badge}
                            </span>
                          )}
                          {isOpen ? (
                            <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
                          )}
                        </div>
                      </button>

                      {isOpen && (
                        <div className="px-5 pb-5 pt-2 border-t border-[var(--border-soft)] text-sm text-[var(--text-secondary)] space-y-3">
                          <p className="leading-relaxed">{faq.answerText}</p>
                          {faq.points && (
                            <ul className="space-y-2 pl-4 list-disc text-xs leading-relaxed text-[var(--text-secondary)]">
                              {faq.points.map((pt, idx) => (
                                <li key={idx}>
                                  <span>{pt}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                          {faq.note && (
                            <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-lg text-xs text-amber-900 flex items-start gap-2.5">
                              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                              <span className="leading-relaxed">{faq.note}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RBAC Permission Matrix Section */}
          <div id="rbac-section" className="space-y-4 pt-2">
            <Card className="border-[var(--border)] shadow-sm bg-white overflow-hidden">
              <CardHeader className="pb-3 border-b border-[var(--border-soft)]">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      Security &amp; Governance
                    </span>
                    <CardTitle className="text-base font-semibold text-[var(--text)] mt-0.5">
                      Role-Based Access Matrix (RBAC)
                    </CardTitle>
                  </div>
                  <Badge variant="neutral" className="text-xs bg-[#F4F4F5] text-[var(--text)] border-none">
                    5 Peran Otoritas
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[var(--border)] bg-[var(--bg-subtle)] text-[var(--text-secondary)] font-semibold">
                        <th className="py-3 px-4">Modul &amp; Fungsi Sistem</th>
                        <th className="py-3 px-3 text-center">PPC</th>
                        <th className="py-3 px-3 text-center">Engineering</th>
                        <th className="py-3 px-3 text-center">Procurement</th>
                        <th className="py-3 px-3 text-center">Project Site</th>
                        <th className="py-3 px-3 text-center">Admin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-soft)]">
                      <tr className="hover:bg-[var(--bg-active)] transition-colors">
                        <td className="py-3 px-4 font-medium text-[var(--text)]">PPC Request Creation</td>
                        <td className="py-3 px-3 text-center">
                          <CheckCircle className="w-4 h-4 text-emerald-600 mx-auto" />
                        </td>
                        <td className="py-3 px-3 text-center">
                          <Minus className="w-4 h-4 text-[var(--text-faint)] mx-auto" />
                        </td>
                        <td className="py-3 px-3 text-center">
                          <Minus className="w-4 h-4 text-[var(--text-faint)] mx-auto" />
                        </td>
                        <td className="py-3 px-3 text-center">
                          <Minus className="w-4 h-4 text-[var(--text-faint)] mx-auto" />
                        </td>
                        <td className="py-3 px-3 text-center">
                          <CheckCircle className="w-4 h-4 text-emerald-600 mx-auto" />
                        </td>
                      </tr>
                      <tr className="hover:bg-[var(--bg-active)] transition-colors">
                        <td className="py-3 px-4 font-medium text-[var(--text)]">BoQ &amp; Technical Drawing</td>
                        <td className="py-3 px-3 text-center">
                          <Eye className="w-4 h-4 text-[var(--text-muted)] mx-auto" />
                        </td>
                        <td className="py-3 px-3 text-center">
                          <CheckCircle className="w-4 h-4 text-emerald-600 mx-auto" />
                        </td>
                        <td className="py-3 px-3 text-center">
                          <Eye className="w-4 h-4 text-[var(--text-muted)] mx-auto" />
                        </td>
                        <td className="py-3 px-3 text-center">
                          <Eye className="w-4 h-4 text-[var(--text-muted)] mx-auto" />
                        </td>
                        <td className="py-3 px-3 text-center">
                          <CheckCircle className="w-4 h-4 text-emerald-600 mx-auto" />
                        </td>
                      </tr>
                      <tr className="hover:bg-[var(--bg-active)] transition-colors">
                        <td className="py-3 px-4 font-medium text-[var(--text)]">Vendor Scoring &amp; PO Issuance</td>
                        <td className="py-3 px-3 text-center">
                          <Minus className="w-4 h-4 text-[var(--text-faint)] mx-auto" />
                        </td>
                        <td className="py-3 px-3 text-center">
                          <Eye className="w-4 h-4 text-[var(--text-muted)] mx-auto" />
                        </td>
                        <td className="py-3 px-3 text-center">
                          <CheckCircle className="w-4 h-4 text-emerald-600 mx-auto" />
                        </td>
                        <td className="py-3 px-3 text-center">
                          <Minus className="w-4 h-4 text-[var(--text-faint)] mx-auto" />
                        </td>
                        <td className="py-3 px-3 text-center">
                          <CheckCircle className="w-4 h-4 text-emerald-600 mx-auto" />
                        </td>
                      </tr>
                      <tr className="hover:bg-[var(--bg-active)] transition-colors">
                        <td className="py-3 px-4 font-medium text-[var(--text)]">Progress S-Curve &amp; Site Log</td>
                        <td className="py-3 px-3 text-center">
                          <Eye className="w-4 h-4 text-[var(--text-muted)] mx-auto" />
                        </td>
                        <td className="py-3 px-3 text-center">
                          <Eye className="w-4 h-4 text-[var(--text-muted)] mx-auto" />
                        </td>
                        <td className="py-3 px-3 text-center">
                          <Eye className="w-4 h-4 text-[var(--text-muted)] mx-auto" />
                        </td>
                        <td className="py-3 px-3 text-center">
                          <CheckCircle className="w-4 h-4 text-emerald-600 mx-auto" />
                        </td>
                        <td className="py-3 px-3 text-center">
                          <CheckCircle className="w-4 h-4 text-emerald-600 mx-auto" />
                        </td>
                      </tr>
                      <tr className="hover:bg-[var(--bg-active)] transition-colors">
                        <td className="py-3 px-4 font-medium text-[var(--text)]">BAST &amp; Warranty Handover</td>
                        <td className="py-3 px-3 text-center">
                          <CheckCircle className="w-4 h-4 text-emerald-600 mx-auto" />
                        </td>
                        <td className="py-3 px-3 text-center">
                          <CheckCircle className="w-4 h-4 text-emerald-600 mx-auto" />
                        </td>
                        <td className="py-3 px-3 text-center">
                          <Eye className="w-4 h-4 text-[var(--text-muted)] mx-auto" />
                        </td>
                        <td className="py-3 px-3 text-center">
                          <CheckCircle className="w-4 h-4 text-emerald-600 mx-auto" />
                        </td>
                        <td className="py-3 px-3 text-center">
                          <CheckCircle className="w-4 h-4 text-emerald-600 mx-auto" />
                        </td>
                      </tr>
                      <tr className="hover:bg-[var(--bg-active)] transition-colors">
                        <td className="py-3 px-4 font-medium text-[var(--text)]">User Admin &amp; Audit Logs</td>
                        <td className="py-3 px-3 text-center">
                          <Minus className="w-4 h-4 text-[var(--text-faint)] mx-auto" />
                        </td>
                        <td className="py-3 px-3 text-center">
                          <Minus className="w-4 h-4 text-[var(--text-faint)] mx-auto" />
                        </td>
                        <td className="py-3 px-3 text-center">
                          <Minus className="w-4 h-4 text-[var(--text-faint)] mx-auto" />
                        </td>
                        <td className="py-3 px-3 text-center">
                          <Minus className="w-4 h-4 text-[var(--text-faint)] mx-auto" />
                        </td>
                        <td className="py-3 px-3 text-center">
                          <CheckCircle className="w-4 h-4 text-emerald-600 mx-auto" />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="p-3 bg-[var(--bg-subtle)] border-t border-[var(--border-soft)] flex items-center justify-between text-xs text-[var(--text-muted)]">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Full Access / Sign-off
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-[var(--text-muted)]" /> View Only
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Minus className="w-3.5 h-3.5 text-[var(--text-faint)]" /> No Access
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* RIGHT COLUMN (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Support / Helpdesk Card */}
          <Card className="border-[var(--border)] shadow-sm bg-white">
            <CardHeader className="pb-3 border-b border-[var(--border-soft)]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Helpdesk &amp; Eskalasi
                </span>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-medium border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  On Duty
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-[#111113] text-white flex items-center justify-center font-bold text-sm shrink-0">
                  SR
                </div>
                <div className="flex flex-col min-w-0">
                  <h4 className="text-sm font-semibold text-[var(--text)] truncate">
                    Siti Rahma
                  </h4>
                  <p className="text-xs text-[var(--text-muted)]">Lead System Administrator</p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[var(--bg-subtle)] font-mono text-[11px]">
                      <PhoneCall className="w-3 h-3" /> Ext 204
                    </span>
                    <span className="text-[10px] text-[var(--text-faint)]">08:00 - 17:00 WIB</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <a
                  href="mailto:admin@facility.corp?subject=FacilityOS%20Support%20Request"
                  className="w-full h-9 rounded-lg bg-[#111113] hover:bg-[#27272A] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5" />
                  admin@facility.corp
                </a>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setTicketModalOpen(true)}
                  className="w-full h-9 text-xs font-medium border-[var(--border)] hover:bg-[var(--bg-active)]"
                >
                  Kirim Tiket Bantuan Internal
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Infrastructure Health Card */}
          <Card className="border-[var(--border)] shadow-sm bg-white">
            <CardHeader className="pb-3 border-b border-[var(--border-soft)]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Status Lingkungan Sistem
                </span>
                <Server className="w-4 h-4 text-[var(--text-muted)]" />
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              <div className="flex flex-col divide-y divide-[var(--border-soft)] text-xs">
                <div className="flex items-center justify-between py-2">
                  <span className="text-[var(--text-muted)]">Aplikasi Build</span>
                  <span className="font-semibold text-[var(--text)]">FacilityOS v1.1.4</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-[var(--text-muted)]">Database Engine</span>
                  <span className="font-semibold text-[var(--text)]">MySQL 8.4 LTS</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-[var(--text-muted)]">App Runtime</span>
                  <span className="font-semibold text-[var(--text)]">Next.js 15 App Router</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-[var(--text-muted)]">Koneksi Database</span>
                  <span className="font-mono text-emerald-700 font-semibold">127.0.0.1:3306 (Active)</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-[var(--text-muted)]">Zona Waktu</span>
                  <span className="font-medium text-[var(--text)]">Asia/Jakarta (UTC+7)</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-[var(--text-muted)]">Uptime Layanan</span>
                  <span className="font-semibold text-emerald-700">99.98%</span>
                </div>
              </div>

              <div className="p-2.5 bg-emerald-50/70 border border-emerald-200/60 rounded-lg flex items-center justify-between text-xs">
                <span className="text-emerald-900 font-medium">Kesehatan Cluster</span>
                <Badge variant="success" className="bg-emerald-600 text-white border-none text-[10px] uppercase font-bold">
                  OPERATIONAL
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Official Documents & Downloads */}
          <Card className="border-[var(--border)] shadow-sm bg-white">
            <CardHeader className="pb-3 border-b border-[var(--border-soft)]">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Dokumen &amp; Format
                  </span>
                  <CardTitle className="text-sm font-semibold text-[var(--text)] mt-0.5">
                    Template Standar Lampiran
                  </CardTitle>
                </div>
                <Download className="w-4 h-4 text-[var(--text-muted)]" />
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              {/* Doc 1: SOP PDF */}
              <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)] hover:border-[var(--border-hover)] transition-all flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold text-[var(--text)] truncate">
                      SOP_Facility_Governance_v1.1.pdf
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)]">PDF • 2.4 MB • Rev Juli 2024</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handleDownloadTemplate(
                      "SOP_Facility_Governance_v1.1.txt",
                      "STANDAR OPERASIONAL PROSEDUR (SOP) TATA KELOLA FASILITAS GEDUNG\nVersi 1.1\n\n1. Pengajuan PPC Kebutuhan\n2. Kajian Engineering & BoQ\n3. Pengadaan Tender & PO\n4. Pelaksanaan Lapangan & Kurva-S\n5. Serah Terima BAST & Garansi"
                    )
                  }
                  className="w-7 h-7 rounded border border-[var(--border)] bg-white hover:bg-[#111113] hover:text-white flex items-center justify-center text-[var(--text-secondary)] transition-colors cursor-pointer shrink-0"
                  title="Unduh Dokumen SOP"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Doc 2: BoQ Template */}
              <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)] hover:border-[var(--border-hover)] transition-all flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold text-[var(--text)] truncate">
                      BoQ_Template_Standard_Rev2.csv
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)]">Spreadsheet • Template BoQ</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handleDownloadTemplate(
                      "BoQ_Template_Standard_Rev2.csv",
                      "No,Kode Pekerjaan,Uraian Pekerjaan,Volume,Satuan,Harga Satuan,Total Harga\n1,ENG-01,Pekerjaan Persiapan,1,LS,5000000,5000000\n2,ENG-02,Pekerjaan Pembongkaran & Pembersihan,1,LS,3500000,3500000\n3,ENG-03,Pengadaan Material Utama,10,Unit,12000000,120000000"
                    )
                  }
                  className="w-7 h-7 rounded border border-[var(--border)] bg-white hover:bg-[#111113] hover:text-white flex items-center justify-center text-[var(--text-secondary)] transition-colors cursor-pointer shrink-0"
                  title="Unduh Template BoQ"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Doc 3: BAST Form */}
              <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)] hover:border-[var(--border-hover)] transition-all flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold text-[var(--text)] truncate">
                      Formulir_BAST_Serah_Terima.txt
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)]">Format BAST-1 &amp; BAST-2</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handleDownloadTemplate(
                      "Formulir_BAST_Serah_Terima.txt",
                      "BERITA ACARA SERAH TERIMA PEKERJAAN (BAST-1)\nNomor: BAST/FAC/2026/001\n\nPada hari ini, pihak pertama menyerahkan hasil pekerjaan fasilitas kepada pihak kedua dengan status 100% selesai dan masa pemeliharaan dimulai."
                    )
                  }
                  className="w-7 h-7 rounded border border-[var(--border)] bg-white hover:bg-[#111113] hover:text-white flex items-center justify-center text-[var(--text-secondary)] transition-colors cursor-pointer shrink-0"
                  title="Unduh Format BAST"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Ticket Support Modal */}
      {ticketModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-[var(--border)] shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[var(--border-soft)] pb-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[var(--text)]" />
                <h3 className="text-sm font-bold text-[var(--text)]">Kirim Tiket Bantuan Internal</h3>
              </div>
              <button
                type="button"
                onClick={() => setTicketModalOpen(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text)] text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendTicket} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-[var(--text)] block mb-1">
                  Subjek Permasalahan / Kebutuhan
                </label>
                <Input
                  required
                  placeholder="Contoh: Permohonan Reset Password / Kendala Verifikasi Termin"
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  className="text-xs h-9"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--text)] block mb-1">
                  Detail Kendala atau Pertanyaan
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Sampaikan kode proyek, nomor PO, atau deskripsi kendala yang dihadapi secara rinci..."
                  value={ticketBody}
                  onChange={(e) => setTicketBody(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-[var(--border)] focus:outline-none focus:ring-1 focus:ring-[#111113] resize-none"
                />
              </div>

              <div className="p-2.5 bg-[var(--bg-subtle)] rounded-lg text-[11px] text-[var(--text-muted)] flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  Tiket akan langsung diteruskan ke Admin Sistem (Siti Rahma - Ext 204) dan dijawab dalam waktu maksimal 1x24 jam kerja.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-soft)]">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setTicketModalOpen(false)}
                  className="text-xs"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={ticketSubmitted}
                  className="bg-[#111113] text-white hover:bg-[#27272A] text-xs gap-1.5"
                >
                  {ticketSubmitted ? (
                    "Mengirim..."
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Kirim Tiket
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
