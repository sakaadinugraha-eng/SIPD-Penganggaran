import React, { useState, useRef, useEffect } from 'react';
import { Calendar, Server, RefreshCw, Menu, ChevronDown, Check, AlertCircle } from 'lucide-react';

export default function Navbar({
  activeTab,
  onRefresh,
  refreshing,
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
  tahunAnggaran = '2026',
  setTahunAnggaran,
  availableYears = [2027, 2026, 2025],
  dbInfo = null,
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
    'master-skpd': 'Pengaturan: Master SKPD & Kepala Unit',
    'master-akun': 'Pengaturan: Master Akun / Rekening Belanja & Pendapatan',
    'sumber-dana': 'Pengaturan: Master Sumber Pendanaan APBD',
    users: 'Pengaturan: Manajemen Pengguna & Hak Akses',
    kosongkan: 'Pengaturan: Manajemen & Pembersihan Data',
    'import-db': 'Pengaturan: Import & Export Database (.sql)',
    'rka-print': 'Dokumen Formulir Cetak RKA (A4 Landscape)',
  };

  const dbStatus = dbInfo?.status || 'unknown';
  const isDbConnected = dbStatus === 'connected';
  const isDbError = dbStatus === 'error';
  const dbLabel = dbInfo?.name
    ? `${dbInfo.name}${dbInfo.port ? `:${dbInfo.port}` : ''}`
    : 'db_sipd:3306';

  const handleToggleSidebar = () => {
    if (window.innerWidth < 1024) {
      if (setMobileOpen) setMobileOpen(!mobileOpen);
    } else {
      setCollapsed(!collapsed);
    }
  };

  return (
    <header className="h-16 px-4 sm:px-6 bg-white border-b border-slate-200 flex items-center justify-between gap-3 shrink-0 z-20 print:hidden">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={handleToggleSidebar}
          aria-label="Toggle navigasi sidebar"
          className="min-w-[44px] min-h-[44px] -ml-2 flex items-center justify-center rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          title={collapsed ? 'Buka Sidebar' : 'Tutup Sidebar'}
        >
          <Menu className="w-5 h-5" aria-hidden="true" />
        </button>

        <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight truncate">
          {titles[activeTab] || 'Dashboard'}
        </h2>
      </div>

      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* Refresh button */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          aria-busy={refreshing}
          aria-label="Muat ulang data dashboard"
          className="min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-70 text-slate-700 transition cursor-pointer disabled:cursor-not-allowed flex items-center gap-2 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          title="Muat ulang data terbaru"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 shrink-0 ${refreshing ? 'animate-spin text-indigo-600' : 'text-slate-600'}`}
            aria-hidden="true"
          />
          <span className="hidden sm:inline">{refreshing ? 'Memuat...' : 'Refresh Data'}</span>
        </button>

        {/* Tahun Anggaran Custom Dropdown */}
        <div className="relative" ref={yearMenuRef}>
          <button
            type="button"
            onClick={() => setYearOpen((prev) => !prev)}
            aria-haspopup="listbox"
            aria-expanded={yearOpen}
            aria-label="Pilih Tahun Anggaran"
            className={`min-h-[40px] flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              yearOpen
                ? 'bg-indigo-100 border-indigo-300 text-indigo-800'
                : 'bg-indigo-50 hover:bg-indigo-100/80 border-indigo-200 text-indigo-700'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" aria-hidden="true" />
            <span>TA {tahunAnggaran}</span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-indigo-600 transition-transform duration-150 ${
                yearOpen ? 'rotate-180' : ''
              }`}
              aria-hidden="true"
            />
          </button>

          {yearOpen && (
            <div
              role="listbox"
              aria-label="Daftar Tahun Anggaran"
              className="absolute right-0 mt-2 w-44 rounded-xl bg-white border border-slate-200 shadow-lg py-1.5 z-50"
            >
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
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
                    className={`w-full flex items-center justify-between px-3 py-2.5 text-xs transition cursor-pointer focus-visible:outline-none focus-visible:bg-indigo-50 ${
                      isSelected
                        ? 'bg-indigo-50 text-indigo-700 font-bold'
                        : 'text-slate-700 hover:bg-slate-50 font-medium'
                    }`}
                  >
                    <span>TAHUN {yr}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Status Koneksi Database */}
        <div
          className={`hidden md:flex min-h-[40px] items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold ${
            isDbError
              ? 'bg-rose-50 border-rose-200 text-rose-700'
              : isDbConnected
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}
          title={isDbError ? `Koneksi database bermasalah: ${dbInfo?.error || ''}` : `Database terhubung: ${dbLabel}`}
        >
          {isDbError ? (
            <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" aria-hidden="true" />
          ) : (
            <Server
              className={`w-3.5 h-3.5 shrink-0 ${isDbConnected ? 'text-emerald-700' : 'text-amber-600'}`}
              aria-hidden="true"
            />
          )}
          <span className="truncate max-w-[140px]">
            {isDbError ? 'DB Terputus' : dbLabel}
          </span>
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              isDbError ? 'bg-rose-600' : isDbConnected ? 'bg-emerald-600' : 'bg-amber-500 animate-pulse'
            }`}
            aria-hidden="true"
          />
        </div>
      </div>
    </header>
  );
}
