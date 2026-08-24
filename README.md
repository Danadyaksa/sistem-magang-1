# Sistem Informasi Magang & Penelitian DISDIKPORA DIY

Sistem Informasi Magang & Penelitian adalah aplikasi berbasis web untuk mengelola pendaftaran, seleksi berkas, pembagian kuota bidang, dan monitoring kegiatan Praktik Kerja Lapangan (PKL) serta izin penelitian pada Dinas Pendidikan, Pemuda, dan Olahraga (DISDIKPORA) Daerah Istimewa Yogyakarta.

Aplikasi ini dibangun menggunakan Next.js (App Router), Prisma ORM, Tailwind CSS, dan TypeScript.

---

## Daftar Isi
- [Fitur Utama](#fitur-utama)
- [Arsitektur & Struktur Kode](#arsitektur--struktur-kode)
- [Teknologi](#teknologi)
- [Struktur Folder](#struktur-folder)
- [Panduan Instalasi & Cara Menjalankan](#panduan-instalasi--cara-menjalankan)
- [Akun Admin Bawaan](#akun-admin-bawaan)
- [Daftar Endpoint API](#daftar-endpoint-api)
- [Troubleshooting](#troubleshooting)
- [Pengembang](#pengembang)

---

## Fitur Utama

### 1. Halaman Publik
* **Landing Page (`/`)**: Menampilkan informasi umum dan grafik sisa kuota penempatan per bidang secara real-time.
* **Pendaftaran Magang Online (`/daftar`)**:
  * **Mahasiswa**: Form pendaftaran mandiri dengan upload berkas CV dan Surat Pengantar (PDF maksimal 300KB).
  * **SMK (Kolektif)**: Form pendaftaran sekolah dengan input guru pembimbing serta penambahan data siswa secara dinamis (1 sampai 4 siswa).
  * **Kalkulator Durasi Magang**: Menghitung tanggal selesai magang secara otomatis berdasarkan minimal 44 hari kerja (tidak menghitung hari Sabtu, Minggu, dan hari libur nasional).
* **Pendaftaran Izin Penelitian (`/daftar-penelitian`)**: Form digital untuk pengajuan izin riset (Skripsi, Tesis, Disertasi, dan lainnya).

### 2. Panel Admin (`/admin/*`)
* **Autentikasi & Keamanan**: Login admin menggunakan proteksi JWT via Next.js Middleware dan enkripsi password bcrypt.
* **Dashboard (`/admin/dashboard`)**: Manajemen data kuota bidang, daftar UPT, hari libur nasional, dan aturan minimal hari magang.
* **Verifikasi Pelamar (`/admin/applicants`)**:
  * Melihat dan mengecek berkas PDF pelamar.
  * Mengubah status pelamar (Diterima / Ditolak) serta menentukan penempatan bidang.
  * Fitur kirim notifikasi langsung yang mengarahkan ke WhatsApp Web atau email dengan template pesan otomatis.
* **Monitoring PKL (`/admin/pkl`)**:
  * Memantau sisa hari magang, progress kegiatan, dan status keaktifan peserta.
  * Form input manual (`PklManualDialog`) untuk memasukkan data siswa yang mendaftar secara offline.
* **Manajemen Penelitian & Ekspor Excel (`/admin/penelitian`)**: Mengelola pengajuan riset dan fitur ekspor laporan ke format Excel (.xlsx) langsung dari browser menggunakan pustaka exceljs dan file-saver.
* **Manajemen Admin (`/admin/users`)**: Tambah, edit, dan hapus akun administrator.
* **Pengaturan Akun (`/admin/pengaturan`)**: Ganti username, jabatan, dan ubah password admin.

---

## Arsitektur & Struktur Kode

Proyek ini memisahkan logika aplikasi dan tampilan antarmuka:

* **Tampilan (Presentation)**: Komponen tabel, form, modal, dan dialog diletakkan di dalam folder `components/admin/`.
* **Logika Bisnis (Custom Hooks)**: Seluruh fungsi data fetching, kalkulasi tanggal, dan state management dipisahkan ke dalam folder `hooks/`.
* **Proteksi Rute**: Menggunakan file `middleware.ts` untuk memvalidasi cookie sesi admin sebelum halaman `/admin/*` dapat diakses.
* **Ekspor Excel di Browser**: Pembuatan file Excel diproses langsung di sisi client (browser) sehingga tidak membebani server database.

---

## Teknologi

| Komponen | Teknologi |
| :--- | :--- |
| Framework | Next.js 16 (App Router) |
| Bahasa | TypeScript 5 |
| Styling & UI | Tailwind CSS v4, shadcn/ui, Radix UI, Lucide Icons |
| Form & Validasi | React Hook Form, Zod |
| Database & ORM | MySQL, Prisma ORM 5 |
| Keamanan | jose (JWT), bcryptjs |
| Spreadsheet | ExcelJS, FileSaver.js |
| Toast Notifikasi | Sonner |

---

## Struktur Folder

```text
sistem-magang-1/
├── app/                          # Routing dan halaman Next.js (App Router)
│   ├── admin/                    # Halaman panel admin
│   │   ├── applicants/           # Halaman verifikasi berkas pelamar
│   │   ├── dashboard/            # Halaman dashboard data master
│   │   ├── login/                # Halaman login admin
│   │   ├── penelitian/           # Halaman kelola penelitian & ekspor Excel
│   │   ├── pengaturan/           # Halaman edit profil & password
│   │   ├── pkl/                  # Halaman monitoring PKL & input manual
│   │   └── users/                # Halaman kelola akun admin
│   ├── api/                      # Endpoint REST API backend
│   │   ├── admins/               # API kelola akun admin
│   │   ├── auth/                 # API login, logout, dan cek sesi
│   │   ├── holidays/             # API data hari libur nasional
│   │   ├── pendaftaran/          # API data pendaftaran magang
│   │   ├── penelitian/           # API data pengajuan penelitian
│   │   ├── positions/            # API kuota posisi bidang
│   │   ├── settings/             # API pengaturan konfigurasi
│   │   └── upt/                  # API data unit pelaksana teknis
│   ├── daftar/                   # Halaman pendaftaran magang publik
│   ├── daftar-penelitian/        # Halaman pendaftaran izin penelitian publik
│   ├── layout.tsx                # Layout utama aplikasi
│   └── page.tsx                  # Landing page
├── components/                   # Komponen UI
│   ├── admin/                    # Komponen khusus panel admin
│   └── ui/                       # Komponen dasar shadcn/ui
├── hooks/                        # Custom React Hooks (logika & data fetching)
├── lib/                          # Inisialisasi Prisma client dan utilitas
├── prisma/                       # Skema database dan seeder data
│   ├── schema.prisma             # Model database
│   └── seed.ts                   # Data default kuota dan admin
├── public/                       # Aset statis dan folder upload berkas
├── middleware.ts                 # Middleware pengecekan login admin
├── .env                          # Konfigurasi database URL
├── package.json                  # Daftar dependensi
└── README.md                     # Dokumentasi proyek
```

---

## Panduan Instalasi & Cara Menjalankan

Langkah-langkah untuk menjalankan aplikasi di komputer lokal:

### 1. Prasyarat
* Node.js (minimal versi 18)
* MySQL (bisa melalui XAMPP atau Laragon)
* NPM

### 2. Buka Folder Proyek
Buka terminal dan masuk ke folder proyek:
```bash
cd "d:\IF23\KP DISDIKPORA\sistem-magang-1"
```

### 3. Nyalakan Database MySQL
1. Buka XAMPP Control Panel atau Laragon.
2. Nyalakan service MySQL.
3. Buat database baru di phpMyAdmin (`http://localhost/phpmyadmin`) dengan nama `sistem_magang`.

### 4. Konfigurasi File .env
Buat atau pastikan file `.env` di root proyek berisi baris berikut:
```env
DATABASE_URL="mysql://root:@localhost:3306/sistem_magang"
JWT_SECRET="disdikpora-diy-rahasia-magang-2026"
```
*(Sesuaikan password setelah `root:` jika MySQL lokal Anda memiliki password).*

### 5. Install Dependensi
Jalankan perintah berikut:
```bash
npm install
```

### 6. Migrasi Database dan Seeding Data
Jalankan Prisma untuk membuat tabel di database MySQL dan mengisi data awal (kuota posisi dan akun admin):
```bash
# Membuat tabel di database
npx prisma db push

# Mengisi data default
npx prisma db seed
```

### 7. Jalankan Server Development
Jalankan aplikasi dengan perintah:
```bash
npm run dev
```

Buka browser dan akses halaman berikut:
* **Halaman Utama / Landing Page**: http://localhost:3000
* **Pendaftaran Magang**: http://localhost:3000/daftar
* **Pendaftaran Penelitian**: http://localhost:3000/daftar-penelitian
* **Login Admin**: http://localhost:3000/admin/login

---

## Akun Admin Bawaan

Setelah proses seed selesai, gunakan akun ini untuk login ke panel admin:

* **URL Login**: http://localhost:3000/admin/login
* **Username**: `admin`
* **Password**: `password123`

*(Username dan password bisa diganti di halaman Pengaturan setelah login).*

---

## Daftar Endpoint API

### 1. Autentikasi
* `POST /api/auth/login` - Login admin dan membuat cookie sesi JWT
* `POST /api/auth/logout` - Logout dan menghapus cookie sesi
* `GET /api/auth/me` - Mengambil data admin yang sedang login

### 2. Pendaftaran Magang
* `GET /api/pendaftaran` - Mengambil list data pendaftar magang
* `POST /api/pendaftaran` - Membuat data pendaftaran magang baru
* `PATCH /api/pendaftaran/[id]` - Mengubah status pelamar (ACCEPTED/REJECTED)
* `DELETE /api/pendaftaran/[id]` - Menghapus data pendaftar

### 3. Izin Penelitian
* `GET /api/penelitian` - Mengambil list data izin penelitian
* `POST /api/penelitian` - Mengirim form pengajuan penelitian baru
* `PATCH /api/penelitian/[id]` - Mengubah status verifikasi penelitian
* `DELETE /api/penelitian/[id]` - Menghapus data penelitian

### 4. Master Data
* `GET /api/positions` | `POST /api/positions` | `PATCH /api/positions/[id]` - Data kuota bidang
* `GET /api/upt` | `POST /api/upt` | `DELETE /api/upt/[id]` - Data UPT
* `GET /api/holidays` | `POST /api/holidays` | `DELETE /api/holidays/[id]` - Data hari libur
* `GET /api/settings` | `POST /api/settings` - Pengaturan sistem
* `GET /api/admins` | `POST /api/admins` | `DELETE /api/admins/[id]` - Data akun admin

---

## Troubleshooting

| Masalah | Solusi |
| :--- | :--- |
| **Error Database (P1001 / P1003)** | Pastikan service MySQL di XAMPP sudah menyala dan database `sistem_magang` sudah dibuat. |
| **Port 3000 bentrok** | Jalankan di port lain dengan perintah `npm run dev -- -p 3001`. |
| **Gagal login admin** | Jalankan ulang perintah `npx prisma db seed` untuk mengisi akun admin ke database. |
| **Ukuran file ditolak di form** | Pastikan file PDF yang diupload berukuran maksimal 300KB. |

---

## Pengembang

Dikembangkan oleh **Mohammad Atilla Danadyaksa** dan **Muhammad Bintang Alkautsar** untuk Kerja Praktik (KP) UPN Veteran Yogyakarta di Dinas Pendidikan, Pemuda, dan Olahraga DIY.