import React from 'react';
import {
  Server,
  Database,
  Globe,
  Plug,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  Clock,
  Activity,
  Building2,
  ArrowUpRight
} from 'lucide-react';

export function formatDateTimeId(isoString) {
  if (!isoString) return 'Belum ada';
  try {
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return 'Belum ada';
    return d.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Belum ada';
  }
}

function StatusBadge({ status, label }) {
  const styles = {
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    connected: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    online: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    ready: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    standby: 'bg-amber-50 text-amber-800 border-amber-200',
    partial: 'bg-amber-50 text-amber-800 border-amber-200',
    degraded: 'bg-amber-50 text-amber-800 border-amber-200',
    error: 'bg-rose-50 text-rose-800 border-rose-200',
    disconnected: 'bg-rose-50 text-rose-800 border-rose-200',
    info: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  };

  const Icon =
    status === 'error' || status === 'disconnected'
      ? XCircle
      : status === 'warning' || status === 'partial' || status === 'standby' || status === 'degraded'
      ? AlertTriangle
      : CheckCircle2;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold ${styles[status] || styles.info}`}>
      <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

export function NotificationsAndCompleteness({ notifications = [], completeness = {}, onNavigate }) {
  const terdaftar = Number(completeness.skpd_terdaftar || 0);
  const indukCount = Number(completeness.skpd_induk_terdaftar || 0);
  const subUnitCount = Number(completeness.sub_unit_terdaftar || 0);
  const denganData = Number(completeness.skpd_dengan_data || 0);
  const belumData = Number(completeness.skpd_belum_data || 0);
  const pct = Number(completeness.persentase || 0);
  const missingList = completeness.missing_skpd || [];

  const levelMap = {
    error: {
      box: 'bg-rose-50 border-rose-200 text-rose-900',
      icon: XCircle,
      iconColor: 'text-rose-600',
    },
    warning: {
      box: 'bg-amber-50 border-amber-200 text-amber-900',
      icon: AlertTriangle,
      iconColor: 'text-amber-600',
    },
    success: {
      box: 'bg-emerald-50 border-emerald-200 text-emerald-900',
      icon: CheckCircle2,
      iconColor: 'text-emerald-600',
    },
    info: {
      box: 'bg-indigo-50 border-indigo-200 text-indigo-900',
      icon: Info,
      iconColor: 'text-indigo-600',
    },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Informasi Status Kelengkapan Data SKPD */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-600" aria-hidden="true" />
              <h3 className="text-sm font-bold text-slate-900">Status Kelengkapan Data SKPD</h3>
            </div>
            <StatusBadge
              status={terdaftar === 0 ? 'standby' : belumData === 0 ? 'success' : 'warning'}
              label={terdaftar === 0 ? 'Belum Terdata' : belumData === 0 ? 'Lengkap 100%' : `${pct}% Terisi`}
            />
          </div>

          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <p className="text-[11px] font-semibold text-slate-600">SKPD &amp; Unit</p>
              <p className="text-lg font-bold text-slate-900 tabular-nums mt-0.5">{terdaftar.toLocaleString('id-ID')}</p>
              {subUnitCount > 0 && (
                <p className="text-[10px] text-slate-500 mt-0.5">{indukCount} Induk, {subUnitCount} Sub Unit</p>
              )}
            </div>
            <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80">
              <p className="text-[11px] font-semibold text-emerald-800">Sudah Ada Data</p>
              <p className="text-lg font-bold text-emerald-900 tabular-nums mt-0.5">{denganData.toLocaleString('id-ID')}</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80">
              <p className="text-[11px] font-semibold text-amber-800">Belum Ada Data</p>
              <p className="text-lg font-bold text-amber-900 tabular-nums mt-0.5">{belumData.toLocaleString('id-ID')}</p>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-600">Progres Kelengkapan</span>
              <span className="font-bold text-slate-900 tabular-nums">{pct}%</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  belumData === 0 && terdaftar > 0 ? 'bg-emerald-600' : 'bg-indigo-600'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
              />
            </div>
          </div>

          {missingList.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-100">
              <p className="text-[11px] font-semibold text-slate-600 mb-1.5">
                SKPD yang belum memiliki data sub kegiatan:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {missingList.slice(0, 5).map((m, i) => (
                  <span
                    key={m.id_skpd || i}
                    className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium truncate max-w-[200px]"
                    title={m.nama_skpd}
                  >
                    {m.nama_skpd}
                  </span>
                ))}
                {belumData > 5 && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[11px] font-semibold">
                    +{belumData - 5} lainnya
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('master-skpd')}
            className="text-xs font-semibold text-indigo-700 hover:text-indigo-800 inline-flex items-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg px-2 py-1"
          >
            <span>Lihat Master SKPD</span>
            <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Notifikasi Sistem */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="flex items-center justify-between gap-2 mb-3">
          <h3 className="text-sm font-bold text-slate-900">Notifikasi Sistem</h3>
          <span className="text-[11px] font-semibold text-slate-500">
            {notifications.length} pemberitahuan
          </span>
        </div>

        {notifications.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-600">
            Semua komponen sistem berjalan normal tanpa peringatan.
          </div>
        ) : (
          <div className="space-y-2.5">
            {notifications.map((notif) => {
              const cfg = levelMap[notif.level] || levelMap.info;
              const Icon = cfg.icon;
              return (
                <div
                  key={notif.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border text-xs ${cfg.box}`}
                >
                  <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${cfg.iconColor}`} aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="font-bold">{notif.title}</p>
                    <p className="mt-0.5 opacity-90 leading-relaxed">{notif.message}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export function SystemMonitoringGrid({ monitoring = {} }) {
  const srv = monitoring.server || {};
  const db = monitoring.database || {};
  const api = monitoring.api || {};
  const ext = monitoring.extension || {};

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {/* 13. Monitoring Server Lokal */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-indigo-600" aria-hidden="true" />
            <h4 className="text-xs font-bold text-slate-900">Server Lokal</h4>
          </div>
          <StatusBadge
            status={srv.status === 'online' ? 'online' : 'error'}
            label={srv.status === 'online' ? 'Aktif' : 'Offline'}
          />
        </div>
        <dl className="space-y-1.5 text-xs">
          <div className="flex justify-between gap-2">
            <dt className="text-slate-600">Host & Port</dt>
            <dd className="font-semibold text-slate-900 tabular-nums">{srv.host || '127.0.0.1'}:{srv.port || 8000}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-slate-600">Runtime</dt>
            <dd className="font-semibold text-slate-900 tabular-nums">PHP {srv.php_version || '8.3'} / Laravel {srv.laravel_version || '13'}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-slate-600">Waktu Server</dt>
            <dd className="font-medium text-slate-800">{formatDateTimeId(srv.server_time)}</dd>
          </div>
        </dl>
      </div>

      {/* 14. Monitoring API */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-indigo-600" aria-hidden="true" />
            <h4 className="text-xs font-bold text-slate-900">Endpoint API</h4>
          </div>
          <StatusBadge
            status={api.status === 'ready' ? 'ready' : 'degraded'}
            label={api.status === 'ready' ? 'Siap' : 'Terbatas'}
          />
        </div>
        <p className="text-[11px] font-mono bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 break-all mb-2">
          POST {api.endpoint || '/api/sync-rka'}
        </p>
        <dl className="space-y-1 text-xs">
          <div className="flex justify-between gap-2">
            <dt className="text-slate-600">Request Terakhir</dt>
            <dd className="font-medium text-slate-800">{formatDateTimeId(api.last_request_at)}</dd>
          </div>
          {api.last_error && (
            <p className="text-[11px] text-rose-700 font-medium truncate" title={api.last_error}>
              Error: {api.last_error}
            </p>
          )}
        </dl>
      </div>

      {/* 15. Monitoring Chrome Extension */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Plug className="w-4 h-4 text-indigo-600" aria-hidden="true" />
            <h4 className="text-xs font-bold text-slate-900">Chrome Extension</h4>
          </div>
          <StatusBadge
            status={ext.status || 'standby'}
            label={
              ext.status === 'connected'
                ? 'Terhubung'
                : ext.status === 'error'
                ? 'Gagal'
                : ext.status === 'disconnected'
                ? 'Terputus'
                : 'Siaga'
            }
          />
        </div>
        <dl className="space-y-1.5 text-xs">
          <div className="flex justify-between gap-2">
            <dt className="text-slate-600">Sinkron Terakhir</dt>
            <dd className="font-medium text-slate-800">{formatDateTimeId(ext.last_sync_at)}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-slate-600">Jenis Data</dt>
            <dd className="font-semibold text-slate-900 truncate max-w-[140px]">
              {ext.last_sync_type || 'Menunggu data'}
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-slate-600">Status Proses</dt>
            <dd className="font-semibold text-slate-800 capitalize">
              {ext.last_sync_status === 'success' ? 'Berhasil' : ext.last_sync_status === 'error' ? 'Gagal' : 'Belum ada'}
            </dd>
          </div>
        </dl>
      </div>

      {/* 16. Monitoring Database */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-indigo-600" aria-hidden="true" />
            <h4 className="text-xs font-bold text-slate-900">Database MySQL</h4>
          </div>
          <StatusBadge
            status={db.status === 'connected' ? 'connected' : 'error'}
            label={db.status === 'connected' ? 'Terhubung' : 'Error'}
          />
        </div>
        <dl className="space-y-1.5 text-xs">
          <div className="flex justify-between gap-2">
            <dt className="text-slate-600">Database</dt>
            <dd className="font-semibold text-slate-900">{db.name || 'db_sipd'} (:{db.port || 3306})</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-slate-600">Tabel / Baris Aktif</dt>
            <dd className="font-semibold text-slate-900 tabular-nums">
              {Number(db.table_count || 0).toLocaleString('id-ID')} tabel / {Number(db.managed_rows || 0).toLocaleString('id-ID')} baris
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-slate-600">Kapasitas</dt>
            <dd className="font-semibold text-slate-900 tabular-nums">
              {db.size_mb !== null && db.size_mb !== undefined ? `${db.size_mb} MB` : 'Tidak tersedia'}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

export function SyncAndActivityPanels({ syncHistory = [], activities = [] }) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      {/* 17. Riwayat Sinkronisasi */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" aria-hidden="true" />
            <h3 className="text-sm font-bold text-slate-900">Riwayat Sinkronisasi</h3>
          </div>
          <span className="text-[11px] font-semibold text-slate-500">10 proses terakhir</span>
        </div>

        {syncHistory.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-600">
            Belum ada riwayat sinkronisasi tercatat. Riwayat akan muncul otomatis saat Chrome Extension mengirim data ke server lokal.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600">
                  <th className="py-2 pr-3 font-semibold">Waktu</th>
                  <th className="py-2 pr-3 font-semibold">Jenis Data</th>
                  <th className="py-2 pr-3 font-semibold text-right">Berhasil / Gagal</th>
                  <th className="py-2 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {syncHistory.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 pr-3 text-slate-600 whitespace-nowrap">
                      {formatDateTimeId(log.created_at)}
                    </td>
                    <td className="py-2.5 pr-3">
                      <p className="font-semibold text-slate-900">{log.data_type}</p>
                      {log.error_detail && (
                        <p className="text-[11px] text-rose-700 mt-0.5 line-clamp-1" title={log.error_detail}>
                          {log.error_detail}
                        </p>
                      )}
                    </td>
                    <td className="py-2.5 pr-3 text-right tabular-nums whitespace-nowrap">
                      <span className="font-bold text-emerald-700">{log.processed_count}</span>
                      <span className="text-slate-400 mx-1">/</span>
                      <span className={log.failed_count > 0 ? 'font-bold text-rose-700' : 'text-slate-500'}>
                        {log.failed_count}
                      </span>
                    </td>
                    <td className="py-2.5 text-right whitespace-nowrap">
                      <StatusBadge
                        status={log.status}
                        label={log.status === 'success' ? 'Berhasil' : log.status === 'partial' ? 'Sebagian' : 'Gagal'}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 18. Aktivitas Terbaru */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-600" aria-hidden="true" />
            <h3 className="text-sm font-bold text-slate-900">Aktivitas Terbaru</h3>
          </div>
          <span className="text-[11px] font-semibold text-slate-500">Log sistem</span>
        </div>

        {activities.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-600">
            Belum ada aktivitas tercatat. Aktivitas import database, sinkronisasi RKA, posting data, dan perubahan master data akan tampil di sini.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {activities.map((act) => (
              <li key={act.id} className="py-2.5 flex items-start justify-between gap-3 text-xs">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wide">
                      {act.category}
                    </span>
                    <p className="font-semibold text-slate-900 truncate">{act.title}</p>
                  </div>
                  {act.description && (
                    <p className="text-slate-600 mt-1 line-clamp-2">{act.description}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[11px] text-slate-500 whitespace-nowrap">
                    {formatDateTimeId(act.created_at)}
                  </span>
                  {act.actor && (
                    <p className="text-[10px] text-slate-500 mt-0.5">{act.actor}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
