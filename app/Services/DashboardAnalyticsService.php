<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\DataUnit;
use App\Models\MasterAkun;
use App\Models\MasterSumberDana;
use App\Models\Pembiayaan;
use App\Models\Pendapatan;
use App\Models\PostingSession;
use App\Models\Rka;
use App\Models\SubKegiatanBl;
use App\Models\SyncLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class DashboardAnalyticsService
{
    public function getStatsPayload(Request $request): array
    {
        $tahun = $request->input('tahun_anggaran');
        $filterTahun = ($tahun && $tahun !== 'all') ? (int) $tahun : null;
        $forceRefresh = $request->boolean('refresh');

        $version = SystemLogService::getCacheVersion();
        $cacheKey = "dashboard_overview_v2_{$version}_y_" . ($filterTahun ?? 'all');

        if ($forceRefresh) {
            Cache::forget($cacheKey);
        }

        $cachedData = Cache::remember($cacheKey, now()->addSeconds(60), function () use ($filterTahun) {
            return $this->computeAggregatedData($filterTahun);
        });

        // Monitoring database & server selalu real-time (tidak di-cache)
        $systemMonitoring = $this->getSystemMonitoring($request, $cachedData);
        $notifications = $this->buildNotifications($cachedData, $systemMonitoring, $filterTahun);

        return array_merge($cachedData, [
            'monitoring' => $systemMonitoring,
            'notifications' => $notifications,
            'cached_at' => $cachedData['generated_at'] ?? now()->toIso8601String(),
        ]);
    }

    protected function computeAggregatedData(?int $filterTahun): array
    {
        $applyTahun = fn ($query) => $filterTahun ? $query->where('tahun_anggaran', $filterTahun) : $query;

        // 1. Agregasi Utama (menggunakan single-query aggregates per tabel)
        $subKegAgg = $applyTahun(SubKegiatanBl::where('active', 1))
            ->selectRaw('COUNT(*) as total_sub_kegiatan, COALESCE(SUM(pagu), 0) as total_pagu, COUNT(DISTINCT id_skpd) as total_skpd, COUNT(DISTINCT kode_sub_skpd) as total_sub_unit')
            ->first();

        $rkaAgg = $applyTahun(Rka::where('active', 1))
            ->selectRaw('COUNT(*) as total_rka_item, COALESCE(SUM(total_harga), 0) as total_rka_nilai')
            ->first();

        $pendapatanAgg = $applyTahun(Pendapatan::where('active', 1))
            ->selectRaw('COUNT(*) as total_pendapatan_item, COALESCE(SUM(total), 0) as total_pendapatan_nilai')
            ->first();

        $pembiayaanRows = $applyTahun(Pembiayaan::where('active', 1))
            ->select('tipe', DB::raw('COUNT(*) as item_count'), DB::raw('COALESCE(SUM(total), 0) as total_nilai'))
            ->groupBy('tipe')
            ->get()
            ->keyBy('tipe');

        $totalPembiayaanPenerimaan = (float) ($pembiayaanRows->get('penerimaan')->total_nilai ?? 0);
        $totalPembiayaanPengeluaran = (float) ($pembiayaanRows->get('pengeluaran')->total_nilai ?? 0);
        $totalPembiayaanItem = (int) (($pembiayaanRows->get('penerimaan')->item_count ?? 0) + ($pembiayaanRows->get('pengeluaran')->item_count ?? 0));
        $totalPembiayaanNetto = $totalPembiayaanPenerimaan - $totalPembiayaanPengeluaran;

        $totalSubKeg = (int) ($subKegAgg->total_sub_kegiatan ?? 0);
        $totalPagu = (float) ($subKegAgg->total_pagu ?? 0);
        $totalRkaItem = (int) ($rkaAgg->total_rka_item ?? 0);
        $totalRkaNilai = (float) ($rkaAgg->total_rka_nilai ?? 0);
        $totalPendapatanItem = (int) ($pendapatanAgg->total_pendapatan_item ?? 0);
        $totalPendapatanNilai = (float) ($pendapatanAgg->total_pendapatan_nilai ?? 0);
        $skpdCount = (int) ($subKegAgg->total_skpd ?? 0);
        $subUnitCount = (int) ($subKegAgg->total_sub_unit ?? 0);

        $totalAkun = $applyTahun(MasterAkun::where('active', 1))->count();
        $totalSumberDana = $applyTahun(MasterSumberDana::where('active', 1))->count();
        $totalMasterSkpd = Schema::hasTable('data_unit')
            ? $applyTahun(DataUnit::where('active', 1))->count()
            : 0;

        $surplusDefisit = $totalPendapatanNilai - $totalPagu;
        $silpa = $surplusDefisit + $totalPembiayaanNetto;
        $paguVsRkaDiff = $totalPagu - $totalRkaNilai;

        // 2. Data Pembanding Tahun Sebelumnya (hanya jika tahun_anggaran spesifik & ada data)
        $previousYear = null;
        if ($filterTahun) {
            $prevTahun = $filterTahun - 1;
            $prevSub = SubKegiatanBl::where('active', 1)
                ->where('tahun_anggaran', $prevTahun)
                ->selectRaw('COUNT(*) as total_sub_kegiatan, COALESCE(SUM(pagu), 0) as total_pagu')
                ->first();
            $prevPend = Pendapatan::where('active', 1)
                ->where('tahun_anggaran', $prevTahun)
                ->selectRaw('COALESCE(SUM(total), 0) as total_pendapatan_nilai')
                ->first();
            $prevRka = Rka::where('active', 1)
                ->where('tahun_anggaran', $prevTahun)
                ->selectRaw('COALESCE(SUM(total_harga), 0) as total_rka_nilai')
                ->first();

            $hasPrevData = ((int) ($prevSub->total_sub_kegiatan ?? 0) > 0)
                || ((float) ($prevPend->total_pendapatan_nilai ?? 0) > 0)
                || ((float) ($prevRka->total_rka_nilai ?? 0) > 0);

            if ($hasPrevData) {
                $previousYear = [
                    'tahun' => $prevTahun,
                    'total_sub_kegiatan' => (int) ($prevSub->total_sub_kegiatan ?? 0),
                    'total_pagu' => (float) ($prevSub->total_pagu ?? 0),
                    'total_pendapatan_nilai' => (float) ($prevPend->total_pendapatan_nilai ?? 0),
                    'total_rka_nilai' => (float) ($prevRka->total_rka_nilai ?? 0),
                ];
            }
        }

        // 3. Komposisi Belanja Daerah (berdasarkan kelompok akun 5.1, 5.2, 5.3, 5.4)
        $belanjaKomposisi = $this->getBelanjaComposition($filterTahun);

        // 4. Komposisi Pendapatan Daerah (berdasarkan kelompok akun 4.1, 4.2, 4.3)
        $pendapatanKomposisi = $this->getPendapatanComposition($filterTahun);

        // 5. Komposisi Pembiayaan Daerah
        $pembiayaanKomposisi = [];
        if ($totalPembiayaanPenerimaan > 0 || $totalPembiayaanPengeluaran > 0) {
            $pembiayaanKomposisi = [
                ['label' => 'Penerimaan Pembiayaan', 'value' => $totalPembiayaanPenerimaan],
                ['label' => 'Pengeluaran Pembiayaan', 'value' => $totalPembiayaanPengeluaran],
            ];
        }

        // 6. Perbandingan Antar Tahapan (Posting Sessions) & Antar Tahun
        $tahapanComparison = [];
        if (Schema::hasTable('posting_sessions')) {
            $tahapanComparison = $applyTahun(PostingSession::query())
                ->orderBy('created_at', 'asc')
                ->limit(8)
                ->get(['id', 'nama_posting', 'tahap', 'tahun_anggaran', 'total_pendapatan', 'total_belanja', 'total_pembiayaan_netto', 'surplus_defisit', 'created_at'])
                ->map(fn ($p) => [
                    'id' => $p->id,
                    'label' => $p->tahap ?: $p->nama_posting,
                    'nama_posting' => $p->nama_posting,
                    'pendapatan' => (float) $p->total_pendapatan,
                    'belanja' => (float) $p->total_belanja,
                    'pembiayaan_netto' => (float) $p->total_pembiayaan_netto,
                    'created_at' => optional($p->created_at)->toIso8601String(),
                ])
                ->values()
                ->all();
        }

        $yearlyComparison = $this->getYearlyComparison();

        // 7. Distribusi SKPD (Top 10 Pagu Terbesar)
        $topSkpd = $applyTahun(SubKegiatanBl::where('active', 1))
            ->select(
                'id_skpd',
                'kode_skpd',
                'nama_skpd',
                DB::raw('COUNT(*) as total_sub_keg'),
                DB::raw('COALESCE(SUM(pagu), 0) as total_pagu')
            )
            ->groupBy('id_skpd', 'kode_skpd', 'nama_skpd')
            ->orderByDesc('total_pagu')
            ->limit(10)
            ->get()
            ->map(fn ($row) => [
                'id_skpd' => $row->id_skpd,
                'kode_skpd' => $row->kode_skpd,
                'nama_skpd' => trim((string) $row->nama_skpd) ?: 'SKPD Tanpa Nama',
                'total_sub_keg' => (int) $row->total_sub_keg,
                'total_pagu' => (float) $row->total_pagu,
            ])
            ->values()
            ->all();

        // 8. Statistik Sumber Dana (komposisi jenis + nilai pagu)
        $sumberDanaTypes = $applyTahun(MasterSumberDana::where('active', 1))
            ->selectRaw("COALESCE(NULLIF(TRIM(sumber_dana), ''), 'Lainnya') as jenis, COUNT(*) as jumlah")
            ->groupBy('jenis')
            ->orderByDesc('jumlah')
            ->get()
            ->map(fn ($r) => ['label' => $r->jenis, 'count' => (int) $r->jumlah])
            ->values()
            ->all();

        $sumberDanaPagu = $this->getSumberDanaPagu($filterTahun);

        // 9. Kelengkapan Data SKPD
        $dataCompleteness = $this->getSkpdCompleteness($filterTahun, $skpdCount);

        return [
            'tahun_anggaran' => $filterTahun ? (string) $filterTahun : 'all',
            'total_sub_kegiatan' => $totalSubKeg,
            'total_pagu' => $totalPagu,
            'total_rka_item' => $totalRkaItem,
            'total_rka_nilai' => $totalRkaNilai,
            'pagu_vs_rka_diff' => $paguVsRkaDiff,
            'total_skpd' => $skpdCount,
            'total_sub_unit' => $subUnitCount,
            'total_master_akun' => $totalAkun,
            'total_sumber_dana' => $totalSumberDana,
            'total_master_skpd' => $totalMasterSkpd,
            'total_pendapatan_item' => $totalPendapatanItem,
            'total_pendapatan_nilai' => $totalPendapatanNilai,
            'total_pembiayaan_item' => $totalPembiayaanItem,
            'total_pembiayaan_penerimaan' => $totalPembiayaanPenerimaan,
            'total_pembiayaan_pengeluaran' => $totalPembiayaanPengeluaran,
            'total_pembiayaan_netto' => $totalPembiayaanNetto,
            'surplus_defisit' => $surplusDefisit,
            'silpa' => $silpa,
            'previous_year' => $previousYear,
            'charts' => [
                'belanja_composition' => $belanjaKomposisi,
                'pendapatan_composition' => $pendapatanKomposisi,
                'pembiayaan_composition' => $pembiayaanKomposisi,
                'tahapan_comparison' => $tahapanComparison,
                'yearly_comparison' => $yearlyComparison,
                'top_skpd' => $topSkpd,
                'sumber_dana_types' => $sumberDanaTypes,
                'sumber_dana_pagu' => $sumberDanaPagu,
            ],
            'data_completeness' => $dataCompleteness,
            'generated_at' => now()->toIso8601String(),
        ];
    }

    protected function getBelanjaComposition(?int $filterTahun): array
    {
        $query = Rka::where('active', 1);
        if ($filterTahun) {
            $query->where('tahun_anggaran', $filterTahun);
        }

        $rows = $query
            ->selectRaw("LEFT(TRIM(COALESCE(kode_akun, '')), 3) as prefix, COALESCE(SUM(total_harga), 0) as total")
            ->groupBy('prefix')
            ->get();

        $labels = [
            '5.1' => 'Belanja Operasi',
            '5.2' => 'Belanja Modal',
            '5.3' => 'Belanja Tidak Terduga',
            '5.4' => 'Belanja Transfer',
        ];

        $grouped = [];
        foreach ($rows as $row) {
            $val = (float) $row->total;
            if ($val <= 0) continue;
            $label = $labels[$row->prefix] ?? ('Kelompok ' . ($row->prefix ?: 'Lainnya'));
            $grouped[$label] = ($grouped[$label] ?? 0) + $val;
        }

        if (!empty($grouped)) {
            arsort($grouped);
            return collect($grouped)->map(fn ($v, $k) => ['label' => $k, 'value' => $v])->values()->all();
        }

        // Fallback ke pagu sub kegiatan per bidang urusan jika rincian RKA belum ada
        $subQuery = SubKegiatanBl::where('active', 1);
        if ($filterTahun) {
            $subQuery->where('tahun_anggaran', $filterTahun);
        }

        return $subQuery
            ->selectRaw("COALESCE(NULLIF(TRIM(nama_bidang_urusan), ''), 'Urusan Lainnya') as label, COALESCE(SUM(pagu), 0) as total")
            ->groupBy('label')
            ->orderByDesc('total')
            ->limit(6)
            ->get()
            ->filter(fn ($r) => (float) $r->total > 0)
            ->map(fn ($r) => ['label' => $r->label, 'value' => (float) $r->total])
            ->values()
            ->all();
    }

    protected function getPendapatanComposition(?int $filterTahun): array
    {
        $query = Pendapatan::where('active', 1);
        if ($filterTahun) {
            $query->where('tahun_anggaran', $filterTahun);
        }

        $rows = $query
            ->selectRaw("LEFT(TRIM(COALESCE(kode_akun, '')), 3) as prefix, COALESCE(SUM(total), 0) as total")
            ->groupBy('prefix')
            ->get();

        $labels = [
            '4.1' => 'Pendapatan Asli Daerah (PAD)',
            '4.2' => 'Pendapatan Transfer',
            '4.3' => 'Lain-lain Pendapatan Sah',
        ];

        $grouped = [];
        foreach ($rows as $row) {
            $val = (float) $row->total;
            if ($val <= 0) continue;
            $label = $labels[$row->prefix] ?? ('Kelompok ' . ($row->prefix ?: 'Lainnya'));
            $grouped[$label] = ($grouped[$label] ?? 0) + $val;
        }

        arsort($grouped);
        return collect($grouped)->map(fn ($v, $k) => ['label' => $k, 'value' => $v])->values()->all();
    }

    protected function getYearlyComparison(): array
    {
        $belanjaByYear = SubKegiatanBl::where('active', 1)
            ->select('tahun_anggaran', DB::raw('COALESCE(SUM(pagu), 0) as total'))
            ->groupBy('tahun_anggaran')
            ->pluck('total', 'tahun_anggaran');

        $pendapatanByYear = Pendapatan::where('active', 1)
            ->select('tahun_anggaran', DB::raw('COALESCE(SUM(total), 0) as total'))
            ->groupBy('tahun_anggaran')
            ->pluck('total', 'tahun_anggaran');

        $years = $belanjaByYear->keys()
            ->merge($pendapatanByYear->keys())
            ->map(fn ($y) => (int) $y)
            ->filter(fn ($y) => $y >= 2020 && $y <= 2100)
            ->unique()
            ->sort()
            ->values();

        return $years->map(fn ($yr) => [
            'tahun' => (string) $yr,
            'pendapatan' => (float) ($pendapatanByYear[$yr] ?? 0),
            'belanja' => (float) ($belanjaByYear[$yr] ?? 0),
        ])->all();
    }

    protected function getSumberDanaPagu(?int $filterTahun): array
    {
        $rkaQuery = Rka::where('active', 1);
        if ($filterTahun) {
            $rkaQuery->where('tahun_anggaran', $filterTahun);
        }

        $rows = $rkaQuery
            ->selectRaw("COALESCE(NULLIF(TRIM(nama_dana), ''), 'Sumber Dana Belum Ditentukan') as label, COALESCE(SUM(total_harga), 0) as total")
            ->groupBy('label')
            ->orderByDesc('total')
            ->limit(7)
            ->get()
            ->filter(fn ($r) => (float) $r->total > 0)
            ->map(fn ($r) => ['label' => $r->label, 'value' => (float) $r->total])
            ->values()
            ->all();

        if (!empty($rows)) {
            return $rows;
        }

        $subQuery = SubKegiatanBl::where('active', 1);
        if ($filterTahun) {
            $subQuery->where('tahun_anggaran', $filterTahun);
        }

        return $subQuery
            ->selectRaw("COALESCE(NULLIF(TRIM(nama_dana), ''), 'Sumber Dana Belum Ditentukan') as label, COALESCE(SUM(pagu), 0) as total")
            ->groupBy('label')
            ->orderByDesc('total')
            ->limit(7)
            ->get()
            ->filter(fn ($r) => (float) $r->total > 0)
            ->map(fn ($r) => ['label' => $r->label, 'value' => (float) $r->total])
            ->values()
            ->all();
    }

    protected function getSkpdCompleteness(?int $filterTahun, int $skpdDenganData): array
    {
        if (!Schema::hasTable('data_unit')) {
            return [
                'skpd_terdaftar' => $skpdDenganData,
                'skpd_induk_terdaftar' => $skpdDenganData,
                'sub_unit_terdaftar' => 0,
                'skpd_dengan_data' => $skpdDenganData,
                'skpd_belum_data' => 0,
                'persentase' => $skpdDenganData > 0 ? 100 : 0,
                'missing_skpd' => [],
            ];
        }

        $unitQuery = DataUnit::where('active', 1);
        if ($filterTahun) {
            $unitQuery->where('tahun_anggaran', $filterTahun);
        }
        $units = $unitQuery->get(['id_skpd', 'id_unit', 'kode_skpd', 'nama_skpd', 'is_skpd']);

        $skpdTerdaftar = $units->count();
        if ($skpdTerdaftar === 0) {
            return [
                'skpd_terdaftar' => $skpdDenganData,
                'skpd_induk_terdaftar' => $skpdDenganData,
                'sub_unit_terdaftar' => 0,
                'skpd_dengan_data' => $skpdDenganData,
                'skpd_belum_data' => 0,
                'persentase' => $skpdDenganData > 0 ? 100 : 0,
                'missing_skpd' => [],
            ];
        }

        $activeSubQuery = SubKegiatanBl::where('active', 1);
        if ($filterTahun) {
            $activeSubQuery->where('tahun_anggaran', $filterTahun);
        }
        $activeRows = $activeSubQuery
            ->select('id_skpd', 'id_sub_skpd', 'kode_skpd', 'kode_sub_skpd')
            ->distinct()
            ->get();

        $activeSkpdIds = [];
        $activeSubSkpdIds = [];
        $activeKodeSkpd = [];
        $activeKodeSubSkpd = [];

        foreach ($activeRows as $row) {
            if ($row->id_skpd) {
                $activeSkpdIds[(int) $row->id_skpd] = true;
            }
            if ($row->id_sub_skpd) {
                $activeSubSkpdIds[(int) $row->id_sub_skpd] = true;
            }
            if ($row->kode_skpd) {
                $activeKodeSkpd[trim((string) $row->kode_skpd)] = true;
            }
            if ($row->kode_sub_skpd) {
                $activeKodeSubSkpd[trim((string) $row->kode_sub_skpd)] = true;
            }
        }

        $skpdIndukTerdaftar = 0;
        $subUnitTerdaftar = 0;
        $withData = 0;
        $missing = [];

        foreach ($units as $unit) {
            if ((int) $unit->is_skpd === 1) {
                $skpdIndukTerdaftar++;
            } else {
                $subUnitTerdaftar++;
            }

            $unitId = (int) $unit->id_skpd;
            $unitKode = trim((string) ($unit->kode_skpd ?? ''));

            // Cek sebagai SKPD induk (id_skpd/kode_skpd) maupun Sub-SKPD seperti RSUD & Puskesmas (id_sub_skpd/kode_sub_skpd)
            $hasData = isset($activeSkpdIds[$unitId])
                || isset($activeSubSkpdIds[$unitId])
                || ($unitKode !== '' && (isset($activeKodeSkpd[$unitKode]) || isset($activeKodeSubSkpd[$unitKode])));

            if ($hasData) {
                $withData++;
            } elseif (count($missing) < 10) {
                $missing[] = [
                    'id_skpd' => $unit->id_skpd,
                    'kode_skpd' => $unit->kode_skpd,
                    'nama_skpd' => $unit->nama_skpd,
                ];
            }
        }

        $belumData = max(0, $skpdTerdaftar - $withData);
        $persentase = $skpdTerdaftar > 0 ? round(($withData / $skpdTerdaftar) * 100, 1) : 0;

        return [
            'skpd_terdaftar' => $skpdTerdaftar,
            'skpd_induk_terdaftar' => $skpdIndukTerdaftar,
            'sub_unit_terdaftar' => $subUnitTerdaftar,
            'skpd_dengan_data' => $withData,
            'skpd_belum_data' => $belumData,
            'persentase' => $persentase,
            'missing_skpd' => $missing,
        ];
    }

    protected function getSystemMonitoring(Request $request, array $stats): array
    {
        $dbConnected = false;
        $dbError = null;
        $dbName = config('database.connections.' . config('database.default') . '.database', 'db_sipd');
        $dbHost = config('database.connections.' . config('database.default') . '.host', '127.0.0.1');
        $dbPort = (string) config('database.connections.' . config('database.default') . '.port', '3306');
        $dbDriver = config('database.default', 'mysql');
        $tableCount = 0;
        $sizeMb = null;

        try {
            DB::connection()->getPdo();
            $dbConnected = true;
            $dbName = DB::connection()->getDatabaseName() ?: $dbName;

            if ($dbDriver === 'mysql') {
                $info = DB::selectOne(
                    "SELECT COUNT(*) as tbl_count, ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) as size_mb FROM information_schema.TABLES WHERE table_schema = ?",
                    [$dbName]
                );
                if ($info) {
                    $tableCount = (int) ($info->tbl_count ?? 0);
                    $sizeMb = $info->size_mb !== null ? (float) $info->size_mb : 0.0;
                }
            } elseif ($dbDriver === 'sqlite') {
                $tables = DB::select("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
                $tableCount = count($tables);
            }
        } catch (\Throwable $e) {
            $dbError = $e->getMessage();
        }

        $syncHistory = [];
        $lastSync = null;
        if ($dbConnected && Schema::hasTable('sync_logs')) {
            $syncRows = SyncLog::orderByDesc('created_at')->limit(10)->get();
            $syncHistory = $syncRows->map(fn ($log) => [
                'id' => $log->id,
                'action' => $log->action,
                'data_type' => $log->data_type ?: $log->action,
                'tahun_anggaran' => $log->tahun_anggaran,
                'status' => $log->status,
                'processed_count' => (int) $log->processed_count,
                'failed_count' => (int) $log->failed_count,
                'message' => $log->message,
                'error_detail' => $log->error_detail,
                'duration_ms' => $log->duration_ms,
                'created_at' => optional($log->created_at)->toIso8601String(),
            ])->all();
            $lastSync = $syncHistory[0] ?? null;
        }

        $activities = [];
        if ($dbConnected && Schema::hasTable('activity_logs')) {
            $activities = ActivityLog::orderByDesc('created_at')
                ->limit(12)
                ->get()
                ->map(fn ($act) => [
                    'id' => $act->id,
                    'category' => $act->category,
                    'title' => $act->title,
                    'description' => $act->description,
                    'status' => $act->status,
                    'tahun_anggaran' => $act->tahun_anggaran,
                    'actor' => $act->actor,
                    'created_at' => optional($act->created_at)->toIso8601String(),
                ])
                ->all();
        }

        if (empty($activities) && $dbConnected && Schema::hasTable('posting_sessions')) {
            $activities = PostingSession::orderByDesc('created_at')
                ->limit(6)
                ->get()
                ->map(fn ($p) => [
                    'id' => 'post-' . $p->id,
                    'category' => 'posting',
                    'title' => 'Posting Data: ' . $p->nama_posting,
                    'description' => 'Tahap ' . $p->tahap . ' (TA ' . $p->tahun_anggaran . ')',
                    'status' => 'success',
                    'tahun_anggaran' => $p->tahun_anggaran,
                    'actor' => $p->posted_by ?: 'Sistem',
                    'created_at' => optional($p->created_at)->toIso8601String(),
                ])
                ->all();
        }

        $totalManagedRows = ($stats['total_sub_kegiatan'] ?? 0)
            + ($stats['total_rka_item'] ?? 0)
            + ($stats['total_pendapatan_item'] ?? 0)
            + ($stats['total_pembiayaan_item'] ?? 0)
            + ($stats['total_master_akun'] ?? 0)
            + ($stats['total_sumber_dana'] ?? 0);

        $serverPort = $request->getPort() ?: 8000;
        $apiEndpoint = $request->getSchemeAndHttpHost() . '/api/sync-rka';

        return [
            'server' => [
                'status' => 'online',
                'host' => $request->getHost() ?: '127.0.0.1',
                'port' => $serverPort,
                'php_version' => PHP_VERSION,
                'laravel_version' => app()->version(),
                'server_time' => now()->toIso8601String(),
            ],
            'database' => [
                'status' => $dbConnected ? 'connected' : 'error',
                'driver' => $dbDriver,
                'name' => $dbName,
                'host' => $dbHost,
                'port' => $dbPort,
                'table_count' => $tableCount,
                'managed_rows' => $totalManagedRows,
                'size_mb' => $sizeMb,
                'error' => $dbError,
            ],
            'api' => [
                'status' => $dbConnected ? 'ready' : 'degraded',
                'endpoint' => $apiEndpoint,
                'last_request_at' => $lastSync['created_at'] ?? null,
                'last_action' => $lastSync['data_type'] ?? null,
                'last_status' => $lastSync['status'] ?? null,
                'last_error' => $lastSync['error_detail'] ?? null,
            ],
            'extension' => [
                'status' => $lastSync
                    ? ($lastSync['status'] === 'error' ? 'error' : 'connected')
                    : ($dbConnected ? 'standby' : 'disconnected'),
                'last_sync_at' => $lastSync['created_at'] ?? null,
                'last_sync_type' => $lastSync['data_type'] ?? null,
                'last_sync_status' => $lastSync['status'] ?? null,
                'last_sync_message' => $lastSync['message'] ?? null,
            ],
            'sync_history' => $syncHistory,
            'activities' => $activities,
        ];
    }

    protected function buildNotifications(array $stats, array $monitoring, ?int $filterTahun): array
    {
        $notifications = [];

        if (($monitoring['database']['status'] ?? '') !== 'connected') {
            $notifications[] = [
                'id' => 'db-error',
                'level' => 'error',
                'title' => 'Koneksi Database Bermasalah',
                'message' => $monitoring['database']['error'] ?? 'Tidak dapat terhubung ke server MySQL.',
            ];
        }

        $lastSync = $monitoring['sync_history'][0] ?? null;
        if ($lastSync) {
            if ($lastSync['status'] === 'error') {
                $notifications[] = [
                    'id' => 'sync-error',
                    'level' => 'error',
                    'title' => 'Sinkronisasi Terakhir Gagal',
                    'message' => ($lastSync['data_type'] ?? 'Data') . ': ' . ($lastSync['error_detail'] ?: $lastSync['message']),
                ];
            } else {
                $notifications[] = [
                    'id' => 'sync-success',
                    'level' => 'success',
                    'title' => 'Sinkronisasi Terakhir Berhasil',
                    'message' => "{$lastSync['data_type']} ({$lastSync['processed_count']} diproses).",
                ];
            }
        }

        $completeness = $stats['data_completeness'] ?? [];
        if (($completeness['skpd_belum_data'] ?? 0) > 0) {
            $notifications[] = [
                'id' => 'skpd-incomplete',
                'level' => 'warning',
                'title' => 'Data SKPD Belum Lengkap',
                'message' => "{$completeness['skpd_belum_data']} dari {$completeness['skpd_terdaftar']} SKPD terdaftar belum memiliki data sub kegiatan.",
            ];
        }

        $diff = abs((float) ($stats['pagu_vs_rka_diff'] ?? 0));
        if ($diff > 1 && ($stats['total_pagu'] ?? 0) > 0 && ($stats['total_rka_nilai'] ?? 0) > 0) {
            $notifications[] = [
                'id' => 'pagu-rka-diff',
                'level' => 'warning',
                'title' => 'Selisih Pagu & Rincian RKA',
                'message' => 'Total Pagu Sub Kegiatan berbeda Rp ' . number_format($diff, 0, ',', '.') . ' dari Total Rincian RKA.',
            ];
        }

        if (($stats['total_sub_kegiatan'] ?? 0) === 0 && ($stats['total_pendapatan_item'] ?? 0) === 0) {
            $tahunLabel = $filterTahun ? "TA {$filterTahun}" : 'tahun anggaran aktif';
            $notifications[] = [
                'id' => 'empty-data',
                'level' => 'info',
                'title' => "Belum Ada Data Anggaran ({$tahunLabel})",
                'message' => 'Jalankan sinkronisasi dari Chrome Extension SIPD RI atau import file .sql melalui menu Import & Export DB.',
            ];
        }

        return $notifications;
    }
}
