# Sistem Informasi Magang & Penelitian (SIP-MAGANG) DISDIKPORA DIY

Aplikasi web modern untuk manajemen pendaftaran, seleksi berkas, alokasi kuota bidang, dan monitoring kegiatan Praktik Kerja Lapangan (PKL) serta izin riset/penelitian pada **Dinas Pendidikan, Pemuda, dan Olahraga (DISDIKPORA) Daerah Istimewa Yogyakarta**.

Dikembangkan dengan arsitektur **Next.js App Router**, **Prisma ORM**, **Tailwind CSS**, dan **TypeScript**, mengimplementasikan prinsip *Clean Code* (*Container-Presenter Pattern*) serta pemrosesan dokumen secara *client-side*.

---

## 📌 Daftar Isi
- [Fitur Utama](#-fitur-utama)
- [Arsitektur & Pola Desain](#-arsitektur--pola-desain)
- [Teknologi yang Digunakan](#-teknologi-yang-digunakan)
- [Struktur Direktori](#-struktur-direktori)
- [Panduan Instalasi & Menjalankan Aplikasi](#-panduan-instalasi--menjalankan-aplikasi)
- [Akun Administrator Default](#-akun-administrator-default)
- [Dokumentasi Endpoint REST API](#-dokumentasi-endpoint-rest-api)
- [Pemecahan Masalah (Troubleshooting)](#-pemecahan-masalah-troubleshooting)

---

## ✨ Fitur Utama

### 🌐 1. Portal Publik (Calon Pemohon Magang & Riset)
* **Landing Page Interaktif (`/`)**: Visualisasi grafik ketersediaan sisa kuota penempatan per bidang secara *real-time* sebelum mendaftar.
* **Pendaftaran Magang Online (`/daftar`)**:
  * **Alur Mahasiswa (Mandiri)**: Pengisian data diri, universitas, durasi, serta unggah berkas CV dan Surat Pengantar resmi (PDF maks. 300KB).
  * **Alur SMK (Kolektif/Batch)**: Pengisian identitas sekolah, guru pembimbing, dan pendaftaran siswa kolektif secara dinamis (**1 hingga 4 siswa** sekaligus).
  * **Kalkulator Masa Magang Otomatis**: Menghitung estimasi tanggal selesai kerja praktik berdasarkan durasi minimal (default 44 hari kerja aktif) dengan mengecualikan hari Sabtu, Minggu, dan Hari Libur Nasional secara otomatis.
* **Pendaftaran Izin Penelitian (`/daftar-penelitian`)**: Formulir digital pengajuan izin riset akademis (Skripsi, Tesis, Disertasi, dan Lainnya) secara *paperless*.

### 🔒 2. Panel Kendali Administrator (`/admin/*`)
* **Autentikasi & Keamanan Sesi**: Dilindungi oleh *Edge Middleware* dengan enkripsi token JWT dan enkripsi kata sandi berbasis *bcrypt*.
* **Dashboard Master Data (`/admin/dashboard`)**: Manajemen data master kuota bidang, daftar lokasi UPT wilayah, kalender hari libur nasional, dan parameter durasi minimal magang.
* **Verifikasi Berkas Pelamar (`/admin/applicants`)**:
  * Evaluasi berkas fisik PDF pemohon secara langsung.
  * Aksi persetujuan (`ACCEPTED`) dengan alokasi penempatan bidang atau penolakan (`REJECTED`).
  * **Integrasi Notifikasi Instan**: Merakit draf pesan konfirmasi otomatis untuk diteruskan ke WhatsApp Web (`wa.me`) dan klien email (`mailto:`).
* **Monitoring & Entri Manual PKL (`/admin/pkl`)**:
  * Pemantauan sisa hari aktif, persentase progres kegiatan, dan status keaktifan peserta magang.
  * **Entri Data Luring (Offline)**: Modal dialog pop-up (`PklManualDialog`) untuk mendaftarkan siswa secara langsung menggunakan `FormData` multipart.
* **Manajemen Izin Penelitian & Ekspor Excel (`/admin/penelitian`)**: Pengelolaan status riset serta fitur **Ekspor Laporan Spreadsheet (.xlsx)** yang diproses secara instan di sisi klien (*client-side*) menggunakan pustaka `exceljs` dan `file-saver`.
* **Manajemen Pengguna Admin (`/admin/users`)**: Operasi CRUD (Create, Read, Update, Delete) akun pengelola sistem.
* **Pengaturan Profil & Kredensial (`/admin/pengaturan`)**: Pembaruan profil identitas (username, jabatan) dan pembaruan kata sandi admin yang aman.

---

## 🏗️ Arsitektur & Pola Desain

Aplikasi ini menerapkan standar **Clean Architecture** dan pemisahan tanggung jawab (**Separation of Concerns / SoC**):

```
┌───────────────────────────────────────────────────────────┐
│                    PAGE ROUTE (Controller)                │
│             /app/admin/applicants/page.tsx                │
└─────────────────────────────┬─────────────────────────────┘
                              │
            ┌─────────────────┴─────────────────┐
            ▼                                   ▼
┌───────────────────────┐           ┌───────────────────────┐
│  BUSINESS LOGIC HOOK  │           │   PRESENTATION (UI)   │
│  useApplicants.ts     │           │   ApplicantTable.tsx  │
│  - State Management   │           │   - Pure Components   │
│  - API Data Fetching  │           │   - Dialogs & Modals  │
│  - Form & Validation  │           │   - Filters & Tables  │
└───────────┬───────────┘           └───────────────────────┘
            │
            ▼
┌───────────────────────┐
│    REST API ROUTE     │
│  /api/pendaftaran     │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│   PRISMA ORM & MYSQL  │
│   Database Layer      │
└───────────────────────┘
```

1. **Presentation Layer (Presenter)**: Komponen visual murni diisolasi di folder `components/admin/` untuk kemudahan *maintenance* dan pengujian UI.
2. **Business Logic Layer (Container)**: Seluruh pemrosesan logika, kueri API, kalkulasi tanggal kerja, dan *state* dikelola melalui *custom hooks* di folder `hooks/`.
3. **Edge Route Protection**: Berkas `middleware.ts` memproteksi seluruh rute `/admin/*` di level jaringan terluar Next.js.
4. **Client-Side Export Processing**: Fitur ekspor Excel dijalankan di peramban klien tanpa membebani beban kueri server atau CPU backend.

---

## 💻 Teknologi yang Digunakan

| Kategori | Teknologi | Deskripsi |
| :--- | :--- | :--- |
| **Framework Utama** | Next.js 16 (App Router) | Framework React Fullstack berbasis Server Components & Client Hooks |
| **Bahasa Pemrograman** | TypeScript 5 | Superset JavaScript untuk type-safety |
| **Styling & UI** | Tailwind CSS v4 & shadcn/ui | Utilitas styling modern berbasis Radix UI & Lucide Icons |
| **Form & Validasi** | React Hook Form & Zod | Manajemen state form dan validasi skema deklaratif |
| **ORM & Database** | Prisma ORM 5 & MySQL | Manajemen pemodelan data relasional dan database SQL |
| **Autentikasi & Keamanan** | jose (JWT) & bcryptjs | Tokenisasi sesi dan enkripsi kata sandi (Salt Rounds 10) |
| **Pemrosesan Spreadsheet** | ExcelJS & FileSaver.js | Generator berkas laporan Excel `.xlsx` di sisi peramban |
| **Notifikasi UI** | Sonner | Komponen Toast notification interaktif |

---

## 📁 Struktur Direktori

```text
sistem-magang-1/
├── app/                          # File-system routing Next.js (App Router)
│   ├── admin/                    # Halaman-halaman panel kendali administrator
│   │   ├── applicants/           # Verifikasi berkas pelamar magang
│   │   ├── dashboard/            # Dashboard master data (kuota, UPT, libur)
│   │   ├── login/                # Halaman login administrator
│   │   ├── penelitian/           # Kelola riset & ekspor Excel
│   │   ├── pengaturan/           # Edit profil & ganti password
│   │   ├── pkl/                  # Monitoring PKL & entri luring
│   │   └── users/                # CRUD akun admin pengelola
│   ├── api/                      # REST API Endpoints (Backend)
│   │   ├── admins/               # Endpoint akun administrator
│   │   ├── auth/                 # Endpoint login, logout, & sesi
│   │   ├── holidays/             # Endpoint master hari libur
│   │   ├── pendaftaran/          # Endpoint transaksi data magang
│   │   ├── penelitian/           # Endpoint transaksi data riset
│   │   ├── positions/            # Endpoint kuota posisi bidang
│   │   ├── settings/             # Endpoint konfigurasi sistem
│   │   └── upt/                  # Endpoint data unit pelaksana teknis
│   ├── daftar/                   # Halaman publik pendaftaran magang
│   ├── daftar-penelitian/        # Halaman publik pengajuan izin riset
│   ├── layout.tsx                # Root layout antarmuka aplikasi
│   └── page.tsx                  # Landing page publik & grafik kuota
├── components/                   # Komponen antarmuka yang dapat digunakan ulang
│   ├── admin/                    # Komponen visual presenter panel admin
│   │   ├── AdminHeader.tsx       # Bilah atas & profil admin
│   │   ├── AdminSidebar.tsx      # Bilah navigasi samping
│   │   ├── AdminUserTable.tsx    # Tabel & dialog kelola admin
│   │   ├── ApplicantTable.tsx    # Tabel verifikasi & modal detail pelamar
│   │   ├── PenelitianTable.tsx   # Tabel riset & tombol ekspor
│   │   ├── PklManualDialog.tsx   # Dialog form input magang kolektif offline
│   │   └── PklTable.tsx          # Tabel monitoring sisa hari & progres PKL
│   └── ui/                       # Komponen atomik shadcn/ui (Button, Dialog, dll)
├── hooks/                        # Custom React Hooks (Business Logic Container)
│   ├── useAdminDashboard.ts      # Logika dashboard master data
│   ├── useAdminUsers.ts          # Logika CRUD akun admin
│   ├── useApplicants.ts          # Logika verifikasi berkas & notifikasi WA/Email
│   ├── usePenelitian.ts          # Logika perizinan riset & ekspor Excel
│   ├── usePkl.ts                 # Logika monitoring & entri manual FormData
│   └── useSettings.ts            # Logika pembaruan password & profil
├── lib/                          # Pustaka pembantu & inisialisasi Prisma Client
├── prisma/                       # Konfigurasi basis data
│   ├── schema.prisma             # Skema model entitas basis data
│   └── seed.ts                   # Skrip pengisian data bawaan (seeder)
├── public/                       # Aset berkas statis (gambar, ikon, berkas upload)
├── middleware.ts                 # Proteksi rute admin berbasis Edge JWT
├── .env                          # Konfigurasi variabel lingkungan (Database URL)
├── package.json                  # Konfigurasi dependensi project
└── README.md                     # Dokumentasi panduan project
```

---

## 🚀 Panduan Instalasi & Menjalankan Aplikasi

Ikuti langkah-langkah terstruktur di bawah ini untuk menjalankan aplikasi di komputer lokal:

### 1. Prasyarat Sistem
Pastikan perangkat Anda telah terpasang perangkat lunak berikut:
* **Node.js**: Versi `18.17.0` atau yang lebih baru ([Unduh Node.js](https://nodejs.org/))
* **NPM**: Paket manajer bawaan Node.js
* **Database MySQL**: Melalui **XAMPP Control Panel**, **Laragon**, atau **MySQL Server lokal**.
* **Web Browser**: Google Chrome, Mozilla Firefox, atau Microsoft Edge.

---

### 2. Kloning / Buka Direktori Project
Buka terminal (PowerShell / Command Prompt / Git Bash), lalu arahkan ke folder proyek:
```bash
cd "d:\IF23\KP DISDIKPORA\sistem-magang-1"
```

---

### 3. Menyalakan Database MySQL Lokal
1. Buka aplikasi **XAMPP Control Panel** (atau Laragon).
2. Klik tombol **Start** pada modul **Apache** dan **MySQL**.
3. Buka peramban dan akses phpMyAdmin pada: `http://localhost/phpmyadmin`.
4. Buat database baru bernama: `sistem_magang` (dengan collation *utf8mb4_general_ci*).

---

### 4. Konfigurasi Variabel Lingkungan (`.env`)
Pastikan berkas `.env` pada *root* direktori telah dikonfigurasi dengan kredensial database Anda:
```env
DATABASE_URL="mysql://root:@localhost:3306/sistem_magang"
JWT_SECRET="disdikpora-diy-rahasia-magang-2026"
```
> **Catatan**: Jika MySQL Anda menggunakan password, sesuaikan formatnya menjadi `mysql://root:password_anda@localhost:3306/sistem_magang`.

---

### 5. Instalasi Dependensi
Jalankan perintah berikut untuk mengunduh dan memasang seluruh paket dependensi:
```bash
npm install
```

---

### 6. Sinkronisasi Skema Database & Seeding Data Awal
Jalankan Prisma ORM untuk membuat struktur tabel di MySQL dan mengisi data master bawaan (kuota posisi bidang dan akun admin utama):

```bash
# 1. Terapkan skema model Prisma ke MySQL
npx prisma db push

# 2. Jalankan seeding (membuat data kuota bidang & akun admin default)
npx prisma db seed
```

---

### 7. Menjalankan Server Development
Jalankan aplikasi pada mode pengembangan (*development mode*):
```bash
npm run dev
```

Buka peramban dan akses alamat berikut:
* **Portal Publik (Landing Page)**: [http://localhost:3000](http://localhost:3000)
* **Portal Pendaftaran Magang**: [http://localhost:3000/daftar](http://localhost:3000/daftar)
* **Portal Pendaftaran Penelitian**: [http://localhost:3000/daftar-penelitian](http://localhost:3000/daftar-penelitian)
* **Panel Administrator (Login)**: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)

---

## 🔑 Akun Administrator Default

Setelah proses *seeding* dijalankan, gunakan akun berikut untuk masuk ke panel admin:

* **URL Login**: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)
* **Username**: `admin`
* **Password**: `password123`

*(Anda dapat memperbarui nama pengguna dan kata sandi pada menu **Pengaturan** di dalam panel admin).*

---

## 📡 Dokumentasi Endpoint REST API

Berikut adalah daftar endpoint API backend yang disediakan oleh aplikasi:

### 1. Autentikasi (`/api/auth`)
* `POST /api/auth/login` – Melakukan verifikasi kredensial dan menerbitkan cookie sesi JWT.
* `POST /api/auth/logout` – Menghapus cookie sesi `admin_session`.
* `GET /api/auth/me` – Mengambil informasi profil admin yang sedang aktif.

### 2. Pendaftaran Magang & PKL (`/api/pendaftaran`)
* `GET /api/pendaftaran` – Mengambil seluruh data pengajuan magang (dapat difilter berdasarkan status `PENDING`, `ACCEPTED`, `REJECTED`).
* `POST /api/pendaftaran` – Mendaftarkan permohonan magang baru (mendukung *JSON* dan *Multipart FormData*).
* `PATCH /api/pendaftaran/[id]` – Memperbarui status persetujuan pelamar dan penempatan kuota bidang.
* `DELETE /api/pendaftaran/[id]` – Menghapus data pendaftar magang.

### 3. Izin Penelitian (`/api/penelitian`)
* `GET /api/penelitian` – Mengambil daftar seluruh permohonan izin penelitian.
* `POST /api/penelitian` – Mengirimkan formulir pengajuan izin riset baru.
* `PATCH /api/penelitian/[id]` – Memperbarui status persetujuan penelitian.
* `DELETE /api/penelitian/[id]` – Menghapus data permohonan penelitian.

### 4. Master Data & Konfigurasi
* `GET /api/positions` | `POST /api/positions` | `PATCH /api/positions/[id]` – Kelola kuota dan nama bidang magang.
* `GET /api/upt` | `POST /api/upt` | `DELETE /api/upt/[id]` – Kelola daftar unit pelaksana teknis dinas.
* `GET /api/holidays` | `POST /api/holidays` | `DELETE /api/holidays/[id]` – Kelola penanggalan hari libur nasional.
* `GET /api/settings` | `POST /api/settings` – Konfigurasi parameter operasional sistem.
* `GET /api/admins` | `POST /api/admins` | `DELETE /api/admins/[id]` – Operasi CRUD pengelola administrator.

---

## 🛠️ Pemecahan Masalah (Troubleshooting)

| Kendala | Penyebab Umum | Solusi |
| :--- | :--- | :--- |
| **Prisma Error P1001 / P1003** | Modul MySQL di XAMPP belum aktif atau database belum dibuat. | Pastikan modul MySQL di XAMPP telah berstatus **Running** dan database `sistem_magang` sudah dibuat di phpMyAdmin. |
| **Error `npm run dev` (Port 3000 in use)** | Port 3000 sedang digunakan oleh aplikasi lain. | Matikan proses yang berjalan di port 3000 atau jalankan `npm run dev -- -p 3001`. |
| **Gagal Login Administrator** | Data admin belum terisi ke basis data. | Jalankan perintah `npx prisma db seed` pada terminal. |
| **Ukuran Berkas Ditolak di Form** | Berkas PDF yang diunggah lebih dari 300KB. | Unggah berkas dokumen PDF yang telah dikompresi di bawah 300KB sesuai skema validasi sistem. |

---

## 📄 Lisensi & Hak Cipta
Dikembangkan oleh **M. Atilla Danadyaksa** (NIM: 123230134) sebagai bagian dari Laporan Kerja Praktik Program Studi Informatika, Fakultas Teknik Industri, Universitas Pembangunan Nasional "Veteran" Yogyakarta pada **Dinas Pendidikan, Pemuda, dan Olahraga Daerah Istimewa Yogyakarta**.