<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DataUnit extends Model
{
    protected $table = 'data_unit';

    protected $guarded = ['id'];

    /**
     * Cari data unit & kepala SKPD berdasarkan id_skpd atau kode_skpd untuk tahun anggaran tertentu.
     */
    public static function findKepalaSkpd(?int $idSkpd, ?string $kodeSkpd, ?int $tahunAnggaran): ?self
    {
        try {
            if (!$idSkpd && !$kodeSkpd) {
                return null;
            }

            $base = static::where('active', 1);

            if ($tahunAnggaran) {
                if ($idSkpd) {
                    $found = (clone $base)->where('tahun_anggaran', $tahunAnggaran)->where('id_skpd', $idSkpd)->first();
                    if ($found) return $found;
                }
                if ($kodeSkpd) {
                    $found = (clone $base)->where('tahun_anggaran', $tahunAnggaran)->where('kode_skpd', $kodeSkpd)->first();
                    if ($found) return $found;
                }
            }

            if ($idSkpd) {
                $found = (clone $base)->where('id_skpd', $idSkpd)->orderByDesc('tahun_anggaran')->first();
                if ($found) return $found;
            }

            if ($kodeSkpd) {
                return (clone $base)->where('kode_skpd', $kodeSkpd)->orderByDesc('tahun_anggaran')->first();
            }
        } catch (\Throwable $e) {
            return null;
        }

        return null;
    }
}
