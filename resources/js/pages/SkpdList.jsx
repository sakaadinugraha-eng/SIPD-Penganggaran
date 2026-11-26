import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  ChevronDown, 
  ChevronRight, 
  Search, 
  ArrowUpRight, 
  Hospital, 
  Stethoscope, 
  Building,
  RefreshCw,
  FolderOpen,
  ChevronLeft,
  SlidersHorizontal,
  X,
  ShoppingBag
} from 'lucide-react';

export default function SkpdList({ onSelectSkpd, tahunAnggaran = '2026' }) {
  const [hierarchy, setHierarchy] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState({});
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);

  const formatRupiah = (num) => {
    return 'Rp ' + Number(num || 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const fetchHierarchy = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ tahun_anggaran: String(tahunAnggaran) });
      const res = await fetch(`/api/data/skpd-hierarchy?${params.toString()}`);
      const json = await res.json();
      if (json.status === 'success') {
        setHierarchy(json.data || []);
        // Otomatis buka accordion untuk parent yang memiliki anak
        const initialExpand = {};
        (json.data || []).forEach((item) => {
          if (item.has_children) {
            initialExpand[item.kode_skpd] = true;
          }
        });
        setExpanded(initialExpand);
      }
    } catch (err) {
      console.error('Error fetching SKPD hierarchy:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchHierarchy();
  }, [tahunAnggaran]);

  const toggleExpand = (kodeSkpd) => {
    setExpanded((prev) => ({
      ...prev,
      [kodeSkpd]: !prev[kodeSkpd],
    }));
  };

  const getUnitBadge = (unit) => {
    const type = unit.unit_type;
    if (type === 'rsud') {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
          <Hospital className="w-3 h-3" />
          RSUD
        </span>
      );
    }
    if (type === 'puskesmas') {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <Stethoscope className="w-3 h-3" />
          PUSKESMAS
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
        <Building className="w-3 h-3" />
        KANTOR INDUK
      </span>
    );
  };

  // Filter pencarian
  const filteredHierarchy = hierarchy.filter((item) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const matchParent = (item.nama_skpd && item.nama_skpd.toLowerCase().includes(q)) ||
      (item.kode_skpd && item.kode_skpd.toLowerCase().includes(q));
    const matchChild = (item.sub_units || []).some(
      (u) => (u.nama_sub_skpd && u.nama_sub_skpd.toLowerCase().includes(q)) ||
        (u.kode_sub_skpd && u.kode_sub_skpd.toLowerCase().includes(q))
    );
    return matchParent || matchChild;
  });

  const totalAllSub = hierarchy.reduce((acc, s) => acc + (s.total_sub_keg || 0), 0);
  const totalAllPagu = hierarchy.reduce((acc, s) => acc + (s.total_pagu || 0), 0);

  // Kalkulasi Paginasi
  const totalItems = filteredHierarchy.length;
  const totalPages = Math.ceil(totalItems / perPage) || 1;
  const fromItem = totalItems > 0 ? (page - 1) * perPage + 1 : 0;
  const toItem = Math.min(page * perPage, totalItems);
  const paginatedHierarchy = filteredHierarchy.slice((page - 1) * perPage, page * perPage);

  // Helper render tombol paginasi
  const renderPaginationButtons = (currentPage, lastPage, onSelectPage) => {
    if (!lastPage || lastPage <= 1) return null;

    const pages = [];
    const delta = 1;
    for (let i = 1; i <= lastPage; i++) {
      if (i === 1 || i === lastPage || (i >= currentPage - delta && i <= currentPage + delta)) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }

    return (
      <div className="flex items-center gap-1">
        {pages.map((p, index) => {
          if (p === '...') {
            return (
              <span key={`dots-${index}`} className="px-2 py-1 text-slate-400 text-xs">
                ...
              </span>
            );
          }
          const isActive = p === currentPage;
          return (
            <button
              key={p}
              onClick={() => onSelectPage(p)}
              className={`min-w-8 h-8 px-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {p}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Top Banner / Summary */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-800">Belanja & RKA: Rekap Perangkat Daerah</h3>
              <span className="px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-semibold">
                Belanja Daerah {tahunAnggaran}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Daftar pagu indikatif belanja per Perangkat Daerah. Klik nama SKPD atau unit untuk membuka rincian Sub Kegiatan Belanja & RKA.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <span className="text-[11px] text-slate-400 block font-medium">Total Pagu Validasi</span>
            <span className="text-base font-bold text-emerald-700 font-mono">{formatRupiah(totalAllPagu)}</span>
          </div>
          <div className="text-right border-l border-slate-200 pl-6">
            <span className="text-[11px] text-slate-400 block font-medium">Total Sub Kegiatan</span>
            <span className="text-base font-bold text-indigo-700">{totalAllSub.toLocaleString('id-ID')}</span>
          </div>
        </div>
      </div>

      {/* Search Bar & Pengaturan Paginasi */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Cari nama atau kode perangkat daerah..."
            className="w-full pl-9 pr-8 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setPage(1);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <div className="relative">
              <select
                value={perPage}
                onChange={(e) => {
                  setPerPage(Number(e.target.value));
                  setPage(1);
                }}
                className="appearance-none py-1.5 pl-2.5 pr-7 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition cursor-pointer"
              >
                <option value="10">10 baris</option>
                <option value="15">15 baris</option>
                <option value="25">25 baris</option>
                <option value="50">50 baris</option>
                <option value="100">100 baris</option>
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <button
            onClick={fetchHierarchy}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-600 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            title="Muat ulang struktur SKPD"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Cascading Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px] tracking-wider">
                <th className="py-3 px-4 w-12 text-center"></th>
                <th className="py-3 px-4">Perangkat Daerah</th>
                <th className="py-3 px-4 text-center w-36">Total Sub Kegiatan</th>
                <th className="py-3 px-4 text-right w-52">Pagu Validasi</th>
                <th className="py-3 px-4 text-center w-36">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
                      <span className="text-xs font-medium">Memuat struktur SKPD...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredHierarchy.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-16 text-center text-slate-400">
                    <Building2 className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">Tidak ada perangkat daerah ditemukan</p>
                    <p className="text-[11px] text-slate-400 mt-1">Lakukan sinkronisasi dari SIPD RI terlebih dahulu.</p>
                  </td>
                </tr>
              ) : (
                paginatedHierarchy.map((parent) => {
                  const isExp = expanded[parent.kode_skpd] ?? false;
                  return (
                    <React.Fragment key={parent.kode_skpd}>
                      {/* Parent Row (e.g. 1.02.0.00.0.00.02.0000 Dinas Kesehatan) */}
                      <tr className="hover:bg-slate-50/80 transition group bg-white">
                        <td className="py-3.5 px-4 text-center">
                          {parent.has_children ? (
                            <button
                              onClick={() => toggleExpand(parent.kode_skpd)}
                              className="w-6 h-6 rounded flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition cursor-pointer"
                              title={isExp ? 'Tutup sub-unit' : 'Lihat sub-unit'}
                            >
                              {isExp ? (
                                <ChevronDown className="w-4 h-4 text-indigo-600" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </button>
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 inline-block"></span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] text-slate-500 font-semibold">
                              {parent.kode_skpd}
                            </span>
                            {parent.has_children && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                TOTAL GABUNGAN
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => onSelectSkpd({ namaSkpd: parent.nama_skpd, subSkpd: 'all' })}
                            className="font-bold text-slate-800 text-xs hover:text-indigo-600 transition text-left mt-0.5 block cursor-pointer"
                          >
                            {parent.nama_skpd}
                          </button>
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                          {parent.total_sub_keg}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-slate-800 font-mono">
                          {formatRupiah(parent.total_pagu)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => onSelectSkpd({ namaSkpd: parent.nama_skpd, subSkpd: 'all' })}
                            className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-[11px] transition inline-flex items-center gap-1 cursor-pointer"
                          >
                            <FolderOpen className="w-3.5 h-3.5" />
                            <span>Lihat Sub Kegiatan</span>
                          </button>
                        </td>
                      </tr>

                      {/* Sub-Units (Expanded Children) */}
                      {parent.has_children && isExp && (
                        parent.sub_units.map((child, cIdx) => (
                          <tr
                            key={cIdx}
                            className="bg-slate-50/60 hover:bg-indigo-50/40 transition border-t border-slate-100"
                          >
                            <td className="py-2.5 px-4 text-center"></td>
                            <td className="py-2.5 px-4 pl-10">
                              <div className="flex items-center gap-2">
                                <span className="text-slate-400 font-mono text-[10px]">↳</span>
                                <span className="font-mono text-[11px] text-slate-500">
                                  {child.kode_sub_skpd}
                                </span>
                                {getUnitBadge(child)}
                              </div>
                              <button
                                onClick={() => onSelectSkpd({ namaSkpd: parent.nama_skpd, subSkpd: child.nama_sub_skpd })}
                                className="font-semibold text-slate-700 text-xs hover:text-indigo-600 transition text-left mt-0.5 block pl-4 cursor-pointer"
                              >
                                {child.nama_sub_skpd}
                              </button>
                            </td>
                            <td className="py-2.5 px-4 text-center font-semibold text-slate-600">
                              {child.count_sub}
                            </td>
                            <td className="py-2.5 px-4 text-right font-semibold text-slate-700 font-mono">
                              {formatRupiah(child.total_pagu)}
                            </td>
                            <td className="py-2.5 px-4 text-center">
                              <button
                                onClick={() => onSelectSkpd({ namaSkpd: parent.nama_skpd, subSkpd: child.nama_sub_skpd })}
                                className="px-2 py-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-semibold transition inline-flex items-center gap-1 cursor-pointer"
                              >
                                <span>Buka</span>
                                <ArrowUpRight className="w-3 h-3 text-slate-400" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginasi Footer */}
        {totalItems > 0 && (
          <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-500">
            <div>
              Menampilkan <span className="font-semibold text-slate-700">{fromItem}</span> -{' '}
              <span className="font-semibold text-slate-700">{toItem}</span> dari{' '}
              <span className="font-semibold text-slate-700">{totalItems}</span> perangkat daerah
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page <= 1 || loading}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Sebelumnya</span>
              </button>

              {renderPaginationButtons(page, totalPages, (p) => setPage(p))}

              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page >= totalPages || loading}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer"
              >
                <span>Berikutnya</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
