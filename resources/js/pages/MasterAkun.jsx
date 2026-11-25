import React, { useState, useEffect } from 'react';
import { 
  Receipt, 
  Search, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight,
  ChevronDown,
  SlidersHorizontal,
  CheckCircle2,
  FolderTree
} from 'lucide-react';

export default function MasterAkun() {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all'); // all | pendapatan | belanja | pembiayaan
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);

  const fetchAkun = async (targetPage = page, query = search, kat = filterType) => {
    setLoading(true);
    try {
      let url = `/api/data/master-akun?page=${targetPage}&per_page=${perPage}`;
      if (query) {
        url += `&search=${encodeURIComponent(query)}`;
      }
      if (kat && kat !== 'all') {
        url += `&kategori=${encodeURIComponent(kat)}`;
      }
      const res = await fetch(url);
      const json = await res.json();
      if (json.status === 'success' && json.data) {
        setData(json.data.data || []);
        setMeta(json.data);
      }
    } catch (err) {
      console.error('Error fetching master akun:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAkun(page, search, filterType);
  }, [page, perPage, filterType]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchAkun(1, search, filterType);
  };

  const handleFilterChange = (e) => {
    setFilterType(e.target.value);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Master Akun / Rekening</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Daftar referensi kode akun belanja, pendapatan, dan pembiayaan SIPD hasil sinkronisasi
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchAkun(page, search)}
            disabled={loading}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <span>Kategori:</span>
          </label>
          <div className="relative">
            <select
              value={filterType}
              onChange={handleFilterChange}
              className="appearance-none pl-3 pr-8 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition cursor-pointer"
            >
              <option value="all">Semua Kategori Akun</option>
              <option value="pendapatan">Pendapatan (Kode 4)</option>
              <option value="belanja">Belanja (Kode 5)</option>
              <option value="pembiayaan">Pembiayaan (Kode 6)</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="text-xs text-slate-400 font-medium hidden sm:inline">
            Total: <b className="text-slate-700">{meta?.total ? meta.total.toLocaleString('id-ID') : 0}</b> akun
          </div>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-sm w-full">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari kode atau nama akun..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
            />
          </div>
          <button
            type="submit"
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
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
                <th className="py-3 px-4 w-48">Kode Akun</th>
                <th className="py-3 px-4">Uraian / Nama Akun</th>
                <th className="py-3 px-4 w-28 text-center">Kategori</th>
                <th className="py-3 px-4 w-20 text-center">Level</th>
                <th className="py-3 px-4 w-28 text-center">Input RKA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                    <span>Memuat data master akun...</span>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <FolderTree className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-medium text-slate-600">Tidak ada data master akun ditemukan</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Silakan sinkron data Master Akun dari Chrome Extension atau sesuaikan filter pencarian.
                    </p>
                  </td>
                </tr>
              ) : (
                data.map((item, idx) => {
                  const num = (page - 1) * perPage + idx + 1;
                  const isPendapatan = item.is_pendapatan === 1 || item.pendapatan === 1 || String(item.kode_akun).startsWith('4');
                  const isBelanja = item.is_bl === 1 || item.belanja === 1 || String(item.kode_akun).startsWith('5');
                  const isPembiayaan = item.is_pembiayaan === 1 || item.pembiayaan === 1 || String(item.kode_akun).startsWith('6');

                  return (
                    <tr key={item.id_akun || idx} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4 text-center text-slate-400 font-mono text-[11px]">
                        {num}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono font-semibold px-2 py-1 rounded-md bg-slate-100 text-slate-800 border border-slate-200 text-[11px]">
                          {item.kode_akun}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {item.nama_akun}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isPendapatan && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Pendapatan
                          </span>
                        )}
                        {isBelanja && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            Belanja
                          </span>
                        )}
                        {isPembiayaan && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Pembiayaan
                          </span>
                        )}
                        {!isPendapatan && !isBelanja && !isPembiayaan && (
                          <span className="text-slate-400 text-[11px]">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-bold text-[10px]">
                          Lvl {item.level || 1}
                        </span>
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
              Menampilkan <b>{meta.from || 1}</b> - <b>{meta.to || meta.total}</b> dari total <b>{meta.total.toLocaleString('id-ID')}</b> akun
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
