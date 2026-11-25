<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PostingSession extends Model
{
    protected $table = 'posting_sessions';
    protected $guarded = [];

    protected $casts = [
        'total_belanja' => 'float',
        'total_pendapatan' => 'float',
        'total_pembiayaan_penerimaan' => 'float',
        'total_pembiayaan_pengeluaran' => 'float',
        'total_pembiayaan_netto' => 'float',
        'surplus_defisit' => 'float',
        'last_synced_at' => 'datetime',
    ];
}
