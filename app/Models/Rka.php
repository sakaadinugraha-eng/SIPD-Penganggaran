<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Rka extends Model
{
    protected $table = 'data_rka';
    protected $guarded = [];

    public function subKegiatan()
    {
        return $this->belongsTo(SubKegiatanBl::class, 'kode_sbl', 'kode_sbl');
    }
}
