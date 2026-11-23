# Facility Management Web Application

Sistem Administrasi Proyek, Scheduling, Pemantauan Progres Fisik, Pembayaran Bertahap (Termin), dan Evaluasi KPI Vendor Mandiri (Standalone) dengan Database **MySQL 8.4 LTS**.

Aplikasi ini dibangun ulang (migrasi) dari sistem lama berbasis Google Apps Script + Google Sheets menjadi aplikasi web enterprise modern berkecepatan tinggi, aman, dan mudah dirawat.

---

## 🚀 Tech Stack

- **Framework**: Next.js 15 (App Router) + React 19 + TypeScript
- **Styling**: Tailwind CSS v4 + Design Tokens (Tema terang, solid black `#111113`, pastel status badges, sidebar 260px `#F7F7F8`)
- **Database**: MySQL 8.4 LTS (InnoDB, `utf8mb4`, foreign keys, checked constraints)
- **ORM**: Prisma ORM v6
- **Autentikasi & Keamanan**: Password hashing via Node.js `scrypt`, stateless JWT session via `jose` dengan HttpOnly cookies, RBAC 7-level role, proteksi brute-force (5 kali salah = kunci 15 menit), query terparameter anti-SQL Injection.

---

## 📋 Prasyarat Sistem

1. **Node.js**: Versi 18.18+ atau Node.js 20+
2. **Database**: MySQL 8.4 LTS (dapat menggunakan MySQL standalone atau bawaan Laragon)
   - Host: `127.0.0.1`
   - Port: `3306`
   - Database Name: `facility_management`
   - User: `root` (atau kredensial sesuai environment lokal)

---

## ⚙️ Panduan Instalasi & Konfigurasi

### 1. Masuk ke Direktori Proyek
```bash
cd "d:\Facility Management"
```

### 2. Install Dependensi
```bash
npm install
```

### 3. Konfigurasi Variabel Lingkungan (`.env`)
Salin file `.env.example` menjadi `.env` (atau edit file `.env` yang ada):

```env
# Koneksi Database MySQL 8.4 LTS
DATABASE_URL="mysql://root:@127.0.0.1:3306/facility_management"

# JWT Secret untuk sesi autentikasi (minimal 32 karakter)
NEXTAUTH_SECRET="facility-management-super-secret-key-32-chars-min"
NEXTAUTH_URL="http://localhost:3000"

# Node Environment
NODE_ENV="production"
```

### 4. Sinkronisasi Skema Database & Jalankan Seed
Jalankan migrasi skema tabel ke MySQL dan masukkan data awal (users, vendor master, hari libur nasional, sequence counter, dan konfigurasi bobot skor):

```bash
# Sinkronkan skema Prisma ke database MySQL
npx prisma db push

# Eksekusi seed script
npm run seed
```

---

## 🖥️ Menjalankan Aplikasi

### Mode Pengembangan (Development)
```bash
npm run dev
```
Buka browser di: [http://localhost:3000](http://localhost:3000)

### Mode Produksi (Production Build & Start)
```bash
npm run build
npm run start -- --port 3000
```

---

## 🔑 Kredensial Akun Default (Hasil Seed)

Semua akun awal menggunakan password default: **`adminpassword123`** (wajib diubah pada login pertama sesuai aturan PRD).

| Username | Role | Hak Akses Utama |
| :--- | :--- | :--- |
| `admin` | **ADMIN** | Akses penuh, User Administration, Audit Logs, Settings |
| `ppc_user` | **PPC** | Registrasi PPC, penerbitan nomor `NNN/PPC/YYYY`, disposisi |
| `eng_user` | **ENGINEERING** | Gambar teknik, BOQ, dokumen tender `NNN/FEO/YYYY/R0`, progres |
| `proc_user` | **PROCUREMENT** | Evaluasi tender vendor, kualifikasi KPI $\ge 70\%$, penerbitan PO & termin |
| `proj_user` | **PROJECT** | Pemantauan progres fisik lapangan (BR-09), pelunasan termin |
| `ops_user` | **OPERATIONS** | BAST (Handover), hitung masa garansi 12 bln, retensi 5%, review KPI |
| `viewer` | **VIEWER** | Hak baca/pantau (Read-only) seluruh modul |

---

## 📁 Struktur Direktori Proyek

```
facility-management/
├── prisma/
│   ├── schema.prisma          # 15 Model database relasional & Enum MySQL
│   └── seed.ts                # Seeding data pengguna, vendor, hari libur, dll.
├── src/
│   ├── app/
│   │   ├── (app)/             # Halaman aplikasi dengan layout Shell (Sidebar + Topbar)
│   │   │   ├── dashboard/     # Executive Dashboard & Flow Monitoring
│   │   │   ├── tasks/         # My Tasks (Penugasan lintas stage & update progres)
│   │   │   ├── inbox/         # Inbox (Notifikasi overdue, penugasan, handoff)
│   │   │   ├── ppc/           # Modul PPC Requests & Intake
│   │   │   ├── engineering/   # Modul Engineering, Tender Docs, Working Days
│   │   │   ├── procurement/   # Modul Procurement, Vendor Bids, PO & Termin
│   │   │   ├── project/       # Modul Project Execution & Pelunasan Termin
│   │   │   ├── operations/    # Modul Operations, BAST, Garansi & Retensi
│   │   │   ├── projects/      # Project Search & Stepper List
│   │   │   │   └── [id]/      # Project Detail (760px column) & Attachments
│   │   │   │       └── report/# Dedicated Printable Executive Dossier Report
│   │   │   ├── vendors/       # Vendor Ranking (60/40) & Vendor Master
│   │   │   ├── admin/         # Modul Administrator
│   │   │   │   ├── users/     # User Management & Security Controls
│   │   │   │   └── audit-logs/# Immutable Compliance Audit Trail
│   │   │   └── account/       # Profil Pengguna & Ganti Password
│   │   ├── api/               # RESTful API Endpoints (JSON)
│   │   │   ├── auth/          # Login, Logout, Me
│   │   │   ├── admin/         # Admin Users & Audit Trail APIs
│   │   │   ├── dashboard/     # KPI & Stage Flow Statistics
│   │   │   ├── ppc/           # PPC CRUD & Auto-Numbering
│   │   │   ├── engineering/   # Tender Documents & Progress
│   │   │   ├── procurement/   # Tenders, Invitations & Issue PO
│   │   │   ├── project-execution/ # Progress Tracking & Staged Payments
│   │   │   ├── operations/    # BAST, Warranty & Retention Release
│   │   │   ├── projects/      # Search, Filters & Comments
│   │   │   └── vendors/       # Master Vendor & Dynamic Ranking
│   │   └── login/             # Halaman Login
│   ├── components/
│   │   ├── ui/                # Komponen desain dasar (Button, Badge, Card, dll.)
│   │   └── layout/            # Sidebar (260px) & Topbar Shell
│   ├── lib/
│   │   ├── utils.ts           # Helper styling classNames
│   │   └── working-days.ts    # Kalkulator hari kerja resmi (potong weekend & libur)
│   └── server/
│       ├── auth.ts            # Logika scrypt hash, JWT Jose, Cookie session
│       ├── db.ts              # Prisma Client instance
│       ├── audit.ts           # Logger audit trail kepatuhan
│       └── sequences.ts       # Generator sequence dokumen anti-tabrakan
├── scripts/
│   └── import-sheets.ts       # Utilitas migrasi data lama Google Sheets (CSV)
└── tests/
    └── integration/           # Rangkaian tes integrasi otomatis Node.js
```

---

## 🔄 Migrasi Data dari Google Sheets / Apps Script

Telah disediakan utilitas mandiri `scripts/import-sheets.ts` untuk memigrasikan data lama dari spreadsheet Google ke tabel MySQL.

### 1. Buat Template File CSV
```bash
npx tsx scripts/import-sheets.ts --generate-templates
```
Perintah ini akan membuat file template contoh di folder `data/templates/`:
- `legacy-vendors.csv`: Kolom `name, category, email, phone, address`
- `legacy-projects.csv`: Kolom `name, department, stage, status, vendor_name, po_no, po_amount, bast_date, warranty_months`

### 2. Uji Coba Validasi (Dry Run)
Jalankan validasi tanpa menulis ke database:
```bash
npx tsx scripts/import-sheets.ts --type=vendors --file=data/templates/legacy-vendors.csv --dry-run
npx tsx scripts/import-sheets.ts --type=projects --file=data/templates/legacy-projects.csv --dry-run
```

### 3. Eksekusi Impor Riil (Commit ke MySQL)
```bash
npx tsx scripts/import-sheets.ts --type=vendors --file=data/templates/legacy-vendors.csv --execute
npx tsx scripts/import-sheets.ts --type=projects --file=data/templates/legacy-projects.csv --execute
```

---

## 🧪 Menjalankan Tes Integrasi

Rangkaian tes integrasi otomatis menguji seluruh lifecycle proyek end-to-end tanpa bergantung pada browser eksternal:

```bash
# Jalankan seluruh tes integrasi (Fase 1 s.d. Fase 5)
npx tsx --test tests/integration/*.test.ts
```

Setiap pengujian memverifikasi:
- Autentikasi aman & cookie HttpOnly.
- Generator sequence counter anti-tabrakan (`001/PPC/2026`, `001/FEO/2026/R0`).
- Validasi aturan bisnis PRD (Termin wajib 100%, catatan penjelas penurunan progres BR-09, auto-kalkulasi retensi 5% & garansi 12 bulan).
- Proteksi otorisasi RBAC (Role non-admin otomatis ditolak dengan `403 Forbidden`).
- Pencatatan log kepatuhan (Audit Trail) yang tidak dapat dimanipulasi.
- Akses halaman laporan eksekutif resmi (`/projects/[id]/report`).
