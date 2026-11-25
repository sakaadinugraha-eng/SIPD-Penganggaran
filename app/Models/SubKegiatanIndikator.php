<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SubKegiatanIndikator extends Model
{
    protected $table = 'data_sub_keg_indikator';
    protected $guarded = [];

    public function subKegiatan()
    {
        return $this->belongsTo(SubKegiatanBl::class, 'kode_sbl', 'kode_sbl');
    }
}
