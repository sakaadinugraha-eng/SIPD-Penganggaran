<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('data_sumber_dana', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('id_dana')->index();
            $table->string('id_unik', 100)->nullable();
            $table->unsignedBigInteger('id_daerah')->nullable();
            $table->string('kode_dana', 100)->index();
            $table->text('nama_dana');
            $table->string('sumber_dana', 100)->nullable();
            $table->unsignedTinyInteger('is_locked')->default(0);
            $table->unsignedTinyInteger('set_input')->default(0);
            $table->integer('tahun_anggaran')->index();
            $table->unsignedTinyInteger('active')->default(1)->index();
            $table->timestamps();

            $table->unique(['id_dana', 'tahun_anggaran'], 'data_sumber_dana_id_tahun_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('data_sumber_dana');
    }
};
