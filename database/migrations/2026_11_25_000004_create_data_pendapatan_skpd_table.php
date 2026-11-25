<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('data_pendapatan_skpd', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('id_skpd')->index();
            $table->string('kode_skpd', 100)->nullable()->index();
            $table->text('nama_skpd')->nullable();
            $table->integer('jumlah_rekening')->default(0);
            $table->decimal('total', 20, 2)->default(0);
            $table->integer('tahun_anggaran')->index();
            $table->unsignedTinyInteger('active')->default(1)->index();
            $table->timestamps();

            $table->unique(['id_skpd', 'tahun_anggaran'], 'data_pendapatan_skpd_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('data_pendapatan_skpd');
    }
};
