import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Eye, 
  ChevronLeft, 
  ChevronRight, 
  Layers, 
  Building, 
  Hospital, 
  Stethoscope,
  FileText,
  Package,
  ArrowLeft,
  X,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import SubKegiatanDetailModal from './SubKegiatanDetailModal';

export default function SubKegiatan({ 
  skpdList, 
  initialSkpd = 'all', 
  initialSubSkpd = 'all',
  onOpenPrint,
  onBackToSkpd
}) {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({});
  const [search, setSearch] = useState('');
  const [selectedSkpd, setSelectedSkpd] = useState(initialSkpd);
  const [selectedSubSkpd, setSelectedSubSkpd] = useState(initialSubSkpd);
  const [unitType, setUnitType] = useState('all'); // 'all', 'dinas', 'rsud', 'puskesmas'
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [loading, setLoading] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Sync props jika berubah dari luar (misal klik dari halaman SkpdList)
  useEffect(() => {
    setSelectedSkpd(initialSkpd);
    setSelectedSubSkpd(initialSubSkpd);
    setPage(1);
  }, [initialSkpd, initialSubSkpd]);

  const formatRupiah = (num) => {
    return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
  };

  // Helper untuk deteksi kategori unit
  const getUnitCategory = (namaSubSkpd = '') => {
    const upper = namaSubSkpd.toUpperCase();
    if (upper.includes('RSUD')) {
      return {
        label: 'RSUD',
        icon: Hospital,
        badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
      };
    }
    if (upper.includes('PUSKESMAS')) {
      return {
        label: 'Puskesmas',
        icon: Stethoscope,
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      };
    }
    return {
      label: 'Dinas Induk',
      icon: Building,
      badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    };
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        per_page: perPage,
        search,
        skpd: selectedSkpd,
        sub_skpd: selectedSubSkpd,
        unit_type: unitType,
      });

      const res = await fetch(`/api/data/sub-kegiatan?${params.toString()}`);
      const json = await res.json();
      if (json.status === 'success') {
        setData(json.data.data || []);
        setPagination({
          current_page: json.data.current_page,
          last_page: json.data.last_page,
          total: json.data.total,
          from: json.data.from,
          to: json.data.to,
        });
      }
    } catch (err) {
      console.error('Error fetching sub kegiatan:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, perPage, selectedSkpd, selectedSubSkpd, unitType]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchData();
  };

  const handleViewDetail = async (id) => {
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/data/sub-kegiatan/${id}`);
      const json = await res.json();
      if (json.status === 'success') {
        setSelectedDetail(json.data);
      }
    } catch (err) {
      alert('Gagal mengambil detail sub kegiatan.');
    } finally {
      setLoadingDetail(false);
    }
  };

  const clearFilter = () => {
    setSelectedSkpd('all');
    setSelectedSubSkpd('all');
    setUnitType('all');
    setSearch('');
    setPage(1);
  };

  const isFiltered = selectedSkpd !== 'all' || selectedSubSkpd !== 'all' || unitType !== 'all' || search !== '';

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
      {/* Active Filter / Breadcrumb Banner */}
      {(selectedSkpd !== 'all' || selectedSubSkpd !== 'all') && (
        <div className="bg-blue-50 border border-blue-200 p-3.5 rounded-xl flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            {onBackToSkpd && (
              <button
                onClick={onBackToSkpd}
                className="px-2.5 py-1 rounded-lg bg-white border border-blue-200 text-blue-700 hover:bg-blue-100 font-semibold flex items-center gap-1 transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Belanja & RKA</span>
              </button>
            )}
            <div className="text-slate-700">
              Menampilkan Sub Kegiatan untuk:{' '}
              <span className="font-bold text-blue-900">
                {selectedSubSkpd !== 'all' ? selectedSubSkpd : selectedSkpd}
              </span>
            </div>
          </div>
          <button
            onClick={clearFilter}
            className="text-blue-700 hover:text-blue-900 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Reset ke Semua</span>
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama/kode sub kegiatan atau SKPD..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2">
          {/* Filter SKPD Dropdown */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedSkpd}
              onChange={(e) => {
                setSelectedSkpd(e.target.value);
                setSelectedSubSkpd('all');
                setPage(1);
              }}
              className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden cursor-pointer"
            >
              <option value="all">Semua Perangkat Daerah</option>
              {skpdList.map((s, idx) => (
                <option key={idx} value={s.nama_skpd}>
                  {s.nama_skpd}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Filter Unit Type */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => { setUnitType('all'); setPage(1); }}
              className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                unitType === 'all'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => { setUnitType('dinas'); setPage(1); }}
              className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                unitType === 'dinas'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              🏢 Dinas Induk
            </button>
            <button
              onClick={() => { setUnitType('rsud'); setPage(1); }}
              className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                unitType === 'rsud'
                  ? 'bg-white text-sky-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              🏥 RSUD
            </button>
            <button
              onClick={() => { setUnitType('puskesmas'); setPage(1); }}
              className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                unitType === 'puskesmas'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              🩺 Puskesmas
            </button>
          </div>

          {/* Rows per page dropdown */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <div className="relative">
              <select
                value={perPage}
                onChange={(e) => {
                  setPerPage(Number(e.target.value));
                  setPage(1);
                }}
                className="appearance-none py-1.5 pl-2.5 pr-7 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition cursor-pointer"
              >
                <option value="15">15 baris</option>
                <option value="25">25 baris</option>
                <option value="50">50 baris</option>
                <option value="100">100 baris</option>
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-3 w-10 text-center">No</th>
                <th className="py-3 px-3 w-40">Kode Sub Giat</th>
                <th className="py-3 px-3">Nama Sub Kegiatan</th>
                <th className="py-3 px-3 w-56">Perangkat Daerah / Unit</th>
                <th className="py-3 px-3 text-end w-36">Pagu</th>
                <th className="py-3 px-3 text-center w-24">Item RKA</th>
                <th className="py-3 px-3 text-center w-52">Aksi Laporan RKA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs">Memuat data sub kegiatan...</span>
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-16 text-center text-slate-400">
                    <Layers className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">Tidak ada sub kegiatan ditemukan</p>
                    <p className="text-[11px] text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau filter SKPD.</p>
                  </td>
                </tr>
              ) : (
                data.map((row, idx) => {
                  const unitCat = getUnitCategory(row.nama_sub_skpd || row.nama_skpd);
                  const UnitIcon = unitCat.icon;
                  return (
                    <tr key={row.id} className="hover:bg-slate-50/80 transition group">
                      <td className="py-3 px-3 text-center text-slate-400 font-mono text-[11px]">
                        {(pagination.from || 1) + idx}
                      </td>
                      <td className="py-3 px-3 font-mono font-semibold text-indigo-700 text-[11px]">
                        {row.kode_sub_giat}
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-800">
                        <div className="font-semibold text-slate-900">{row.nama_sub_giat}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate max-w-md">{row.kode_sbl}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${unitCat.badgeClass}`}>
                            <UnitIcon className="w-3 h-3" />
                            <span>{unitCat.label}</span>
                          </span>
                        </div>
                        <div className="font-semibold text-slate-800 text-[11px]">
                          {row.nama_sub_skpd || row.nama_skpd}
                        </div>
                        {row.nama_sub_skpd && row.nama_sub_skpd !== row.nama_skpd && (
                          <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                            Induk: {row.nama_skpd}
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400 font-mono">
                          {row.kode_sub_skpd}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-end font-semibold text-emerald-700">
                        {formatRupiah(row.pagu)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                          {row.rka_count || 0} item
                        </span>
                      </td>

                      {/* KOLOM AKSI DENGAN PILIHAN RINCIAN BELANJA & PAKET KELOMPOK */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* 1. Modal Detail */}
                          <button
                            onClick={() => handleViewDetail(row.id)}
                            disabled={loadingDetail}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 transition cursor-pointer"
                            title="Lihat Detail RKA & Indikator"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* 2. Tombol Cetak RKA Rincian Belanja */}
                          <button
                            onClick={() => onOpenPrint && onOpenPrint(row.id, 'rincian')}
                            className="px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[10.5px] font-semibold transition inline-flex items-center gap-1 cursor-pointer"
                            title="Buka / Cetak Formulir RKA Rincian Belanja"
                          >
                            <FileText className="w-3 h-3 text-blue-600" />
                            <span>Rincian</span>
                          </button>

                          {/* 3. Tombol Cetak RKA Paket / Kelompok */}
                          <button
                            onClick={() => onOpenPrint && onOpenPrint(row.id, 'paket')}
                            className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10.5px] font-semibold transition inline-flex items-center gap-1 cursor-pointer"
                            title="Buka / Cetak Ringkasan Paket / Kelompok Belanja"
                          >
                            <Package className="w-3 h-3 text-emerald-600" />
                            <span>Paket</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {pagination.total > 0 && (
          <div className="px-5 py-3.5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 bg-slate-50">
            <div>
              Menampilkan <span className="font-semibold text-slate-700">{pagination.from || 0}</span> -{' '}
              <span className="font-semibold text-slate-700">{pagination.to || 0}</span> dari{' '}
              <span className="font-semibold text-slate-700">{pagination.total}</span> sub kegiatan
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Sebelumnya</span>
              </button>

              {renderPaginationButtons(pagination.current_page, pagination.last_page, (p) => setPage(p))}

              <button
                onClick={() => setPage((p) => Math.min(pagination.last_page || 1, p + 1))}
                disabled={page >= (pagination.last_page || 1) || loading}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer"
              >
                <span>Berikutnya</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedDetail && (
        <SubKegiatanDetailModal
          sub={selectedDetail}
          subKegiatan={selectedDetail}
          onClose={() => setSelectedDetail(null)}
          onOpenPrint={onOpenPrint}
        />
      )}
    </div>
  );
}
