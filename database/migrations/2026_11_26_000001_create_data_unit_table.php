<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('data_unit', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('id_skpd')->index();
            $table->unsignedBigInteger('id_unit')->nullable();
            $table->string('kode_skpd', 100)->nullable()->index();
            $table->string('nama_skpd', 255);
            $table->string('nama_kepala', 255)->nullable();
            $table->string('nip_kepala', 100)->nullable();
            $table->string('pangkat_kepala', 255)->nullable();
            $table->string('status_kepala', 100)->nullable();
            $table->tinyInteger('is_skpd')->default(1);
            $table->tinyInteger('is_pendapatan')->default(0);
            $table->tinyInteger('is_pembiayaan')->default(0);
            $table->unsignedBigInteger('id_kecamatan')->nullable();
            $table->string('nama_kecamatan', 255)->nullable();
            $table->string('nama_induk', 255)->nullable();
            $table->tinyInteger('kepala_saja')->default(0);
            $table->integer('tahun_anggaran')->index();
            $table->tinyInteger('active')->default(1);
            $table->timestamps();

            $table->unique(['id_skpd', 'tahun_anggaran'], 'data_unit_id_skpd_tahun_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('data_unit');
    }
};
