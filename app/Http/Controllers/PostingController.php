<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\PostingSession;
use App\Models\PostingTahapan;
use App\Models\DataUnit;

class PostingController extends Controller
{
    /**
     * Dapatkan daftar sesi posting & status ringkasan data aktif saat ini
     */
    public function index(Request $request)
    {
        $tahun = $request->query('tahun', 2027);

        // Ambil riwayat posting
        $sessions = PostingSession::where('tahun_anggaran', $tahun)
            ->orderBy('id', 'desc')
            ->get();

        $tahapanList = PostingTahapan::orderBy('urutan', 'asc')->orderBy('id', 'asc')->get();

        // Hitung statistik data aktif saat ini untuk komparasi
        $activeBelanja = (float) DB::table('data_sub_keg_bl')
            ->where('tahun_anggaran', $tahun)
            ->sum('pagu');

        $activePendapatan = (float) DB::table('data_pendapatan')
            ->where('tahun_anggaran', $tahun)
            ->sum('total');

        $pembiayaanTahun = DB::table('data_pembiayaan')->where('tahun_anggaran', $tahun)->exists()
            ? $tahun
            : (DB::table('data_pembiayaan')->max('tahun_anggaran') ?? $tahun);

        $activePenerimaan = (float) DB::table('data_pembiayaan')
            ->where('tahun_anggaran', $pembiayaanTahun)
            ->where('tipe', 'penerimaan')
            ->sum('total');

        $activePengeluaran = (float) DB::table('data_pembiayaan')
            ->where('tahun_anggaran', $pembiayaanTahun)
            ->where('tipe', 'pengeluaran')
            ->sum('total');

        $activeSkpdCount = DB::table('data_sub_keg_bl')
            ->where('tahun_anggaran', $tahun)
            ->distinct('id_skpd')
            ->count('id_skpd');

        $activeSubKegCount = DB::table('data_sub_keg_bl')
            ->where('tahun_anggaran', $tahun)
            ->count();

        $activeRkaCount = DB::table('data_rka')
            ->where('tahun_anggaran', $tahun)
            ->count();

        $activePendapatanCount = DB::table('data_pendapatan')
            ->where('tahun_anggaran', $tahun)
            ->count();

        $activePembiayaanCount = DB::table('data_pembiayaan')
            ->where('tahun_anggaran', $pembiayaanTahun)
            ->count();

        $activeStats = [
            'total_belanja' => $activeBelanja,
            'total_pendapatan' => $activePendapatan,
            'total_pembiayaan_penerimaan' => $activePenerimaan,
            'total_pembiayaan_pengeluaran' => $activePengeluaran,
            'total_pembiayaan_netto' => $activePenerimaan - $activePengeluaran,
            'surplus_defisit' => $activePendapatan - $activeBelanja,
            'jumlah_skpd' => $activeSkpdCount,
            'jumlah_sub_kegiatan' => $activeSubKegCount,
            'jumlah_rekening_rka' => $activeRkaCount,
            'jumlah_rekening_pendapatan' => $activePendapatanCount,
            'jumlah_rekening_pembiayaan' => $activePembiayaanCount,
        ];

        return response()->json([
            'status' => 'success',
            'data' => [
                'sessions' => $sessions,
                'active_stats' => $activeStats,
                'tahapan' => $tahapanList,
            ]
        ]);
    }

    /**
     * Buat Sesi Posting Baru dari Data Aktif
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama_posting' => 'nullable|string|max:255',
            'tahap' => 'required|string|max:100',
            'tahun_anggaran' => 'nullable|integer',
            'keterangan' => 'nullable|string',
        ]);

        $tahun = $validated['tahun_anggaran'] ?? 2027;
        $user = $request->user();
        $postedBy = $user ? $user->name : 'Administrator';
        $namaPosting = !empty($validated['nama_posting']) ? $validated['nama_posting'] : $validated['tahap'];

        // Hitung total dari data aktif
        $totalBelanja = (float) DB::table('data_sub_keg_bl')->where('tahun_anggaran', $tahun)->sum('pagu');
        $totalPendapatan = (float) DB::table('data_pendapatan')->where('tahun_anggaran', $tahun)->sum('total');

        $pembiayaanTahun = DB::table('data_pembiayaan')->where('tahun_anggaran', $tahun)->exists()
            ? $tahun
            : (DB::table('data_pembiayaan')->max('tahun_anggaran') ?? $tahun);

        $totalPenerimaan = (float) DB::table('data_pembiayaan')->where('tahun_anggaran', $pembiayaanTahun)->where('tipe', 'penerimaan')->sum('total');
        $totalPengeluaran = (float) DB::table('data_pembiayaan')->where('tahun_anggaran', $pembiayaanTahun)->where('tipe', 'pengeluaran')->sum('total');
        $pembiayaanNetto = $totalPenerimaan - $totalPengeluaran;
        $surplusDefisit = $totalPendapatan - $totalBelanja;

        $skpdCount = DB::table('data_sub_keg_bl')->where('tahun_anggaran', $tahun)->distinct('id_skpd')->count('id_skpd');
        $subKegCount = DB::table('data_sub_keg_bl')->where('tahun_anggaran', $tahun)->count();
        $rkaCount = DB::table('data_rka')->where('tahun_anggaran', $tahun)->count();
        $pendapatanCount = DB::table('data_pendapatan')->where('tahun_anggaran', $tahun)->count();
        $pembiayaanCount = DB::table('data_pembiayaan')->where('tahun_anggaran', $pembiayaanTahun)->count();

        DB::beginTransaction();
        try {
            // 1. Simpan header sesi posting
            $session = PostingSession::create([
                'nama_posting' => $namaPosting,
                'tahap' => $validated['tahap'],
                'tahun_anggaran' => $tahun,
                'keterangan' => $validated['keterangan'] ?? null,
                'total_belanja' => $totalBelanja,
                'total_pendapatan' => $totalPendapatan,
                'total_pembiayaan_penerimaan' => $totalPenerimaan,
                'total_pembiayaan_pengeluaran' => $totalPengeluaran,
                'total_pembiayaan_netto' => $pembiayaanNetto,
                'surplus_defisit' => $surplusDefisit,
                'jumlah_skpd' => $skpdCount,
                'jumlah_sub_kegiatan' => $subKegCount,
                'jumlah_rekening_rka' => $rkaCount,
                'jumlah_rekening_pendapatan' => $pendapatanCount,
                'jumlah_rekening_pembiayaan' => $pembiayaanCount,
                'posted_by' => $postedBy,
                'last_synced_at' => now(),
            ]);

            $postingId = $session->id;

            // 2. Salin Sub Kegiatan Belanja
            DB::insert("
                INSERT INTO posting_sub_keg_bl (
                    posting_id, id_sub_bl, id_unik_sub_bl, id_unit, id_skpd, id_sub_skpd, 
                    id_bidang_urusan, id_program, id_giat, id_bl, id_sub_giat,
                    kode_skpd, nama_skpd, kode_sub_skpd, nama_sub_skpd, 
                    kode_bidang_urusan, nama_bidang_urusan, kode_program, nama_program, 
                    kode_giat, nama_giat, kode_sub_giat, nama_sub_giat, kode_bl, kode_sbl,
                    pagu, pagu_indikatif, pagu_n_depan, pagu_n2_depan, 
                    id_dana, nama_dana, id_lokasi, nama_lokasi, waktu_awal, waktu_akhir,
                    indikator, satuan, target_1, sasaran, tahun_anggaran, created_at, updated_at
                )
                SELECT 
                    ?, id_sub_bl, id_unik_sub_bl, id_unit, id_skpd, id_sub_skpd, 
                    id_bidang_urusan, id_program, id_giat, id_bl, id_sub_giat,
                    kode_skpd, nama_skpd, kode_sub_skpd, nama_sub_skpd, 
                    kode_bidang_urusan, nama_bidang_urusan, kode_program, nama_program, 
                    kode_giat, nama_giat, kode_sub_giat, nama_sub_giat, kode_bl, kode_sbl,
                    pagu, pagu_indikatif, pagu_n_depan, pagu_n2_depan, 
                    id_dana, nama_dana, id_lokasi, nama_lokasi, waktu_awal, waktu_akhir,
                    indikator, satuan, target_1, sasaran, tahun_anggaran, NOW(), NOW()
                FROM data_sub_keg_bl 
                WHERE tahun_anggaran = ?
            ", [$postingId, $tahun]);

            // 3. Salin RKA Rincian Belanja
            DB::insert("
                INSERT INTO posting_rka (
                    posting_id, id_rinci_sub_bl, id_unik, id_sub_bl, id_bl, id_unit, id_skpd, id_sub_skpd,
                    kode_bl, kode_sbl, kode_akun, nama_akun, kode_standar_harga, nama_standar_harga,
                    nama_komponen, spek_komponen, koefisien, volume, satuan, harga_satuan, total_harga,
                    rincian, pajak, id_dana, nama_dana, is_paket, subs_bl_teks, ket_bl_teks, jenis_bl,
                    tahun_anggaran, created_at, updated_at
                )
                SELECT 
                    ?, id_rinci_sub_bl, id_unik, id_sub_bl, id_bl, id_unit, id_skpd, id_sub_skpd,
                    kode_bl, kode_sbl, kode_akun, nama_akun, kode_standar_harga, nama_standar_harga,
                    nama_komponen, spek_komponen, koefisien, volume, satuan, harga_satuan, total_harga,
                    rincian, pajak, id_dana, nama_dana, is_paket, subs_bl_teks, ket_bl_teks, jenis_bl,
                    tahun_anggaran, NOW(), NOW()
                FROM data_rka 
                WHERE tahun_anggaran = ?
            ", [$postingId, $tahun]);

            // 4. Salin Capaian Program
            DB::insert("
                INSERT INTO posting_capaian_prog (
                    posting_id, id_capaian_bl, id_bl, id_sub_bl, id_skpd, id_sub_skpd,
                    id_program, id_giat, kode_sbl, capaianteks, targetcapaian, targetcapaianteks,
                    satuancapaian, tahun_anggaran, created_at, updated_at
                )
                SELECT 
                    ?, id_capaian_bl, id_bl, id_sub_bl, id_skpd, id_sub_skpd,
                    id_program, id_giat, kode_sbl, capaianteks, targetcapaian, targetcapaianteks,
                    satuancapaian, tahun_anggaran, NOW(), NOW()
                FROM data_capaian_prog_sub_keg 
                WHERE tahun_anggaran = ?
            ", [$postingId, $tahun]);

            // 5. Salin Indikator Sub Kegiatan
            DB::insert("
                INSERT INTO posting_indikator (
                    posting_id, idoutputbl, id_sub_bl, id_giat, id_program, id_skpd, id_sub_skpd,
                    kode_sbl, outputteks, targetoutput, targetoutputteks, satuanoutput,
                    tolok_ukur_sub, target_sub, satuan_sub, tipe, tahun_anggaran, created_at, updated_at
                )
                SELECT 
                    ?, idoutputbl, id_sub_bl, id_giat, id_program, id_skpd, id_sub_skpd,
                    kode_sbl, outputteks, targetoutput, targetoutputteks, satuanoutput,
                    tolok_ukur_sub, target_sub, satuan_sub, tipe, tahun_anggaran, NOW(), NOW()
                FROM data_sub_keg_indikator 
                WHERE tahun_anggaran = ?
            ", [$postingId, $tahun]);

            // 6. Salin Pendapatan
            DB::insert("
                INSERT INTO posting_pendapatan (
                    posting_id, id_pendapatan, id_skpd, kode_skpd, nama_skpd,
                    id_akun, kode_akun, nama_akun, uraian, keterangan, total, nilaimurni,
                    volume, satuan, koefisien, is_locked, tahun_anggaran, created_at, updated_at
                )
                SELECT 
                    ?, id_pendapatan, id_skpd, kode_skpd, nama_skpd,
                    id_akun, kode_akun, nama_akun, uraian, keterangan, total, nilaimurni,
                    volume, satuan, koefisien, is_locked, tahun_anggaran, NOW(), NOW()
                FROM data_pendapatan 
                WHERE tahun_anggaran = ?
            ", [$postingId, $tahun]);

            // 7. Salin Pembiayaan
            DB::insert("
                INSERT INTO posting_pembiayaan (
                    posting_id, id_pembiayaan, tipe, id_skpd, kode_skpd, nama_skpd,
                    id_akun, kode_akun, nama_akun, uraian, keterangan, total,
                    tahun_anggaran, created_at, updated_at
                )
                SELECT 
                    ?, id_pembiayaan, tipe, id_skpd, kode_skpd, nama_skpd,
                    id_akun, kode_akun, nama_akun, uraian, keterangan, total,
                    ?, NOW(), NOW()
                FROM data_pembiayaan 
                WHERE tahun_anggaran = ?
            ", [$postingId, $tahun, $pembiayaanTahun]);

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Data aktif berhasil diposting sebagai arsip baru!',
                'data' => $session
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal memposting data: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Menindih Data Posting yang Ada dengan Data Aktif Saat Ini
     */
    public function overwrite($id, Request $request)
    {
        $session = PostingSession::findOrFail($id);
        $tahun = $session->tahun_anggaran;
        $user = $request->user();

        // Hitung total dari data aktif terbaru
        $totalBelanja = (float) DB::table('data_sub_keg_bl')->where('tahun_anggaran', $tahun)->sum('pagu');
        $totalPendapatan = (float) DB::table('data_pendapatan')->where('tahun_anggaran', $tahun)->sum('total');

        $pembiayaanTahun = DB::table('data_pembiayaan')->where('tahun_anggaran', $tahun)->exists()
            ? $tahun
            : (DB::table('data_pembiayaan')->max('tahun_anggaran') ?? $tahun);

        $totalPenerimaan = (float) DB::table('data_pembiayaan')->where('tahun_anggaran', $pembiayaanTahun)->where('tipe', 'penerimaan')->sum('total');
        $totalPengeluaran = (float) DB::table('data_pembiayaan')->where('tahun_anggaran', $pembiayaanTahun)->where('tipe', 'pengeluaran')->sum('total');
        $pembiayaanNetto = $totalPenerimaan - $totalPengeluaran;
        $surplusDefisit = $totalPendapatan - $totalBelanja;

        $skpdCount = DB::table('data_sub_keg_bl')->where('tahun_anggaran', $tahun)->distinct('id_skpd')->count('id_skpd');
        $subKegCount = DB::table('data_sub_keg_bl')->where('tahun_anggaran', $tahun)->count();
        $rkaCount = DB::table('data_rka')->where('tahun_anggaran', $tahun)->count();
        $pendapatanCount = DB::table('data_pendapatan')->where('tahun_anggaran', $tahun)->count();
        $pembiayaanCount = DB::table('data_pembiayaan')->where('tahun_anggaran', $pembiayaanTahun)->count();

        DB::beginTransaction();
        try {
            // Hapus isi data posting lama untuk posting_id ini
            DB::table('posting_sub_keg_bl')->where('posting_id', $id)->delete();
            DB::table('posting_rka')->where('posting_id', $id)->delete();
            DB::table('posting_capaian_prog')->where('posting_id', $id)->delete();
            DB::table('posting_indikator')->where('posting_id', $id)->delete();
            DB::table('posting_pendapatan')->where('posting_id', $id)->delete();
            DB::table('posting_pembiayaan')->where('posting_id', $id)->delete();

            // Salin data aktif terbaru ke tabel posting
            DB::insert("
                INSERT INTO posting_sub_keg_bl (
                    posting_id, id_sub_bl, id_unik_sub_bl, id_unit, id_skpd, id_sub_skpd, 
                    id_bidang_urusan, id_program, id_giat, id_bl, id_sub_giat,
                    kode_skpd, nama_skpd, kode_sub_skpd, nama_sub_skpd, 
                    kode_bidang_urusan, nama_bidang_urusan, kode_program, nama_program, 
                    kode_giat, nama_giat, kode_sub_giat, nama_sub_giat, kode_bl, kode_sbl,
                    pagu, pagu_indikatif, pagu_n_depan, pagu_n2_depan, 
                    id_dana, nama_dana, id_lokasi, nama_lokasi, waktu_awal, waktu_akhir,
                    indikator, satuan, target_1, sasaran, tahun_anggaran, created_at, updated_at
                )
                SELECT 
                    ?, id_sub_bl, id_unik_sub_bl, id_unit, id_skpd, id_sub_skpd, 
                    id_bidang_urusan, id_program, id_giat, id_bl, id_sub_giat,
                    kode_skpd, nama_skpd, kode_sub_skpd, nama_sub_skpd, 
                    kode_bidang_urusan, nama_bidang_urusan, kode_program, nama_program, 
                    kode_giat, nama_giat, kode_sub_giat, nama_sub_giat, kode_bl, kode_sbl,
                    pagu, pagu_indikatif, pagu_n_depan, pagu_n2_depan, 
                    id_dana, nama_dana, id_lokasi, nama_lokasi, waktu_awal, waktu_akhir,
                    indikator, satuan, target_1, sasaran, tahun_anggaran, NOW(), NOW()
                FROM data_sub_keg_bl 
                WHERE tahun_anggaran = ?
            ", [$id, $tahun]);

            DB::insert("
                INSERT INTO posting_rka (
                    posting_id, id_rinci_sub_bl, id_unik, id_sub_bl, id_bl, id_unit, id_skpd, id_sub_skpd,
                    kode_bl, kode_sbl, kode_akun, nama_akun, kode_standar_harga, nama_standar_harga,
                    nama_komponen, spek_komponen, koefisien, volume, satuan, harga_satuan, total_harga,
                    rincian, pajak, id_dana, nama_dana, is_paket, subs_bl_teks, ket_bl_teks, jenis_bl,
                    tahun_anggaran, created_at, updated_at
                )
                SELECT 
                    ?, id_rinci_sub_bl, id_unik, id_sub_bl, id_bl, id_unit, id_skpd, id_sub_skpd,
                    kode_bl, kode_sbl, kode_akun, nama_akun, kode_standar_harga, nama_standar_harga,
                    nama_komponen, spek_komponen, koefisien, volume, satuan, harga_satuan, total_harga,
                    rincian, pajak, id_dana, nama_dana, is_paket, subs_bl_teks, ket_bl_teks, jenis_bl,
                    tahun_anggaran, NOW(), NOW()
                FROM data_rka 
                WHERE tahun_anggaran = ?
            ", [$id, $tahun]);

            DB::insert("
                INSERT INTO posting_capaian_prog (
                    posting_id, id_capaian_bl, id_bl, id_sub_bl, id_skpd, id_sub_skpd,
                    id_program, id_giat, kode_sbl, capaianteks, targetcapaian, targetcapaianteks,
                    satuancapaian, tahun_anggaran, created_at, updated_at
                )
                SELECT 
                    ?, id_capaian_bl, id_bl, id_sub_bl, id_skpd, id_sub_skpd,
                    id_program, id_giat, kode_sbl, capaianteks, targetcapaian, targetcapaianteks,
                    satuancapaian, tahun_anggaran, NOW(), NOW()
                FROM data_capaian_prog_sub_keg 
                WHERE tahun_anggaran = ?
            ", [$id, $tahun]);

            DB::insert("
                INSERT INTO posting_indikator (
                    posting_id, idoutputbl, id_sub_bl, id_giat, id_program, id_skpd, id_sub_skpd,
                    kode_sbl, outputteks, targetoutput, targetoutputteks, satuanoutput,
                    tolok_ukur_sub, target_sub, satuan_sub, tipe, tahun_anggaran, created_at, updated_at
                )
                SELECT 
                    ?, idoutputbl, id_sub_bl, id_giat, id_program, id_skpd, id_sub_skpd,
                    kode_sbl, outputteks, targetoutput, targetoutputteks, satuanoutput,
                    tolok_ukur_sub, target_sub, satuan_sub, tipe, tahun_anggaran, NOW(), NOW()
                FROM data_sub_keg_indikator 
                WHERE tahun_anggaran = ?
            ", [$id, $tahun]);

            DB::insert("
                INSERT INTO posting_pendapatan (
                    posting_id, id_pendapatan, id_skpd, kode_skpd, nama_skpd,
                    id_akun, kode_akun, nama_akun, uraian, keterangan, total, nilaimurni,
                    volume, satuan, koefisien, is_locked, tahun_anggaran, created_at, updated_at
                )
                SELECT 
                    ?, id_pendapatan, id_skpd, kode_skpd, nama_skpd,
                    id_akun, kode_akun, nama_akun, uraian, keterangan, total, nilaimurni,
                    volume, satuan, koefisien, is_locked, tahun_anggaran, NOW(), NOW()
                FROM data_pendapatan 
                WHERE tahun_anggaran = ?
            ", [$id, $tahun]);

            DB::insert("
                INSERT INTO posting_pembiayaan (
                    posting_id, id_pembiayaan, tipe, id_skpd, kode_skpd, nama_skpd,
                    id_akun, kode_akun, nama_akun, uraian, keterangan, total,
                    tahun_anggaran, created_at, updated_at
                )
                SELECT 
                    ?, id_pembiayaan, tipe, id_skpd, kode_skpd, nama_skpd,
                    id_akun, kode_akun, nama_akun, uraian, keterangan, total,
                    ?, NOW(), NOW()
                FROM data_pembiayaan 
                WHERE tahun_anggaran = ?
            ", [$id, $tahun, $pembiayaanTahun]);

            // Update metadata sesi posting
            $session->update([
                'total_belanja' => $totalBelanja,
                'total_pendapatan' => $totalPendapatan,
                'total_pembiayaan_penerimaan' => $totalPenerimaan,
                'total_pembiayaan_pengeluaran' => $totalPengeluaran,
                'total_pembiayaan_netto' => $pembiayaanNetto,
                'surplus_defisit' => $surplusDefisit,
                'jumlah_skpd' => $skpdCount,
                'jumlah_sub_kegiatan' => $subKegCount,
                'jumlah_rekening_rka' => $rkaCount,
                'jumlah_rekening_pendapatan' => $pendapatanCount,
                'jumlah_rekening_pembiayaan' => $pembiayaanCount,
                'last_synced_at' => now(),
            ]);

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Data posting "' . $session->nama_posting . '" berhasil ditindih dengan data aktif terbaru!',
                'data' => $session
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal menindih data posting: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Unposting Data: Kembalikan / Gantikan Data Aktif dengan Data dari Posting ini
     */
    public function unposting($id, Request $request)
    {
        $session = PostingSession::findOrFail($id);
        $tahun = $session->tahun_anggaran;

        DB::beginTransaction();
        try {
            // 1. Kosongkan data aktif untuk tahun anggaran terkait
            DB::table('data_sub_keg_bl')->where('tahun_anggaran', $tahun)->delete();
            DB::table('data_rka')->where('tahun_anggaran', $tahun)->delete();
            DB::table('data_capaian_prog_sub_keg')->where('tahun_anggaran', $tahun)->delete();
            DB::table('data_sub_keg_indikator')->where('tahun_anggaran', $tahun)->delete();
            DB::table('data_pendapatan')->where('tahun_anggaran', $tahun)->delete();
            DB::table('data_pendapatan_skpd')->where('tahun_anggaran', $tahun)->delete();
            DB::table('data_pembiayaan')->where('tahun_anggaran', $tahun)->delete();
            DB::table('data_pembiayaan_skpd')->where('tahun_anggaran', $tahun)->delete();

            // 2. Salin Sub Kegiatan Belanja dari Snapshot Posting
            DB::insert("
                INSERT INTO data_sub_keg_bl (
                    id_sub_bl, id_unik_sub_bl, id_unit, id_skpd, id_sub_skpd, 
                    id_bidang_urusan, id_program, id_giat, id_bl, id_sub_giat,
                    kode_skpd, nama_skpd, kode_sub_skpd, nama_sub_skpd, 
                    kode_bidang_urusan, nama_bidang_urusan, kode_program, nama_program, 
                    kode_giat, nama_giat, kode_sub_giat, nama_sub_giat, kode_bl, kode_sbl,
                    pagu, pagu_indikatif, pagu_n_depan, pagu_n2_depan, 
                    id_dana, nama_dana, id_lokasi, nama_lokasi, waktu_awal, waktu_akhir,
                    indikator, satuan, target_1, sasaran, tahun_anggaran, active, created_at, updated_at
                )
                SELECT 
                    id_sub_bl, id_unik_sub_bl, id_unit, id_skpd, id_sub_skpd, 
                    id_bidang_urusan, id_program, id_giat, id_bl, id_sub_giat,
                    kode_skpd, nama_skpd, kode_sub_skpd, nama_sub_skpd, 
                    kode_bidang_urusan, nama_bidang_urusan, kode_program, nama_program, 
                    kode_giat, nama_giat, kode_sub_giat, nama_sub_giat, kode_bl, kode_sbl,
                    pagu, pagu_indikatif, pagu_n_depan, pagu_n2_depan, 
                    id_dana, nama_dana, id_lokasi, nama_lokasi, waktu_awal, waktu_akhir,
                    indikator, satuan, target_1, sasaran, tahun_anggaran, 1, NOW(), NOW()
                FROM posting_sub_keg_bl 
                WHERE posting_id = ?
            ", [$id]);

            // 3. Salin RKA dari Snapshot Posting
            DB::insert("
                INSERT INTO data_rka (
                    id_rinci_sub_bl, id_unik, id_sub_bl, id_bl, id_unit, id_skpd, id_sub_skpd,
                    kode_bl, kode_sbl, kode_akun, nama_akun, kode_standar_harga, nama_standar_harga,
                    nama_komponen, spek_komponen, koefisien, volume, satuan, harga_satuan, total_harga,
                    rincian, pajak, id_dana, nama_dana, is_paket, subs_bl_teks, ket_bl_teks, jenis_bl,
                    tahun_anggaran, active, created_at, updated_at
                )
                SELECT 
                    id_rinci_sub_bl, id_unik, id_sub_bl, id_bl, id_unit, id_skpd, id_sub_skpd,
                    kode_bl, kode_sbl, kode_akun, nama_akun, kode_standar_harga, nama_standar_harga,
                    nama_komponen, spek_komponen, koefisien, volume, satuan, harga_satuan, total_harga,
                    rincian, pajak, id_dana, nama_dana, is_paket, subs_bl_teks, ket_bl_teks, jenis_bl,
                    tahun_anggaran, 1, NOW(), NOW()
                FROM posting_rka 
                WHERE posting_id = ?
            ", [$id]);

            // 4. Salin Capaian Program
            DB::insert("
                INSERT INTO data_capaian_prog_sub_keg (
                    id_capaian_bl, id_bl, id_sub_bl, id_skpd, id_sub_skpd,
                    id_program, id_giat, kode_sbl, capaianteks, targetcapaian, targetcapaianteks,
                    satuancapaian, tahun_anggaran, active, created_at, updated_at
                )
                SELECT 
                    id_capaian_bl, id_bl, id_sub_bl, id_skpd, id_sub_skpd,
                    id_program, id_giat, kode_sbl, capaianteks, targetcapaian, targetcapaianteks,
                    satuancapaian, tahun_anggaran, 1, NOW(), NOW()
                FROM posting_capaian_prog 
                WHERE posting_id = ?
            ", [$id]);

            // 5. Salin Indikator
            DB::insert("
                INSERT INTO data_sub_keg_indikator (
                    idoutputbl, id_sub_bl, id_giat, id_program, id_skpd, id_sub_skpd,
                    kode_sbl, outputteks, targetoutput, targetoutputteks, satuanoutput,
                    tolok_ukur_sub, target_sub, satuan_sub, tipe, tahun_anggaran, active, created_at, updated_at
                )
                SELECT 
                    idoutputbl, id_sub_bl, id_giat, id_program, id_skpd, id_sub_skpd,
                    kode_sbl, outputteks, targetoutput, targetoutputteks, satuanoutput,
                    tolok_ukur_sub, target_sub, satuan_sub, tipe, tahun_anggaran, 1, NOW(), NOW()
                FROM posting_indikator 
                WHERE posting_id = ?
            ", [$id]);

            // 6. Salin Pendapatan
            DB::insert("
                INSERT INTO data_pendapatan (
                    id_pendapatan, id_skpd, kode_skpd, nama_skpd,
                    id_akun, kode_akun, nama_akun, uraian, keterangan, total, nilaimurni,
                    volume, satuan, koefisien, is_locked, tahun_anggaran, active, created_at, updated_at
                )
                SELECT 
                    id_pendapatan, id_skpd, kode_skpd, nama_skpd,
                    id_akun, kode_akun, nama_akun, uraian, keterangan, total, nilaimurni,
                    volume, satuan, koefisien, is_locked, tahun_anggaran, 1, NOW(), NOW()
                FROM posting_pendapatan 
                WHERE posting_id = ?
            ", [$id]);

            // Re-generate rekapitulasi data_pendapatan_skpd
            DB::insert("
                INSERT INTO data_pendapatan_skpd (
                    id_skpd, kode_skpd, nama_skpd, jumlah_rekening, total, tahun_anggaran, active, created_at, updated_at
                )
                SELECT 
                    id_skpd, MAX(kode_skpd), MAX(nama_skpd), COUNT(*), SUM(total), tahun_anggaran, 1, NOW(), NOW()
                FROM data_pendapatan
                WHERE tahun_anggaran = ?
                GROUP BY id_skpd, tahun_anggaran
            ", [$tahun]);

            // 7. Salin Pembiayaan
            DB::insert("
                INSERT INTO data_pembiayaan (
                    id_pembiayaan, tipe, id_skpd, kode_skpd, nama_skpd,
                    id_akun, kode_akun, nama_akun, uraian, keterangan, total,
                    tahun_anggaran, active, created_at, updated_at
                )
                SELECT 
                    id_pembiayaan, tipe, id_skpd, kode_skpd, nama_skpd,
                    id_akun, kode_akun, nama_akun, uraian, keterangan, total,
                    tahun_anggaran, 1, NOW(), NOW()
                FROM posting_pembiayaan 
                WHERE posting_id = ?
            ", [$id]);

            // Re-generate rekapitulasi data_pembiayaan_skpd
            DB::insert("
                INSERT INTO data_pembiayaan_skpd (
                    tipe, id_skpd, kode_skpd, nama_skpd, jumlah_rekening, total, tahun_anggaran, active, created_at, updated_at
                )
                SELECT 
                    tipe, id_skpd, MAX(kode_skpd), MAX(nama_skpd), COUNT(*), SUM(total), tahun_anggaran, 1, NOW(), NOW()
                FROM data_pembiayaan
                WHERE tahun_anggaran = ?
                GROUP BY tipe, id_skpd, tahun_anggaran
            ", [$tahun]);

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Unposting berhasil! Data aktif saat ini telah digantikan dengan data dari posting "' . $session->nama_posting . '".',
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal melakukan unposting: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Lihat Rincian Data di Dalam Sesi Posting Tertentu
     */
    public function show($id)
    {
        $session = PostingSession::findOrFail($id);

        // Rekapitulasi per SKPD dalam postingan ini
        $skpdBelanja = DB::table('posting_sub_keg_bl')
            ->where('posting_id', $id)
            ->select(
                'id_skpd',
                'kode_skpd',
                'nama_skpd',
                DB::raw('COUNT(*) as total_sub_kegiatan'),
                DB::raw('SUM(pagu) as total_pagu')
            )
            ->groupBy('id_skpd', 'kode_skpd', 'nama_skpd')
            ->orderBy('kode_skpd')
            ->get();

        // Rekapitulasi Pendapatan per SKPD dalam postingan ini
        $skpdPendapatan = DB::table('posting_pendapatan')
            ->where('posting_id', $id)
            ->select(
                'id_skpd',
                'kode_skpd',
                'nama_skpd',
                DB::raw('COUNT(*) as total_rekening'),
                DB::raw('SUM(total) as total_pendapatan')
            )
            ->groupBy('id_skpd', 'kode_skpd', 'nama_skpd')
            ->orderBy('kode_skpd')
            ->get();

        // Rekapitulasi Pembiayaan dalam postingan ini
        $pembiayaanList = DB::table('posting_pembiayaan')
            ->where('posting_id', $id)
            ->select(
                'tipe',
                'kode_akun',
                'nama_akun',
                'uraian',
                'total'
            )
            ->orderBy('tipe')
            ->orderBy('kode_akun')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => [
                'session' => $session,
                'skpd_belanja' => $skpdBelanja,
                'skpd_pendapatan' => $skpdPendapatan,
                'pembiayaan' => $pembiayaanList,
            ]
        ]);
    }

    /**
     * Hapus Sesi Posting
     */
    public function destroy($id)
    {
        $session = PostingSession::findOrFail($id);
        $nama = $session->nama_posting;
        $session->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Sesi posting "' . $nama . '" beserta data arsipnya berhasil dihapus.'
        ]);
    }

    /**
     * Dapatkan daftar tahapan posting
     */
    public function getTahapan()
    {
        $tahapan = PostingTahapan::orderBy('urutan', 'asc')->orderBy('id', 'asc')->get();
        return response()->json([
            'status' => 'success',
            'data' => $tahapan
        ]);
    }

    /**
     * Tambah Tahapan Baru
     */
    public function storeTahapan(Request $request)
    {
        $validated = $request->validate([
            'nama_tahap' => 'required|string|max:150|unique:master_tahapan_posting,nama_tahap',
            'keterangan' => 'nullable|string',
            'urutan' => 'nullable|integer',
        ]);

        $maxUrutan = PostingTahapan::max('urutan') ?? 0;

        $tahapan = PostingTahapan::create([
            'nama_tahap' => trim($validated['nama_tahap']),
            'keterangan' => $validated['keterangan'] ?? null,
            'urutan' => $validated['urutan'] ?? ($maxUrutan + 1),
            'is_default' => false,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Tahapan baru "' . $tahapan->nama_tahap . '" berhasil ditambahkan.',
            'data' => $tahapan
        ]);
    }

    /**
     * Hapus Tahapan
     */
    public function deleteTahapan($id)
    {
        $tahapan = PostingTahapan::findOrFail($id);
        $nama = $tahapan->nama_tahap;
        $tahapan->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Tahapan "' . $nama . '" berhasil dihapus.'
        ]);
    }

    /**
     * Posting Explorer: Ambil Daftar SKPD Belanja dalam Sesi Posting (Paginated + Search)
     */
    public function getPostingSkpdList($postingId, Request $request)
    {
        $session = PostingSession::findOrFail($postingId);

        $query = DB::table('posting_sub_keg_bl')
            ->where('posting_id', $postingId);

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('kode_skpd', 'like', "%{$search}%")
                  ->orWhere('nama_skpd', 'like', "%{$search}%");
            });
        }

        $base = (clone $query)->select(
            'id_skpd',
            'kode_skpd',
            'nama_skpd',
            DB::raw('COUNT(*) as total_sub_kegiatan'),
            DB::raw('SUM(pagu) as total_pagu')
        )->groupBy('id_skpd', 'kode_skpd', 'nama_skpd')
         ->orderBy('kode_skpd');

        $totalSkpd = DB::table('posting_sub_keg_bl')
            ->where('posting_id', $postingId)
            ->distinct('id_skpd')
            ->count('id_skpd');

        $totalPagu = (float) DB::table('posting_sub_keg_bl')
            ->where('posting_id', $postingId)
            ->sum('pagu');

        // Struktur hirarki parent SKPD + sub-unit (Kantor Induk, RSUD, Puskesmas)
        $hierarchyRows = DB::table('posting_sub_keg_bl')
            ->where('posting_id', $postingId)
            ->select(
                'kode_skpd',
                'nama_skpd',
                'id_skpd',
                'kode_sub_skpd',
                'nama_sub_skpd',
                'id_sub_skpd',
                DB::raw('COUNT(*) as count_sub'),
                DB::raw('SUM(pagu) as total_pagu')
            )
            ->groupBy('kode_skpd', 'nama_skpd', 'id_skpd', 'kode_sub_skpd', 'nama_sub_skpd', 'id_sub_skpd')
            ->orderBy('kode_skpd')
            ->orderBy('kode_sub_skpd')
            ->get();

        $hierarchyMap = [];
        foreach ($hierarchyRows as $r) {
            $parentCode = $r->kode_skpd ?: 'TANPA-KODE';
            if (!isset($hierarchyMap[$parentCode])) {
                $hierarchyMap[$parentCode] = [
                    'kode_skpd' => $r->kode_skpd,
                    'nama_skpd' => $r->nama_skpd,
                    'id_skpd' => $r->id_skpd,
                    'total_sub_keg' => 0,
                    'total_pagu' => 0,
                    'sub_units' => [],
                ];
            }

            $hierarchyMap[$parentCode]['total_sub_keg'] += (int) $r->count_sub;
            $hierarchyMap[$parentCode]['total_pagu'] += (float) $r->total_pagu;

            $lower = strtolower($r->nama_sub_skpd ?? '');
            $type = 'dinas';
            if (str_contains($lower, 'rsud') || str_contains($lower, 'rumah sakit')) {
                $type = 'rsud';
            } elseif (str_contains($lower, 'puskesmas') || str_contains($lower, 'uptd')) {
                $type = 'puskesmas';
            }

            $hierarchyMap[$parentCode]['sub_units'][] = [
                'kode_sub_skpd' => $r->kode_sub_skpd,
                'nama_sub_skpd' => $r->nama_sub_skpd,
                'id_sub_skpd' => $r->id_sub_skpd,
                'count_sub' => (int) $r->count_sub,
                'total_pagu' => (float) $r->total_pagu,
                'unit_type' => $type,
            ];
        }

        $hierarchy = array_values(array_map(function ($skpd) {
            $skpd['has_children'] = count($skpd['sub_units']) > 1
                || (count($skpd['sub_units']) === 1 && $skpd['sub_units'][0]['kode_sub_skpd'] !== $skpd['kode_skpd']);
            return $skpd;
        }, $hierarchyMap));

        $perPage = $request->input('per_page', 25);
        if ($perPage === 'all' || (int)$perPage === -1) {
            $data = $base->get();
        } else {
            $perPage = min(max((int) $perPage, 5), 200);
            $data = $base->paginate($perPage);
        }

        return response()->json([
            'status' => 'success',
            'data' => $data,
            'hierarchy' => $hierarchy,
            'summary' => [
                'total_skpd' => $totalSkpd,
                'total_pagu' => $totalPagu,
            ]
        ]);
    }

    /**
     * Posting Explorer: Ambil Daftar Sub Kegiatan Belanja dalam Sesi Posting
     */
    public function getPostingSubKegiatan($postingId, Request $request)
    {
        $session = PostingSession::findOrFail($postingId);

        $query = DB::table('posting_sub_keg_bl')
            ->where('posting_id', $postingId);

        if ($request->filled('skpd') && $request->input('skpd') !== 'all') {
            $skpd = $request->input('skpd');
            $query->where(function($q) use ($skpd) {
                $q->where('nama_skpd', $skpd)
                  ->orWhere('kode_skpd', $skpd)
                  ->orWhere('id_skpd', $skpd);
            });
        }

        if ($request->filled('sub_skpd') && $request->input('sub_skpd') !== 'all') {
            $subSkpd = $request->input('sub_skpd');
            $query->where(function($q) use ($subSkpd) {
                $q->where('nama_sub_skpd', $subSkpd)
                  ->orWhere('kode_sub_skpd', $subSkpd);
            });
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('kode_sub_giat', 'like', "%{$search}%")
                  ->orWhere('nama_sub_giat', 'like', "%{$search}%")
                  ->orWhere('kode_sbl', 'like', "%{$search}%")
                  ->orWhere('nama_sub_skpd', 'like', "%{$search}%");
            });
        }

        $perPage = min(max((int) $request->input('per_page', 15), 1), 100);
        $data = $query->orderBy('kode_sub_giat')->paginate($perPage);

        return response()->json([
            'status' => 'success',
            'data' => $data,
        ]);
    }

    /**
     * Posting Explorer: Ambil Detail Sub Kegiatan + RKA Belanja dalam Sesi Posting
     */
    public function getPostingSubKegiatanDetail($postingId, $subKegiatanId)
    {
        $sub = DB::table('posting_sub_keg_bl')
            ->where('posting_id', $postingId)
            ->where('id', $subKegiatanId)
            ->first();

        if (!$sub) {
            return response()->json(['status' => 'error', 'message' => 'Sub kegiatan tidak ditemukan.'], 404);
        }

        $rkaItems = DB::table('posting_rka')
            ->where('posting_id', $postingId)
            ->where('kode_sbl', $sub->kode_sbl)
            ->orderBy('kode_akun')
            ->orderBy('id')
            ->get();

        $indikator = DB::table('posting_indikator')
            ->where('posting_id', $postingId)
            ->where('kode_sbl', $sub->kode_sbl)
            ->get();

        $capaian = DB::table('posting_capaian_prog')
            ->where('posting_id', $postingId)
            ->where('kode_sbl', $sub->kode_sbl)
            ->get();

        $subObj = (array) $sub;
        $subObj['rka'] = $rkaItems;
        $subObj['indikator_keluaran'] = $indikator;
        $subObj['capaian'] = $capaian;

        return response()->json([
            'status' => 'success',
            'data' => $subObj,
        ]);
    }

    /**
     * Posting Explorer: Ambil Data Cetak Formulir RKA untuk Sesi Posting
     */
    public function getPostingRkaPrintData($postingId, $subKegiatanId)
    {
        $session = PostingSession::findOrFail($postingId);

        $sub = DB::table('posting_sub_keg_bl')
            ->where('posting_id', $postingId)
            ->where('id', $subKegiatanId)
            ->first();

        if (!$sub) {
            return response()->json(['status' => 'error', 'message' => 'Data tidak ditemukan.'], 404);
        }

        $rkaItems = DB::table('posting_rka')
            ->where('posting_id', $postingId)
            ->where('kode_sbl', $sub->kode_sbl)
            ->orderBy('kode_akun')
            ->orderBy('id')
            ->get();

        $indikator = DB::table('posting_indikator')
            ->where('posting_id', $postingId)
            ->where('kode_sbl', $sub->kode_sbl)
            ->get();

        $capaian = DB::table('posting_capaian_prog')
            ->where('posting_id', $postingId)
            ->where('kode_sbl', $sub->kode_sbl)
            ->get();

        $subObj = (array) $sub;
        $subObj['indikator_keluaran'] = $indikator;
        $subObj['capaian'] = $capaian;

        $kepalaSkpd = DataUnit::findKepalaSkpd(
            isset($sub->id_skpd) && $sub->id_skpd ? (int) $sub->id_skpd : null,
            $sub->kode_skpd ?? null,
            $session->tahun_anggaran ? (int) $session->tahun_anggaran : null
        );

        return response()->json([
            'status' => 'success',
            'data' => [
                'session' => $session,
                'sub_kegiatan' => $subObj,
                'rka_items' => $rkaItems,
                'kepala_skpd' => $kepalaSkpd,
            ]
        ]);
    }

    /**
     * Posting Explorer: Ambil Data Rincian Pendapatan dalam Sesi Posting
     */
    public function getPostingPendapatan($postingId, Request $request)
    {
        $session = PostingSession::findOrFail($postingId);

        $query = DB::table('posting_pendapatan')
            ->where('posting_id', $postingId);

        if ($request->filled('id_skpd')) {
            $query->where('id_skpd', $request->input('id_skpd'));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('kode_akun', 'like', "%{$search}%")
                  ->orWhere('nama_akun', 'like', "%{$search}%")
                  ->orWhere('uraian', 'like', "%{$search}%")
                  ->orWhere('nama_skpd', 'like', "%{$search}%");
            });
        }

        $perPage = min(max((int) $request->input('per_page', 50), 1), 500);
        $data = $query->orderBy('kode_skpd')->orderBy('kode_akun')->paginate($perPage);

        $totalNilai = (float) DB::table('posting_pendapatan')
            ->where('posting_id', $postingId)
            ->sum('total');

        return response()->json([
            'status' => 'success',
            'data' => $data,
            'summary' => [
                'total_nilai' => $totalNilai,
            ]
        ]);
    }

    /**
     * Posting Explorer: Ambil Data Rincian Pembiayaan dalam Sesi Posting
     */
    public function getPostingPembiayaan($postingId, Request $request)
    {
        $session = PostingSession::findOrFail($postingId);
        $tipe = strtolower((string) $request->input('tipe', 'penerimaan'));

        $query = DB::table('posting_pembiayaan')
            ->where('posting_id', $postingId)
            ->where('tipe', $tipe);

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('kode_akun', 'like', "%{$search}%")
                  ->orWhere('nama_akun', 'like', "%{$search}%")
                  ->orWhere('uraian', 'like', "%{$search}%");
            });
        }

        $perPage = min(max((int) $request->input('per_page', 50), 1), 500);
        $data = $query->orderBy('kode_akun')->paginate($perPage);

        $totalNilai = (float) DB::table('posting_pembiayaan')
            ->where('posting_id', $postingId)
            ->where('tipe', $tipe)
            ->sum('total');

        return response()->json([
            'status' => 'success',
            'data' => $data,
            'summary' => [
                'total_nilai' => $totalNilai,
            ]
        ]);
    }
}
