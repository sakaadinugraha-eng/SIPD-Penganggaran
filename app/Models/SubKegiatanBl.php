<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SubKegiatanBl extends Model
{
    protected $table = 'data_sub_keg_bl';
    protected $guarded = [];

    public function rka()
    {
        return $this->hasMany(Rka::class, 'kode_sbl', 'kode_sbl');
    }

    public function indikatorKeluaran()
    {
        return $this->hasMany(SubKegiatanIndikator::class, 'kode_sbl', 'kode_sbl');
    }

    public function capaian()
    {
        return $this->hasMany(CapaianProgram::class, 'kode_sbl', 'kode_sbl');
    }
}
