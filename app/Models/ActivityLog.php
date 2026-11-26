<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ActivityLog extends Model
{
    protected $table = 'activity_logs';

    protected $fillable = [
        'category',
        'title',
        'description',
        'status',
        'tahun_anggaran',
        'actor',
    ];
}
