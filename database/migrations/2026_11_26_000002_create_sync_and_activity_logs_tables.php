<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('sync_logs')) {
            Schema::create('sync_logs', function (Blueprint $table) {
                $table->id();
                $table->string('action', 100)->index();
                $table->string('data_type', 100)->nullable()->index();
                $table->integer('tahun_anggaran')->nullable()->index();
                $table->string('status', 30)->default('success')->index(); // success | partial | error
                $table->integer('processed_count')->default(0);
                $table->integer('failed_count')->default(0);
                $table->text('message')->nullable();
                $table->text('error_detail')->nullable();
                $table->string('source', 50)->default('extension'); // extension | manual | system
                $table->string('ip_address', 45)->nullable();
                $table->integer('duration_ms')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('activity_logs')) {
            Schema::create('activity_logs', function (Blueprint $table) {
                $table->id();
                $table->string('category', 50)->index(); // sync | import | export | posting | master | reset
                $table->string('title', 255);
                $table->text('description')->nullable();
                $table->string('status', 30)->default('info')->index(); // success | warning | error | info
                $table->integer('tahun_anggaran')->nullable()->index();
                $table->string('actor', 100)->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
        Schema::dropIfExists('sync_logs');
    }
};
