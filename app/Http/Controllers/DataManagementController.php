<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\SubKegiatanBl;
use App\Models\Rka;
use App\Models\SubKegiatanIndikator;
use App\Models\CapaianProgram;
use App\Models\MasterAkun;
use App\Models\MasterSumberDana;
use App\Models\Pendapatan;
use App\Models\PendapatanSkpd;
use App\Models\Pembiayaan;
use App\Models\PembiayaanSkpd;
use App\Models\DataUnit;
use App\Services\SqlImportService;
use App\Services\SqlExportService;

class DataManagementController extends Controller
{
    /**
     * Ambil daftar tahun anggaran yang tersedia di database
     */
    public function getAvailableYears()
    {
        $years = collect();

        foreach ([
            'data_sub_keg_bl',
            'data_pendapatan',
            'data_pembiayaan',
            'data_akun',
            'posting_sessions',
        ] as $table) {
            try {
                $tableYears = DB::table($table)
                    ->whereNotNull('tahun_anggaran')
                    ->distinct()
                    ->pluck('tahun_anggaran');
                $years = $years->merge($tableYears);
            } catch (\Throwable $e) {
                // Abaikan jika tabel belum ada
            }
        }

        $dataYears = $years->map(fn ($y) => (int) $y)
            ->filter(fn ($y) => $y >= 2020 && $y <= 2100)
            ->unique()
            ->sortDesc()
            ->values();

        $defaultYear = $dataYears->first() ?? 2026;

        $allYears = $dataYears
            ->merge([2025, 2026, 2027])
            ->unique()
            ->sortDesc()
            ->values()
            ->all();

        return response()->json([
            'status' => 'success',
            'data' => $allYears,
            'default_year' => $defaultYear,
        ]);
    }

    /**
     * Ambil data statistik ringkasan
     */
    public function getStats(Request $request)
    {
        $tahun = $request->input('tahun_anggaran');
        $filterTahun = ($tahun && $tahun !== 'all') ? (int) $tahun : null;

        $applyTahun = fn ($query) => $filterTahun ? $query->where('tahun_anggaran', $filterTahun) : $query;

        $totalSubKeg = $applyTahun(SubKegiatanBl::where('active', 1))->count();
        $totalPagu = (float) $applyTahun(SubKegiatanBl::where('active', 1))->sum('pagu');
        $totalRka = $applyTahun(Rka::where('active', 1))->count();
        $totalRkaNilai = (float) $applyTahun(Rka::where('active', 1))->sum('total_harga');
        $totalAkun = $applyTahun(MasterAkun::where('active', 1))->count();
        $totalSumberDana = $applyTahun(MasterSumberDana::where('active', 1))->count();
        $totalPendapatanItem = $applyTahun(Pendapatan::where('active', 1))->count();
        $totalPendapatanNilai = (float) $applyTahun(Pendapatan::where('active', 1))->sum('total');

        $totalPembiayaanPenerimaan = (float) $applyTahun(Pembiayaan::where('tipe', 'penerimaan')->where('active', 1))->sum('total');
        $totalPembiayaanPengeluaran = (float) $applyTahun(Pembiayaan::where('tipe', 'pengeluaran')->where('active', 1))->sum('total');

        $skpdCount = $applyTahun(SubKegiatanBl::where('active', 1))
            ->distinct('id_skpd')
            ->count('id_skpd');

        $subUnitCount = $applyTahun(SubKegiatanBl::where('active', 1))
            ->distinct('kode_sub_skpd')
            ->count('kode_sub_skpd');

        return response()->json([
            'status' => 'success',
            'data' => [
                'total_sub_kegiatan' => $totalSubKeg,
                'total_pagu' => $totalPagu,
                'total_rka_item' => $totalRka,
                'total_rka_nilai' => $totalRkaNilai,
                'total_skpd' => $skpdCount,
                'total_sub_unit' => $subUnitCount,
                'total_master_akun' => $totalAkun,
                'total_sumber_dana' => $totalSumberDana,
                'total_pendapatan_item' => $totalPendapatanItem,
                'total_pendapatan_nilai' => $totalPendapatanNilai,
                'total_pembiayaan_penerimaan' => $totalPembiayaanPenerimaan,
                'total_pembiayaan_pengeluaran' => $totalPembiayaanPengeluaran,
            ]
        ]);
    }

    /**
     * Ambil daftar SKPD unik dan sub unitnya (Puskesmas, RSUD, dll) terintegrasi Belanja, Pendapatan, dan Pembiayaan
     */
    public function getSkpdList(Request $request)
    {
        $tahun = $request->input('tahun_anggaran');
        $filterTahun = ($tahun && $tahun !== 'all') ? (int) $tahun : null;
        $applyTahun = fn ($query) => $filterTahun ? $query->where('tahun_anggaran', $filterTahun) : $query;

        $skpds = [];

        // 1. Dari SubKegiatanBl
        $listBl = $applyTahun(SubKegiatanBl::where('active', 1))
            ->select('nama_skpd', 'id_skpd', 'kode_skpd', DB::raw('count(*) as total_sub_keg'), DB::raw('sum(pagu) as total_pagu'))
            ->groupBy('nama_skpd', 'id_skpd', 'kode_skpd')
            ->get();

        foreach ($listBl as $item) {
            $name = trim($item->nama_skpd);
            if (!$name) continue;
            $skpds[$name] = [
                'nama_skpd' => $name,
                'id_skpd' => $item->id_skpd,
                'kode_skpd' => $item->kode_skpd,
                'total_sub_keg' => (int)$item->total_sub_keg,
                'total_pagu' => (float)$item->total_pagu,
                'total_pendapatan_rek' => 0,
                'total_pembiayaan_rek' => 0,
            ];
        }

        // 2. Dari PendapatanSkpd
        $listPend = $applyTahun(PendapatanSkpd::where('active', 1))
            ->select('nama_skpd', 'id_skpd', 'kode_skpd', 'jumlah_rekening')
            ->get();
        foreach ($listPend as $item) {
            $name = trim($item->nama_skpd);
            if (!$name) continue;
            if (!isset($skpds[$name])) {
                $skpds[$name] = [
                    'nama_skpd' => $name,
                    'id_skpd' => $item->id_skpd,
                    'kode_skpd' => $item->kode_skpd,
                    'total_sub_keg' => 0,
                    'total_pagu' => 0,
                    'total_pendapatan_rek' => (int)$item->jumlah_rekening,
                    'total_pembiayaan_rek' => 0,
                ];
            } else {
                $skpds[$name]['total_pendapatan_rek'] = (int)$item->jumlah_rekening;
            }
        }

        // 3. Dari PembiayaanSkpd
        $listPemb = $applyTahun(PembiayaanSkpd::where('active', 1))
            ->select('nama_skpd', 'id_skpd', 'kode_skpd', 'jumlah_rekening')
            ->get();
        foreach ($listPemb as $item) {
            $name = trim($item->nama_skpd);
            if (!$name) continue;
            if (!isset($skpds[$name])) {
                $skpds[$name] = [
                    'nama_skpd' => $name,
                    'id_skpd' => $item->id_skpd,
                    'kode_skpd' => $item->kode_skpd,
                    'total_sub_keg' => 0,
                    'total_pagu' => 0,
                    'total_pendapatan_rek' => 0,
                    'total_pembiayaan_rek' => (int)$item->jumlah_rekening,
                ];
            } else {
                $skpds[$name]['total_pembiayaan_rek'] += (int)$item->jumlah_rekening;
            }
        }

        $list = array_values($skpds);
        usort($list, fn($a, $b) => strcmp($a['nama_skpd'], $b['nama_skpd']));

        $subList = $applyTahun(SubKegiatanBl::where('active', 1))
            ->select('nama_skpd', 'nama_sub_skpd', 'kode_sub_skpd', 'id_sub_skpd', DB::raw('count(*) as total_sub_keg'), DB::raw('sum(pagu) as total_pagu'))
            ->groupBy('nama_skpd', 'nama_sub_skpd', 'kode_sub_skpd', 'id_sub_skpd')
            ->orderBy('nama_sub_skpd')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $list,
            'sub_units' => $subList,
        ]);
    }

    /**
     * Ambil struktur hirarki SKPD (Parent dan Unit/Sub-Unit seperti tampilan resmi SIPD)
     */
    public function getSkpdHierarchy(Request $request)
    {
        $tahun = $request->input('tahun_anggaran');
        $query = SubKegiatanBl::where('active', 1);
        if ($tahun && $tahun !== 'all') {
            $query->where('tahun_anggaran', (int) $tahun);
        }

        $rows = $query
            ->select(
                'kode_skpd',
                'nama_skpd',
                'id_skpd',
                'kode_sub_skpd',
                'nama_sub_skpd',
                'id_sub_skpd',
                DB::raw('count(*) as count_sub'),
                DB::raw('sum(pagu) as total_pagu')
            )
            ->groupBy('kode_skpd', 'nama_skpd', 'id_skpd', 'kode_sub_skpd', 'nama_sub_skpd', 'id_sub_skpd')
            ->orderBy('kode_skpd')
            ->orderBy('kode_sub_skpd')
            ->get();

        $hierarchy = [];
        foreach ($rows as $r) {
            $parentCode = $r->kode_skpd ?: 'TANPA-KODE';
            if (!isset($hierarchy[$parentCode])) {
                $hierarchy[$parentCode] = [
                    'kode_skpd' => $r->kode_skpd,
                    'nama_skpd' => $r->nama_skpd,
                    'id_skpd' => $r->id_skpd,
                    'total_sub_keg' => 0,
                    'total_pagu' => 0,
                    'sub_units' => [],
                ];
            }

            $hierarchy[$parentCode]['total_sub_keg'] += (int) $r->count_sub;
            $hierarchy[$parentCode]['total_pagu'] += (float) $r->total_pagu;

            $lower = strtolower($r->nama_sub_skpd);
            $type = 'dinas';
            if (str_contains($lower, 'rsud') || str_contains($lower, 'rumah sakit')) {
                $type = 'rsud';
            } elseif (str_contains($lower, 'puskesmas') || str_contains($lower, 'uptd')) {
                $type = 'puskesmas';
            }

            $hierarchy[$parentCode]['sub_units'][] = [
                'kode_sub_skpd' => $r->kode_sub_skpd,
                'nama_sub_skpd' => $r->nama_sub_skpd,
                'id_sub_skpd' => $r->id_sub_skpd,
                'count_sub' => (int) $r->count_sub,
                'total_pagu' => (float) $r->total_pagu,
                'unit_type' => $type,
            ];
        }

        $result = array_values(array_map(function($skpd) {
            $skpd['has_children'] = count($skpd['sub_units']) > 1 
                || (count($skpd['sub_units']) === 1 && $skpd['sub_units'][0]['kode_sub_skpd'] !== $skpd['kode_skpd']);
            return $skpd;
        }, $hierarchy));

        return response()->json([
            'status' => 'success',
            'data' => $result,
        ]);
    }

    /**
     * Ambil daftar Sub Kegiatan dengan filter dan pagination
     */
    public function getSubKegiatan(Request $request)
    {
        $search = $request->input('search');
        $skpd = $request->input('skpd');
        $subSkpd = $request->input('sub_skpd');
        $unitType = $request->input('unit_type'); // 'all', 'dinas', 'rsud', 'puskesmas'
        $tahun = $request->input('tahun_anggaran');
        $perPage = (int) $request->input('per_page', 15);

        $query = SubKegiatanBl::where('active', 1)
            ->withCount(['rka', 'indikatorKeluaran as indikator_count', 'capaian']);

        if ($tahun && $tahun !== 'all') {
            $query->where('tahun_anggaran', (int) $tahun);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('nama_sub_giat', 'like', "%{$search}%")
                  ->orWhere('kode_sub_giat', 'like', "%{$search}%")
                  ->orWhere('nama_skpd', 'like', "%{$search}%")
                  ->orWhere('nama_sub_skpd', 'like', "%{$search}%")
                  ->orWhere('kode_sub_skpd', 'like', "%{$search}%")
                  ->orWhere('kode_sbl', 'like', "%{$search}%");
            });
        }

        if ($skpd && $skpd !== 'all') {
            $query->where('nama_skpd', $skpd);
        }

        if ($subSkpd && $subSkpd !== 'all') {
            $query->where(function($q) use ($subSkpd) {
                $q->where('nama_sub_skpd', $subSkpd)
                  ->orWhere('kode_sub_skpd', $subSkpd);
            });
        }

        if ($unitType && $unitType !== 'all') {
            if ($unitType === 'rsud') {
                $query->where('nama_sub_skpd', 'like', '%RSUD%');
            } elseif ($unitType === 'puskesmas') {
                $query->where('nama_sub_skpd', 'like', '%PUSKESMAS%');
            } elseif ($unitType === 'dinas') {
                $query->where(function($q) {
                    $q->where('nama_sub_skpd', 'not like', '%RSUD%')
                      ->where('nama_sub_skpd', 'not like', '%PUSKESMAS%');
                });
            }
        }

        $data = $query->orderBy('nama_skpd')
            ->orderBy('nama_sub_skpd')
            ->orderBy('kode_sub_giat')
            ->paginate($perPage);

        return response()->json([
            'status' => 'success',
            'data' => $data
        ]);
    }

    /**
     * Ambil detail satu sub kegiatan beserta RKA, Indikator, dan Capaian
     */
    public function getDetail($id)
    {
        $sub = SubKegiatanBl::with(['rka', 'indikatorKeluaran', 'capaian'])->findOrFail($id);

        return response()->json([
            'status' => 'success',
            'data' => $sub
        ]);
    }

    /**
     * Ambil data lengkap untuk cetak RKA Rincian Belanja & RKA Paket
     */
    public function getRkaPrintData($id)
    {
        $sub = SubKegiatanBl::with(['indikatorKeluaran', 'capaian'])->findOrFail($id);

        $rkaItems = Rka::where('kode_sbl', $sub->kode_sbl)
            ->where('tahun_anggaran', $sub->tahun_anggaran)
            ->where('active', 1)
            ->orderBy('kode_akun')
            ->orderBy('id')
            ->get();

        $kepalaSkpd = DataUnit::findKepalaSkpd(
            $sub->id_skpd ? (int) $sub->id_skpd : null,
            $sub->kode_skpd ?: null,
            $sub->tahun_anggaran ? (int) $sub->tahun_anggaran : null
        );

        return response()->json([
            'status' => 'success',
            'data' => [
                'sub_kegiatan' => $sub,
                'rka_items' => $rkaItems,
                'kepala_skpd' => $kepalaSkpd,
            ]
        ]);
    }

    /**
     * Kosongkan SEMUA data (Truncate seluruh tabel transaksi & master)
     */
    public function resetAll(Request $request)
    {
        $tahun = $request->input('tahun_anggaran');
        $filterTahun = ($tahun && $tahun !== 'all') ? (int) $tahun : null;

        try {
            DB::statement('SET FOREIGN_KEY_CHECKS=0;');
            $models = [
                SubKegiatanBl::class,
                Rka::class,
                SubKegiatanIndikator::class,
                CapaianProgram::class,
                Pendapatan::class,
                PendapatanSkpd::class,
                Pembiayaan::class,
                PembiayaanSkpd::class,
                MasterAkun::class,
                MasterSumberDana::class,
            ];
            foreach ($models as $modelClass) {
                if ($filterTahun) {
                    $modelClass::where('tahun_anggaran', $filterTahun)->delete();
                } else {
                    $modelClass::truncate();
                }
            }
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');

            $msg = $filterTahun
                ? "Seluruh database Tahun Anggaran {$filterTahun} berhasil dikosongkan!"
                : 'Seluruh database berhasil dikosongkan total (Belanja & RKA, Pendapatan, Pembiayaan, dan Data Master kembali bersih ke nol)!';

            return response()->json([
                'status' => 'success',
                'message' => $msg
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mengosongkan seluruh database: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Kosongkan data per modul spesifik (belanja | pendapatan | pembiayaan | master)
     */
    public function resetModule(Request $request)
    {
        $request->validate([
            'module' => 'required|string|in:belanja,pendapatan,pembiayaan,master',
            'tahun_anggaran' => 'nullable',
        ]);

        $module = $request->input('module');
        $tahun = $request->input('tahun_anggaran');
        $filterTahun = ($tahun && $tahun !== 'all') ? (int) $tahun : null;

        try {
            DB::statement('SET FOREIGN_KEY_CHECKS=0;');
            $label = '';
            $moduleModels = [
                'belanja' => [
                    'models' => [SubKegiatanBl::class, Rka::class, SubKegiatanIndikator::class, CapaianProgram::class],
                    'label' => 'Belanja & RKA (Sub Kegiatan, RKA, Indikator, Capaian)',
                ],
                'pendapatan' => [
                    'models' => [Pendapatan::class, PendapatanSkpd::class],
                    'label' => 'Pendapatan Daerah (Target SKPD & Rincian Rekening)',
                ],
                'pembiayaan' => [
                    'models' => [Pembiayaan::class, PembiayaanSkpd::class],
                    'label' => 'Pembiayaan Daerah (Penerimaan & Pengeluaran)',
                ],
                'master' => [
                    'models' => [MasterAkun::class, MasterSumberDana::class],
                    'label' => 'Data Master (Master Akun & Sumber Dana)',
                ],
            ];

            $label = $moduleModels[$module]['label'];
            foreach ($moduleModels[$module]['models'] as $modelClass) {
                if ($filterTahun) {
                    $modelClass::where('tahun_anggaran', $filterTahun)->delete();
                } else {
                    $modelClass::truncate();
                }
            }

            DB::statement('SET FOREIGN_KEY_CHECKS=1;');

            $tahunLabel = $filterTahun ? " Tahun Anggaran {$filterTahun}" : '';
            return response()->json([
                'status' => 'success',
                'message' => "Seluruh data modul {$label}{$tahunLabel} berhasil dikosongkan!"
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mengosongkan modul: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Kosongkan data per SKPD tertentu (menyeluruh untuk Belanja, Pendapatan, dan Pembiayaan)
     */
    public function resetSkpd(Request $request)
    {
        $request->validate([
            'nama_skpd' => 'required|string',
            'scope' => 'nullable|string|in:all,belanja,pendapatan,pembiayaan',
            'tahun_anggaran' => 'nullable',
        ]);

        $namaSkpd = trim($request->input('nama_skpd'));
        $scope = $request->input('scope', 'all');
        $tahun = $request->input('tahun_anggaran');
        $filterTahun = ($tahun && $tahun !== 'all') ? (int) $tahun : null;

        try {
            // Kumpulkan id_skpd dan kode_skpd yang terkait dengan nama_skpd
            $idSkpdList = [];
            $kodeSkpdList = [];

            $blQuery = SubKegiatanBl::where('nama_skpd', $namaSkpd);
            if ($filterTahun) $blQuery->where('tahun_anggaran', $filterTahun);
            $blMatch = $blQuery->get(['id_skpd', 'kode_skpd']);
            foreach ($blMatch as $b) {
                if ($b->id_skpd) $idSkpdList[] = $b->id_skpd;
                if ($b->kode_skpd) $kodeSkpdList[] = $b->kode_skpd;
            }

            $pendQuery = PendapatanSkpd::where('nama_skpd', $namaSkpd);
            if ($filterTahun) $pendQuery->where('tahun_anggaran', $filterTahun);
            $pendMatch = $pendQuery->get(['id_skpd', 'kode_skpd']);
            foreach ($pendMatch as $p) {
                if ($p->id_skpd) $idSkpdList[] = $p->id_skpd;
                if ($p->kode_skpd) $kodeSkpdList[] = $p->kode_skpd;
            }

            $pembQuery = PembiayaanSkpd::where('nama_skpd', $namaSkpd);
            if ($filterTahun) $pembQuery->where('tahun_anggaran', $filterTahun);
            $pembMatch = $pembQuery->get(['id_skpd', 'kode_skpd']);
            foreach ($pembMatch as $pb) {
                if ($pb->id_skpd) $idSkpdList[] = $pb->id_skpd;
                if ($pb->kode_skpd) $kodeSkpdList[] = $pb->kode_skpd;
            }

            $idSkpdList = array_values(array_unique(array_filter($idSkpdList)));
            $kodeSkpdList = array_values(array_unique(array_filter($kodeSkpdList)));

            $deletedBl = 0;
            $deletedRka = 0;
            $deletedPendapatan = 0;
            $deletedPembiayaan = 0;

            // Hapus Belanja & RKA jika scope all atau belanja
            if ($scope === 'all' || $scope === 'belanja') {
                $sblQuery = SubKegiatanBl::where(function ($q) use ($namaSkpd, $idSkpdList, $kodeSkpdList) {
                    $q->where('nama_skpd', $namaSkpd);
                    if (!empty($idSkpdList)) $q->orWhereIn('id_skpd', $idSkpdList);
                    if (!empty($kodeSkpdList)) $q->orWhereIn('kode_skpd', $kodeSkpdList);
                });
                if ($filterTahun) $sblQuery->where('tahun_anggaran', $filterTahun);

                $kodeSblList = $sblQuery->pluck('kode_sbl')->filter()->unique()->toArray();

                $rkaQuery = Rka::where(function ($q) use ($kodeSblList, $idSkpdList) {
                    $hasCond = false;
                    if (!empty($kodeSblList)) {
                        $q->whereIn('kode_sbl', $kodeSblList);
                        $hasCond = true;
                    }
                    if (!empty($idSkpdList)) {
                        if ($hasCond) {
                            $q->orWhereIn('id_skpd', $idSkpdList);
                        } else {
                            $q->whereIn('id_skpd', $idSkpdList);
                        }
                    }
                });
                if ($filterTahun) $rkaQuery->where('tahun_anggaran', $filterTahun);
                if (!empty($kodeSblList) || !empty($idSkpdList)) {
                    $deletedRka = $rkaQuery->delete();

                    $indQuery = SubKegiatanIndikator::where(function ($q) use ($kodeSblList, $idSkpdList) {
                        if (!empty($kodeSblList)) $q->whereIn('kode_sbl', $kodeSblList);
                        if (!empty($idSkpdList)) $q->orWhereIn('id_skpd', $idSkpdList);
                    });
                    if ($filterTahun) $indQuery->where('tahun_anggaran', $filterTahun);
                    $indQuery->delete();

                    $capQuery = CapaianProgram::where(function ($q) use ($kodeSblList, $idSkpdList) {
                        if (!empty($kodeSblList)) $q->whereIn('kode_sbl', $kodeSblList);
                        if (!empty($idSkpdList)) $q->orWhereIn('id_skpd', $idSkpdList);
                    });
                    if ($filterTahun) $capQuery->where('tahun_anggaran', $filterTahun);
                    $capQuery->delete();
                }

                $delBlQuery = SubKegiatanBl::where(function ($q) use ($namaSkpd, $idSkpdList, $kodeSkpdList) {
                    $q->where('nama_skpd', $namaSkpd);
                    if (!empty($idSkpdList)) $q->orWhereIn('id_skpd', $idSkpdList);
                    if (!empty($kodeSkpdList)) $q->orWhereIn('kode_skpd', $kodeSkpdList);
                });
                if ($filterTahun) $delBlQuery->where('tahun_anggaran', $filterTahun);
                $deletedBl = $delBlQuery->delete();
            }

            // Hapus Pendapatan jika scope all atau pendapatan
            if ($scope === 'all' || $scope === 'pendapatan') {
                $delPendQuery = Pendapatan::where(function ($q) use ($namaSkpd, $idSkpdList, $kodeSkpdList) {
                    $q->where('nama_skpd', $namaSkpd);
                    if (!empty($idSkpdList)) $q->orWhereIn('id_skpd', $idSkpdList);
                    if (!empty($kodeSkpdList)) $q->orWhereIn('kode_skpd', $kodeSkpdList);
                });
                if ($filterTahun) $delPendQuery->where('tahun_anggaran', $filterTahun);
                $deletedPendapatan = $delPendQuery->delete();

                $delPendSkpdQuery = PendapatanSkpd::where(function ($q) use ($namaSkpd, $idSkpdList, $kodeSkpdList) {
                    $q->where('nama_skpd', $namaSkpd);
                    if (!empty($idSkpdList)) $q->orWhereIn('id_skpd', $idSkpdList);
                    if (!empty($kodeSkpdList)) $q->orWhereIn('kode_skpd', $kodeSkpdList);
                });
                if ($filterTahun) $delPendSkpdQuery->where('tahun_anggaran', $filterTahun);
                $delPendSkpdQuery->delete();
            }

            // Hapus Pembiayaan jika scope all atau pembiayaan
            if ($scope === 'all' || $scope === 'pembiayaan') {
                $delPembQuery = Pembiayaan::where(function ($q) use ($namaSkpd, $idSkpdList, $kodeSkpdList) {
                    $q->where('nama_skpd', $namaSkpd);
                    if (!empty($idSkpdList)) $q->orWhereIn('id_skpd', $idSkpdList);
                    if (!empty($kodeSkpdList)) $q->orWhereIn('kode_skpd', $kodeSkpdList);
                });
                if ($filterTahun) $delPembQuery->where('tahun_anggaran', $filterTahun);
                $deletedPembiayaan = $delPembQuery->delete();

                $delPembSkpdQuery = PembiayaanSkpd::where(function ($q) use ($namaSkpd, $idSkpdList, $kodeSkpdList) {
                    $q->where('nama_skpd', $namaSkpd);
                    if (!empty($idSkpdList)) $q->orWhereIn('id_skpd', $idSkpdList);
                    if (!empty($kodeSkpdList)) $q->orWhereIn('kode_skpd', $kodeSkpdList);
                });
                if ($filterTahun) $delPembSkpdQuery->where('tahun_anggaran', $filterTahun);
                $delPembSkpdQuery->delete();
            }

            $detailMsg = [];
            if ($deletedBl > 0) $detailMsg[] = "{$deletedBl} Sub Kegiatan Belanja";
            if ($deletedRka > 0) $detailMsg[] = "{$deletedRka} Rincian RKA";
            if ($deletedPendapatan > 0) $detailMsg[] = "{$deletedPendapatan} Rekening Pendapatan";
            if ($deletedPembiayaan > 0) $detailMsg[] = "{$deletedPembiayaan} Rekening Pembiayaan";

            $summaryText = !empty($detailMsg) ? implode(', ', $detailMsg) : 'Tidak ada data tersisa';

            return response()->json([
                'status' => 'success',
                'message' => "Data SKPD '{$namaSkpd}' berhasil dibersihkan! Terhapus: {$summaryText}."
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal menghapus data SKPD: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Ambil daftar Master Akun (paginated + search)
     */
    public function getMasterAkun(Request $request)
    {
        $query = MasterAkun::where('active', 1);

        if ($request->filled('tahun_anggaran')) {
            $query->where('tahun_anggaran', (int) $request->input('tahun_anggaran'));
        }
        if ($request->filled('kategori') && $request->input('kategori') !== 'all') {
            $kat = $request->input('kategori');
            if ($kat === 'pendapatan') {
                $query->where(function ($q) {
                    $q->where('is_pendapatan', 1)
                      ->orWhere('pendapatan', 1)
                      ->orWhere('kode_akun', 'like', '4%');
                });
            } elseif ($kat === 'belanja') {
                $query->where(function ($q) {
                    $q->where('is_bl', 1)
                      ->orWhere('belanja', 1)
                      ->orWhere('kode_akun', 'like', '5%');
                });
            } elseif ($kat === 'pembiayaan') {
                $query->where(function ($q) {
                    $q->where('is_pembiayaan', 1)
                      ->orWhere('pembiayaan', 1)
                      ->orWhere('kode_akun', 'like', '6%');
                });
            }
        }
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('kode_akun', 'like', "%{$search}%")
                  ->orWhere('nama_akun', 'like', "%{$search}%");
            });
        }

        $perPage = min(max((int) $request->input('per_page', 50), 1), 500);
        $data = $query->orderBy('kode_akun')->paginate($perPage);

        return response()->json([
            'status' => 'success',
            'data' => $data,
        ]);
    }

    /**
     * Ambil daftar Master Sumber Dana (paginated + search)
     */
    public function getSumberDana(Request $request)
    {
        $query = MasterSumberDana::where('active', 1);

        if ($request->filled('tahun_anggaran')) {
            $query->where('tahun_anggaran', (int) $request->input('tahun_anggaran'));
        }
        if ($request->filled('status_input') && $request->input('status_input') !== 'all') {
            $si = $request->input('status_input');
            if ($si === 'input') {
                $query->where('set_input', 1);
            } elseif ($si === 'induk') {
                $query->where('set_input', 0);
            }
        }
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('kode_dana', 'like', "%{$search}%")
                  ->orWhere('nama_dana', 'like', "%{$search}%");
            });
        }

        $perPage = min(max((int) $request->input('per_page', 50), 1), 500);
        $data = $query->orderBy('kode_dana')->paginate($perPage);

        return response()->json([
            'status' => 'success',
            'data' => $data,
        ]);
    }

    /**
     * Ambil daftar Pendapatan Daerah (paginated + search + filter skpd)
     */
    public function getPendapatan(Request $request)
    {
        $query = Pendapatan::where('active', 1);

        if ($request->filled('tahun_anggaran')) {
            $query->where('tahun_anggaran', (int) $request->input('tahun_anggaran'));
        }
        if ($request->filled('id_skpd') && $request->input('id_skpd') !== 'all') {
            $query->where('id_skpd', (int) $request->input('id_skpd'));
        }
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('kode_akun', 'like', "%{$search}%")
                  ->orWhere('nama_akun', 'like', "%{$search}%")
                  ->orWhere('uraian', 'like', "%{$search}%")
                  ->orWhere('nama_skpd', 'like', "%{$search}%")
                  ->orWhere('keterangan', 'like', "%{$search}%");
            });
        }

        $perPage = min(max((int) $request->input('per_page', 50), 1), 500);
        $data = $query->orderBy('kode_skpd')->orderBy('kode_akun')->paginate($perPage);

        // Hitung total keseluruhan sesuai filter
        $totalNilaiFiltered = (float) (clone $query)->sum('total');

        return response()->json([
            'status' => 'success',
            'data' => $data,
            'summary' => [
                'total_nilai' => $totalNilaiFiltered,
            ]
        ]);
    }

    /**
     * Ambil daftar ringkasan SKPD yang memiliki pendapatan (paginated + search)
     */
    public function getPendapatanSkpdList(Request $request)
    {
        $hasSkpdTable = PendapatanSkpd::where('active', 1)->exists();

        if ($hasSkpdTable) {
            $query = PendapatanSkpd::where('active', 1);
            if ($request->filled('tahun_anggaran')) {
                $query->where('tahun_anggaran', (int) $request->input('tahun_anggaran'));
            }
            if ($request->filled('search')) {
                $search = $request->input('search');
                $query->where(function ($q) use ($search) {
                    $q->where('kode_skpd', 'like', "%{$search}%")
                      ->orWhere('nama_skpd', 'like', "%{$search}%");
                });
            }
            $totalPendapatan = (float) (clone $query)->sum('total');
            $totalRekening = (int) (clone $query)->sum('jumlah_rekening');
            $totalSkpd = (int) (clone $query)->count();

            $perPage = $request->input('per_page', 25);
            if ($perPage === 'all' || (int)$perPage === -1) {
                $data = $query->orderBy('kode_skpd')->get();
            } else {
                $perPage = min(max((int) $perPage, 5), 200);
                $data = $query->orderBy('kode_skpd')->paginate($perPage);
            }
        } else {
            $query = Pendapatan::where('active', 1);
            if ($request->filled('tahun_anggaran')) {
                $query->where('tahun_anggaran', (int) $request->input('tahun_anggaran'));
            }
            if ($request->filled('search')) {
                $search = $request->input('search');
                $query->where(function ($q) use ($search) {
                    $q->where('kode_skpd', 'like', "%{$search}%")
                      ->orWhere('nama_skpd', 'like', "%{$search}%");
                });
            }
            $baseList = $query->select('id_skpd', 'kode_skpd', 'nama_skpd', DB::raw('count(*) as jumlah_rekening'), DB::raw('sum(total) as total'))
                ->groupBy('id_skpd', 'kode_skpd', 'nama_skpd')
                ->orderBy('kode_skpd');

            $totalPendapatan = (float) (clone $query)->sum('total');
            $totalRekening = (int) (clone $query)->count();
            $totalSkpd = (int) (clone $baseList)->get()->count();

            $perPage = $request->input('per_page', 25);
            if ($perPage === 'all' || (int)$perPage === -1) {
                $data = $baseList->get();
            } else {
                $perPage = min(max((int) $perPage, 5), 200);
                $data = $baseList->paginate($perPage);
            }
        }

        return response()->json([
            'status' => 'success',
            'data' => $data,
            'summary' => [
                'total_pendapatan' => $totalPendapatan,
                'total_rekening' => $totalRekening,
                'total_skpd' => $totalSkpd,
            ]
        ]);
    }

    /**
     * Ambil daftar ringkasan SKPD Pembiayaan (Penerimaan / Pengeluaran)
     */
    public function getPembiayaanSkpdList(Request $request)
    {
        $tipe = strtolower((string) $request->input('tipe', 'penerimaan'));
        if (!in_array($tipe, ['penerimaan', 'pengeluaran'])) {
            $tipe = 'penerimaan';
        }

        $hasSkpdTable = PembiayaanSkpd::where('tipe', $tipe)->where('active', 1)->exists();

        if ($hasSkpdTable) {
            $query = PembiayaanSkpd::where('tipe', $tipe)->where('active', 1);
            if ($request->filled('tahun_anggaran')) {
                $query->where('tahun_anggaran', (int) $request->input('tahun_anggaran'));
            }
            if ($request->filled('search')) {
                $search = $request->input('search');
                $query->where(function ($q) use ($search) {
                    $q->where('kode_skpd', 'like', "%{$search}%")
                      ->orWhere('nama_skpd', 'like', "%{$search}%");
                });
            }

            $totalPembiayaan = (float) (clone $query)->sum('total');
            $totalRekening = (int) (clone $query)->sum('jumlah_rekening');
            $totalSkpd = (int) (clone $query)->count();

            $perPage = $request->input('per_page', 25);
            if ($perPage === 'all' || (int)$perPage === -1) {
                $data = $query->orderBy('kode_skpd')->get();
            } else {
                $perPage = min(max((int) $perPage, 5), 200);
                $data = $query->orderBy('kode_skpd')->paginate($perPage);
            }
        } else {
            $query = Pembiayaan::where('tipe', $tipe)->where('active', 1);
            if ($request->filled('tahun_anggaran')) {
                $query->where('tahun_anggaran', (int) $request->input('tahun_anggaran'));
            }
            if ($request->filled('search')) {
                $search = $request->input('search');
                $query->where(function ($q) use ($search) {
                    $q->where('kode_skpd', 'like', "%{$search}%")
                      ->orWhere('nama_skpd', 'like', "%{$search}%");
                });
            }

            $baseList = $query->select('id_skpd', 'kode_skpd', 'nama_skpd', DB::raw('count(*) as jumlah_rekening'), DB::raw('sum(total) as total'))
                ->groupBy('id_skpd', 'kode_skpd', 'nama_skpd')
                ->orderBy('kode_skpd');

            $totalPembiayaan = (float) (clone $query)->sum('total');
            $totalRekening = (int) (clone $query)->count();
            $totalSkpd = (int) (clone $baseList)->get()->count();

            $perPage = $request->input('per_page', 25);
            if ($perPage === 'all' || (int)$perPage === -1) {
                $data = $baseList->get();
            } else {
                $perPage = min(max((int) $perPage, 5), 200);
                $data = $baseList->paginate($perPage);
            }
        }

        return response()->json([
            'status' => 'success',
            'tipe' => $tipe,
            'data' => $data,
            'summary' => [
                'total_pembiayaan' => $totalPembiayaan,
                'total_rekening' => $totalRekening,
                'total_skpd' => $totalSkpd,
            ]
        ]);
    }

    /**
     * Ambil rincian rekening Pembiayaan (Penerimaan / Pengeluaran)
     */
    public function getPembiayaan(Request $request)
    {
        $tipe = strtolower((string) $request->input('tipe', 'penerimaan'));
        if (!in_array($tipe, ['penerimaan', 'pengeluaran'])) {
            $tipe = 'penerimaan';
        }

        $query = Pembiayaan::where('tipe', $tipe)->where('active', 1);

        if ($request->filled('tahun_anggaran')) {
            $query->where('tahun_anggaran', (int) $request->input('tahun_anggaran'));
        }
        if ($request->filled('id_skpd') && $request->input('id_skpd') !== 'all') {
            $query->where('id_skpd', (int) $request->input('id_skpd'));
        }
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('kode_akun', 'like', "%{$search}%")
                  ->orWhere('nama_akun', 'like', "%{$search}%")
                  ->orWhere('uraian', 'like', "%{$search}%")
                  ->orWhere('nama_skpd', 'like', "%{$search}%")
                  ->orWhere('keterangan', 'like', "%{$search}%");
            });
        }

        $perPage = min(max((int) $request->input('per_page', 50), 1), 500);
        $data = $query->orderBy('kode_skpd')->orderBy('kode_akun')->paginate($perPage);

        $totalNilaiFiltered = (float) (clone $query)->sum('total');

        return response()->json([
            'status' => 'success',
            'tipe' => $tipe,
            'data' => $data,
            'summary' => [
                'total_nilai' => $totalNilaiFiltered,
            ]
        ]);
    }

    /**
     * Daftar file .sql yang tersedia di storage/app beserta info batas upload PHP
     */
    public function listSqlFiles()
    {
        $dir = storage_path('app');
        $files = [];

        if (is_dir($dir)) {
            foreach (glob($dir . DIRECTORY_SEPARATOR . '*.sql') ?: [] as $path) {
                if (is_file($path)) {
                    $sizeBytes = filesize($path) ?: 0;
                    $files[] = [
                        'name' => basename($path),
                        'size_bytes' => $sizeBytes,
                        'size_mb' => round($sizeBytes / 1048576, 2),
                        'modified_at' => date('Y-m-d H:i:s', filemtime($path) ?: time()),
                    ];
                }
            }
        }

        usort($files, fn ($a, $b) => strcmp($b['modified_at'], $a['modified_at']));

        return response()->json([
            'status' => 'success',
            'data' => $files,
            'limits' => [
                'upload_max_filesize' => ini_get('upload_max_filesize'),
                'post_max_size' => ini_get('post_max_size'),
            ],
        ]);
    }

    /**
     * Import 4 tabel utama Belanja & RKA dari file .sql (mode menimpa)
     */
    public function importSql(Request $request, SqlImportService $importer)
    {
        $request->validate([
            'sql_file' => 'nullable|file|max:204800',
            'server_file' => 'nullable|string|max:255',
            'tahun_anggaran' => 'nullable|integer|min:2020|max:2100',
        ]);

        $tahunAnggaran = (int) ($request->input('tahun_anggaran') ?: 2026);
        $tempPath = null;

        try {
            if ($request->hasFile('sql_file')) {
                $uploaded = $request->file('sql_file');
                $ext = strtolower($uploaded->getClientOriginalExtension());
                if ($ext !== 'sql') {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Hanya file berekstensi .sql yang diperbolehkan.',
                    ], 422);
                }
                $targetPath = $uploaded->getRealPath();
            } elseif ($request->filled('server_file')) {
                $safeName = basename((string) $request->input('server_file'));
                if (!str_ends_with(strtolower($safeName), '.sql')) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Nama file server harus berekstensi .sql.',
                    ], 422);
                }
                $targetPath = storage_path('app' . DIRECTORY_SEPARATOR . $safeName);
                if (!is_file($targetPath)) {
                    return response()->json([
                        'status' => 'error',
                        'message' => "File {$safeName} tidak ditemukan di storage/app.",
                    ], 404);
                }
            } else {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Pilih file .sql untuk diunggah atau pilih file yang ada di server.',
                ], 422);
            }

            $result = $importer->importFromFile($targetPath, true, $tahunAnggaran);
            $totalRows = array_sum($result['counts']);

            if ($totalRows === 0) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Tidak ada data INSERT untuk tabel SIPD (Belanja/RKA, Pendapatan, Pembiayaan, atau Master) di dalam file .sql tersebut.',
                    'data' => $result,
                ], 422);
            }

            $importedTablesCount = count(array_filter($result['counts'], static fn ($cnt) => $cnt > 0));
            $syncNote = ($result['pagu_synced_rows'] ?? 0) > 0
                ? ' Pagu pada ' . number_format($result['pagu_synced_rows'], 0, ',', '.') . ' sub kegiatan disinkronkan dari rincian RKA.'
                : '';

            return response()->json([
                'status' => 'success',
                'message' => "Import TA {$tahunAnggaran} berhasil! Sebanyak " . number_format($totalRows, 0, ',', '.') . " baris data dimasukkan ke {$importedTablesCount} tabel dalam " . round($result['duration_ms'] / 1000, 2) . " detik." . $syncNote,
                'data' => array_merge($result, ['total_rows' => $totalRows]),
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mengimpor file SQL: ' . $e->getMessage(),
            ], 500);
        } finally {
            if ($tempPath && is_file($tempPath)) {
                @unlink($tempPath);
            }
        }
    }

    /**
     * Ringkasan jumlah baris yang siap di-export untuk tahun anggaran tertentu
     */
    public function exportSqlSummary(Request $request, SqlExportService $exporter)
    {
        $request->validate([
            'tahun_anggaran' => 'nullable|integer|min:2020|max:2100',
        ]);

        $tahunAnggaran = (int) ($request->input('tahun_anggaran') ?: 2026);
        $counts = $exporter->getExportSummary($tahunAnggaran);

        return response()->json([
            'status' => 'success',
            'data' => [
                'tahun_anggaran' => $tahunAnggaran,
                'counts' => $counts,
                'total_rows' => array_sum($counts),
            ],
        ]);
    }

    /**
     * Ambil daftar Master SKPD & Kepala SKPD (data_unit) dengan filter dan pagination
     */
    public function getMasterSkpd(Request $request)
    {
        $search = $request->input('search');
        $tahun = $request->input('tahun_anggaran');
        $jenis = $request->input('jenis', 'all'); // 'all' | 'induk' | 'unit'
        $perPage = (int) $request->input('per_page', 50);

        $query = DataUnit::where('active', 1);

        if ($tahun && $tahun !== 'all') {
            $query->where('tahun_anggaran', (int) $tahun);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('kode_skpd', 'like', "%{$search}%")
                  ->orWhere('nama_skpd', 'like', "%{$search}%")
                  ->orWhere('nama_kepala', 'like', "%{$search}%")
                  ->orWhere('nip_kepala', 'like', "%{$search}%");
            });
        }

        if ($jenis === 'induk') {
            $query->where('is_skpd', 1);
        } elseif ($jenis === 'unit') {
            $query->where('is_skpd', 0);
        }

        $data = $query->orderBy('kode_skpd')->orderBy('id_skpd')->paginate($perPage);

        return response()->json([
            'status' => 'success',
            'data' => $data,
        ]);
    }

    /**
     * Perbarui data Kepala SKPD (nama, NIP, pangkat, status) pada data_unit
     */
    public function updateMasterSkpd(Request $request, $id)
    {
        $unit = DataUnit::findOrFail($id);

        $validated = $request->validate([
            'nama_kepala' => 'nullable|string|max:255',
            'nip_kepala' => 'nullable|string|max:100',
            'pangkat_kepala' => 'nullable|string|max:255',
            'status_kepala' => 'nullable|string|max:100',
        ]);

        $unit->update([
            'nama_kepala' => $validated['nama_kepala'] !== '' ? $validated['nama_kepala'] : null,
            'nip_kepala' => $validated['nip_kepala'] !== '' ? $validated['nip_kepala'] : null,
            'pangkat_kepala' => $validated['pangkat_kepala'] !== '' ? $validated['pangkat_kepala'] : null,
            'status_kepala' => $validated['status_kepala'] !== '' ? $validated['status_kepala'] : null,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => "Data Kepala {$unit->nama_skpd} berhasil diperbarui.",
            'data' => $unit,
        ]);
    }

    /**
     * Export 4 tabel utama Belanja & RKA menjadi file .sql yang kompatibel dengan fitur Import SQL
     */
    public function exportSql(Request $request, SqlExportService $exporter)
    {
        $request->validate([
            'tahun_anggaran' => 'nullable|integer|min:2020|max:2100',
        ]);

        $tahunAnggaran = (int) ($request->input('tahun_anggaran') ?: 2026);
        $counts = $exporter->getExportSummary($tahunAnggaran);

        if (array_sum($counts) === 0) {
            return response()->json([
                'status' => 'error',
                'message' => "Tidak ada data untuk Tahun Anggaran {$tahunAnggaran} yang dapat di-export.",
            ], 422);
        }

        $filename = "sipd-local-ta-{$tahunAnggaran}-" . now()->format('Ymd-His') . '.sql';

        return response()->streamDownload(function () use ($exporter, $tahunAnggaran): void {
            $exporter->streamToOutput($tahunAnggaran);
        }, $filename, [
            'Content-Type' => 'application/sql; charset=UTF-8',
            'Cache-Control' => 'no-store, no-cache, must-revalidate',
        ]);
    }
}
