# SADA SIPD (SIPD-Penganggaran)

> **Sinkronisasi Anggaran dan Data — Sistem Informasi Manajemen, Analisis, Laporan, dan Arsip Snapshot Data Penganggaran APBD (SIPD RI)**

Aplikasi web berbasis Laravel dan React untuk menyinkronkan, mengelola, menganalisis, membandingkan, dan mengarsipkan (*snapshot posting*) data penganggaran daerah (APBD) dari SIPD RI Kemendagri secara lokal.

---

## Fitur Utama

### 1. Dashboard & Monitoring Sistem
- Ringkasan metrik keuangan APBD berdasarkan Tahun Anggaran: **Total Belanja**, **Total Pendapatan**, **Pembiayaan Netto** (Penerimaan vs Pengeluaran), dan status **Surplus / (Defisit)**.
- Visualisasi grafik anggaran (`DashboardCharts`) dan panel pemantauan sistem (`SystemMonitoringPanel`) untuk status koneksi database, riwayat sinkronisasi (`SyncLog`), log aktivitas (`ActivityLog`), serta notifikasi status data.

### 2. Sinkronisasi Data SIPD RI
- Endpoint sinkronisasi (`/api/sync-rka`, `/sync-rka`, `/wp-admin/admin-ajax.php`) untuk menerima data langsung dari ekstensi browser.
- Mendukung sinkronisasi pagu unit SKPD, master akun belanja, master sumber dana, sub kegiatan, rincian RKA, capaian program, indikator sub kegiatan, pendapatan, dan pembiayaan.

### 3. Belanja & Rincian RKA SKPD
- Penelusuran data per SKPD dan Sub-Unit hingga level **Program ➔ Kegiatan ➔ Sub Kegiatan ➔ Rekening Belanja ➔ Rincian Komponen**.
- Detail komponen RKA mencakup standar harga, koefisien, volume, satuan, sumber dana, dan pagu.
- **Cetak RKA**: Tampilan cetak standar A4 Landscape dengan pilihan mode **Rincian** dan **Paket**.

### 4. Pendapatan & Pembiayaan Daerah
- Monitoring data **Pendapatan Daerah** per SKPD beserta rincian target akun pendapatan.
- Pengelolaan data **Pembiayaan Daerah** (Penerimaan Pembiayaan / SiLPA dan Pengeluaran Pembiayaan) per SKPD.

### 5. Manajemen Snapshot: Posting & Unposting Data
- **Posting Data**: Membekukan (*freeze snapshot*) kondisi data aktif berjalan ke dalam arsip per tahapan anggaran.
- **Tahapan Anggaran Dinamis**: Tambah dan kelola tahapan anggaran (misal: *Rancangan Awal*, *Rancangan*, *RKA SKPD*, *Persetujuan Bersama*, *Penetapan APBD*, *Perubahan APBD*).
- **Posting Explorer**: Menjelajahi arsip postingan hingga level detail sub-kegiatan, pendapatan, pembiayaan, dan cetak RKA arsip.
- **Tindih & Unposting**:
  - *Tindih (Overwrite)*: Memperbarui snapshot yang sudah ada dengan data aktif terbaru.
  - *Unposting*: Memulihkan data snapshot kembali menjadi data aktif berjalan.

### 6. Laporan Kelengkapan Perubahan Perbup
- Perbandingan dan pemeriksaan kelengkapan perubahan anggaran antar sumber data (data **Live** berjalan maupun arsip **Posting**).
- Dilengkapi filter Tahun Anggaran, SKPD, dan Sumber Dana, dengan tampilan ringkasan serta hierarki tree.

### 7. Data Master, Utilitas Database & User Management
- **Master Data**: Pengelolaan **Master SKPD** (termasuk pembaruan data unit), **Master Akun**, dan **Sumber Dana**.
- **Import & Export DB**: Ekspor ringkasan/skrip SQL dan impor file SQL langsung melalui antarmuka web.
- **Pembersihan Data**: Reset data secara keseluruhan, per modul, atau per SKPD.
- **Manajemen Pengguna**: Autentikasi berbasis session serta pengelolaan akun pengguna (tambah, ubah, hapus).

---

## Tech Stack

- **Backend:** [Laravel 13](https://laravel.com/) (`^13.17`), PHP `^8.3`
- **Frontend:** [React 19](https://react.dev/) (`^19.3.1`), [Vite 8](https://vitejs.dev/) (`^8.0.0`)
- **UI & Styling:** [Tailwind CSS v4](https://tailwindcss.com/) (`^4.0.0`), [Lucide React](https://lucide.dev/) (`^1.78.0`)
- **Notifications:** [React Hot Toast](https://react-hot-toast.com/) (`^2.6.1`)
- **Database:** [MySQL](https://www.mysql.com/) / [MariaDB](https://mariadb.org/) (atau SQLite untuk pengembangan lokal)

---

## Panduan Instalasi (Development Lokal)

### Prasyarat
- PHP `>= 8.3`
- Composer
- Node.js & NPM
- MySQL / MariaDB (misalnya Laragon / XAMPP) atau SQLite

### Langkah-langkah

1. **Clone Repositori**
   ```bash
   git clone https://github.com/sakaadinugraha-eng/SIPD-Penganggaran.git
   cd SIPD-Penganggaran
   ```

2. **Install Dependensi Backend & Frontend**
   ```bash
   composer install
   npm install
   ```
   Atau gunakan skrip setup bawaan Composer:
   ```bash
   composer run setup
   ```

3. **Konfigurasi Environment**
   Salin file `.env.example` menjadi `.env`:
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```
   Sesuaikan koneksi database pada `.env` (default `.env.example` menggunakan `sqlite`; untuk MySQL gunakan konfigurasi berikut):
   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=sipd_local
   DB_USERNAME=root
   DB_PASSWORD=
   ```

4. **Migrasi Database**
   ```bash
   php artisan migrate
   ```

5. **Jalankan Aplikasi**
   - Jalankan development server (Laravel + Vite sekaligus):
     ```bash
     composer run dev
     ```
   - Atau jalankan secara terpisah:
     ```bash
     npm run dev
     php artisan serve
     ```
   - Jika menggunakan Laragon, akses melalui virtual host lokal (misal `http://sipd-local.test`).

---

## Panduan Deployment (Windows Server / Lingkungan Tanpa CLI)

Untuk server produksi yang tidak menjalankan `npm` dan `php artisan` secara langsung:

1. **Build Aset di Komputer Lokal**
   ```bash
   npm run build
   git add .
   git commit -m "build: compile assets"
   git push origin main
   ```
   Aplikasi juga sudah mendukung deteksi base URL otomatis untuk deployment di dalam subfolder (misalnya `http://<host>/sipd-local/public/`).

2. **Tarik Update di Server**
   ```bash
   git pull origin main
   ```
   Aset React hasil kompilasi di `public/build/` langsung terbaca tanpa perlu instalasi Node.js di server.

3. **Eksekusi Skrip Database di Server**
   Jika server tidak menjalankan `php artisan migrate`, jalankan file `database/update_server_posting.sql` melalui **phpMyAdmin**, **HeidiSQL**, atau **Navicat** ke database target.

---

## Struktur Direktori Utama

```text
SIPD-Penganggaran/
├── app/
│   ├── Http/Controllers/
│   │   ├── AuthController.php                  # Login, logout, dan cek sesi user
│   │   ├── Controller.php                      # Base controller Laravel
│   │   ├── DashboardController.php             # Endpoint utama dashboard
│   │   ├── DataManagementController.php        # Query data APBD, master, reset, import & export SQL
│   │   ├── LaporanController.php               # Laporan Kelengkapan Perubahan Perbup
│   │   ├── PostingController.php               # Snapshot posting, unposting, overwrite & tahapan
│   │   ├── SipdSyncController.php              # Penerima sinkronisasi data dari ekstensi SIPD RI
│   │   └── UserController.php                  # CRUD manajemen akun pengguna
│   ├── Models/
│   │   ├── ActivityLog.php                     # Log aktivitas pengguna & sistem
│   │   ├── CapaianProgram.php                  # Data capaian program
│   │   ├── DataUnit.php                        # Master unit & sub-unit SKPD
│   │   ├── MasterAkun.php                      # Master kode rekening / akun belanja
│   │   ├── MasterSumberDana.php                # Master sumber dana
│   │   ├── Pembiayaan.php                      # Rincian data pembiayaan daerah
│   │   ├── PembiayaanSkpd.php                  # Rekap pembiayaan per SKPD
│   │   ├── Pendapatan.php                      # Rincian data pendapatan daerah
│   │   ├── PendapatanSkpd.php                  # Rekap pendapatan per SKPD
│   │   ├── PostingSession.php                  # Header sesi arsip snapshot posting
│   │   ├── PostingTahapan.php                  # Master tahapan anggaran posting
│   │   ├── Rka.php                             # Rincian komponen RKA belanja
│   │   ├── SubKegiatanBl.php                   # Data sub kegiatan belanja langsung
│   │   ├── SubKegiatanIndikator.php            # Indikator keluaran sub kegiatan
│   │   ├── SyncLog.php                         # Riwayat sinkronisasi dari ekstensi
│   │   └── User.php                            # Model autentikasi pengguna
│   ├── Providers/
│   │   └── AppServiceProvider.php              # Konfigurasi service provider aplikasi
│   └── Services/
│       ├── DashboardAnalyticsService.php       # Agregasi statistik dashboard, monitoring & cache
│       ├── SqlExportService.php                # Layanan ekspor database ke skrip SQL
│       ├── SqlImportService.php                # Layanan impor file SQL ke database
│       └── SystemLogService.php                # Pencatatan log sinkronisasi, aktivitas & cache version
├── database/
│   ├── factories/UserFactory.php               # Factory data user untuk testing/seeding
│   ├── migrations/                             # Migrasi skema tabel & indeks performa
│   ├── seeders/DatabaseSeeder.php              # Seeder awal database
│   └── update_server_posting.sql               # Skrip SQL untuk update manual di server produksi
├── public/
│   └── build/                                  # Hasil build Vite (React & Tailwind CSS)
├── resources/
│   ├── css/app.css                             # Stylesheet utama (Tailwind CSS v4)
│   └── js/
│       ├── components/
│       │   ├── dashboard/
│       │   │   ├── DashboardCharts.jsx         # Grafik ringkasan & komposisi APBD
│       │   │   └── SystemMonitoringPanel.jsx   # Panel status DB, server & log sinkronisasi
│       │   ├── Footer.jsx                      # Komponen footer aplikasi
│       │   ├── Navbar.jsx                      # Topbar (filter tahun anggaran, user, toggle sidebar)
│       │   └── Sidebar.jsx                     # Navigasi utama aplikasi SADA SIPD
│       ├── pages/
│       │   ├── Dashboard.jsx                   # Halaman ringkasan APBD & monitoring
│       │   ├── ImportDatabase.jsx              # Halaman import & export database SQL
│       │   ├── KosongkanData.jsx               # Halaman pembersihan / reset data
│       │   ├── LaporanPerbup.jsx               # Halaman Laporan Kelengkapan Perubahan Perbup
│       │   ├── Login.jsx                       # Halaman autentikasi pengguna
│       │   ├── MasterAkun.jsx                  # Halaman master akun belanja
│       │   ├── MasterSkpd.jsx                  # Halaman master SKPD & edit unit
│       │   ├── MasterSumberDana.jsx            # Halaman master sumber dana
│       │   ├── Pembiayaan.jsx                  # Halaman pembiayaan daerah
│       │   ├── Pendapatan.jsx                  # Halaman pendapatan daerah
│       │   ├── PostingData.jsx                 # Halaman manajemen snapshot posting & tahapan
│       │   ├── PostingExplorer.jsx             # Penjelajah arsip snapshot posting
│       │   ├── RkaPrintView.jsx                # Tampilan cetak RKA A4 Landscape (Rincian & Paket)
│       │   ├── SkpdList.jsx                    # Daftar SKPD & pagu belanja
│       │   ├── SubKegiatan.jsx                 # Daftar sub kegiatan & rekening belanja
│       │   ├── SubKegiatanDetailModal.jsx      # Modal detail rincian komponen sub kegiatan
│       │   └── UserManagement.jsx              # Halaman manajemen pengguna
│       └── app.jsx                             # Root SPA, interceptor base URL & Toaster
└── routes/
    ├── console.php                             # Command artisan kustom
    └── web.php                                 # Route API internal, endpoint sinkronisasi & SPA fallback
```

---

## Lisensi

Aplikasi ini dikembangkan untuk kebutuhan internal pengelolaan, sinkronisasi, dan analisis data perencanaan anggaran daerah.

Dikelola oleh [@sakaadinugraha-eng](https://github.com/sakaadinugraha-eng).
