import React from 'react';
import {
  Layers,
  ShoppingBag,
  Receipt,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  Coins,
  BookOpen,
  TrendingUp,
  Scale,
  Calendar,
  Clock,
  Upload,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';
import {
  DonutChartCard,
  BudgetComparisonCard,
  TopSkpdChartCard,
  SumberDanaCard,
  formatRupiahShort,
  formatRupiahFull
} from '../components/dashboard/DashboardCharts';
import {
  NotificationsAndCompleteness,
  SystemMonitoringGrid,
  SyncAndActivityPanels,
  formatDateTimeId
} from '../components/dashboard/SystemMonitoringPanel';

function calcDelta(current, previous) {
  if (previous === undefined || previous === null || Number(previous) === 0) return null;
  const curr = Number(current || 0);
  const prev = Number(previous);
  const pct = ((curr - prev) / Math.abs(prev)) * 100;
  return {
    pct: Math.abs(pct).toFixed(1),
    isUp: pct >= 0,
  };
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Memuat data dashboard">
      <div className="h-28 rounded-2xl bg-indigo-950/20" />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 rounded-2xl bg-white border border-slate-200 p-5">
            <div className="h-3 w-28 bg-slate-200 rounded mb-4" />
            <div className="h-6 w-40 bg-slate-200 rounded mb-2" />
            <div className="h-3 w-24 bg-slate-100 rounded" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-56 rounded-2xl bg-white border border-slate-200 p-5" />
        ))}
      </div>
    </div>
  );
}

function StatCard({ title, value, sub, icon: Icon, tone = 'indigo', delta = null, prevYear = null, badge = null, onClick }) {
  const toneClasses = {
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 hover:border-indigo-300 hover:shadow-sm transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 flex flex-col justify-between"
    >
      <div className="flex items-start justify-between gap-3 w-full">
        <span className="text-xs font-semibold text-slate-600 leading-snug">{title}</span>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${toneClasses[tone] || toneClasses.indigo}`}>
          <Icon className="w-4 h-4" aria-hidden="true" />
        </div>
      </div>

      <div className="mt-3 w-full">
        <p className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight tabular-nums break-words">
          {value}
        </p>
        <div className="flex flex-wrap items-center justify-between gap-2 mt-1.5">
          <p className="text-[11px] text-slate-600 font-medium">{sub}</p>
          {delta && (
            <span
              className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold tabular-nums ${
                delta.isUp ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
              }`}
              title={`Dibandingkan TA ${prevYear}`}
            >
              {delta.isUp ? (
                <ArrowUpRight className="w-3 h-3" aria-hidden="true" />
              ) : (
                <ArrowDownRight className="w-3 h-3" aria-hidden="true" />
              )}
              {delta.pct}% vs {prevYear}
            </span>
          )}
          {badge && (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${badge.className}`}>
              {badge.text}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

export default function Dashboard({
  stats,
  loading = false,
  error = null,
  refreshing = false,
  onRetry,
  onNavigate,
  onSelectSkpd,
  tahunAnggaran = '2026',
}) {
  if (loading && !stats) {
    return <DashboardSkeleton />;
  }

  if (error && !stats) {
    return (
      <div className="bg-white rounded-2xl border border-rose-200 p-8 text-center max-w-lg mx-auto my-8">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
          <AlertTriangle className="w-6 h-6" aria-hidden="true" />
        </div>
        <h3 className="text-base font-bold text-slate-900">Gagal Memuat Dashboard</h3>
        <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 min-h-[42px] px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold inline-flex items-center gap-2 transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <RefreshCw className="w-4 h-4" aria-hidden="true" />
          <span>Coba Lagi</span>
        </button>
      </div>
    );
  }

  const prev = stats?.previous_year;
  const charts = stats?.charts || {};
  const monitoring = stats?.monitoring || {};
  const lastSyncAt = monitoring?.extension?.last_sync_at || null;
  const paguVsRkaDiff = Number(stats?.pagu_vs_rka_diff || 0);
  const hasAnyBudgetData =
    Number(stats?.total_sub_kegiatan || 0) > 0 ||
    Number(stats?.total_pendapatan_item || 0) > 0 ||
    Number(stats?.total_pembiayaan_item || 0) > 0;

  const budgetCards = [
    {
      title: 'Pendapatan Daerah',
      value: formatRupiahFull(stats?.total_pendapatan_nilai),
      sub: `${(stats?.total_pendapatan_item || 0).toLocaleString('id-ID')} rekening pendapatan`,
      icon: TrendingUp,
      tone: 'emerald',
      delta: prev ? calcDelta(stats?.total_pendapatan_nilai, prev.total_pendapatan_nilai) : null,
      prevYear: prev?.tahun,
      tab: 'pendapatan',
    },
    {
      title: 'Belanja Daerah (Pagu)',
      value: formatRupiahFull(stats?.total_pagu),
      sub: `Rincian RKA: ${formatRupiahShort(stats?.total_rka_nilai)}`,
      icon: ShoppingBag,
      tone: 'indigo',
      delta: prev ? calcDelta(stats?.total_pagu, prev.total_pagu) : null,
      prevYear: prev?.tahun,
      tab: 'skpd',
    },
    {
      title: 'Pembiayaan Daerah (Netto)',
      value: formatRupiahFull(stats?.total_pembiayaan_netto),
      sub: `Masuk: ${formatRupiahShort(stats?.total_pembiayaan_penerimaan)} | Keluar: ${formatRupiahShort(stats?.total_pembiayaan_pengeluaran)}`,
      icon: Scale,
      tone: 'amber',
      tab: 'pembiayaan',
    },
    {
      title: 'Surplus / (Defisit) & SiLPA',
      value: formatRupiahFull(stats?.surplus_defisit),
      sub: `Proyeksi SiLPA: ${formatRupiahShort(stats?.silpa)}`,
      icon: Coins,
      tone: Number(stats?.surplus_defisit || 0) >= 0 ? 'emerald' : 'rose',
      badge: {
        text: Number(stats?.surplus_defisit || 0) >= 0 ? 'Surplus' : 'Defisit',
        className:
          Number(stats?.surplus_defisit || 0) >= 0
            ? 'bg-emerald-50 text-emerald-800'
            : 'bg-rose-50 text-rose-800',
      },
      tab: 'posting',
    },
  ];

  const operationalCards = [
    {
      title: 'Sub Kegiatan',
      value: (stats?.total_sub_kegiatan || 0).toLocaleString('id-ID'),
      sub: `${stats?.total_skpd || 0} SKPD & ${stats?.total_sub_unit || 0} Sub Unit`,
      icon: Layers,
      tone: 'indigo',
      delta: prev ? calcDelta(stats?.total_sub_kegiatan, prev.total_sub_kegiatan) : null,
      prevYear: prev?.tahun,
      tab: 'skpd',
    },
    {
      title: 'Rincian RKA',
      value: (stats?.total_rka_item || 0).toLocaleString('id-ID'),
      sub:
        Math.abs(paguVsRkaDiff) <= 1 && Number(stats?.total_pagu || 0) > 0
          ? 'Kalkulasi RKA sesuai pagu'
          : Math.abs(paguVsRkaDiff) > 1
          ? `Selisih pagu: ${formatRupiahShort(Math.abs(paguVsRkaDiff))}`
          : 'Komponen & rekening belanja',
      icon: Receipt,
      tone: Math.abs(paguVsRkaDiff) > 1 && Number(stats?.total_rka_nilai || 0) > 0 ? 'amber' : 'indigo',
      badge:
        Number(stats?.total_pagu || 0) > 0 && Number(stats?.total_rka_nilai || 0) > 0
          ? Math.abs(paguVsRkaDiff) <= 1
            ? { text: 'Valid', className: 'bg-emerald-50 text-emerald-800' }
            : { text: 'Cek Selisih', className: 'bg-amber-50 text-amber-800' }
          : null,
      tab: 'skpd',
    },
    {
      title: 'Master Akun & Sumber Dana',
      value: `${(stats?.total_master_akun || 0).toLocaleString('id-ID')} Akun`,
      sub: `${(stats?.total_sumber_dana || 0).toLocaleString('id-ID')} Sumber Dana TA ${tahunAnggaran}`,
      icon: BookOpen,
      tone: 'indigo',
      tab: 'master-akun',
    },
    {
      title: 'Master SKPD / Unit',
      value: `${(stats?.total_master_skpd || stats?.total_skpd || 0).toLocaleString('id-ID')} Unit`,
      sub: 'Perangkat daerah terdaftar',
      icon: Building2,
      tone: 'indigo',
      tab: 'master-skpd',
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Compact Hero Banner (Gradasi Ungu & Navy) + Quick Access */}
      <section className="bg-gradient-to-r from-indigo-950 via-indigo-900 to-slate-900 rounded-2xl p-4 sm:p-5 text-white shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-indigo-100 text-[11px] font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                <span>SADA SIPD</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/30 border border-indigo-300/30 text-white text-[11px] font-bold">
                <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                <span>TA {tahunAnggaran}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-indigo-100 text-[11px] font-medium">
                <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Sinkron terakhir: {formatDateTimeId(lastSyncAt)}</span>
              </span>
            </div>

            <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">
              Ringkasan Penganggaran &amp; Sinkronisasi Daerah
            </h2>
            <p className="text-xs text-indigo-100/90 mt-0.5">
              Seluruh statistik, grafik, dan status kelengkapan data mengikuti Tahun Anggaran {tahunAnggaran}.
            </p>
          </div>

          {/* 21. Quick Access */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('skpd')}
              className="min-h-[40px] px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition inline-flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <ShoppingBag className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Belanja &amp; RKA</span>
              <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('pendapatan')}
              className="min-h-[40px] px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition inline-flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Pendapatan</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('pembiayaan')}
              className="min-h-[40px] px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition inline-flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <Scale className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Pembiayaan</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('import-db')}
              className="min-h-[40px] px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition inline-flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <Upload className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Import / Export DB</span>
            </button>
          </div>
        </div>
      </section>

      {/* Peringatan / Empty State jika tahun anggaran belum memiliki data */}
      {!hasAnyBudgetData && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-xs font-bold text-amber-900">
                Belum Ada Data Anggaran untuk TA {tahunAnggaran}
              </p>
              <p className="text-xs text-amber-800 mt-0.5">
                Silakan lakukan sinkronisasi melalui Chrome Extension SIPD RI atau import file database (.sql).
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('import-db')}
              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition cursor-pointer"
            >
              Import Database
            </button>
            <button
              type="button"
              onClick={onRetry}
              disabled={refreshing}
              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 text-xs font-semibold transition cursor-pointer"
            >
              Muat Ulang
            </button>
          </div>
        </div>
      )}

      {/* 7 & 8. Pengelompokan Statistik: Ringkasan Anggaran Daerah */}
      <section aria-labelledby="heading-ringkasan-anggaran">
        <div className="flex items-center justify-between mb-3">
          <h3 id="heading-ringkasan-anggaran" className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Ringkasan Anggaran Daerah (TA {tahunAnggaran})
          </h3>
          {error && (
            <button
              type="button"
              onClick={onRetry}
              className="text-xs font-semibold text-rose-700 hover:text-rose-800 inline-flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Gagal memperbarui, coba lagi</span>
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {budgetCards.map((card) => (
            <StatCard
              key={card.title}
              {...card}
              onClick={() => card.tab && onNavigate(card.tab)}
            />
          ))}
        </div>
      </section>

      {/* 8 & 23. Pengelompokan Statistik: Operasional, RKA & Data Master */}
      <section aria-labelledby="heading-operasional">
        <div className="flex items-center justify-between mb-3">
          <h3 id="heading-operasional" className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Operasional RKA &amp; Data Master
          </h3>
          {Number(stats?.total_pagu || 0) > 0 && Math.abs(paguVsRkaDiff) <= 1 && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Total Pagu &amp; Rincian RKA Tervalidasi</span>
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {operationalCards.map((card) => (
            <StatCard
              key={card.title}
              {...card}
              onClick={() => card.tab && onNavigate(card.tab)}
            />
          ))}
        </div>
      </section>

      {/* 9. Grafik Komposisi Anggaran (Donut Charts) */}
      <section aria-labelledby="heading-komposisi">
        <h3 id="heading-komposisi" className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
          Komposisi Anggaran Daerah
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <DonutChartCard
            title="Komposisi Belanja Daerah"
            subtitle="Berdasarkan kelompok akun belanja"
            items={charts.belanja_composition || []}
            emptyText="Belum ada data belanja untuk ditampilkan."
          />
          <DonutChartCard
            title="Komposisi Pendapatan Daerah"
            subtitle="Berdasarkan kelompok akun pendapatan"
            items={charts.pendapatan_composition || []}
            emptyText="Belum ada data pendapatan untuk ditampilkan."
          />
          <DonutChartCard
            title="Komposisi Pembiayaan Daerah"
            subtitle="Penerimaan vs Pengeluaran pembiayaan"
            items={charts.pembiayaan_composition || []}
            emptyText="Belum ada data pembiayaan untuk ditampilkan."
          />
        </div>
      </section>

      {/* 10 & 12. Grafik Perbandingan Anggaran & Statistik Sumber Dana */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BudgetComparisonCard
          pendapatan={stats?.total_pendapatan_nilai || 0}
          belanja={stats?.total_pagu || 0}
          pembiayaanNetto={stats?.total_pembiayaan_netto || 0}
          tahapanComparison={charts.tahapan_comparison || []}
          yearlyComparison={charts.yearly_comparison || []}
          tahunAnggaran={tahunAnggaran}
        />
        <SumberDanaCard
          totalSumberDana={stats?.total_sumber_dana || 0}
          types={charts.sumber_dana_types || []}
          paguList={charts.sumber_dana_pagu || []}
        />
      </section>

      {/* 11. Grafik Distribusi SKPD */}
      <TopSkpdChartCard
        topSkpd={charts.top_skpd || []}
        onSelectSkpd={onSelectSkpd}
      />

      {/* 19 & 20. Status Kelengkapan Data SKPD & Notifikasi Sistem */}
      <NotificationsAndCompleteness
        notifications={stats?.notifications || []}
        completeness={stats?.data_completeness || {}}
        onNavigate={onNavigate}
      />

      {/* 13-16. Monitoring Server, API, Chrome Extension & Database */}
      <section aria-labelledby="heading-monitoring">
        <h3 id="heading-monitoring" className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
          Monitoring &amp; Integrasi Sistem
        </h3>
        <SystemMonitoringGrid monitoring={monitoring} />
      </section>

      {/* 17 & 18. Riwayat Sinkronisasi & Aktivitas Terbaru */}
      <SyncAndActivityPanels
        syncHistory={monitoring.sync_history || []}
        activities={monitoring.activities || []}
      />
    </div>
  );
}
