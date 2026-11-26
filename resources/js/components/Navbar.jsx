import React, { useState, useRef, useEffect } from 'react';
import { Calendar, Server, RefreshCw, Menu, ChevronDown, Check } from 'lucide-react';

export default function Navbar({
  activeTab,
  onRefresh,
  refreshing,
  collapsed,
  setCollapsed,
  tahunAnggaran = '2026',
  setTahunAnggaran,
  availableYears = [2027, 2026, 2025],
}) {
  const [yearOpen, setYearOpen] = useState(false);
  const yearMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (yearMenuRef.current && !yearMenuRef.current.contains(e.target)) {
        setYearOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setYearOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
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

        {/* Tahun Anggaran Custom Dropdown */}
        <div className="relative" ref={yearMenuRef}>
          <button
            type="button"
            onClick={() => setYearOpen((prev) => !prev)}
            aria-haspopup="listbox"
            aria-expanded={yearOpen}
            aria-label="Pilih Tahun Anggaran"
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-bold transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
              yearOpen
                ? 'bg-indigo-100 border-indigo-300 text-indigo-800 shadow-xs'
                : 'bg-indigo-50 hover:bg-indigo-100/80 border-indigo-200 text-indigo-700'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span>TAHUN {tahunAnggaran}</span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-indigo-500 transition-transform duration-150 ${
                yearOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {yearOpen && (
            <div
              role="listbox"
              aria-label="Daftar Tahun Anggaran"
              className="absolute right-0 mt-2 w-44 rounded-xl bg-white border border-slate-200 shadow-lg py-1.5 z-50"
            >
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Tahun Anggaran
              </div>
              {availableYears.map((yr) => {
                const isSelected = String(yr) === String(tahunAnggaran);
                return (
                  <button
                    key={yr}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      if (setTahunAnggaran) setTahunAnggaran(String(yr));
                      setYearOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs transition cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50 text-indigo-700 font-bold'
                        : 'text-slate-700 hover:bg-slate-50 font-medium'
                    }`}
                  >
                    <span>TAHUN {yr}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
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
