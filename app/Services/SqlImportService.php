<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use RuntimeException;

class SqlImportService
{
    /**
     * 10 tabel utama yang diizinkan untuk di-import dari dump SQL.
     */
    public const ALLOWED_TABLES = [
        'data_sub_keg_bl',
        'data_rka',
        'data_capaian_prog_sub_keg',
        'data_sub_keg_indikator',
        'data_pendapatan_skpd',
        'data_pendapatan',
        'data_pembiayaan_skpd',
        'data_pembiayaan',
        'data_akun',
        'data_sumber_dana',
    ];

    /**
     * Pemetaan nama kolom dari dump WP-SIPD ke skema sipd-local.
     */
    private const COLUMN_ALIASES = [
        'data_rka' => [
            'idbl' => 'id_bl',
            'idsubbl' => 'id_sub_bl',
        ],
        'data_capaian_prog_sub_keg' => [
            'idsubbl' => 'id_sub_bl',
        ],
        'data_sub_keg_indikator' => [
            'idsubbl' => 'id_sub_bl',
        ],
    ];

    /**
     * Nilai default jika kolom bernilai NULL pada dump SQL namun NOT NULL di skema lokal.
     */
    private const NON_NULL_DEFAULTS = [
        'data_sub_keg_bl' => [
            'pagu' => 0,
            'pagu_indikatif' => 0,
            'pagu_n_depan' => 0,
            'pagu_n2_depan' => 0,
            'waktu_awal' => 1,
            'waktu_akhir' => 12,
            'tahun_anggaran' => 2026,
            'active' => 1,
        ],
        'data_rka' => [
            'harga_satuan' => 0,
            'total_harga' => 0,
            'rincian' => 0,
            'pajak' => 0,
            'is_paket' => 0,
            'tahun_anggaran' => 2026,
            'active' => 1,
        ],
        'data_capaian_prog_sub_keg' => [
            'tahun_anggaran' => 2026,
            'active' => 1,
        ],
        'data_sub_keg_indikator' => [
            'tipe' => 'sub_kegiatan',
            'tahun_anggaran' => 2026,
            'active' => 1,
        ],
    ];

    /**
     * Batas panjang varchar pada skema lokal agar tidak gagal saat strict mode aktif.
     */
    private const VARCHAR_LIMITS = [
        'data_sub_keg_bl' => [
            'id_unik_sub_bl' => 255,
            'kode_skpd' => 100,
            'kode_sub_skpd' => 100,
            'kode_bidang_urusan' => 50,
            'kode_program' => 50,
            'kode_giat' => 50,
            'kode_sub_giat' => 50,
            'kode_bl' => 255,
            'kode_sbl' => 255,
            'satuan' => 100,
            'target_1' => 100,
        ],
        'data_rka' => [
            'id_unik' => 255,
            'kode_bl' => 255,
            'kode_sbl' => 255,
            'kode_akun' => 100,
            'kode_standar_harga' => 100,
            'koefisien' => 255,
            'volume' => 100,
            'satuan' => 100,
            'volum1' => 100,
            'sat1' => 100,
            'volum2' => 100,
            'sat2' => 100,
            'volum3' => 100,
            'sat3' => 100,
            'volum4' => 100,
            'sat4' => 100,
            'jenis_bl' => 100,
            'created_user' => 255,
            'createddate' => 20,
            'createdtime' => 20,
            'updated_user' => 255,
            'updateddate' => 20,
            'updatedtime' => 20,
        ],
        'data_capaian_prog_sub_keg' => [
            'kode_sbl' => 255,
            'targetcapaian' => 100,
            'targetcapaianteks' => 100,
            'satuancapaian' => 100,
        ],
        'data_sub_keg_indikator' => [
            'kode_sbl' => 255,
            'targetoutput' => 100,
            'targetoutputteks' => 100,
            'satuanoutput' => 100,
            'target_sub' => 100,
            'satuan_sub' => 100,
            'tipe' => 50,
        ],
    ];

    /**
     * Import 4 tabel utama dari file .sql dengan mode menimpa per tahun anggaran.
     *
     * @return array{counts: array<string, int>, skipped_tables: array<string, int>, pagu_synced_rows: int, tahun_anggaran: int, duration_ms: int}
     */
    public function importFromFile(string $filePath, bool $truncateFirst = true, int $tahunAnggaran = 2026): array
    {
        if (!is_file($filePath) || !is_readable($filePath)) {
            throw new RuntimeException("File SQL tidak ditemukan atau tidak dapat dibaca: {$filePath}");
        }

        $startTime = microtime(true);

        // Cache kolom aktual tiap tabel di database lokal
        $tableColumns = [];
        foreach (self::ALLOWED_TABLES as $table) {
            $tableColumns[$table] = array_flip(Schema::getColumnListing($table));
        }

        $counts = array_fill_keys(self::ALLOWED_TABLES, 0);
        $skippedTables = [];

        $handle = fopen($filePath, 'rb');
        if ($handle === false) {
            throw new RuntimeException('Gagal membuka stream file SQL.');
        }

        // Nonaktifkan query log agar hemat memori saat memproses puluhan ribu baris
        DB::connection()->disableQueryLog();

        if (function_exists('set_time_limit')) {
            @set_time_limit(0);
        }

        $clearedTables = [];
        $now = now()->format('Y-m-d H:i:s');

        try {
            $statementBuffer = '';
            $insideInsert = false;

            while (($line = fgets($handle)) !== false) {
                $trimmed = ltrim($line);

                if (!$insideInsert) {
                    // Lewati komentar dan baris kosong
                    if (
                        $trimmed === '' ||
                        str_starts_with($trimmed, '--') ||
                        str_starts_with($trimmed, '/*') ||
                        str_starts_with($trimmed, '#')
                    ) {
                        continue;
                    }

                    if (!preg_match('/^(?:INSERT|REPLACE)\s+(?:IGNORE\s+)?INTO\s+`?([a-zA-Z0-9_]+)`?/i', $trimmed, $m)) {
                        continue;
                    }

                    $targetTable = strtolower($m[1]);
                    if (!in_array($targetTable, self::ALLOWED_TABLES, true)) {
                        $skippedTables[$targetTable] = ($skippedTables[$targetTable] ?? 0) + 1;
                        continue;
                    }

                    $insideInsert = true;
                    $statementBuffer = $line;
                } else {
                    $statementBuffer .= $line;
                }

                // Cek apakah statement INSERT sudah berakhir dengan ';' di luar string literal
                if ($this->endsWithSemicolonOutsideQuotes($statementBuffer)) {
                    if ($truncateFirst && !isset($clearedTables[$targetTable])) {
                        $this->clearTableByYear($targetTable, $tahunAnggaran);
                        $clearedTables[$targetTable] = true;
                    }

                    $inserted = $this->processInsertStatement(
                        $statementBuffer,
                        $tableColumns,
                        $now,
                        $tahunAnggaran
                    );

                    foreach ($inserted as $tbl => $cnt) {
                        $counts[$tbl] = ($counts[$tbl] ?? 0) + $cnt;
                    }

                    $statementBuffer = '';
                    $insideInsert = false;
                }
            }

            // Jika file tidak diakhiri newline/semicolon tapi masih ada buffer valid
            if ($insideInsert && trim($statementBuffer) !== '') {
                if ($truncateFirst && isset($targetTable) && !isset($clearedTables[$targetTable])) {
                    $this->clearTableByYear($targetTable, $tahunAnggaran);
                    $clearedTables[$targetTable] = true;
                }

                $inserted = $this->processInsertStatement(
                    $statementBuffer,
                    $tableColumns,
                    $now,
                    $tahunAnggaran
                );

                foreach ($inserted as $tbl => $cnt) {
                    $counts[$tbl] = ($counts[$tbl] ?? 0) + $cnt;
                }
            }
        } finally {
            fclose($handle);
        }

        $paguSyncedRows = 0;
        if ($counts['data_sub_keg_bl'] > 0 && $counts['data_rka'] > 0) {
            $paguSyncedRows = $this->syncSubKegPaguFromRka($tahunAnggaran);
        }

        $durationMs = (int) round((microtime(true) - $startTime) * 1000);

        return [
            'counts' => $counts,
            'skipped_tables' => $skippedTables,
            'pagu_synced_rows' => $paguSyncedRows,
            'tahun_anggaran' => $tahunAnggaran,
            'duration_ms' => $durationMs,
        ];
    }

    /**
     * Sinkronkan kolom pagu pada data_sub_keg_bl agar sesuai dengan penjumlahan rincian di data_rka.
     */
    private function syncSubKegPaguFromRka(int $tahunAnggaran): int
    {
        return DB::update("
            UPDATE data_sub_keg_bl sk
            LEFT JOIN (
                SELECT kode_sbl, COALESCE(SUM(rincian), 0) AS total_rka
                FROM data_rka
                WHERE active = 1
                  AND tahun_anggaran = ?
                GROUP BY kode_sbl
            ) r ON r.kode_sbl = sk.kode_sbl
            SET sk.pagu = COALESCE(r.total_rka, 0)
            WHERE sk.active = 1
              AND sk.tahun_anggaran = ?
              AND sk.pagu <> COALESCE(r.total_rka, 0)
        ", [$tahunAnggaran, $tahunAnggaran]);
    }

    private function clearTableByYear(string $table, int $tahunAnggaran): void
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        try {
            DB::table($table)->where('tahun_anggaran', $tahunAnggaran)->delete();
        } finally {
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');
        }
    }

    /**
     * Parse satu statement INSERT INTO `table` (...) VALUES (...), (...); lalu insert per chunk.
     *
     * @param array<string, array<string, int>> $tableColumns
     * @return array<string, int>
     */
    private function processInsertStatement(string $sql, array $tableColumns, string $now, int $tahunAnggaran): array
    {
        // Cocokkan header INSERT ... VALUES saja agar tidak terkena batas pcre.backtrack_limit pada payload besar
        if (!preg_match(
            '/^\s*(?:INSERT|REPLACE)\s+(?:IGNORE\s+)?INTO\s+`?([a-zA-Z0-9_]+)`?\s*(?:\(([^)]+)\))?\s*VALUES\s*/is',
            $sql,
            $matches,
            PREG_OFFSET_CAPTURE
        )) {
            return [];
        }

        $table = strtolower($matches[1][0]);
        if (!isset($tableColumns[$table])) {
            return [];
        }

        $sourceColumns = [];
        if (!empty($matches[2][0])) {
            $rawCols = explode(',', $matches[2][0]);
            foreach ($rawCols as $col) {
                $sourceColumns[] = trim($col, " \t\n\r\0\x0B`\"");
            }
        } else {
            // Jika INSERT tanpa daftar kolom, gunakan urutan kolom lokal
            $sourceColumns = array_keys($tableColumns[$table]);
        }

        $valuesStart = $matches[0][1] + strlen($matches[0][0]);
        $valuesPart = rtrim(substr($sql, $valuesStart));
        if (str_ends_with($valuesPart, ';')) {
            $valuesPart = substr($valuesPart, 0, -1);
        }
        $rows = $this->parseValueTuples($valuesPart);
        if (empty($rows)) {
            return [];
        }

        $localCols = $tableColumns[$table];
        $aliases = self::COLUMN_ALIASES[$table] ?? [];
        $defaults = self::NON_NULL_DEFAULTS[$table] ?? [];
        $varcharLimits = self::VARCHAR_LIMITS[$table] ?? [];

        // Precompute mapping index sumber -> nama kolom lokal
        $indexToLocalCol = [];
        foreach ($sourceColumns as $idx => $srcCol) {
            $mapped = $aliases[$srcCol] ?? $srcCol;
            // Abaikan kolom 'id' agar auto_increment lokal tidak bentrok, atau biarkan?
            // Mempertahankan id atau membiarkan auto_increment: biarkan auto_increment agar bersih
            if ($mapped === 'id') {
                continue;
            }
            if (isset($localCols[$mapped])) {
                $indexToLocalCol[$idx] = $mapped;
            }
        }

        $batch = [];
        $totalInserted = 0;
        $chunkSize = 400;

        foreach ($rows as $rowValues) {
            $record = [];
            foreach ($indexToLocalCol as $idx => $localCol) {
                $val = $rowValues[$idx] ?? null;

                if ($val === null && array_key_exists($localCol, $defaults)) {
                    $val = $defaults[$localCol];
                }

                if (is_string($val) && isset($varcharLimits[$localCol])) {
                    $limit = $varcharLimits[$localCol];
                    if (mb_strlen($val, 'UTF-8') > $limit) {
                        $val = mb_substr($val, 0, $limit, 'UTF-8');
                    }
                }

                $record[$localCol] = $val;
            }

            // Pastikan kolom NOT NULL default terisi walau tidak ada di daftar kolom sumber
            foreach ($defaults as $defCol => $defVal) {
                if (!array_key_exists($defCol, $record) || $record[$defCol] === null) {
                    $record[$defCol] = $defVal;
                }
            }

            if (isset($localCols['tahun_anggaran'])) {
                $record['tahun_anggaran'] = $tahunAnggaran;
            }

            if (isset($localCols['created_at']) && !isset($record['created_at'])) {
                $record['created_at'] = $now;
            }
            if (isset($localCols['updated_at']) && !isset($record['updated_at'])) {
                $record['updated_at'] = $now;
            }

            $batch[] = $record;

            if (count($batch) >= $chunkSize) {
                DB::table($table)->insert($batch);
                $totalInserted += count($batch);
                $batch = [];
            }
        }

        if (!empty($batch)) {
            DB::table($table)->insert($batch);
            $totalInserted += count($batch);
        }

        return [$table => $totalInserted];
    }

    /**
     * Cek apakah buffer SQL diakhiri tanda ';' di luar string literal.
     */
    private function endsWithSemicolonOutsideQuotes(string $buffer): bool
    {
        $trimmed = rtrim($buffer);
        if ($trimmed === '' || !str_ends_with($trimmed, ';')) {
            return false;
        }

        $inQuote = false;
        $escaped = false;
        $len = strlen($trimmed);

        for ($i = 0; $i < $len; $i++) {
            $ch = $trimmed[$i];
            if ($escaped) {
                $escaped = false;
                continue;
            }
            if ($ch === '\\') {
                $escaped = true;
                continue;
            }
            if ($ch === "'") {
                $inQuote = !$inQuote;
            }
        }

        return !$inQuote;
    }

    /**
     * Memecah klausa VALUES (...), (...) menjadi array of row arrays secara aman terhadap koma & tanda kutip.
     *
     * @return array<int, array<int, mixed>>
     */
    private function parseValueTuples(string $valuesStr): array
    {
        $rows = [];
        $len = strlen($valuesStr);
        $i = 0;

        while ($i < $len) {
            // Cari pembuka tuple '('
            while ($i < $len && $valuesStr[$i] !== '(') {
                $i++;
            }
            if ($i >= $len) {
                break;
            }
            $i++; // lewati '('

            $row = [];
            while ($i < $len) {
                // Lewati spasi
                while ($i < $len && ($valuesStr[$i] === ' ' || $valuesStr[$i] === "\t" || $valuesStr[$i] === "\r" || $valuesStr[$i] === "\n")) {
                    $i++;
                }

                if ($i >= $len) {
                    break;
                }

                if ($valuesStr[$i] === ')') {
                    $i++;
                    break;
                }

                if ($valuesStr[$i] === "'") {
                    // String literal
                    $i++; // lewati opening quote
                    $val = '';
                    while ($i < $len) {
                        $ch = $valuesStr[$i];
                        if ($ch === '\\' && $i + 1 < $len) {
                            $next = $valuesStr[$i + 1];
                            $val .= match ($next) {
                                'n' => "\n",
                                'r' => "\r",
                                't' => "\t",
                                '0' => "\0",
                                default => $next,
                            };
                            $i += 2;
                            continue;
                        }
                        if ($ch === "'") {
                            // Cek escaped quote '' ala SQL standar
                            if ($i + 1 < $len && $valuesStr[$i + 1] === "'") {
                                $val .= "'";
                                $i += 2;
                                continue;
                            }
                            $i++; // lewati closing quote
                            break;
                        }
                        $val .= $ch;
                        $i++;
                    }
                    $row[] = $val;
                } else {
                    // Token non-string (angka, NULL, dll.)
                    $start = $i;
                    while ($i < $len && $valuesStr[$i] !== ',' && $valuesStr[$i] !== ')') {
                        $i++;
                    }
                    $token = trim(substr($valuesStr, $start, $i - $start));
                    if (strcasecmp($token, 'NULL') === 0 || $token === '') {
                        $row[] = null;
                    } elseif (is_numeric($token)) {
                        $row[] = str_contains($token, '.') ? (float) $token : (int) $token;
                    } else {
                        $row[] = $token;
                    }
                }

                // Lewati spasi setelah nilai
                while ($i < $len && ($valuesStr[$i] === ' ' || $valuesStr[$i] === "\t" || $valuesStr[$i] === "\r" || $valuesStr[$i] === "\n")) {
                    $i++;
                }

                if ($i < $len && $valuesStr[$i] === ',') {
                    $i++;
                } elseif ($i < $len && $valuesStr[$i] === ')') {
                    $i++;
                    break;
                }
            }

            if (!empty($row)) {
                $rows[] = $row;
            }
        }

        return $rows;
    }
}
