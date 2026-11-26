import React from 'react';
import { Calendar, Server, RefreshCw, Menu } from 'lucide-react';

export default function Navbar({ activeTab, onRefresh, refreshing, collapsed, setCollapsed }) {
  const titles = {
    dashboard: 'Ringkasan & Statistik Anggaran',
    skpd: 'Belanja & RKA: Rekap Perangkat Daerah',
    subkegiatan: 'Belanja & RKA: Rincian Sub Kegiatan',
    pendapatan: 'Target & Rincian Rekening Pendapatan Daerah',
    pembiayaan: 'Pembiayaan Daerah (Penerimaan & Pengeluaran)',
    posting: 'Penganggaran: Posting & Unposting Data Anggaran',
    'master-akun': 'Master Akun / Rekening Belanja & Pendapatan',
    'sumber-dana': 'Master Sumber Pendanaan APBD',
    users: 'Pengaturan: Manajemen Pengguna & Hak Akses',
    kosongkan: 'Pengaturan: Manajemen & Pembersihan Data',
    'import-db': 'Pengaturan: Import Database (.sql)',
    'rka-print': 'Dokumen Formulir Cetak RKA (A4 Landscape)',
  };

  return (
    <header className="h-16 px-6 bg-white border-b border-slate-200 flex items-center justify-between shadow-xs shrink-0 z-20 print:hidden">
      <div className="flex items-center gap-3">
        {/* Toggle Sidebar Button di Navbar */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
          title={collapsed ? 'Buka Sidebar' : 'Tutup Sidebar'}
        >
          <Menu className="w-5 h-5" />
        </button>

        <h2 className="text-sm sm:text-base font-bold text-slate-800 tracking-tight">
          {titles[activeTab] || 'Dashboard'}
        </h2>
      </div>

      <div className="flex items-center gap-3">
        {/* Refresh button */}
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold shadow-xs"
          title="Muat ulang data terbaru"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-indigo-600' : 'text-slate-500'}`} />
          <span className="hidden sm:inline">Refresh Data</span>
        </button>

        {/* Tahun Anggaran Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold">
          <Calendar className="w-3.5 h-3.5 text-indigo-600" />
          <span>TAHUN 2027</span>
        </div>

        {/* Status Database */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
          <Server className="w-3.5 h-3.5 text-emerald-600" />
          <span>db_sipd: 3306</span>
        </div>
      </div>
    </header>
  );
}
