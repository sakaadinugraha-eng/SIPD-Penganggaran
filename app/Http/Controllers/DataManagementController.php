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
use App\Services\SqlImportService;

class DataManagementController extends Controller
{
    /**
     * Ambil data statistik ringkasan
     */
    public function getStats()
    {
        $totalSubKeg = SubKegiatanBl::where('active', 1)->count();
        $totalPagu = (float) SubKegiatanBl::where('active', 1)->sum('pagu');
        $totalRka = Rka::where('active', 1)->count();
        $totalRkaNilai = (float) Rka::where('active', 1)->sum('total_harga');
        $totalAkun = MasterAkun::where('active', 1)->count();
        $totalSumberDana = MasterSumberDana::where('active', 1)->count();
        $totalPendapatanItem = Pendapatan::where('active', 1)->count();
        $totalPendapatanNilai = (float) Pendapatan::where('active', 1)->sum('total');

        $totalPembiayaanPenerimaan = (float) Pembiayaan::where('tipe', 'penerimaan')->where('active', 1)->sum('total');
        $totalPembiayaanPengeluaran = (float) Pembiayaan::where('tipe', 'pengeluaran')->where('active', 1)->sum('total');

        $skpdCount = SubKegiatanBl::where('active', 1)
            ->distinct('id_skpd')
            ->count('id_skpd');

        $subUnitCount = SubKegiatanBl::where('active', 1)
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
    public function getSkpdList()
    {
        $skpds = [];

        // 1. Dari SubKegiatanBl
        $listBl = SubKegiatanBl::where('active', 1)
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
        $listPend = PendapatanSkpd::where('active', 1)
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
        $listPemb = PembiayaanSkpd::where('active', 1)
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

        $subList = SubKegiatanBl::where('active', 1)
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
    public function getSkpdHierarchy()
    {
        $rows = SubKegiatanBl::where('active', 1)
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
        $perPage = (int) $request->input('per_page', 15);

        $query = SubKegiatanBl::where('active', 1)
            ->withCount(['rka', 'indikatorKeluaran as indikator_count', 'capaian']);

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

        return response()->json([
            'status' => 'success',
            'data' => [
                'sub_kegiatan' => $sub,
                'rka_items' => $rkaItems,
            ]
        ]);
    }

    /**
     * Kosongkan SEMUA data (Truncate seluruh tabel transaksi & master)
     */
    public function resetAll(Request $request)
    {
        try {
            DB::statement('SET FOREIGN_KEY_CHECKS=0;');
            SubKegiatanBl::truncate();
            Rka::truncate();
            SubKegiatanIndikator::truncate();
            CapaianProgram::truncate();
            Pendapatan::truncate();
            PendapatanSkpd::truncate();
            Pembiayaan::truncate();
            PembiayaanSkpd::truncate();
            MasterAkun::truncate();
            MasterSumberDana::truncate();
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');

            return response()->json([
                'status' => 'success',
                'message' => 'Seluruh database berhasil dikosongkan total (Belanja & RKA, Pendapatan, Pembiayaan, dan Data Master kembali bersih ke nol)!'
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
        ]);

        $module = $request->input('module');

        try {
            DB::statement('SET FOREIGN_KEY_CHECKS=0;');
            $label = '';
            
            if ($module === 'belanja') {
                SubKegiatanBl::truncate();
                Rka::truncate();
                SubKegiatanIndikator::truncate();
                CapaianProgram::truncate();
                $label = 'Belanja & RKA (Sub Kegiatan, RKA, Indikator, Capaian)';
            } elseif ($module === 'pendapatan') {
                Pendapatan::truncate();
                PendapatanSkpd::truncate();
                $label = 'Pendapatan Daerah (Target SKPD & Rincian Rekening)';
            } elseif ($module === 'pembiayaan') {
                Pembiayaan::truncate();
                PembiayaanSkpd::truncate();
                $label = 'Pembiayaan Daerah (Penerimaan & Pengeluaran)';
            } elseif ($module === 'master') {
                MasterAkun::truncate();
                MasterSumberDana::truncate();
                $label = 'Data Master (Master Akun & Sumber Dana)';
            }

            DB::statement('SET FOREIGN_KEY_CHECKS=1;');

            return response()->json([
                'status' => 'success',
                'message' => "Seluruh data modul {$label} berhasil dikosongkan total!"
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
        ]);

        $namaSkpd = trim($request->input('nama_skpd'));
        $scope = $request->input('scope', 'all');

        try {
            // Kumpulkan id_skpd dan kode_skpd yang terkait dengan nama_skpd
            $idSkpdList = [];
            $kodeSkpdList = [];

            $blMatch = SubKegiatanBl::where('nama_skpd', $namaSkpd)->get(['id_skpd', 'kode_skpd']);
            foreach ($blMatch as $b) {
                if ($b->id_skpd) $idSkpdList[] = $b->id_skpd;
                if ($b->kode_skpd) $kodeSkpdList[] = $b->kode_skpd;
            }

            $pendMatch = PendapatanSkpd::where('nama_skpd', $namaSkpd)->get(['id_skpd', 'kode_skpd']);
            foreach ($pendMatch as $p) {
                if ($p->id_skpd) $idSkpdList[] = $p->id_skpd;
                if ($p->kode_skpd) $kodeSkpdList[] = $p->kode_skpd;
            }

            $pembMatch = PembiayaanSkpd::where('nama_skpd', $namaSkpd)->get(['id_skpd', 'kode_skpd']);
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
                if (!empty($kodeSblList) || !empty($idSkpdList)) {
                    $deletedRka = $rkaQuery->delete();

                    SubKegiatanIndikator::where(function ($q) use ($kodeSblList, $idSkpdList) {
                        if (!empty($kodeSblList)) $q->whereIn('kode_sbl', $kodeSblList);
                        if (!empty($idSkpdList)) $q->orWhereIn('id_skpd', $idSkpdList);
                    })->delete();

                    CapaianProgram::where(function ($q) use ($kodeSblList, $idSkpdList) {
                        if (!empty($kodeSblList)) $q->whereIn('kode_sbl', $kodeSblList);
                        if (!empty($idSkpdList)) $q->orWhereIn('id_skpd', $idSkpdList);
                    })->delete();
                }

                $deletedBl = SubKegiatanBl::where(function ($q) use ($namaSkpd, $idSkpdList, $kodeSkpdList) {
                    $q->where('nama_skpd', $namaSkpd);
                    if (!empty($idSkpdList)) $q->orWhereIn('id_skpd', $idSkpdList);
                    if (!empty($kodeSkpdList)) $q->orWhereIn('kode_skpd', $kodeSkpdList);
                })->delete();
            }

            // Hapus Pendapatan jika scope all atau pendapatan
            if ($scope === 'all' || $scope === 'pendapatan') {
                $deletedPendapatan = Pendapatan::where(function ($q) use ($namaSkpd, $idSkpdList, $kodeSkpdList) {
                    $q->where('nama_skpd', $namaSkpd);
                    if (!empty($idSkpdList)) $q->orWhereIn('id_skpd', $idSkpdList);
                    if (!empty($kodeSkpdList)) $q->orWhereIn('kode_skpd', $kodeSkpdList);
                })->delete();

                PendapatanSkpd::where(function ($q) use ($namaSkpd, $idSkpdList, $kodeSkpdList) {
                    $q->where('nama_skpd', $namaSkpd);
                    if (!empty($idSkpdList)) $q->orWhereIn('id_skpd', $idSkpdList);
                    if (!empty($kodeSkpdList)) $q->orWhereIn('kode_skpd', $kodeSkpdList);
                })->delete();
            }

            // Hapus Pembiayaan jika scope all atau pembiayaan
            if ($scope === 'all' || $scope === 'pembiayaan') {
                $deletedPembiayaan = Pembiayaan::where(function ($q) use ($namaSkpd, $idSkpdList, $kodeSkpdList) {
                    $q->where('nama_skpd', $namaSkpd);
                    if (!empty($idSkpdList)) $q->orWhereIn('id_skpd', $idSkpdList);
                    if (!empty($kodeSkpdList)) $q->orWhereIn('kode_skpd', $kodeSkpdList);
                })->delete();

                PembiayaanSkpd::where(function ($q) use ($namaSkpd, $idSkpdList, $kodeSkpdList) {
                    $q->where('nama_skpd', $namaSkpd);
                    if (!empty($idSkpdList)) $q->orWhereIn('id_skpd', $idSkpdList);
                    if (!empty($kodeSkpdList)) $q->orWhereIn('kode_skpd', $kodeSkpdList);
                })->delete();
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
        ]);

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

            $result = $importer->importFromFile($targetPath, true);
            $totalRows = array_sum($result['counts']);

            if ($totalRows === 0) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Tidak ada data INSERT untuk 4 tabel utama (data_sub_keg_bl, data_rka, data_capaian_prog_sub_keg, data_sub_keg_indikator) di dalam file .sql tersebut.',
                    'data' => $result,
                ], 422);
            }

            $syncNote = ($result['pagu_synced_rows'] ?? 0) > 0
                ? ' Pagu pada ' . number_format($result['pagu_synced_rows'], 0, ',', '.') . ' sub kegiatan disinkronkan dari rincian RKA.'
                : '';

            return response()->json([
                'status' => 'success',
                'message' => "Import berhasil! Sebanyak " . number_format($totalRows, 0, ',', '.') . " baris data dimasukkan ke 4 tabel utama dalam " . round($result['duration_ms'] / 1000, 2) . " detik." . $syncNote,
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
}
