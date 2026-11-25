<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CapaianProgram extends Model
{
    protected $table = 'data_capaian_prog_sub_keg';
    protected $guarded = [];

    public function subKegiatan()
    {
        return $this->belongsTo(SubKegiatanBl::class, 'kode_sbl', 'kode_sbl');
    }
}
