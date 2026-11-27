<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use App\Models\PostingSession;
use App\Models\SyncLog;
use App\Models\ActivityLog;
use App\Services\SystemLogService;

class LaporanController extends Controller
{
    /**
     * Ambil daftar opsi sumber data (Live & Posting), SKPD, dan Sumber Dana
     * untuk filter dinamis Laporan Kelengkapan Perubahan Perbup.
     */
    public function getPerbupOptions(Request $request)
    {
        $tahun = (int) $request->query('tahun_anggaran', date('Y'));
        $ver = SystemLogService::getCacheVersion();
        $cacheKey = "laporan_perbup_options:v{$ver}:{$tahun}";

        $payload = $this->rememberReportCache($cacheKey, now()->addMinutes(30), function () use ($tahun) {
            return $this->buildPerbupOptionsPayload($tahun);
        });

        return response()->json([
            'status' => 'success',
            'data' => $payload,
        ], 200, [], JSON_INVALID_UTF8_SUBSTITUTE);
    }

    protected function buildPerbupOptionsPayload(int $tahun): array
    {

        $sessions = PostingSession::where('tahun_anggaran', $tahun)
            ->orderBy('id', 'asc')
            ->get(['id', 'nama_posting', 'tahap', 'tahun_anggaran', 'total_belanja', 'created_at']);

        $liveCount = DB::table('data_sub_keg_bl')
            ->where('tahun_anggaran', $tahun)
            ->where('active', 1)
            ->count();

        $liveTotal = (float) DB::table('data_sub_keg_bl')
            ->where('tahun_anggaran', $tahun)
            ->where('active', 1)
            ->sum('pagu');

        $sources = [];
        foreach ($sessions as $s) {
            $sources[] = [
                'id' => 'posting:' . $s->id,
                'label' => "{$s->nama_posting} ({$s->tahap})",
                'type' => 'posting',
                'tahap' => $s->tahap,
                'total_belanja' => (float) $s->total_belanja,
                'created_at' => $s->created_at?->toIso8601String(),
            ];
        }

        $sources[] = [
            'id' => 'live',
            'label' => "Data Aktif Saat Ini (Live - {$liveCount} Sub Keg)",
            'type' => 'live',
            'tahap' => 'Live',
            'total_belanja' => $liveTotal,
            'created_at' => null,
        ];

        // Daftar SKPD unik dari data aktif & posting (Dinas Kesehatan gabung Puskesmas, RSUD dipisah sendiri)
        $skpdMap = [];
        $liveSkpds = DB::table('data_sub_keg_bl')
            ->where('tahun_anggaran', $tahun)
            ->where('active', 1)
            ->select('id_skpd', 'kode_skpd', 'nama_skpd', 'kode_sub_skpd', 'nama_sub_skpd')
            ->distinct()
            ->get();

        foreach ($liveSkpds as $row) {
            $unit = $this->resolveReportUnit($row);
            if ($unit === null) {
                continue;
            }
            $skpdMap[$unit['key']] = [
                'kode_skpd' => $unit['kode'],
                'nama_skpd' => $unit['nama'],
            ];
        }

        if ($sessions->isNotEmpty()) {
            $postingSkpds = DB::table('posting_sub_keg_bl')
                ->whereIn('posting_id', $sessions->pluck('id'))
                ->select('kode_skpd', 'nama_skpd', 'kode_sub_skpd', 'nama_sub_skpd')
                ->distinct()
                ->get();

            foreach ($postingSkpds as $row) {
                $unit = $this->resolveReportUnit($row);
                if ($unit === null) {
                    continue;
                }
                if (!isset($skpdMap[$unit['key']])) {
                    $skpdMap[$unit['key']] = [
                        'kode_skpd' => $unit['kode'],
                        'nama_skpd' => $unit['nama'],
                    ];
                }
            }
        }

        $skpdList = array_values($skpdMap);
        usort($skpdList, fn ($a, $b) => strnatcasecmp($a['kode_skpd'], $b['kode_skpd']));

        // Daftar Sumber Dana unik dari data_rka dan data_sub_keg_bl
        $danaRka = DB::table('data_rka')
            ->where('tahun_anggaran', $tahun)
            ->where('active', 1)
            ->whereNotNull('nama_dana')
            ->where('nama_dana', '!=', '')
            ->distinct()
            ->pluck('nama_dana')
            ->all();

        $danaSub = DB::table('data_sub_keg_bl')
            ->where('tahun_anggaran', $tahun)
            ->where('active', 1)
            ->whereNotNull('nama_dana')
            ->where('nama_dana', '!=', '')
            ->distinct()
            ->pluck('nama_dana')
            ->all();

        $sumberDanas = collect(array_merge($danaRka, $danaSub))
            ->map(fn ($v) => trim((string) $v))
            ->filter(fn ($v) => $v !== '')
            ->unique()
            ->sort()
            ->values()
            ->all();

        // Riwayat Sinkronisasi & Posting terbaru
        $syncHistory = [];
        if (Schema::hasTable('sync_logs')) {
            $logs = SyncLog::where(function ($q) use ($tahun) {
                $q->where('tahun_anggaran', $tahun)->orWhereNull('tahun_anggaran');
            })
                ->orderByDesc('id')
                ->limit(15)
                ->get(['id', 'action', 'data_type', 'tahun_anggaran', 'status', 'processed_count', 'failed_count', 'message', 'source', 'created_at']);

            foreach ($logs as $l) {
                $syncHistory[] = [
                    'id' => 'sync-' . $l->id,
                    'waktu' => $l->created_at?->toIso8601String(),
                    'pengguna' => $l->source ?: 'Extension SIPD',
                    'aktivitas' => $l->data_type ?: $l->action,
                    'status' => $l->status,
                    'hasil' => $l->message ?: "{$l->processed_count} data diproses",
                    'processed_count' => (int) $l->processed_count,
                ];
            }
        }
        if (Schema::hasTable('activity_logs')) {
            $actLogs = ActivityLog::where(function ($q) use ($tahun) {
                $q->where('tahun_anggaran', $tahun)->orWhereNull('tahun_anggaran');
            })
                ->orderByDesc('id')
                ->limit(10)
                ->get(['id', 'category', 'title', 'description', 'status', 'actor', 'created_at']);

            foreach ($actLogs as $a) {
                $syncHistory[] = [
                    'id' => 'act-' . $a->id,
                    'waktu' => $a->created_at?->toIso8601String(),
                    'pengguna' => $a->actor ?: 'System',
                    'aktivitas' => $a->title,
                    'status' => $a->status ?: 'info',
                    'hasil' => $a->description ?: '-',
                    'processed_count' => null,
                ];
            }
        }
        usort($syncHistory, fn ($a, $b) => strcmp((string) ($b['waktu'] ?? ''), (string) ($a['waktu'] ?? '')));
        $syncHistory = array_slice($syncHistory, 0, 20);

        return [
            'sources' => $sources,
            'skpds' => $skpdList,
            'sumber_danas' => $sumberDanas,
            'sync_history' => $syncHistory,
        ];
    }

    /**
     * Ambil ringkasan perbandingan tingkat SKPD untuk Source A (Sebelum) vs Source B (Sesudah).
     */
    public function getPerbupSummary(Request $request)
    {
        $tahun = (int) $request->query('tahun_anggaran', date('Y'));
        $sourceA = (string) $request->query('source_a', 'live');
        $sourceB = (string) $request->query('source_b', 'live');
        $sumberDana = trim((string) $request->query('sumber_dana', 'all'));

        $ver = ($sourceA === 'live' || $sourceB === 'live') ? SystemLogService::getCacheVersion() : 'static';
        $cacheKey = 'laporan_perbup_summary:' . md5("{$ver}|{$tahun}|{$sourceA}|{$sourceB}|{$sumberDana}");
        $ttl = ($ver === 'static') ? now()->addHours(12) : now()->addMinutes(30);

        $payload = $this->rememberReportCache($cacheKey, $ttl, function () use ($tahun, $sourceA, $sourceB, $sumberDana) {
            $rowsA = $this->fetchSkpdSummaryForSource($sourceA, $tahun, $sumberDana);
            $rowsB = $this->fetchSkpdSummaryForSource($sourceB, $tahun, $sumberDana);

            $allKeys = array_unique(array_merge(array_keys($rowsA), array_keys($rowsB)));
            sort($allKeys);

            $skpds = [];
            $grandA = 0.0;
            $grandB = 0.0;

            foreach ($allKeys as $key) {
                $a = $rowsA[$key] ?? null;
                $b = $rowsB[$key] ?? null;

                $totalA = (float) ($a['total'] ?? 0);
                $totalB = (float) ($b['total'] ?? 0);
                $selisih = $totalB - $totalA;

                $grandA += $totalA;
                $grandB += $totalB;

                $skpds[] = [
                    'kode_skpd' => $b['kode_skpd'] ?? $a['kode_skpd'] ?? $key,
                    'nama_skpd' => $b['nama_skpd'] ?? $a['nama_skpd'] ?? 'SKPD Tanpa Nama',
                    'total_a' => $totalA,
                    'total_b' => $totalB,
                    'selisih' => $selisih,
                    'persen' => $this->calcPercent($totalA, $totalB),
                    'sub_keg_a' => (int) ($a['sub_keg_count'] ?? 0),
                    'sub_keg_b' => (int) ($b['sub_keg_count'] ?? 0),
                    'rka_a' => (int) ($a['rka_count'] ?? 0),
                    'rka_b' => (int) ($b['rka_count'] ?? 0),
                    'status' => $this->resolveDiffStatus($totalA, $totalB, $a !== null, $b !== null),
                ];
            }

            usort($skpds, fn ($a, $b) => strnatcasecmp($a['kode_skpd'], $b['kode_skpd']));

            $anomalies = $this->detectAnomaliesForSource($sourceB, $tahun);

            return [
                'summary' => [
                    'total_a' => $grandA,
                    'total_b' => $grandB,
                    'selisih' => $grandB - $grandA,
                    'persen' => $this->calcPercent($grandA, $grandB),
                    'jumlah_skpd' => count($skpds),
                ],
                'skpds' => $skpds,
                'anomalies' => $anomalies,
            ];
        });

        return response()->json([
            'status' => 'success',
            'data' => $payload,
        ], 200, [], JSON_INVALID_UTF8_SUBSTITUTE);
    }

    /**
     * Ambil pohon perbandingan hierarki 8 level:
     * SKPD -> Program -> Kegiatan -> Sub Kegiatan -> Belanja -> # -> - -> Keterangan (Spesifikasi)
     */
    public function getPerbupTree(Request $request)
    {
        $tahun = (int) $request->query('tahun_anggaran', date('Y'));
        $sourceA = (string) $request->query('source_a', 'live');
        $sourceB = (string) $request->query('source_b', 'live');
        $kodeSkpd = trim((string) $request->query('kode_skpd', 'all'));
        $namaSkpd = trim((string) $request->query('nama_skpd', ''));
        $sumberDana = trim((string) $request->query('sumber_dana', 'all'));

        $ver = ($sourceA === 'live' || $sourceB === 'live') ? SystemLogService::getCacheVersion() : 'static';
        $cacheKey = 'laporan_perbup_tree_v11:' . md5("{$ver}|{$tahun}|{$sourceA}|{$sourceB}|{$kodeSkpd}|{$namaSkpd}|{$sumberDana}");
        $ttl = ($ver === 'static') ? now()->addHours(12) : now()->addMinutes(30);

        $tree = $this->rememberReportCache($cacheKey, $ttl, function () use ($sourceA, $sourceB, $tahun, $kodeSkpd, $namaSkpd, $sumberDana) {
            $dataA = $this->fetchHierarchicalRows($sourceA, $tahun, $kodeSkpd, $namaSkpd, $sumberDana);
            $dataB = $this->fetchHierarchicalRows($sourceB, $tahun, $kodeSkpd, $namaSkpd, $sumberDana);
            return $this->buildComparisonTree($dataA, $dataB);
        });

        return response()->json([
            'status' => 'success',
            'data' => $tree,
        ], 200, [], JSON_INVALID_UTF8_SUBSTITUTE);
    }

    protected function fetchSkpdSummaryForSource(string $source, int $tahun, string $sumberDana): array
    {
        $isPosting = str_starts_with($source, 'posting:');
        $postingId = $isPosting ? (int) substr($source, 8) : null;

        if ($isPosting && $postingId > 0) {
            $subQuery = DB::table('posting_sub_keg_bl')->where('posting_id', $postingId);
            $rkaQuery = DB::table('posting_rka')->where('posting_id', $postingId);
        } else {
            $subQuery = DB::table('data_sub_keg_bl')->where('tahun_anggaran', $tahun)->where('active', 1);
            $rkaQuery = DB::table('data_rka')->where('tahun_anggaran', $tahun)->where('active', 1);
        }

        $subRows = $subQuery
            ->select('id_skpd', 'kode_skpd', 'nama_skpd', 'kode_sub_skpd', 'nama_sub_skpd', 'kode_sbl', 'nama_dana')
            ->get();

        $subDanaMap = [];
        $skpdInfo = [];
        $subCountPerSkpd = [];

        foreach ($subRows as $sub) {
            $unit = $this->resolveReportUnit($sub);
            if ($unit === null) {
                continue;
            }
            $key = $unit['key'];
            $skpdInfo[$key] = [
                'kode_skpd' => $unit['kode'],
                'nama_skpd' => $unit['nama'],
            ];
            $subCountPerSkpd[$key] = ($subCountPerSkpd[$key] ?? 0) + 1;
            if (!empty($sub->kode_sbl)) {
                $subDanaMap[$sub->kode_sbl] = [
                    'skpd_key' => $key,
                    'nama_dana' => trim((string) ($sub->nama_dana ?? '')),
                ];
            }
        }

        // Agregasi di SQL agar tidak memuat ribuan baris RKA ke memori PHP
        $rkaRows = $rkaQuery
            ->selectRaw("kode_sbl, COALESCE(NULLIF(TRIM(nama_dana), ''), '') as rka_dana, COALESCE(SUM(total_harga), 0) as total_harga, COUNT(*) as jml")
            ->groupBy('kode_sbl', 'rka_dana')
            ->get();

        $totals = [];
        $rkaCounts = [];

        foreach ($rkaRows as $r) {
            $meta = $subDanaMap[$r->kode_sbl] ?? null;
            if (!$meta) {
                continue;
            }
            $dana = trim((string) ($r->rka_dana ?? '')) ?: $meta['nama_dana'];
            if ($sumberDana !== '' && $sumberDana !== 'all') {
                if (strcasecmp($dana, $sumberDana) !== 0) {
                    continue;
                }
            }
            $key = $meta['skpd_key'];
            $totals[$key] = ($totals[$key] ?? 0.0) + (float) ($r->total_harga ?? 0);
            $rkaCounts[$key] = ($rkaCounts[$key] ?? 0) + (int) ($r->jml ?? 0);
        }

        $result = [];
        foreach ($skpdInfo as $key => $info) {
            $totalVal = (float) ($totals[$key] ?? 0.0);
            $rkaCountVal = (int) ($rkaCounts[$key] ?? 0);
            if ($sumberDana !== '' && $sumberDana !== 'all' && $rkaCountVal === 0) {
                continue;
            }
            $result[$key] = [
                'kode_skpd' => $info['kode_skpd'],
                'nama_skpd' => $info['nama_skpd'],
                'total' => $totalVal,
                'sub_keg_count' => $subCountPerSkpd[$key] ?? 0,
                'rka_count' => $rkaCountVal,
            ];
        }

        return $result;
    }

    protected function fetchHierarchicalRows(string $source, int $tahun, string $kodeSkpd, string $namaSkpd, string $sumberDana): array
    {
        $isPosting = str_starts_with($source, 'posting:');
        $postingId = $isPosting ? (int) substr($source, 8) : null;

        if ($isPosting && $postingId > 0) {
            $subQuery = DB::table('posting_sub_keg_bl')->where('posting_id', $postingId);
            $rkaQuery = DB::table('posting_rka')->where('posting_id', $postingId);
        } else {
            $subQuery = DB::table('data_sub_keg_bl')->where('tahun_anggaran', $tahun)->where('active', 1);
            $rkaQuery = DB::table('data_rka')->where('tahun_anggaran', $tahun)->where('active', 1);
        }

        if ($namaSkpd !== '' && $namaSkpd !== 'all') {
            $lowerNama = mb_strtolower($namaSkpd);
            if ($this->isRsudName($namaSkpd)) {
                $subQuery->where(function ($q) use ($lowerNama) {
                    $q->whereRaw('LOWER(TRIM(nama_sub_skpd)) = ?', [$lowerNama])
                        ->orWhereRaw('LOWER(TRIM(nama_skpd)) = ?', [$lowerNama]);
                });
            } elseif ($lowerNama === 'dinas kesehatan') {
                $subQuery->where(function ($q) {
                    $q->whereRaw("LOWER(TRIM(nama_skpd)) = 'dinas kesehatan'")
                        ->orWhereRaw("LOWER(COALESCE(nama_skpd, '')) LIKE '%puskesmas%'")
                        ->orWhereRaw("LOWER(COALESCE(nama_sub_skpd, '')) LIKE '%puskesmas%'");
                })
                    ->whereRaw("LOWER(COALESCE(nama_sub_skpd, '')) NOT LIKE '%rsud%'")
                    ->whereRaw("LOWER(COALESCE(nama_sub_skpd, '')) NOT LIKE '%rumah sakit%'")
                    ->whereRaw("LOWER(COALESCE(nama_skpd, '')) NOT LIKE '%rsud%'")
                    ->whereRaw("LOWER(COALESCE(nama_skpd, '')) NOT LIKE '%rumah sakit%'");
            } else {
                $subQuery->whereRaw('LOWER(TRIM(nama_skpd)) = ?', [$lowerNama])
                    ->whereRaw("LOWER(COALESCE(nama_sub_skpd, '')) NOT LIKE '%rsud%'")
                    ->whereRaw("LOWER(COALESCE(nama_sub_skpd, '')) NOT LIKE '%rumah sakit%'");
            }
        } elseif ($kodeSkpd !== '' && $kodeSkpd !== 'all') {
            $subQuery->where(function ($q) use ($kodeSkpd) {
                $q->where('kode_skpd', $kodeSkpd)
                    ->orWhere('kode_sub_skpd', $kodeSkpd);
            });
        }

        $subs = $subQuery->get([
            'id_skpd', 'kode_skpd', 'nama_skpd',
            'kode_sub_skpd', 'nama_sub_skpd',
            'kode_program', 'nama_program',
            'kode_giat', 'nama_giat',
            'kode_sub_giat', 'nama_sub_giat',
            'kode_sbl', 'pagu', 'nama_dana',
        ]);

        if ($subs->isEmpty()) {
            return [];
        }

        $sblList = $subs->pluck('kode_sbl')->filter()->unique()->values()->all();
        $subBySbl = [];
        foreach ($subs as $s) {
            if (!empty($s->kode_sbl)) {
                $subBySbl[$s->kode_sbl] = $s;
            }
        }

        $rkaRows = collect();
        if (!empty($sblList)) {
            foreach (array_chunk($sblList, 500) as $chunk) {
                $chunkRows = (clone $rkaQuery)
                    ->whereIn('kode_sbl', $chunk)
                    ->orderByDesc('total_harga')
                    ->orderBy('koefisien')
                    ->orderBy('satuan')
                    ->orderBy('id')
                    ->get([
                        'id_rinci_sub_bl', 'id_unik', 'kode_sbl',
                        'kode_akun', 'nama_akun',
                        'kode_standar_harga', 'nama_standar_harga',
                        'nama_komponen', 'spek_komponen',
                        'koefisien', 'volume', 'satuan',
                        'harga_satuan', 'total_harga', 'rincian',
                        'id_dana', 'nama_dana',
                        'subs_bl_teks', 'ket_bl_teks',
                    ]);
                $rkaRows = $rkaRows->concat($chunkRows);
            }
        }

        $rows = [];
        $sblWithRka = [];
        $itemOccurrence = [];

        foreach ($rkaRows as $r) {
            $sub = $subBySbl[$r->kode_sbl] ?? null;
            if (!$sub) {
                continue;
            }
            $dana = trim((string) ($r->nama_dana ?? '')) ?: trim((string) ($sub->nama_dana ?? '')) ?: 'Belum Ditentukan';
            if ($sumberDana !== '' && $sumberDana !== 'all' && strcasecmp($dana, $sumberDana) !== 0) {
                continue;
            }

            $sblWithRka[$r->kode_sbl] = true;
            $komponen = trim((string) ($r->nama_komponen ?? '')) ?: trim((string) ($r->nama_standar_harga ?? '')) ?: 'Komponen Belanja';
            $spek = trim((string) ($r->spek_komponen ?? ''));
            $koef = trim((string) ($r->koefisien ?? ''));
            if ($koef === '' && !empty($r->volume)) {
                $koef = trim((string) $r->volume . ' ' . (string) ($r->satuan ?? ''));
            }

            $paketRaw = trim((string) ($r->subs_bl_teks ?? '')) ?: 'Tanpa Paket / Umum';
            $ketRaw = trim((string) ($r->ket_bl_teks ?? '')) ?: 'Tanpa Keterangan';
            $subNorm = $this->normalizeHierarchyKey((string) ($sub->kode_sub_giat ?? ''), (string) ($sub->nama_sub_giat ?? ''));
            $occBucket = $subNorm . '|' . ($r->kode_akun ?? '') . '|' . $this->normalizeLabelKey($paketRaw) . '|' . $this->normalizeLabelKey($ketRaw) . '|' . mb_strtolower($komponen . '|' . $spek);
            $itemOccurrence[$occBucket] = ($itemOccurrence[$occBucket] ?? 0) + 1;
            $itemKey = 'item:' . md5($occBucket . '#' . $itemOccurrence[$occBucket]);

            $unit = $this->resolveReportUnit($sub);
            $rows[] = [
                'kode_skpd' => $unit ? $unit['kode'] : trim((string) ($sub->kode_skpd ?? '')),
                'nama_skpd' => $unit ? $unit['nama'] : trim((string) ($sub->nama_skpd ?? '')),
                'kode_sub_skpd' => trim((string) ($sub->kode_sub_skpd ?? '')),
                'nama_sub_skpd' => trim((string) ($sub->nama_sub_skpd ?? '')),
                'kode_program' => trim((string) ($sub->kode_program ?? '')),
                'nama_program' => trim((string) ($sub->nama_program ?? '')),
                'kode_giat' => trim((string) ($sub->kode_giat ?? '')),
                'nama_giat' => trim((string) ($sub->nama_giat ?? '')),
                'kode_sub_giat' => trim((string) ($sub->kode_sub_giat ?? '')),
                'nama_sub_giat' => trim((string) ($sub->nama_sub_giat ?? '')),
                'kode_akun' => trim((string) ($r->kode_akun ?? '')) ?: '0.0.00.00.000.00000',
                'nama_akun' => $this->cleanAkunName((string) ($r->nama_akun ?? ''), (string) ($r->kode_akun ?? '')),
                'paket' => trim((string) ($r->subs_bl_teks ?? '')) ?: 'Tanpa Paket / Umum',
                'keterangan_group' => trim((string) ($r->ket_bl_teks ?? '')) ?: 'Tanpa Keterangan',
                'item_key' => $itemKey,
                'nama_komponen' => $komponen,
                'spek_komponen' => $spek,
                'koefisien' => $koef ?: '-',
                'satuan' => trim((string) ($r->satuan ?? '')) ?: '-',
                'harga_satuan' => (float) ($r->harga_satuan ?? 0),
                'total_harga' => (float) ($r->total_harga ?? ($r->rincian ?? 0)),
                'sumber_dana' => $dana,
            ];
        }

        // Sertakan sub kegiatan yang belum punya rincian RKA (jika tidak sedang memfilter sumber dana spesifik)
        if ($sumberDana === '' || $sumberDana === 'all') {
            foreach ($subs as $sub) {
                if (isset($sblWithRka[$sub->kode_sbl])) {
                    continue;
                }
                if ((float) ($sub->pagu ?? 0) <= 0) {
                    continue;
                }
                $dana = trim((string) ($sub->nama_dana ?? '')) ?: 'Belum Ditentukan';
                $unit = $this->resolveReportUnit($sub);
                $rows[] = [
                    'kode_skpd' => $unit ? $unit['kode'] : trim((string) ($sub->kode_skpd ?? '')),
                    'nama_skpd' => $unit ? $unit['nama'] : trim((string) ($sub->nama_skpd ?? '')),
                    'kode_sub_skpd' => trim((string) ($sub->kode_sub_skpd ?? '')),
                    'nama_sub_skpd' => trim((string) ($sub->nama_sub_skpd ?? '')),
                    'kode_program' => trim((string) ($sub->kode_program ?? '')),
                    'nama_program' => trim((string) ($sub->nama_program ?? '')),
                    'kode_giat' => trim((string) ($sub->kode_giat ?? '')),
                    'nama_giat' => trim((string) ($sub->nama_giat ?? '')),
                    'kode_sub_giat' => trim((string) ($sub->kode_sub_giat ?? '')),
                    'nama_sub_giat' => trim((string) ($sub->nama_sub_giat ?? '')),
                    'kode_akun' => '-',
                    'nama_akun' => 'Belum Ada Rincian Belanja (Pagu Sub Kegiatan)',
                    'paket' => 'Pagu Sub Kegiatan',
                    'keterangan_group' => 'Belum dirinci',
                    'item_key' => 'subpagu:' . $sub->kode_sbl,
                    'nama_komponen' => 'Pagu Indikatif Sub Kegiatan',
                    'spek_komponen' => '',
                    'koefisien' => '-',
                    'satuan' => '-',
                    'harga_satuan' => (float) ($sub->pagu ?? 0),
                    'total_harga' => (float) ($sub->pagu ?? 0),
                    'sumber_dana' => $dana,
                ];
            }
        }

        return $rows;
    }

    protected function buildComparisonTree(array $rowsA, array $rowsB): array
    {
        $tree = [];

        $ingest = function (array $rows, string $side) use (&$tree) {
            foreach ($rows as $r) {
                $skpdKey = $r['nama_skpd'] ? mb_strtolower($r['nama_skpd']) : $r['kode_skpd'];
                $progKey = $this->normalizeHierarchyKey($r['kode_program'], $r['nama_program']);
                $giatKey = $this->normalizeHierarchyKey($r['kode_giat'], $r['nama_giat']);
                $subUnitPrefix = ($skpdKey === 'dinas kesehatan' && $r['nama_sub_skpd']) ? mb_strtolower($r['nama_sub_skpd']) . '|' : '';
                $subKey = $subUnitPrefix . $this->normalizeHierarchyKey($r['kode_sub_giat'], $r['nama_sub_giat']);
                $akunKey = $r['kode_akun'];
                $paketKey = $this->normalizeLabelKey($r['paket']);
                $ketKey = $this->normalizeLabelKey($r['keterangan_group']);
                $itemKey = $r['item_key'];

                if (!isset($tree[$skpdKey])) {
                    $tree[$skpdKey] = [
                        'level' => 'skpd',
                        'kode' => $r['kode_skpd'],
                        'nama' => $r['nama_skpd'] ?: 'SKPD Tanpa Nama',
                        'total_a' => 0.0,
                        'total_b' => 0.0,
                        'children' => [],
                    ];
                }
                if ($side === 'b' && !empty($r['kode_skpd'])) {
                    $tree[$skpdKey]['kode'] = $r['kode_skpd'];
                }
                $tree[$skpdKey]["total_{$side}"] += $r['total_harga'];

                $progNode = &$tree[$skpdKey]['children'];
                if (!isset($progNode[$progKey])) {
                    $progNode[$progKey] = [
                        'level' => 'program',
                        'kode' => $r['kode_program'],
                        'nama' => $r['nama_program'] ?: 'Program Tanpa Nama',
                        'total_a' => 0.0,
                        'total_b' => 0.0,
                        'children' => [],
                    ];
                }
                $progNode[$progKey]["total_{$side}"] += $r['total_harga'];

                $giatNode = &$progNode[$progKey]['children'];
                if (!isset($giatNode[$giatKey])) {
                    $giatNode[$giatKey] = [
                        'level' => 'kegiatan',
                        'kode' => $r['kode_giat'],
                        'nama' => $r['nama_giat'] ?: 'Kegiatan Tanpa Nama',
                        'total_a' => 0.0,
                        'total_b' => 0.0,
                        'children' => [],
                    ];
                }
                $giatNode[$giatKey]["total_{$side}"] += $r['total_harga'];

                $subNode = &$giatNode[$giatKey]['children'];
                if (!isset($subNode[$subKey])) {
                    $subLabel = $r['nama_sub_giat'] ?: 'Sub Kegiatan Tanpa Nama';
                    if ($r['nama_sub_skpd'] && $r['nama_sub_skpd'] !== $r['nama_skpd']) {
                        $subLabel .= " ({$r['nama_sub_skpd']})";
                    }
                    $subNode[$subKey] = [
                        'level' => 'sub_kegiatan',
                        'kode' => $r['kode_sub_giat'],
                        'nama' => $subLabel,
                        'total_a' => 0.0,
                        'total_b' => 0.0,
                        'children' => [],
                    ];
                }
                $subNode[$subKey]["total_{$side}"] += $r['total_harga'];

                $akunNode = &$subNode[$subKey]['children'];
                if (!isset($akunNode[$akunKey])) {
                    $akunNode[$akunKey] = [
                        'level' => 'belanja',
                        'kode' => $r['kode_akun'],
                        'nama' => $r['nama_akun'],
                        'total_a' => 0.0,
                        'total_b' => 0.0,
                        'children' => [],
                    ];
                }
                $akunNode[$akunKey]["total_{$side}"] += $r['total_harga'];

                $paketNode = &$akunNode[$akunKey]['children'];
                if (!isset($paketNode[$paketKey])) {
                    $paketNode[$paketKey] = [
                        'level' => 'paket',
                        'kode' => '#',
                        'nama' => $r['paket'],
                        'sumber_dana_set' => [],
                        'total_a' => 0.0,
                        'total_b' => 0.0,
                        'children' => [],
                    ];
                }
                $paketNode[$paketKey]["total_{$side}"] += $r['total_harga'];
                $paketNode[$paketKey]['sumber_dana_set'][$r['sumber_dana']] = true;

                $ketNode = &$paketNode[$paketKey]['children'];
                if (!isset($ketNode[$ketKey])) {
                    $ketNode[$ketKey] = [
                        'level' => 'keterangan_group',
                        'kode' => '-',
                        'nama' => $r['keterangan_group'],
                        'total_a' => 0.0,
                        'total_b' => 0.0,
                        'children' => [],
                    ];
                }
                $ketNode[$ketKey]["total_{$side}"] += $r['total_harga'];

                $itemNode = &$ketNode[$ketKey]['children'];
                if (!isset($itemNode[$itemKey])) {
                    $itemNode[$itemKey] = [
                        'level' => 'keterangan',
                        'key' => $itemKey,
                        'nama' => $r['nama_komponen'],
                        'spesifikasi' => $r['spek_komponen'],
                        'koefisien_a' => null,
                        'koefisien_b' => null,
                        'satuan_a' => null,
                        'satuan_b' => null,
                        'harga_satuan_a' => 0.0,
                        'harga_satuan_b' => 0.0,
                        'sumber_dana_a' => null,
                        'sumber_dana_b' => null,
                        'total_a' => 0.0,
                        'total_b' => 0.0,
                    ];
                }

                $itemNode[$itemKey]["total_{$side}"] += $r['total_harga'];
                $itemNode[$itemKey]["koefisien_{$side}"] = $r['koefisien'];
                $itemNode[$itemKey]["satuan_{$side}"] = $r['satuan'];
                $itemNode[$itemKey]["harga_satuan_{$side}"] = $r['harga_satuan'];
                $itemNode[$itemKey]["sumber_dana_{$side}"] = $r['sumber_dana'];
            }
        };

        $ingest($rowsA, 'a');
        $ingest($rowsB, 'b');

        return $this->finalizeTree($tree);
    }

    protected function finalizeTree(array $nodes): array
    {
        ksort($nodes);
        $list = [];
        foreach ($nodes as $node) {
            $a = (float) $node['total_a'];
            $b = (float) $node['total_b'];
            $node['selisih'] = $b - $a;
            $node['persen'] = $this->calcPercent($a, $b);
            $node['status'] = $this->resolveDiffStatus($a, $b, $a > 0 || isset($node['koefisien_a']), $b > 0 || isset($node['koefisien_b']));

            // Deteksi perubahan koefisien, satuan, atau harga satuan meski total pagu sama (kecuali sumber dana, pagu 0/0, atau field kosong '-')
            if ($node['status'] === 'tetap' && ($node['level'] ?? '') === 'keterangan' && ($a > 0.01 || $b > 0.01)) {
                $normAttr = fn ($v) => mb_strtolower(trim((string) preg_replace('/[\s\x{00A0}]+/u', ' ', (string) ($v ?? '-'))));
                $koefA = $normAttr($node['koefisien_a'] ?? '-');
                $koefB = $normAttr($node['koefisien_b'] ?? '-');
                $satA = $normAttr($node['satuan_a'] ?? '-');
                $satB = $normAttr($node['satuan_b'] ?? '-');
                $hargaA = (float) ($node['harga_satuan_a'] ?? 0);
                $hargaB = (float) ($node['harga_satuan_b'] ?? 0);

                $reasons = [];
                if ($koefA !== '-' && $koefB !== '-' && $koefA !== $koefB) {
                    $reasons[] = "Koefisien: {$node['koefisien_a']} -> {$node['koefisien_b']}";
                }
                if ($satA !== '-' && $satB !== '-' && $satA !== $satB) {
                    $isCombinedUnitMatch = str_starts_with($satA, $satB . ' x ') || str_starts_with($satB, $satA . ' x ');
                    if (!$isCombinedUnitMatch) {
                        $reasons[] = "Satuan: {$node['satuan_a']} -> {$node['satuan_b']}";
                    }
                }
                if ($hargaA > 0.01 && $hargaB > 0.01 && abs($hargaA - $hargaB) > 0.01) {
                    $reasons[] = "Harga Satuan: " . number_format($hargaA, 0, ',', '.') . " -> " . number_format($hargaB, 0, ',', '.');
                }

                if (!empty($reasons)) {
                    $node['status'] = 'berubah_rincian';
                    $node['change_reasons'] = $reasons;
                }
            }

            if (isset($node['sumber_dana_set'])) {
                $node['sumber_dana'] = implode(', ', array_keys($node['sumber_dana_set']));
                unset($node['sumber_dana_set']);
            }

            if (isset($node['children'])) {
                $node['children'] = $this->finalizeTree($node['children']);
                // Update status jika ada perubahan di dalam child walaupun total sama
                if ($node['status'] === 'tetap') {
                    foreach ($node['children'] as $child) {
                        if ($child['status'] !== 'tetap') {
                            $node['status'] = 'berubah_rincian';
                            break;
                        }
                    }
                }
            }

            $list[] = $node;
        }

        usort($list, function ($a, $b) {
            $kodeA = (string) ($a['kode'] ?? '');
            $kodeB = (string) ($b['kode'] ?? '');
            if ($kodeA !== '' && $kodeA !== '#' && $kodeA !== '-' && $kodeB !== '' && $kodeB !== '#' && $kodeB !== '-') {
                $cmp = strnatcasecmp($kodeA, $kodeB);
                if ($cmp !== 0) {
                    return $cmp;
                }
            }
            return strnatcasecmp((string) ($a['nama'] ?? ''), (string) ($b['nama'] ?? ''));
        });

        return $list;
    }

    protected function cleanAkunName(string $namaAkun, string $kodeAkun): string
    {
        $clean = trim(str_replace($kodeAkun, '', $namaAkun));
        return $clean !== '' ? $clean : ($namaAkun ?: 'Belanja');
    }

    /**
     * Normalisasi key Program/Kegiatan/Sub Kegiatan agar kode berawalan X.XX.*
     * tetap cocok dengan kode urusan (misal 1.02.*) antar tahapan SIPD.
     */
    protected function normalizeHierarchyKey(string $kode, string $nama): string
    {
        $kodeSuffix = preg_replace('/^[A-Za-z0-9]+\.[A-Za-z0-9]+\./', '', trim($kode));
        $cleanNama = preg_replace('/^[A-Za-z0-9]+\.[A-Za-z0-9]+(?:\.[A-Za-z0-9]+)+\s+/', '', trim($nama));
        $normKode = mb_strtolower(trim((string) $kodeSuffix));
        $normNama = mb_strtolower(trim((string) $cleanNama));

        if ($normKode !== '' && $normNama !== '') {
            return $normKode . '|' . $normNama;
        }
        return $normKode !== '' ? $normKode : $normNama;
    }

    /**
     * Normalisasi label Paket [#] dan Keterangan [-] agar perbedaan spasi atau awalan [#]/[-]
     * tidak memecah kelompok yang sama menjadi 2 baris.
     */
    protected function normalizeLabelKey(string $text): string
    {
        $stripped = preg_replace('/^\[\s*[#-]\s*\]\s*/', '', trim($text));
        $collapsed = preg_replace('/\s+/', ' ', (string) $stripped);
        return mb_strtolower(trim((string) $collapsed));
    }

    protected function calcPercent(float $a, float $b): ?float
    {
        if (abs($a) < 0.0001) {
            return abs($b) > 0.0001 ? 100.0 : 0.0;
        }
        return round((($b - $a) / $a) * 100, 2);
    }

    protected function resolveDiffStatus(float $a, float $b, bool $existsA, bool $existsB): string
    {
        if (!$existsA && $existsB) {
            return 'baru';
        }
        if ($existsA && !$existsB) {
            return 'dihapus';
        }
        $diff = $b - $a;
        if ($diff > 0.01) {
            return 'bertambah';
        }
        if ($diff < -0.01) {
            return 'berkurang';
        }
        return 'tetap';
    }

    /**
     * Tentukan unit SKPD untuk laporan:
     * Dinas Kesehatan + Puskesmas digabung menjadi satu (Dinas Kesehatan),
     * sedangkan RSUD dipisah sebagai unit SKPD tersendiri.
     */
    protected function resolveReportUnit(object $row): ?array
    {
        $kodeSkpd = trim((string) ($row->kode_skpd ?? ''));
        $namaSkpd = trim((string) ($row->nama_skpd ?? ''));
        $kodeSub = trim((string) ($row->kode_sub_skpd ?? ''));
        $namaSub = trim((string) ($row->nama_sub_skpd ?? ''));

        if ($namaSub !== '' && $this->isRsudName($namaSub)) {
            return [
                'key' => mb_strtolower($namaSub),
                'kode' => $kodeSub !== '' ? $kodeSub : $kodeSkpd,
                'nama' => $namaSub,
            ];
        }

        if ($namaSkpd !== '' && $this->isRsudName($namaSkpd)) {
            return [
                'key' => mb_strtolower($namaSkpd),
                'kode' => $kodeSkpd !== '' ? $kodeSkpd : $kodeSub,
                'nama' => $namaSkpd,
            ];
        }

        if (
            ($namaSkpd !== '' && stripos($namaSkpd, 'puskesmas') !== false) ||
            ($namaSub !== '' && stripos($namaSub, 'puskesmas') !== false)
        ) {
            return [
                'key' => 'dinas kesehatan',
                'kode' => $kodeSkpd !== '' ? $kodeSkpd : '1.02.0.00.0.00.02.0000',
                'nama' => 'Dinas Kesehatan',
            ];
        }

        if ($kodeSkpd === '' && $namaSkpd === '') {
            return null;
        }

        return [
            'key' => $namaSkpd !== '' ? mb_strtolower($namaSkpd) : $kodeSkpd,
            'kode' => $kodeSkpd !== '' ? $kodeSkpd : $namaSkpd,
            'nama' => $namaSkpd !== '' ? $namaSkpd : $kodeSkpd,
        ];
    }

    protected function isRsudName(string $name): bool
    {
        return stripos($name, 'rsud') !== false || stripos($name, 'rumah sakit') !== false;
    }

    /**
     * Gunakan file cache agar payload SKPD besar tidak terbentur max_allowed_packet MySQL,
     * dan tetap fallback ke eksekusi langsung jika cache gagal ditulis.
     */
    protected function rememberReportCache(string $key, \DateTimeInterface $ttl, \Closure $callback)
    {
        try {
            return Cache::store('file')->remember($key, $ttl, $callback);
        } catch (\Throwable $e) {
            return $callback();
        }
    }

    /**
     * Deteksi Anomali: ketidaksesuaian antara pagu level sub kegiatan dengan akumulasi rincian RKA.
     */
    protected function detectAnomaliesForSource(string $source, int $tahun): array
    {
        $isPosting = str_starts_with($source, 'posting:');
        $postingId = $isPosting ? (int) substr($source, 8) : null;

        if ($isPosting && $postingId > 0) {
            $subs = DB::table('posting_sub_keg_bl')
                ->where('posting_id', $postingId)
                ->get(['kode_sbl', 'kode_skpd', 'nama_skpd', 'kode_sub_skpd', 'nama_sub_skpd', 'kode_sub_giat', 'nama_sub_giat', 'pagu']);

            $rkaSums = DB::table('posting_rka')
                ->where('posting_id', $postingId)
                ->selectRaw('kode_sbl, COALESCE(SUM(total_harga), 0) as total_rka, COUNT(*) as jml_rka')
                ->groupBy('kode_sbl')
                ->get()
                ->keyBy('kode_sbl');
        } else {
            $subs = DB::table('data_sub_keg_bl')
                ->where('tahun_anggaran', $tahun)
                ->where('active', 1)
                ->get(['kode_sbl', 'kode_skpd', 'nama_skpd', 'kode_sub_skpd', 'nama_sub_skpd', 'kode_sub_giat', 'nama_sub_giat', 'pagu']);

            $rkaSums = DB::table('data_rka')
                ->where('tahun_anggaran', $tahun)
                ->where('active', 1)
                ->selectRaw('kode_sbl, COALESCE(SUM(total_harga), 0) as total_rka, COUNT(*) as jml_rka')
                ->groupBy('kode_sbl')
                ->get()
                ->keyBy('kode_sbl');
        }

        $anomalies = [];
        foreach ($subs as $sub) {
            $pagu = (float) ($sub->pagu ?? 0);
            $rkaRow = $rkaSums[$sub->kode_sbl] ?? null;
            $totalRka = (float) ($rkaRow->total_rka ?? 0);
            $diff = $pagu - $totalRka;

            if (abs($diff) > 1) {
                $unit = $this->resolveReportUnit($sub);
                $anomalies[] = [
                    'kode_skpd' => $unit ? $unit['kode'] : ($sub->kode_skpd ?? ''),
                    'nama_skpd' => $unit ? $unit['nama'] : ($sub->nama_skpd ?? ''),
                    'kode_sub_giat' => $sub->kode_sub_giat ?? '',
                    'nama_sub_giat' => $sub->nama_sub_giat ?? '',
                    'pagu_induk' => $pagu,
                    'akumulasi_rka' => $totalRka,
                    'selisih' => $diff,
                    'jml_rka' => (int) ($rkaRow->jml_rka ?? 0),
                    'jenis' => $totalRka <= 0 && $pagu > 0 ? 'Rincian RKA Kosong' : 'Selisih Pagu vs Akumulasi RKA',
                ];
            }
        }

        usort($anomalies, fn ($a, $b) => abs($b['selisih']) <=> abs($a['selisih']));
        return array_slice($anomalies, 0, 100);
    }
}
