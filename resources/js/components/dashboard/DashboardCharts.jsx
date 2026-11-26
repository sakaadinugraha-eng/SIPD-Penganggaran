import React, { useState } from 'react';

const CHART_COLORS = [
  '#4f46e5', // indigo-600 (primary)
  '#059669', // emerald-600 (success/pendapatan)
  '#d97706', // amber-600 (warning/accent)
  '#334155', // slate-700 (navy/neutral)
  '#7c3aed', // violet-600
  '#e11d48', // rose-600
  '#0284c7', // sky-600
];

export function formatRupiahShort(num) {
  const val = Number(num || 0);
  const abs = Math.abs(val);
  const sign = val < 0 ? '-' : '';
  if (abs >= 1_000_000_000_000) {
    return `${sign}Rp ${(abs / 1_000_000_000_000).toFixed(2).replace('.', ',')} T`;
  }
  if (abs >= 1_000_000_000) {
    return `${sign}Rp ${(abs / 1_000_000_000).toFixed(2).replace('.', ',')} M`;
  }
  if (abs >= 1_000_000) {
    return `${sign}Rp ${(abs / 1_000_000).toFixed(1).replace('.', ',')} Jt`;
  }
  return `${sign}Rp ${abs.toLocaleString('id-ID')}`;
}

export function formatRupiahFull(num) {
  const val = Number(num || 0);
  const sign = val < 0 ? '-' : '';
  return `${sign}Rp ${Math.abs(val).toLocaleString('id-ID')}`;
}

export function DonutChartCard({ title, subtitle, items = [], emptyText = 'Belum ada data untuk ditampilkan.' }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const total = items.reduce((sum, item) => sum + Number(item.value || 0), 0);

  const radius = 56;
  const strokeWidth = 20;
  const circumference = 2 * Math.PI * radius;

  let cumulativePercent = 0;
  const segments = items.map((item, idx) => {
    const val = Number(item.value || 0);
    const percent = total > 0 ? val / total : 0;
    const dashLength = percent * circumference;
    const dashOffset = -cumulativePercent * circumference;
    cumulativePercent += percent;

    return {
      ...item,
      value: val,
      percent: percent * 100,
      color: CHART_COLORS[idx % CHART_COLORS.length],
      dashArray: `${dashLength} ${circumference}`,
      dashOffset,
    };
  });

  const activeSegment = hoveredIdx !== null ? segments[hoveredIdx] : null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between">
      <div>
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        {subtitle && <p className="text-xs text-slate-600 mt-0.5">{subtitle}</p>}
      </div>

      {total <= 0 || segments.length === 0 ? (
        <div className="py-10 flex flex-col items-center justify-center text-center">
          <div className="w-24 h-24 rounded-full border-[10px] border-slate-100 flex items-center justify-center text-xs font-semibold text-slate-500">
            0%
          </div>
          <p className="text-xs text-slate-600 mt-3 max-w-[220px]">{emptyText}</p>
        </div>
      ) : (
        <div className="mt-4 flex flex-col sm:flex-row items-center gap-5">
          <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
            <svg viewBox="0 0 150 150" className="w-full h-full -rotate-90" role="img" aria-label={title}>
              <circle
                cx="75"
                cy="75"
                r={radius}
                fill="transparent"
                stroke="#f1f5f9"
                strokeWidth={strokeWidth}
              />
              {segments.map((seg, idx) => (
                <circle
                  key={seg.label + idx}
                  cx="75"
                  cy="75"
                  r={radius}
                  fill="transparent"
                  stroke={seg.color}
                  strokeWidth={hoveredIdx === idx ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={seg.dashArray}
                  strokeDashoffset={seg.dashOffset}
                  className="transition-all duration-200 cursor-pointer"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />
              ))}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-4">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                {activeSegment ? `${activeSegment.percent.toFixed(1)}%` : 'Total'}
              </span>
              <span className="text-xs font-bold text-slate-900 tabular-nums mt-0.5 leading-tight">
                {formatRupiahShort(activeSegment ? activeSegment.value : total)}
              </span>
            </div>
          </div>

          <ul className="flex-1 w-full space-y-2 min-w-0">
            {segments.map((seg, idx) => (
              <li
                key={seg.label + idx}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className={`flex items-center justify-between gap-2 px-2 py-1 rounded-lg text-xs transition ${
                  hoveredIdx === idx ? 'bg-slate-100' : ''
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: seg.color }}
                    aria-hidden="true"
                  />
                  <span className="text-slate-700 font-medium truncate" title={seg.label}>
                    {seg.label}
                  </span>
                </div>
                <div className="text-right shrink-0 tabular-nums">
                  <span className="font-bold text-slate-900">{seg.percent.toFixed(1)}%</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function BudgetComparisonCard({
  pendapatan = 0,
  belanja = 0,
  pembiayaanNetto = 0,
  tahapanComparison = [],
  yearlyComparison = [],
  tahunAnggaran = '2026',
}) {
  const [mode, setMode] = useState('ringkasan'); // 'ringkasan' | 'tahapan' | 'tahun'

  const hasTahapan = tahapanComparison.length > 0;
  const hasYearly = yearlyComparison.length > 1;

  const summaryItems = [
    { label: 'Pendapatan Daerah', value: Number(pendapatan || 0), color: 'bg-emerald-600' },
    { label: 'Belanja Daerah (Pagu)', value: Number(belanja || 0), color: 'bg-indigo-600' },
    { label: 'Pembiayaan Netto', value: Math.abs(Number(pembiayaanNetto || 0)), raw: Number(pembiayaanNetto || 0), color: 'bg-amber-600' },
  ];
  const maxSummary = Math.max(...summaryItems.map((i) => i.value), 1);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Perbandingan Anggaran</h3>
          <p className="text-xs text-slate-600 mt-0.5">
            {mode === 'ringkasan' && `Pendapatan vs Belanja TA ${tahunAnggaran}`}
            {mode === 'tahapan' && `Perbandingan antar tahapan posting TA ${tahunAnggaran}`}
            {mode === 'tahun' && 'Perbandingan Pendapatan & Belanja antar tahun anggaran'}
          </p>
        </div>

        <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setMode('ringkasan')}
            className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer ${
              mode === 'ringkasan' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Ringkasan
          </button>
          <button
            type="button"
            onClick={() => setMode('tahapan')}
            className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer ${
              mode === 'tahapan' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tahapan
          </button>
          <button
            type="button"
            onClick={() => setMode('tahun')}
            className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer ${
              mode === 'tahun' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Antar Tahun
          </button>
        </div>
      </div>

      <div className="mt-5">
        {mode === 'ringkasan' && (
          <div className="space-y-4">
            {summaryItems.map((item) => {
              const pct = Math.min(100, Math.round((item.value / maxSummary) * 100));
              const displayVal = item.raw !== undefined ? item.raw : item.value;
              return (
                <div key={item.label}>
                  <div className="flex items-center justify-between text-xs mb-1.5 gap-2">
                    <span className="font-semibold text-slate-700">{item.label}</span>
                    <span className="font-bold text-slate-900 tabular-nums">{formatRupiahFull(displayVal)}</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${item.color} transition-all duration-300`}
                      style={{ width: `${item.value > 0 ? Math.max(pct, 2) : 0}%` }}
                    />
                  </div>
                </div>
              );
            })}

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600">Surplus / (Defisit) Anggaran</span>
              <span
                className={`font-bold tabular-nums ${
                  pendapatan - belanja >= 0 ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {formatRupiahFull(pendapatan - belanja)}
              </span>
            </div>
          </div>
        )}

        {mode === 'tahapan' && (
          !hasTahapan ? (
            <div className="py-8 text-center text-xs text-slate-600">
              Belum ada arsip tahapan posting untuk TA {tahunAnggaran}. Buat snapshot di menu <b>Posting Data</b> untuk membandingkan pagu antar tahapan.
            </div>
          ) : (
            <div className="space-y-3.5">
              {tahapanComparison.map((row) => {
                const maxVal = Math.max(
                  ...tahapanComparison.flatMap((t) => [t.pendapatan, t.belanja]),
                  1
                );
                return (
                  <div key={row.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 truncate">{row.label}</span>
                      <span className="text-[11px] text-slate-500 truncate">{row.nama_posting}</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="w-20 text-slate-600 shrink-0">Pendapatan</span>
                        <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full bg-emerald-600 rounded-full"
                            style={{ width: `${row.pendapatan > 0 ? Math.max((row.pendapatan / maxVal) * 100, 2) : 0}%` }}
                          />
                        </div>
                        <span className="w-24 text-right font-semibold text-slate-800 tabular-nums shrink-0">
                          {formatRupiahShort(row.pendapatan)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="w-20 text-slate-600 shrink-0">Belanja</span>
                        <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full bg-indigo-600 rounded-full"
                            style={{ width: `${row.belanja > 0 ? Math.max((row.belanja / maxVal) * 100, 2) : 0}%` }}
                          />
                        </div>
                        <span className="w-24 text-right font-semibold text-slate-800 tabular-nums shrink-0">
                          {formatRupiahShort(row.belanja)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {mode === 'tahun' && (
          !hasYearly ? (
            <div className="py-8 text-center text-xs text-slate-600">
              Data baru tersedia untuk 1 tahun anggaran. Perbandingan antar tahun akan muncul otomatis jika terdapat data pada tahun anggaran lainnya.
            </div>
          ) : (
            <div className="space-y-3.5">
              {yearlyComparison.map((yr) => {
                const maxVal = Math.max(
                  ...yearlyComparison.flatMap((y) => [y.pendapatan, y.belanja]),
                  1
                );
                return (
                  <div key={yr.tahun} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">Tahun Anggaran {yr.tahun}</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="w-20 text-slate-600 shrink-0">Pendapatan</span>
                        <div className="flex-1 h-2.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full bg-emerald-600 rounded-full"
                            style={{ width: `${yr.pendapatan > 0 ? Math.max((yr.pendapatan / maxVal) * 100, 2) : 0}%` }}
                          />
                        </div>
                        <span className="w-24 text-right font-semibold text-slate-800 tabular-nums shrink-0">
                          {formatRupiahShort(yr.pendapatan)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="w-20 text-slate-600 shrink-0">Belanja</span>
                        <div className="flex-1 h-2.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full bg-indigo-600 rounded-full"
                            style={{ width: `${yr.belanja > 0 ? Math.max((yr.belanja / maxVal) * 100, 2) : 0}%` }}
                          />
                        </div>
                        <span className="w-24 text-right font-semibold text-slate-800 tabular-nums shrink-0">
                          {formatRupiahShort(yr.belanja)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
}

export function TopSkpdChartCard({ topSkpd = [], onSelectSkpd }) {
  const maxPagu = Math.max(...topSkpd.map((s) => Number(s.total_pagu || 0)), 1);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Distribusi Pagu per SKPD</h3>
          <p className="text-xs text-slate-600 mt-0.5">Top 10 Perangkat Daerah dengan pagu belanja terbesar</p>
        </div>
      </div>

      {topSkpd.length === 0 ? (
        <div className="py-10 text-center text-xs text-slate-600">
          Belum ada data SKPD untuk tahun anggaran ini.
        </div>
      ) : (
        <div className="space-y-2.5">
          {topSkpd.map((skpd, idx) => {
            const pct = Math.max(2, Math.round((Number(skpd.total_pagu || 0) / maxPagu) * 100));
            return (
              <button
                key={skpd.id_skpd || skpd.nama_skpd + idx}
                type="button"
                onClick={() => onSelectSkpd && onSelectSkpd(skpd.nama_skpd)}
                className="w-full text-left group rounded-xl p-2 -mx-2 hover:bg-slate-50 transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <div className="flex items-center justify-between gap-3 text-xs mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-[11px] flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-slate-800 group-hover:text-indigo-700 truncate" title={skpd.nama_skpd}>
                      {skpd.nama_skpd}
                    </span>
                  </div>
                  <div className="text-right shrink-0 tabular-nums">
                    <span className="font-bold text-slate-900">{formatRupiahShort(skpd.total_pagu)}</span>
                    <span className="text-[11px] text-slate-500 ml-1.5">({skpd.total_sub_keg} sub)</span>
                  </div>
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-indigo-600 group-hover:bg-indigo-700 transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function SumberDanaCard({ totalSumberDana = 0, types = [], paguList = [] }) {
  const maxPagu = Math.max(...paguList.map((p) => Number(p.value || 0)), 1);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-slate-900">Statistik Sumber Dana</h3>
          <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold tabular-nums">
            {totalSumberDana.toLocaleString('id-ID')} Sumber
          </span>
        </div>
        <p className="text-xs text-slate-600 mt-0.5">Komposisi jenis dan nilai pagu berdasarkan sumber dana</p>

        {types.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {types.map((t) => (
              <span
                key={t.label}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-semibold"
              >
                <span>{t.label}:</span>
                <span className="font-bold text-slate-900 tabular-nums">{t.count}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 space-y-2.5">
        {paguList.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-600">
            Belum ada distribusi pagu per sumber dana pada tahun anggaran ini.
          </div>
        ) : (
          paguList.map((item, idx) => {
            const pct = Math.max(2, Math.round((Number(item.value || 0) / maxPagu) * 100));
            return (
              <div key={item.label + idx}>
                <div className="flex items-center justify-between gap-2 text-xs mb-1">
                  <span className="text-slate-700 font-medium truncate" title={item.label}>
                    {item.label}
                  </span>
                  <span className="font-bold text-slate-900 tabular-nums shrink-0">
                    {formatRupiahShort(item.value)}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-600"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
