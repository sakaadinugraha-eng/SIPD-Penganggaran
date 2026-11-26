<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\SipdSyncController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DataManagementController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\PostingController;

// Endpoint Sinkronisasi Extension (Tanpa CSRF / Auth agar extension bisa langsung POST / GET status)
Route::match(['get', 'post'], '/api/sync-rka', [SipdSyncController::class, 'handle'])->name('api.sync_rka');
Route::match(['get', 'post'], '/sync-rka', [SipdSyncController::class, 'handle']);
Route::match(['get', 'post'], '/wp-admin/admin-ajax.php', [SipdSyncController::class, 'handle']);

// Endpoint Auth API
Route::prefix('api')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Data Management API
    Route::get('/data/tahun-anggaran', [DataManagementController::class, 'getAvailableYears']);
    Route::get('/data/stats', [DataManagementController::class, 'getStats']);
    Route::get('/data/skpd-list', [DataManagementController::class, 'getSkpdList']);
    Route::get('/data/skpd-hierarchy', [DataManagementController::class, 'getSkpdHierarchy']);
    Route::get('/data/sub-kegiatan', [DataManagementController::class, 'getSubKegiatan']);
    Route::get('/data/sub-kegiatan/{id}', [DataManagementController::class, 'getDetail']);
    Route::get('/data/rka-print/{id}', [DataManagementController::class, 'getRkaPrintData']);
    Route::get('/data/master-akun', [DataManagementController::class, 'getMasterAkun']);
    Route::get('/data/sumber-dana', [DataManagementController::class, 'getSumberDana']);
    Route::get('/data/master-skpd', [DataManagementController::class, 'getMasterSkpd']);
    Route::put('/data/master-skpd/{id}', [DataManagementController::class, 'updateMasterSkpd']);
    Route::get('/data/pendapatan', [DataManagementController::class, 'getPendapatan']);
    Route::get('/data/pendapatan/skpd', [DataManagementController::class, 'getPendapatanSkpdList']);
    Route::get('/data/pembiayaan', [DataManagementController::class, 'getPembiayaan']);
    Route::get('/data/pembiayaan/skpd', [DataManagementController::class, 'getPembiayaanSkpdList']);
    Route::post('/data/reset-all', [DataManagementController::class, 'resetAll']);
    Route::post('/data/reset-module', [DataManagementController::class, 'resetModule']);
    Route::post('/data/reset-skpd', [DataManagementController::class, 'resetSkpd']);
    Route::get('/data/sql-files', [DataManagementController::class, 'listSqlFiles']);
    Route::post('/data/import-sql', [DataManagementController::class, 'importSql']);
    Route::get('/data/export-sql/summary', [DataManagementController::class, 'exportSqlSummary']);
    Route::get('/data/export-sql', [DataManagementController::class, 'exportSql']);

    // Posting & Unposting Data API
    Route::get('/posting', [PostingController::class, 'index']);
    Route::post('/posting', [PostingController::class, 'store']);
    Route::get('/posting/tahapan', [PostingController::class, 'getTahapan']);
    Route::post('/posting/tahapan', [PostingController::class, 'storeTahapan']);
    Route::delete('/posting/tahapan/{id}', [PostingController::class, 'deleteTahapan']);
    Route::get('/posting/{id}', [PostingController::class, 'show']);
    Route::get('/posting/{id}/skpd-list', [PostingController::class, 'getPostingSkpdList']);
    Route::get('/posting/{id}/sub-kegiatan', [PostingController::class, 'getPostingSubKegiatan']);
    Route::get('/posting/{id}/sub-kegiatan/{subId}', [PostingController::class, 'getPostingSubKegiatanDetail']);
    Route::get('/posting/{id}/rka-print/{subId}', [PostingController::class, 'getPostingRkaPrintData']);
    Route::get('/posting/{id}/pendapatan', [PostingController::class, 'getPostingPendapatan']);
    Route::get('/posting/{id}/pembiayaan', [PostingController::class, 'getPostingPembiayaan']);
    Route::post('/posting/{id}/overwrite', [PostingController::class, 'overwrite']);
    Route::post('/posting/{id}/unposting', [PostingController::class, 'unposting']);
    Route::delete('/posting/{id}', [PostingController::class, 'destroy']);

    // User Management API
    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users', [UserController::class, 'store']);
    Route::put('/users/{id}', [UserController::class, 'update']);
    Route::delete('/users/{id}', [UserController::class, 'destroy']);
});

// Single Page Application (SPA) - Menyajikan React App untuk seluruh route frontend
Route::get('/{any?}', function () {
    return view('app');
})->where('any', '^(?!api).*$');
