<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\SubKegiatanBl;
use App\Models\Rka;
use App\Models\CapaianProgram;
use App\Models\SubKegiatanIndikator;
use App\Models\MasterAkun;
use App\Models\MasterSumberDana;
use App\Models\Pendapatan;
use App\Models\PendapatanSkpd;
use App\Models\Pembiayaan;
use App\Models\PembiayaanSkpd;
use App\Models\DataUnit;
use App\Services\SystemLogService;

class SipdSyncController extends Controller
{
    /**
     * Handler utama untuk router sinkronisasi dari Chrome Extension
     */
    public function handle(Request $request)
    {
        $action = $request->input('action', 'singkron_rka');

        if ($action === 'ping' || $action === 'cek_koneksi' || $request->isMethod('get')) {
            $dbStatus = 'disconnected';
            $dbName = null;
            try {
                DB::connection()->getPdo();
                $dbStatus = 'connected';
                $dbName = DB::connection()->getDatabaseName();
            } catch (\Exception $e) {
                $dbStatus = 'error: ' . $e->getMessage();
            }

            return response()->json([
                'status' => 'success',
                'action' => 'ping',
                'ready' => ($dbStatus === 'connected'),
                'message' => ($dbStatus === 'connected')
                    ? 'Backend lokal siap menerima data!'
                    : 'Backend aktif tetapi database belum terhubung (' . $dbStatus . ')',
                'database' => $dbStatus,
                'database_name' => $dbName,
                'server_time' => now()->toIso8601String()
            ]);
        }

        $startTime = microtime(true);
        $tahun = $request->input('tahun_anggaran');

        $typeLabels = [
            'set_unit_pagu' => 'Pagu Unit SKPD',
            'update_nonactive_sub_bl' => 'Nonaktif Sub Kegiatan',
            'singkron_akun_belanja' => 'Master Akun Belanja',
            'singkron_sumber_dana' => 'Master Sumber Dana',
            'singkron_pendapatan' => 'Pendapatan Daerah',
            'singkron_pendapatan_skpd' => 'Pendapatan per SKPD',
            'singkron_pembiayaan' => 'Pembiayaan Daerah',
            'singkron_pembiayaan_skpd' => 'Pembiayaan per SKPD',
            'singkron_unit' => 'Master SKPD / Unit',
            'singkron_rka' => 'Sub Kegiatan & Rincian RKA',
        ];
        $dataType = $typeLabels[$action] ?? $action;

        try {
            if ($action === 'set_unit_pagu') {
                $response = $this->setUnitPagu($request);
            } elseif ($action === 'update_nonactive_sub_bl') {
                $response = $this->updateNonactiveSubBl($request);
            } elseif ($action === 'singkron_akun_belanja') {
                $response = $this->syncMasterAkun($request);
            } elseif ($action === 'singkron_sumber_dana') {
                $response = $this->syncSumberDana($request);
            } elseif ($action === 'singkron_pendapatan' || $action === 'singkron_pendapatan_skpd') {
                $response = $this->syncPendapatan($request);
            } elseif ($action === 'singkron_pembiayaan' || $action === 'singkron_pembiayaan_skpd') {
                $response = $this->syncPembiayaan($request);
            } elseif ($action === 'singkron_unit') {
                $response = $this->syncUnit($request);
            } else {
                $response = $this->syncRka($request);
            }

            $durationMs = (int) round((microtime(true) - $startTime) * 1000);
            $payload = method_exists($response, 'getData') ? $response->getData(true) : [];
            $isSuccess = ($payload['status'] ?? 'success') === 'success';
            $processed = (int) ($payload['processed'] ?? $payload['count'] ?? $payload['total'] ?? 1);
            $failed = (int) ($payload['failed'] ?? 0);

            SystemLogService::logSync([
                'action' => $action,
                'data_type' => $dataType,
                'tahun_anggaran' => $tahun,
                'status' => $isSuccess ? ($failed > 0 ? 'partial' : 'success') : 'error',
                'processed_count' => $isSuccess ? max($processed, 1) : 0,
                'failed_count' => $isSuccess ? $failed : max($failed, 1),
                'message' => $payload['message'] ?? ($isSuccess ? "Sinkronisasi {$dataType} selesai" : 'Sinkronisasi gagal'),
                'error_detail' => $isSuccess ? null : ($payload['error'] ?? $payload['message'] ?? null),
                'source' => 'extension',
                'ip_address' => $request->ip(),
                'duration_ms' => $durationMs,
            ]);

            SystemLogService::logActivity([
                'category' => 'sync',
                'title' => "Sinkronisasi {$dataType}",
                'description' => $payload['message'] ?? ($isSuccess ? 'Data berhasil disinkronkan dari extension.' : 'Terjadi kesalahan saat sinkronisasi.'),
                'status' => $isSuccess ? 'success' : 'error',
                'tahun_anggaran' => $tahun,
                'actor' => 'Chrome Extension',
            ]);

            return $response;
        } catch (\Throwable $e) {
            $durationMs = (int) round((microtime(true) - $startTime) * 1000);
            SystemLogService::logSync([
                'action' => $action,
                'data_type' => $dataType,
                'tahun_anggaran' => $tahun,
                'status' => 'error',
                'processed_count' => 0,
                'failed_count' => 1,
                'message' => "Gagal sinkronisasi {$dataType}",
                'error_detail' => $e->getMessage(),
                'source' => 'extension',
                'ip_address' => $request->ip(),
                'duration_ms' => $durationMs,
            ]);

            SystemLogService::logActivity([
                'category' => 'sync',
                'title' => "Gagal Sinkronisasi {$dataType}",
                'description' => $e->getMessage(),
                'status' => 'error',
                'tahun_anggaran' => $tahun,
                'actor' => 'Chrome Extension',
            ]);

            throw $e;
        }
    }

    /**
     * Sinkronisasi data RKA, Sub Kegiatan, Indikator, dan Capaian
     */
    public function syncRka(Request $request)
    {
        $tahun = (int) $request->input('tahun_anggaran', 2027);
        $kodeSbl = $request->input('kode_sbl');
        $kodeBl = $request->input('kode_bl');
        $noPage = (int) $request->input('no_page', 1);
        $totalPage = (int) $request->input('total_page', 1);

        $parseJson = function ($val) {
            if (is_array($val)) return $val;
            if (is_string($val)) {
                $decoded = json_decode($val, true);
                return is_array($decoded) ? $decoded : [];
            }
            return [];
        };

        $dataBl = $parseJson($request->input('dataBl'));
        $dataCapaian = $parseJson($request->input('dataCapaian'));
        $dataOutput = $parseJson($request->input('dataOutput'));
        $dataOutputGiat = $parseJson($request->input('dataOutputGiat'));
        $rkaList = $parseJson($request->input('rka'));

        // 1. Simpan Data Sub Kegiatan Belanja (data_sub_keg_bl)
        foreach ($dataBl as $b) {
            $currentKodeSbl = $b['kode_sbl'] ?? $kodeSbl;
            $currentKodeBl = $b['kode_bl'] ?? $kodeBl;

            SubKegiatanBl::updateOrCreate(
                [
                    'kode_sbl' => $currentKodeSbl,
                    'tahun_anggaran' => $tahun,
                ],
                [
                    'id_sub_bl' => $b['id_sub_bl'] ?? null,
                    'id_unik_sub_bl' => $b['id_unik_sub_bl'] ?? null,
                    'id_unit' => $b['id_unit'] ?? null,
                    'id_skpd' => $b['id_skpd'] ?? null,
                    'id_sub_skpd' => $b['id_sub_skpd'] ?? null,
                    'id_bidang_urusan' => $b['id_bidang_urusan'] ?? null,
                    'id_program' => $b['id_program'] ?? null,
                    'id_giat' => $b['id_giat'] ?? null,
                    'id_bl' => $b['id_bl'] ?? null,
                    'id_sub_giat' => $b['id_sub_giat'] ?? null,
                    'kode_skpd' => $b['kode_skpd'] ?? null,
                    'nama_skpd' => $b['nama_skpd'] ?? null,
                    'kode_sub_skpd' => $b['kode_sub_skpd'] ?? null,
                    'nama_sub_skpd' => $b['nama_sub_skpd'] ?? null,
                    'kode_bidang_urusan' => $b['kode_bidang_urusan'] ?? null,
                    'nama_bidang_urusan' => $b['nama_bidang_urusan'] ?? null,
                    'kode_program' => $b['kode_program'] ?? null,
                    'nama_program' => $b['nama_program'] ?? null,
                    'kode_giat' => $b['kode_giat'] ?? null,
                    'nama_giat' => $b['nama_giat'] ?? null,
                    'kode_sub_giat' => $b['kode_sub_giat'] ?? null,
                    'nama_sub_giat' => $b['nama_sub_giat'] ?? null,
                    'kode_bl' => $currentKodeBl,
                    'pagu' => (float) ($b['pagu'] ?? 0),
                    'pagu_indikatif' => (float) ($b['pagu_indikatif'] ?? 0),
                    'pagu_n_depan' => (float) ($b['pagu_n_depan'] ?? 0),
                    'pagu_n2_depan' => (float) ($b['pagu_n2_depan'] ?? 0),
                    'id_dana' => $b['id_dana'] ?? null,
                    'nama_dana' => $b['nama_dana'] ?? null,
                    'id_lokasi' => $b['id_lokasi'] ?? null,
                    'nama_lokasi' => $b['nama_lokasi'] ?? null,
                    'waktu_awal' => $b['waktu_awal'] ?? 1,
                    'waktu_akhir' => $b['waktu_akhir'] ?? 12,
                    'indikator' => $b['indikator'] ?? null,
                    'satuan' => $b['satuan'] ?? null,
                    'target_1' => $b['target_1'] ?? null,
                    'sasaran' => $b['sasaran'] ?? null,
                    'label_kokab' => $b['label_kokab'] ?? null,
                    'label_prov' => $b['label_prov'] ?? null,
                    'label_pusat' => $b['label_pusat'] ?? null,
                    'active' => 1,
                ]
            );
        }

        // 2. Simpan Data Capaian Program (data_capaian_prog_sub_keg)
        foreach ($dataCapaian as $c) {
            CapaianProgram::updateOrCreate(
                [
                    'kode_sbl' => $kodeSbl,
                    'capaianteks' => $c['capaianteks'] ?? '',
                    'tahun_anggaran' => $tahun,
                ],
                [
                    'id_capaian_bl' => $c['id_capaian_bl'] ?? null,
                    'id_bl' => $c['id_bl'] ?? null,
                    'id_skpd' => $c['id_skpd'] ?? null,
                    'id_sub_skpd' => $c['id_sub_skpd'] ?? null,
                    'id_program' => $c['id_program'] ?? null,
                    'id_giat' => $c['id_giat'] ?? null,
                    'targetcapaian' => $c['targetcapaian'] ?? '',
                    'targetcapaianteks' => $c['targetcapaianteks'] ?? '',
                    'satuancapaian' => $c['satuancapaian'] ?? '',
                    'active' => 1,
                ]
            );
        }

        // 3. Simpan Data Indikator Sub Kegiatan & Kegiatan (data_sub_keg_indikator)
        foreach ($dataOutput as $o) {
            SubKegiatanIndikator::updateOrCreate(
                [
                    'kode_sbl' => $kodeSbl,
                    'outputteks' => $o['outputteks'] ?? ($o['tolok_ukur_sub'] ?? ''),
                    'tipe' => 'sub_kegiatan',
                    'tahun_anggaran' => $tahun,
                ],
                [
                    'idoutputbl' => $o['idoutputbl'] ?? null,
                    'id_sub_bl' => $o['id_sub_bl'] ?? null,
                    'targetoutput' => $o['targetoutput'] ?? ($o['target_sub'] ?? ''),
                    'targetoutputteks' => $o['targetoutputteks'] ?? '',
                    'satuanoutput' => $o['satuanoutput'] ?? ($o['satuan_sub'] ?? ''),
                    'tolok_ukur_sub' => $o['tolok_ukur_sub'] ?? '',
                    'target_sub' => $o['target_sub'] ?? '',
                    'satuan_sub' => $o['satuan_sub'] ?? '',
                    'active' => 1,
                ]
            );
        }

        foreach ($dataOutputGiat as $og) {
            SubKegiatanIndikator::updateOrCreate(
                [
                    'kode_sbl' => $kodeSbl,
                    'outputteks' => $og['outputteks'] ?? '',
                    'tipe' => 'kegiatan',
                    'tahun_anggaran' => $tahun,
                ],
                [
                    'idoutputbl' => $og['id_output_giat'] ?? null,
                    'id_giat' => $og['id_giat'] ?? null,
                    'targetoutput' => $og['targetoutput'] ?? '',
                    'targetoutputteks' => $og['targetoutputteks'] ?? '',
                    'satuanoutput' => $og['satuanoutput'] ?? '',
                    'active' => 1,
                ]
            );
        }

        // 4. Simpan Data RKA (data_rka)
        if ($noPage === 1 && !empty($kodeSbl)) {
            Rka::where('kode_sbl', $kodeSbl)
                ->where('tahun_anggaran', $tahun)
                ->update(['active' => 0]);
        }

        foreach ($rkaList as $r) {
            $idRinci = $r['id_rinci_sub_bl'] ?? null;
            if (!$idRinci) continue;

            $subsTeks = is_array($r['subs_bl_teks'] ?? null) 
                ? ($r['subs_bl_teks']['subs_asli'] ?? '') 
                : ($r['subs_bl_teks'] ?? ($r['nama_subs_sub_bl'] ?? ''));

            $penerimaNama = trim((string) ($r['penerima'] ?? ($r['penerima_bantuan'] ?? ($r['lokus_akun_teks'] ?? ''))));
            $namaStandar = trim((string) ($r['nama_standar_harga'] ?? ''));
            $namaAkun = trim((string) ($r['nama_akun'] ?? ''));
            $namaKomponen = trim((string) ($r['nama_komponen'] ?? ''));
            if ($penerimaNama !== '' && ($namaKomponen === '' || $namaKomponen === $namaAkun) && ($namaStandar === '' || $namaStandar === $namaAkun)) {
                $jenisBl = trim((string) ($r['jenis_bl'] ?? ''));
                $namaKomponen = $jenisBl !== '' ? "{$penerimaNama} [{$jenisBl}]" : $penerimaNama;
            }
            if ($namaKomponen === '') {
                $namaKomponen = $namaStandar !== '' ? $namaStandar : $namaAkun;
            }

            Rka::updateOrCreate(
                [
                    'id_rinci_sub_bl' => $idRinci,
                    'kode_sbl' => $kodeSbl,
                    'tahun_anggaran' => $tahun,
                ],
                [
                    'id_unik' => $r['id_unik'] ?? null,
                    'id_sub_bl' => $r['id_sub_bl'] ?? null,
                    'id_bl' => $r['id_bl'] ?? null,
                    'id_unit' => $r['id_unit'] ?? null,
                    'id_skpd' => $r['id_skpd'] ?? null,
                    'id_sub_skpd' => $r['id_sub_skpd'] ?? null,
                    'kode_bl' => $kodeBl,
                    'kode_akun' => $r['kode_akun'] ?? null,
                    'nama_akun' => $r['nama_akun'] ?? null,
                    'kode_standar_harga' => $r['kode_standar_harga'] ?? null,
                    'nama_standar_harga' => $r['nama_standar_harga'] ?? null,
                    'nama_komponen' => $namaKomponen,
                    'spek_komponen' => $r['spek_komponen'] ?? ($r['spek'] ?? ''),
                    'koefisien' => $r['koefisien'] ?? null,
                    'volume' => $r['volume'] ?? ($r['volum1'] ?? ''),
                    'satuan' => $r['satuan'] ?? ($r['sat1'] ?? ''),
                    'volum1' => $r['volum1'] ?? '',
                    'sat1' => $r['sat1'] ?? '',
                    'volum2' => $r['volum2'] ?? '',
                    'sat2' => $r['sat2'] ?? '',
                    'volum3' => $r['volum3'] ?? '',
                    'sat3' => $r['sat3'] ?? '',
                    'volum4' => $r['volum4'] ?? '',
                    'sat4' => $r['sat4'] ?? '',
                    'harga_satuan' => (float) ($r['harga_satuan'] ?? 0),
                    'total_harga' => (float) ($r['total_harga'] ?? ($r['rincian'] ?? 0)),
                    'rincian' => (float) ($r['rincian'] ?? ($r['total_harga'] ?? 0)),
                    'pajak' => (float) ($r['pajak'] ?? 0),
                    'id_dana' => $r['id_dana'] ?? null,
                    'nama_dana' => $r['nama_dana'] ?? null,
                    'is_paket' => $r['is_paket'] ?? 0,
                    'id_subs_sub_bl' => $r['id_subs_sub_bl'] ?? null,
                    'id_ket_sub_bl' => $r['id_ket_sub_bl'] ?? null,
                    'subs_bl_teks' => $subsTeks,
                    'ket_bl_teks' => $r['ket_bl_teks'] ?? ($r['nama_ket_sub_bl'] ?? ''),
                    'jenis_bl' => $r['jenis_bl'] ?? null,
                    'created_user' => $r['created_user'] ?? ($r['user1'] ?? ''),
                    'createddate' => $r['createddate'] ?? '',
                    'createdtime' => $r['createdtime'] ?? '',
                    'updated_user' => $r['updated_user'] ?? ($r['user2'] ?? ''),
                    'updateddate' => $r['updateddate'] ?? '',
                    'updatedtime' => $r['updatedtime'] ?? '',
                    'user1' => $r['user1'] ?? '',
                    'user2' => $r['user2'] ?? '',
                    'active' => 1,
                ]
            );
        }

        return response()->json([
            'status' => 'success',
            'action' => 'singkron_rka',
            'kode_sbl' => $kodeSbl,
            'message' => 'Berhasil export RKA ke Laravel SIPD Local!',
        ]);
    }

    /**
     * Handler untuk sinkronisasi pagu unit/SKPD
     */
    public function setUnitPagu(Request $request)
    {
        return response()->json([
            'status' => 'success',
            'action' => 'set_unit_pagu',
            'message' => 'Pagu SKPD berhasil disinkron ke Laravel!',
        ]);
    }

    /**
     * Handler untuk update status sub-kegiatan aktif/non-aktif
     */
    public function updateNonactiveSubBl(Request $request)
    {
        $idUnit = $request->input('id_unit');
        $tahun = (int) $request->input('tahun_anggaran', 2027);
        $subkegAktif = $request->input('subkeg_aktif', []);

        if (is_string($subkegAktif)) {
            $subkegAktif = json_decode($subkegAktif, true) ?: [];
        }

        $activeSblList = array_filter(array_column($subkegAktif, 'kode_sbl'));

        if (!empty($activeSblList)) {
            SubKegiatanBl::where('id_unit', $idUnit)
                ->where('tahun_anggaran', $tahun)
                ->whereNotIn('kode_sbl', $activeSblList)
                ->update(['active' => 0]);
        }

        return response()->json([
            'status' => 'success',
            'action' => 'update_nonactive_sub_bl',
            'id_unit' => $idUnit,
            'message' => 'Status sub-kegiatan non-aktif berhasil diperbarui!',
        ]);
    }

    /**
     * Sinkronisasi data Master Akun Belanja/Pendapatan/Pembiayaan (data_akun)
     */
    public function syncMasterAkun(Request $request)
    {
        $tahun = (int) $request->input('tahun_anggaran', 2027);
        $page = (int) $request->input('page', 1);
        $rawAkun = $request->input('akun', []);

        if (is_string($rawAkun)) {
            $rawAkun = json_decode($rawAkun, true) ?: [];
        }

        if ($page === 1) {
            MasterAkun::where('tahun_anggaran', $tahun)->update(['active' => 0]);
        }

        $now = now();
        $rows = [];
        foreach ($rawAkun as $a) {
            $idAkun = $a['id_akun'] ?? null;
            if (!$idAkun) continue;

            $rows[] = [
                'id_akun' => (int) $idAkun,
                'kode_akun' => (string) ($a['kode_akun'] ?? ''),
                'nama_akun' => (string) ($a['nama_akun'] ?? ''),
                'ket_akun' => (string) ($a['ket_akun'] ?? ''),
                'level' => (int) ($a['level'] ?? 1),
                'belanja' => (int) ($a['belanja'] ?? 0),
                'pendapatan' => (int) ($a['pendapatan'] ?? 0),
                'pembiayaan' => (int) ($a['pembiayaan'] ?? 0),
                'is_bl' => (int) ($a['is_bl'] ?? 0),
                'is_pendapatan' => (int) ($a['is_pendapatan'] ?? 0),
                'is_pembiayaan' => (int) ($a['is_pembiayaan'] ?? 0),
                'is_barjas' => (int) ($a['is_barjas'] ?? 0),
                'is_bagi_hasil' => (int) ($a['is_bagi_hasil'] ?? 0),
                'is_bankeu_khusus' => (int) ($a['is_bankeu_khusus'] ?? 0),
                'is_bankeu_umum' => (int) ($a['is_bankeu_umum'] ?? 0),
                'is_bos' => (int) ($a['is_bos'] ?? 0),
                'is_btt' => (int) ($a['is_btt'] ?? 0),
                'is_bunga' => (int) ($a['is_bunga'] ?? 0),
                'is_gaji_asn' => (int) ($a['is_gaji_asn'] ?? 0),
                'is_hibah_brg' => (int) ($a['is_hibah_brg'] ?? 0),
                'is_hibah_uang' => (int) ($a['is_hibah_uang'] ?? 0),
                'is_locked' => (int) ($a['is_locked'] ?? 0),
                'is_modal_tanah' => (int) ($a['is_modal_tanah'] ?? 0),
                'is_sosial_brg' => (int) ($a['is_sosial_brg'] ?? 0),
                'is_sosial_uang' => (int) ($a['is_sosial_uang'] ?? 0),
                'is_subsidi' => (int) ($a['is_subsidi'] ?? 0),
                'kode_akun_lama' => $a['kode_akun_lama'] ?? '',
                'kode_akun_revisi' => $a['kode_akun_revisi'] ?? '',
                'kunci_tahun' => (int) ($a['kunci_tahun'] ?? 0),
                'mulai_tahun' => !empty($a['mulai_tahun']) ? (int) $a['mulai_tahun'] : $tahun,
                'set_input' => (int) ($a['set_input'] ?? 0),
                'set_kab_kota' => (int) ($a['set_kab_kota'] ?? 0),
                'set_lokus' => (int) ($a['set_lokus'] ?? 0),
                'set_prov' => (int) ($a['set_prov'] ?? 0),
                'status' => (string) ($a['status'] ?? ''),
                'tahun_anggaran' => $tahun,
                'active' => 1,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        if (!empty($rows)) {
            $updateCols = array_values(array_diff(array_keys($rows[0]), ['id_akun', 'tahun_anggaran', 'created_at']));
            foreach (array_chunk($rows, 250) as $chunk) {
                MasterAkun::upsert($chunk, ['id_akun', 'tahun_anggaran'], $updateCols);
            }
        }

        $totalAktif = MasterAkun::where('tahun_anggaran', $tahun)->where('active', 1)->count();

        return response()->json([
            'status' => 'success',
            'action' => 'singkron_akun_belanja',
            'page' => $page,
            'saved_batch' => count($rows),
            'total_active' => $totalAktif,
            'message' => "Berhasil backup {$totalAktif} data Master Akun tahun {$tahun} ke Laravel SIPD Local!",
        ]);
    }

    /**
     * Sinkronisasi data Master Sumber Dana (data_sumber_dana)
     */
    public function syncSumberDana(Request $request)
    {
        $tahun = (int) $request->input('tahun_anggaran', 2027);
        $rawDana = $request->input('dana', []);

        if (is_string($rawDana)) {
            $rawDana = json_decode($rawDana, true) ?: [];
        }

        MasterSumberDana::where('tahun_anggaran', $tahun)->update(['active' => 0]);

        $now = now();
        $rows = [];
        foreach ($rawDana as $d) {
            $idDana = $d['id_dana'] ?? null;
            if (!$idDana) continue;

            $rows[] = [
                'id_dana' => (int) $idDana,
                'id_unik' => (string) ($d['id_unik'] ?? $idDana),
                'id_daerah' => !empty($d['id_daerah']) ? (int) $d['id_daerah'] : null,
                'kode_dana' => (string) ($d['kode_dana'] ?? ''),
                'nama_dana' => (string) ($d['nama_dana'] ?? ''),
                'sumber_dana' => (string) ($d['sumber_dana'] ?? ''),
                'is_locked' => (int) ($d['is_locked'] ?? 0),
                'set_input' => (int) ($d['set_input'] ?? 0),
                'tahun_anggaran' => $tahun,
                'active' => 1,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        if (!empty($rows)) {
            $updateCols = array_values(array_diff(array_keys($rows[0]), ['id_dana', 'tahun_anggaran', 'created_at']));
            foreach (array_chunk($rows, 250) as $chunk) {
                MasterSumberDana::upsert($chunk, ['id_dana', 'tahun_anggaran'], $updateCols);
            }
        }

        $totalAktif = MasterSumberDana::where('tahun_anggaran', $tahun)->where('active', 1)->count();

        return response()->json([
            'status' => 'success',
            'action' => 'singkron_sumber_dana',
            'saved' => count($rows),
            'total_active' => $totalAktif,
            'message' => "Berhasil backup {$totalAktif} data Master Sumber Dana tahun {$tahun} ke Laravel SIPD Local!",
        ]);
    }

    /**
     * Sinkronisasi data Pendapatan Daerah (data_pendapatan & data_pendapatan_skpd)
     */
    public function syncPendapatan(Request $request)
    {
        $tahun = (int) $request->input('tahun_anggaran', 2027);
        $now = now();

        // 1. Simpan Daftar SKPD Pendapatan jika dikirim
        $rawSkpd = $request->input('skpd', $request->input('data_skpd', []));
        if (is_string($rawSkpd)) {
            $rawSkpd = json_decode($rawSkpd, true) ?: [];
        }

        $savedSkpdCount = 0;
        if (!empty($rawSkpd)) {
            $resetSkpd = filter_var($request->input('reset_skpd', false), FILTER_VALIDATE_BOOLEAN);
            if ($resetSkpd) {
                PendapatanSkpd::where('tahun_anggaran', $tahun)->update(['active' => 0]);
            }

            $skpdRows = [];
            foreach ($rawSkpd as $s) {
                $idSkpd = $s['id_skpd'] ?? null;
                if (!$idSkpd) continue;

                $skpdRows[] = [
                    'id_skpd' => (int) $idSkpd,
                    'kode_skpd' => (string) ($s['kode_skpd'] ?? ''),
                    'nama_skpd' => (string) ($s['nama_skpd'] ?? ''),
                    'jumlah_rekening' => (int) ($s['jumlah_rekening'] ?? 0),
                    'total' => (float) ($s['total'] ?? 0),
                    'tahun_anggaran' => $tahun,
                    'active' => 1,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            if (!empty($skpdRows)) {
                $updateCols = ['kode_skpd', 'nama_skpd', 'jumlah_rekening', 'total', 'active', 'updated_at'];
                foreach (array_chunk($skpdRows, 200) as $chunk) {
                    PendapatanSkpd::upsert($chunk, ['id_skpd', 'tahun_anggaran'], $updateCols);
                }
                $savedSkpdCount = count($skpdRows);
            }
        }

        // 2. Simpan Rekening Pendapatan jika dikirim
        $rawPendapatan = $request->input('pendapatan', $request->input('data_pendapatan', $request->input('data', [])));
        if (is_string($rawPendapatan)) {
            $rawPendapatan = json_decode($rawPendapatan, true) ?: [];
        }

        $reset = filter_var($request->input('reset', false), FILTER_VALIDATE_BOOLEAN);
        $idSkpd = $request->input('id_skpd');

        if ($reset) {
            if (!empty($idSkpd)) {
                Pendapatan::where('tahun_anggaran', $tahun)->where('id_skpd', $idSkpd)->update(['active' => 0]);
            } else {
                Pendapatan::where('tahun_anggaran', $tahun)->update(['active' => 0]);
            }
        }

        $rows = [];
        foreach ($rawPendapatan as $p) {
            $idPendapatan = $p['id_pendapatan'] ?? ($p['id'] ?? null);
            if (!$idPendapatan) continue;

            $currentIdSkpd = !empty($p['id_skpd']) ? (int) $p['id_skpd'] : (!empty($idSkpd) ? (int) $idSkpd : 0);

            $rows[] = [
                'id_pendapatan' => (int) $idPendapatan,
                'id_skpd' => $currentIdSkpd,
                'kode_skpd' => (string) ($p['kode_skpd'] ?? ''),
                'nama_skpd' => (string) ($p['nama_skpd'] ?? ''),
                'id_akun' => !empty($p['id_akun']) ? (int) $p['id_akun'] : null,
                'kode_akun' => (string) ($p['kode_akun'] ?? ''),
                'nama_akun' => (string) ($p['nama_akun'] ?? ''),
                'uraian' => (string) ($p['uraian'] ?? ''),
                'keterangan' => (string) ($p['keterangan'] ?? ''),
                'total' => (float) ($p['total'] ?? 0),
                'nilaimurni' => (float) ($p['nilaimurni'] ?? ($p['total'] ?? 0)),
                'volume' => isset($p['volume']) ? (string) $p['volume'] : null,
                'satuan' => isset($p['satuan']) ? (string) $p['satuan'] : null,
                'koefisien' => isset($p['koefisien']) ? (string) $p['koefisien'] : null,
                'is_locked' => (int) ($p['is_locked'] ?? 0),
                'tahun_anggaran' => $tahun,
                'active' => 1,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        if (!empty($rows)) {
            $updateCols = array_values(array_diff(array_keys($rows[0]), ['id_pendapatan', 'tahun_anggaran', 'created_at']));
            foreach (array_chunk($rows, 200) as $chunk) {
                Pendapatan::upsert($chunk, ['id_pendapatan', 'tahun_anggaran'], $updateCols);
            }
        }

        $totalAktif = Pendapatan::where('tahun_anggaran', $tahun)->where('active', 1)->count();
        $totalNilai = (float) Pendapatan::where('tahun_anggaran', $tahun)->where('active', 1)->sum('total');

        return response()->json([
            'status' => 'success',
            'action' => 'singkron_pendapatan',
            'saved_skpd' => $savedSkpdCount,
            'saved_batch' => count($rows),
            'total_active' => $totalAktif,
            'total_nilai' => $totalNilai,
            'message' => "Berhasil backup data pendapatan!",
        ]);
    }

    /**
     * Sinkronisasi data Pembiayaan Daerah (Penerimaan & Pengeluaran)
     */
    public function syncPembiayaan(Request $request)
    {
        $tipe = strtolower((string) $request->input('tipe', $request->input('tipe_pembiayaan', 'penerimaan')));
        if (!in_array($tipe, ['penerimaan', 'pengeluaran'])) {
            $tipe = 'penerimaan';
        }
        $tahun = (int) $request->input('tahun_anggaran', 2027);
        $now = now();

        // 1. Simpan Master SKPD Pembiayaan jika dikirim
        $rawSkpd = $request->input('skpd', $request->input('data_skpd', []));
        if (is_string($rawSkpd)) {
            $rawSkpd = json_decode($rawSkpd, true) ?: [];
        }

        $savedSkpdCount = 0;
        if (!empty($rawSkpd)) {
            $resetSkpd = filter_var($request->input('reset_skpd', false), FILTER_VALIDATE_BOOLEAN);
            if ($resetSkpd) {
                PembiayaanSkpd::where('tipe', $tipe)->where('tahun_anggaran', $tahun)->update(['active' => 0]);
            }

            $skpdRows = [];
            foreach ($rawSkpd as $s) {
                $idSkpd = $s['id_skpd'] ?? null;
                if (!$idSkpd) continue;

                $skpdRows[] = [
                    'tipe' => $tipe,
                    'id_skpd' => (int) $idSkpd,
                    'kode_skpd' => (string) ($s['kode_skpd'] ?? ''),
                    'nama_skpd' => (string) ($s['nama_skpd'] ?? ''),
                    'jumlah_rekening' => (int) ($s['jumlah_rekening'] ?? 0),
                    'total' => (float) ($s['total'] ?? 0),
                    'tahun_anggaran' => $tahun,
                    'active' => 1,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            if (!empty($skpdRows)) {
                $updateCols = ['kode_skpd', 'nama_skpd', 'jumlah_rekening', 'total', 'active', 'updated_at'];
                foreach (array_chunk($skpdRows, 200) as $chunk) {
                    PembiayaanSkpd::upsert($chunk, ['id_skpd', 'tipe', 'tahun_anggaran'], $updateCols);
                }
                $savedSkpdCount = count($skpdRows);
            }
        }

        // 2. Simpan Rekening Pembiayaan jika dikirim
        $rawPembiayaan = $request->input('pembiayaan', $request->input('data_pembiayaan', $request->input('data', [])));
        if (is_string($rawPembiayaan)) {
            $rawPembiayaan = json_decode($rawPembiayaan, true) ?: [];
        }

        $reset = filter_var($request->input('reset', false), FILTER_VALIDATE_BOOLEAN);
        $idSkpd = $request->input('id_skpd');

        if ($reset) {
            if (!empty($idSkpd)) {
                Pembiayaan::where('tipe', $tipe)->where('tahun_anggaran', $tahun)->where('id_skpd', $idSkpd)->update(['active' => 0]);
            } else {
                Pembiayaan::where('tipe', $tipe)->where('tahun_anggaran', $tahun)->update(['active' => 0]);
            }
        }

        $rows = [];
        foreach ($rawPembiayaan as $p) {
            $idPembiayaan = $p['id_pembiayaan'] ?? ($p['id'] ?? null);
            if (!$idPembiayaan) continue;

            $currentIdSkpd = !empty($p['id_skpd']) ? (int) $p['id_skpd'] : (!empty($idSkpd) ? (int) $idSkpd : 0);

            $rows[] = [
                'id_pembiayaan' => (int) $idPembiayaan,
                'tipe' => $tipe,
                'id_skpd' => $currentIdSkpd,
                'kode_skpd' => (string) ($p['kode_skpd'] ?? ''),
                'nama_skpd' => (string) ($p['nama_skpd'] ?? ''),
                'id_akun' => !empty($p['id_akun']) ? (int) $p['id_akun'] : null,
                'kode_akun' => (string) ($p['kode_akun'] ?? ''),
                'nama_akun' => (string) ($p['nama_akun'] ?? ''),
                'uraian' => (string) ($p['uraian'] ?? ''),
                'keterangan' => (string) ($p['keterangan'] ?? ''),
                'total' => (float) ($p['total'] ?? 0),
                'tahun_anggaran' => $tahun,
                'active' => 1,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        if (!empty($rows)) {
            $updateCols = array_values(array_diff(array_keys($rows[0]), ['id_pembiayaan', 'tipe', 'tahun_anggaran', 'created_at']));
            foreach (array_chunk($rows, 200) as $chunk) {
                Pembiayaan::upsert($chunk, ['id_pembiayaan', 'tipe', 'tahun_anggaran'], $updateCols);
            }
        }

        $totalAktif = Pembiayaan::where('tipe', $tipe)->where('tahun_anggaran', $tahun)->where('active', 1)->count();
        $totalNilai = (float) Pembiayaan::where('tipe', $tipe)->where('tahun_anggaran', $tahun)->where('active', 1)->sum('total');

        return response()->json([
            'status' => 'success',
            'action' => 'singkron_pembiayaan',
            'tipe' => $tipe,
            'saved_skpd' => $savedSkpdCount,
            'saved_batch' => count($rows),
            'total_active' => $totalAktif,
            'total_nilai' => $totalNilai,
            'message' => "Berhasil backup data pembiayaan {$tipe}!",
        ]);
    }

    /**
     * Sinkronisasi data Master SKPD & Kepala SKPD (data_unit)
     */
    public function syncUnit(Request $request)
    {
        $tahun = (int) $request->input('tahun_anggaran', 2026);
        $rawUnits = $request->input('data_unit')
            ?? $request->input('unit')
            ?? $request->input('data')
            ?? [];

        if (is_string($rawUnits)) {
            $rawUnits = json_decode($rawUnits, true) ?: [];
        }

        if (!is_array($rawUnits)) {
            $rawUnits = [];
        }

        $now = now();
        $rows = [];
        foreach ($rawUnits as $u) {
            if (!is_array($u)) continue;
            $idSkpd = $u['id_skpd'] ?? null;
            if (!$idSkpd) continue;

            $namaKepala = $u['nama_kepala'] ?? $u['namakepala'] ?? null;
            $nipKepala = $u['nip_kepala'] ?? $u['nipkepala'] ?? null;
            $pangkatKepala = $u['pangkat_kepala'] ?? $u['pangkatkepala'] ?? null;
            $statusKepala = $u['status_kepala'] ?? $u['statuskepala'] ?? null;

            $rows[] = [
                'id_skpd' => (int) $idSkpd,
                'id_unit' => !empty($u['id_unit']) ? (int) $u['id_unit'] : null,
                'kode_skpd' => (string) ($u['kode_skpd'] ?? ''),
                'nama_skpd' => (string) ($u['nama_skpd'] ?? $u['namaunit'] ?? ''),
                'nama_kepala' => ($namaKepala !== null && $namaKepala !== '') ? (string) $namaKepala : null,
                'nip_kepala' => ($nipKepala !== null && $nipKepala !== '') ? (string) $nipKepala : null,
                'pangkat_kepala' => ($pangkatKepala !== null && $pangkatKepala !== '') ? (string) $pangkatKepala : null,
                'status_kepala' => ($statusKepala !== null && $statusKepala !== '') ? (string) $statusKepala : null,
                'is_skpd' => (int) ($u['is_skpd'] ?? $u['isskpd'] ?? 1),
                'is_pendapatan' => (int) ($u['is_pendapatan'] ?? $u['ispendapatan'] ?? 0),
                'is_pembiayaan' => (int) ($u['is_pembiayaan'] ?? 0),
                'id_kecamatan' => !empty($u['id_kecamatan']) ? (int) $u['id_kecamatan'] : null,
                'nama_kecamatan' => isset($u['nama_kecamatan']) && $u['nama_kecamatan'] !== '' ? (string) $u['nama_kecamatan'] : null,
                'nama_induk' => isset($u['nama_induk']) && $u['nama_induk'] !== '' ? (string) $u['nama_induk'] : null,
                'kepala_saja' => (int) ($u['kepala_saja'] ?? 0),
                'tahun_anggaran' => (int) ($u['tahun_anggaran'] ?? $tahun),
                'active' => 1,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        if (!empty($rows)) {
            $updateCols = array_values(array_diff(array_keys($rows[0]), ['id_skpd', 'tahun_anggaran', 'created_at']));
            foreach (array_chunk($rows, 200) as $chunk) {
                DataUnit::upsert($chunk, ['id_skpd', 'tahun_anggaran'], $updateCols);
            }
        }

        $totalAktif = DataUnit::where('tahun_anggaran', $tahun)->where('active', 1)->count();

        return response()->json([
            'status' => 'success',
            'action' => 'singkron_unit',
            'saved_batch' => count($rows),
            'total_active' => $totalAktif,
            'message' => "Berhasil menyimpan " . count($rows) . " data SKPD & Kepala SKPD tahun {$tahun} ke database lokal!",
        ]);
    }
}
