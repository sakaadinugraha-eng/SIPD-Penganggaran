<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. data_sub_keg_bl
        Schema::create('data_sub_keg_bl', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('id_sub_bl')->nullable()->index();
            $table->string('id_unik_sub_bl')->nullable();
            $table->unsignedBigInteger('id_unit')->nullable();
            $table->unsignedBigInteger('id_skpd')->nullable()->index();
            $table->unsignedBigInteger('id_sub_skpd')->nullable()->index();
            $table->unsignedBigInteger('id_bidang_urusan')->nullable();
            $table->unsignedBigInteger('id_program')->nullable();
            $table->unsignedBigInteger('id_giat')->nullable();
            $table->unsignedBigInteger('id_bl')->nullable();
            $table->unsignedBigInteger('id_sub_giat')->nullable();
            
            $table->string('kode_skpd', 100)->nullable();
            $table->text('nama_skpd')->nullable();
            $table->string('kode_sub_skpd', 100)->nullable();
            $table->text('nama_sub_skpd')->nullable();
            $table->string('kode_bidang_urusan', 50)->nullable();
            $table->text('nama_bidang_urusan')->nullable();
            $table->string('kode_program', 50)->nullable();
            $table->text('nama_program')->nullable();
            $table->string('kode_giat', 50)->nullable();
            $table->text('nama_giat')->nullable();
            $table->string('kode_sub_giat', 50)->nullable()->index();
            $table->text('nama_sub_giat')->nullable();
            $table->string('kode_bl', 255)->nullable()->index();
            $table->string('kode_sbl', 255)->nullable()->index();

            $table->decimal('pagu', 20, 2)->default(0);
            $table->decimal('pagu_indikatif', 20, 2)->default(0);
            $table->decimal('pagu_n_depan', 20, 2)->default(0);
            $table->decimal('pagu_n2_depan', 20, 2)->default(0);

            $table->unsignedBigInteger('id_dana')->nullable();
            $table->text('nama_dana')->nullable();
            $table->unsignedBigInteger('id_lokasi')->nullable();
            $table->text('nama_lokasi')->nullable();
            $table->integer('waktu_awal')->default(1);
            $table->integer('waktu_akhir')->default(12);

            $table->text('indikator')->nullable();
            $table->string('satuan', 100)->nullable();
            $table->string('target_1', 100)->nullable();
            $table->text('sasaran')->nullable();

            $table->text('label_kokab')->nullable();
            $table->text('label_prov')->nullable();
            $table->text('label_pusat')->nullable();

            $table->year('tahun_anggaran')->default(2027)->index();
            $table->tinyInteger('active')->default(1)->index();
            $table->timestamps();
        });

        // 2. data_rka
        Schema::create('data_rka', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('id_rinci_sub_bl')->nullable()->index();
            $table->string('id_unik')->nullable();
            $table->unsignedBigInteger('id_sub_bl')->nullable()->index();
            $table->unsignedBigInteger('id_bl')->nullable();
            $table->unsignedBigInteger('id_unit')->nullable();
            $table->unsignedBigInteger('id_skpd')->nullable();
            $table->unsignedBigInteger('id_sub_skpd')->nullable();

            $table->string('kode_bl', 255)->nullable()->index();
            $table->string('kode_sbl', 255)->nullable()->index();

            $table->string('kode_akun', 100)->nullable()->index();
            $table->text('nama_akun')->nullable();
            $table->string('kode_standar_harga', 100)->nullable()->index();
            $table->text('nama_standar_harga')->nullable();
            $table->text('nama_komponen')->nullable();
            $table->text('spek_komponen')->nullable();

            $table->string('koefisien', 255)->nullable();
            $table->string('volume', 100)->nullable();
            $table->string('satuan', 100)->nullable();
            $table->string('volum1', 100)->nullable();
            $table->string('sat1', 100)->nullable();
            $table->string('volum2', 100)->nullable();
            $table->string('sat2', 100)->nullable();
            $table->string('volum3', 100)->nullable();
            $table->string('sat3', 100)->nullable();
            $table->string('volum4', 100)->nullable();
            $table->string('sat4', 100)->nullable();

            $table->decimal('harga_satuan', 20, 2)->default(0);
            $table->decimal('total_harga', 20, 2)->default(0);
            $table->decimal('rincian', 20, 2)->default(0);
            $table->decimal('pajak', 20, 2)->default(0);

            $table->unsignedBigInteger('id_dana')->nullable();
            $table->text('nama_dana')->nullable();
            $table->tinyInteger('is_paket')->default(0);

            $table->unsignedBigInteger('id_subs_sub_bl')->nullable();
            $table->unsignedBigInteger('id_ket_sub_bl')->nullable();
            $table->text('subs_bl_teks')->nullable();
            $table->text('ket_bl_teks')->nullable();
            $table->string('jenis_bl', 100)->nullable();

            $table->string('created_user')->nullable();
            $table->string('createddate', 20)->nullable();
            $table->string('createdtime', 20)->nullable();
            $table->string('updated_user')->nullable();
            $table->string('updateddate', 20)->nullable();
            $table->string('updatedtime', 20)->nullable();
            $table->text('user1')->nullable();
            $table->text('user2')->nullable();

            $table->year('tahun_anggaran')->default(2027)->index();
            $table->tinyInteger('active')->default(1)->index();
            $table->timestamps();
        });

        // 3. data_capaian_prog_sub_keg
        Schema::create('data_capaian_prog_sub_keg', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('id_capaian_bl')->nullable();
            $table->unsignedBigInteger('id_bl')->nullable();
            $table->unsignedBigInteger('id_sub_bl')->nullable();
            $table->unsignedBigInteger('id_skpd')->nullable();
            $table->unsignedBigInteger('id_sub_skpd')->nullable();
            $table->unsignedBigInteger('id_program')->nullable();
            $table->unsignedBigInteger('id_giat')->nullable();
            $table->string('kode_sbl', 255)->nullable()->index();
            
            $table->text('capaianteks')->nullable();
            $table->string('targetcapaian', 100)->nullable();
            $table->string('targetcapaianteks', 100)->nullable();
            $table->string('satuancapaian', 100)->nullable();

            $table->year('tahun_anggaran')->default(2027)->index();
            $table->tinyInteger('active')->default(1)->index();
            $table->timestamps();
        });

        // 4. data_sub_keg_indikator
        Schema::create('data_sub_keg_indikator', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('idoutputbl')->nullable();
            $table->unsignedBigInteger('id_sub_bl')->nullable()->index();
            $table->unsignedBigInteger('id_giat')->nullable();
            $table->unsignedBigInteger('id_program')->nullable();
            $table->unsignedBigInteger('id_skpd')->nullable();
            $table->unsignedBigInteger('id_sub_skpd')->nullable();
            $table->string('kode_sbl', 255)->nullable()->index();

            $table->text('outputteks')->nullable();
            $table->string('targetoutput', 100)->nullable();
            $table->string('targetoutputteks', 100)->nullable();
            $table->string('satuanoutput', 100)->nullable();
            $table->text('tolok_ukur_sub')->nullable();
            $table->string('target_sub', 100)->nullable();
            $table->string('satuan_sub', 100)->nullable();
            $table->string('tipe', 50)->default('sub_kegiatan');

            $table->year('tahun_anggaran')->default(2027)->index();
            $table->tinyInteger('active')->default(1)->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('data_sub_keg_indikator');
        Schema::dropIfExists('data_capaian_prog_sub_keg');
        Schema::dropIfExists('data_rka');
        Schema::dropIfExists('data_sub_keg_bl');
    }
};
