<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('master_tahapan_posting', function (Blueprint $table) {
            $table->id();
            $table->string('nama_tahap')->unique();
            $table->integer('urutan')->default(0);
            $table->text('keterangan')->nullable();
            $table->boolean('is_default')->default(false);
            $table->timestamps();
        });

        // Seed tahapan bawaan standar
        $defaultTahapan = [
            ['nama_tahap' => 'Rancangan Awal', 'urutan' => 1, 'is_default' => true],
            ['nama_tahap' => 'Rancangan', 'urutan' => 2, 'is_default' => true],
            ['nama_tahap' => 'RKA SKPD', 'urutan' => 3, 'is_default' => true],
            ['nama_tahap' => 'Persetujuan Bersama', 'urutan' => 4, 'is_default' => true],
            ['nama_tahap' => 'Penetapan APBD', 'urutan' => 5, 'is_default' => true],
            ['nama_tahap' => 'Perubahan APBD', 'urutan' => 6, 'is_default' => true],
        ];

        foreach ($defaultTahapan as $t) {
            DB::table('master_tahapan_posting')->insert(array_merge($t, [
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('master_tahapan_posting');
    }
};
