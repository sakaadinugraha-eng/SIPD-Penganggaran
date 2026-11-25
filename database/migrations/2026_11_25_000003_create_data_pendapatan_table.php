<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('data_pendapatan', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('id_pendapatan')->index();
            $table->unsignedBigInteger('id_skpd')->index();
            $table->string('kode_skpd', 100)->nullable()->index();
            $table->text('nama_skpd')->nullable();

            $table->unsignedBigInteger('id_akun')->nullable()->index();
            $table->string('kode_akun', 100)->nullable()->index();
            $table->text('nama_akun')->nullable();

            $table->text('uraian')->nullable();
            $table->text('keterangan')->nullable();
            $table->decimal('total', 20, 2)->default(0);
            $table->decimal('nilaimurni', 20, 2)->default(0);

            $table->string('volume', 100)->nullable();
            $table->string('satuan', 100)->nullable();
            $table->string('koefisien', 255)->nullable();
            $table->unsignedTinyInteger('is_locked')->default(0);

            $table->integer('tahun_anggaran')->index();
            $table->unsignedTinyInteger('active')->default(1)->index();
            $table->timestamps();

            $table->unique(['id_pendapatan', 'tahun_anggaran'], 'data_pendapatan_id_tahun_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('data_pendapatan');
    }
};
