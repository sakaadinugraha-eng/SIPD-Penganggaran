<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        try {
            Schema::table('data_sub_keg_bl', function (Blueprint $table) {
                $table->index(['tahun_anggaran', 'active', 'kode_sbl'], 'idx_sub_keg_tahun_active_sbl');
            });
        } catch (\Throwable $e) {
            // Abaikan jika index sudah ada
        }

        try {
            Schema::table('data_rka', function (Blueprint $table) {
                $table->index(['tahun_anggaran', 'active', 'kode_sbl'], 'idx_rka_tahun_active_sbl');
            });
        } catch (\Throwable $e) {
            // Abaikan jika index sudah ada
        }

        try {
            Schema::table('posting_sub_keg_bl', function (Blueprint $table) {
                $table->index(['posting_id', 'kode_sbl'], 'idx_post_sub_keg_pid_sbl');
            });
        } catch (\Throwable $e) {
            // Abaikan jika index sudah ada
        }

        try {
            Schema::table('posting_rka', function (Blueprint $table) {
                $table->index(['posting_id', 'kode_sbl'], 'idx_post_rka_pid_sbl');
            });
        } catch (\Throwable $e) {
            // Abaikan jika index sudah ada
        }
    }

    public function down(): void
    {
        try {
            Schema::table('data_sub_keg_bl', fn (Blueprint $table) => $table->dropIndex('idx_sub_keg_tahun_active_sbl'));
        } catch (\Throwable $e) {}
        try {
            Schema::table('data_rka', fn (Blueprint $table) => $table->dropIndex('idx_rka_tahun_active_sbl'));
        } catch (\Throwable $e) {}
        try {
            Schema::table('posting_sub_keg_bl', fn (Blueprint $table) => $table->dropIndex('idx_post_sub_keg_pid_sbl'));
        } catch (\Throwable $e) {}
        try {
            Schema::table('posting_rka', fn (Blueprint $table) => $table->dropIndex('idx_post_rka_pid_sbl'));
        } catch (\Throwable $e) {}
    }
};
