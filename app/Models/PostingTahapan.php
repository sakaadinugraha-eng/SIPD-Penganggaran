<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PostingTahapan extends Model
{
    protected $table = 'master_tahapan_posting';
    protected $guarded = [];

    protected $casts = [
        'is_default' => 'boolean',
        'urutan' => 'integer',
    ];
}
