# DESIGN — Facility Management (v2: gaya terang, mengacu pada referensi "Synchro")

Panduan desain UI/UX untuk website Facility Management. Pasangan dari `prd.md`.

> **Revisi 2.0.** Tema diganti dari gelap-teal menjadi **terang, netral, bertombol hitam**, dengan sidebar abu muda berisi blok profil, tombol buat, menu beranda, bagian "Favourite", dan "Help Center" di dasar, mengikuti screenshot referensi.
>
> **Catatan akurasi.** Nilai warna, ukuran, dan font diperkirakan dari screenshot referensi. Gunakan color picker pada gambar aslinya bila ingin lebih presisi, lalu ubah token di Bagian 3.

---

## 1. Prinsip Desain

1. **Putih, tenang, tipis.** Latar putih, pemisah berupa garis abu 1 px, nyaris tanpa bayangan.
2. **Hitam sebagai aksi utama.** Satu tombol hitam per layar untuk aksi terpenting; sisanya putih dengan garis tepi.
3. **Warna hanya untuk makna.** Pastel lembut (merah, hijau, biru, kuning) khusus untuk status, tag, dan orang; selebihnya skala abu.
4. **Properti berbentuk daftar.** Detail proyek ditampilkan sebagai baris "ikon + label ... nilai", bukan formulir besar.
5. **Padat tetapi lega.** Teks 13–14 px, jarak antarbaris 12–16 px, sudut membulat 8–12 px.
6. **Desktop dan HP setara.** Semua layar nyaman di 360 px.

## 2. Arsitektur Informasi dan Navigasi

### 2.1 Struktur sidebar (mengikuti referensi)

```
┌─────────────────────────────┐
│ [Avatar] Priyo         [▯]  │  ← blok profil: nama, username/peran, tombol collapse
│          priyo · ENGINEERING│
├─────────────────────────────┤
│ [ + Create New        ▾ ]   │  ← tombol HITAM lebar penuh (menu aksi sesuai peran)
├─────────────────────────────┤
│ ▦  Dashboard                │
│ ☑  My Tasks                 │  ← item aktif: latar abu, ikon terisi
│ ✉  Inbox                 5  │  ← badge jumlah (overdue + due soon + mention)
│ ⌕  Project Search           │
│ ◎  PPC Requests             │
│ ✎  Engineering              │
│ ⛁  Procurement              │
│ ⚑  Project                  │
│ ⌂  Operations               │
│ ★  Vendor Performance       │
│ ⚙  Admin › Users            │  ← hanya ADMIN
├─────────────────────────────┤
│ ⌃ Pinned Projects   ⋯  +    │  ← setara "Favourite": bagian lipat/buka
│ ≡  Perbaikan Hoist Crane…   │
│ ≡  Rehab Chiller Gedung B   │
│ ≡  …                        │
│                             │
│ (spasi fleksibel)           │
├─────────────────────────────┤
│ Help Center             (?) │  ← dasar sidebar
└─────────────────────────────┘
```

Pemetaan terhadap fitur yang sudah ada di PRD:

| Elemen referensi | Padanan di Facility Management | Status di PRD |
|---|---|---|
| Blok profil (avatar, nama, email) | Avatar inisial, nama lengkap, `username · PERAN`; klik membuka menu: My Account, Sign out | Ada (My Account, Sign out) |
| Tombol **Create Task** hitam | **+ Create New** → menu: New PPC Request, New Tender Document, New Vendor, New Review (hanya yang boleh sesuai peran) | Sebagian ada (New Tender Document) |
| Dashboard | Dashboard | Ada |
| My Task | **My Tasks** = semua item yang ditugaskan ke saya (menggeneralisasi "Assigned to me" di Engineering) | 🟡 Baru, perlu ditambah ke PRD |
| Inbox + badge | **Inbox** = notifikasi (ditugaskan, overdue, due ≤ 7 hari) | Sebagian (FR-NTF-01) |
| Reporting | Laporan dan Report PDF per proyek | Sebagian (FR-PS-06) |
| Portfolio | Project Search | Ada |
| Accounts | My Account (di menu profil) | Ada |
| Goals | Tidak dipakai | — |
| **Favourite** (+ daftar) | **Pinned Projects**: proyek yang disematkan user untuk akses cepat | 🟡 Baru, perlu ditambah ke PRD |
| Help Center | Help Center: panduan singkat, kontak admin | 🟡 Baru (P2) |

Aturan: menu ditampilkan sesuai peran (matriks PRD Bagian 4). Item aktif: **latar abu muda, teks lebih tebal, ikon terisi**. Bagian "Pinned Projects" dapat dilipat, tombol `⋯` untuk kelola, `+` untuk menyematkan proyek. Item menu yang belum dibangun disembunyikan (jangan tampil mati).

### 2.2 Topbar (di atas konten)

- Kiri: **breadcrumb** `Facility Management › Engineering › 001/FEO/2026/R0`; segmen terakhir dibungkus kotak tipis bergaris (halaman aktif).
- Kanan: kotak **pencarian** global ("Search project, tender no., PO, vendor..."), tombol ikon **Share/Export**, tombol ikon **Notifikasi** (lonceng).
- Tinggi 56 px, garis bawah 1 px abu.

### 2.3 Header halaman

Satu baris di bawah topbar: **judul halaman** (kiri), lalu di kanan: waktu "3 min ago" dengan ikon jam, tumpukan **avatar** orang terkait (PIC/engineer), tombol hitam aksi utama (mis. **+ New Tender**), dan tombol ikon `⋯` (menu lain: Export, Print, Archive).

## 3. Design Tokens

### 3.1 Warna

| Token | Nilai | Pemakaian |
|---|---|---|
| `--bg` | `#FFFFFF` | Latar konten |
| `--bg-sidebar` | `#F7F7F8` | Sidebar |
| `--bg-subtle` | `#F4F4F5` | Dropdown tag, tab container, area abu halus |
| `--bg-active` | `#EBEBED` | Item sidebar aktif, hover kuat |
| `--hover` | `#FAFAFB` | Hover baris tabel |
| `--border` | `#E4E4E7` | Garis kartu, input, tombol sekunder |
| `--border-soft` | `#EFEFF1` | Pemisah baris tabel, garis putus-putus |
| `--text` | `#111113` | Teks utama |
| `--text-muted` | `#6B6B73` | Label properti, subjudul, placeholder |
| `--text-faint` | `#9A9AA2` | Ikon nonaktif, teks tersier |
| `--primary` | `#111113` | Tombol utama (hitam) |
| `--primary-hover` | `#2A2A2E` | Hover tombol utama |
| `--on-primary` | `#FFFFFF` | Teks di tombol hitam |
| `--link` | `#3B6FD4` | Link bergaris bawah ("Download All", "Download file") |
| `--focus` | `#111113` | Cincin fokus 2 px (offset 2 px) |

**Warna semantik (pastel: latar + teks gelap untuk kontras AA)**

| Makna | Latar | Teks | Contoh |
|---|---|---|---|
| Danger / Urgent | `#FDECEC` | `#C42B2B` | Overdue, Not eligible, Urgent |
| Success | `#E3F5E8` | `#1F7A3D` | Completed, PO issued, Eligible |
| Info / In progress | `#E6EEFF` | `#2B59C3` | In progress, Vendors invited |
| Warning | `#FFF1D6` | `#8F5600` | Due soon (≤ 7 hari), Evaluation |
| Neutral | `#F1F1F3` | `#55555D` | Not started, Not rated yet, Draft |

**Warna progress:** isi `#3E7B68` (hijau tua, seperti referensi), jalur `#E4E4E7`. Overdue: isi `#D64545`.

**Warna orang (chip assignee, bergilir per user):** biru `#E6EEFF/#2B59C3`, hijau `#E3F5E8/#1F7A3D`, kuning `#FFF1D6/#8F5600`, ungu `#EFE8FD/#5B3FB5`, merah muda `#FDE8F1/#B02A66`.

### 3.2 Tipografi

| Peran | Spesifikasi |
|---|---|
| Font | **Inter** (self-host lewat `next/font`), cadangan `system-ui, -apple-system, "Segoe UI", sans-serif` |
| Judul dokumen/proyek | 24 px / 600 / line-height 1.25 |
| Judul halaman (header) | 18 px / 600 |
| Judul section ("Our Design Process") | 16–18 px / 600 |
| Body, isi tabel, nilai properti | 14 px / 400–500 |
| Menu sidebar, label properti | 13–14 px / 500 |
| Meta, badge, tab, bantuan | 12 px / 500 |
| Angka statistik (dashboard) | 28–32 px / 600, `tabular-nums` |
| Angka tabel | `font-variant-numeric: tabular-nums` |

### 3.3 Spasi, Radius, Bayangan

| Token | Nilai |
|---|---|
| Skala spasi | 4, 8, 12, 16, 20, 24, 32, 48 px |
| Radius kecil (badge, chip, dropdown tag) | 6 px |
| Radius kontrol (tombol, input, kotak pencarian) | 8 px |
| Radius kartu | 12 px |
| Radius pill (progres, avatar) | 999 px |
| Bayangan | Tidak ada pada kartu (cukup border). Popover/menu: `0 8px 24px rgba(17,17,19,.10)`. Modal: `0 20px 60px rgba(17,17,19,.18)` |
| Lebar sidebar | 260 px (desktop), 68 px (collapse), drawer 280 px (HP) |
| Tinggi topbar | 56 px |
| Lebar konten | Halaman daftar: penuh (maks 1400 px). Halaman detail: kolom tengah maks 760 px |
| Padding konten | 24–32 px |

### 3.4 Implementasi (CSS variables / Tailwind v4)

```css
:root {
  --bg:#FFFFFF; --bg-sidebar:#F7F7F8; --bg-subtle:#F4F4F5; --bg-active:#EBEBED; --hover:#FAFAFB;
  --border:#E4E4E7; --border-soft:#EFEFF1;
  --text:#111113; --text-muted:#6B6B73; --text-faint:#9A9AA2;
  --primary:#111113; --primary-hover:#2A2A2E; --on-primary:#FFFFFF;
  --link:#3B6FD4; --progress:#3E7B68; --track:#E4E4E7;
  --danger-bg:#FDECEC;  --danger:#C42B2B;
  --success-bg:#E3F5E8; --success:#1F7A3D;
  --info-bg:#E6EEFF;    --info:#2B59C3;
  --warning-bg:#FFF1D6; --warning:#8F5600;
  --neutral-bg:#F1F1F3; --neutral:#55555D;
  --r-sm:6px; --r-md:8px; --r-lg:12px;
}
html { font-family: Inter, system-ui, sans-serif; font-size: 14px; color: var(--text); background: var(--bg); }
```

Mode gelap bersifat **opsional (P2)**: balik `--bg`/`--text`, `--primary` menjadi putih dengan teks hitam, pastel menjadi versi transparan 15%.

## 4. Layout Halaman

### 4.1 Login

- **Kiri (±50%)**: latar `--bg-sidebar` dengan pola titik halus abu. Kiri atas: titik hitam kecil + **Facility Management**. Tengah: ilustrasi **jalur 5 langkah** (garis melengkung hitam tipis yang naik ke kanan), tiap langkah berupa lingkaran putih berborder hitam bernomor + ikon garis tipis: 1 Request (*Incoming letter*), 2 Engineering (*Design, BoQ, drawings*), 3 Procurement (*Vendors and PO*), 4 Execution (*Progress and payments*), 5 Handover (*Warranty and retention*); langkah selesai diberi centang hijau `#3E7B68`. Bawah: judul besar, satu kalimat deskripsi, 4 chip (*Live progress, Vendor scorecards, Staged payments, Warranty tracking*) bergaya pill putih berborder.
- **Kanan (±50%)**: latar putih, form di tengah (maks 400 px, tanpa kartu atau dengan border tipis): "Welcome back" (24 px / 600), subjudul muted, field Username, Password (tautan **Show** bergaris bawah di dalam field), tombol hitam **Sign in** lebar penuh (tinggi 44), teks bantuan muted: "Need access? Ask your administrator to create an account for you."
- **HP**: ilustrasi disembunyikan; hanya form.

### 4.2 Shell aplikasi

```
┌────────────┬─────────────────────────────────────────────────────┐
│ Sidebar    │ Topbar: breadcrumb ............ [Search…] [↗] [🔔]  │
│ (abu muda) ├─────────────────────────────────────────────────────┤
│            │ Judul halaman      ⏱ 3 min ago  (avatar) [+ New] [⋯]│
│            ├─────────────────────────────────────────────────────┤
│            │ Konten                                              │
└────────────┴─────────────────────────────────────────────────────┘
```

### 4.3 Dashboard

- Baris 1: **5 kartu statistik** (Requests, Engineering, Procurement, Project, Operations): kartu putih, border, radius 12; label muted, angka 28 px, teks "active of N · M completed" muted 12 px, progress bar tipis + `%`.
- Baris 2: **Project flow** (bar horizontal dengan isi `--progress`) dan **Vendor readiness** (badge Eligible/Not eligible/Not rated yet dengan jumlah).
- Baris 3: **Overdue** dan **Due in the next 7 days** (daftar baris: judul proyek, tahap, PIC, badge hari).
- Tombol **Refresh** berupa tombol putih bergaris di header, plus "Updated 10:42" muted.
- Empty state: kalimat netral muted di tengah kartu.

### 4.4 Project Search

- Kotak cari lebar penuh (putih, border, radius 8, ikon kaca pembesar).
- Daftar **kartu proyek**: judul 16 px / 600, meta muted (`002/PPC/2026 · TC · PIC Afrianto`), badge status dan tombol **Report** (putih, border) di kanan atas, garis progres tipis atas kartu, lalu 4 kolom tahap (PPC / Engineering / Procurement / Project), masing-masing: judul tahap, badge status, 3 baris detail muted, progress bar. Tombol **Show update history** (ghost) di bawah.
- HP: kolom tahap menjadi tumpukan vertikal.

### 4.5 Halaman detail proyek (baru, gaya "task detail" referensi)

Halaman satu proyek, kolom tengah ±760 px:

1. **Ikon proyek** dalam kotak abu 40 px.
2. **Judul** 24 px + badge status di sebelahnya (mis. `Completed`, atau `Overdue` merah).
3. **Daftar properti** (ikon abu + label muted di kiri, nilai di kanan; baris tinggi 40 px):

| Properti | Nilai (contoh) |
|---|---|
| Status | ◔ On Progress / ✓ Completed |
| Current stage | Procurement |
| Target date | 30 Oct 2026 |
| PIC | chip pastel `Afrianto ✕` + `[+]` tombol tambah bergaris putus |
| Department (dinas) | teks |
| Winner vendor | PT Dexa Energy |
| PO value | Rp 20,000,000 |
| Tags | dropdown abu `Mechanical ⌄` |
| Description | kotak teks bergaris, radius 8 |

4. **Attachment (n)** dengan tautan **Download All** (biru bergaris bawah) di kanan; kartu file horizontal (ikon tipe file berwarna, nama, ukuran, "Download file" bergaris bawah) + tombol `[+]` putus-putus.
5. Garis pemisah **putus-putus** `1px dashed var(--border-soft)`.
6. **Tab segmen** (kontainer abu, tab aktif putih berborder): `Stages` · `Comments 3` · `Activity` (= update history).
7. Tab **Stages**: judul section + progress keseluruhan di kanan ("Progress: 25%" dengan bar hijau tua); daftar tahap sebagai **kartu baris** dengan pegangan geser `⠿` di kiri (bila urutan bisa diubah), kotak centang, judul tahap, dan baris catatan kecil di dalam kotak abu muda.

### 4.6 Engineering

- Header: judul "Engineering", subjudul muted, tombol hitam **+ New Tender Document**.
- Toolbar: pencarian, dropdown **All statuses**, checkbox **Assigned to me**.
- Tabel dalam kartu border (kolom: Tender No., Project, Engineer, Start, Finish, Working Days, Progress, Status, aksi **Update progress** sebagai tombol putih bergaris).
- HP: tabel menjadi kartu.

### 4.7 Vendor Performance

- Subjudul memuat aturan skor (60/40, ≥ 70%).
- Tab segmen **Ranking** dan **Vendor Master**.
- Ranking: tabel; kolom Eligibility berisi badge pastel.
- Vendor Master: pencarian, tabel, tombol hitam **+ Add vendor**.

### 4.8 My Account

Satu kartu putih berborder: avatar, nama, `username · PERAN`; field Current Password, New Password (min. 8 disarankan); tombol hitam **Change password**.

## 5. Komponen

### 5.1 Tombol

| Varian | Gaya |
|---|---|
| Primary | Latar `--primary` (hitam), teks putih 14 px / 500, radius 8, tinggi 36 (standar), 40 (form), 44 (login). Ikon `+` di kiri teks |
| Secondary | Latar putih, border `--border`, teks `--text`; hover `--bg-subtle` |
| Ghost | Tanpa border, teks `--text`, hover `--bg-subtle` |
| Link | Teks `--link`, bergaris bawah |
| Icon button | Kotak 36 px, border `--border`, radius 8, ikon 16–18 px |
| Add (putus-putus) | Kotak 28–32 px, border `1px dashed var(--border)`, ikon `+` abu |
| Danger | Latar `--danger-bg`, teks `--danger` |
| State | hover: gelapkan/terangkan sedikit; fokus: ring 2 px `--focus` offset 2 px; disabled: opasitas 45% + `not-allowed`; loading: spinner kecil, teks tetap |

### 5.2 Input dan dropdown

Latar putih, border `--border`, radius 8, tinggi 40, teks 14 px, placeholder `--text-muted`. Fokus: border `--text` + ring halus. Error: border `--danger`, pesan 12 px merah di bawah. Label 13 px / 500. Dropdown tag: latar `--bg-subtle`, radius 6, ikon chevron, tanpa border.

### 5.3 Badge dan chip

- **Badge status**: pill/kotak radius 6, teks 12 px / 500, padding 2×8, warna sesuai tabel semantik (Bagian 3.1). Ukuran kecil 11 px untuk di samping judul (mis. "Urgent").
- **Chip orang**: latar pastel, teks warna tua, tombol `✕` kecil, radius 6, tinggi 24.
- **Badge angka** (Inbox): kotak abu `--bg-active`, teks 12 px, kanan menu.

| Status | Warna |
|---|---|
| Completed, PO issued, Eligible | Success |
| In progress, Vendors invited | Info |
| Evaluation, Due soon | Warning |
| Overdue, Not eligible, Urgent | Danger |
| Not started, Not rated yet, Draft | Neutral |

### 5.4 Progress bar

Tinggi 6 px, radius pill, jalur `--track`, isi `--progress` (hijau tua). Persentase di kanan 12 px muted ("Progress : 25%"). Overdue memakai isi `#D64545`. Animasi isi 400 ms saat dimuat.

### 5.5 Kartu statistik, kartu proyek, kartu file

Putih, border `--border`, radius 12, padding 16–20, tanpa bayangan. Hover (jika bisa diklik): border `#CFCFD4`. Kartu file: tinggi 56, ikon tipe file 24 px berwarna, nama 13 px / 500, ukuran 12 px muted + tautan.

### 5.6 Tabel

Dalam kartu border radius 12. Header 12 px / 500 muted pada latar `--bg` (atau `--bg-sidebar`), baris tinggi 52 px, pemisah `--border-soft`, hover `--hover`. Angka rata kanan/tengah. Header sticky. Kolom bisa diurutkan (ikon panah kecil).

### 5.7 Tab segmen

Kontainer `--bg-subtle`, radius 8, padding 2; tab 12–13 px / 500; **aktif**: latar putih, border `--border`, teks `--text`; tidak aktif: teks muted. Jumlah (mis. `Comments 3`) ditulis kecil di sebelah label.

### 5.8 Sidebar item

Tinggi 34 px, radius 8, padding 8×10, ikon garis 18 px + label 13–14 px / 500. Hover `--bg-active` 60%. Aktif `--bg-active`, ikon terisi, teks `--text`. Tidak aktif: teks `#3F3F46`. Header bagian ("Pinned Projects") 13 px / 500 dengan chevron lipat, tombol `⋯` dan `+` di kanan. Item proyek disematkan: ikon daftar `≡` + nama dipotong dengan elipsis.

### 5.9 Modal "Update progress"

Overlay hitam 40%; panel putih radius 12, lebar 480. Judul + nomor tender; slider 0–100 dengan input angka; textarea catatan; tombol **Cancel** (secondary) dan **Save** (primary). Fokus otomatis ke slider, `Esc` menutup, setelah simpan muncul toast.

### 5.10 Timeline (tab Activity)

Daftar vertikal: titik abu + garis tipis; tiap entri: avatar kecil, **nama**, tahap, "40% → 70%", catatan, waktu relatif (hover menampilkan tanggal lengkap).

### 5.11 Toast, empty state, skeleton

- Toast kanan atas, putih berborder dengan ikon status, 4 detik.
- Empty state: ikon abu kecil + satu kalimat muted + (opsional) tombol sekunder.
- Loading: skeleton abu `#EFEFF1` berdenyut halus, bukan spinner layar penuh.

### 5.12 Ikon

**lucide-react**, garis 1.5 px, ukuran 16–18 px, warna `--text-muted` (aktif `--text`). Ikon tipe file memakai ikon berwarna (Word biru, Figma/PDF merah, XLSX hijau).

## 6. Responsif

| Breakpoint | Perilaku |
|---|---|
| ≥ 1280 px | Sidebar 260 px tetap; 5 kartu statistik satu baris |
| 1024–1279 px | Sidebar tetap atau bisa di-collapse jadi 68 px (tombol di blok profil); kartu 3 kolom |
| 768–1023 px | Sidebar collapse otomatis (ikon saja), kartu 2 kolom |
| < 768 px | Sidebar menjadi drawer (tombol hamburger di topbar), kartu 1 kolom, tabel menjadi kartu, tombol aksi penuh lebar, target sentuh ≥ 44 px, kotak pencarian topbar jadi ikon |

## 7. Interaksi dan Gerak

- Transisi 150 ms `ease-out` untuk hover, fokus, tab, lipat sidebar (200 ms).
- Hormati `prefers-reduced-motion`.
- Tombol Refresh: ikon berputar selama memuat.
- Filter pencarian disimpan di URL (`?q=&status=`).
- Pintasan keyboard (P2): `/` fokus ke pencarian, `g d` ke Dashboard, `c` buka menu Create New.

## 8. Aksesibilitas

- Kontras teks utama ≥ 4.5:1; teks muted `#6B6B73` ≥ 4.5:1 pada putih dan pada `#F7F7F8`.
- Semua badge berpasangan dengan teks (tidak mengandalkan warna saja).
- Fokus terlihat (ring hitam 2 px) pada semua kontrol; urutan tab logis.
- Label terhubung ke input; error dibacakan lewat `aria-live="polite"`.
- Sidebar memakai `<nav aria-label="Main">`, item aktif `aria-current="page"`; modal `role="dialog"` dengan jebakan fokus.
- Ukuran teks tidak di bawah 11 px (badge), isi utama 13 px ke atas.

## 9. Konten dan Microcopy

| Konteks | Teks |
|---|---|
| Login error | "Incorrect username or password." |
| Akun terkunci | "Too many attempts. Try again in 15 minutes." |
| Password berhasil diganti | "Password updated." |
| Validasi password | "New password must be at least 8 characters." |
| Kosong: overdue | "Nothing is past its target date." |
| Kosong: due soon | "Nothing is close to its target date." |
| Kosong: vendor | "No vendor reviews yet." |
| Kosong: Inbox | "You're all caught up." |
| Kosong: Pinned Projects | "Pin a project to find it here quickly." |
| Konfirmasi penting | "This changes the project status. Continue?" |

Nada: singkat, jelas, bahasa Inggris sederhana (seperti UI saat ini). Format: tanggal `Feb 02, 2027` atau `23 Sep 2026` (pilih satu dan konsisten; usulan: `23 Sep 2026`), uang `Rp 20,000,000`, persen `100%`.

## 10. Aset yang Dibutuhkan

| Aset | Keterangan |
|---|---|
| Logo | Titik hitam + wordmark "Facility Management" (SVG); dipakai di login dan favicon |
| Ilustrasi login | Jalur 5 langkah + 5 ikon garis tipis, SVG inline monokrom dengan aksen hijau `#3E7B68` |
| Favicon | Titik hitam pada latar putih, 32/192/512 px |
| Font | Inter 400/500/600 |
| Ikon | lucide-react + ikon tipe file berwarna |
| Avatar | Foto opsional; default lingkaran dengan inisial pada warna pastel |
| Template PDF Report | Latar putih, kop (logo + nama), ringkasan proyek, tabel 4–5 tahap, riwayat; tipografi Inter |

## 11. Perubahan dari Versi 1 (gelap-teal)

| Aspek | v1 | v2 (ini) |
|---|---|---|
| Tema | Gelap | Terang |
| Warna aksi | Teal | **Hitam** |
| Aksen identitas | Kuning amber | Dihapus; aksen hanya hijau tua pada progres dan pastel semantik |
| Font | IBM Plex Sans | **Inter** |
| Sidebar | Gelap, 300 px, menu saja | Abu muda 260 px: profil, tombol Create, menu, Pinned Projects, Help Center |
| Topbar | Tidak ada | Breadcrumb, pencarian, share, notifikasi |
| Detail proyek | Hanya kartu di Project Search | Halaman detail dengan daftar properti, attachment, tab |
| Radius | 10 / 16 px | 6 / 8 / 12 px |

## 12. Checklist Serah Terima ke Developer

- [ ] Token warna dan font diverifikasi dengan referensi.
- [ ] Semua status memakai satu komponen `Badge` (variasi: danger, success, info, warning, neutral).
- [ ] Tidak ada warna hardcode di luar token.
- [ ] Satu tombol hitam utama per layar.
- [ ] Setiap halaman memiliki state: loading, empty, error, data.
- [ ] Sidebar: collapse, drawer HP, `aria-current`.
- [ ] Diuji di 360, 768, 1280 px.
- [ ] Lolos cek kontras dan navigasi keyboard.
- [ ] Microcopy sesuai Bagian 9.
- [ ] PRD diperbarui untuk fitur baru: My Tasks, Inbox, Pinned Projects, Help Center, halaman detail proyek.
