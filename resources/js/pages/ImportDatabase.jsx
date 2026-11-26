import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  Database,
  Upload,
  Download,
  FileCode2,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  HardDrive,
  Table2,
  Clock,
  ArrowRight,
} from 'lucide-react';

const TARGET_TABLES = [
  {
    name: 'data_sub_keg_bl',
    label: 'Sub Kegiatan & Belanja',
    desc: 'Master SKPD, program, kegiatan, sub kegiatan, dan pagu anggaran.',
  },
  {
    name: 'data_rka',
    label: 'Rincian RKA',
    desc: 'Detail rekening belanja, komponen SSH, volume, koefisien, dan total harga.',
  },
  {
    name: 'data_capaian_prog_sub_keg',
    label: 'Capaian Program',
    desc: 'Indikator dan target capaian program pada tiap sub kegiatan.',
  },
  {
    name: 'data_sub_keg_indikator',
    label: 'Indikator Sub Kegiatan',
    desc: 'Tolok ukur, target output, dan satuan keluaran sub kegiatan.',
  },
  {
    name: 'data_pendapatan_skpd',
    label: 'SKPD Pendapatan',
    desc: 'Rekapitulasi target pendapatan per Perangkat Daerah.',
  },
  {
    name: 'data_pendapatan',
    label: 'Rincian Pendapatan',
    desc: 'Detail rekening dan uraian target pendapatan daerah.',
  },
  {
    name: 'data_pembiayaan_skpd',
    label: 'SKPD Pembiayaan',
    desc: 'Rekapitulasi penerimaan dan pengeluaran pembiayaan per SKPD.',
  },
  {
    name: 'data_pembiayaan',
    label: 'Rincian Pembiayaan',
    desc: 'Detail rekening penerimaan dan pengeluaran pembiayaan daerah.',
  },
  {
    name: 'data_akun',
    label: 'Master Akun / Rekening',
    desc: 'Referensi kode akun belanja, pendapatan, dan pembiayaan.',
  },
  {
    name: 'data_sumber_dana',
    label: 'Master Sumber Dana',
    desc: 'Daftar klasifikasi sumber pendanaan APBD.',
  },
];

export default function ImportDatabase({ onDataImported, tahunAnggaran = '2026', availableYears = [2027, 2026, 2025] }) {
  const [actionTab, setActionTab] = useState('import'); // 'import' | 'export'
  const [sourceMode, setSourceMode] = useState('server'); // 'upload' | 'server'
  const [targetTahun, setTargetTahun] = useState(String(tahunAnggaran));
  const [exportTahun, setExportTahun] = useState(String(tahunAnggaran));
  const [exportSummary, setExportSummary] = useState(null);
  const [loadingExportSummary, setLoadingExportSummary] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [serverFiles, setServerFiles] = useState([]);
  const [selectedServerFile, setSelectedServerFile] = useState('');
  const [phpLimits, setPhpLimits] = useState({ upload_max_filesize: '-', post_max_size: '-' });
  const [loadingFiles, setLoadingFiles] = useState(false);

  const [confirmOverwrite, setConfirmOverwrite] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef(null);

  const fetchServerFiles = async () => {
    setLoadingFiles(true);
    try {
      const res = await fetch('/api/data/sql-files');
      const json = await res.json();
      if (json.status === 'success') {
        const list = json.data || [];
        setServerFiles(list);
        if (json.limits) setPhpLimits(json.limits);
        if (list.length > 0 && !selectedServerFile) {
          setSelectedServerFile(list[0].name);
        }
      }
    } catch (err) {
      console.error('Gagal memuat daftar file SQL:', err);
    } finally {
      setLoadingFiles(false);
    }
  };

  useEffect(() => {
    fetchServerFiles();
  }, []);

  useEffect(() => {
    setTargetTahun(String(tahunAnggaran));
    setExportTahun(String(tahunAnggaran));
  }, [tahunAnggaran]);

  const fetchExportSummary = async (yr = exportTahun) => {
    setLoadingExportSummary(true);
    try {
      const params = new URLSearchParams({ tahun_anggaran: String(yr) });
      const res = await fetch(`/api/data/export-sql/summary?${params.toString()}`);
      const json = await res.json();
      if (json.status === 'success') {
        setExportSummary(json.data);
      }
    } catch (err) {
      console.error('Gagal memuat ringkasan export SQL:', err);
    } finally {
      setLoadingExportSummary(false);
    }
  };

  useEffect(() => {
    if (actionTab === 'export') {
      fetchExportSummary(exportTahun);
    }
  }, [actionTab, exportTahun]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams({ tahun_anggaran: String(exportTahun) });
      const res = await fetch(`/api/data/export-sql?${params.toString()}`);

      if (!res.ok) {
        let errMessage = 'Gagal mengekspor database SQL.';
        try {
          const json = await res.json();
          if (json?.message) errMessage = json.message;
        } catch {}
        toast.error(errMessage);
        return;
      }

      const disposition = res.headers.get('Content-Disposition') || '';
      const match = disposition.match(/filename="?([^";]+)"?/i);
      const filename = match ? match[1] : `sipd-local-ta-${exportTahun}.sql`;

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success(`File ${filename} berhasil diunduh.`);
    } catch (err) {
      toast.error('Terjadi kesalahan saat mengekspor SQL: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.sql')) {
      toast.error('Hanya file berekstensi .sql yang didukung.');
      return;
    }
    setSelectedFile(file);
    setErrorMsg('');
    setResult(null);
  };

  const handleImport = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setResult(null);

    if (sourceMode === 'upload' && !selectedFile) {
      toast.error('Pilih file .sql terlebih dahulu.');
      return;
    }
    if (sourceMode === 'server' && !selectedServerFile) {
      toast.error('Pilih file .sql dari daftar server terlebih dahulu.');
      return;
    }
    if (!confirmOverwrite) {
      toast.error('Centang persetujuan timpa data terlebih dahulu.');
      return;
    }

    setImporting(true);
    try {
      let res;
      if (sourceMode === 'upload') {
        const formData = new FormData();
        formData.append('sql_file', selectedFile);
        formData.append('tahun_anggaran', String(targetTahun));
        res = await fetch('/api/data/import-sql', {
          method: 'POST',
          headers: { Accept: 'application/json' },
          body: formData,
        });
      } else {
        res = await fetch('/api/data/import-sql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            server_file: selectedServerFile,
            tahun_anggaran: Number(targetTahun),
          }),
        });
      }

      const json = await res.json();
      if (res.ok && json.status === 'success') {
        toast.success(json.message);
        setResult(json.data);
        setConfirmOverwrite(false);
        if (onDataImported) onDataImported();
      } else {
        const msg = json.message || 'Gagal mengimpor database SQL.';
        setErrorMsg(msg);
        toast.error(msg);
      }
    } catch (err) {
      const msg = 'Terjadi kesalahan jaringan/server: ' + err.message;
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setImporting(false);
    }
  };

  const formatNumber = (val) => Number(val || 0).toLocaleString('id-ID');

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Import &amp; Export Database (.sql)</h2>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              Impor dump WP-SIPD atau ekspor seluruh data (Belanja &amp; RKA, Pendapatan, Pembiayaan, Master) ke file <code className="font-mono">.sql</code>.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setActionTab('import')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                actionTab === 'import'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import .sql</span>
            </button>
            <button
              type="button"
              onClick={() => setActionTab('export')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                actionTab === 'export'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export .sql</span>
            </button>
          </div>

          {actionTab === 'import' && (
            <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 shrink-0">
              <span>Batas Upload PHP:</span>
              <span className="font-bold text-slate-700">{phpLimits.upload_max_filesize}</span>
              <span className="text-slate-300">|</span>
              <span>POST:</span>
              <span className="font-bold text-slate-700">{phpLimits.post_max_size}</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {actionTab === 'export' ? (
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Export Database ke File .sql</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Menghasilkan file <code className="font-mono">.sql</code> berisi statement <code className="font-mono">INSERT INTO</code> untuk seluruh modul (Belanja &amp; RKA, Pendapatan, Pembiayaan, dan Master) yang 100% kompatibel dengan fitur Import SQL.
                </p>
              </div>
              <button
                type="button"
                onClick={() => fetchExportSummary(exportTahun)}
                disabled={loadingExportSummary}
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingExportSummary ? 'animate-spin' : ''}`} />
                <span>Cek Ulang</span>
              </button>
            </div>

            <div>
              <label htmlFor="export-tahun-anggaran" className="block text-xs font-bold text-slate-700 mb-2">
                Tahun Anggaran yang Di-export
              </label>
              <select
                id="export-tahun-anggaran"
                value={String(exportTahun)}
                onChange={(e) => setExportTahun(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {availableYears.map((yr) => (
                  <option key={yr} value={String(yr)}>
                    Tahun Anggaran {yr}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 divide-y divide-slate-200/70">
              <div className="px-4 py-2.5 flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Ringkasan Data TA {exportTahun}</span>
                <span className="text-indigo-700">
                  {loadingExportSummary ? 'Menghitung...' : `${formatNumber(exportSummary?.total_rows || 0)} total baris`}
                </span>
              </div>
              {TARGET_TABLES.map((tbl) => (
                <div key={tbl.name} className="px-4 py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-slate-800">{tbl.label}</div>
                    <div className="font-mono text-[11px] text-slate-500">{tbl.name}</div>
                  </div>
                  <span className="font-bold text-slate-700">
                    {loadingExportSummary ? '...' : `${formatNumber(exportSummary?.counts?.[tbl.name] || 0)} baris`}
                  </span>
                </div>
              ))}
            </div>

            {!loadingExportSummary && (exportSummary?.total_rows || 0) === 0 && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3.5 flex items-start gap-2.5 text-xs text-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Belum ada data untuk <strong>Tahun Anggaran {exportTahun}</strong>. Pilih tahun lain atau impor data terlebih dahulu.
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={handleExport}
              disabled={exporting || loadingExportSummary || (exportSummary?.total_rows || 0) === 0}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              {exporting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Menyiapkan &amp; Mengunduh File .sql...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download Export Database (.sql) TA {exportTahun}</span>
                </>
              )}
            </button>
          </div>
        ) : (
        /* Form Import (7 cols) */
        <form
          onSubmit={handleImport}
          className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5"
        >
          {/* Tahun Anggaran Target */}
          <div>
            <label htmlFor="import-tahun-anggaran" className="block text-xs font-bold text-slate-700 mb-2">
              Tahun Anggaran Tujuan
            </label>
            <select
              id="import-tahun-anggaran"
              value={String(targetTahun)}
              onChange={(e) => setTargetTahun(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {availableYears.map((yr) => (
                <option key={yr} value={String(yr)}>
                  Tahun Anggaran {yr}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500 mt-1.5">
              Hanya tabel yang ada di file <code className="font-mono">.sql</code> pada Tahun Anggaran <strong>{targetTahun}</strong> yang akan ditimpa. Data tahun lain &amp; tabel yang tidak ada di file tetap aman.
            </p>
          </div>

          {/* Mode Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Sumber File SQL
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setSourceMode('server');
                  setErrorMsg('');
                }}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  sourceMode === 'server'
                    ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <HardDrive className="w-3.5 h-3.5" />
                <span>File di Server (storage/app)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSourceMode('upload');
                  setErrorMsg('');
                }}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  sourceMode === 'upload'
                    ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Unggah dari Komputer</span>
              </button>
            </div>
          </div>

          {/* Server File Mode */}
          {sourceMode === 'server' && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">
                  Pilih file `.sql` di folder `storage/app/`
                </span>
                <button
                  type="button"
                  onClick={fetchServerFiles}
                  disabled={loadingFiles}
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${loadingFiles ? 'animate-spin' : ''}`} />
                  <span>Muat Ulang</span>
                </button>
              </div>

              {serverFiles.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-xs text-slate-500">
                  Belum ada file <code className="font-mono text-slate-700">.sql</code> di folder{' '}
                  <code className="font-mono text-slate-700">storage/app/</code>.
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {serverFiles.map((file) => {
                    const isSelected = selectedServerFile === file.name;
                    return (
                      <label
                        key={file.name}
                        className={`flex items-center justify-between p-3 rounded-xl border transition cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-50/70 border-indigo-300 text-slate-900'
                            : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <input
                            type="radio"
                            name="server_file"
                            value={file.name}
                            checked={isSelected}
                            onChange={() => setSelectedServerFile(file.name)}
                            className="accent-indigo-600"
                          />
                          <FileCode2 className={`w-4 h-4 shrink-0 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
                          <div className="min-w-0">
                            <div className="text-xs font-bold truncate">{file.name}</div>
                            <div className="text-[11px] text-slate-500">Diubah: {file.modified_at}</div>
                          </div>
                        </div>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 shrink-0 ml-2">
                          {file.size_mb} MB
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
              <p className="text-[11px] text-slate-500">
                Disarankan untuk file berukuran besar (&gt; {phpLimits.upload_max_filesize}) agar tidak terhambat batas upload PHP.
              </p>
            </div>
          )}

          {/* Upload Mode */}
          {sourceMode === 'upload' && (
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".sql"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full rounded-xl border-2 border-dashed border-slate-300 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/30 p-6 text-center transition cursor-pointer"
              >
                <Upload className="w-6 h-6 text-indigo-600 mx-auto mb-2" />
                {selectedFile ? (
                  <div>
                    <p className="text-xs font-bold text-slate-800">{selectedFile.name}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {(selectedFile.size / 1048576).toFixed(2)} MB — Klik untuk ganti file
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-semibold text-slate-700">
                      Klik untuk memilih file <span className="font-mono">.sql</span>
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Maksimal sesuai batas upload server ({phpLimits.upload_max_filesize})
                    </p>
                  </div>
                )}
              </button>
            </div>
          )}

          {/* Overwrite Warning & Confirmation */}
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3.5 space-y-2.5">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 leading-relaxed">
                <span className="font-bold">Mode Menimpa Data:</span> Seluruh data lama di 4 tabel utama Belanja &amp; RKA akan dikosongkan sebelum data dari file SQL dimasukkan. Data Master, Pendapatan, Pembiayaan, dan Posting tidak ikut terhapus.
              </div>
            </div>
            <label className="flex items-center gap-2.5 pt-1 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={confirmOverwrite}
                onChange={(e) => setConfirmOverwrite(e.target.checked)}
                className="w-4 h-4 rounded accent-indigo-600 cursor-pointer"
              />
              <span className="text-xs font-semibold text-amber-950">
                Saya mengerti dan siap menimpa data 4 tabel utama saat ini
              </span>
            </label>
          </div>

          {errorMsg && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-800 font-medium">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={importing || !confirmOverwrite || (sourceMode === 'server' ? !selectedServerFile : !selectedFile)}
            className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed shadow-xs"
          >
            {importing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Sedang Memproses &amp; Mengimpor Data SQL...</span>
              </>
            ) : (
              <>
                <Database className="w-4 h-4" />
                <span>Mulai Import ke Database</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
        )}

        {/* Info & Result Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Result Card */}
          {result && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <h3 className="text-xs font-bold text-emerald-900">Import SQL Selesai</h3>
                  <p className="text-[11px] text-emerald-700 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" />
                    <span>Durasi: {(result.duration_ms / 1000).toFixed(2)} detik</span>
                    <span>•</span>
                    <span>Total: {formatNumber(result.total_rows)} baris</span>
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-emerald-200 divide-y divide-slate-100">
                {Object.entries(result.counts || {}).map(([table, count]) => (
                  <div key={table} className="flex items-center justify-between px-3.5 py-2 text-xs">
                    <span className="font-mono text-slate-700">{table}</span>
                    <span className="font-bold text-emerald-700">{formatNumber(count)} baris</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Target Tables Info */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3.5">
            <div className="flex items-center gap-2">
              <Table2 className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold text-slate-900">Cakupan 10 Tabel Data SIPD</h3>
            </div>
            <div className="space-y-2.5">
              {TARGET_TABLES.map((tbl) => (
                <div key={tbl.name} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-800">{tbl.label}</span>
                    <code className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                      {tbl.name}
                    </code>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{tbl.desc}</p>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Tabel lain di dalam dump (seperti <code className="font-mono">wp_*</code> atau tabel pendukung lainnya) otomatis dilewati agar database lokal tetap bersih.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
