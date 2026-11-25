import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  BookmarkCheck, 
  ShoppingBag, 
  TrendingUp, 
  Scale, 
  RotateCcw, 
  Search, 
  RefreshCw, 
  Eye, 
  Printer, 
  Building2, 
  Coins, 
  ChevronLeft, 
  ChevronRight, 
  Layers,
  FileText,
  SlidersHorizontal,
  X
} from 'lucide-react';
import SubKegiatanDetailModal from './SubKegiatanDetailModal';
import RkaPrintView from './RkaPrintView';

export default function PostingExplorer({ session, onBack, onUnposting }) {
  const [activeTab, setActiveTab] = useState('belanja'); // 'belanja' | 'pendapatan' | 'pembiayaan'
  
  // Belanja Flow State
  const [belanjaView, setBelanjaView] = useState('skpd'); // 'skpd' | 'subkegiatan'
  const [selectedSkpd, setSelectedSkpd] = useState(null);
  
  // SKPD List State
  const [skpdData, setSkpdData] = useState([]);
  const [skpdPagination, setSkpdPagination] = useState({});
  const [skpdSearch, setSkpdSearch] = useState('');
  const [skpdPage, setSkpdPage] = useState(1);
  const [skpdLoading, setSkpdLoading] = useState(false);

  // Sub Kegiatan State
  const [subData, setSubData] = useState([]);
  const [subPagination, setSubPagination] = useState({});
  const [subSearch, setSubSearch] = useState('');
  const [subPage, setSubPage] = useState(1);
  const [subLoading, setSubLoading] = useState(false);

  // Detail Modal & Cetak RKA
  const [detailSub, setDetailSub] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [printSubId, setPrintSubId] = useState(null);
  const [printMode, setPrintMode] = useState('rincian');

  // Pendapatan State
  const [pendapatanData, setPendapatanData] = useState([]);
  const [pendapatanPagination, setPendapatanPagination] = useState({});
  const [pendapatanSearch, setPendapatanSearch] = useState('');
  const [pendapatanPage, setPendapatanPage] = useState(1);
  const [pendapatanLoading, setPendapatanLoading] = useState(false);
  const [pendapatanSummary, setPendapatanSummary] = useState(0);

  // Pembiayaan State
  const [pembiayaanTipe, setPembiayaanTipe] = useState('penerimaan');
  const [pembiayaanData, setPembiayaanData] = useState([]);
  const [pembiayaanPagination, setPembiayaanPagination] = useState({});
  const [pembiayaanSearch, setPembiayaanSearch] = useState('');
  const [pembiayaanPage, setPembiayaanPage] = useState(1);
  const [pembiayaanLoading, setPembiayaanLoading] = useState(false);
  const [pembiayaanSummary, setPembiayaanSummary] = useState(0);

  const formatRupiah = (val) => {
    return 'Rp ' + Number(val || 0).toLocaleString('id-ID');
  };

  // 1. Fetch SKPD List in Posting
  const fetchSkpdList = async () => {
    setSkpdLoading(true);
    try {
      let url = `/api/posting/${session.id}/skpd-list?page=${skpdPage}&per_page=25`;
      if (skpdSearch) url += `&search=${encodeURIComponent(skpdSearch)}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.status === 'success') {
        setSkpdData(json.data.data || []);
        setSkpdPagination({
          current_page: json.data.current_page,
          last_page: json.data.last_page,
          total: json.data.total,
          from: json.data.from,
          to: json.data.to,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSkpdLoading(false);
    }
  };

  // 2. Fetch Sub Kegiatan List in Posting
  const fetchSubKegiatan = async () => {
    setSubLoading(true);
    try {
      let url = `/api/posting/${session.id}/sub-kegiatan?page=${subPage}&per_page=15`;
      if (selectedSkpd) url += `&skpd=${encodeURIComponent(selectedSkpd.nama_skpd)}`;
      if (subSearch) url += `&search=${encodeURIComponent(subSearch)}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.status === 'success') {
        setSubData(json.data.data || []);
        setSubPagination({
          current_page: json.data.current_page,
          last_page: json.data.last_page,
          total: json.data.total,
          from: json.data.from,
          to: json.data.to,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubLoading(false);
    }
  };

  // 3. Fetch Detail Sub Kegiatan for Modal
  const handleOpenDetailModal = async (subId) => {
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/posting/${session.id}/sub-kegiatan/${subId}`);
      const json = await res.json();
      if (json.status === 'success') {
        setDetailSub(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetail(false);
    }
  };

  // 4. Fetch Pendapatan
  const fetchPendapatan = async () => {
    setPendapatanLoading(true);
    try {
      let url = `/api/posting/${session.id}/pendapatan?page=${pendapatanPage}&per_page=50`;
      if (pendapatanSearch) url += `&search=${encodeURIComponent(pendapatanSearch)}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.status === 'success') {
        setPendapatanData(json.data.data || []);
        setPendapatanPagination({
          current_page: json.data.current_page,
          last_page: json.data.last_page,
          total: json.data.total,
          from: json.data.from,
          to: json.data.to,
        });
        if (json.summary) setPendapatanSummary(json.summary.total_nilai);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPendapatanLoading(false);
    }
  };

  // 5. Fetch Pembiayaan
  const fetchPembiayaan = async () => {
    setPembiayaanLoading(true);
    try {
      let url = `/api/posting/${session.id}/pembiayaan?tipe=${pembiayaanTipe}&page=${pembiayaanPage}&per_page=50`;
      if (pembiayaanSearch) url += `&search=${encodeURIComponent(pembiayaanSearch)}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.status === 'success') {
        setPembiayaanData(json.data.data || []);
        setPembiayaanPagination({
          current_page: json.data.current_page,
          last_page: json.data.last_page,
          total: json.data.total,
          from: json.data.from,
          to: json.data.to,
        });
        if (json.summary) setPembiayaanSummary(json.summary.total_nilai);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPembiayaanLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'belanja') {
      if (belanjaView === 'skpd') {
        fetchSkpdList();
      } else {
        fetchSubKegiatan();
      }
    } else if (activeTab === 'pendapatan') {
      fetchPendapatan();
    } else if (activeTab === 'pembiayaan') {
      fetchPembiayaan();
    }
  }, [activeTab, belanjaView, skpdPage, subPage, pendapatanPage, pembiayaanPage, pembiayaanTipe, selectedSkpd]);

  // Handle Pilih SKPD dari Tabel
  const handleSelectSkpd = (item) => {
    setSelectedSkpd(item);
    setSubPage(1);
    setSubSearch('');
    setBelanjaView('subkegiatan');
  };

  // Handle Cetak RKA dari Modal atau Tabel
  const handleOpenPrint = (subId, mode = 'rincian') => {
    setDetailSub(null);
    setPrintSubId(subId);
    setPrintMode(mode);
  };

  // JIKA SEDANG MEMBUKA PRINT VIEW RKA
  if (printSubId) {
    return (
      <RkaPrintView
        subKegiatanId={printSubId}
        initialMode={printMode}
        postingId={session.id}
        postingTitle={session.nama_posting}
        onBack={() => setPrintSubId(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner Penjelajah Arsip Posting */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-4 border-b border-white/10 gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
              title="Kembali ke Daftar Posting"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Daftar Posting</span>
            </button>
            <div className="h-6 w-px bg-white/20"></div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 text-[10px] font-bold uppercase tracking-wider">
                  ARSIP POSTING SNAPSHOT
                </span>
                <span className="text-xs text-slate-300 font-medium">&bull; TA {session.tahun_anggaran}</span>
              </div>
              <h1 className="text-lg font-bold text-white tracking-tight mt-0.5">{session.nama_posting}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onUnposting(session)}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              title="Pulihkan dan gantikan data aktif dengan postingan ini"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Unposting ke Data Aktif</span>
            </button>
          </div>
        </div>

        {/* Ringkasan Angka Posting */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
          <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Total Belanja</span>
            <span className="text-sm font-bold text-indigo-200 block mt-0.5">{formatRupiah(session.total_belanja)}</span>
          </div>
          <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Total Pendapatan</span>
            <span className="text-sm font-bold text-emerald-300 block mt-0.5">{formatRupiah(session.total_pendapatan)}</span>
          </div>
          <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Pembiayaan Netto</span>
            <span className="text-sm font-bold text-amber-200 block mt-0.5">{formatRupiah(session.total_pembiayaan_netto)}</span>
          </div>
          <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Surplus / Defisit</span>
            <span className={`text-sm font-bold block mt-0.5 ${
              session.surplus_defisit >= 0 ? 'text-emerald-300' : 'text-rose-300'
            }`}>
              {formatRupiah(session.surplus_defisit)}
            </span>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-2">
        <button
          onClick={() => {
            setActiveTab('belanja');
            setBelanjaView('skpd');
          }}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'belanja'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Belanja & RKA ({session.jumlah_sub_kegiatan} Sub Giat)</span>
        </button>

        <button
          onClick={() => setActiveTab('pendapatan')}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'pendapatan'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Pendapatan Daerah ({session.jumlah_rekening_pendapatan} Rekening)</span>
        </button>

        <button
          onClick={() => setActiveTab('pembiayaan')}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'pembiayaan'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>Pembiayaan Daerah ({session.jumlah_rekening_pembiayaan} Rekening)</span>
        </button>
      </div>

      {/* TAB 1: BELANJA & RKA */}
      {activeTab === 'belanja' && (
        <div className="space-y-4">
          {/* Sub View 1: SKPD LIST */}
          {belanjaView === 'skpd' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  <h2 className="text-sm font-bold text-slate-800">Rekap Perangkat Daerah (Arsip Posting)</h2>
                </div>

                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Cari kode atau nama SKPD..."
                    value={skpdSearch}
                    onChange={(e) => {
                      setSkpdSearch(e.target.value);
                      setSkpdPage(1);
                    }}
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              {skpdLoading ? (
                <div className="p-12 text-center">
                  <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-3" />
                  <p className="text-xs text-slate-500 font-medium">Memuat data SKPD...</p>
                </div>
              ) : skpdData.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs">
                  Tidak ada data SKPD ditemukan dalam arsip posting ini.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 w-12 text-center">No</th>
                        <th className="px-4 py-3 w-44">Kode SKPD</th>
                        <th className="px-4 py-3">Nama Perangkat Daerah</th>
                        <th className="px-4 py-3 text-center w-28">Sub Giat</th>
                        <th className="px-4 py-3 text-right w-44">Total Pagu Belanja</th>
                        <th className="px-4 py-3 text-center w-36">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {skpdData.map((item, idx) => (
                        <tr key={item.id_skpd} className="hover:bg-slate-50/70 transition">
                          <td className="px-4 py-3 text-center text-slate-400">
                            {(skpdPagination.from || 1) + idx}
                          </td>
                          <td className="px-4 py-3 font-mono font-medium text-slate-700">{item.kode_skpd}</td>
                          <td className="px-4 py-3 font-semibold text-slate-800">{item.nama_skpd}</td>
                          <td className="px-4 py-3 text-center text-slate-600 font-medium">{item.total_sub_kegiatan}</td>
                          <td className="px-4 py-3 text-right font-bold text-slate-900">{formatRupiah(item.total_pagu)}</td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => handleSelectSkpd(item)}
                              className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs transition cursor-pointer flex items-center justify-center gap-1 mx-auto"
                            >
                              <span>Buka Rincian</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Sub View 2: SUB KEGIATAN LIST (Inside Selected SKPD) */}
          {belanjaView === 'subkegiatan' && selectedSkpd && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setBelanjaView('skpd')}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition cursor-pointer flex items-center gap-1 text-xs font-semibold"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Daftar SKPD</span>
                  </button>
                  <div className="h-5 w-px bg-slate-200"></div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">{selectedSkpd.nama_skpd}</h2>
                    <p className="text-[11px] text-slate-400 font-mono">{selectedSkpd.kode_skpd}</p>
                  </div>
                </div>

                <div className="relative w-full md:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Cari nama sub kegiatan atau kode..."
                    value={subSearch}
                    onChange={(e) => {
                      setSubSearch(e.target.value);
                      setSubPage(1);
                    }}
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              {subLoading ? (
                <div className="p-12 text-center">
                  <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-3" />
                  <p className="text-xs text-slate-500 font-medium">Memuat sub kegiatan...</p>
                </div>
              ) : subData.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs">
                  Tidak ada sub kegiatan yang cocok.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {subData.map((sub) => (
                    <div key={sub.id} className="p-4 sm:p-5 hover:bg-slate-50/60 transition flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {sub.kode_sub_giat}
                          </span>
                          <span className="text-xs font-semibold text-slate-900 truncate">
                            {sub.nama_sub_giat}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                          <span>Unit: <strong>{sub.nama_sub_skpd || sub.nama_skpd}</strong></span>
                          <span>&bull;</span>
                          <span>Sumber Dana: <strong>{sub.nama_dana || 'DAU / DBH'}</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0 self-end md:self-center">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Pagu</span>
                          <span className="text-xs font-bold text-indigo-700 block">{formatRupiah(sub.pagu)}</span>
                        </div>

                        {/* Tombol Lihat Rincian Belanja RKA */}
                        <button
                          onClick={() => handleOpenDetailModal(sub.id)}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                          title="Lihat Rincian Rekening RKA"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span>Rincian RKA</span>
                        </button>

                        {/* Tombol Cetak RKA Dokumen Resmi */}
                        <button
                          onClick={() => handleOpenPrint(sub.id, 'rincian')}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                          title="Cetak Formulir Resmi RKA (A4 Landscape)"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Cetak RKA</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Sub Kegiatan Pagination */}
              {subPagination.last_page > 1 && (
                <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Halaman {subPagination.current_page} dari {subPagination.last_page} ({subPagination.total} Total)</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setSubPage(p => Math.max(p - 1, 1))}
                      disabled={subPage <= 1}
                      className="p-1 rounded-md border border-slate-200 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setSubPage(p => Math.min(p + 1, subPagination.last_page))}
                      disabled={subPage >= subPagination.last_page}
                      className="p-1 rounded-md border border-slate-200 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PENDAPATAN DAERAH */}
      {activeTab === 'pendapatan' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <div>
                <h2 className="text-sm font-bold text-slate-800">Target Rekening Pendapatan Daerah</h2>
                <p className="text-[11px] text-slate-500">Total: <strong className="text-emerald-700">{formatRupiah(pendapatanSummary)}</strong></p>
              </div>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari kode akun atau nama..."
                value={pendapatanSearch}
                onChange={(e) => {
                  setPendapatanSearch(e.target.value);
                  setPendapatanPage(1);
                }}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500"
              />
            </div>
          </div>

          {pendapatanLoading ? (
            <div className="p-12 text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-3" />
              <p className="text-xs text-slate-500 font-medium">Memuat data pendapatan...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 w-12 text-center">No</th>
                    <th className="px-4 py-3">Perangkat Daerah</th>
                    <th className="px-4 py-3">Kode Akun</th>
                    <th className="px-4 py-3">Nama Akun / Uraian</th>
                    <th className="px-4 py-3 text-right w-44">Target Anggaran</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pendapatanData.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-4 py-3 text-center text-slate-400">
                        {(pendapatanPagination.from || 1) + idx}
                      </td>
                      <td className="px-4 py-3 text-slate-700 font-medium">{item.nama_skpd}</td>
                      <td className="px-4 py-3 font-mono text-slate-700">{item.kode_akun}</td>
                      <td className="px-4 py-3 text-slate-800">
                        <div className="font-semibold">{item.nama_akun}</div>
                        {item.uraian && <div className="text-[11px] text-slate-500">{item.uraian}</div>}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-700">{formatRupiah(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PEMBIAYAAN DAERAH */}
      {activeTab === 'pembiayaan' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  onClick={() => setPembiayaanTipe('penerimaan')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    pembiayaanTipe === 'penerimaan'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Penerimaan Pembiayaan
                </button>
                <button
                  onClick={() => setPembiayaanTipe('pengeluaran')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    pembiayaanTipe === 'pengeluaran'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Pengeluaran Pembiayaan
                </button>
              </div>

              <span className="text-xs text-slate-500">
                Total: <strong className={pembiayaanTipe === 'penerimaan' ? 'text-emerald-700' : 'text-rose-700'}>
                  {formatRupiah(pembiayaanSummary)}
                </strong>
              </span>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari kode akun pembiayaan..."
                value={pembiayaanSearch}
                onChange={(e) => {
                  setPembiayaanSearch(e.target.value);
                  setPembiayaanPage(1);
                }}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500"
              />
            </div>
          </div>

          {pembiayaanLoading ? (
            <div className="p-12 text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-3" />
              <p className="text-xs text-slate-500 font-medium">Memuat data pembiayaan...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 w-12 text-center">No</th>
                    <th className="px-4 py-3">Perangkat Daerah</th>
                    <th className="px-4 py-3">Kode Akun</th>
                    <th className="px-4 py-3">Nama Akun / Uraian</th>
                    <th className="px-4 py-3 text-right w-44">Nilai Anggaran</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pembiayaanData.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-4 py-3 text-center text-slate-400">
                        {(pembiayaanPagination.from || 1) + idx}
                      </td>
                      <td className="px-4 py-3 text-slate-700 font-medium">{item.nama_skpd}</td>
                      <td className="px-4 py-3 font-mono text-slate-700">{item.kode_akun}</td>
                      <td className="px-4 py-3 text-slate-800">
                        <div className="font-semibold">{item.nama_akun}</div>
                        {item.uraian && <div className="text-[11px] text-slate-500">{item.uraian}</div>}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900">{formatRupiah(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* DETAIL MODAL SUB KEGIATAN & RKA */}
      {detailSub && (
        <SubKegiatanDetailModal
          sub={detailSub}
          onClose={() => setDetailSub(null)}
          onOpenPrint={(subId, mode) => handleOpenPrint(subId, mode)}
        />
      )}
    </div>
  );
}
