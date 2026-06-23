# Sistem Informasi Magang & Penelitian DISDIKPORA

Sistem Informasi Magang & Penelitian DISDIKPORA adalah aplikasi berbasis web yang dirancang untuk mengelola pendaftaran serta monitoring kegiatan magang (PKL) dan izin penelitian pada **Dinas Pendidikan, Kepemudaan, dan Olahraga (DISDIKPORA)**.

Aplikasi ini dikembangkan dan direfaktor sebagai bagian dari instrumen pendukung **Laporan Kerja Praktik (KP)**.

---

## Fitur Utama
1. **Pendaftaran Magang Online**: Mahasiswa/siswa dapat mendaftar magang secara mandiri melalui form online.
2. **Pendaftaran Izin Penelitian**: Form pendaftaran khusus untuk perizinan kegiatan riset/penelitian.
3. **Monitoring PKL Real-Time**: Admin dapat memantau sisa hari magang, persentase progress kegiatan, status keaktifan (Menunggu, Aktif, Alumni), serta menginput peserta baru secara manual.
4. **Manajemen Kuota Bidang**: Pembatasan kuota peserta magang di tiap bidang secara otomatis.
5. **Manajemen User Admin**: Kelola multi-admin dan hak akses panel admin.
6. **Pengaturan Akun**: Pembaruan profil dasar dan ganti kata sandi admin.

---

## Arsitektur Kode & Refaktorisasi

Projek ini menerapkan prinsip **Clean Code** dan **Separation of Concerns (SoC)** dengan memisahkan logika bisnis dari antarmuka pengguna (*Container-Presenter Pattern*):

* **Presentation Layer (UI)**: Komponen visual visualisasi tabel, form input, modal dialog, dan filter diisolasi di bawah direktori `/components/admin`.
* **Business Logic Layer (Hooks)**: State management, validasi hari kerja nasional, pencarian, dan integrasi API dipisahkan ke dalam custom hooks di bawah direktori `/hooks`.
* **Routing & Pages (Controller)**: File halaman utama di bawah `/app/admin` bertindak sebagai perakit yang sangat pendek dan modular (<150 baris kode per halaman).

Pemisahan ini mempermudah pembuatan **Bagan Struktur Komponen (Component Tree)** di Laporan KP Anda.

---

## Teknologi yang Digunakan

* **Next.js 16** – Framework React berbasis server & client (App Router)
* **TypeScript** – Type safety untuk pencegahan *runtime error*
* **Tailwind CSS** – Framework CSS berbasis utility-first
* **Prisma ORM** – Object-Relational Mapping untuk kueri database
* **Database**: MySQL Server Lokal (XAMPP / Laragon)
* **shadcn/ui** – Pustaka komponen UI berbasis Radix UI & Tailwind CSS

---

## Struktur Folder Project

```text
├── app/                  # Routing dan Halaman Utama Next.js (App Router)
│   ├── admin/            # Halaman Dashboard khusus Administrator
│   ├── api/              # Endpoint REST API (Backend routes)
│   └── ...               # Halaman publik (Daftar Magang & Penelitian)
├── components/           # Komponen UI yang reusable
│   ├── admin/            # Sub-komponen visual khusus modul admin (Presenter)
│   └── ui/               # Komponen dasar shadcn/ui
├── hooks/                # Custom hooks penampung Logika Bisnis & State (Container)
├── lib/                  # Helper utilitas & konfigurasi Prisma Client
├── prisma/               # Skema database & script semai data (seed)
├── public/               # File aset statis (gambar, logo, file surat)
├── .env                  # Konfigurasi variabel lingkungan (database URL)
├── package.json          # Dependency project
└── README.md
```

---

## Cara Menjalankan Project Secara Lokal

Ikuti langkah-langkah berikut untuk menjalankan aplikasi di lingkungan komputer lokal Anda:

### 1. Kloning / Buka Direktori Project
Pastikan Anda berada di direktori utama sistem informasi magang:
```bash
cd sistem-magang-1
```

### 2. Nyalakan Database MySQL Lokal
1. Buka aplikasi **XAMPP Control Panel** atau **Laragon**.
2. Start modul **Apache** dan **MySQL**.
3. Buat database baru bernama `sistem_magang` di phpMyAdmin (`http://localhost/phpmyadmin`).

### 3. Konfigurasi Environment Variables
Buka file `.env` di root direktori project, sesuaikan URL koneksi database lokal Anda:
```env
DATABASE_URL="mysql://root:@localhost:3306/sistem_magang"
```
*(kosongkan password setelah `root:` jika MySQL lokal XAMPP Anda tidak menggunakan password).*

### 4. Instalasi Dependensi
Jalankan perintah berikut untuk menginstal package yang dibutuhkan:
```bash
npm install
```

### 5. Sinkronisasi Skema Database & Seeding
Jalankan perintah dari Prisma ORM untuk memigrasikan struktur tabel dan mengisi data kuota bawaan serta akun admin:
```bash
# Push skema tabel ke MySQL lokal
npx prisma db push

# Isi data kuota posisi & akun admin bawaan
npx prisma db seed
```

### 6. Jalankan Server Development
Nyalakan server development lokal:
```bash
npm run dev
```
Akses aplikasi melalui browser Anda pada alamat `http://localhost:3000`.

---

## Kredensial Administrator Bawaan

Gunakan akun berikut untuk login ke halaman Dashboard Admin (`http://localhost:3000/admin/login`):

* **Username**: `admin`
* **Password**: `password123`
*(Anda dapat memperbarui profil dan mengubah password ini langsung di halaman menu **Pengaturan** setelah login).*