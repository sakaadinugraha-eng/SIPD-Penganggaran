<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SyncLog extends Model
{
    protected $table = 'sync_logs';

    protected $fillable = [
        'action',
        'data_type',
        'tahun_anggaran',
        'status',
        'processed_count',
        'failed_count',
        'message',
        'error_detail',
        'source',
        'ip_address',
        'duration_ms',
    ];
}
