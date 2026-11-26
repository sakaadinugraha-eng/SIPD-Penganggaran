<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class SqlExportService
{
    /**
     * Kolom internal Laravel yang tidak perlu di-export agar file .sql ringkas.
     */
    private const EXCLUDED_COLUMNS = ['id', 'created_at', 'updated_at'];

    /**
     * Ambil ringkasan jumlah baris per tabel utama untuk tahun anggaran tertentu.
     *
     * @return array<string, int>
     */
    public function getExportSummary(int $tahunAnggaran): array
    {
        $counts = [];
        foreach (SqlImportService::ALLOWED_TABLES as $table) {
            $counts[$table] = (int) DB::table($table)
                ->where('tahun_anggaran', $tahunAnggaran)
                ->count();
        }

        return $counts;
    }

    /**
     * Stream dump SQL berisi statement INSERT untuk 4 tabel utama ke output PHP.
     */
    public function streamToOutput(int $tahunAnggaran): void
    {
        if (function_exists('set_time_limit')) {
            @set_time_limit(0);
        }

        DB::connection()->disableQueryLog();

        echo "-- ============================================================\n";
        echo "-- SIPD-Local Database Export\n";
        echo "-- Tahun Anggaran : {$tahunAnggaran}\n";
        echo '-- Tanggal Export : ' . now()->format('Y-m-d H:i:s') . "\n";
        echo "-- Tabel          : " . implode(', ', SqlImportService::ALLOWED_TABLES) . "\n";
        echo "-- ============================================================\n\n";
        echo "SET NAMES utf8mb4;\n\n";

        foreach (SqlImportService::ALLOWED_TABLES as $table) {
            $columns = array_values(array_diff(
                Schema::getColumnListing($table),
                self::EXCLUDED_COLUMNS
            ));

            if (empty($columns)) {
                continue;
            }

            $total = (int) DB::table($table)
                ->where('tahun_anggaran', $tahunAnggaran)
                ->count();

            echo "-- ------------------------------------------------------------\n";
            echo "-- Tabel `{$table}` ({$total} baris)\n";
            echo "-- ------------------------------------------------------------\n";

            if ($total === 0) {
                echo "-- (Kosong untuk Tahun Anggaran {$tahunAnggaran})\n\n";
                continue;
            }

            $colListSql = implode(', ', array_map(static fn (string $c): string => "`{$c}`", $columns));
            $selectCols = array_merge(['id'], $columns);

            DB::table($table)
                ->select($selectCols)
                ->where('tahun_anggaran', $tahunAnggaran)
                ->orderBy('id')
                ->chunkById(250, function ($rows) use ($table, $columns, $colListSql): void {
                    $tuples = [];
                    foreach ($rows as $row) {
                        $values = [];
                        foreach ($columns as $col) {
                            $values[] = $this->formatSqlValue($row->{$col} ?? null);
                        }
                        $tuples[] = '(' . implode(', ', $values) . ')';
                    }

                    if (!empty($tuples)) {
                        echo "INSERT INTO `{$table}` ({$colListSql}) VALUES\n";
                        echo implode(",\n", $tuples) . ";\n\n";
                    }

                    if (ob_get_level() > 0) {
                        @ob_flush();
                    }
                    flush();
                }, 'id');
        }
    }

    /**
     * Format nilai PHP menjadi literal SQL yang aman untuk parser SqlImportService.
     */
    private function formatSqlValue(mixed $value): string
    {
        if ($value === null) {
            return 'NULL';
        }

        if (is_int($value)) {
            return (string) $value;
        }

        if (is_float($value)) {
            $formatted = rtrim(rtrim(sprintf('%.4F', $value), '0'), '.');
            return $formatted === '-0' ? '0' : $formatted;
        }

        $str = (string) $value;
        $escaped = strtr($str, [
            '\\' => '\\\\',
            "'" => "\\'",
            "\0" => '\\0',
            "\n" => '\\n',
            "\r" => '\\r',
            "\t" => '\\t',
        ]);

        return "'{$escaped}'";
    }
}
