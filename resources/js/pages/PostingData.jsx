import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import PostingExplorer from './PostingExplorer';
import { 
  BookmarkCheck, 
  RefreshCw, 
  RotateCcw, 
  Trash2, 
  Eye, 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  Clock, 
  User, 
  Building2, 
  ShoppingBag, 
  TrendingUp, 
  Scale, 
  Coins, 
  FileText,
  X,
  ArrowRight,
  ShieldCheck,
  Layers,
  ArrowDownToLine,
  SlidersHorizontal,
  Tag,
  Check,
  FolderOpen,
  BarChart3
} from 'lucide-react';

export default function PostingData({ tahunAnggaran = '2026' }) {
  const [sessions, setSessions] = useState([]);
  const [activeStats, setActiveStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [notification, setNotification] = useState(null);

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showActiveStatsModal, setShowActiveStatsModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailActiveTab, setDetailActiveTab] = useState('belanja');

  // Confirmation Modals
  const [confirmAction, setConfirmAction] = useState(null); // { type: 'overwrite' | 'unposting' | 'delete', session: obj }

  // Explorer Mode State
  const [exploringSession, setExploringSession] = useState(null);

  // Tahapan State
  const [tahapanList, setTahapanList] = useState([]);
  const [showTahapanModal, setShowTahapanModal] = useState(false);
  const [newTahapInput, setNewTahapInput] = useState({ nama_tahap: '', keterangan: '' });
  const [showInlineAddTahap, setShowInlineAddTahap] = useState(false);
  const [inlineTahapName, setInlineTahapName] = useState('');

  // Filter & Sort State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTahap, setFilterTahap] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest' | 'oldest'

  // Form State
  const [formData, setFormData] = useState({
    nama_posting: '',
    tahap: 'Rancangan',
    keterangan: '',
  });

  const formatRupiah = (val) => {
    return 'Rp ' + Number(val || 0).toLocaleString('id-ID', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatShortScale = (val) => {
    const num = Number(val || 0);
    const abs = Math.abs(num);
    const sign = num < 0 ? '-' : '';
    if (abs >= 1e12) {
      return `${sign}Rp ${(abs / 1e12).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} T`;
    }
    if (abs >= 1e9) {
      return `${sign}Rp ${(abs / 1e9).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} M`;
    }
    if (abs >= 1e6) {
      return `${sign}Rp ${(abs / 1e6).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Jt`;
    }
    return formatRupiah(num);
  };

  const formatScaleWords = (val) => {
    const num = Number(val || 0);
    const abs = Math.abs(num);
    if (abs === 0) return 'Nol rupiah';
    const sign = num < 0 ? '-' : '';
    if (abs >= 1e12) {
      return `≈ ${sign}${(abs / 1e12).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Triliun`;
    }
    if (abs >= 1e9) {
      return `≈ ${sign}${(abs / 1e9).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Miliar`;
    }
    if (abs >= 1e6) {
      return `≈ ${sign}${(abs / 1e6).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Juta`;
    }
    return formatRupiah(num);
  };

  const isSyncedWithActive = (s) => {
    if (!activeStats || !s) return false;
    return (
      Math.abs(Number(s.total_belanja || 0) - Number(activeStats.total_belanja || 0)) < 0.01 &&
      Math.abs(Number(s.total_pendapatan || 0) - Number(activeStats.total_pendapatan || 0)) < 0.01 &&
      Math.abs(Number(s.total_pembiayaan_netto || 0) - Number(activeStats.total_pembiayaan_netto || 0)) < 0.01
    );
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const showNotify = (type, message) => {
    if (type === 'success') {
      toast.success(message);
    } else {
      toast.error(message);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ tahun: String(tahunAnggaran) });
      const res = await fetch(`/api/posting?${params.toString()}`);
      const json = await res.json();
      if (json.status === 'success') {
        setSessions(json.data.sessions || []);
        setActiveStats(json.data.active_stats || null);
        if (json.data.tahapan && json.data.tahapan.length > 0) {
          setTahapanList(json.data.tahapan);
          setFormData(prev => ({
            ...prev,
            tahap: prev.tahap && json.data.tahapan.some(t => t.nama_tahap === prev.tahap)
              ? prev.tahap 
              : json.data.tahapan[0].nama_tahap
          }));
        }
      }
    } catch (err) {
      console.error(err);
      showNotify('error', 'Gagal memuat data posting.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTahapan = async () => {
    try {
      const res = await fetch('/api/posting/tahapan');
      const json = await res.json();
      if (json.status === 'success') {
        setTahapanList(json.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveTahapan = async (nama, keterangan = '') => {
    if (!nama.trim()) {
      showNotify('error', 'Nama tahapan wajib diisi!');
      return;
    }
    try {
      setProcessing(true);
      const res = await fetch('/api/posting/tahapan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({ nama_tahap: nama.trim(), keterangan })
      });
      const json = await res.json();
      if (json.status === 'success') {
        showNotify('success', json.message);
        setNewTahapInput({ nama_tahap: '', keterangan: '' });
        setInlineTahapName('');
        setShowInlineAddTahap(false);
        setFormData(prev => ({ ...prev, tahap: json.data.nama_tahap }));
        fetchTahapan();
      } else {
        showNotify('error', json.message || 'Gagal menambahkan tahapan.');
      }
    } catch (err) {
      console.error(err);
      showNotify('error', 'Terjadi kesalahan saat menambahkan tahapan.');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteTahapan = async (id, nama) => {
    if (!confirm(`Hapus tahapan "${nama}"?`)) return;
    try {
      setProcessing(true);
      const res = await fetch(`/api/posting/tahapan/${id}`, {
        method: 'DELETE',
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
      });
      const json = await res.json();
      if (json.status === 'success') {
        showNotify('success', json.message);
        fetchTahapan();
      } else {
        showNotify('error', json.message || 'Gagal menghapus tahapan.');
      }
    } catch (err) {
      console.error(err);
      showNotify('error', 'Terjadi kesalahan saat menghapus tahapan.');
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tahunAnggaran]);

  // Handle Buat Posting Baru
  const handleCreatePosting = async (e) => {
    e.preventDefault();
    if (!formData.tahap) {
      showNotify('error', 'Silakan pilih tahapan anggaran terlebih dahulu!');
      return;
    }

    try {
      setProcessing(true);
      const res = await fetch('/api/posting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({
          nama_posting: formData.tahap,
          tahap: formData.tahap,
          tahun_anggaran: Number(tahunAnggaran),
          keterangan: formData.keterangan,
        })
      });
      const json = await res.json();
      if (json.status === 'success') {
        showNotify('success', json.message);
        setShowCreateModal(false);
        setFormData(prev => ({ ...prev, keterangan: '' }));
        fetchData();
      } else {
        showNotify('error', json.message || 'Gagal memposting data.');
      }
    } catch (err) {
      console.error(err);
      showNotify('error', 'Terjadi kesalahan saat memposting data.');
    } finally {
      setProcessing(false);
    }
  };

  // Handle Tindih Posting dari Data Aktif
  const handleOverwrite = async (session) => {
    try {
      setProcessing(true);
      const res = await fetch(`/api/posting/${session.id}/overwrite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
      const json = await res.json();
      if (json.status === 'success') {
        showNotify('success', json.message);
        setConfirmAction(null);
        fetchData();
      } else {
        showNotify('error', json.message || 'Gagal menindih data.');
      }
    } catch (err) {
      console.error(err);
      showNotify('error', 'Terjadi kesalahan saat menindih data.');
    } finally {
      setProcessing(false);
    }
  };

  // Handle Unposting ke Data Aktif
  const handleUnposting = async (session) => {
    try {
      setProcessing(true);
      const res = await fetch(`/api/posting/${session.id}/unposting`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
      const json = await res.json();
      if (json.status === 'success') {
        showNotify('success', json.message);
        setConfirmAction(null);
        fetchData();
      } else {
        showNotify('error', json.message || 'Gagal unposting data.');
      }
    } catch (err) {
      console.error(err);
      showNotify('error', 'Terjadi kesalahan saat unposting data.');
    } finally {
      setProcessing(false);
    }
  };

  // Handle Hapus Posting
  const handleDelete = async (session) => {
    try {
      setProcessing(true);
      const res = await fetch(`/api/posting/${session.id}`, {
        method: 'DELETE',
        headers: {
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
      const json = await res.json();
      if (json.status === 'success') {
        showNotify('success', json.message);
        setConfirmAction(null);
        fetchData();
      } else {
        showNotify('error', json.message || 'Gagal menghapus posting.');
      }
    } catch (err) {
      console.error(err);
      showNotify('error', 'Terjadi kesalahan saat menghapus posting.');
    } finally {
      setProcessing(false);
    }
  };

  // Lihat Detail Posting
  const handleOpenDetail = async (session) => {
    try {
      setDetailLoading(true);
      setShowDetailModal(true);
      const res = await fetch(`/api/posting/${session.id}`);
      const json = await res.json();
      if (json.status === 'success') {
        setDetailData(json.data);
      }
    } catch (err) {
      console.error(err);
      showNotify('error', 'Gagal memuat rincian posting.');
    } finally {
      setDetailLoading(false);
    }
  };

  // Jika sedang membuka mode penjelajah arsip posting (Posting Explorer)
  if (exploringSession) {
    return (
      <>
        {confirmAction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 text-center">
              {confirmAction.type === 'unposting' && (
                <>
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                    <RotateCcw className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Unposting ke Data Aktif?</h3>
                  <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-3 my-3 text-left text-xs text-slate-700 space-y-1">
                    <p className="font-semibold text-indigo-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-indigo-600" />
                      Perhatian Penggantian Data Aktif:
                    </p>
                    <p>
                      Data aktif saat ini akan <strong>dikosongkan dan digantikan seluruhnya</strong> dengan data dari postingan <strong>"{confirmAction.session.nama_posting}"</strong>.
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => setConfirmAction(null)}
                      disabled={processing}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      onClick={() => handleUnposting(confirmAction.session)}
                      disabled={processing}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      {processing ? 'Memulihkan...' : 'Ya, Gantikan Data Aktif'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
        <PostingExplorer
          session={exploringSession}
          onBack={() => {
            setExploringSession(null);
            fetchData();
          }}
          onUnposting={(s) => setConfirmAction({ type: 'unposting', session: s })}
        />
      </>
    );
  }

  const latestSession = sessions[0] || null;
  const latestIsSynced = latestSession ? isSyncedWithActive(latestSession) : false;

  const uniqueTahapOptions = Array.from(new Set(sessions.map((s) => s.tahap).filter(Boolean)));

  const filteredSessions = sessions
    .filter((s) => {
      if (filterTahap !== 'all' && s.tahap !== filterTahap) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTahap = (s.tahap || '').toLowerCase().includes(q);
        const matchNama = (s.nama_posting || '').toLowerCase().includes(q);
        const matchKet = (s.keterangan || '').toLowerCase().includes(q);
        const matchUser = (s.posted_by || '').toLowerCase().includes(q);
        return matchTahap || matchNama || matchKet || matchUser;
      }
      return true;
    })
    .sort((a, b) => (sortOrder === 'oldest' ? a.id - b.id : b.id - a.id));

  return (
    <div className="space-y-5">
      {/* Header Halaman */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0">
            <BookmarkCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Posting Data Anggaran</h1>
              <span className="px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-bold">
                TA {tahunAnggaran}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Pantau kondisi anggaran aktif, kelola arsip snapshot, perbarui (tindih), atau pulihkan (unposting) data
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeStats && (
            <button
              onClick={() => setShowActiveStatsModal(true)}
              className="px-3.5 py-2 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center gap-2 transition cursor-pointer shadow-xs"
              title={`Lihat Ringkasan Data Aktif Berjalan TA ${tahunAnggaran}`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
              <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Detail Data Aktif</span>
            </button>
          )}

          <button
            onClick={() => setShowTahapanModal(true)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            title="Kelola & Tambah Tahapan Anggaran"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
            <span>Atur Tahapan</span>
          </button>

          <button
            onClick={fetchData}
            disabled={loading || processing}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            title="Muat Ulang"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-600' : 'text-slate-500'}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-2 transition cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Posting Data Aktif Baru</span>
          </button>
        </div>
      </div>

      {/* 4 Kartu Ringkasan Eksekutif (Enterprise Summary Strip) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Total Posting</p>
            <p className="text-xl font-extrabold text-slate-900 tabular-nums mt-0.5">{sessions.length}</p>
            <p className="text-[11px] text-slate-400 truncate">Arsip snapshot TA {tahunAnggaran}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Posting Terbaru</p>
            <p className="text-sm font-bold text-slate-900 truncate mt-0.5">
              {latestSession ? latestSession.tahap : 'Belum ada'}
            </p>
            <p className="text-[11px] text-slate-400 truncate">
              {latestSession ? formatDate(latestSession.last_synced_at || latestSession.created_at) : 'Belum ada snapshot'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => activeStats && setShowActiveStatsModal(true)}
          className="bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 p-4 shadow-xs flex items-center gap-3.5 text-left transition cursor-pointer"
          title="Klik untuk melihat rincian Data Aktif Berjalan"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Total Belanja Aktif</p>
            <p className="text-lg font-extrabold text-indigo-700 tabular-nums truncate mt-0.5">
              {activeStats ? formatShortScale(activeStats.total_belanja) : '-'}
            </p>
            <p className="text-[11px] text-slate-400 truncate tabular-nums">
              {activeStats ? `${activeStats.jumlah_skpd} SKPD • ${activeStats.jumlah_sub_kegiatan} Sub Giat` : 'Memuat...'}
            </p>
          </div>
        </button>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center gap-3.5">
          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${
            latestSession && latestIsSynced
              ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
              : 'bg-amber-50 border-amber-100 text-amber-600'
          }`}>
            {latestSession && latestIsSynced ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Status Sinkronisasi</p>
            <p className={`text-sm font-bold truncate mt-0.5 ${
              latestSession && latestIsSynced ? 'text-emerald-700' : 'text-amber-700'
            }`}>
              {!latestSession
                ? 'Belum Diposting'
                : latestIsSynced
                ? 'Selaras Data Aktif'
                : 'Ada Perubahan Aktif'}
            </p>
            <p className="text-[11px] text-slate-400 truncate">
              {!latestSession
                ? 'Silakan posting data aktif'
                : latestIsSynced
                ? `Sama dengan ${latestSession.tahap}`
                : 'Data aktif berbeda dari arsip terakhir'}
            </p>
          </div>
        </div>
      </div>

      {/* Daftar Riwayat Sesi Posting */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Header & Toolbar Filter */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Layers className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-800">Daftar Arsip &amp; Snapshot Posting</h2>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold tabular-nums">
              {filteredSessions.length}{filteredSessions.length !== sessions.length ? ` / ${sessions.length}` : ''} Posting
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari tahapan atau catatan..."
                className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48 sm:w-56"
              />
            </div>

            {uniqueTahapOptions.length > 1 && (
              <select
                value={filterTahap}
                onChange={(e) => setFilterTahap(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="all">Semua Tahapan</option>
                {uniqueTahapOptions.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            )}

            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="newest">Terbaru Dulu</option>
              <option value="oldest">Terlama Dulu</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-3" />
            <p className="text-xs font-medium text-slate-500">Memuat data posting...</p>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 mx-auto mb-3">
              <BookmarkCheck className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">
              {sessions.length === 0 ? 'Belum Ada Data Posting' : 'Tidak Ada Hasil yang Cocok'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5">
              {sessions.length === 0
                ? `Anda belum memiliki arsip postingan anggaran untuk TA ${tahunAnggaran}. Klik tombol di bawah untuk membekukan data aktif saat ini.`
                : 'Coba ubah kata kunci pencarian atau filter tahapan.'}
            </p>
            {sessions.length === 0 && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold inline-flex items-center gap-2 transition cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Posting Data Aktif Sekarang</span>
              </button>
            )}
          </div>
        ) : (
          <div className="p-4 sm:p-5 space-y-4 bg-slate-50/40">
            {filteredSessions.map((s, idx) => {
              const synced = isSyncedWithActive(s);
              const surplus = Number(s.total_pendapatan || 0) - Number(s.total_belanja || 0);
              return (
                <div
                  key={s.id}
                  className={`bg-white rounded-2xl border p-5 transition shadow-2xs hover:shadow-sm flex flex-col gap-4 ${
                    synced ? 'border-emerald-200 ring-1 ring-emerald-100' : 'border-slate-200'
                  }`}
                >
                  {/* Baris Atas: Nomor Daftar + Status + Nama Tahapan + Metadata */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-extrabold tabular-nums">
                          #{idx + 1}
                        </span>
                        {synced ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Selaras Data Aktif</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-semibold">
                            Arsip Snapshot
                          </span>
                        )}
                        <h3 className="text-base font-bold text-slate-900 tracking-tight">{s.tahap}</h3>
                        {s.nama_posting && s.nama_posting !== s.tahap && (
                          <span className="text-xs font-medium text-slate-500">({s.nama_posting})</span>
                        )}
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-semibold">
                          TA {s.tahun_anggaran}
                        </span>
                      </div>

                      {s.keterangan && (
                        <p className="text-xs text-slate-600">{s.keterangan}</p>
                      )}

                      <div className="flex items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 flex-wrap pt-0.5">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>Diposting: <strong className="text-slate-700">{formatDate(s.created_at)}</strong></span>
                        </div>
                        {s.last_synced_at && s.last_synced_at !== s.created_at && (
                          <div className="flex items-center gap-1.5 text-indigo-600 font-medium">
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Ditindih: {formatDate(s.last_synced_at)}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>Oleh: <strong className="text-slate-700">{s.posted_by || 'Admin'}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span><strong className="text-slate-700">{s.jumlah_skpd}</strong> SKPD &bull; <strong className="text-slate-700">{Number(s.jumlah_sub_kegiatan || 0).toLocaleString('id-ID')}</strong> Sub Kegiatan</span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 text-left sm:text-right">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">Surplus / (Defisit)</span>
                      <span className={`text-xs font-bold tabular-nums ${surplus >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                        {formatRupiah(surplus)}
                      </span>
                    </div>
                  </div>

                  {/* Baris Tengah: Nominal Anggaran Sebagai Pusat Perhatian */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                    <div className="rounded-xl border border-slate-200/90 bg-slate-50/70 p-3.5 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                        <ShoppingBag className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[11px] font-semibold text-slate-500 block">Belanja</span>
                        <span className="text-sm sm:text-base font-extrabold text-indigo-700 tabular-nums whitespace-nowrap block">
                          {formatRupiah(s.total_belanja)}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium block">{formatScaleWords(s.total_belanja)}</span>
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200/90 bg-slate-50/70 p-3.5 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[11px] font-semibold text-slate-500 block">Pendapatan</span>
                        <span className="text-sm sm:text-base font-extrabold text-emerald-700 tabular-nums whitespace-nowrap block">
                          {formatRupiah(s.total_pendapatan)}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium block">{formatScaleWords(s.total_pendapatan)}</span>
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200/90 bg-slate-50/70 p-3.5 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                        <Scale className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[11px] font-semibold text-slate-500 block">Pembiayaan Netto</span>
                        <span className="text-sm sm:text-base font-extrabold text-slate-800 tabular-nums whitespace-nowrap block">
                          {formatRupiah(s.total_pembiayaan_netto)}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium block">{formatScaleWords(s.total_pembiayaan_netto)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Baris Bawah: Status & Tombol Aksi Lengkap di Semua Tahapan */}
                  <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                      {synced ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="text-emerald-700 font-medium">Nominal snapshot sama persis dengan data aktif berjalan.</span>
                        </>
                      ) : (
                        <>
                          <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Gunakan <strong>Tindih</strong> untuk memperbarui dari data aktif, atau <strong>Unposting</strong> untuk memulihkan.</span>
                        </>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 self-end sm:self-auto">
                      <button
                        onClick={() => setExploringSession(s)}
                        className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                        title="Jelajahi Rincian SKPD, Sub Kegiatan, dan Cetak RKA arsip ini"
                      >
                        <FolderOpen className="w-3.5 h-3.5" />
                        <span>Lihat Data Lengkap</span>
                      </button>

                      <button
                        onClick={() => setConfirmAction({ type: 'overwrite', session: s })}
                        className="px-3 py-1.5 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                        title="Tindih postingan ini dengan Data Aktif saat ini"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
                        <span>Tindih</span>
                      </button>

                      <button
                        onClick={() => setConfirmAction({ type: 'unposting', session: s })}
                        className="px-3 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                        title="Gantikan Data Aktif dengan data dari posting ini"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Unposting</span>
                      </button>

                      <button
                        onClick={() => setConfirmAction({ type: 'delete', session: s })}
                        className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                        title="Hapus Sesi Posting"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL 0: RINGKASAN DATA AKTIF BERJALAN */}
      {showActiveStatsModal && activeStats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-2xl w-full overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">Ringkasan Data Aktif Berjalan</h3>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
                      TA {tahunAnggaran}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {activeStats.jumlah_skpd} SKPD &bull; {activeStats.jumlah_sub_kegiatan} Sub Kegiatan &bull; {activeStats.jumlah_rekening_rka} Rincian RKA
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowActiveStatsModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-slate-50/50">
              <div className="bg-white border border-slate-200 p-4 rounded-xl">
                <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
                  <ShoppingBag className="w-4 h-4 text-indigo-600" />
                  <span>Total Belanja Aktif</span>
                </div>
                <p className="text-base font-bold text-slate-900 mt-1.5 tabular-nums">{formatRupiah(activeStats.total_belanja)}</p>
              </div>

              <div className="bg-white border border-slate-200 p-4 rounded-xl">
                <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span>Total Pendapatan Aktif</span>
                </div>
                <p className="text-base font-bold text-emerald-700 mt-1.5 tabular-nums">{formatRupiah(activeStats.total_pendapatan)}</p>
              </div>

              <div className="bg-white border border-slate-200 p-4 rounded-xl">
                <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
                  <Scale className="w-4 h-4 text-amber-600" />
                  <span>Pembiayaan Netto</span>
                </div>
                <p className="text-base font-bold text-slate-900 mt-1.5 tabular-nums">{formatRupiah(activeStats.total_pembiayaan_netto)}</p>
              </div>

              <div className="bg-white border border-slate-200 p-4 rounded-xl">
                <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
                  <Coins className="w-4 h-4 text-sky-600" />
                  <span>Surplus / (Defisit)</span>
                </div>
                <p className={`text-base font-bold mt-1.5 tabular-nums ${
                  activeStats.surplus_defisit >= 0 ? 'text-emerald-700' : 'text-rose-600'
                }`}>
                  {formatRupiah(activeStats.surplus_defisit)}
                </p>
              </div>
            </div>

            <div className="px-5 py-3.5 border-t border-slate-100 bg-white flex items-center justify-end gap-2">
              <button
                onClick={() => setShowActiveStatsModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer"
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  setShowActiveStatsModal(false);
                  setShowCreateModal(true);
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Posting Data Ini</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: BUAT POSTING BARU */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <BookmarkCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Posting Data Aktif Baru</h3>
                  <p className="text-[11px] text-slate-500">Membekukan kondisi data aktif saat ini ke arsip</p>
                </div>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePosting} className="p-5 space-y-4">
              {activeStats && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Belanja Aktif:</span>
                    <strong className="text-slate-800">{formatRupiah(activeStats.total_belanja)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Pendapatan:</span>
                    <strong className="text-slate-800">{formatRupiah(activeStats.total_pendapatan)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Jumlah Sub Kegiatan:</span>
                    <strong className="text-slate-800">{activeStats.jumlah_sub_kegiatan} Sub Giat</strong>
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Pilih Tahapan Anggaran <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowInlineAddTahap(!showInlineAddTahap)}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 transition cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{showInlineAddTahap ? 'Pilih dari Daftar' : 'Tambah Tahap Baru'}</span>
                  </button>
                </div>

                {!showInlineAddTahap ? (
                  <>
                    <select
                      value={formData.tahap}
                      onChange={(e) => setFormData({ ...formData, tahap: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white"
                    >
                      {tahapanList.map((t) => (
                        <option key={t.id} value={t.nama_tahap}>
                          {t.nama_tahap}
                        </option>
                      ))}
                      {tahapanList.length === 0 && (
                        <option value="Rancangan">Rancangan</option>
                      )}
                    </select>

                    <p className="mt-1.5 text-[11px] text-slate-500 flex items-center gap-1">
                      <span>Nama posting:</span>
                      <strong className="text-indigo-700">{formData.tahap || '-'}</strong>
                    </p>
                  </>
                ) : (
                  <div className="p-3 bg-indigo-50/60 border border-indigo-200 rounded-xl space-y-2 animate-in fade-in duration-150">
                    <p className="text-[11px] font-medium text-indigo-900">Masukkan nama tahapan baru:</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Contoh: Pra-RKA / Evaluasi Banggar"
                        value={inlineTahapName}
                        onChange={(e) => setInlineTahapName(e.target.value)}
                        className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-indigo-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-200 bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveTahapan(inlineTahapName)}
                        disabled={processing || !inlineTahapName.trim()}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition cursor-pointer disabled:opacity-50"
                      >
                        Simpan
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan / Keterangan (Opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Keterangan tambahan mengenai versi postingan ini..."
                  value={formData.keterangan}
                  onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                ></textarea>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {processing ? 'Menyimpan...' : 'Posting Sekarang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: KONFIRMASI TINDIH / UNPOSTING / HAPUS */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 text-center">
            {confirmAction.type === 'overwrite' && (
              <>
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
                  <RefreshCw className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Tindih Data Posting?</h3>
                <p className="text-xs text-slate-600 mt-2 mb-4">
                  Data pada postingan <strong className="text-slate-900">"{confirmAction.session.nama_posting}"</strong> akan digantikan dengan seluruh data aktif saat ini.
                </p>
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => setConfirmAction(null)}
                    disabled={processing}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => handleOverwrite(confirmAction.session)}
                    disabled={processing}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {processing ? 'Memproses...' : 'Ya, Tindih Data Posting'}
                  </button>
                </div>
              </>
            )}

            {confirmAction.type === 'unposting' && (
              <>
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                  <RotateCcw className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Unposting ke Data Aktif?</h3>
                <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-3 my-3 text-left text-xs text-slate-700 space-y-1">
                  <p className="font-semibold text-indigo-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    Perhatian Penggantian Data Aktif:
                  </p>
                  <p>
                    Data aktif saat ini akan <strong>dikosongkan dan digantikan seluruhnya</strong> dengan data dari postingan <strong>"{confirmAction.session.nama_posting}"</strong>.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => setConfirmAction(null)}
                    disabled={processing}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => handleUnposting(confirmAction.session)}
                    disabled={processing}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {processing ? 'Memulihkan...' : 'Ya, Gantikan Data Aktif'}
                  </button>
                </div>
              </>
            )}

            {confirmAction.type === 'delete' && (
              <>
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
                  <Trash2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Hapus Sesi Posting?</h3>
                <p className="text-xs text-slate-600 mt-2 mb-4">
                  Sesi posting <strong className="text-slate-900">"{confirmAction.session.nama_posting}"</strong> beserta seluruh arsip datanya akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
                </p>
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => setConfirmAction(null)}
                    disabled={processing}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => handleDelete(confirmAction.session)}
                    disabled={processing}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {processing ? 'Menghapus...' : 'Ya, Hapus'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* MODAL 3: LIHAT DETAIL / RINCIAN POSTING */}
      {showDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <BookmarkCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {detailData?.session?.nama_posting || 'Rincian Data Posting'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Tahap: {detailData?.session?.tahap} &bull; Diposting oleh: {detailData?.session?.posted_by}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowDetailModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            {detailLoading ? (
              <div className="p-16 text-center">
                <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-3" />
                <p className="text-xs font-medium text-slate-500">Memuat rincian arsip posting...</p>
              </div>
            ) : detailData ? (
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {/* Ringkasan Angka di Header Modal */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">Total Belanja</span>
                    <span className="text-xs font-bold text-indigo-700 block mt-0.5">{formatRupiah(detailData.session.total_belanja)}</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">Total Pendapatan</span>
                    <span className="text-xs font-bold text-emerald-700 block mt-0.5">{formatRupiah(detailData.session.total_pendapatan)}</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">Pembiayaan Netto</span>
                    <span className="text-xs font-bold text-slate-700 block mt-0.5">{formatRupiah(detailData.session.total_pembiayaan_netto)}</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">Surplus / Defisit</span>
                    <span className={`text-xs font-bold block mt-0.5 ${
                      detailData.session.surplus_defisit >= 0 ? 'text-emerald-700' : 'text-rose-700'
                    }`}>
                      {formatRupiah(detailData.session.surplus_defisit)}
                    </span>
                  </div>
                </div>

                {/* Tab Navigasi Rincian */}
                <div className="border-b border-slate-200 flex items-center gap-2">
                  <button
                    onClick={() => setDetailActiveTab('belanja')}
                    className={`px-3 py-2 text-xs font-semibold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                      detailActiveTab === 'belanja'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Rekap Belanja SKPD ({detailData.skpd_belanja?.length || 0})</span>
                  </button>
                  <button
                    onClick={() => setDetailActiveTab('pendapatan')}
                    className={`px-3 py-2 text-xs font-semibold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                      detailActiveTab === 'pendapatan'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Rekap Pendapatan SKPD ({detailData.skpd_pendapatan?.length || 0})</span>
                  </button>
                  <button
                    onClick={() => setDetailActiveTab('pembiayaan')}
                    className={`px-3 py-2 text-xs font-semibold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                      detailActiveTab === 'pembiayaan'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Scale className="w-3.5 h-3.5" />
                    <span>Pembiayaan Daerah ({detailData.pembiayaan?.length || 0})</span>
                  </button>
                </div>

                {/* Konten Tab Belanja */}
                {detailActiveTab === 'belanja' && (
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="px-3 py-2.5 w-10 text-center">No</th>
                          <th className="px-3 py-2.5">Kode SKPD</th>
                          <th className="px-3 py-2.5">Nama Perangkat Daerah</th>
                          <th className="px-3 py-2.5 text-center">Sub Giat</th>
                          <th className="px-3 py-2.5 text-right">Total Pagu</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {detailData.skpd_belanja && detailData.skpd_belanja.length > 0 ? (
                          detailData.skpd_belanja.map((item, idx) => (
                            <tr key={item.id_skpd} className="hover:bg-slate-50/70">
                              <td className="px-3 py-2 text-center text-slate-400">{idx + 1}</td>
                              <td className="px-3 py-2 font-mono font-medium text-slate-700">{item.kode_skpd}</td>
                              <td className="px-3 py-2 font-medium text-slate-800">{item.nama_skpd}</td>
                              <td className="px-3 py-2 text-center text-slate-600">{item.total_sub_kegiatan}</td>
                              <td className="px-3 py-2 text-right font-bold text-slate-900">{formatRupiah(item.total_pagu)}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="p-6 text-center text-slate-400">Tidak ada data belanja pada posting ini.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Konten Tab Pendapatan */}
                {detailActiveTab === 'pendapatan' && (
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="px-3 py-2.5 w-10 text-center">No</th>
                          <th className="px-3 py-2.5">Kode SKPD</th>
                          <th className="px-3 py-2.5">Nama Perangkat Daerah</th>
                          <th className="px-3 py-2.5 text-center">Rekening</th>
                          <th className="px-3 py-2.5 text-right">Total Target</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {detailData.skpd_pendapatan && detailData.skpd_pendapatan.length > 0 ? (
                          detailData.skpd_pendapatan.map((item, idx) => (
                            <tr key={item.id_skpd} className="hover:bg-slate-50/70">
                              <td className="px-3 py-2 text-center text-slate-400">{idx + 1}</td>
                              <td className="px-3 py-2 font-mono font-medium text-slate-700">{item.kode_skpd}</td>
                              <td className="px-3 py-2 font-medium text-slate-800">{item.nama_skpd}</td>
                              <td className="px-3 py-2 text-center text-slate-600">{item.total_rekening}</td>
                              <td className="px-3 py-2 text-right font-bold text-emerald-700">{formatRupiah(item.total_pendapatan)}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="p-6 text-center text-slate-400">Tidak ada data pendapatan pada posting ini.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Konten Tab Pembiayaan */}
                {detailActiveTab === 'pembiayaan' && (
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="px-3 py-2.5">Tipe</th>
                          <th className="px-3 py-2.5">Kode Akun</th>
                          <th className="px-3 py-2.5">Nama Akun / Uraian</th>
                          <th className="px-3 py-2.5 text-right">Nilai Anggaran</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {detailData.pembiayaan && detailData.pembiayaan.length > 0 ? (
                          detailData.pembiayaan.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/70">
                              <td className="px-3 py-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  item.tipe === 'penerimaan' 
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                    : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                }`}>
                                  {item.tipe}
                                </span>
                              </td>
                              <td className="px-3 py-2 font-mono font-medium text-slate-700">{item.kode_akun}</td>
                              <td className="px-3 py-2 text-slate-800">
                                <div className="font-medium">{item.nama_akun}</div>
                                {item.uraian && <div className="text-[11px] text-slate-500">{item.uraian}</div>}
                              </td>
                              <td className="px-3 py-2 text-right font-bold text-slate-900">{formatRupiah(item.total)}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="p-6 text-center text-slate-400">Tidak ada data pembiayaan pada posting ini.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : null}

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500">
                Data di atas merupakan arsip beku snapshot postingan.
              </span>
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: KELOLA & TAMBAH TAHAPAN POSTING */}
      {showTahapanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Kelola Tahapan Anggaran</h3>
                  <p className="text-[11px] text-slate-500">Sesuaikan pilihan tahapan untuk posting data</p>
                </div>
              </div>
              <button 
                onClick={() => setShowTahapanModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Form Tambah Tahapan Baru */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Tambah Tahapan Baru</span>
                </h4>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Nama Tahapan (misal: Pra-RKA / Pembahasan Banggar)"
                    value={newTahapInput.nama_tahap}
                    onChange={(e) => setNewTahapInput({ ...newTahapInput, nama_tahap: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500 bg-white"
                  />
                  <input
                    type="text"
                    placeholder="Catatan / keterangan (opsional)"
                    value={newTahapInput.keterangan}
                    onChange={(e) => setNewTahapInput({ ...newTahapInput, keterangan: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500 bg-white"
                  />
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      disabled={processing || !newTahapInput.nama_tahap.trim()}
                      onClick={() => handleSaveTahapan(newTahapInput.nama_tahap, newTahapInput.keterangan)}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      {processing ? 'Menyimpan...' : 'Simpan Tahapan'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Daftar Tahapan Saat Ini */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 mb-2 flex items-center justify-between">
                  <span>Daftar Tahapan Aktif ({tahapanList.length})</span>
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                  {tahapanList.map((t, idx) => (
                    <div key={t.id} className="p-3 flex items-center justify-between hover:bg-slate-50 transition">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-900 truncate">{t.nama_tahap}</p>
                          {t.keterangan && <p className="text-[10px] text-slate-500 truncate">{t.keterangan}</p>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {t.is_default ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-500">
                            Bawaan
                          </span>
                        ) : (
                          <button
                            onClick={() => handleDeleteTahapan(t.id, t.nama_tahap)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="Hapus Tahapan Kustom"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-500">
                Tahapan yang tersimpan akan otomatis muncul di form posting.
              </span>
              <button
                onClick={() => setShowTahapanModal(false)}
                className="px-4 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition cursor-pointer"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
