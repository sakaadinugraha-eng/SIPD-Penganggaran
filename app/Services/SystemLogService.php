<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\SyncLog;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;

class SystemLogService
{
    public const CACHE_VERSION_KEY = 'dashboard_stats_cache_version';

    public static function getCacheVersion(): int
    {
        try {
            return (int) Cache::get(self::CACHE_VERSION_KEY, 1);
        } catch (\Throwable $e) {
            return 1;
        }
    }

    public static function invalidateDashboardCache(): void
    {
        try {
            $next = self::getCacheVersion() + 1;
            Cache::put(self::CACHE_VERSION_KEY, $next, now()->addDays(7));
        } catch (\Throwable $e) {
            // Abaikan jika cache store tidak tersedia
        }
    }

    public static function logSync(array $data): void
    {
        try {
            if (!Schema::hasTable('sync_logs')) {
                return;
            }
            SyncLog::create([
                'action' => $data['action'] ?? 'unknown',
                'data_type' => $data['data_type'] ?? null,
                'tahun_anggaran' => isset($data['tahun_anggaran']) ? (int) $data['tahun_anggaran'] : null,
                'status' => $data['status'] ?? 'success',
                'processed_count' => (int) ($data['processed_count'] ?? 0),
                'failed_count' => (int) ($data['failed_count'] ?? 0),
                'message' => $data['message'] ?? null,
                'error_detail' => $data['error_detail'] ?? null,
                'source' => $data['source'] ?? 'extension',
                'ip_address' => $data['ip_address'] ?? null,
                'duration_ms' => isset($data['duration_ms']) ? (int) $data['duration_ms'] : null,
            ]);
            self::invalidateDashboardCache();
        } catch (\Throwable $e) {
            // Jangan gagalkan proses utama jika pencatatan log bermasalah
        }
    }

    public static function logActivity(array $data): void
    {
        try {
            if (!Schema::hasTable('activity_logs')) {
                return;
            }
            ActivityLog::create([
                'category' => $data['category'] ?? 'system',
                'title' => $data['title'] ?? 'Aktivitas Sistem',
                'description' => $data['description'] ?? null,
                'status' => $data['status'] ?? 'info',
                'tahun_anggaran' => isset($data['tahun_anggaran']) ? (int) $data['tahun_anggaran'] : null,
                'actor' => $data['actor'] ?? null,
            ]);
            self::invalidateDashboardCache();
        } catch (\Throwable $e) {
            // Jangan gagalkan proses utama jika pencatatan log bermasalah
        }
    }
}
