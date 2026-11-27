import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  GitCompareArrows,
  ArrowLeftRight,
  Search,
  ChevronRight,
  ChevronDown,
  Download,
  RefreshCw,
  Filter,
  Layers,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Coins,
  Building2,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  Minus,
  History,
  Eye,
  X,
  FileSpreadsheet,
  FileText,
  Maximize2,
  Minimize2,
  Check,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const LEVELS = [
  { id: 'skpd', depth: 1, label: '1. SKPD', short: 'SKPD' },
  { id: 'program', depth: 2, label: '2. Program', short: 'Program' },
  { id: 'kegiatan', depth: 3, label: '3. Kegiatan', short: 'Kegiatan' },
  { id: 'sub_kegiatan', depth: 4, label: '4. Sub Kegiatan', short: 'Sub Keg' },
  { id: 'belanja', depth: 5, label: '5. Belanja', short: 'Belanja' },
  { id: 'paket', depth: 6, label: '6. Paket', short: 'Paket' },
  { id: 'keterangan_group', depth: 7, label: '7. Keterangan', short: 'Keterangan' },
  { id: 'keterangan', depth: 8, label: '8. Rincian / Spek', short: 'Rincian' },
];

const STATUS_FILTERS = [
  { id: 'all', label: 'Semua Status' },
  { id: 'changed', label: 'Semua yang Berubah (Pagu / Koef / Satuan / # / - / Spek)' },
  { id: 'bertambah', label: 'Bertambah (+)' },
  { id: 'berkurang', label: 'Berkurang (-)' },
  { id: 'baru', label: 'Item Baru' },
  { id: 'dihapus', label: 'Item Dihapus' },
  { id: 'berubah_rincian', label: 'Rincian / Koefisien / Satuan Berubah' },
  { id: 'tetap', label: 'Tetap / Sama' },
];

const LEVEL_STYLES = {
  skpd: 'bg-indigo-50/75 text-slate-900 font-bold border-t border-indigo-200/80 hover:bg-indigo-100/60',
  program: 'bg-slate-50/95 text-indigo-950 font-bold hover:bg-slate-100/70',
  kegiatan: 'bg-slate-50/45 text-slate-900 font-semibold hover:bg-slate-100/50',
  sub_kegiatan: 'bg-white text-slate-800 font-semibold hover:bg-slate-50',
  belanja: 'bg-white text-slate-900 font-semibold border-t border-slate-200/80 hover:bg-slate-50',
  paket: 'bg-white text-slate-800 font-semibold hover:bg-slate-50',
  keterangan_group: 'bg-white text-slate-700 font-medium hover:bg-slate-50',
  keterangan: 'bg-white text-slate-700 hover:bg-indigo-50/30',
};

const LEVEL_BADGES = {
  skpd: { text: 'SKPD', cls: 'bg-indigo-600 text-white' },
  program: { text: 'PROG', cls: 'bg-indigo-100 text-indigo-800' },
  kegiatan: { text: 'KEG', cls: 'bg-slate-200 text-slate-800' },
  sub_kegiatan: { text: 'SUB KEG', cls: 'bg-sky-100 text-sky-800' },
  belanja: { text: 'BELANJA', cls: 'bg-amber-100 text-amber-800' },
  paket: { text: 'PAKET', cls: 'bg-violet-100 text-violet-800 border border-violet-200' },
  keterangan_group: { text: 'KETERANGAN', cls: 'bg-slate-100 text-slate-700 border border-slate-200' },
  keterangan: { text: 'RINCIAN', cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
};

function formatRupiah(num) {
  const n = Number(num || 0);
  const abs = Math.abs(n);
  const formatted = new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(abs);
  return n < 0 ? `-Rp ${formatted}` : `Rp ${formatted}`;
}

function normalizeDanaName(val) {
  return String(val || '')
    .trim()
    .replace(/^\d+(?:\.\d+)+\s+/, '')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function formatDateTime(iso) {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function StatusBadge({ status, reasons = null }) {
  const map = {
    baru: { label: 'Baru', cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    dihapus: { label: 'Dihapus', cls: 'bg-rose-100 text-rose-800 border-rose-200' },
    bertambah: { label: 'Bertambah', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    berkurang: { label: 'Berkurang', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
    berubah_rincian: { label: 'Rincian Berubah', cls: 'bg-amber-50 text-amber-800 border-amber-200' },
    tetap: { label: 'Tetap', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
  };
  const cfg = map[status] || map.tetap;
  const titleText = Array.isArray(reasons) && reasons.length > 0 ? reasons.join(' | ') : undefined;
  return (
    <span
      title={titleText}
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border whitespace-nowrap ${cfg.cls}`}
    >
      {cfg.label}
    </span>
  );
}

function matchesStatusFilter(node, statusFilter) {
  if (statusFilter === 'all') return true;
  if (statusFilter === 'changed') return node.status !== 'tetap';
  if (statusFilter === 'tetap') return node.status === 'tetap';
  return node.status === statusFilter;
}

function nodeMatchesSearch(node, query) {
  if (!query) return true;
  const q = query.toLowerCase();
  const haystacks = [
    node.kode,
    node.nama,
    node.spesifikasi,
    node.sumber_dana,
    node.sumber_dana_a,
    node.sumber_dana_b,
    node.koefisien_a,
    node.koefisien_b,
  ];
  return haystacks.some((val) => val && String(val).toLowerCase().includes(q));
}

function filterTreeNodes(nodes, statusFilter, searchQuery, hideZeroRows = true) {
  if (!Array.isArray(nodes)) return [];
  const res = [];
  for (const node of nodes) {
    if (
      hideZeroRows &&
      Math.abs(Number(node.total_a || 0)) < 0.01 &&
      Math.abs(Number(node.total_b || 0)) < 0.01
    ) {
      continue;
    }

    const hasChildren = Array.isArray(node.children) && node.children.length > 0;
    const filteredChildren = hasChildren
      ? filterTreeNodes(node.children, statusFilter, searchQuery, hideZeroRows)
      : [];

    const selfMatchesStatus = matchesStatusFilter(node, statusFilter);
    const selfMatchesSearch = nodeMatchesSearch(node, searchQuery);

    if (hasChildren) {
      if (filteredChildren.length > 0 || (selfMatchesStatus && selfMatchesSearch && !searchQuery)) {
        res.push({
          ...node,
          children: filteredChildren,
        });
      }
    } else if (selfMatchesStatus && selfMatchesSearch) {
      res.push(node);
    }
  }
  return res;
}

function collectExpandablePaths(nodes, maxDepth, currentDepth = 1, parentPath = '', out = {}) {
  if (!Array.isArray(nodes) || currentDepth >= maxDepth) return out;
  nodes.forEach((node, idx) => {
    const path = `${parentPath}/${node.level}:${node.kode || idx}:${idx}`;
    if (Array.isArray(node.children) && node.children.length > 0) {
      out[path] = true;
      collectExpandablePaths(node.children, maxDepth, currentDepth + 1, path, out);
    }
  });
  return out;
}

const EXPORT_LEVEL_LABELS = {
  skpd: 'SKPD',
  program: 'PROGRAM',
  kegiatan: 'KEGIATAN',
  sub_kegiatan: 'SUB KEGIATAN',
  belanja: 'BELANJA',
  paket: 'PAKET',
  keterangan_group: 'KETERANGAN',
  keterangan: 'RINCIAN',
};

const EXPORT_STATUS_LABELS = {
  baru: 'Baru',
  dihapus: 'Dihapus',
  bertambah: 'Bertambah',
  berkurang: 'Berkurang',
  berubah_rincian: 'Rincian Berubah',
  tetap: 'Tetap',
};

function flattenForExport(nodes, maxDepth = 8, depth = 1, rows = []) {
  if (!Array.isArray(nodes) || depth > maxDepth) return rows;
  for (const n of nodes) {
    const isLeaf = n.level === 'keterangan';
    const koefA = String(n.koefisien_a || '').trim().replace(/\s+/g, ' ');
    const koefB = String(n.koefisien_b || '').trim().replace(/\s+/g, ' ');
    const koef = isLeaf
      ? (koefA && koefB && koefA !== '-' && koefB !== '-' && koefA.toLowerCase() !== koefB.toLowerCase()
          ? `${koefA} -> ${koefB}`
          : (koefB && koefB !== '-' ? koefB : (koefA || '-')))
      : '';

    const satA = String(n.satuan_a || '').trim();
    const satB = String(n.satuan_b || '').trim();
    const satALow = satA.toLowerCase();
    const satBLow = satB.toLowerCase();
    const isCombinedSat = satALow && satBLow && (satALow.startsWith(satBLow + ' x ') || satBLow.startsWith(satALow + ' x '));
    const satuan = isLeaf
      ? (satA && satB && satA !== '-' && satB !== '-' && satALow !== satBLow && !isCombinedSat
          ? `${satA} -> ${satB}`
          : (satB && satB !== '-' ? satB : (satA || '-')))
      : '';

    const danaChanged =
      isLeaf &&
      n.sumber_dana_a &&
      n.sumber_dana_b &&
      normalizeDanaName(n.sumber_dana_a) !== normalizeDanaName(n.sumber_dana_b);
    const dana = isLeaf
      ? (danaChanged ? `${n.sumber_dana_a} -> ${n.sumber_dana_b}` : (n.sumber_dana_b || n.sumber_dana_a || ''))
      : (n.sumber_dana || '');

    const cleanNama = n.level === 'paket'
      ? String(n.nama || '').replace(/^\[\s*#\s*\]\s*/i, '').trim()
      : n.level === 'keterangan_group'
      ? String(n.nama || '').replace(/^\[\s*-\s*\]\s*/i, '').trim()
      : String(n.nama || '').trim();

    const cleanKode = n.kode === '#' || n.kode === '-' ? '' : (n.kode || '');

    rows.push({
      level: EXPORT_LEVEL_LABELS[n.level] || String(n.level || '').toUpperCase(),
      rawLevel: n.level,
      depth,
      kode: cleanKode,
      uraian: cleanNama,
      spesifikasi: n.spesifikasi || '',
      koefisien: koef,
      satuan,
      sumber_dana: dana,
      total_a: n.total_a || 0,
      total_b: n.total_b || 0,
      selisih: n.selisih || 0,
      persen: n.persen ?? 0,
      status: EXPORT_STATUS_LABELS[n.status] || 'Tetap',
    });

    if (depth < maxDepth && Array.isArray(n.children) && n.children.length > 0) {
      flattenForExport(n.children, maxDepth, depth + 1, rows);
    }
  }
  return rows;
}

function countVisibleRows(nodes, expandedPaths, parentPath = '') {
  if (!Array.isArray(nodes)) return 0;
  let count = 0;
  nodes.forEach((node, idx) => {
    const path = `${parentPath}/${node.level}:${node.kode || idx}:${idx}`;
    count += 1;
    if (expandedPaths[path] && Array.isArray(node.children) && node.children.length > 0) {
      count += countVisibleRows(node.children, expandedPaths, path);
    }
  });
  return count;
}

function SearchableSelect({
  value,
  onChange,
  options,
  allLabel,
  placeholder = 'Ketik untuk mencari...',
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  const selectedOption = options.find((o) => o.value === value);
  const displayLabel = value === 'all' ? allLabel : (selectedOption?.label || value);

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 flex items-center justify-between gap-2 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
      >
        <span className="truncate text-left">{displayLabel}</span>
        <div className="flex items-center gap-1 shrink-0">
          {value !== 'all' && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onChange('all');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation();
                  onChange('all');
                }
              }}
              title="Reset pilihan"
              className="p-0.5 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-700"
            >
              <X className="w-3 h-3" />
            </span>
          )}
          <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {open && (
        <div className="absolute left-0 right-0 mt-1.5 bg-white rounded-xl border border-slate-200 shadow-lg z-40 overflow-hidden">
          <div className="p-2 border-b border-slate-100 bg-slate-50">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={placeholder}
                className="w-full pl-8 pr-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto py-1">
            <button
              type="button"
              onClick={() => {
                onChange('all');
                setOpen(false);
              }}
              className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between gap-2 hover:bg-indigo-50 cursor-pointer ${
                value === 'all' ? 'bg-indigo-50/70 text-indigo-800 font-semibold' : 'text-slate-700'
              }`}
            >
              <span className="truncate">{allLabel}</span>
              {value === 'all' && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
            </button>

            {filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-center text-[11px] text-slate-500">
                Tidak ada hasil untuk &ldquo;{query}&rdquo;
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = value === opt.value;
                return (
                  <button
                    type="button"
                    key={opt.key || opt.value}
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between gap-2 hover:bg-indigo-50 cursor-pointer ${
                      isSelected ? 'bg-indigo-50/70 text-indigo-800 font-semibold' : 'text-slate-700'
                    }`}
                  >
                    <span className="break-words leading-snug">{opt.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function LaporanPerbup({ tahunAnggaran = '2026' }) {
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [sources, setSources] = useState([]);
  const [skpds, setSkpds] = useState([]);
  const [sumberDanas, setSumberDanas] = useState([]);
  const [syncHistory, setSyncHistory] = useState([]);

  const [sourceA, setSourceA] = useState('live');
  const [sourceB, setSourceB] = useState('live');
  const [selectedSkpd, setSelectedSkpd] = useState('all');
  const [selectedDana, setSelectedDana] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [hideZeroRows, setHideZeroRows] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [displayLimit, setDisplayLimit] = useState(300);

  // Debounce pencarian 250ms agar tidak memfilter ulang seluruh pohon di setiap ketikan
  useEffect(() => {
    const t = setTimeout(() => {
      setSearchQuery(searchInput);
      setDisplayLimit(300);
    }, 250);
    return () => clearTimeout(t);
  }, [searchInput]);

  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [skpdSummaryList, setSkpdSummaryList] = useState([]);
  const [anomalies, setAnomalies] = useState([]);

  const [treeLoading, setTreeLoading] = useState(false);
  const autoLoadRef = useRef('');
  const [fullTree, setFullTree] = useState([]);
  const [skpdTreesCache, setSkpdTreesCache] = useState({});
  const [loadingSkpdMap, setLoadingSkpdMap] = useState({});

  const [expandedPaths, setExpandedPaths] = useState({});
  const [activeDepth, setActiveDepth] = useState(8);
  const [errorMsg, setErrorMsg] = useState(null);

  // Modals & Dropdowns
  const [detailModal, setDetailModal] = useState(null);
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [anomalyModalOpen, setAnomalyModalOpen] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const exportMenuRef = useRef(null);

  useEffect(() => {
    const handleOutside = (e) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target)) {
        setExportMenuOpen(false);
      }
    };
    const handleEsc = (e) => {
      if (e.key === 'Escape') setExportMenuOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);

  // 1. Load opsi sumber data, SKPD, sumber dana, dan riwayat sinkronisasi
  const fetchOptions = useCallback(async () => {
    setOptionsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/laporan/perbup/options?tahun_anggaran=${encodeURIComponent(tahunAnggaran)}`);
      const json = await res.json();
      if (json.status !== 'success') {
        throw new Error(json.message || 'Gagal memuat opsi laporan');
      }
      const srcs = json.data?.sources || [];
      setSources(srcs);
      setSkpds(json.data?.skpds || []);
      setSumberDanas(json.data?.sumber_danas || []);
      setSyncHistory(json.data?.sync_history || []);

      const postings = srcs.filter((s) => s.type === 'posting');
      if (postings.length > 0) {
        setSourceA(postings[0].id);
        setSourceB('live');
      } else {
        setSourceA('live');
        setSourceB('live');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Gagal memuat konfigurasi laporan.');
    } finally {
      setOptionsLoading(false);
    }
  }, [tahunAnggaran]);

  useEffect(() => {
    setSelectedSkpd('all');
    setSelectedDana('all');
    setSkpdTreesCache({});
    setFullTree([]);
    setExpandedPaths({});
    fetchOptions();
  }, [fetchOptions]);

  // 2. Load ringkasan SKPD + anomali + detail bila SKPD tertentu dipilih
  const fetchReportData = useCallback(async () => {
    if (optionsLoading) return;
    setErrorMsg(null);
    setSkpdTreesCache({});

    if (selectedSkpd === 'all') {
      setSummaryLoading(true);
      setFullTree([]);
      try {
        const params = new URLSearchParams({
          tahun_anggaran: String(tahunAnggaran),
          source_a: sourceA,
          source_b: sourceB,
          sumber_dana: selectedDana,
        });
        const res = await fetch(`/api/laporan/perbup/summary?${params.toString()}`);
        const json = await res.json();
        if (json.status !== 'success') {
          throw new Error(json.message || 'Gagal memuat ringkasan perbandingan');
        }
        setSummaryData(json.data?.summary || null);
        setSkpdSummaryList(json.data?.skpds || []);
        setAnomalies(json.data?.anomalies || []);
        setExpandedPaths({});
      } catch (err) {
        setErrorMsg(err.message || 'Gagal memuat ringkasan SKPD.');
      } finally {
        setSummaryLoading(false);
      }
    } else {
      setTreeLoading(true);
      try {
        const selectedSkpdObj = skpds.find((s) => s.kode_skpd === selectedSkpd);
        const params = new URLSearchParams({
          tahun_anggaran: String(tahunAnggaran),
          source_a: sourceA,
          source_b: sourceB,
          kode_skpd: selectedSkpd,
          nama_skpd: selectedSkpdObj?.nama_skpd || '',
          sumber_dana: selectedDana,
        });
        const res = await fetch(`/api/laporan/perbup/tree?${params.toString()}`);
        const json = await res.json();
        if (json.status !== 'success') {
          throw new Error(json.message || 'Gagal memuat pohon rincian Perbup');
        }
        const nodes = json.data || [];
        setFullTree(nodes);
        const totalA = nodes.reduce((acc, n) => acc + Number(n.total_a || 0), 0);
        const totalB = nodes.reduce((acc, n) => acc + Number(n.total_b || 0), 0);
        setSummaryData({
          total_a: totalA,
          total_b: totalB,
          selisih: totalB - totalA,
          persen: totalA ? Math.round(((totalB - totalA) / totalA) * 10000) / 100 : (totalB ? 100 : 0),
          jumlah_skpd: nodes.length,
        });
        setExpandedPaths(collectExpandablePaths(nodes, activeDepth));
      } catch (err) {
        setErrorMsg(err.message || 'Gagal memuat detail hierarki SKPD.');
      } finally {
        setTreeLoading(false);
      }
    }
  }, [optionsLoading, tahunAnggaran, sourceA, sourceB, selectedSkpd, selectedDana, activeDepth, skpds]);

  useEffect(() => {
    if (!optionsLoading && sources.length > 0) {
      fetchReportData();
    }
  }, [optionsLoading, sources.length, sourceA, sourceB, selectedSkpd, selectedDana, fetchReportData]);

  // Muat tree per-SKPD secara bertahap (concurrency 4) agar tidak membebani memori/timeout server
  const loadSkpdTreesBatch = useCallback(async (targetSkpds, autoExpandDepth = null) => {
    if (!Array.isArray(targetSkpds) || targetSkpds.length === 0) return;
    setTreeLoading(true);
    const concurrency = 4;
    let index = 0;

    const worker = async () => {
      while (index < targetSkpds.length) {
        const current = targetSkpds[index++];
        const cacheKey = (current.nama_skpd || current.kode_skpd || '').toLowerCase();
        try {
          const params = new URLSearchParams({
            tahun_anggaran: String(tahunAnggaran),
            source_a: sourceA,
            source_b: sourceB,
            kode_skpd: current.kode_skpd || '',
            nama_skpd: current.nama_skpd || '',
            sumber_dana: selectedDana,
          });
          const res = await fetch(`/api/laporan/perbup/tree?${params.toString()}`);
          const json = await res.json();
          if (json.status === 'success') {
            const skpdNodes = json.data || [];
            const childrenOfSkpd = skpdNodes[0]?.children || [];
            setSkpdTreesCache((prev) => ({ ...prev, [cacheKey]: childrenOfSkpd }));

            if (autoExpandDepth && autoExpandDepth > 1) {
              const skpdIdx = skpdSummaryList.findIndex(
                (s) => (s.nama_skpd || s.kode_skpd || '').toLowerCase() === cacheKey
              );
              if (skpdIdx !== -1) {
                const path = `/skpd:${current.kode_skpd || skpdIdx}:${skpdIdx}`;
                const subPaths = collectExpandablePaths(childrenOfSkpd, autoExpandDepth, 2, path, {});
                setExpandedPaths((prev) => ({ ...prev, [path]: true, ...subPaths }));
              }
            }
          }
        } catch {
          // Lanjutkan ke SKPD berikutnya jika satu SKPD gagal
        }
      }
    };

    try {
      await Promise.all(Array.from({ length: Math.min(concurrency, targetSkpds.length) }, () => worker()));
    } finally {
      setTreeLoading(false);
    }
  }, [tahunAnggaran, sourceA, sourceB, selectedDana, skpdSummaryList]);

  // Jika filter "Semua yang Berubah" atau "Rincian Berubah" dipilih pada mode Semua SKPD,
  // muat detail pohon per-SKPD secara bertahap agar perubahan non-pagu ikut terdeteksi cepat
  useEffect(() => {
    if (
      selectedSkpd === 'all' &&
      (statusFilter === 'changed' || statusFilter === 'berubah_rincian') &&
      skpdSummaryList.length > 0 &&
      Object.keys(skpdTreesCache).length === 0
    ) {
      const comboKey = `${tahunAnggaran}|${sourceA}|${sourceB}|${selectedDana}`;
      if (autoLoadRef.current === comboKey) return;
      autoLoadRef.current = comboKey;

      const missing = skpdSummaryList.filter((row) => {
        const cKey = (row.nama_skpd || row.kode_skpd || '').toLowerCase();
        return !skpdTreesCache[cKey];
      });
      loadSkpdTreesBatch(missing);
    } else if (Object.keys(skpdTreesCache).length === 0) {
      autoLoadRef.current = '';
    }
  }, [selectedSkpd, statusFilter, skpdSummaryList, skpdTreesCache, tahunAnggaran, sourceA, sourceB, selectedDana, loadSkpdTreesBatch]);

  // 3. Lazy-load detail SKPD tertentu saat di-expand dari mode Semua SKPD
  const handleToggleSkpdSummaryRow = async (skpdRow, path) => {
    const isCurrentlyOpen = !!expandedPaths[path];
    if (isCurrentlyOpen) {
      setExpandedPaths((prev) => ({ ...prev, [path]: false }));
      return;
    }

    const cacheKey = (skpdRow.nama_skpd || skpdRow.kode_skpd || '').toLowerCase();
    if (!skpdTreesCache[cacheKey]) {
      setLoadingSkpdMap((prev) => ({ ...prev, [cacheKey]: true }));
      try {
        const params = new URLSearchParams({
          tahun_anggaran: String(tahunAnggaran),
          source_a: sourceA,
          source_b: sourceB,
          kode_skpd: skpdRow.kode_skpd || '',
          nama_skpd: skpdRow.nama_skpd || '',
          sumber_dana: selectedDana,
        });
        const res = await fetch(`/api/laporan/perbup/tree?${params.toString()}`);
        const json = await res.json();
        if (json.status !== 'success') {
          throw new Error(json.message || 'Gagal memuat detail SKPD');
        }
        const skpdNodes = json.data || [];
        const childrenOfSkpd = skpdNodes[0]?.children || [];
        setSkpdTreesCache((prev) => ({ ...prev, [cacheKey]: childrenOfSkpd }));

        const subPaths = collectExpandablePaths(childrenOfSkpd, activeDepth, 2, path, {});
        setExpandedPaths((prev) => ({ ...prev, [path]: true, ...subPaths }));
      } catch (err) {
        toast.error(err.message || 'Gagal memuat detail SKPD');
      } finally {
        setLoadingSkpdMap((prev) => ({ ...prev, [cacheKey]: false }));
      }
    } else {
      const subPaths = collectExpandablePaths(skpdTreesCache[cacheKey], activeDepth, 2, path, {});
      setExpandedPaths((prev) => ({ ...prev, [path]: true, ...subPaths }));
    }
  };

  // Muat seluruh pohon semua SKPD secara bertahap
  const handleExpandAllGlobal = async () => {
    setActiveDepth(8);
    if (selectedSkpd !== 'all') {
      setExpandedPaths(collectExpandablePaths(displayedTree, 8));
      return;
    }
    const missing = skpdSummaryList.filter((row) => {
      const cKey = (row.nama_skpd || row.kode_skpd || '').toLowerCase();
      return !skpdTreesCache[cKey];
    });
    if (missing.length > 0) {
      await loadSkpdTreesBatch(missing, 8);
    } else {
      setExpandedPaths(collectExpandablePaths(displayedTree, 8));
    }
    toast.success(`Berhasil membentangkan rincian ${skpdSummaryList.length} SKPD`);
  };

  const handleCollapseAll = () => {
    setActiveDepth(1);
    setExpandedPaths({});
  };

  const mergedAllSkpdTree = useMemo(() => {
    if (selectedSkpd !== 'all') {
      return fullTree;
    }
    return skpdSummaryList.map((row) => {
      const cKey = (row.nama_skpd || row.kode_skpd || '').toLowerCase();
      const cachedChildren = skpdTreesCache[cKey] || null;
      let effectiveStatus = row.status;
      if (effectiveStatus === 'tetap' && Array.isArray(cachedChildren)) {
        if (cachedChildren.some((c) => c.status !== 'tetap')) {
          effectiveStatus = 'berubah_rincian';
        }
      }
      return {
        level: 'skpd',
        kode: row.kode_skpd,
        nama: row.nama_skpd,
        total_a: row.total_a,
        total_b: row.total_b,
        selisih: row.selisih,
        persen: row.persen,
        status: effectiveStatus,
        sub_keg_a: row.sub_keg_a,
        sub_keg_b: row.sub_keg_b,
        children: cachedChildren,
      };
    });
  }, [selectedSkpd, fullTree, skpdSummaryList, skpdTreesCache]);

  const displayedTree = useMemo(() => {
    return filterTreeNodes(mergedAllSkpdTree, statusFilter, searchQuery, hideZeroRows);
  }, [mergedAllSkpdTree, statusFilter, searchQuery, hideZeroRows]);

  const visibleRowCount = useMemo(() => {
    return countVisibleRows(displayedTree, expandedPaths);
  }, [displayedTree, expandedPaths]);

  const activeFilterChips = useMemo(() => {
    const chips = [];
    if (selectedSkpd !== 'all') {
      const skpdObj = skpds.find((s) => s.kode_skpd === selectedSkpd);
      chips.push({
        key: 'skpd',
        label: `SKPD: ${skpdObj ? skpdObj.nama_skpd : selectedSkpd}`,
        clear: () => setSelectedSkpd('all'),
      });
    }
    if (selectedDana !== 'all') {
      chips.push({
        key: 'dana',
        label: `Sumber Dana: ${selectedDana}`,
        clear: () => setSelectedDana('all'),
      });
    }
    if (statusFilter !== 'all') {
      const stObj = STATUS_FILTERS.find((s) => s.id === statusFilter);
      chips.push({
        key: 'status',
        label: `Status: ${stObj?.label || statusFilter}`,
        clear: () => setStatusFilter('all'),
      });
    }
    if (searchQuery.trim() !== '') {
      chips.push({
        key: 'search',
        label: `Cari: "${searchQuery.trim()}"`,
        clear: () => {
          setSearchInput('');
          setSearchQuery('');
        },
      });
    }
    return chips;
  }, [selectedSkpd, selectedDana, statusFilter, searchQuery, skpds]);

  const handleResetFilters = () => {
    setSelectedSkpd('all');
    setSelectedDana('all');
    setStatusFilter('all');
    setSearchInput('');
    setSearchQuery('');
    setDisplayLimit(300);
  };

  const handleSetDepth = (depth) => {
    setActiveDepth(depth);
    if (depth <= 1) {
      setExpandedPaths({});
      return;
    }
    const nextPaths = collectExpandablePaths(displayedTree, depth);
    setExpandedPaths(nextPaths);
  };

  const handleSwapSources = () => {
    setSourceA(sourceB);
    setSourceB(sourceA);
  };

  const handleExportExcel = () => {
    const rows = flattenForExport(displayedTree, activeDepth);
    if (rows.length === 0) {
      toast.error('Tidak ada data untuk diekspor.');
      return;
    }
    const labelA = sources.find((s) => s.id === sourceA)?.label || sourceA;
    const labelB = sources.find((s) => s.id === sourceB)?.label || sourceB;
    const activeLvlLabel = LEVELS.find((l) => l.depth === activeDepth)?.label || `Level ${activeDepth}`;

    const escapeHtml = (str) =>
      String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    const tableRows = rows
      .map((r) => {
        const bg =
          r.rawLevel === 'skpd'
            ? '#eef2ff'
            : r.rawLevel === 'program'
            ? '#f8fafc'
            : '#ffffff';
        const fw = ['skpd', 'program', 'kegiatan', 'belanja'].includes(r.rawLevel) ? 'bold' : 'normal';
        const padLeft = Math.max(0, r.depth - 1) * 14;
        return `<tr style="background:${bg};font-weight:${fw};">
          <td class="txt">${escapeHtml(r.level)}</td>
          <td class="txt">${escapeHtml(r.kode)}</td>
          <td class="txt" style="padding-left:${padLeft + 6}px;">${escapeHtml(r.uraian)}</td>
          <td class="txt">${escapeHtml(r.spesifikasi)}</td>
          <td class="txt">${escapeHtml(r.koefisien)}</td>
          <td class="txt">${escapeHtml(r.satuan)}</td>
          <td class="txt">${escapeHtml(r.sumber_dana)}</td>
          <td class="num">${Number(r.total_a || 0)}</td>
          <td class="num">${Number(r.total_b || 0)}</td>
          <td class="num">${Number(r.selisih || 0)}</td>
          <td style="text-align:right;">${Number(r.persen ?? 0)}%</td>
          <td class="txt" style="text-align:center;">${escapeHtml(r.status)}</td>
        </tr>`;
      })
      .join('');

    const html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
        <style>
          table { border-collapse: collapse; font-family: Calibri, Arial, sans-serif; font-size: 10pt; }
          th, td { border: 1px solid #cbd5e1; padding: 5px 6px; vertical-align: top; }
          th { background: #312e81; color: #ffffff; font-weight: bold; text-align: left; }
          .txt { text-align: left; mso-number-format:"\\@"; white-space: normal; }
          .num { text-align: right; mso-number-format:"\\#\\,\\#\\#0"; white-space: nowrap; }
        </style>
      </head>
      <body>
        <h3 style="font-family:Calibri,Arial,sans-serif;">Laporan Kelengkapan Perubahan Perbup - TA ${escapeHtml(tahunAnggaran)}</h3>
        <p style="font-family:Calibri,Arial,sans-serif;font-size:10pt;">Perbandingan: <b>${escapeHtml(labelA)}</b> vs <b>${escapeHtml(labelB)}</b> | Kedalaman: <b>${escapeHtml(activeLvlLabel)}</b></p>
        <table>
          <colgroup>
            <col width="110" />
            <col width="145" />
            <col width="340" />
            <col width="260" />
            <col width="140" />
            <col width="90" />
            <col width="220" />
            <col width="130" />
            <col width="130" />
            <col width="130" />
            <col width="90" />
            <col width="120" />
          </colgroup>
          <thead>
            <tr>
              <th>Level</th>
              <th>Kode</th>
              <th>Uraian / Komponen</th>
              <th>Spesifikasi</th>
              <th>Koefisien</th>
              <th>Satuan</th>
              <th>Sumber Dana</th>
              <th style="text-align:right;">Sebelum (${escapeHtml(labelA)})</th>
              <th style="text-align:right;">Sesudah (${escapeHtml(labelB)})</th>
              <th style="text-align:right;">Selisih (Rp)</th>
              <th style="text-align:right;">Perubahan (%)</th>
              <th style="text-align:center;">Status</th>
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
      </body>
      </html>`;

    const blob = new Blob(['\uFEFF' + html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kelengkapan-perubahan-perbup-TA${tahunAnggaran}-L${activeDepth}.xls`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`Export Excel berhasil (${rows.length} baris, s.d. ${activeLvlLabel})`);
  };

  const handleExportCsv = () => {
    const rows = flattenForExport(displayedTree, activeDepth);
    if (rows.length === 0) {
      toast.error('Tidak ada data untuk diekspor.');
      return;
    }
    const labelA = sources.find((s) => s.id === sourceA)?.label || sourceA;
    const labelB = sources.find((s) => s.id === sourceB)?.label || sourceB;

    const headers = [
      'Level',
      'Kode',
      'Uraian / Komponen',
      'Spesifikasi',
      'Koefisien',
      'Satuan',
      'Sumber Dana',
      `Sebelum (${labelA})`,
      `Sesudah (${labelB})`,
      'Selisih (Rp)',
      'Perubahan (%)',
      'Status',
    ];

    const escapeCsv = (val) => {
      const str = String(val ?? '');
      if (/[",\n\r]/.test(str)) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const lines = [
      headers.map(escapeCsv).join(','),
      ...rows.map((r) => [
        r.level.toUpperCase(),
        r.kode,
        '  '.repeat(Math.max(0, r.depth - 1)) + r.uraian,
        r.spesifikasi,
        r.koefisien,
        r.satuan,
        r.sumber_dana,
        r.total_a,
        r.total_b,
        r.selisih,
        r.persen,
        r.status,
      ].map(escapeCsv).join(',')),
    ];

    const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kelengkapan-perubahan-perbup-TA${tahunAnggaran}-L${activeDepth}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`File CSV berhasil diunduh (${rows.length} baris)`);
  };

  const buildPrintableDocumentHtml = (rows, labelA, labelB, activeLvlLabel, isWord = false) => {
    const escapeHtml = (str) =>
      String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    const fmtRp = (v) =>
      new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Number(v || 0));

    const tableRows = rows
      .map((r) => {
        const bg =
          r.rawLevel === 'skpd'
            ? '#eef2ff'
            : r.rawLevel === 'program'
            ? '#f8fafc'
            : '#ffffff';
        const fw = ['skpd', 'program', 'kegiatan', 'belanja'].includes(r.rawLevel) ? 'bold' : 'normal';
        const padLeft = Math.max(0, r.depth - 1) * 10;
        return `<tr style="background:${bg};font-weight:${fw};">
          <td>${escapeHtml(r.level)}</td>
          <td>${escapeHtml(r.kode)}</td>
          <td style="padding-left:${padLeft + 5}px;">${escapeHtml(r.uraian)}</td>
          <td>${escapeHtml(r.spesifikasi)}</td>
          <td>${escapeHtml(r.koefisien)}</td>
          <td>${escapeHtml(r.satuan)}</td>
          <td>${escapeHtml(r.sumber_dana)}</td>
          <td style="text-align:right;white-space:nowrap;">${fmtRp(r.total_a)}</td>
          <td style="text-align:right;white-space:nowrap;">${fmtRp(r.total_b)}</td>
          <td style="text-align:right;white-space:nowrap;">${fmtRp(r.selisih)}</td>
          <td style="text-align:right;white-space:nowrap;">${Number(r.persen ?? 0)}%</td>
          <td style="text-align:center;">${escapeHtml(r.status)}</td>
        </tr>`;
      })
      .join('');

    const wordAttrs = isWord
      ? `xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"`
      : '';

    const wordXml = isWord
      ? `<!--[if gte mso 9]><xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml><![endif]-->`
      : '';

    return `<!DOCTYPE html>
      <html ${wordAttrs}>
      <head>
        <meta charset="utf-8" />
        <title>Laporan Kelengkapan Perubahan Perbup - TA ${escapeHtml(tahunAnggaran)}</title>
        ${wordXml}
        <style>
          @page { size: A4 landscape; margin: 10mm; }
          @page WordSection1 {
            size: 29.7cm 21.0cm;
            mso-page-orientation: landscape;
            margin: 1.0cm 1.0cm 1.0cm 1.0cm;
          }
          div.WordSection1 { page: WordSection1; }
          body { font-family: Calibri, Arial, sans-serif; font-size: 8.5pt; color: #0f172a; margin: 0; padding: 6px; }
          h2 { margin: 0 0 3px 0; font-size: 12pt; }
          p { margin: 0 0 8px 0; font-size: 8.5pt; color: #334155; }
          table { width: 100%; border-collapse: collapse; font-size: 7.5pt; table-layout: fixed; }
          th, td { border: 1px solid #94a3b8; padding: 3px 4px; vertical-align: top; text-align: left; word-wrap: break-word; overflow-wrap: break-word; }
          th { background: #312e81; color: #ffffff; font-weight: bold; }
          tr { page-break-inside: avoid; }
        </style>
      </head>
      <body>
        <div class="WordSection1">
        <h2>Laporan Kelengkapan Perubahan Perbup - TA ${escapeHtml(tahunAnggaran)}</h2>
        <p>Perbandingan: <b>${escapeHtml(labelA)}</b> vs <b>${escapeHtml(labelB)}</b> | Kedalaman: <b>${escapeHtml(activeLvlLabel)}</b></p>
        <table>
          <colgroup>
            <col style="width:6%;" />
            <col style="width:9%;" />
            <col style="width:17%;" />
            <col style="width:11%;" />
            <col style="width:6%;" />
            <col style="width:5%;" />
            <col style="width:12%;" />
            <col style="width:9%;" />
            <col style="width:9%;" />
            <col style="width:8%;" />
            <col style="width:3%;" />
            <col style="width:5%;" />
          </colgroup>
          <thead>
            <tr>
              <th>Level</th>
              <th>Kode</th>
              <th>Uraian / Komponen</th>
              <th>Spesifikasi</th>
              <th>Koefisien</th>
              <th>Satuan</th>
              <th>Sumber Dana</th>
              <th style="text-align:right;">Sebelum</th>
              <th style="text-align:right;">Sesudah</th>
              <th style="text-align:right;">Selisih (Rp)</th>
              <th style="text-align:right;">%</th>
              <th style="text-align:center;">Status</th>
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
        </div>
      </body>
      </html>`;
  };

  const handleExportWord = () => {
    const rows = flattenForExport(displayedTree, activeDepth);
    if (rows.length === 0) {
      toast.error('Tidak ada data untuk diekspor.');
      return;
    }
    const labelA = sources.find((s) => s.id === sourceA)?.label || sourceA;
    const labelB = sources.find((s) => s.id === sourceB)?.label || sourceB;
    const activeLvlLabel = LEVELS.find((l) => l.depth === activeDepth)?.label || `Level ${activeDepth}`;

    const html = buildPrintableDocumentHtml(rows, labelA, labelB, activeLvlLabel, true);
    const blob = new Blob(['\uFEFF' + html], { type: 'application/msword;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kelengkapan-perubahan-perbup-TA${tahunAnggaran}-L${activeDepth}.doc`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`Export Word berhasil (${rows.length} baris, s.d. ${activeLvlLabel})`);
  };

  const handleExportPdf = () => {
    const rows = flattenForExport(displayedTree, activeDepth);
    if (rows.length === 0) {
      toast.error('Tidak ada data untuk diekspor.');
      return;
    }
    const labelA = sources.find((s) => s.id === sourceA)?.label || sourceA;
    const labelB = sources.find((s) => s.id === sourceB)?.label || sourceB;
    const activeLvlLabel = LEVELS.find((l) => l.depth === activeDepth)?.label || `Level ${activeDepth}`;

    const html = buildPrintableDocumentHtml(rows, labelA, labelB, activeLvlLabel, false);
    const win = window.open('', '_blank', 'width=1200,height=800');
    if (!win) {
      toast.error('Pop-up diblokir browser. Izinkan pop-up untuk menyimpan PDF.');
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
    }, 350);
  };

  const sourceALabel = sources.find((s) => s.id === sourceA)?.label || 'Sebelum';
  const sourceBLabel = sources.find((s) => s.id === sourceB)?.label || 'Sesudah';
  const activeLevelObj = LEVELS.find((l) => l.depth === activeDepth) || LEVELS[7];

  const renderTreeRows = (nodes, depth = 1, parentPath = '', breadcrumb = []) => {
    if (!Array.isArray(nodes)) return null;
    const rows = [];

    nodes.forEach((node, idx) => {
      const path = `${parentPath}/${node.level}:${node.kode || idx}:${idx}`;
      const isSkpdLazy = node.level === 'skpd' && selectedSkpd === 'all' && node.children === null;
      const hasChildren = isSkpdLazy || (Array.isArray(node.children) && node.children.length > 0);
      const isExpanded = !!expandedPaths[path];
      const skpdCacheKey = (node.nama || node.kode || '').toLowerCase();
      const isLoadingSkpd = node.level === 'skpd' && !!loadingSkpdMap[skpdCacheKey];
      const isLeaf = node.level === 'keterangan';
      const badge = LEVEL_BADGES[node.level] || LEVEL_BADGES.keterangan;
      const indentPx = Math.max(0, depth - 1) * 18;

      const cleanNama = node.level === 'paket'
        ? String(node.nama || '').replace(/^\[\s*#\s*\]\s*/i, '')
        : node.level === 'keterangan_group'
        ? String(node.nama || '').replace(/^\[\s*-\s*\]\s*/i, '')
        : (node.nama || '');

      const currentBreadcrumb = [...breadcrumb, { level: badge.text, kode: node.kode, nama: cleanNama }];

      const selisihColor =
        node.selisih > 0.01
          ? 'text-emerald-700'
          : node.selisih < -0.01
          ? 'text-rose-700'
          : 'text-slate-600';

      const koefDisplay = isLeaf
        ? (node.koefisien_a && node.koefisien_b && node.koefisien_a !== node.koefisien_b
            ? `${node.koefisien_a} → ${node.koefisien_b}`
            : (node.koefisien_b || node.koefisien_a || '-'))
        : '';

      const satALow = String(node.satuan_a || '').trim().toLowerCase();
      const satBLow = String(node.satuan_b || '').trim().toLowerCase();
      const isCombinedSatuan =
        satALow && satBLow && (satALow.startsWith(satBLow + ' x ') || satBLow.startsWith(satALow + ' x '));
      const satuanChanged =
        isLeaf &&
        satALow &&
        satBLow &&
        satALow !== '-' &&
        satBLow !== '-' &&
        satALow !== satBLow &&
        !isCombinedSatuan;
      const satuanDisplay = isLeaf
        ? (satuanChanged
            ? `${node.satuan_a} → ${node.satuan_b}`
            : (node.satuan_b && node.satuan_b !== '-' ? node.satuan_b : (node.satuan_a || '-')))
        : '';
      const danaChanged =
        isLeaf &&
        node.sumber_dana_a &&
        node.sumber_dana_b &&
        normalizeDanaName(node.sumber_dana_a) !== normalizeDanaName(node.sumber_dana_b);
      const danaLeaf = isLeaf
        ? (danaChanged
            ? `${node.sumber_dana_a} → ${node.sumber_dana_b}`
            : (node.sumber_dana_b || node.sumber_dana_a || '-'))
        : '';

      rows.push(
        <tr
          key={path}
          className={`border-b border-slate-200/80 transition-colors ${LEVEL_STYLES[node.level] || 'bg-white'}`}
        >
          {/* Kolom Kode / Hierarki dengan garis penghubung */}
          <td className="py-2.5 px-3 align-top text-xs whitespace-nowrap">
            <div className="relative flex items-center gap-1.5" style={{ paddingLeft: `${indentPx}px` }}>
              {depth > 1 && (
                <span
                  aria-hidden="true"
                  className="absolute top-0 bottom-0 border-l-2 border-indigo-200/70"
                  style={{ left: `${Math.max(4, indentPx - 10)}px` }}
                />
              )}
              {hasChildren ? (
                <button
                  type="button"
                  onClick={() => {
                    if (node.level === 'skpd' && selectedSkpd === 'all') {
                      handleToggleSkpdSummaryRow({ kode_skpd: node.kode, nama_skpd: node.nama }, path);
                    } else {
                      setExpandedPaths((prev) => ({ ...prev, [path]: !prev[path] }));
                    }
                  }}
                  aria-label={isExpanded ? 'Ciutkan' : 'Bentangkan'}
                  className="w-6 h-6 rounded-md flex items-center justify-center transition cursor-pointer shrink-0 hover:bg-slate-200/80 text-slate-600"
                >
                  {isLoadingSkpd ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                  ) : isExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                </button>
              ) : (
                <span className="w-6 shrink-0" />
              )}

              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide shrink-0 ${badge.cls}`}>
                {badge.text}
              </span>

              {!isLeaf && node.kode && node.kode !== '#' && node.kode !== '-' && (
                <span className="font-mono text-[11px] text-slate-600">
                  {node.kode}
                </span>
              )}
            </div>
          </td>

          {/* Kolom Uraian / Spesifikasi */}
          <td className="py-2.5 px-3 align-top text-xs min-w-[290px] max-w-[440px] leading-relaxed">
            {node.level === 'paket' ? (
              <div>
                <div className="font-semibold text-slate-900">{cleanNama}</div>
                <div className="text-[11px] italic text-indigo-700 mt-0.5 flex items-center gap-1">
                  <Coins className="w-3 h-3 shrink-0" />
                  <span>Sumber Dana : {node.sumber_dana || 'Belum Ditentukan'}</span>
                </div>
              </div>
            ) : node.level === 'keterangan_group' ? (
              <div className="font-semibold text-slate-800">{cleanNama}</div>
            ) : isLeaf ? (
              <div>
                <div className="font-medium text-slate-900">{cleanNama}</div>
                <div className="text-[11px] text-slate-600 pl-3 mt-0.5 border-l-2 border-slate-200">
                  Spesifikasi : {node.spesifikasi || '-'}
                </div>
              </div>
            ) : (
              <div className="break-words">{cleanNama}</div>
            )}
          </td>

          {/* Koefisien */}
          <td className="py-2.5 px-2.5 align-top text-xs tabular-nums whitespace-nowrap">
            {isLeaf ? (
              <span className={node.koefisien_a !== node.koefisien_b && node.koefisien_a && node.koefisien_b ? 'text-amber-700 font-semibold' : 'text-slate-700'}>
                {koefDisplay}
              </span>
            ) : null}
          </td>

          {/* Satuan */}
          <td className="py-2.5 px-2.5 align-top text-xs whitespace-nowrap">
            {isLeaf ? (
              <span className={satuanChanged ? 'text-amber-700 font-semibold' : 'text-slate-700'}>
                {satuanDisplay}
              </span>
            ) : null}
          </td>

          {/* Sumber Dana */}
          <td className="py-2.5 px-2.5 align-top text-xs min-w-[140px] max-w-[200px]">
            {isLeaf ? (
              <span className={`text-[11px] ${danaChanged ? 'text-amber-700 font-semibold' : 'text-slate-600'}`}>
                {danaLeaf}
              </span>
            ) : null}
          </td>

          {/* Total Sebelum */}
          <td className="py-2.5 px-3 align-top text-xs text-right font-mono tabular-nums whitespace-nowrap text-slate-700">
            {formatRupiah(node.total_a)}
          </td>

          {/* Total Sesudah */}
          <td className="py-2.5 px-3 align-top text-xs text-right font-mono tabular-nums whitespace-nowrap text-slate-900 font-semibold">
            {formatRupiah(node.total_b)}
          </td>

          {/* Selisih (Rp & %) */}
          <td className={`py-2.5 px-3 align-top text-xs text-right font-mono tabular-nums whitespace-nowrap ${selisihColor}`}>
            <div className="font-semibold">{node.selisih > 0 ? `+${formatRupiah(node.selisih)}` : formatRupiah(node.selisih)}</div>
            {node.persen !== null && node.persen !== undefined && (
              <div className="text-[10px] text-slate-500">
                ({node.persen > 0 ? `+${node.persen}%` : `${node.persen}%`})
              </div>
            )}
          </td>

          {/* Status + Detail */}
          <td className="py-2.5 px-2.5 align-top text-center whitespace-nowrap">
            <div className="inline-flex items-center gap-1.5">
              <StatusBadge status={node.status} reasons={node.change_reasons} />
              <button
                type="button"
                onClick={() => setDetailModal({ node, breadcrumb: currentBreadcrumb, cleanNama })}
                title="Lihat Detail Perubahan"
                className="p-1 rounded-md text-slate-400 hover:text-indigo-700 hover:bg-indigo-50 transition cursor-pointer print:hidden"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
            </div>
          </td>
        </tr>
      );

      if (isExpanded && Array.isArray(node.children) && node.children.length > 0) {
        rows.push(...renderTreeRows(node.children, depth + 1, path, currentBreadcrumb));
      }
    });

    return rows;
  };

  const diffSign = summaryData?.selisih > 0.01 ? 'up' : summaryData?.selisih < -0.01 ? 'down' : 'flat';

  return (
    <div className="space-y-5">
      {/* Header Page */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 print:hidden">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700 uppercase tracking-wider">
            <GitCompareArrows className="w-4 h-4" />
            <span>Laporan &rsaquo; Kelengkapan Perubahan Perbup</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Perbandingan Data Perubahan Perbup (TA {tahunAnggaran})
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Komparasi dinamis dari level SKPD, Program, Kegiatan, Sub Kegiatan, Belanja, Paket, Keterangan, hingga Rincian Spesifikasi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSyncModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition cursor-pointer"
          >
            <History className="w-3.5 h-3.5 text-indigo-600" />
            <span>Riwayat Sinkronisasi</span>
            <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
              {syncHistory.length}
            </span>
          </button>

          <button
            type="button"
            onClick={fetchReportData}
            disabled={summaryLoading || treeLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${(summaryLoading || treeLoading) ? 'animate-spin' : ''}`} />
            <span>Muat Ulang</span>
          </button>

          <div ref={exportMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setExportMenuOpen((prev) => !prev)}
              aria-expanded={exportMenuOpen}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold text-white transition cursor-pointer shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${exportMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {exportMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-48 bg-white rounded-xl border border-slate-200 shadow-lg py-1.5 z-40">
                <button
                  type="button"
                  onClick={() => {
                    setExportMenuOpen(false);
                    handleExportPdf();
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-700 hover:bg-rose-50 hover:text-rose-700 flex items-center gap-2.5 cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-rose-600" />
                  <span>Export PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setExportMenuOpen(false);
                    handleExportExcel();
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 flex items-center gap-2.5 cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Export Excel (.xls)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setExportMenuOpen(false);
                    handleExportWord();
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-800 flex items-center gap-2.5 cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>Export Word (.doc)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setExportMenuOpen(false);
                    handleExportCsv();
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 flex items-center gap-2.5 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-slate-600" />
                  <span>Export CSV (.csv)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Print Header */}
      <div className="hidden print:block border-b-2 border-slate-900 pb-3 mb-4">
        <h1 className="text-base font-bold text-slate-900 uppercase">
          Laporan Kelengkapan Perubahan Perbup — TA {tahunAnggaran}
        </h1>
        <p className="text-xs text-slate-700 mt-1">
          Perbandingan: <strong>{sourceALabel}</strong> vs <strong>{sourceBLabel}</strong>
        </p>
      </div>

      {/* Panel Konfigurasi Pembanding & Filter Dinamis */}
      <section className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4 print:hidden">
        {/* Baris 1: Sumber Perbandingan A vs B */}
        <div className="grid grid-cols-1 lg:grid-cols-11 gap-3 items-end">
          <div className="lg:col-span-5">
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1.5">
              Data Sebelum (Dasar / Kolom A)
            </label>
            <select
              value={sourceA}
              onChange={(e) => setSourceA(e.target.value)}
              disabled={optionsLoading}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {sources.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-1 flex justify-center">
            <button
              type="button"
              onClick={handleSwapSources}
              title="Tukar Data Sebelum & Sesudah"
              className="w-10 h-9 rounded-xl border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 text-slate-600 hover:text-indigo-700 flex items-center justify-center transition cursor-pointer"
            >
              <ArrowLeftRight className="w-4 h-4" />
            </button>
          </div>

          <div className="lg:col-span-5">
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1.5">
              Data Sesudah (Perubahan / Kolom B)
            </label>
            <select
              value={sourceB}
              onChange={(e) => setSourceB(e.target.value)}
              disabled={optionsLoading}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {sources.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Baris 2: Filter SKPD, Sumber Dana, Status, Pencarian */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          <div>
            <label className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 mb-1">
              <Building2 className="w-3.5 h-3.5" />
              <span>Filter SKPD</span>
            </label>
            <SearchableSelect
              value={selectedSkpd}
              onChange={setSelectedSkpd}
              allLabel="Semua SKPD (Klik baris untuk detail)"
              placeholder="Ketik kode atau nama SKPD..."
              options={skpds.map((skpd) => ({
                key: skpd.kode_skpd + skpd.nama_skpd,
                value: skpd.kode_skpd,
                label: `${skpd.kode_skpd} — ${skpd.nama_skpd}`,
              }))}
            />
          </div>

          <div>
            <label className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 mb-1">
              <Coins className="w-3.5 h-3.5" />
              <span>Filter Sumber Dana</span>
            </label>
            <SearchableSelect
              value={selectedDana}
              onChange={setSelectedDana}
              allLabel="Semua Sumber Dana"
              placeholder="Ketik nama sumber dana..."
              options={sumberDanas.map((dana) => ({
                key: dana,
                value: dana,
                label: dana,
              }))}
            />
          </div>

          <div>
            <label className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 mb-1">
              <Filter className="w-3.5 h-3.5" />
              <span>Status Perubahan</span>
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {STATUS_FILTERS.map((st) => (
                <option key={st.id} value={st.id}>{st.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 mb-1">
              <Search className="w-3.5 h-3.5" />
              <span>Cari Kode / Uraian / Spesifikasi</span>
            </label>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Contoh: Kertas HVS, 70 Gsm, 5.1.02..."
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Baris 2b: Indikator Filter Aktif + Jumlah Data Ditemukan + Reset Filter */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-600">
              Ditemukan <strong className="text-slate-900">{displayedTree.length} SKPD</strong>
              {' '}({visibleRowCount.toLocaleString('id-ID')} baris tampil)
            </span>
            {activeFilterChips.length > 0 && (
              <>
                <span className="text-slate-300 mx-1">|</span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                  {activeFilterChips.length} Filter Aktif
                </span>
                {activeFilterChips.map((chip) => (
                  <button
                    type="button"
                    key={chip.key}
                    onClick={chip.clear}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 text-[11px] font-medium transition cursor-pointer"
                  >
                    <span>{chip.label}</span>
                    <X className="w-3 h-3" />
                  </button>
                ))}
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hideZeroRows}
                onChange={(e) => setHideZeroRows(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <span>Sembunyikan Pagu 0 / 0</span>
            </label>
            {activeFilterChips.length > 0 && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-semibold transition cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Filter</span>
              </button>
            )}
          </div>
        </div>

        {/* Baris 3: Kontrol Kedalaman Hierarki + Expand/Tutup Semua */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 mr-1">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <span>Level Aktif ({activeLevelObj.label}):</span>
            </span>
            {LEVELS.map((lvl) => (
              <button
                type="button"
                key={lvl.id}
                onClick={() => handleSetDepth(lvl.depth)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                  activeDepth === lvl.depth
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {lvl.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleExpandAllGlobal}
              disabled={treeLoading}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-800 text-[11px] font-semibold transition cursor-pointer disabled:opacity-50"
            >
              {treeLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Maximize2 className="w-3 h-3" />}
              <span>Expand Semua</span>
            </button>
            <button
              type="button"
              onClick={handleCollapseAll}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition cursor-pointer"
            >
              <Minimize2 className="w-3 h-3" />
              <span>Tutup Semua</span>
            </button>
          </div>
        </div>
      </section>

      {/* Kartu Ringkasan dengan Indikator Persentase & Warna */}
      {summaryData && (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Total Sebelum</span>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold">Kolom A</span>
            </div>
            <div className="text-lg font-bold text-slate-900 font-mono tabular-nums mt-1.5">
              {formatRupiah(summaryData.total_a)}
            </div>
            <div className="text-[11px] text-slate-500 truncate mt-1" title={sourceALabel}>{sourceALabel}</div>
          </div>

          <div className="bg-white rounded-2xl border border-indigo-200/80 p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-indigo-700 uppercase">Total Sesudah</span>
              <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                diffSign === 'up'
                  ? 'bg-emerald-50 text-emerald-700'
                  : diffSign === 'down'
                  ? 'bg-rose-50 text-rose-700'
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {diffSign === 'up' && <TrendingUp className="w-3 h-3" />}
                {diffSign === 'down' && <TrendingDown className="w-3 h-3" />}
                {diffSign === 'flat' && <Minus className="w-3 h-3" />}
                <span>{summaryData.persen > 0 ? `+${summaryData.persen}%` : `${summaryData.persen ?? 0}%`}</span>
              </span>
            </div>
            <div className="text-lg font-bold text-indigo-700 font-mono tabular-nums mt-1.5">
              {formatRupiah(summaryData.total_b)}
            </div>
            <div className="text-[11px] text-slate-500 truncate mt-1" title={sourceBLabel}>{sourceBLabel}</div>
          </div>

          <div className={`bg-white rounded-2xl border p-4 ${
            diffSign === 'up'
              ? 'border-emerald-200'
              : diffSign === 'down'
              ? 'border-rose-200'
              : 'border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Selisih Perubahan</span>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                diffSign === 'up'
                  ? 'bg-emerald-100 text-emerald-800'
                  : diffSign === 'down'
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {diffSign === 'up' ? 'Naik' : diffSign === 'down' ? 'Turun' : 'Tetap'}
              </span>
            </div>
            <div className={`text-lg font-bold font-mono tabular-nums mt-1.5 ${
              diffSign === 'up' ? 'text-emerald-700' : diffSign === 'down' ? 'text-rose-700' : 'text-slate-700'
            }`}>
              {summaryData.selisih > 0 ? `+${formatRupiah(summaryData.selisih)}` : formatRupiah(summaryData.selisih)}
            </div>
            <div className="text-[11px] text-slate-600 mt-1">
              Persentase: <strong>{summaryData.persen > 0 ? `+${summaryData.persen}%` : `${summaryData.persen ?? 0}%`}</strong>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Cakupan &amp; Anomali</span>
              {anomalies.length > 0 ? (
                <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold">
                  {anomalies.length} Anomali
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                  Sinkron
                </span>
              )}
            </div>
            <div className="text-lg font-bold text-slate-900 tabular-nums mt-1.5">
              {displayedTree.length.toLocaleString('id-ID')} SKPD
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {anomalies.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setAnomalyModalOpen(true)}
                  className="text-amber-700 font-semibold hover:underline cursor-pointer"
                >
                  Periksa {anomalies.length} ketidaksesuaian pagu &rarr;
                </button>
              ) : (
                <span>Pagu induk sesuai akumulasi RKA</span>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Banner Deteksi Anomali */}
      {anomalies.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 print:hidden">
          <div className="flex items-center gap-2.5 text-xs text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Deteksi Anomali:</strong> Ditemukan <strong>{anomalies.length}</strong> Sub Kegiatan yang nilai pagu induknya tidak sama dengan akumulasi rincian belanja RKA pada data Sesudah.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setAnomalyModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition cursor-pointer shrink-0"
          >
            Lihat Daftar Anomali
          </button>
        </div>
      )}

      {/* Error State */}
      {errorMsg && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 flex items-center gap-3 text-rose-800 text-xs">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tabel Hierarki Perbandingan */}
      <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                <th className="py-3 px-3 whitespace-nowrap">Level / Kode</th>
                <th className="py-3 px-3 min-w-[290px]">Uraian / Paket / Keterangan / Rincian Spesifikasi</th>
                <th className="py-3 px-2.5 whitespace-nowrap">Koefisien</th>
                <th className="py-3 px-2.5 whitespace-nowrap">Satuan</th>
                <th className="py-3 px-2.5 whitespace-nowrap">Sumber Dana</th>
                <th className="py-3 px-3 text-right whitespace-nowrap">Sebelum</th>
                <th className="py-3 px-3 text-right whitespace-nowrap">Sesudah</th>
                <th className="py-3 px-3 text-right whitespace-nowrap">Selisih</th>
                <th className="py-3 px-2.5 text-center whitespace-nowrap">Status &amp; Aksi</th>
              </tr>
            </thead>
            <tbody>
              {(summaryLoading || treeLoading) && displayedTree.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-xs text-slate-500">
                    <div className="inline-flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                      <span>Menyusun data perbandingan Perubahan Perbup...</span>
                    </div>
                  </td>
                </tr>
              ) : displayedTree.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-xs text-slate-500">
                    Tidak ada data yang cocok dengan filter yang dipilih.
                  </td>
                </tr>
              ) : (
                (() => {
                  const allRendered = renderTreeRows(displayedTree) || [];
                  const sliced = allRendered.slice(0, displayLimit);
                  return (
                    <>
                      {sliced}
                      {allRendered.length > displayLimit && (
                        <tr className="bg-slate-50 border-t border-slate-200 print:hidden">
                          <td colSpan={9} className="py-3 px-4 text-center">
                            <div className="inline-flex flex-wrap items-center gap-2 text-xs">
                              <span className="text-slate-600">
                                Menampilkan <strong>{sliced.length.toLocaleString('id-ID')}</strong> dari{' '}
                                <strong>{allRendered.length.toLocaleString('id-ID')}</strong> baris agar tetap ringan.
                              </span>
                              <button
                                type="button"
                                onClick={() => setDisplayLimit((prev) => prev + 500)}
                                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition cursor-pointer"
                              >
                                Muat +500 Baris Lagi
                              </button>
                              <button
                                type="button"
                                onClick={() => setDisplayLimit(allRendered.length)}
                                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-semibold transition cursor-pointer"
                              >
                                Tampilkan Semua ({allRendered.length.toLocaleString('id-ID')})
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })()
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal Detail Perubahan Baris */}
      {detailModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 print:hidden">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Detail Perubahan Anggaran</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Level: <strong>{LEVEL_BADGES[detailModal.node.level]?.text || detailModal.node.level}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetailModal(null)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              {/* Breadcrumb Hierarki */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 space-y-1">
                <div className="text-[10px] font-bold text-slate-500 uppercase">Jalur Hierarki</div>
                {detailModal.breadcrumb.map((b, i) => (
                  <div key={i} className="flex items-start gap-2" style={{ paddingLeft: `${i * 8}px` }}>
                    <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 text-[9px] font-bold shrink-0">
                      {b.level}
                    </span>
                    <span className="text-slate-700">
                      {b.kode && b.kode !== '#' && b.kode !== '-' ? <span className="font-mono text-slate-500 mr-1">{b.kode}</span> : null}
                      {b.nama}
                    </span>
                  </div>
                ))}
              </div>

              {/* Ringkasan Nilai */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-slate-200 p-3">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Sebelum</div>
                  <div className="text-sm font-bold font-mono text-slate-800 mt-1">
                    {formatRupiah(detailModal.node.total_a)}
                  </div>
                </div>
                <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-3">
                  <div className="text-[10px] font-bold text-indigo-700 uppercase">Sesudah</div>
                  <div className="text-sm font-bold font-mono text-indigo-700 mt-1">
                    {formatRupiah(detailModal.node.total_b)}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 p-3">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Selisih</div>
                  <div className={`text-sm font-bold font-mono mt-1 ${
                    detailModal.node.selisih > 0 ? 'text-emerald-700' : detailModal.node.selisih < 0 ? 'text-rose-700' : 'text-slate-700'
                  }`}>
                    {detailModal.node.selisih > 0 ? `+${formatRupiah(detailModal.node.selisih)}` : formatRupiah(detailModal.node.selisih)}
                  </div>
                </div>
              </div>

              {/* Atribut Spesifikasi & Sumber Dana */}
              <div className="rounded-xl border border-slate-200 divide-y divide-slate-100">
                <div className="px-3 py-2 flex justify-between gap-4">
                  <span className="text-slate-500 font-medium">Status Perubahan</span>
                  <StatusBadge status={detailModal.node.status} reasons={detailModal.node.change_reasons} />
                </div>
                {Array.isArray(detailModal.node.change_reasons) && detailModal.node.change_reasons.length > 0 && (
                  <div className="px-3 py-2 flex justify-between gap-4 bg-amber-50/70">
                    <span className="text-amber-800 font-medium">Alasan Berubah</span>
                    <span className="text-amber-900 text-right font-semibold">
                      {detailModal.node.change_reasons.join('; ')}
                    </span>
                  </div>
                )}
                {detailModal.node.spesifikasi !== undefined && (
                  <div className="px-3 py-2 flex justify-between gap-4">
                    <span className="text-slate-500 font-medium">Spesifikasi</span>
                    <span className="text-slate-900 text-right">{detailModal.node.spesifikasi || '-'}</span>
                  </div>
                )}
                {detailModal.node.level === 'keterangan' && (
                  <>
                    <div className="px-3 py-2 flex justify-between gap-4">
                      <span className="text-slate-500 font-medium">Koefisien (Sebelum &rarr; Sesudah)</span>
                      <span className="text-slate-900 font-mono">
                        {detailModal.node.koefisien_a || '-'} &rarr; {detailModal.node.koefisien_b || '-'}
                      </span>
                    </div>
                    <div className="px-3 py-2 flex justify-between gap-4">
                      <span className="text-slate-500 font-medium">Satuan (Sebelum &rarr; Sesudah)</span>
                      <span className="text-slate-900">
                        {detailModal.node.satuan_a || '-'} &rarr; {detailModal.node.satuan_b || '-'}
                      </span>
                    </div>
                    <div className="px-3 py-2 flex justify-between gap-4">
                      <span className="text-slate-500 font-medium">Harga Satuan (Sebelum &rarr; Sesudah)</span>
                      <span className="text-slate-900 font-mono">
                        {formatRupiah(detailModal.node.harga_satuan_a)} &rarr; {formatRupiah(detailModal.node.harga_satuan_b)}
                      </span>
                    </div>
                    <div className="px-3 py-2 flex justify-between gap-4">
                      <span className="text-slate-500 font-medium">Sumber Dana (Sebelum &rarr; Sesudah)</span>
                      <span className="text-slate-900 text-right">
                        {detailModal.node.sumber_dana_a || '-'} &rarr; {detailModal.node.sumber_dana_b || '-'}
                      </span>
                    </div>
                  </>
                )}
                {detailModal.node.sumber_dana && (
                  <div className="px-3 py-2 flex justify-between gap-4">
                    <span className="text-slate-500 font-medium">Sumber Dana Paket</span>
                    <span className="text-slate-900 text-right">{detailModal.node.sumber_dana}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Riwayat Sinkronisasi */}
      {syncModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 print:hidden">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-3xl w-full shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Riwayat Sinkronisasi &amp; Aktivitas Data</h3>
              </div>
              <button
                type="button"
                onClick={() => setSyncModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto">
              {syncHistory.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  Belum ada catatan riwayat sinkronisasi untuk tahun anggaran {tahunAnggaran}.
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                      <th className="py-2.5 px-3">Waktu</th>
                      <th className="py-2.5 px-3">Pengguna / Sumber</th>
                      <th className="py-2.5 px-3">Aktivitas</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Hasil</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {syncHistory.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 whitespace-nowrap text-slate-600">{formatDateTime(item.waktu)}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-800">{item.pengguna}</td>
                        <td className="py-2.5 px-3 text-slate-800">{item.aktivitas}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                            item.status === 'success'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.status === 'error'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-indigo-100 text-indigo-800'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">{item.hasil}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Deteksi Anomali */}
      {anomalyModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 print:hidden">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-4xl w-full shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-amber-50">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-amber-950">
                  Deteksi Anomali Pagu Induk vs Akumulasi Rincian ({anomalies.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAnomalyModalOpen(false)}
                className="p-1.5 rounded-lg text-amber-700 hover:bg-amber-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto">
              {anomalies.length === 0 ? (
                <div className="p-8 text-center text-xs text-emerald-700 flex flex-col items-center gap-2">
                  <CheckCircle2 className="w-6 h-6" />
                  <span>Tidak ada anomali. Seluruh pagu sub kegiatan sesuai dengan akumulasi rincian RKA.</span>
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                      <th className="py-2.5 px-3">SKPD</th>
                      <th className="py-2.5 px-3">Sub Kegiatan</th>
                      <th className="py-2.5 px-3 text-right">Pagu Induk</th>
                      <th className="py-2.5 px-3 text-right">Akumulasi RKA</th>
                      <th className="py-2.5 px-3 text-right">Selisih</th>
                      <th className="py-2.5 px-3">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {anomalies.map((a, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-medium text-slate-800">{a.nama_skpd}</td>
                        <td className="py-2.5 px-3 text-slate-700">
                          <span className="font-mono text-[11px] text-slate-500 mr-1">{a.kode_sub_giat}</span>
                          {a.nama_sub_giat}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums">{formatRupiah(a.pagu_induk)}</td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums">{formatRupiah(a.akumulasi_rka)}</td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-rose-700">
                          {formatRupiah(a.selisih)}
                        </td>
                        <td className="py-2.5 px-3 text-[11px] text-amber-800 font-semibold">{a.jenis}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
