import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  Trash2, 
  AlertTriangle, 
  Building2, 
  CheckCircle2, 
  RefreshCw, 
  ShieldAlert, 
  Calculator,
  ShoppingBag,
  TrendingUp,
  Scale,
  Receipt,
  Layers,
  Check,
  Database
} from 'lucide-react';

export default function KosongkanData({ skpdList = [], onDataReset }) {
  const [activeMode, setActiveMode] = useState('skpd'); // 'skpd' | 'modul' | 'all'
  const [dbStats, setDbStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // State untuk Pembersihan per SKPD
  const [selectedSkpd, setSelectedSkpd] = useState('');
  const [skpdScope, setSkpdScope] = useState('all'); // 'all' | 'belanja' | 'pendapatan' | 'pembiayaan'
  const [loadingSkpd, setLoadingSkpd] = useState(false);
  const [messageSkpd, setMessageSkpd] = useState({ type: '', text: '' });
  const [mathSkpd, setMathSkpd] = useState({ a: 4, b: 5, answer: '' });

  // State untuk Pembersihan per Modul
  const [selectedModule, setSelectedModule] = useState('belanja'); // 'belanja' | 'pendapatan' | 'pembiayaan' | 'master'
  const [loadingModule, setLoadingModule] = useState(false);
  const [messageModule, setMessageModule] = useState({ type: '', text: '' });
  const [mathModule, setMathModule] = useState({ a: 6, b: 3, answer: '' });

  // State untuk Reset Total Database
  const [mathAll, setMathAll] = useState({ a: 8, b: 7, answer: '' });
  const [loadingAll, setLoadingAll] = useState(false);
  const [messageAll, setMessageAll] = useState({ type: '', text: '' });

  const formatRupiah = (num) => {
    return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
  };

  const generateMath = () => {
    const a = Math.floor(Math.random() * 10) + 2;
    const b = Math.floor(Math.random() * 10) + 2;
    return { a, b, answer: '' };
  };

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await fetch('/api/data/stats');
      const json = await res.json();
      if (json.status === 'success') {
        setDbStats(json.data);
      }
    } catch (e) {
      console.error('Error fetching stats:', e);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    setMathSkpd(generateMath());
    setMathModule(generateMath());
    setMathAll(generateMath());
    fetchStats();
  }, []);

  // 1. Eksekusi Kosongkan per SKPD
  const handleResetSkpd = async (e) => {
    e.preventDefault();
    if (!selectedSkpd) {
      toast.error('Pilih Perangkat Daerah terlebih dahulu.');
      return;
    }

    if (parseInt(mathSkpd.answer, 10) !== (mathSkpd.a + mathSkpd.b)) {
      toast.error(`Jawaban konfirmasi salah! ${mathSkpd.a} + ${mathSkpd.b} bukan ${mathSkpd.answer}.`);
      return;
    }

    setLoadingSkpd(true);
    setMessageSkpd({ type: '', text: '' });

    try {
      const res = await fetch('/api/data/reset-skpd', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ 
          nama_skpd: selectedSkpd,
          scope: skpdScope
        }),
      });

      const json = await res.json();
      if (res.ok && json.status === 'success') {
        toast.success(json.message);
        setMessageSkpd({ type: 'success', text: json.message });
        setSelectedSkpd('');
        setMathSkpd(generateMath());
        fetchStats();
        if (onDataReset) onDataReset();
      } else {
        const err = json.message || 'Gagal membersihkan data SKPD.';
        toast.error(err);
        setMessageSkpd({ type: 'error', text: err });
      }
    } catch (err) {
      toast.error('Terjadi kesalahan: ' + err.message);
      setMessageSkpd({ type: 'error', text: 'Terjadi kesalahan sistem: ' + err.message });
    } finally {
      setLoadingSkpd(false);
    }
  };

  // 2. Eksekusi Kosongkan per Modul
  const handleResetModule = async (e) => {
    e.preventDefault();
    if (parseInt(mathModule.answer, 10) !== (mathModule.a + mathModule.b)) {
      toast.error(`Jawaban konfirmasi matematika salah! ${mathModule.a} + ${mathModule.b} bukan ${mathModule.answer}.`);
      return;
    }

    setLoadingModule(true);
    setMessageModule({ type: '', text: '' });

    try {
      const res = await fetch('/api/data/reset-module', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ module: selectedModule }),
      });

      const json = await res.json();
      if (res.ok && json.status === 'success') {
        toast.success(json.message);
        setMessageModule({ type: 'success', text: json.message });
        setMathModule(generateMath());
        fetchStats();
        if (onDataReset) onDataReset();
      } else {
        const err = json.message || 'Gagal mengosongkan modul terpilih.';
        toast.error(err);
        setMessageModule({ type: 'error', text: err });
      }
    } catch (err) {
      toast.error('Terjadi kesalahan: ' + err.message);
      setMessageModule({ type: 'error', text: 'Terjadi kesalahan: ' + err.message });
    } finally {
      setLoadingModule(false);
    }
  };

  // 3. Eksekusi Reset Total Database
  const handleResetAll = async (e) => {
    e.preventDefault();
    if (parseInt(mathAll.answer, 10) !== (mathAll.a + mathAll.b)) {
      toast.error(`Jawaban konfirmasi matematika salah! ${mathAll.a} + ${mathAll.b} bukan ${mathAll.answer}.`);
      return;
    }

    setLoadingAll(true);
    setMessageAll({ type: '', text: '' });

    try {
      const res = await fetch('/api/data/reset-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      const json = await res.json();
      if (res.ok && json.status === 'success') {
        toast.success(json.message);
        setMessageAll({ type: 'success', text: json.message });
        setMathAll(generateMath());
        fetchStats();
        if (onDataReset) onDataReset();
      } else {
        const err = json.message || 'Gagal mengosongkan database.';
        toast.error(err);
        setMessageAll({ type: 'error', text: err });
      }
    } catch (err) {
      toast.error('Terjadi kesalahan: ' + err.message);
      setMessageAll({ type: 'error', text: 'Terjadi kesalahan: ' + err.message });
    } finally {
      setLoadingAll(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
            <Trash2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">Pembersihan Data SIPD</h1>
              <span className="px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-bold">
                Admin Maintenance
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Kelola dan bersihkan data hasil sinkronisasi per SKPD, per modul, atau reset database menyeluruh.
            </p>
          </div>
        </div>

        <button
          onClick={fetchStats}
          disabled={loadingStats}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingStats ? 'animate-spin text-rose-600' : ''}`} />
          <span>Refresh Status DB</span>
        </button>
      </div>

      {/* Ringkasan Status Database Saat Ini */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Belanja */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Belanja & RKA</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-bold text-slate-900 mt-2 font-mono">
            {formatRupiah(dbStats?.total_pagu || 0)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {(dbStats?.total_sub_kegiatan || 0).toLocaleString('id-ID')} sub kegiatan &bull; {(dbStats?.total_rka_item || 0).toLocaleString('id-ID')} RKA
          </p>
        </div>

        {/* Pendapatan */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pendapatan Daerah</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-bold text-slate-900 mt-2 font-mono">
            {formatRupiah(dbStats?.total_pendapatan_nilai || 0)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {(dbStats?.total_pendapatan_item || 0).toLocaleString('id-ID')} rekening penerimaan
          </p>
        </div>

        {/* Pembiayaan */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pembiayaan Daerah</span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-bold text-slate-900 mt-2 font-mono">
            {formatRupiah((dbStats?.total_pembiayaan_penerimaan || 0) + (dbStats?.total_pembiayaan_pengeluaran || 0))}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Penerimaan & pengeluaran pembiayaan
          </p>
        </div>

        {/* Master Data */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Data Master</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-bold text-slate-900 mt-2">
            {((dbStats?.total_master_akun || 0) + (dbStats?.total_sumber_dana || 0)).toLocaleString('id-ID')} item
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {(dbStats?.total_master_akun || 0).toLocaleString('id-ID')} akun &bull; {(dbStats?.total_sumber_dana || 0).toLocaleString('id-ID')} sumber dana
          </p>
        </div>
      </div>

      {/* Navigasi Pilihan Metode Pembersihan */}
      <div className="flex items-center gap-2 p-1 bg-slate-200/80 rounded-xl border border-slate-300/80 self-start w-fit">
        <button
          onClick={() => setActiveMode('skpd')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeMode === 'skpd'
              ? 'bg-white text-indigo-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>1. Bersihkan per SKPD</span>
        </button>

        <button
          onClick={() => setActiveMode('modul')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeMode === 'modul'
              ? 'bg-white text-indigo-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>2. Bersihkan per Modul</span>
        </button>

        <button
          onClick={() => setActiveMode('all')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeMode === 'all'
              ? 'bg-white text-rose-700 shadow-xs'
              : 'text-slate-600 hover:text-rose-700'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-rose-500" />
          <span>3. Reset Total Seluruh Database</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* MODE 1: BERSIHKAN PER SKPD */}
      {/* ============================================================== */}
      {activeMode === 'skpd' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 max-w-3xl">
          <div className="flex items-start gap-3.5 mb-5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Bersihkan Data per Perangkat Daerah (SKPD)</h3>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                Menghapus data milik SKPD terpilih secara menyeluruh (Belanja & RKA, Pendapatan, dan Pembiayaan). Data SKPD lainnya tetap aman.
              </p>
            </div>
          </div>

          {messageSkpd.text && (
            <div className={`mb-5 p-3.5 rounded-xl text-xs flex items-center gap-2.5 ${
              messageSkpd.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              {messageSkpd.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
              )}
              <span className="font-medium leading-relaxed">{messageSkpd.text}</span>
            </div>
          )}

          <form onSubmit={handleResetSkpd} className="space-y-4">
            {/* Pilihan SKPD */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Pilih Perangkat Daerah (SKPD):
              </label>
              <select
                value={selectedSkpd}
                onChange={(e) => setSelectedSkpd(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-xl text-xs text-slate-800 font-medium focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition cursor-pointer"
              >
                <option value="">-- Pilih Perangkat Daerah --</option>
                {skpdList.map((s, idx) => {
                  const parts = [];
                  if (s.total_sub_keg > 0) parts.push(`${s.total_sub_keg} Sub Kegiatan`);
                  if (s.total_pendapatan_rek > 0) parts.push(`${s.total_pendapatan_rek} Pendapatan`);
                  if (s.total_pembiayaan_rek > 0) parts.push(`${s.total_pembiayaan_rek} Pembiayaan`);
                  const metaText = parts.length > 0 ? ` (${parts.join(', ')})` : '';
                  return (
                    <option key={idx} value={s.nama_skpd}>
                      {s.nama_skpd}{metaText}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Pilihan Cakupan Data SKPD */}
            {selectedSkpd && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Cakupan Data yang Ingin Dihapus untuk SKPD Ini:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label className={`p-2.5 rounded-lg border flex items-center gap-2 cursor-pointer transition ${
                    skpdScope === 'all' 
                      ? 'bg-amber-50 border-amber-300 text-amber-900 font-semibold' 
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}>
                    <input 
                      type="radio" 
                      name="skpdScope" 
                      value="all" 
                      checked={skpdScope === 'all'} 
                      onChange={() => setSkpdScope('all')} 
                      className="accent-amber-600"
                    />
                    <span>Semua Modul (Belanja, Pendapatan, Pembiayaan)</span>
                  </label>

                  <label className={`p-2.5 rounded-lg border flex items-center gap-2 cursor-pointer transition ${
                    skpdScope === 'belanja' 
                      ? 'bg-amber-50 border-amber-300 text-amber-900 font-semibold' 
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}>
                    <input 
                      type="radio" 
                      name="skpdScope" 
                      value="belanja" 
                      checked={skpdScope === 'belanja'} 
                      onChange={() => setSkpdScope('belanja')} 
                      className="accent-amber-600"
                    />
                    <span>Hanya Belanja & RKA Saja</span>
                  </label>

                  <label className={`p-2.5 rounded-lg border flex items-center gap-2 cursor-pointer transition ${
                    skpdScope === 'pendapatan' 
                      ? 'bg-amber-50 border-amber-300 text-amber-900 font-semibold' 
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}>
                    <input 
                      type="radio" 
                      name="skpdScope" 
                      value="pendapatan" 
                      checked={skpdScope === 'pendapatan'} 
                      onChange={() => setSkpdScope('pendapatan')} 
                      className="accent-amber-600"
                    />
                    <span>Hanya Pendapatan Daerah Saja</span>
                  </label>

                  <label className={`p-2.5 rounded-lg border flex items-center gap-2 cursor-pointer transition ${
                    skpdScope === 'pembiayaan' 
                      ? 'bg-amber-50 border-amber-300 text-amber-900 font-semibold' 
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}>
                    <input 
                      type="radio" 
                      name="skpdScope" 
                      value="pembiayaan" 
                      checked={skpdScope === 'pembiayaan'} 
                      onChange={() => setSkpdScope('pembiayaan')} 
                      className="accent-amber-600"
                    />
                    <span>Hanya Pembiayaan Daerah Saja</span>
                  </label>
                </div>
              </div>
            )}

            {/* Verifikasi Matematika */}
            {selectedSkpd && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-amber-900">
                  <span className="flex items-center gap-1.5">
                    <Calculator className="w-4 h-4 text-amber-700" />
                    <span>Verifikasi Keamanan: Berapa {mathSkpd.a} + {mathSkpd.b} = ?</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setMathSkpd(generateMath())}
                    className="text-[10px] text-amber-700 hover:underline cursor-pointer"
                  >
                    Ganti angka
                  </button>
                </div>
                <input
                  type="number"
                  required
                  value={mathSkpd.answer}
                  onChange={(e) => setMathSkpd({ ...mathSkpd, answer: e.target.value })}
                  placeholder="Tulis hasil penjumlahan..."
                  className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={!selectedSkpd || !mathSkpd.answer || loadingSkpd}
              className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition shadow-xs disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2"
            >
              {loadingSkpd ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Membersihkan Data SKPD Terpilih...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Bersihkan Data SKPD Terpilih Sekarang</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODE 2: BERSIHKAN PER MODUL (SPESIFIK) */}
      {/* ============================================================== */}
      {activeMode === 'modul' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 max-w-3xl">
          <div className="flex items-start gap-3.5 mb-5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Bersihkan Data Berdasarkan Modul</h3>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                Pilih modul tertentu yang ingin dikosongkan total tanpa mempengaruhi modul lainnya.
              </p>
            </div>
          </div>

          {messageModule.text && (
            <div className={`mb-5 p-3.5 rounded-xl text-xs flex items-center gap-2.5 ${
              messageModule.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              {messageModule.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
              )}
              <span className="font-medium leading-relaxed">{messageModule.text}</span>
            </div>
          )}

          <form onSubmit={handleResetModule} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Opsi Belanja */}
              <div 
                onClick={() => setSelectedModule('belanja')}
                className={`p-4 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
                  selectedModule === 'belanja' 
                    ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/20' 
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Modul Belanja & RKA</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Hapus seluruh Sub Kegiatan, Rincian RKA, Indikator, dan Capaian.
                  </p>
                </div>
              </div>

              {/* Opsi Pendapatan */}
              <div 
                onClick={() => setSelectedModule('pendapatan')}
                className={`p-4 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
                  selectedModule === 'pendapatan' 
                    ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-500/20' 
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Modul Pendapatan Daerah</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Hapus seluruh target SKPD & rincian rekening penerimaan pendapatan.
                  </p>
                </div>
              </div>

              {/* Opsi Pembiayaan */}
              <div 
                onClick={() => setSelectedModule('pembiayaan')}
                className={`p-4 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
                  selectedModule === 'pembiayaan' 
                    ? 'bg-sky-50/70 border-sky-300 ring-2 ring-sky-500/20' 
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Scale className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Modul Pembiayaan Daerah</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Hapus seluruh data pembiayaan daerah (Penerimaan & Pengeluaran).
                  </p>
                </div>
              </div>

              {/* Opsi Master Data */}
              <div 
                onClick={() => setSelectedModule('master')}
                className={`p-4 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
                  selectedModule === 'master' 
                    ? 'bg-purple-50/70 border-purple-300 ring-2 ring-purple-500/20' 
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Data Master</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Hapus seluruh referensi Master Akun dan Sumber Pendanaan APBD.
                  </p>
                </div>
              </div>
            </div>

            {/* Verifikasi Matematika */}
            <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-indigo-900">
                <span className="flex items-center gap-1.5">
                  <Calculator className="w-4 h-4 text-indigo-700" />
                  <span>Verifikasi Keamanan: Berapa {mathModule.a} + {mathModule.b} = ?</span>
                </span>
                <button
                  type="button"
                  onClick={() => setMathModule(generateMath())}
                  className="text-[10px] text-indigo-700 hover:underline cursor-pointer"
                >
                  Ganti angka
                </button>
              </div>
              <input
                type="number"
                required
                value={mathModule.answer}
                onChange={(e) => setMathModule({ ...mathModule, answer: e.target.value })}
                placeholder="Tulis hasil penjumlahan..."
                className="w-full px-3 py-2 bg-white border border-indigo-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={!mathModule.answer || loadingModule}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-xs disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2"
            >
              {loadingModule ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Mengosongkan Modul Terpilih...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Kosongkan Modul {selectedModule.toUpperCase()} Sekarang</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODE 3: RESET TOTAL SELURUH DATABASE */}
      {/* ============================================================== */}
      {activeMode === 'all' && (
        <div className="bg-white rounded-2xl border border-rose-200 shadow-xs p-6 max-w-3xl">
          <div className="flex items-start gap-3.5 mb-5">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Reset Total Seluruh Database (Hard Reset)</h3>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                Tindakan ini akan mengosongkan <b>seluruh tabel database</b> (Belanja & RKA, Pendapatan, Pembiayaan, Master Akun, dan Sumber Dana) kembali bersih ke kondisi awal nol (0). Akun login pengguna tidak akan terhapus.
              </p>
            </div>
          </div>

          {messageAll.text && (
            <div className={`mb-5 p-3.5 rounded-xl text-xs flex items-center gap-2.5 ${
              messageAll.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              {messageAll.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
              )}
              <span className="font-medium leading-relaxed">{messageAll.text}</span>
            </div>
          )}

          <form onSubmit={handleResetAll} className="space-y-4">
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-rose-900">
                <span className="flex items-center gap-1.5">
                  <Calculator className="w-4 h-4 text-rose-700" />
                  <span>Konfirmasi Keamanan: Berapa {mathAll.a} + {mathAll.b} = ?</span>
                </span>
                <button
                  type="button"
                  onClick={() => setMathAll(generateMath())}
                  className="text-[10px] text-rose-700 hover:underline cursor-pointer"
                >
                  Ganti angka
                </button>
              </div>
              <input
                type="number"
                required
                value={mathAll.answer}
                onChange={(e) => setMathAll({ ...mathAll, answer: e.target.value })}
                placeholder="Tulis hasil penjumlahan di sini..."
                className="w-full px-3 py-2 bg-white border border-rose-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <button
              type="submit"
              disabled={!mathAll.answer || loadingAll}
              className="w-full py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition shadow-xs disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2"
            >
              {loadingAll ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Mengosongkan Seluruh Database...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Kosongkan Seluruh Database Sekarang (Kembali Bersih)</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
