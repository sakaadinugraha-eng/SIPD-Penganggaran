# SIPD-Penganggaran 🏛️📊

> **Sistem Informasi Manajemen, Analisis, dan Arsip Snapshot Data Penganggaran APBD (SIPD RI)**

Aplikasi berbasis web untuk mengelola, menganalisis, dan membekukan (*snapshot posting*) data penganggaran daerah (APBD) dari SIPD RI Kemendagri. Dilengkapi dengan pengelolaan Belanja SKPD, Rincian Komponen RKA, Pendapatan, Pembiayaan, serta fitur Cetak RKA standar A4 Landscape.

---

## 🚀 Fitur Unggulan

### 1. Dashboard Ringkasan APBD Real-Time
- Visualisasi metrik keuangan utama: **Total Belanja**, **Total Pendapatan**, **Pembiayaan Netto** (Penerimaan vs Pengeluaran), dan status **Surplus / (Defisit)**.
- Filter dinamis berdasarkan Tahun Anggaran (misal: TA 2027) dan SKPD.

### 2. Modul Belanja & Rincian RKA SKPD
- Navigasi bertingkat: **Program ➔ Kegiatan ➔ Sub Kegiatan ➔ Rekening Belanja ➔ Rincian Komponen**.
- Informasi detail per komponen: Standar harga, koefisien, volume, satuan, dan total pagu.
- Fitur **Cetak RKA Resmi**: Tampilan cetak standar lampiran anggaran dalam format **A4 Landscape** dengan layout yang rapi dan siap cetak.

### 3. Modul Pendapatan & Pembiayaan
- Monitoring akun pendapatan daerah beserta rincian target.
- Pengelolaan data pembiayaan (Penerimaan Pembiayaan / SiLPA dan Pengeluaran Pembiayaan).

### 4. Manajemen Snapshot: Posting & Unposting Data
- **Posting Data**: Membekukan (*freeze snapshot*) kondisi data aktif berjalan ke dalam arsip resmi per tahapan anggaran.
- **Tahapan Anggaran Dinamis**: Tambah dan kelola tahapan anggaran (misal: *Rancangan Awal*, *Rancangan*, *RKA SKPD*, *Persetujuan Bersama*, *Penetapan APBD*, *Perubahan APBD*) secara fleksibel.
- **Posting Explorer**: Jelajahi data historis/arsip postingan hingga ke level detail sub-kegiatan, rincian komponen RKA, dan cetak RKA arsip.
- **Tindih & Unposting**:
  - *Tindih*: Memperbarui data snapshot yang sudah ada dengan data aktif terkini.
  - *Unposting*: Memulihkan (*restore*) data arsip snapshot kembali menjadi data aktif berjalan dengan aman.

### 5. Notifikasi Interaktif
- Terintegrasi penuh dengan **React Hot Toast** untuk setiap aksi pengguna (tambah, edit, hapus, posting, unposting, sinkronisasi data).

### 6. User Management & Keamanan
- Autentikasi berbasis session dengan pembagian hak akses (Developer, Administrator, User).
- Manajemen pengguna terpadu.

---

## 🛠️ Tech Stack

- **Backend:** [Laravel 11](https://laravel.com/) (PHP 8.2+)
- **Frontend:** [React 18](https://react.dev/), [Vite](https://vitejs.dev/)
- **UI & Styling:** [Tailwind CSS](https://tailwindcss.com/), [Lucide React Icons](https://lucide.dev/)
- **Notifications:** [React Hot Toast](https://react-hot-toast.com/)
- **Database:** [MySQL](https://www.mysql.com/) / [MariaDB](https://mariadb.org/)

---

## 💻 Panduan Instalasi (Development Lokal)

### Prasyarat
- PHP >= 8.2
- Composer
- Node.js & NPM
- MySQL / MariaDB (disarankan menggunakan Laragon / XAMPP)

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

3. **Konfigurasi Environment**
   Salin file `.env.example` menjadi `.env`:
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```
   Sesuaikan konfigurasi database pada `.env`:
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
   - Jalankan Vite development server:
     ```bash
     npm run dev
     ```
   - Buka aplikasi melalui local domain Laragon (misal: `http://sipd-local.test`) atau jalankan server lokal:
     ```bash
     php artisan serve
     ```

---

## 🖥️ Panduan Deployment (Windows Server 2012 / Lingkungan Tanpa CLI)

Repositori ini telah disiapkan khusus untuk server produksi Windows Server yang **tidak memiliki / tidak dapat menjalankan `npm` dan `php artisan`**.

### 1. Build Aset di Komputer Lokal
Seluruh aset frontend di-compile secara lokal ke folder `public/build` dan disimpan di repositori Git.
```bash
npm run build
git add .
git commit -m "build: compile assets"
git push origin main
```

### 2. Tarik Update di Windows Server
Pada Windows Server, buka Git Bash / Command Prompt di folder instalasi:
```bash
git pull origin main
```
*Aset antarmuka React langsung aktif otomatis tanpa perlu instalasi Node.js di server.*

### 3. Eksekusi Skrip Database di Server
Jika server tidak dapat menjalankan `php artisan migrate`, gunakan skrip SQL siap pakai:
- Lokasi file: `database/update_server_posting.sql`
- Buka **phpMyAdmin**, **HeidiSQL**, atau **Navicat** di server.
- Impor atau jalankan (*Execute*) isi file `database/update_server_posting.sql` ke database target.

---

## 📂 Struktur Direktori Utama

```text
SIPD-Penganggaran/
├── app/
│   ├── Http/Controllers/
│   │   ├── PostingController.php       # Logika snapshot posting, unposting & tahapan
│   │   ├── RkaController.php           # Logika sub kegiatan, rincian RKA & cetak
│   │   ├── PendapatanController.php    # Modul pendapatan
│   │   ├── PembiayaanController.php    # Modul pembiayaan (SiLPA)
│   │   └── UserController.php          # Manajemen user & auth
│   └── Models/                         # Eloquent Model (PostingSession, Rka, SubKeg, dll.)
├── database/
│   ├── migrations/                     # File migrasi Laravel
│   └── update_server_posting.sql       # Skrip SQL siap eksekusi di server produksi
├── public/
│   └── build/                          # Bundled & compiled assets (Vite React & Tailwind)
├── resources/
│   ├── css/app.css                     # Tailwind custom styling
│   └── js/
│       ├── components/                 # Navbar, Sidebar, Modal, dll.
│       ├── pages/                      # PostingData, PostingExplorer, RkaPrintView, dll.
│       └── App.jsx                     # Router utama & Provider Notifikasi
└── routes/
    └── web.php                         # Routing aplikasi & API endpoints internal
```

---

## 📝 Lisensi

Aplikasi ini dikembangkan untuk kebutuhan internal pengelolaan dan analisis data perencanaan anggaran daerah.

Dikelola oleh [@sakaadinugraha-eng](https://github.com/sakaadinugraha-eng).
