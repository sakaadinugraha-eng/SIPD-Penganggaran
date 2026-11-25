<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Tabel Master SKPD Pembiayaan
        Schema::create('data_pembiayaan_skpd', function (Blueprint $table) {
            $table->id();
            $table->string('tipe', 50)->default('penerimaan')->index(); // 'penerimaan' | 'pengeluaran'
            $table->unsignedBigInteger('id_skpd')->index();
            $table->string('kode_skpd', 100)->nullable()->index();
            $table->text('nama_skpd')->nullable();
            $table->integer('jumlah_rekening')->default(0);
            $table->decimal('total', 20, 2)->default(0);
            $table->integer('tahun_anggaran')->index();
            $table->unsignedTinyInteger('active')->default(1)->index();
            $table->timestamps();

            $table->unique(['id_skpd', 'tipe', 'tahun_anggaran'], 'data_pembiayaan_skpd_unique');
        });

        // 2. Tabel Rincian Rekening Pembiayaan
        Schema::create('data_pembiayaan', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('id_pembiayaan')->index();
            $table->string('tipe', 50)->default('penerimaan')->index(); // 'penerimaan' | 'pengeluaran'
            $table->unsignedBigInteger('id_skpd')->index();
            $table->string('kode_skpd', 100)->nullable()->index();
            $table->text('nama_skpd')->nullable();

            $table->unsignedBigInteger('id_akun')->nullable()->index();
            $table->string('kode_akun', 100)->nullable()->index();
            $table->text('nama_akun')->nullable();

            $table->text('uraian')->nullable();
            $table->text('keterangan')->nullable();
            $table->decimal('total', 20, 2)->default(0);

            $table->integer('tahun_anggaran')->index();
            $table->unsignedTinyInteger('active')->default(1)->index();
            $table->timestamps();

            $table->unique(['id_pembiayaan', 'tipe', 'tahun_anggaran'], 'data_pembiayaan_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('data_pembiayaan');
        Schema::dropIfExists('data_pembiayaan_skpd');
    }
};
