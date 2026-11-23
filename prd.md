# PRD — Facility Management (Project Administration System)

| Item | Isi |
|---|---|
| Nama produk | Facility Management |
| Versi dokumen | 1.1 (draf) — database diganti ke MySQL |
| Tanggal | 21 November 2026 |
| Status produk saat ini | Berjalan di Google Apps Script + Google Sheets |
| Target | Website mandiri (standalone), desktop & mobile |
| Database target | **MySQL 8.4 LTS** (InnoDB, `utf8mb4`) |
| Bahasa dokumen | Indonesia (istilah teknis tetap Inggris) |

> **Revisi 1.1:** database diganti dari PostgreSQL ke **MySQL**. Bagian yang berubah: skema SQL (Bagian 9), tech stack dan deployment (Bagian 10), keamanan (12), migrasi (14), pengujian (15), dan risiko (17).

> **Catatan metode.** Dokumen ini disusun dari 7 screenshot aplikasi yang berjalan (login, dashboard, project search, engineering, vendor ranking, vendor master, my account). Bagian yang **terlihat langsung** ditandai ✅, bagian yang **disimpulkan** dari tagline/menu tetapi belum terlihat layarnya ditandai 🟡, dan hal yang perlu Anda konfirmasi ada di Bagian 17. Singkatan seperti PPC, FEO, TC saya tulis sebagai asumsi, mohon dikoreksi.

---

## 1. Ringkasan Produk

Facility Management adalah sistem administrasi proyek internal yang melacak satu proyek dari **surat permintaan masuk sampai serah terima (handover)**, dalam satu tempat:

1. **Request (PPC)** — surat permintaan masuk dicatat dan disetujui.
2. **Engineering** — penyusunan dokumen tender: desain, BoQ, gambar, estimasi biaya.
3. **Procurement** — undang vendor, pilih pemenang, terbitkan PO.
4. **Execution (Project)** — progres pekerjaan dan pembayaran bertahap (staged payments).
5. **Handover (Operations)** — serah terima, garansi (warranty), dan retensi.

Fitur pembeda: **live progress**, **vendor scorecard** (KPI vendor dengan kelayakan otomatis), **staged payments**, **warranty tracking**.

## 2. Latar Belakang dan Masalah

Aplikasi saat ini berbasis Apps Script dan Google Sheets. Keterbatasan yang mendorong pembuatan versi website mandiri:

| Masalah di Apps Script | Dampak |
|---|---|
| Batas waktu eksekusi ±6 menit per proses dan kuota harian | Laporan/rekap besar bisa gagal |
| Google Sheets sebagai database (tanpa relasi, tanpa transaksi) | Data ganda, salah ketik, sulit menjaga konsistensi |
| Kontrol akses buatan sendiri dan password disimpan di sheet | Risiko keamanan |
| Konkurensi rendah (banyak user serentak melambat) | Pengalaman buruk saat tim bertambah |
| Sulit diuji otomatis, sulit versi/rollback | Perubahan berisiko |
| Tampilan dibatasi iframe Apps Script | Sulit dibuat responsif dan cepat |

## 3. Tujuan, Non-Tujuan, dan Metrik

### 3.1 Tujuan
- G1. Satu sumber kebenaran untuk status semua proyek, dari request sampai handover.
- G2. Menghilangkan input ganda dan kalkulasi manual (working days, progres, skor vendor).
- G3. Memberi peringatan dini: proyek **overdue** dan **jatuh tempo ≤ 7 hari**.
- G4. Penilaian vendor yang objektif (60% teknis + 40% non-teknis, layak jika ≥ 70%).
- G5. Berjalan baik di desktop dan HP.
- G6. Jejak audit lengkap: siapa mengubah apa dan kapan.

### 3.2 Non-Tujuan (di luar cakupan v1)
- Akuntansi/ERP penuh, penggajian, dan inventori.
- Aplikasi vendor (portal untuk vendor login sendiri).
- Aplikasi native iOS/Android (cukup web responsif/PWA).

### 3.3 Metrik Keberhasilan

| Metrik | Target |
|---|---|
| Waktu memuat dashboard (p95) | < 2 detik |
| Waktu update progres satu item | < 30 detik |
| Proyek dengan data lengkap di semua tahap | ≥ 95% |
| Proyek overdue yang terdeteksi otomatis | 100% |
| Adopsi: user aktif mingguan / total user | ≥ 80% |
| Laporan PDF proyek dibuat | < 5 detik |

## 4. Pengguna dan Peran (RBAC)

Akun **dibuat oleh admin** (tidak ada registrasi mandiri) ✅ — sesuai teks di halaman login. Peran terlihat dari label di sidebar (contoh: `ENGINEERING`) ✅.

| Peran | Tanggung jawab |
|---|---|
| `ADMIN` | Kelola user, vendor master, pengaturan bobot/ambang, semua akses |
| `PPC` | Mencatat dan menyetujui request, menentukan target date dan tujuan hand-off |
| `ENGINEERING` | Membuat tender document, update progres engineering |
| `PROCUREMENT` | Undang vendor, input penawaran, pilih pemenang, terbitkan PO |
| `PROJECT` | Mengelola eksekusi lapangan, progres, pembayaran bertahap |
| `OPERATIONS` | Handover, garansi, retensi |
| `VIEWER` 🟡 | Hanya baca (manajemen) |

### Matriks Hak Akses

C = create, R = read, U = update, D = delete, — = tidak ada akses

| Modul | ADMIN | PPC | ENGINEERING | PROCUREMENT | PROJECT | OPERATIONS | VIEWER |
|---|---|---|---|---|---|---|---|
| Dashboard | R | R | R | R | R | R | R |
| Project Search & Report | R | R | R | R | R | R | R |
| PPC Request | CRUD | CRU | R | R | R | R | R |
| Engineering / Tender Doc | CRUD | R | CRU | R | R | R | R |
| Procurement / PO | CRUD | R | R | CRU | R | R | R |
| Project Execution & Payment | CRUD | R | R | R | CRU | R | R |
| Handover & Warranty | CRUD | R | R | R | R | CRU | R |
| Vendor Review (beri nilai) | CRUD | — | CR | CR | CR | CR | R |
| Vendor Master | CRUD | R | R | CRU | R | R | R |
| User Management | CRUD | — | — | — | — | — | — |
| My Account (ganti password sendiri) | U | U | U | U | U | U | U |

Aturan: user hanya bisa menghapus (soft delete) data yang ia buat sendiri, kecuali ADMIN.

## 5. Alur Bisnis End-to-End

```
[1 REQUEST/PPC] → [2 ENGINEERING] → [3 PROCUREMENT] → [4 EXECUTION/PROJECT] → [5 HANDOVER/OPERATIONS]
 surat masuk       desain,BoQ,        vendor & PO        progres & pembayaran    garansi & retensi
 disetujui         gambar, estimasi   terbit             bertahap                 selesai
```

### State machine per tahap

| Tahap | Status | Transisi |
|---|---|---|
| PPC | `DRAFT` → `SUBMITTED` → `APPROVED` → `COMPLETED` | `COMPLETED` memicu dibuatnya Tender Document |
| Engineering | `NOT_STARTED` → `IN_PROGRESS` → `COMPLETED` | `COMPLETED` (progres 100%) membuka Procurement |
| Procurement | `NOT_STARTED` → `VENDORS_INVITED` → `EVALUATION` → `WINNER_SELECTED` → `PO_ISSUED` | `PO_ISSUED` membuka Project |
| Project | `NOT_STARTED` → `IN_PROGRESS` → `COMPLETED` | `COMPLETED` membuka Handover |
| Operations | `NOT_STARTED` → `HANDED_OVER` → `WARRANTY` → `CLOSED` | `CLOSED` saat garansi habis dan retensi dicairkan |

Status keseluruhan proyek = status tahap aktif terakhir. Proyek `Completed` bila semua tahap selesai (terlihat pada contoh proyek "Perbaikan Hoist Crane area Plating").

## 6. Ruang Lingkup Berdasarkan Screenshot

| Fitur | Bukti | Status |
|---|---|---|
| Login username/password + tombol Show | Screenshot 1 | ✅ Ada |
| Dashboard (kartu tahap, project flow, vendor readiness, overdue, due 7 hari, Refresh) | Screenshot 2 | ✅ Ada |
| Project Search + kartu proyek 4 tahap + Show update history + Report | Screenshot 3 | ✅ Ada |
| Engineering Dashboard + New Tender Document + filter + Assigned to me + Update progress | Screenshot 4 | ✅ Ada |
| Vendor Performance: Ranking + Vendor Master | Screenshot 5, 6 | ✅ Ada |
| My Account: ganti password (min. 6 karakter) | Screenshot 7 | ✅ Ada |
| Layar PPC Request, Procurement, Project, Operations | Tagline & dashboard menyebut | 🟡 Belum terlihat |
| Staged payments, warranty tracking, retention | Chip di halaman login | 🟡 Belum terlihat |
| Form beri nilai vendor (review) | Kolom Reviews/Technical/Non-technical | 🟡 Belum terlihat |
| Manajemen user oleh admin | Teks "Ask your administrator" | 🟡 Belum terlihat |

## 7. Kebutuhan Fungsional

Prioritas: **P0** wajib v1, **P1** penting, **P2** opsional.

### 7.1 Autentikasi dan Akun
| ID | Kebutuhan | Prioritas |
|---|---|---|
| FR-AUTH-01 | Login memakai **username** + password; ada tombol Show/Hide password | P0 |
| FR-AUTH-02 | Pesan error generik ("username atau password salah"); jangan bocorkan mana yang salah | P0 |
| FR-AUTH-03 | Rate limit login: 5 gagal / 15 menit per username+IP, lalu kunci sementara | P0 |
| FR-AUTH-04 | Logout; sesi kedaluwarsa setelah 8 jam tidak aktif (dapat diatur) | P0 |
| FR-AUTH-05 | My Account: ganti password (password lama + baru). Aturan lama min. 6 karakter; **disarankan naik ke min. 8** | P0 |
| FR-AUTH-06 | Admin membuat/menonaktifkan user, reset password (password sementara, wajib ganti saat login pertama) | P0 |
| FR-AUTH-07 | Migrasi password: jangan salin password lama; semua user diminta set password baru | P0 |
| FR-AUTH-08 | 2FA/TOTP untuk ADMIN | P2 |

### 7.2 Dashboard
| ID | Kebutuhan | Prioritas |
|---|---|---|
| FR-DASH-01 | Lima kartu: **PPC Requests, Engineering, Procurement, Project, Operations**. Tiap kartu: jumlah aktif (besar), "active of N · M completed", progress bar % = completed/N | P0 |
| FR-DASH-02 | **Project flow**: bar horizontal jumlah proyek per tahap | P0 |
| FR-DASH-03 | **Vendor readiness**: badge `Eligible`, `Not eligible`, `Not rated yet` + jumlah; ringkasan review terbaru, atau "No vendor reviews yet." | P0 |
| FR-DASH-04 | **Overdue**: daftar item yang lewat target date (tahap, proyek, PIC, lewat berapa hari); kosong → "Nothing is past its target date." | P0 |
| FR-DASH-05 | **Due in the next 7 days**: item jatuh tempo ≤ 7 hari; kosong → "Nothing is close to its target date." | P0 |
| FR-DASH-06 | Tombol **Refresh** memuat ulang data tanpa reload halaman; tampilkan waktu "terakhir diperbarui" | P0 |
| FR-DASH-07 | Klik kartu/bar/baris → navigasi ke daftar yang sudah terfilter | P1 |
| FR-DASH-08 | Auto-refresh tiap 60 detik (opsional) | P2 |

### 7.3 Project Search
| ID | Kebutuhan | Prioritas |
|---|---|---|
| FR-PS-01 | Satu kotak pencarian: nama proyek, dinas, no. tender, no. PO, vendor, PIC | P0 |
| FR-PS-02 | Hasil berupa **kartu proyek**: nama, no. PPC · tipe · PIC, badge status, tombol **Report** | P0 |
| FR-PS-03 | Di dalam kartu: stepper 4 kolom **PPC / Engineering / Procurement / Project**, masing-masing badge status + detail (lihat tabel di bawah) dan progress bar | P0 |
| FR-PS-04 | Garis progres atas kartu mengisi sesuai tahap yang sudah selesai | P0 |
| FR-PS-05 | **Show update history**: timeline perubahan (siapa, kapan, dari→ke, catatan) | P0 |
| FR-PS-06 | **Report**: unduh PDF ringkasan proyek (semua tahap, vendor, nilai PO, riwayat) | P1 |
| FR-PS-07 | Debounce 300 ms, pagination/infinite scroll, highlight kata yang cocok | P1 |
| FR-PS-08 | Filter tambahan: status, tahun, dinas, PIC | P1 |

Detail per kolom pada kartu proyek (sesuai contoh):

| Tahap | Data yang ditampilkan |
|---|---|
| PPC | Status, tipe (`TC`), Target date (30 Oct 2026), tujuan hand-off (`To Project`) |
| Engineering | Status, no. dokumen (`001/FEO/2026/R0`), PIC engineer, tanggal mulai → selesai, progres % |
| Procurement | Status (`PO issued`), jumlah vendor diundang, pemenang, nilai (Rp 20,000,000), progres % |
| Project | Status (`Not started`) dan, jika berjalan, progres, tanggal, nilai terbayar |

### 7.4 PPC Request (🟡)
| ID | Kebutuhan | Prioritas |
|---|---|---|
| FR-PPC-01 | Buat request: nama proyek, dinas/peminta, nomor surat, tanggal surat, tipe, PIC, target date, tujuan hand-off, lampiran surat (PDF/gambar) | P0 |
| FR-PPC-02 | Nomor otomatis format `NNN/PPC/YYYY` (reset per tahun, tanpa duplikat) | P0 |
| FR-PPC-03 | Alur status DRAFT → SUBMITTED → APPROVED → COMPLETED | P0 |
| FR-PPC-04 | Saat COMPLETED, sistem membuat Tender Document kosong dan memberi notifikasi ke ENGINEERING | P1 |

### 7.5 Engineering
| ID | Kebutuhan | Prioritas |
|---|---|---|
| FR-ENG-01 | Tabel: Tender No., Project, Engineer, Start, Finish, Working Days, Progress, Status, aksi **Update progress** | P0 |
| FR-ENG-02 | Pencarian teks, filter status (**All statuses**), checkbox **Assigned to me** | P0 |
| FR-ENG-03 | **New Tender Document**: pilih proyek (dari PPC yang approved), engineer, start, finish, catatan; nomor otomatis `NNN/FEO/YYYY/R0` | P0 |
| FR-ENG-04 | **Working Days** dihitung otomatis: hari kerja Senin–Jumat inklusif start–finish (contoh 23 → 30 Sep 2026 = 6 hari), dikurangi hari libur nasional dari tabel `holidays` | P0 |
| FR-ENG-05 | **Update progress**: modal slider/angka 0–100 + catatan; tiap perubahan masuk riwayat; progres 100% → status `COMPLETED` | P0 |
| FR-ENG-06 | Revisi dokumen: `R0`, `R1`, … (buat revisi baru tanpa menimpa yang lama) | P1 |
| FR-ENG-07 | Lampiran: gambar, BoQ, estimasi biaya (PDF/XLSX/DWG, maks 25 MB/file) | P1 |
| FR-ENG-08 | Status `OVERDUE` otomatis bila lewat Finish dan progres < 100% | P0 |

### 7.6 Procurement (🟡)
| ID | Kebutuhan | Prioritas |
|---|---|---|
| FR-PRC-01 | Pilih vendor yang diundang (dari Vendor Master berstatus Active; **tampilkan badge kelayakan**) | P0 |
| FR-PRC-02 | Input nilai penawaran per vendor, tandai pemenang | P0 |
| FR-PRC-03 | Peringatan bila memilih vendor `Not eligible` (butuh alasan tertulis untuk override) | P1 |
| FR-PRC-04 | Terbitkan PO: no. PO, nilai, tanggal, vendor pemenang, lampiran PO | P0 |
| FR-PRC-05 | Progres procurement dihitung dari tonggak (undang → evaluasi → pemenang → PO) | P1 |

### 7.7 Project / Execution dan Staged Payments (🟡)
| ID | Kebutuhan | Prioritas |
|---|---|---|
| FR-PRJ-01 | Data eksekusi: tanggal mulai/selesai, PIC lapangan, progres % + riwayat | P0 |
| FR-PRJ-02 | **Staged payments**: tahapan pembayaran per PO (nama termin, % atau nominal, jatuh tempo, tanggal bayar, status) | P0 |
| FR-PRJ-03 | Validasi total termin = 100% nilai PO | P0 |
| FR-PRJ-04 | Ringkasan: nilai PO, terbayar, sisa | P1 |
| FR-PRJ-05 | Foto progres lapangan | P2 |

### 7.8 Handover / Operations dan Warranty (🟡)
| ID | Kebutuhan | Prioritas |
|---|---|---|
| FR-OPS-01 | Catat tanggal handover, berita acara (lampiran), masa garansi (bulan) | P0 |
| FR-OPS-02 | Tanggal akhir garansi dihitung otomatis; status `WARRANTY` → `CLOSED` | P0 |
| FR-OPS-03 | **Retention**: persentase, nominal, tanggal pencairan | P1 |
| FR-OPS-04 | Pengingat 30 hari sebelum garansi habis | P1 |

### 7.9 Vendor Performance
| ID | Kebutuhan | Prioritas |
|---|---|---|
| FR-VEN-01 | Tab **Ranking**: Vendor, Category, Reviews, Technical, Non-technical, Total, Eligibility | P0 |
| FR-VEN-02 | Skor **Total = Technical × 60% + Non-technical × 40%** (bobot dapat diatur admin) | P0 |
| FR-VEN-03 | **Eligible** bila rata-rata Total ≥ 70%; **Not eligible** bila < 70%; **Not rated yet** bila 0 review (tampil "–") | P0 |
| FR-VEN-04 | Rata-rata dihitung dari semua review vendor tersebut | P0 |
| FR-VEN-05 | Urut ranking: Total menurun; vendor belum dinilai di bawah | P0 |
| FR-VEN-06 | Form **beri review** setelah proyek selesai: skor teknis dan non-teknis (0–100), catatan, terkait proyek | P0 |
| FR-VEN-07 | Rincian kriteria (usulan): Teknis = kualitas, ketepatan waktu, K3/HSE; Non-teknis = harga, komunikasi, administrasi | P1 |
| FR-VEN-08 | Tab **Vendor Master**: Vendor Name, Category, Contact, Phone, Status; pencarian; tambah/ubah/nonaktifkan | P0 |
| FR-VEN-09 | Kategori: Mechanical, Multi-discipline, Civil, HVAC, MEP, Others (dapat ditambah admin) | P0 |
| FR-VEN-10 | Satu vendor satu entri (cegah nama ganda tanpa membedakan huruf besar/kecil) | P0 |
| FR-VEN-11 | Kolom Phone kosong ("–") harus bisa diisi; validasi format telepon Indonesia | P1 |
| FR-VEN-12 | Ekspor ranking ke XLSX | P2 |

### 7.10 Administrasi
| ID | Kebutuhan | Prioritas |
|---|---|---|
| FR-ADM-01 | Halaman kelola user (buat, ubah peran, nonaktifkan, reset password) | P0 |
| FR-ADM-02 | Pengaturan: bobot skor, ambang kelayakan, hari libur, kategori vendor | P1 |
| FR-ADM-03 | Audit log dapat dicari dan difilter (user, entitas, tanggal) | P1 |
| FR-ADM-04 | Impor data awal dari Google Sheets (lihat Bagian 14) | P0 |

### 7.11 Notifikasi (🟡)
| ID | Kebutuhan | Prioritas |
|---|---|---|
| FR-NTF-01 | Notifikasi dalam aplikasi (lonceng) saat ditugaskan, tahap berpindah, H-7 dan overdue | P1 |
| FR-NTF-02 | Email ringkasan harian untuk item overdue/jatuh tempo | P2 |
| FR-NTF-03 | Integrasi WhatsApp (opsional) | P2 |

## 8. Aturan Bisnis

| Kode | Aturan |
|---|---|
| BR-01 | Total skor vendor = 0.6 × Teknis + 0.4 × Non-teknis; ambang kelayakan 70% |
| BR-02 | Vendor tanpa review = `Not rated yet` (bukan `Not eligible`) |
| BR-03 | Working days = hari Senin–Jumat dalam rentang inklusif, minus hari libur |
| BR-04 | Item **overdue** = target/finish date < hari ini (zona Asia/Jakarta) dan status belum selesai |
| BR-05 | Item **due soon** = 0 ≤ (target date − hari ini) ≤ 7 hari |
| BR-06 | Tahap berikutnya hanya bisa dimulai bila tahap sebelumnya `COMPLETED` (ADMIN dapat override dengan alasan) |
| BR-07 | Nomor dokumen unik dan berurutan per tipe per tahun |
| BR-08 | Nilai uang disimpan sebagai bilangan bulat Rupiah (tanpa desimal), ditampilkan `Rp 20,000,000` |
| BR-09 | Progres hanya boleh naik, kecuali dengan catatan koreksi |
| BR-10 | Data tidak dihapus permanen; gunakan soft delete dan audit log |
| BR-11 | Tanggal ditampilkan `DD MMM YYYY` (contoh: 23 Sep 2026), zona waktu Asia/Jakarta |

## 9. Model Data (MySQL 8)

### 9.1 Relasi (ringkas)
```
users ──< progress_updates >── (polimorfik: ppc / engineering / procurement / project / operations)
projects 1──1 ppc_requests
projects 1──N tender_documents (revisi R0, R1, ...)
projects 1──N tender_invitations >──1 vendors
projects 1──1 purchase_orders >──1 vendors
purchase_orders 1──N payment_stages
projects 1──1 project_executions
projects 1──1 handovers
vendors 1──N vendor_reviews >──1 projects
```

### 9.2 Skema SQL (MySQL 8.4, draf)

**Konvensi:**
- Engine **InnoDB**, charset `utf8mb4`, collation `utf8mb4_0900_ai_ci` (tidak membedakan huruf besar/kecil, jadi `UNIQUE` pada username dan nama vendor otomatis mencegah "PT. LUS" dan "pt. lus" ganda).
- ID memakai `CHAR(36)` UUID (dibuat Prisma lewat `uuid()`; `DEFAULT (UUID())` sebagai cadangan). Alternatif lebih hemat ruang: `BINARY(16)`.
- Waktu `DATETIME(3)` disimpan **UTC**, ditampilkan sebagai Asia/Jakarta. Tanggal murni memakai `DATE`.
- Uang `BIGINT` dalam Rupiah. `CHECK` memerlukan MySQL ≥ 8.0.16 (aman di 8.4).
- Hindari kata cadangan MySQL sebagai nama kolom (`key`, `value`, `date`): dipakai `setting_key`, `holiday_date`, dst.

```sql
CREATE DATABASE facility_management
  CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE facility_management;

-- =========================== USERS ===========================
CREATE TABLE users (
  id CHAR(36) NOT NULL DEFAULT (UUID()),
  username VARCHAR(50) NOT NULL,
  full_name VARCHAR(120) NOT NULL,
  role ENUM('ADMIN','PPC','ENGINEERING','PROCUREMENT','PROJECT','OPERATIONS','VIEWER') NOT NULL,
  password_hash VARCHAR(255) NOT NULL,              -- argon2id
  must_change_password TINYINT(1) NOT NULL DEFAULT 1,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  failed_attempts INT NOT NULL DEFAULT 0,
  locked_until DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_username (username)
) ENGINE=InnoDB;

-- =========================== VENDORS =========================
CREATE TABLE vendors (
  id CHAR(36) NOT NULL DEFAULT (UUID()),
  name VARCHAR(150) NOT NULL,
  category ENUM('MECHANICAL','MULTI_DISCIPLINE','CIVIL','HVAC','MEP','OTHERS') NOT NULL,
  contact_name VARCHAR(120) NULL,
  phone VARCHAR(30) NULL,
  email VARCHAR(150) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_vendors_name (name),
  KEY idx_vendors_category (category)
) ENGINE=InnoDB;

-- =========================== PROJECTS ========================
CREATE TABLE projects (
  id CHAR(36) NOT NULL DEFAULT (UUID()),
  name VARCHAR(200) NOT NULL,
  department VARCHAR(150) NULL,                      -- "dinas" / unit peminta
  current_stage ENUM('PPC','ENGINEERING','PROCUREMENT','PROJECT','OPERATIONS') NOT NULL DEFAULT 'PPC',
  overall_status ENUM('IN_PROGRESS','COMPLETED','CANCELLED') NOT NULL DEFAULT 'IN_PROGRESS',
  created_by CHAR(36) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  deleted_at DATETIME(3) NULL,
  PRIMARY KEY (id),
  KEY idx_projects_stage (current_stage, overall_status),
  FULLTEXT KEY ft_projects_name (name, department),
  CONSTRAINT fk_projects_creator FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB;

-- =========================== 1. PPC ==========================
CREATE TABLE ppc_requests (
  id CHAR(36) NOT NULL DEFAULT (UUID()),
  project_id CHAR(36) NOT NULL,
  request_no VARCHAR(30) NOT NULL,                   -- 002/PPC/2026
  letter_no VARCHAR(80) NULL,
  letter_date DATE NULL,
  type_code VARCHAR(20) NULL,                        -- contoh: TC
  pic_id CHAR(36) NULL,
  target_date DATE NOT NULL,
  handoff_to VARCHAR(50) NULL,                       -- contoh: To Project
  status ENUM('DRAFT','SUBMITTED','APPROVED','COMPLETED') NOT NULL DEFAULT 'DRAFT',
  PRIMARY KEY (id),
  UNIQUE KEY uq_ppc_project (project_id),
  UNIQUE KEY uq_ppc_no (request_no),
  KEY idx_ppc_target (status, target_date),
  CONSTRAINT fk_ppc_project FOREIGN KEY (project_id) REFERENCES projects(id),
  CONSTRAINT fk_ppc_pic FOREIGN KEY (pic_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- =========================== 2. ENGINEERING ==================
CREATE TABLE tender_documents (
  id CHAR(36) NOT NULL DEFAULT (UUID()),
  project_id CHAR(36) NOT NULL,
  tender_no VARCHAR(40) NOT NULL,                    -- 001/FEO/2026/R0
  revision INT NOT NULL DEFAULT 0,
  engineer_id CHAR(36) NULL,
  start_date DATE NULL,
  finish_date DATE NULL,
  working_days INT NULL,                             -- dihitung di aplikasi
  progress_pct TINYINT UNSIGNED NOT NULL DEFAULT 0,
  status ENUM('NOT_STARTED','IN_PROGRESS','COMPLETED') NOT NULL DEFAULT 'NOT_STARTED',
  PRIMARY KEY (id),
  UNIQUE KEY uq_tender_no (tender_no),
  KEY idx_td_project (project_id),
  KEY idx_td_engineer (engineer_id, status),
  KEY idx_td_finish (status, finish_date),
  CONSTRAINT chk_td_progress CHECK (progress_pct BETWEEN 0 AND 100),
  CONSTRAINT chk_td_dates CHECK (finish_date IS NULL OR start_date IS NULL OR finish_date >= start_date),
  CONSTRAINT fk_td_project FOREIGN KEY (project_id) REFERENCES projects(id),
  CONSTRAINT fk_td_engineer FOREIGN KEY (engineer_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- =========================== 3. PROCUREMENT ==================
CREATE TABLE tender_invitations (
  id CHAR(36) NOT NULL DEFAULT (UUID()),
  project_id CHAR(36) NOT NULL,
  vendor_id CHAR(36) NOT NULL,
  bid_amount BIGINT NULL,
  is_winner TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_invite (project_id, vendor_id),
  CONSTRAINT fk_inv_project FOREIGN KEY (project_id) REFERENCES projects(id),
  CONSTRAINT fk_inv_vendor FOREIGN KEY (vendor_id) REFERENCES vendors(id)
) ENGINE=InnoDB;

CREATE TABLE purchase_orders (
  id CHAR(36) NOT NULL DEFAULT (UUID()),
  project_id CHAR(36) NOT NULL,
  vendor_id CHAR(36) NOT NULL,
  po_no VARCHAR(40) NOT NULL,
  amount BIGINT NOT NULL,
  issued_at DATE NOT NULL,
  status ENUM('NOT_STARTED','VENDORS_INVITED','EVALUATION','WINNER_SELECTED','PO_ISSUED')
         NOT NULL DEFAULT 'PO_ISSUED',
  PRIMARY KEY (id),
  UNIQUE KEY uq_po_project (project_id),
  UNIQUE KEY uq_po_no (po_no),
  CONSTRAINT chk_po_amount CHECK (amount >= 0),
  CONSTRAINT fk_po_project FOREIGN KEY (project_id) REFERENCES projects(id),
  CONSTRAINT fk_po_vendor FOREIGN KEY (vendor_id) REFERENCES vendors(id)
) ENGINE=InnoDB;

-- =========================== 4. PROJECT / EXECUTION ==========
CREATE TABLE payment_stages (
  id CHAR(36) NOT NULL DEFAULT (UUID()),
  po_id CHAR(36) NOT NULL,
  name VARCHAR(80) NOT NULL,                         -- DP, Termin 1, Pelunasan
  percentage DECIMAL(5,2) NOT NULL,
  amount BIGINT NOT NULL,
  due_date DATE NULL,
  paid_at DATE NULL,
  status ENUM('PLANNED','INVOICED','PAID') NOT NULL DEFAULT 'PLANNED',
  PRIMARY KEY (id),
  KEY idx_pay_po (po_id),
  KEY idx_pay_due (status, due_date),
  CONSTRAINT fk_pay_po FOREIGN KEY (po_id) REFERENCES purchase_orders(id)
) ENGINE=InnoDB;

CREATE TABLE project_executions (
  id CHAR(36) NOT NULL DEFAULT (UUID()),
  project_id CHAR(36) NOT NULL,
  pic_id CHAR(36) NULL,
  start_date DATE NULL,
  finish_date DATE NULL,
  progress_pct TINYINT UNSIGNED NOT NULL DEFAULT 0,
  status ENUM('NOT_STARTED','IN_PROGRESS','COMPLETED') NOT NULL DEFAULT 'NOT_STARTED',
  PRIMARY KEY (id),
  UNIQUE KEY uq_exec_project (project_id),
  CONSTRAINT chk_exec_progress CHECK (progress_pct BETWEEN 0 AND 100),
  CONSTRAINT fk_exec_project FOREIGN KEY (project_id) REFERENCES projects(id),
  CONSTRAINT fk_exec_pic FOREIGN KEY (pic_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- =========================== 5. HANDOVER / OPERATIONS ========
CREATE TABLE handovers (
  id CHAR(36) NOT NULL DEFAULT (UUID()),
  project_id CHAR(36) NOT NULL,
  handover_date DATE NULL,
  warranty_months INT NULL,
  warranty_end DATE NULL,
  retention_pct DECIMAL(5,2) NULL,
  retention_amount BIGINT NULL,
  retention_released_at DATE NULL,
  status ENUM('NOT_STARTED','HANDED_OVER','WARRANTY','CLOSED') NOT NULL DEFAULT 'NOT_STARTED',
  PRIMARY KEY (id),
  UNIQUE KEY uq_handover_project (project_id),
  KEY idx_handover_warranty (status, warranty_end),
  CONSTRAINT fk_handover_project FOREIGN KEY (project_id) REFERENCES projects(id)
) ENGINE=InnoDB;

-- =========================== VENDOR REVIEWS ==================
CREATE TABLE vendor_reviews (
  id CHAR(36) NOT NULL DEFAULT (UUID()),
  vendor_id CHAR(36) NOT NULL,
  project_id CHAR(36) NULL,
  reviewer_id CHAR(36) NOT NULL,
  technical_score DECIMAL(5,2) NOT NULL,
  non_technical_score DECIMAL(5,2) NOT NULL,
  notes TEXT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_rev_vendor (vendor_id),
  CONSTRAINT chk_rev_tech CHECK (technical_score BETWEEN 0 AND 100),
  CONSTRAINT chk_rev_nontech CHECK (non_technical_score BETWEEN 0 AND 100),
  CONSTRAINT fk_rev_vendor FOREIGN KEY (vendor_id) REFERENCES vendors(id),
  CONSTRAINT fk_rev_project FOREIGN KEY (project_id) REFERENCES projects(id),
  CONSTRAINT fk_rev_reviewer FOREIGN KEY (reviewer_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- =========================== RIWAYAT, LAMPIRAN, AUDIT ========
CREATE TABLE progress_updates (                      -- sumber "Show update history"
  id CHAR(36) NOT NULL DEFAULT (UUID()),
  project_id CHAR(36) NOT NULL,
  stage ENUM('PPC','ENGINEERING','PROCUREMENT','PROJECT','OPERATIONS') NOT NULL,
  old_value VARCHAR(100) NULL,
  new_value VARCHAR(100) NULL,
  note TEXT NULL,
  actor_id CHAR(36) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_pu_project (project_id, created_at),
  CONSTRAINT fk_pu_project FOREIGN KEY (project_id) REFERENCES projects(id),
  CONSTRAINT fk_pu_actor FOREIGN KEY (actor_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE attachments (
  id CHAR(36) NOT NULL DEFAULT (UUID()),
  project_id CHAR(36) NULL,
  stage VARCHAR(20) NULL,
  file_name VARCHAR(255) NOT NULL,
  storage_key VARCHAR(500) NOT NULL,
  mime_type VARCHAR(100) NULL,
  size_bytes BIGINT NULL,
  uploaded_by CHAR(36) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_att_project (project_id),
  CONSTRAINT fk_att_project FOREIGN KEY (project_id) REFERENCES projects(id),
  CONSTRAINT fk_att_user FOREIGN KEY (uploaded_by) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE audit_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  actor_id CHAR(36) NULL,
  action VARCHAR(50) NOT NULL,
  entity VARCHAR(50) NOT NULL,
  entity_id VARCHAR(50) NULL,
  diff JSON NULL,
  ip VARCHAR(45) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_audit_entity (entity, entity_id),
  KEY idx_audit_time (created_at)
) ENGINE=InnoDB;

-- =========================== PENGATURAN & PENOMORAN ==========
CREATE TABLE holidays (
  holiday_date DATE NOT NULL,
  name VARCHAR(120) NOT NULL,
  PRIMARY KEY (holiday_date)
) ENGINE=InnoDB;

CREATE TABLE settings (
  setting_key VARCHAR(80) NOT NULL,
  setting_value JSON NOT NULL,
  PRIMARY KEY (setting_key)
) ENGINE=InnoDB;

CREATE TABLE score_config (                          -- satu baris saja
  id TINYINT UNSIGNED NOT NULL DEFAULT 1,
  technical_weight DECIMAL(4,3) NOT NULL DEFAULT 0.600,
  non_technical_weight DECIMAL(4,3) NOT NULL DEFAULT 0.400,
  threshold DECIMAL(5,2) NOT NULL DEFAULT 70.00,
  PRIMARY KEY (id),
  CONSTRAINT chk_score_single CHECK (id = 1),
  CONSTRAINT chk_score_weights CHECK (technical_weight + non_technical_weight = 1.000)
) ENGINE=InnoDB;
INSERT INTO score_config (id) VALUES (1);

CREATE TABLE doc_sequences (                         -- penomoran 001/PPC/2026 tanpa duplikat
  doc_type VARCHAR(10) NOT NULL,                     -- PPC, FEO
  doc_year SMALLINT NOT NULL,
  last_number INT NOT NULL DEFAULT 0,
  PRIMARY KEY (doc_type, doc_year)
) ENGINE=InnoDB;

-- =========================== VIEW SKOR VENDOR ================
CREATE OR REPLACE VIEW vendor_scores AS
SELECT v.id, v.name, v.category,
       COUNT(r.id)                                   AS reviews,
       AVG(r.technical_score)                        AS technical,
       AVG(r.non_technical_score)                    AS non_technical,
       AVG(r.technical_score * c.technical_weight
         + r.non_technical_score * c.non_technical_weight) AS total,
       CASE
         WHEN COUNT(r.id) = 0 THEN 'NOT_RATED'
         WHEN AVG(r.technical_score * c.technical_weight
                + r.non_technical_score * c.non_technical_weight) >= c.threshold THEN 'ELIGIBLE'
         ELSE 'NOT_ELIGIBLE'
       END                                           AS eligibility
FROM vendors v
CROSS JOIN score_config c
LEFT JOIN vendor_reviews r ON r.vendor_id = v.id
GROUP BY v.id, c.technical_weight, c.non_technical_weight, c.threshold;
```

**Penomoran dokumen aman dari duplikat** (jalankan di dalam satu transaksi InnoDB):

```sql
START TRANSACTION;
INSERT IGNORE INTO doc_sequences (doc_type, doc_year, last_number) VALUES ('PPC', 2026, 0);
UPDATE doc_sequences SET last_number = last_number + 1
 WHERE doc_type = 'PPC' AND doc_year = 2026;          -- mengunci baris
SELECT last_number FROM doc_sequences
 WHERE doc_type = 'PPC' AND doc_year = 2026;          -- 2 → "002/PPC/2026"
COMMIT;
```

**Prisma (MySQL):**

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")   // mysql://app_user:***@127.0.0.1:3306/facility_management?connection_limit=10
}

model User {
  id           String   @id @default(uuid()) @db.Char(36)
  username     String   @unique @db.VarChar(50)
  fullName     String   @map("full_name") @db.VarChar(120)
  role         Role
  passwordHash String   @map("password_hash")
  isActive     Boolean  @default(true) @map("is_active")
  createdAt    DateTime @default(now()) @map("created_at") @db.DateTime(3)
  @@map("users")
}
```

> Bobot skor (60/40) dan ambang kelayakan (70) disimpan di tabel `score_config` dan dapat diubah ADMIN; view `vendor_scores` otomatis mengikuti. Validasi aturan lintas tabel (mis. total termin = 100% nilai PO, progres hanya naik) dilakukan di **service layer** aplikasi dan dilindungi transaksi, karena MySQL tidak memiliki constraint lintas tabel.

## 10. Tech Stack dan Arsitektur

### 10.1 Pilihan teknologi (rekomendasi)

| Lapisan | Pilihan | Alasan |
|---|---|---|
| Bahasa | **TypeScript** (front-end dan back-end satu bahasa) | Aman tipe, satu bahasa untuk semua, mudah dibantu AI |
| Framework web | **Next.js 15 (App Router) + React 19** | UI, API, dan SSR dalam satu proyek; mudah dideploy |
| Styling | **Tailwind CSS 4** + **shadcn/ui** (Radix UI) | Cocok untuk tema gelap dan komponen konsisten |
| Tabel/form | TanStack Table, React Hook Form + **Zod** | Tabel filter/sort, validasi satu skema di klien dan server |
| Grafik | Recharts (atau bar CSS sederhana) | Project flow dan progress |
| Database | **MySQL 8.4 LTS** (InnoDB, `utf8mb4`), di VPS sendiri atau managed (Aiven, TiDB Cloud, PlanetScale) | Relasional, transaksi, constraint, view; didukung luas oleh penyedia hosting Indonesia |
| ORM/migrasi | **Prisma** (`provider = "mysql"`) atau Drizzle | Skema terversi, migrasi otomatis (`prisma migrate deploy`) |
| Autentikasi | **Auth.js (NextAuth) Credentials** dengan username + **argon2id** | Login pakai username (bukan email), kontrol penuh |
| Penyimpanan file | Volume disk server (awal) → S3-compatible (Cloudflare R2 / MinIO) | Lampiran surat, BoQ, gambar; MySQL hanya menyimpan path (`storage_key`), bukan file |
| PDF Report | **@react-pdf/renderer** (atau Playwright print-to-PDF) | Tombol Report |
| Antrian/cron | `cron` server memanggil endpoint job terproteksi (atau `node-cron`) | Penanda overdue, pengingat; tidak bergantung pada fitur khusus database |
| Email | Resend (opsional) | Ringkasan harian |
| Pengujian | Vitest (unit), Playwright (E2E) | Aman saat mengubah kode |
| Kualitas kode | ESLint, Prettier, TypeScript strict | |
| Reverse proxy & TLS | **Caddy** (HTTPS otomatis) atau Nginx | Sertifikat otomatis, kompresi |
| Kontainer | **Docker Compose** (app + MySQL + Caddy) | Lingkungan sama di lokal dan produksi |
| CI/CD | GitHub Actions → build image Docker → deploy ke VPS | Deploy otomatis per push |
| Monitoring | Sentry + Uptime Kuma (cek ketersediaan) | Lacak error, performa, dan uptime |

**Alternatif yang lebih ringan** bila ingin tetap di ekosistem Google: pertahankan Apps Script tetapi tulis ulang dengan **TypeScript + clasp**, UI React (Vite) dan database Cloud SQL for MySQL. Tidak saya rekomendasikan karena batas kuota dan eksekusi tetap ada.

**Alternatif Python:** FastAPI + SQLAlchemy + MySQL (driver asyncmy) + front-end React. Bagus bila tim Anda lebih nyaman Python, tetapi butuh dua proyek terpisah.

### 10.2 Arsitektur

```
Browser (desktop/HP, PWA)
   │  HTTPS
   ▼
Next.js (Node.js 22, Docker)
 ├─ UI (React Server + Client Components)
 ├─ Route Handlers /api/*  (REST JSON)
 ├─ Server Actions (form mutasi)
 ├─ Auth.js (session cookie HttpOnly)
 └─ Service layer (aturan bisnis: skor, working days, state machine)
   │
   ├─► MySQL 8.4 (InnoDB)      ← Prisma (connection pool)
   ├─► Object Storage (lampiran)
   └─► Cron (overdue, reminder)
```

### 10.3 Deployment dan Operasional MySQL

| Opsi | Cocok untuk | Catatan |
|---|---|---|
| **A. 1 VPS, Docker Compose (Next.js + MySQL + Caddy)** — *rekomendasi awal* | Tim kecil, data tetap di Indonesia (mis. IDCloudHost, Biznet Gio, Niagahoster VPS) | Latensi database sangat rendah, biaya tetap kecil; Anda yang mengurus update dan backup |
| B. Next.js di Vercel + MySQL managed (Aiven, TiDB Cloud, PlanetScale) | Tidak ingin mengurus server | Fungsi serverless membuka banyak koneksi: atur `connection_limit` kecil atau pakai driver serverless; database biasanya di luar negeri sehingga lebih lambat |
| C. Shared hosting cPanel (MySQL bawaan) | Hanya bila hosting mendukung aplikasi Node.js | Terbatas, tidak disarankan untuk produksi |

Praktik operasional MySQL:
- Buat **user database khusus aplikasi** (`app_user`) dengan hak `SELECT, INSERT, UPDATE, DELETE` pada satu schema; migrasi memakai user terpisah. Jangan pakai `root`.
- Port 3306 **tidak dibuka ke internet**; hanya jaringan internal Docker/VPS (atau SSH tunnel untuk admin).
- Atur `time_zone = '+00:00'` (UTC) dan `character-set-server = utf8mb4`.
- Setel `innodb_buffer_pool_size` ≈ 50–70% RAM yang dialokasikan ke MySQL.
- Backup: `mysqldump --single-transaction` tiap malam + binary log, salin ke penyimpanan luar server (Cloudflare R2/Google Drive), simpan 30 hari; **uji restore** tiap kuartal.
- Migrasi skema hanya lewat Prisma Migrate di pipeline CI/CD; jangan ubah tabel manual di produksi.
- Pantau `slow_query_log` (ambang 1 detik) dan tambah indeks bila perlu.

### 10.4 Struktur folder

```
facility-management/
├─ prisma/ (schema.prisma, migrations/, seed.ts)
├─ scripts/ (import-from-sheets.ts)
├─ src/
│  ├─ app/
│  │  ├─ (auth)/login/page.tsx
│  │  ├─ (app)/layout.tsx              # sidebar + topbar
│  │  ├─ (app)/dashboard/page.tsx
│  │  ├─ (app)/projects/page.tsx       # Project Search
│  │  ├─ (app)/engineering/page.tsx
│  │  ├─ (app)/procurement/page.tsx
│  │  ├─ (app)/project/page.tsx
│  │  ├─ (app)/operations/page.tsx
│  │  ├─ (app)/vendors/page.tsx        # tab Ranking + Vendor Master
│  │  ├─ (app)/account/page.tsx
│  │  ├─ (app)/admin/users/page.tsx
│  │  └─ api/ ...
│  ├─ components/ (ui/, layout/, project-card/, stat-card/, ...)
│  ├─ server/ (auth.ts, db.ts, services/, policies/rbac.ts)
│  ├─ lib/ (dates.ts, money.ts, working-days.ts, scoring.ts, validators/)
│  └─ styles/globals.css
├─ tests/ (unit/, e2e/)
├─ .env.example
└─ README.md
```

## 11. Rancangan API (REST, JSON)

Semua endpoint butuh sesi login dan dicek RBAC di server. Respons error seragam: `{ "error": { "code": "...", "message": "..." } }`.

| Method | Endpoint | Fungsi | Peran |
|---|---|---|---|
| POST | `/api/auth/callback/credentials` | Login | publik |
| POST | `/api/account/password` | Ganti password sendiri | semua |
| GET | `/api/dashboard` | Data kartu, flow, vendor readiness, overdue, due soon | semua |
| GET | `/api/projects?q=&status=&year=&page=` | Project Search | semua |
| GET | `/api/projects/:id` | Detail proyek lintas tahap | semua |
| GET | `/api/projects/:id/history` | Update history | semua |
| GET | `/api/projects/:id/report` | PDF laporan | semua |
| POST | `/api/ppc` · PATCH `/api/ppc/:id` | Buat/ubah request | PPC, ADMIN |
| GET | `/api/engineering?q=&status=&mine=1` | Daftar tender document | semua |
| POST | `/api/engineering` | New Tender Document | ENGINEERING, ADMIN |
| PATCH | `/api/engineering/:id/progress` | Update progress | ENGINEERING, ADMIN |
| POST | `/api/procurement/:projectId/invitations` | Undang vendor | PROCUREMENT |
| POST | `/api/procurement/:projectId/winner` | Pilih pemenang | PROCUREMENT |
| POST | `/api/procurement/:projectId/po` | Terbitkan PO | PROCUREMENT |
| PATCH | `/api/project/:id/progress` | Progres eksekusi | PROJECT |
| POST/PATCH | `/api/po/:id/payment-stages` | Termin pembayaran | PROJECT, ADMIN |
| POST | `/api/operations/:projectId/handover` | Handover & garansi | OPERATIONS |
| GET | `/api/vendors/ranking` | Tab Ranking | semua |
| GET/POST/PATCH | `/api/vendors` | Vendor Master | PROCUREMENT, ADMIN (tulis) |
| POST | `/api/vendors/:id/reviews` | Beri nilai | sesuai matriks |
| GET/POST/PATCH | `/api/admin/users` | Kelola user | ADMIN |
| GET | `/api/admin/audit-logs` | Audit log | ADMIN |
| POST | `/api/uploads/sign` | URL upload terotorisasi | sesuai modul |

## 12. Keamanan

| Area | Kontrol |
|---|---|
| Password | argon2id; tidak pernah disimpan/dikirim plaintext; min. 8 karakter |
| Sesi | Cookie `HttpOnly; Secure; SameSite=Lax`, rotasi saat login |
| Akses | RBAC di server pada setiap route/action; jangan hanya menyembunyikan menu |
| Database | Query berparameter (ORM); user MySQL khusus aplikasi dengan hak minimum; port 3306 tertutup untuk publik; kontrol akses per peran di service layer (MySQL tidak punya Row Level Security) |
| Input | Validasi Zod di server; sanitasi output; cegah XSS/CSRF |
| Brute force | Rate limit + kunci akun sementara |
| File | Batasi tipe/ukuran, pindai ekstensi, URL bertanda tangan berumur pendek |
| Rahasia | `.env` tidak masuk Git; secret di server/GitHub Secrets; password MySQL acak panjang |
| Audit | Semua mutasi tercatat di `audit_logs` |
| Cadangan | `mysqldump` harian + binary log, salinan off-site, uji restore per kuartal |
| Transport | HTTPS wajib, header keamanan (CSP, HSTS) |

## 13. Kebutuhan Non-Fungsional

| Kategori | Target |
|---|---|
| Performa | Halaman utama < 2 s (p95); API < 500 ms (p95) |
| Kapasitas | 100 user terdaftar, 30 serentak, 5.000 proyek/tahun tanpa degradasi |
| Ketersediaan | 99.5% per bulan |
| Responsif | Desktop ≥ 1024 px, tablet, HP ≥ 360 px; sidebar jadi drawer di HP |
| Aksesibilitas | WCAG 2.1 AA: kontras, fokus terlihat, navigasi keyboard, label form |
| Browser | Chrome, Edge, Safari, Firefox 2 versi terakhir |
| Lokalisasi | UI Inggris (seperti sekarang), siap i18n (id/en); zona Asia/Jakarta; mata uang IDR |
| Pemeliharaan | Cakupan tes unit untuk `scoring`, `working-days`, state machine ≥ 80% |

## 14. Migrasi dari Apps Script

1. **Audit sheet**: ekspor tiap sheet (Users, Vendors, PPC, Engineering, Procurement, Reviews, History) ke CSV.
2. **Pemetaan kolom → tabel** (dokumentasikan di `scripts/mapping.md`).
3. **Skrip impor** `scripts/import-from-sheets.ts`: baca CSV, bersihkan (trim, samakan huruf besar/kecil nama vendor, ubah format tanggal ke ISO, ubah "Rp 20,000,000" → `20000000`), masukkan ke MySQL dalam satu transaksi InnoDB (`START TRANSACTION ... COMMIT`, batalkan semua bila ada galat), tampilkan laporan baris yang ditolak.
4. **User**: buat ulang akun; password baru sementara (`must_change_password = true`). Jangan impor hash lama.
5. **Verifikasi**: bandingkan jumlah baris dan total nilai PO sheet vs database; cek 5 proyek sampel secara manual.
6. **Paralel 2 minggu**: Apps Script mode baca-saja, web baru jadi sumber utama.
7. **Cutover**: bekukan Apps Script, ekspor terakhir, impor ulang delta, alihkan tim.
8. **Rollback**: simpan sheet asli tidak diubah selama 30 hari.

## 15. Pengujian dan Rilis

- **Unit**: `calculateWorkingDays` (contoh 23→30 Sep 2026 = 6; lintas akhir pekan; hari libur), `vendorScore` (0 review, tepat 70, di bawah 70), `isOverdue`, `isDueSoon`, state machine.
- **Integrasi**: API + database uji (Testcontainers dengan image `mysql:8.4`, sama dengan produksi).
- **E2E (Playwright)**: login → dashboard → buat tender → update progres 100% → status Completed → muncul di Project Search.
- **Keamanan**: uji akses lintas peran (ENGINEERING tidak bisa menerbitkan PO).
- **UAT**: 1 skenario nyata per peran dengan data riil.
- **Lingkungan**: `local` → `staging` → `production`; migrasi DB otomatis di pipeline.

## 16. Roadmap

| Fase | Isi | Estimasi* |
|---|---|---|
| 0. Fondasi | Repo, CI/CD, skema DB, auth, layout sidebar, tema | 1–2 minggu |
| 1. Paritas (MVP) | Login, Dashboard, Project Search, Engineering, Vendor Ranking + Master, My Account, migrasi data | 3–4 minggu |
| 2. Alur penuh | PPC Request, Procurement + PO, Project + staged payments, Admin user | 3–4 minggu |
| 3. Penutupan | Handover, garansi, retensi, Report PDF, notifikasi, audit log UI | 2–3 minggu |
| 4. Penyempurnaan | Email harian, ekspor XLSX, PWA, 2FA admin | sesuai kebutuhan |

*Estimasi kasar untuk 1 developer; sangat dipengaruhi keputusan di Bagian 17.

## 17. Asumsi, Risiko, dan Pertanyaan Terbuka

### Asumsi
- PPC = unit perencanaan/pengendalian yang menerima surat permintaan; FEO = prefiks nomor dokumen engineering; `TC` = kode tipe request; "dinas" = unit/instansi peminta. **Mohon dikonfirmasi arti sebenarnya.**
- Satu proyek memiliki satu PO pemenang.
- Dashboard "Operations" = tahap handover/garansi.

### Pertanyaan untuk Anda
1. Apa kepanjangan dan fungsi `PPC`, `FEO`, dan `TC`?
2. Siapa saja peran lain selain `ENGINEERING`? Apakah daftar peran di Bagian 4 sudah sesuai?
3. Bagaimana cara user memberi **review vendor** saat ini (form apa, kriteria apa, skor 0–100)?
4. Apakah satu proyek bisa punya banyak PO atau banyak vendor pemenang?
5. Bagaimana skema **staged payments** (persentase termin, syarat cair)?
6. Berapa lama garansi dan persen retensi umumnya?
7. Perlu lampiran file (surat, BoQ, gambar)? Berapa besar dan format apa?
8. Berapa user dan berapa proyek per tahun?
9. Siapa yang akan mengelola server/hosting dan apakah data harus berada di Indonesia?
10. Apakah email notifikasi atau WhatsApp diperlukan?

### Risiko

| Risiko | Mitigasi |
|---|---|
| Aturan bisnis belum terdokumentasi (hanya di kode Apps Script) | Minta kode `.gs`, saya bantu ekstrak aturan jadi daftar BR |
| Data sheet kotor | Skrip pembersihan + laporan baris ditolak |
| Resistensi pengguna | Pertahankan tampilan dan istilah yang sama, pelatihan singkat, mode paralel |
| Biaya hosting | Mulai dari 1 VPS kecil (2 vCPU / 2–4 GB RAM) berisi app + MySQL via Docker Compose |
| Data hilang karena MySQL dikelola sendiri | Backup otomatis harian + off-site + uji restore berkala |
| Scope creep | Patuhi prioritas P0/P1/P2 dan fase |

---
*Akhir dokumen. Lanjutkan dengan `design.md` untuk spesifikasi visual dan komponen.*
