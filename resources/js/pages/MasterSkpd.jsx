import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Building2,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Pencil,
  UserCheck,
  X,
  Save,
} from 'lucide-react';

export default function MasterSkpd({ tahunAnggaran = '2026' }) {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [jenis, setJenis] = useState('all'); // 'all' | 'induk' | 'unit'
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);

  // Modal Edit Kepala SKPD
  const [editingUnit, setEditingUnit] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nama_kepala: '',
    nip_kepala: '',
    pangkat_kepala: '',
    status_kepala: '',
  });

  const fetchSkpd = async (targetPage = page, query = search, unitJenis = jenis) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(targetPage),
        per_page: String(perPage),
        tahun_anggaran: String(tahunAnggaran),
        jenis: unitJenis,
      });
      if (query) params.set('search', query);

      const res = await fetch(`/api/data/master-skpd?${params.toString()}`);
      const json = await res.json();
      if (json.status === 'success' && json.data) {
        setData(json.data.data || []);
        setMeta(json.data);
      }
    } catch (err) {
      console.error('Error fetching master skpd:', err);
      toast.error('Gagal memuat data Master SKPD.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [tahunAnggaran]);

  useEffect(() => {
    fetchSkpd(page, search, jenis);
  }, [page, perPage, jenis, tahunAnggaran]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchSkpd(1, search, jenis);
  };

  const openEditModal = (unit) => {
    setEditingUnit(unit);
    setForm({
      nama_kepala: unit.nama_kepala || '',
      nip_kepala: unit.nip_kepala || '',
      pangkat_kepala: unit.pangkat_kepala || '',
      status_kepala: unit.status_kepala || '',
    });
  };

  const handleSaveKepala = async (e) => {
    e.preventDefault();
    if (!editingUnit) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/data/master-skpd/${editingUnit.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (res.ok && json.status === 'success') {
        toast.success(json.message || 'Data Kepala SKPD diperbarui.');
        setEditingUnit(null);
        fetchSkpd(page, search, jenis);
      } else {
        toast.error(json.message || 'Gagal menyimpan data Kepala SKPD.');
      }
    } catch (err) {
      toast.error('Terjadi kesalahan: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">Master SKPD &amp; Kepala Unit</h1>
              <span className="px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-bold">
                TA {tahunAnggaran}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Referensi Perangkat Daerah dan pejabat penandatangan RKA (hasil sinkronisasi SIPD atau input manual)
            </p>
          </div>
        </div>

        <button
          onClick={() => fetchSkpd(page, search, jenis)}
          disabled={loading}
          className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-600' : 'text-slate-500'}`} />
          <span>Muat Ulang</span>
        </button>
      </div>

      {/* Filter & Search */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kode, nama SKPD, nama kepala, atau NIP..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition cursor-pointer shadow-xs"
          >
            Cari
          </button>
        </form>

        <div className="flex items-center gap-2">
          <select
            value={jenis}
            onChange={(e) => {
              setJenis(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="all">Semua Unit</option>
            <option value="induk">SKPD Induk</option>
            <option value="unit">UPTD / Sub Unit</option>
          </select>

          <select
            value={perPage}
            onChange={(e) => {
              setPerPage(Number(e.target.value));
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value={25}>25 / hal</option>
            <option value={50}>50 / hal</option>
            <option value={100}>100 / hal</option>
          </select>
        </div>
      </div>

      {/* Tabel Data SKPD */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px] tracking-wider">
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-4">Kode SKPD</th>
                <th className="py-3.5 px-4">Nama Perangkat Daerah / Unit</th>
                <th className="py-3.5 px-4">Kepala SKPD / Unit</th>
                <th className="py-3.5 px-4">NIP &amp; Pangkat</th>
                <th className="py-3.5 px-4 text-right w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin text-indigo-600 mx-auto mb-2" />
                    <span>Memuat data Master SKPD...</span>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500">
                    <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">Belum ada data Master SKPD untuk TA {tahunAnggaran}</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Jalankan sinkronisasi dari halaman <code className="font-mono">/master/skpd</code> SIPD menggunakan extension.
                    </p>
                  </td>
                </tr>
              ) : (
                data.map((row, idx) => {
                  const rowNum = ((meta?.current_page || 1) - 1) * (meta?.per_page || perPage) + idx + 1;
                  return (
                    <tr key={row.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 text-center font-semibold text-slate-500 tabular-nums">{rowNum}</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-700 whitespace-nowrap">
                        <div>{row.kode_skpd || '-'}</div>
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-sans font-semibold ${
                          Number(row.is_skpd) === 1
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {Number(row.is_skpd) === 1 ? 'SKPD Induk' : 'Unit / UPTD'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        <div>{row.nama_skpd}</div>
                        {row.nama_induk && row.nama_induk !== row.nama_skpd && (
                          <div className="text-[11px] text-slate-400 font-normal mt-0.5">Induk: {row.nama_induk}</div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {row.nama_kepala ? (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="font-bold text-slate-800">{row.nama_kepala}</span>
                            {row.status_kepala && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold">
                                {row.status_kepala}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex px-2 py-0.5 rounded bg-slate-100 text-slate-400 text-[11px] italic">
                            Belum diisi
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <div className="font-mono text-[11px]">{row.nip_kepala ? `NIP. ${row.nip_kepala}` : '-'}</div>
                        {row.pangkat_kepala && (
                          <div className="text-[11px] text-slate-400 mt-0.5">{row.pangkat_kepala}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => openEditModal(row)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-semibold transition cursor-pointer"
                        >
                          <Pencil className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta && meta.last_page > 1 && (
          <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-600">
            <span>
              Menampilkan <strong>{meta.from || 0}</strong>–<strong>{meta.to || 0}</strong> dari <strong>{meta.total || 0}</strong> SKPD
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2.5 font-semibold tabular-nums">
                {meta.current_page} / {meta.last_page}
              </span>
              <button
                type="button"
                disabled={page >= meta.last_page}
                onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Edit Kepala SKPD */}
      {editingUnit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="min-w-0 pr-3">
                <h3 className="text-sm font-bold text-slate-900">Edit Kepala SKPD / Unit</h3>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">{editingUnit.nama_skpd}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingUnit(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveKepala} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Nama Kepala (beserta gelar)</label>
                <input
                  type="text"
                  value={form.nama_kepala}
                  onChange={(e) => setForm((f) => ({ ...f, nama_kepala: e.target.value }))}
                  placeholder="Contoh: dr. Ahmad Khotib, M.Kes"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">NIP Kepala</label>
                <input
                  type="text"
                  value={form.nip_kepala}
                  onChange={(e) => setForm((f) => ({ ...f, nip_kepala: e.target.value }))}
                  placeholder="Contoh: 197003242002121003"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Status Jabatan</label>
                  <select
                    value={form.status_kepala}
                    onChange={(e) => setForm((f) => ({ ...f, status_kepala: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Definitif</option>
                    <option value="Plt.">Plt.</option>
                    <option value="Pj.">Pj.</option>
                    <option value="Plh.">Plh.</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Pangkat / Golongan</label>
                  <input
                    type="text"
                    value={form.pangkat_kepala}
                    onChange={(e) => setForm((f) => ({ ...f, pangkat_kepala: e.target.value }))}
                    placeholder="Contoh: Pembina Utama Muda"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingUnit(null)}
                  disabled={saving}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? 'Menyimpan...' : 'Simpan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
