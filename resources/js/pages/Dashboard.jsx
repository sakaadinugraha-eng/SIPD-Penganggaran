import React from 'react';
import { 
  Layers, 
  ShoppingBag, 
  Receipt, 
  Building, 
  ArrowUpRight, 
  CheckCircle2, 
  ShieldCheck, 
  Coins, 
  BookOpen, 
  TrendingUp, 
  Scale 
} from 'lucide-react';

export default function Dashboard({ stats, onNavigate, tahunAnggaran = '2026' }) {
  const formatRupiah = (num) => {
    return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
  };

  const statCards = [
    {
      title: 'Total Pendapatan Daerah',
      value: formatRupiah(stats?.total_pendapatan_nilai),
      sub: `${(stats?.total_pendapatan_item || 0).toLocaleString('id-ID')} Rekening Pendapatan ${tahunAnggaran}`,
      icon: TrendingUp,
      color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
      tab: 'pendapatan'
    },
    {
      title: 'Total Pembiayaan Daerah',
      value: formatRupiah((stats?.total_pembiayaan_penerimaan || 0) + (stats?.total_pembiayaan_pengeluaran || 0)),
      sub: `Penerimaan: ${formatRupiah(stats?.total_pembiayaan_penerimaan)}`,
      icon: Scale,
      color: 'bg-indigo-500/10 text-indigo-600 border-indigo-200',
      tab: 'pembiayaan'
    },
    {
      title: 'Total Sub Kegiatan',
      value: (stats?.total_sub_kegiatan || 0).toLocaleString('id-ID'),
      sub: `${stats?.total_skpd || 0} Perangkat Daerah Terdata`,
      icon: Layers,
      color: 'bg-blue-500/10 text-blue-600 border-blue-200',
      tab: 'skpd'
    },
    {
      title: 'Total Pagu Sub Kegiatan',
      value: formatRupiah(stats?.total_pagu),
      sub: `Akumulasi Pagu Indikatif ${tahunAnggaran}`,
      icon: ShoppingBag,
      color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
      tab: 'skpd'
    },
    {
      title: 'Total Item RKA',
      value: (stats?.total_rka_item || 0).toLocaleString('id-ID'),
      sub: 'Rincian Belanja Komponen & Akun',
      icon: Receipt,
      color: 'bg-amber-500/10 text-amber-600 border-amber-200',
      tab: 'skpd'
    },
    {
      title: 'Total Nilai Rincian RKA',
      value: formatRupiah(stats?.total_rka_nilai),
      sub: 'Total Kalkulasi Belanja Rincian',
      icon: Building,
      color: 'bg-indigo-500/10 text-indigo-600 border-indigo-200',
      tab: 'skpd'
    },
    {
      title: 'Total Master Akun',
      value: (stats?.total_master_akun || 0).toLocaleString('id-ID'),
      sub: 'Akun Belanja, Pendapatan & Pembiayaan',
      icon: BookOpen,
      color: 'bg-purple-500/10 text-purple-600 border-purple-200',
      tab: 'master-akun'
    },
    {
      title: 'Total Sumber Dana',
      value: (stats?.total_sumber_dana || 0).toLocaleString('id-ID'),
      sub: `Klasifikasi Pendanaan APBD ${tahunAnggaran}`,
      icon: Coins,
      color: 'bg-amber-500/10 text-amber-600 border-amber-200',
      tab: 'sumber-dana'
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-semibold backdrop-blur-xs mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Dashboard Sinkronisasi Terintegrasi</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight">Selamat Datang di SIPD Local Server</h2>
          <p className="text-sm text-indigo-200 mt-1 leading-relaxed">
            Data tersimpan secara lokal di database <b>db_sipd</b> tanpa batasan limit koneksi. 
            Semua proses sinkronisasi RKA dari Chrome extension langsung masuk ke sini.
          </p>
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={() => onNavigate('skpd')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <span>Buka Belanja & RKA</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('pendapatan')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              <span>Pendapatan Daerah</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div 
              key={idx} 
              onClick={() => card.tab && onNavigate(card.tab)}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition cursor-pointer hover:border-indigo-300"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">{card.title}</span>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-xl font-bold text-slate-900 tracking-tight font-mono">{card.value}</p>
                <p className="text-[11px] text-slate-400 mt-1 font-medium">{card.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Status Sinkronisasi */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center gap-2 text-emerald-600 font-semibold text-xs mb-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Endpoint API Siap Menerima</span>
          </div>
          <p className="text-xs text-slate-600 font-mono bg-slate-50 p-2.5 rounded-xl border border-slate-200 break-all">
            POST http://127.0.0.1:8000/api/sync-rka
          </p>
          <p className="text-[11px] text-slate-400 mt-2">
            Chrome extension akan otomatis mengirim paket sub kegiatan dan rka ke endpoint ini.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs mb-2">
            <Building className="w-4 h-4" />
            <span>Dukungan Sub Unit / Puskesmas / RSUD</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Data sub-unit (seperti UPTD Puskesmas & RSUD) otomatis dikelompokkan berdasarkan SKPD induk dan unit masing-masing.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center gap-2 text-rose-600 font-semibold text-xs mb-2">
            <Receipt className="w-4 h-4" />
            <span>Fitur Kosongkan Data</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Butuh sinkron ulang dari nol? Gunakan menu <b>Pembersihan Data</b> di sidebar untuk menghapus data per SKPD, per modul, atau seluruh database.
          </p>
        </div>
      </div>
    </div>
  );
}
