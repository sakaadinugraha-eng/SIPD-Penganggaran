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
  ChevronDown,
  Layers,
  FileText,
  SlidersHorizontal,
  X,
  FolderOpen,
  Building,
  Hospital,
  Stethoscope,
  ArrowUpRight
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
  const [skpdHierarchy, setSkpdHierarchy] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [skpdPagination, setSkpdPagination] = useState({});
  const [skpdSearch, setSkpdSearch] = useState('');
  const [skpdPage, setSkpdPage] = useState(1);
  const [skpdPerPage, setSkpdPerPage] = useState(15);
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
  const [skpdTabCounts, setSkpdTabCounts] = useState(null);

  const formatRupiah = (val) => {
    return 'Rp ' + Number(val || 0).toLocaleString('id-ID', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const toggleExpand = (kodeSkpd) => {
    setExpanded((prev) => ({
      ...prev,
      [kodeSkpd]: !prev[kodeSkpd],
    }));
  };

  const getUnitBadge = (sub) => {
    if (sub.unit_type === 'rsud') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
          <Hospital className="w-3 h-3" />
          <span>RSUD</span>
        </span>
      );
    }
    if (sub.unit_type === 'puskesmas') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <Stethoscope className="w-3 h-3" />
          <span>PUSKESMAS</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
        <Building className="w-3 h-3" />
        <span>KANTOR INDUK</span>
      </span>
    );
  };

  // 1. Fetch SKPD List in Posting
  const fetchSkpdList = async () => {
    setSkpdLoading(true);
    try {
      const url = `/api/posting/${session.id}/skpd-list?per_page=all`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.status === 'success') {
        const list = Array.isArray(json.data) ? json.data : (json.data?.data || []);
        setSkpdData(list);
        const hier = json.hierarchy || [];
        setSkpdHierarchy(hier);
        const initialExpand = {};
        hier.forEach((item) => {
          if (item.has_children) initialExpand[item.kode_skpd] = true;
        });
        setExpanded(initialExpand);
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
      if (selectedSkpd?.sub_skpd && selectedSkpd.sub_skpd !== 'all') {
        url += `&sub_skpd=${encodeURIComponent(selectedSkpd.sub_skpd)}`;
      }
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
        if (json.tab_counts) {
          setSkpdTabCounts(json.tab_counts);
        }
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
  const activeSkpdFilter = (belanjaView === 'subkegiatan' && selectedSkpd)
    ? (selectedSkpd.sub_skpd && selectedSkpd.sub_skpd !== 'all' ? selectedSkpd.sub_skpd : selectedSkpd.nama_skpd)
    : null;

  const fetchPendapatan = async () => {
    setPendapatanLoading(true);
    try {
      let url = `/api/posting/${session.id}/pendapatan?page=${pendapatanPage}&per_page=50`;
      if (activeSkpdFilter) url += `&skpd=${encodeURIComponent(activeSkpdFilter)}`;
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
      if (activeSkpdFilter) url += `&skpd=${encodeURIComponent(activeSkpdFilter)}`;
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
      <div className="bg-white text-slate-800 p-5 sm:p-6 rounded-2xl shadow-xs border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-4 border-b border-slate-100 gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
              title="Kembali ke Daftar Posting"
            >
              <ArrowLeft className="w-4 h-4 text-slate-500" />
              <span>Daftar Posting</span>
            </button>
            <div className="h-6 w-px bg-slate-200"></div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold uppercase tracking-wider">
                  ARSIP POSTING SNAPSHOT
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-semibold">
                  TA {session.tahun_anggaran}
                </span>
              </div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight mt-0.5">{session.nama_posting}</h1>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4">
          <div className="bg-slate-50/80 border border-slate-200/80 p-3.5 rounded-xl">
            <span className="text-[11px] text-slate-500 font-semibold uppercase block">Total Belanja</span>
            <span className="text-sm sm:text-base font-extrabold text-indigo-700 tabular-nums block mt-0.5">{formatRupiah(session.total_belanja)}</span>
          </div>
          <div className="bg-slate-50/80 border border-slate-200/80 p-3.5 rounded-xl">
            <span className="text-[11px] text-slate-500 font-semibold uppercase block">Total Pendapatan</span>
            <span className="text-sm sm:text-base font-extrabold text-emerald-700 tabular-nums block mt-0.5">{formatRupiah(session.total_pendapatan)}</span>
          </div>
          <div className="bg-slate-50/80 border border-slate-200/80 p-3.5 rounded-xl">
            <span className="text-[11px] text-slate-500 font-semibold uppercase block">Pembiayaan Netto</span>
            <span className="text-sm sm:text-base font-extrabold text-slate-800 tabular-nums block mt-0.5">{formatRupiah(session.total_pembiayaan_netto)}</span>
          </div>
          <div className="bg-slate-50/80 border border-slate-200/80 p-3.5 rounded-xl">
            <span className="text-[11px] text-slate-500 font-semibold uppercase block">Surplus / (Defisit)</span>
            <span className={`text-sm sm:text-base font-extrabold tabular-nums block mt-0.5 ${
              session.surplus_defisit >= 0 ? 'text-emerald-700' : 'text-rose-600'
            }`}>
              {formatRupiah(session.surplus_defisit)}
            </span>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-2">
        <button
          onClick={() => setActiveTab('belanja')}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'belanja'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>
            Belanja &amp; RKA ({activeSkpdFilter && subPagination.total !== undefined ? subPagination.total : session.jumlah_sub_kegiatan} Sub Giat)
          </span>
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
          <span>
            Pendapatan Daerah ({activeSkpdFilter && skpdTabCounts ? skpdTabCounts.pendapatan : session.jumlah_rekening_pendapatan} Rekening)
          </span>
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
          <span>
            Pembiayaan Daerah ({activeSkpdFilter && skpdTabCounts ? skpdTabCounts.pembiayaan : session.jumlah_rekening_pembiayaan} Rekening)
          </span>
        </button>
      </div>

      {/* TAB 1: BELANJA & RKA */}
      {activeTab === 'belanja' && (() => {
        const q = skpdSearch.trim().toLowerCase();
        const filteredHierarchy = skpdHierarchy.filter((parent) => {
          if (!q) return true;
          const matchParent =
            (parent.nama_skpd || '').toLowerCase().includes(q) ||
            (parent.kode_skpd || '').toLowerCase().includes(q);
          const matchChild = (parent.sub_units || []).some(
            (sub) =>
              (sub.nama_sub_skpd || '').toLowerCase().includes(q) ||
              (sub.kode_sub_skpd || '').toLowerCase().includes(q)
          );
          return matchParent || matchChild;
        });
        const totalHierPages = Math.max(1, Math.ceil(filteredHierarchy.length / skpdPerPage));
        const safeHierPage = Math.min(skpdPage, totalHierPages);
        const paginatedHierarchy = filteredHierarchy.slice(
          (safeHierPage - 1) * skpdPerPage,
          safeHierPage * skpdPerPage
        );

        return (
        <div className="space-y-4">
          {/* Sub View 1: SKPD LIST (Hierarki seperti Data Aktif) */}
          {belanjaView === 'skpd' && (
            <div className="space-y-3">
              {/* Search & Pagination Controls */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={skpdSearch}
                    onChange={(e) => {
                      setSkpdSearch(e.target.value);
                      setSkpdPage(1);
                    }}
                    placeholder="Cari nama atau kode perangkat daerah..."
                    className="w-full pl-9 pr-8 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  />
                  {skpdSearch && (
                    <button
                      type="button"
                      onClick={() => {
                        setSkpdSearch('');
                        setSkpdPage(1);
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

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
                        <option value="10">10 baris</option>
                        <option value="15">15 baris</option>
                        <option value="25">25 baris</option>
                        <option value="50">50 baris</option>
                        <option value="100">100 baris</option>
                      </select>
                      <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <button
                    onClick={fetchSkpdList}
                    disabled={skpdLoading}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-600 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${skpdLoading ? 'animate-spin text-indigo-600' : ''}`} />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              {/* Cascading Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px] tracking-wider">
                        <th className="py-3 px-4 w-12 text-center"></th>
                        <th className="py-3 px-4">Perangkat Daerah</th>
                        <th className="py-3 px-4 text-center w-36">Total Sub Kegiatan</th>
                        <th className="py-3 px-4 text-right w-52">Pagu Validasi</th>
                        <th className="py-3 px-4 text-center w-40">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {skpdLoading ? (
                        <tr>
                          <td colSpan="5" className="py-16 text-center text-slate-400">
                            <div className="flex flex-col items-center gap-2">
                              <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
                              <span className="text-xs font-medium">Memuat struktur SKPD arsip...</span>
                            </div>
                          </td>
                        </tr>
                      ) : filteredHierarchy.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="py-16 text-center text-slate-400">
                            <Building2 className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                            <p className="font-semibold text-slate-600">Tidak ada perangkat daerah ditemukan</p>
                          </td>
                        </tr>
                      ) : (
                        paginatedHierarchy.map((parent) => {
                          const isExp = expanded[parent.kode_skpd] ?? false;
                          return (
                            <React.Fragment key={parent.kode_skpd}>
                              <tr className="hover:bg-slate-50/80 transition group bg-white">
                                <td className="py-3.5 px-4 text-center">
                                  {parent.has_children ? (
                                    <button
                                      onClick={() => toggleExpand(parent.kode_skpd)}
                                      className="w-6 h-6 rounded flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition cursor-pointer"
                                      title={isExp ? 'Tutup sub-unit' : 'Lihat sub-unit'}
                                    >
                                      {isExp ? (
                                        <ChevronDown className="w-4 h-4 text-indigo-600" />
                                      ) : (
                                        <ChevronRight className="w-4 h-4" />
                                      )}
                                    </button>
                                  ) : (
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 inline-block"></span>
                                  )}
                                </td>
                                <td className="py-3.5 px-4">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-[11px] text-slate-500 font-semibold">
                                      {parent.kode_skpd}
                                    </span>
                                    {parent.has_children && (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                        TOTAL GABUNGAN
                                      </span>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => handleSelectSkpd({ ...parent, sub_skpd: 'all' })}
                                    className="font-bold text-slate-800 text-xs hover:text-indigo-600 transition text-left mt-0.5 block cursor-pointer"
                                  >
                                    {parent.nama_skpd}
                                  </button>
                                </td>
                                <td className="py-3.5 px-4 text-center font-bold text-slate-700 tabular-nums">
                                  {parent.total_sub_keg}
                                </td>
                                <td className="py-3.5 px-4 text-right font-bold text-slate-800 font-mono tabular-nums">
                                  {formatRupiah(parent.total_pagu)}
                                </td>
                                <td className="py-3.5 px-4 text-center">
                                  <button
                                    onClick={() => handleSelectSkpd({ ...parent, sub_skpd: 'all' })}
                                    className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-[11px] transition inline-flex items-center gap-1 cursor-pointer"
                                  >
                                    <FolderOpen className="w-3.5 h-3.5" />
                                    <span>Lihat Sub Kegiatan</span>
                                  </button>
                                </td>
                              </tr>

                              {parent.has_children && isExp && (
                                parent.sub_units.map((child, cIdx) => (
                                  <tr
                                    key={cIdx}
                                    className="bg-slate-50/60 hover:bg-indigo-50/40 transition border-t border-slate-100"
                                  >
                                    <td className="py-2.5 px-4 text-center"></td>
                                    <td className="py-2.5 px-4 pl-10">
                                      <div className="flex items-center gap-2">
                                        <span className="text-slate-400 font-mono text-[10px]">↳</span>
                                        <span className="font-mono text-[11px] text-slate-500">
                                          {child.kode_sub_skpd}
                                        </span>
                                        {getUnitBadge(child)}
                                      </div>
                                      <button
                                        onClick={() => handleSelectSkpd({
                                          ...parent,
                                          nama_skpd: parent.nama_skpd,
                                          kode_skpd: child.kode_sub_skpd,
                                          sub_skpd: child.nama_sub_skpd,
                                        })}
                                        className="font-semibold text-slate-700 text-xs hover:text-indigo-600 transition text-left mt-0.5 block pl-3.5 cursor-pointer"
                                      >
                                        {child.nama_sub_skpd}
                                      </button>
                                    </td>
                                    <td className="py-2.5 px-4 text-center font-semibold text-slate-600 tabular-nums">
                                      {child.count_sub}
                                    </td>
                                    <td className="py-2.5 px-4 text-right font-semibold text-slate-700 font-mono tabular-nums">
                                      {formatRupiah(child.total_pagu)}
                                    </td>
                                    <td className="py-2.5 px-4 text-center">
                                      <button
                                        onClick={() => handleSelectSkpd({
                                          ...parent,
                                          nama_skpd: parent.nama_skpd,
                                          kode_skpd: child.kode_sub_skpd,
                                          sub_skpd: child.nama_sub_skpd,
                                        })}
                                        className="px-2.5 py-1 rounded-lg bg-white hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 border border-slate-200 font-medium text-[11px] transition inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                                      >
                                        <span>Buka</span>
                                        <ArrowUpRight className="w-3 h-3" />
                                      </button>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </React.Fragment>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {totalHierPages > 1 && (
                  <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
                    <span>
                      Menampilkan <strong>{(safeHierPage - 1) * skpdPerPage + 1}</strong>–<strong>{Math.min(safeHierPage * skpdPerPage, filteredHierarchy.length)}</strong> dari <strong>{filteredHierarchy.length}</strong> SKPD
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        disabled={safeHierPage <= 1}
                        onClick={() => setSkpdPage((p) => Math.max(1, p - 1))}
                        className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="px-2.5 font-semibold tabular-nums">
                        {safeHierPage} / {totalHierPages}
                      </span>
                      <button
                        disabled={safeHierPage >= totalHierPages}
                        onClick={() => setSkpdPage((p) => Math.min(totalHierPages, p + 1))}
                        className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
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
                    <h2 className="text-sm font-bold text-slate-900">
                      {selectedSkpd.sub_skpd && selectedSkpd.sub_skpd !== 'all'
                        ? selectedSkpd.sub_skpd
                        : selectedSkpd.nama_skpd}
                    </h2>
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
        );
      })()}

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
          ) : pendapatanData.length === 0 ? (
            <div className="p-12 text-center">
              <TrendingUp className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">
                Tidak ada data rekening Pendapatan Daerah{activeSkpdFilter ? ` untuk ${activeSkpdFilter}` : ''}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                {pendapatanSearch ? 'Coba ubah kata kunci pencarian.' : 'Perangkat daerah ini tidak memiliki target pendapatan pada arsip posting ini.'}
              </p>
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
          ) : pembiayaanData.length === 0 ? (
            <div className="p-12 text-center">
              <Scale className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">
                Tidak ada data {pembiayaanTipe === 'penerimaan' ? 'Penerimaan' : 'Pengeluaran'} Pembiayaan{activeSkpdFilter ? ` untuk ${activeSkpdFilter}` : ''}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                {pembiayaanSearch ? 'Coba ubah kata kunci pencarian.' : 'Perangkat daerah ini tidak memiliki rekening pembiayaan pada arsip posting ini.'}
              </p>
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
