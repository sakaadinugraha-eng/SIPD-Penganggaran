import React, { useState, useEffect } from 'react';
import { 
  Coins, 
  Search, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  Lock,
  Unlock,
  Layers,
  SlidersHorizontal
} from 'lucide-react';

export default function MasterSumberDana() {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusInput, setStatusInput] = useState('all'); // all | input | induk
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);

  const fetchDana = async (targetPage = page, query = search, status = statusInput) => {
    setLoading(true);
    try {
      let url = `/api/data/sumber-dana?page=${targetPage}&per_page=${perPage}`;
      if (query) {
        url += `&search=${encodeURIComponent(query)}`;
      }
      if (status && status !== 'all') {
        url += `&status_input=${encodeURIComponent(status)}`;
      }
      const res = await fetch(url);
      const json = await res.json();
      if (json.status === 'success' && json.data) {
        setData(json.data.data || []);
        setMeta(json.data);
      }
    } catch (err) {
      console.error('Error fetching master sumber dana:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDana(page, search, statusInput);
  }, [page, perPage, statusInput]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchDana(1, search, statusInput);
  };

  const handleStatusChange = (e) => {
    setStatusInput(e.target.value);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Master Sumber Dana</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Daftar klasifikasi sumber pendanaan APBD hasil sinkronisasi dari SIPD Kemendagri
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchDana(page, search)}
            disabled={loading}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <span>Status Input:</span>
          </label>
          <div className="relative">
            <select
              value={statusInput}
              onChange={handleStatusChange}
              className="appearance-none pl-3 pr-8 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition cursor-pointer"
            >
              <option value="all">Semua Status</option>
              <option value="input">Bisa Diinput (Item RKA)</option>
              <option value="induk">Akun Induk / Header</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="text-xs text-slate-400 font-medium hidden sm:inline">
            Total: <b className="text-slate-700">{meta?.total ? meta.total.toLocaleString('id-ID') : 0}</b> sumber dana
          </div>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-sm w-full">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari kode atau nama sumber dana..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
            />
          </div>
          <button
            type="submit"
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            Cari
          </button>
        </form>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4 w-44">Kode Dana</th>
                <th className="py-3 px-4">Nama Sumber Dana</th>
                <th className="py-3 px-4 w-32 text-center">Status Input</th>
                <th className="py-3 px-4 w-28 text-center">Kunci</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-500" />
                    <span>Memuat data master sumber dana...</span>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-400">
                    <Layers className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-medium text-slate-600">Tidak ada data sumber dana ditemukan</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Silakan sinkron data Master Sumber Dana dari Chrome Extension atau sesuaikan filter pencarian.
                    </p>
                  </td>
                </tr>
              ) : (
                data.map((item, idx) => {
                  const num = (page - 1) * perPage + idx + 1;
                  return (
                    <tr key={item.id_dana || idx} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4 text-center text-slate-400 font-mono text-[11px]">
                        {num}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono font-semibold px-2 py-1 rounded-md bg-slate-100 text-slate-800 border border-slate-200 text-[11px]">
                          {item.kode_dana}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {item.nama_dana}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {item.set_input === 1 ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Bisa Input</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Induk</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {item.is_locked === 1 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <Lock className="w-3 h-3" />
                            <span>Terkunci</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Unlock className="w-3 h-3" />
                            <span>Terbuka</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {meta && meta.total > 0 && (
          <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              Menampilkan <b>{meta.from || 1}</b> - <b>{meta.to || meta.total}</b> dari total <b>{meta.total.toLocaleString('id-ID')}</b> sumber dana
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page <= 1 || loading}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 font-medium cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Prev</span>
              </button>
              <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg font-bold text-slate-800">
                {page} / {meta.last_page || 1}
              </span>
              <button
                onClick={() => setPage((p) => (meta.last_page ? Math.min(p + 1, meta.last_page) : p + 1))}
                disabled={(meta.last_page && page >= meta.last_page) || loading}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 font-medium cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
