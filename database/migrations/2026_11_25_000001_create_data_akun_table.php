<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('data_akun', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('id_akun')->index();
            $table->string('kode_akun', 100)->index();
            $table->text('nama_akun');
            $table->string('ket_akun', 100)->nullable();
            $table->unsignedTinyInteger('level')->default(1);

            $table->unsignedTinyInteger('belanja')->default(0);
            $table->unsignedTinyInteger('pendapatan')->default(0);
            $table->unsignedTinyInteger('pembiayaan')->default(0);
            $table->unsignedTinyInteger('is_bl')->default(0);
            $table->unsignedTinyInteger('is_pendapatan')->default(0);
            $table->unsignedTinyInteger('is_pembiayaan')->default(0);
            $table->unsignedTinyInteger('is_barjas')->default(0);
            $table->unsignedTinyInteger('is_bagi_hasil')->default(0);
            $table->unsignedTinyInteger('is_bankeu_khusus')->default(0);
            $table->unsignedTinyInteger('is_bankeu_umum')->default(0);
            $table->unsignedTinyInteger('is_bos')->default(0);
            $table->unsignedTinyInteger('is_btt')->default(0);
            $table->unsignedTinyInteger('is_bunga')->default(0);
            $table->unsignedTinyInteger('is_gaji_asn')->default(0);
            $table->unsignedTinyInteger('is_hibah_brg')->default(0);
            $table->unsignedTinyInteger('is_hibah_uang')->default(0);
            $table->unsignedTinyInteger('is_locked')->default(0);
            $table->unsignedTinyInteger('is_modal_tanah')->default(0);
            $table->unsignedTinyInteger('is_sosial_brg')->default(0);
            $table->unsignedTinyInteger('is_sosial_uang')->default(0);
            $table->unsignedTinyInteger('is_subsidi')->default(0);

            $table->string('kode_akun_lama', 100)->nullable();
            $table->string('kode_akun_revisi', 100)->nullable();
            $table->integer('kunci_tahun')->default(0);
            $table->integer('mulai_tahun')->nullable();
            $table->unsignedTinyInteger('set_input')->default(0);
            $table->unsignedTinyInteger('set_kab_kota')->default(0);
            $table->unsignedTinyInteger('set_lokus')->default(0);
            $table->unsignedTinyInteger('set_prov')->default(0);
            $table->string('status', 50)->nullable();

            $table->integer('tahun_anggaran')->index();
            $table->unsignedTinyInteger('active')->default(1)->index();
            $table->timestamps();

            $table->unique(['id_akun', 'tahun_anggaran'], 'data_akun_id_tahun_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('data_akun');
    }
};
