import React, { useState, useEffect } from 'react';
import { 
  Scale,
  Search, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight, 
  Building2,
  Receipt,
  ArrowLeft,
  ArrowUpRight,
  X,
  SlidersHorizontal,
  ChevronDown,
  ArrowDownLeft,
  ArrowUpRight as ArrowUpRightIcon
} from 'lucide-react';

export default function Pembiayaan() {
  // Tipe: 'penerimaan' | 'pengeluaran'
  const [activeTipe, setActiveTipe] = useState('penerimaan');

  // Navigation mode: 'skpd_list' | 'detail'
  const [viewMode, setViewMode] = useState('skpd_list');
  const [selectedSkpd, setSelectedSkpd] = useState(null);

  // State untuk List SKPD Pembiayaan
  const [skpdList, setSkpdList] = useState([]);
  const [skpdMeta, setSkpdMeta] = useState(null);
  const [skpdSummary, setSkpdSummary] = useState({ total_pembiayaan: 0, total_rekening: 0, total_skpd: 0 });
  const [loadingSkpd, setLoadingSkpd] = useState(true);
  const [searchSkpd, setSearchSkpd] = useState('');
  const [skpdPage, setSkpdPage] = useState(1);
  const [skpdPerPage, setSkpdPerPage] = useState(25);

  // State untuk Rincian Rekening per SKPD
  const [rekeningData, setRekeningData] = useState([]);
  const [rekeningMeta, setRekeningMeta] = useState(null);
  const [rekeningSummary, setRekeningSummary] = useState({ total_nilai: 0 });
  const [loadingRekening, setLoadingRekening] = useState(false);
  const [searchRekening, setSearchRekening] = useState('');
  const [detailPage, setDetailPage] = useState(1);
  const [detailPerPage, setDetailPerPage] = useState(50);

  const formatRupiah = (val) => {
    return 'Rp ' + Number(val || 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // 1. Ambil daftar SKPD Pembiayaan
  const fetchSkpdList = async (tipe = activeTipe, page = skpdPage, query = searchSkpd, perPage = skpdPerPage) => {
    setLoadingSkpd(true);
    try {
      let url = `/api/data/pembiayaan/skpd?tipe=${tipe}&page=${page}&per_page=${perPage}`;
      if (query) {
        url += `&search=${encodeURIComponent(query)}`;
      }
      const res = await fetch(url);
      const json = await res.json();
      if (json.status === 'success') {
        if (json.data && json.data.data) {
          setSkpdList(json.data.data || []);
          setSkpdMeta(json.data);
        } else {
          setSkpdList(Array.isArray(json.data) ? json.data : []);
          setSkpdMeta(null);
        }
        if (json.summary) {
          setSkpdSummary(json.summary);
        }
      }
    } catch (err) {
      console.error('Error fetching skpd pembiayaan list:', err);
    } finally {
      setLoadingSkpd(false);
    }
  };

  // 2. Ambil rincian rekening Pembiayaan untuk SKPD tertentu
  const fetchRekeningDetail = async (idSkpd, tipe = activeTipe, page = detailPage, query = searchRekening, perPage = detailPerPage) => {
    if (!idSkpd) return;
    setLoadingRekening(true);
    try {
      let url = `/api/data/pembiayaan?tipe=${tipe}&id_skpd=${encodeURIComponent(idSkpd)}&page=${page}&per_page=${perPage}`;
      if (query) {
        url += `&search=${encodeURIComponent(query)}`;
      }
      const res = await fetch(url);
      const json = await res.json();
      if (json.status === 'success' && json.data) {
        setRekeningData(json.data.data || []);
        setRekeningMeta(json.data);
        if (json.summary) {
          setRekeningSummary(json.summary);
        }
      }
    } catch (err) {
      console.error('Error fetching rekening pembiayaan detail:', err);
    } finally {
      setLoadingRekening(false);
    }
  };

  useEffect(() => {
    fetchSkpdList(activeTipe, skpdPage, searchSkpd, skpdPerPage);
  }, [activeTipe, skpdPage, skpdPerPage]);

  useEffect(() => {
    if (viewMode === 'detail' && selectedSkpd) {
      fetchRekeningDetail(selectedSkpd.id_skpd, activeTipe, detailPage, searchRekening, detailPerPage);
    }
  }, [detailPage, detailPerPage, viewMode, selectedSkpd, activeTipe]);

  const handleTipeChange = (tipe) => {
    setActiveTipe(tipe);
    setViewMode('skpd_list');
    setSelectedSkpd(null);
    setSkpdPage(1);
    setSearchSkpd('');
  };

  const handleSearchSkpdSubmit = (e) => {
    e.preventDefault();
    setSkpdPage(1);
    fetchSkpdList(activeTipe, 1, searchSkpd, skpdPerPage);
  };

  const handleOpenDetail = (skpd) => {
    setSelectedSkpd(skpd);
    setViewMode('detail');
    setDetailPage(1);
    setSearchRekening('');
    fetchRekeningDetail(skpd.id_skpd, activeTipe, 1, '', detailPerPage);
  };

  const handleBackToSkpd = () => {
    setViewMode('skpd_list');
  };

  const handleSearchRekeningSubmit = (e) => {
    e.preventDefault();
    setDetailPage(1);
    if (selectedSkpd) {
      fetchRekeningDetail(selectedSkpd.id_skpd, activeTipe, 1, searchRekening, detailPerPage);
    }
  };

  // Render pagination buttons generator helper
  const renderPaginationButtons = (currentPage, lastPage, onSelectPage) => {
    if (!lastPage || lastPage <= 1) return null;

    const pages = [];
    const delta = 1;
    for (let i = 1; i <= lastPage; i++) {
      if (i === 1 || i === lastPage || (i >= currentPage - delta && i <= currentPage + delta)) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }

    return (
      <div className="flex items-center gap-1">
        {pages.map((p, index) => {
          if (p === '...') {
            return (
              <span key={`dots-${index}`} className="px-2 py-1 text-slate-400 text-xs">
                ...
              </span>
            );
          }
          const isActive = p === currentPage;
          return (
            <button
              key={p}
              onClick={() => onSelectPage(p)}
              className={`min-w-8 h-8 px-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {p}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* ============================================================== */}
      {/* TAMPILAN 1: DAFTAR SKPD PEMBIAYAAN */}
      {/* ============================================================== */}
      {viewMode === 'skpd_list' && (
        <>
          {/* Top Banner / Summary */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-slate-800">Pembiayaan Daerah</h3>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-semibold">
                    TA 2027
                  </span>

                  {/* Switcher Tipe Penerimaan / Pengeluaran */}
                  <div className="inline-flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200 ml-1">
                    <button
                      onClick={() => handleTipeChange('penerimaan')}
                      className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
                        activeTipe === 'penerimaan'
                          ? 'bg-white text-indigo-700 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <ArrowDownLeft className="w-3 h-3 text-emerald-600" />
                      <span>Penerimaan</span>
                    </button>
                    <button
                      onClick={() => handleTipeChange('pengeluaran')}
                      className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
                        activeTipe === 'pengeluaran'
                          ? 'bg-white text-indigo-700 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <ArrowUpRightIcon className="w-3 h-3 text-indigo-600" />
                      <span>Pengeluaran</span>
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Data pembiayaan daerah ({activeTipe === 'penerimaan' ? 'SiLPA & Pencairan Cadangan' : 'Penyertaan Modal & Pembayaran Hutang'}) hasil sinkronisasi SIPD RI.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-5 sm:gap-6 self-stretch lg:self-auto justify-between lg:justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100">
              <div className="text-left lg:text-right">
                <span className="text-[11px] text-slate-400 block font-medium">
                  Total {activeTipe === 'penerimaan' ? 'Penerimaan' : 'Pengeluaran'}
                </span>
                <span className="text-base font-bold text-emerald-700 font-mono">
                  {formatRupiah(skpdSummary.total_pembiayaan)}
                </span>
              </div>
              <div className="text-left lg:text-right border-l border-slate-200 pl-5 sm:pl-6">
                <span className="text-[11px] text-slate-400 block font-medium">Total Rekening</span>
                <span className="text-base font-bold text-indigo-700">
                  {(skpdSummary.total_rekening || 0).toLocaleString('id-ID')}
                </span>
              </div>
              <div className="text-left lg:text-right border-l border-slate-200 pl-5 sm:pl-6">
                <span className="text-[11px] text-slate-400 block font-medium">Total SKPD</span>
                <span className="text-base font-bold text-slate-700">
                  {(skpdSummary.total_skpd || skpdList.length).toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>

          {/* Search Bar & Aksi */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <form onSubmit={handleSearchSkpdSubmit} className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchSkpd}
                onChange={(e) => setSearchSkpd(e.target.value)}
                placeholder="Cari nama atau kode perangkat daerah..."
                className="w-full pl-9 pr-8 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
              />
              {searchSkpd && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchSkpd('');
                    setSkpdPage(1);
                    fetchSkpdList(activeTipe, 1, '', skpdPerPage);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>

            <div className="flex items-center gap-2.5 self-end sm:self-auto">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                <div className="relative">
                  <select
                    value={skpdPerPage}
                    onChange={(e) => {
                      setSkpdPerPage(Number(e.target.value));
                      setSkpdPage(1);
                    }}
                    className="appearance-none py-1.5 pl-2.5 pr-7 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition cursor-pointer"
                  >
                    <option value="15">15 baris</option>
                    <option value="25">25 baris</option>
                    <option value="50">50 baris</option>
                    <option value="100">100 baris</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <button
                onClick={() => fetchSkpdList(activeTipe, skpdPage, searchSkpd, skpdPerPage)}
                disabled={loadingSkpd}
                className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-600 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                title="Muat ulang data"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingSkpd ? 'animate-spin text-indigo-600' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Tabel Perangkat Daerah Pembiayaan */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-4 w-12 text-center">No</th>
                    <th className="py-3 px-4 w-48">Kode SKPD</th>
                    <th className="py-3 px-4">Perangkat Daerah</th>
                    <th className="py-3 px-4 w-36 text-center">Jumlah Rekening</th>
                    <th className="py-3 px-4 w-52 text-right">Total Pembiayaan</th>
                    <th className="py-3 px-4 w-28 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {loadingSkpd ? (
                    <tr>
                      <td colSpan="6" className="py-16 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
                          <span className="font-medium">Memuat data pembiayaan...</span>
                        </div>
                      </td>
                    </tr>
                  ) : skpdList.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-16 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                          <Building2 className="w-10 h-10 text-slate-300" />
                          <p className="font-semibold text-slate-700">Belum ada data pembiayaan {activeTipe}</p>
                          <p className="text-[11px] text-slate-400">
                            {searchSkpd 
                              ? 'Tidak ada perangkat daerah yang cocok dengan kata kunci pencarian.' 
                              : `Buka halaman Pembiayaan ${activeTipe} pada SIPD RI dan klik tombol sinkronisasi pada ekstensi Chrome.`}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    skpdList.map((skpd, idx) => {
                      const rowNum = skpdMeta?.from ? skpdMeta.from + idx : idx + 1;
                      const countRek = parseInt(skpd.jumlah_rekening, 10) || 0;
                      return (
                        <tr 
                          key={skpd.id_skpd || idx} 
                          onClick={() => handleOpenDetail(skpd)}
                          className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                        >
                          <td className="py-3 px-4 text-center font-mono text-[11px] text-slate-400">
                            {rowNum}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                              {skpd.kode_skpd || '-'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                              <span>{skpd.nama_skpd}</span>
                              <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-600 shrink-0" />
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {countRek > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                {countRek} rekening
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-400">
                                0 rekening
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="font-mono font-bold text-slate-900 text-xs">
                              {formatRupiah(skpd.total)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDetail(skpd);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition cursor-pointer"
                            >
                              Rincian →
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginasi SKPD */}
            {skpdMeta && skpdMeta.total > 0 && (
              <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-500">
                <div>
                  Menampilkan <span className="font-semibold text-slate-700">{skpdMeta.from || 0}</span> -{' '}
                  <span className="font-semibold text-slate-700">{skpdMeta.to || 0}</span> dari{' '}
                  <span className="font-semibold text-slate-700">{skpdMeta.total}</span> perangkat daerah
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={() => setSkpdPage((p) => Math.max(p - 1, 1))}
                    disabled={skpdPage <= 1 || loadingSkpd}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Sebelumnya</span>
                  </button>

                  {renderPaginationButtons(skpdPage, skpdMeta.last_page, (p) => setSkpdPage(p))}

                  <button
                    onClick={() => setSkpdPage((p) => Math.min(p + 1, skpdMeta.last_page || 1))}
                    disabled={skpdPage >= (skpdMeta.last_page || 1) || loadingSkpd}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer"
                  >
                    <span>Berikutnya</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ============================================================== */}
      {/* TAMPILAN 2: RINCIAN REKENING PEMBIAYAAN */}
      {/* ============================================================== */}
      {viewMode === 'detail' && selectedSkpd && (
        <>
          {/* Breadcrumb Navigation Bar */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <button
              onClick={handleBackToSkpd}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
              <span>Kembali ke Daftar SKPD</span>
            </button>

            <button
              onClick={() => fetchRekeningDetail(selectedSkpd.id_skpd, activeTipe, detailPage, searchRekening, detailPerPage)}
              disabled={loadingRekening}
              className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingRekening ? 'animate-spin text-indigo-600' : ''}`} />
              <span>Refresh Rekening</span>
            </button>
          </div>

          {/* Kartu Header SKPD Terpilih */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-xs font-mono font-bold">
                  {selectedSkpd.kode_skpd || '-'}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold">
                  {rekeningMeta?.total ?? (selectedSkpd.jumlah_rekening || 0)} Rekening
                </span>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold capitalize">
                  Pembiayaan {activeTipe}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                {selectedSkpd.nama_skpd}
              </h2>
              <p className="text-xs text-slate-500">
                Rincian rekening pembiayaan {activeTipe} Tahun Anggaran 2027
              </p>
            </div>

            {/* Kotak Total Nominal */}
            <div className="bg-indigo-50/60 border border-indigo-200 rounded-xl p-3.5 shrink-0 text-left md:text-right min-w-52">
              <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">
                Total Pembiayaan {activeTipe}
              </span>
              <span className="text-lg sm:text-xl font-bold text-indigo-900 font-mono block mt-0.5">
                {formatRupiah(rekeningSummary.total_nilai || selectedSkpd.total)}
              </span>
            </div>
          </div>

          {/* Bar Filter & Pencarian Rincian Rekening */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <form onSubmit={handleSearchRekeningSubmit} className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchRekening}
                onChange={(e) => setSearchRekening(e.target.value)}
                placeholder="Cari kode rekening, nama akun, uraian..."
                className="w-full pl-9 pr-8 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
              />
              {searchRekening && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchRekening('');
                    setDetailPage(1);
                    if (selectedSkpd) fetchRekeningDetail(selectedSkpd.id_skpd, activeTipe, 1, '', detailPerPage);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>

            <div className="flex items-center gap-2.5 self-end sm:self-auto">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                <div className="relative">
                  <select
                    value={detailPerPage}
                    onChange={(e) => {
                      setDetailPerPage(Number(e.target.value));
                      setDetailPage(1);
                    }}
                    className="appearance-none py-1.5 pl-2.5 pr-7 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition cursor-pointer"
                  >
                    <option value="25">25 baris</option>
                    <option value="50">50 baris</option>
                    <option value="100">100 baris</option>
                    <option value="200">200 baris</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Tabel Rincian Rekening Pembiayaan */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-4 w-12 text-center">No</th>
                    <th className="py-3 px-4 w-44">Kode Rekening</th>
                    <th className="py-3 px-4 w-64">Nama Akun</th>
                    <th className="py-3 px-4">Uraian Pembiayaan</th>
                    <th className="py-3 px-4 w-52">Keterangan</th>
                    <th className="py-3 px-4 w-44 text-right">Nilai Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {loadingRekening ? (
                    <tr>
                      <td colSpan="6" className="py-16 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
                          <span className="font-medium">Memuat rincian rekening pembiayaan...</span>
                        </div>
                      </td>
                    </tr>
                  ) : rekeningData.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-16 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                          <Receipt className="w-10 h-10 text-slate-300" />
                          <p className="font-semibold text-slate-700">Tidak ada rincian rekening pembiayaan</p>
                          <p className="text-[11px] text-slate-400">
                            {searchRekening 
                              ? 'Coba ganti kata kunci pencarian rekening.' 
                              : `Perangkat daerah ini tidak memiliki rincian pembiayaan ${activeTipe} atau belum disinkronkan.`}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    rekeningData.map((item, idx) => {
                      const rowNum = rekeningMeta?.from ? rekeningMeta.from + idx : idx + 1;
                      return (
                        <tr key={item.id || idx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 text-center font-mono text-slate-400 align-top text-[11px]">
                            {rowNum}
                          </td>
                          <td className="py-3 px-4 align-top">
                            <span className="font-mono text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                              {item.kode_akun || '-'}
                            </span>
                          </td>
                          <td className="py-3 px-4 align-top">
                            <div className="font-bold text-slate-900 leading-snug">
                              {item.nama_akun || item.uraian || '-'}
                            </div>
                          </td>
                          <td className="py-3 px-4 align-top text-slate-700 leading-relaxed">
                            {item.uraian || '-'}
                          </td>
                          <td className="py-3 px-4 align-top text-slate-500 leading-relaxed text-[11px]">
                            {item.keterangan || '-'}
                          </td>
                          <td className="py-3 px-4 align-top text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                            {formatRupiah(item.total)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginasi Rincian Rekening */}
            {rekeningMeta && rekeningMeta.total > 0 && (
              <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-500">
                <div>
                  Menampilkan <span className="font-semibold text-slate-700">{rekeningMeta.from || 0}</span> -{' '}
                  <span className="font-semibold text-slate-700">{rekeningMeta.to || 0}</span> dari{' '}
                  <span className="font-semibold text-slate-700">{rekeningMeta.total}</span> total rekening pembiayaan
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={() => setDetailPage((p) => Math.max(p - 1, 1))}
                    disabled={detailPage <= 1 || loadingRekening}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Sebelumnya</span>
                  </button>

                  {renderPaginationButtons(detailPage, rekeningMeta.last_page, (p) => setDetailPage(p))}

                  <button
                    onClick={() => setDetailPage((p) => Math.min(p + 1, rekeningMeta.last_page || 1))}
                    disabled={detailPage >= (rekeningMeta.last_page || 1) || loadingRekening}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer"
                  >
                    <span>Berikutnya</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
