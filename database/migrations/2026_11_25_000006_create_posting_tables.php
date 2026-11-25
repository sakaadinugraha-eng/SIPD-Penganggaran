<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Tabel Sesi / Riwayat Posting
        Schema::create('posting_sessions', function (Blueprint $table) {
            $table->id();
            $table->string('nama_posting'); // Contoh: "Posting RKA Awal 2027", "Posting Final APBD"
            $table->string('tahap')->default('Rancangan'); // Rancangan, RKA, Penetapan, Perubahan, dll.
            $table->year('tahun_anggaran')->default(2027)->index();
            $table->text('keterangan')->nullable();
            
            // Rekapitulasi Angka saat Posting
            $table->decimal('total_belanja', 20, 2)->default(0);
            $table->decimal('total_pendapatan', 20, 2)->default(0);
            $table->decimal('total_pembiayaan_penerimaan', 20, 2)->default(0);
            $table->decimal('total_pembiayaan_pengeluaran', 20, 2)->default(0);
            $table->decimal('total_pembiayaan_netto', 20, 2)->default(0);
            $table->decimal('surplus_defisit', 20, 2)->default(0);

            // Statistik Data
            $table->integer('jumlah_skpd')->default(0);
            $table->integer('jumlah_sub_kegiatan')->default(0);
            $table->integer('jumlah_rekening_rka')->default(0);
            $table->integer('jumlah_rekening_pendapatan')->default(0);
            $table->integer('jumlah_rekening_pembiayaan')->default(0);

            $table->string('posted_by')->nullable(); // Nama user / akun
            $table->timestamp('last_synced_at')->nullable(); // Kapan terakhir ditindih dari data aktif
            $table->timestamps();
        });

        // 2. Snapshot Sub Kegiatan Belanja
        Schema::create('posting_sub_keg_bl', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('posting_id')->index();
            
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
            $table->string('kode_sub_giat', 50)->nullable();
            $table->text('nama_sub_giat')->nullable();
            $table->string('kode_bl', 255)->nullable();
            $table->string('kode_sbl', 255)->nullable();

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

            $table->year('tahun_anggaran')->default(2027);
            $table->timestamps();

            $table->foreign('posting_id')->references('id')->on('posting_sessions')->onDelete('cascade');
        });

        // 3. Snapshot Rincian RKA
        Schema::create('posting_rka', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('posting_id')->index();

            $table->unsignedBigInteger('id_rinci_sub_bl')->nullable()->index();
            $table->string('id_unik')->nullable();
            $table->unsignedBigInteger('id_sub_bl')->nullable()->index();
            $table->unsignedBigInteger('id_bl')->nullable();
            $table->unsignedBigInteger('id_unit')->nullable();
            $table->unsignedBigInteger('id_skpd')->nullable()->index();
            $table->unsignedBigInteger('id_sub_skpd')->nullable();

            $table->string('kode_bl', 255)->nullable();
            $table->string('kode_sbl', 255)->nullable()->index();

            $table->string('kode_akun', 100)->nullable()->index();
            $table->text('nama_akun')->nullable();
            $table->string('kode_standar_harga', 100)->nullable();
            $table->text('nama_standar_harga')->nullable();
            $table->text('nama_komponen')->nullable();
            $table->text('spek_komponen')->nullable();

            $table->string('koefisien', 255)->nullable();
            $table->string('volume', 100)->nullable();
            $table->string('satuan', 100)->nullable();
            $table->decimal('harga_satuan', 20, 2)->default(0);
            $table->decimal('total_harga', 20, 2)->default(0);
            $table->decimal('rincian', 20, 2)->default(0);
            $table->decimal('pajak', 20, 2)->default(0);

            $table->unsignedBigInteger('id_dana')->nullable();
            $table->text('nama_dana')->nullable();
            $table->tinyInteger('is_paket')->default(0);

            $table->text('subs_bl_teks')->nullable();
            $table->text('ket_bl_teks')->nullable();
            $table->string('jenis_bl', 100)->nullable();

            $table->year('tahun_anggaran')->default(2027);
            $table->timestamps();

            $table->foreign('posting_id')->references('id')->on('posting_sessions')->onDelete('cascade');
        });

        // 4. Snapshot Capaian Program
        Schema::create('posting_capaian_prog', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('posting_id')->index();

            $table->unsignedBigInteger('id_capaian_bl')->nullable();
            $table->unsignedBigInteger('id_bl')->nullable();
            $table->unsignedBigInteger('id_sub_bl')->nullable();
            $table->unsignedBigInteger('id_skpd')->nullable();
            $table->unsignedBigInteger('id_sub_skpd')->nullable();
            $table->unsignedBigInteger('id_program')->nullable();
            $table->unsignedBigInteger('id_giat')->nullable();
            $table->string('kode_sbl', 255)->nullable();
            
            $table->text('capaianteks')->nullable();
            $table->string('targetcapaian', 100)->nullable();
            $table->string('targetcapaianteks', 100)->nullable();
            $table->string('satuancapaian', 100)->nullable();

            $table->year('tahun_anggaran')->default(2027);
            $table->timestamps();

            $table->foreign('posting_id')->references('id')->on('posting_sessions')->onDelete('cascade');
        });

        // 5. Snapshot Indikator Sub Kegiatan
        Schema::create('posting_indikator', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('posting_id')->index();

            $table->unsignedBigInteger('idoutputbl')->nullable();
            $table->unsignedBigInteger('id_sub_bl')->nullable();
            $table->unsignedBigInteger('id_giat')->nullable();
            $table->unsignedBigInteger('id_program')->nullable();
            $table->unsignedBigInteger('id_skpd')->nullable();
            $table->unsignedBigInteger('id_sub_skpd')->nullable();
            $table->string('kode_sbl', 255)->nullable();

            $table->text('outputteks')->nullable();
            $table->string('targetoutput', 100)->nullable();
            $table->string('targetoutputteks', 100)->nullable();
            $table->string('satuanoutput', 100)->nullable();
            $table->text('tolok_ukur_sub')->nullable();
            $table->string('target_sub', 100)->nullable();
            $table->string('satuan_sub', 100)->nullable();
            $table->string('tipe', 50)->default('sub_kegiatan');

            $table->year('tahun_anggaran')->default(2027);
            $table->timestamps();

            $table->foreign('posting_id')->references('id')->on('posting_sessions')->onDelete('cascade');
        });

        // 6. Snapshot Pendapatan Daerah
        Schema::create('posting_pendapatan', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('posting_id')->index();

            $table->unsignedBigInteger('id_pendapatan');
            $table->unsignedBigInteger('id_skpd')->index();
            $table->string('kode_skpd', 100)->nullable();
            $table->text('nama_skpd')->nullable();

            $table->unsignedBigInteger('id_akun')->nullable();
            $table->string('kode_akun', 100)->nullable();
            $table->text('nama_akun')->nullable();

            $table->text('uraian')->nullable();
            $table->text('keterangan')->nullable();
            $table->decimal('total', 20, 2)->default(0);
            $table->decimal('nilaimurni', 20, 2)->default(0);

            $table->string('volume', 100)->nullable();
            $table->string('satuan', 100)->nullable();
            $table->string('koefisien', 255)->nullable();
            $table->unsignedTinyInteger('is_locked')->default(0);

            $table->integer('tahun_anggaran');
            $table->timestamps();

            $table->foreign('posting_id')->references('id')->on('posting_sessions')->onDelete('cascade');
        });

        // 7. Snapshot Pembiayaan Daerah
        Schema::create('posting_pembiayaan', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('posting_id')->index();

            $table->unsignedBigInteger('id_pembiayaan');
            $table->string('tipe', 50)->default('penerimaan');
            $table->unsignedBigInteger('id_skpd')->index();
            $table->string('kode_skpd', 100)->nullable();
            $table->text('nama_skpd')->nullable();

            $table->unsignedBigInteger('id_akun')->nullable();
            $table->string('kode_akun', 100)->nullable();
            $table->text('nama_akun')->nullable();

            $table->text('uraian')->nullable();
            $table->text('keterangan')->nullable();
            $table->decimal('total', 20, 2)->default(0);

            $table->integer('tahun_anggaran');
            $table->timestamps();

            $table->foreign('posting_id')->references('id')->on('posting_sessions')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('posting_pembiayaan');
        Schema::dropIfExists('posting_pendapatan');
        Schema::dropIfExists('posting_indikator');
        Schema::dropIfExists('posting_capaian_prog');
        Schema::dropIfExists('posting_rka');
        Schema::dropIfExists('posting_sub_keg_bl');
        Schema::dropIfExists('posting_sessions');
    }
};
