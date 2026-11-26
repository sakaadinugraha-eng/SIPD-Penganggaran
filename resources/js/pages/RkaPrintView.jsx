import React, { useState, useEffect } from 'react';
import { Printer, ArrowLeft, FileText, Package, Download, BookmarkCheck } from 'lucide-react';

export default function RkaPrintView({ subKegiatanId, initialMode = 'rincian', onBack, postingId = null, postingTitle = null }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState(initialMode); // 'rincian' or 'paket'

  const formatRupiah = (num) => {
    return Number(num || 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatPpn = (pajak) => {
    const p = parseFloat(pajak);
    if (isNaN(p) || p === 0) return '0.00%';
    return p.toFixed(2) + '%';
  };

  const fetchPrintData = async () => {
    setLoading(true);
    try {
      const url = postingId 
        ? `/api/posting/${postingId}/rka-print/${subKegiatanId}`
        : `/api/data/rka-print/${subKegiatanId}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.status === 'success') {
        setData(json.data);
      }
    } catch (err) {
      console.error('Error fetching RKA print data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (subKegiatanId) {
      fetchPrintData();
    }
  }, [subKegiatanId]);

  if (loading) {
    return (
      <div className="w-full bg-white p-12 rounded-2xl shadow-xs border border-slate-200 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs font-semibold text-slate-600">Menyiapkan Dokumen RKA SIPD...</span>
      </div>
    );
  }

  if (!data || !data.sub_kegiatan) {
    return (
      <div className="w-full bg-white p-8 rounded-2xl shadow-xs border border-slate-200 text-center">
        <p className="text-sm font-bold text-slate-800">Data Sub Kegiatan Tidak Ditemukan</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition cursor-pointer"
        >
          Kembali
        </button>
      </div>
    );
  }

  const sub = data.sub_kegiatan;
  const items = data.rka_items || [];

  // Hitung total belanja
  const totalBelanja = items.reduce((acc, r) => acc + Number(r.total_harga || 0), 0);

  // Grouping RKA: Rekening -> Paket [#] -> Keterangan [-] -> Items
  const groupedAccounts = {};
  items.forEach((r) => {
    const rawAkun = r.kode_akun || '5.1.02.01.001.00001';
    const namaAkun = (r.nama_akun || '').replace(rawAkun, '').trim() || r.nama_standar_harga || 'Belanja';
    
    if (!groupedAccounts[rawAkun]) {
      groupedAccounts[rawAkun] = {
        kode_akun: rawAkun,
        nama_akun: namaAkun,
        total: 0,
        pakets: {},
      };
    }
    groupedAccounts[rawAkun].total += Number(r.total_harga || 0);

    const paketNama = r.subs_bl_teks || 'Paket Kegiatan';
    if (!groupedAccounts[rawAkun].pakets[paketNama]) {
      groupedAccounts[rawAkun].pakets[paketNama] = {
        nama_paket: paketNama,
        sumber_dana: r.nama_dana || sub.nama_dana || 'Dana Alokasi Umum (DAU)',
        total: 0,
        keterangans: {},
      };
    }
    groupedAccounts[rawAkun].pakets[paketNama].total += Number(r.total_harga || 0);

    const ketNama = r.ket_bl_teks || paketNama;
    if (!groupedAccounts[rawAkun].pakets[paketNama].keterangans[ketNama]) {
      groupedAccounts[rawAkun].pakets[paketNama].keterangans[ketNama] = {
        nama_keterangan: ketNama,
        total: 0,
        items: [],
      };
    }
    groupedAccounts[rawAkun].pakets[paketNama].keterangans[ketNama].total += Number(r.total_harga || 0);
    groupedAccounts[rawAkun].pakets[paketNama].keterangans[ketNama].items.push(r);
  });

  const currentDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="w-full space-y-4 font-sans text-slate-900">
      <style>{`
        @page {
          size: A4 landscape;
          margin: 8mm 10mm;
        }
        @media print {
          html, body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print-hidden, aside, nav, footer, header {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
          }
        }
      `}</style>

      {/* Top Action Toolbar (Persis Sesuai Header SIPD Kemendagri - Tanpa Overlap) */}
      <div className="w-full bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 mb-3 print:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="text-blue-600 hover:text-blue-800 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali</span>
          </button>
          {(postingId || data?.session) && (
            <span className="px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs flex items-center gap-1.5">
              <BookmarkCheck className="w-3.5 h-3.5" />
              <span>Arsip: {data?.session?.nama_posting || postingTitle || 'Posting Snapshot'}</span>
            </span>
          )}
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setMode('rincian')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                mode === 'rincian'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>RKA Rincian Belanja</span>
            </button>
            <button
              onClick={() => setMode('paket')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                mode === 'paket'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>RKA Paket / Kelompok</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Cetak</span>
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh PDF A4</span>
          </button>
        </div>
      </div>

      {/* DOKUMEN CETAK RKA DENGAN INNER SCROLLBAR (2 SCROLL SESUAI PERSIS SIPD KEMENDAGRI) */}
      <div className="w-full bg-white rounded-xl border border-slate-300 shadow-xs overflow-x-auto overflow-y-auto max-h-[calc(100vh-190px)] p-6 md:p-8 text-xs leading-normal text-black font-sans print:max-h-none print:overflow-visible print:p-0 print:border-none print:shadow-none">
        <div className="w-full min-w-[900px]">
          {/* HEADER FORMULIR */}
          <table className="w-full table-fixed border-collapse border-2 border-black text-center mb-0">
            <colgroup>
              <col style={{ width: '75%' }} />
              <col style={{ width: '25%' }} />
            </colgroup>
            <tbody>
              <tr>
                <td className="p-3 border-r-2 border-black">
                  <div className="font-bold text-sm uppercase tracking-wide">
                    {mode === 'rincian'
                      ? 'RENCANA KERJA DAN ANGGARAN'
                      : 'RINGKASAN PAKET / PENGELOMPOKAN BELANJA'}
                  </div>
                  <div className="font-bold text-xs uppercase mt-0.5">
                    SATUAN KERJA PERANGKAT DAERAH
                  </div>
                  <div className="text-xs font-semibold mt-1">
                    Pemerintah Kabupaten Kediri Tahun Anggaran {sub.tahun_anggaran || 2027}
                  </div>
                </td>
                <td className="p-3 align-middle">
                  <div className="font-semibold text-xs">Formulir</div>
                  <div className="font-bold text-xs mt-0.5">RKA-BELANJA SKPD</div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* SUB HEADER KETERANGAN RINCIAN ANGGARAN */}
          <div className="border-x-2 border-b border-black p-2 font-bold text-center uppercase text-xs">
            Rincian Anggaran Belanja Menurut Program dan Kegiatan Satuan Kerja Perangkat Daerah
          </div>

          {/* METADATA SUB KEGIATAN */}
          <table className="w-full table-fixed border-collapse border-x-2 border-b-2 border-black text-xs">
            <colgroup>
              <col style={{ width: '20%' }} />
              <col style={{ width: '2%' }} />
              <col style={{ width: '78%' }} />
            </colgroup>
            <tbody>
              <tr>
                <td className="py-1 px-3 font-semibold align-top">Urusan Pemerintahan</td>
                <td className="py-1 px-1 align-top">:</td>
                <td className="py-1 px-2 font-semibold">1 URUSAN PEMERINTAHAN WAJIB YANG BERKAITAN DENGAN PELAYANAN DASAR</td>
              </tr>
              <tr>
                <td className="py-1 px-3 font-semibold align-top">Bidang Urusan</td>
                <td className="py-1 px-1 align-top">:</td>
                <td className="py-1 px-2 font-semibold">{sub.kode_bidang_urusan || '1.02'} {sub.nama_bidang_urusan || 'URUSAN PEMERINTAHAN BIDANG KESEHATAN'}</td>
              </tr>
              <tr>
                <td className="py-1 px-3 font-semibold align-top">Program</td>
                <td className="py-1 px-1 align-top">:</td>
                <td className="py-1 px-2 font-semibold">{sub.kode_program} {sub.nama_program}</td>
              </tr>
              <tr>
                <td className="py-1 px-3 font-semibold align-top">Kegiatan</td>
                <td className="py-1 px-1 align-top">:</td>
                <td className="py-1 px-2 font-semibold">{sub.kode_giat} {sub.nama_giat}</td>
              </tr>
              <tr>
                <td className="py-1 px-3 font-semibold align-top">Organisasi</td>
                <td className="py-1 px-1 align-top">:</td>
                <td className="py-1 px-2 font-semibold">{sub.kode_skpd} {sub.nama_skpd}</td>
              </tr>
              <tr>
                <td className="py-1 px-3 font-semibold align-top">Unit Organisasi</td>
                <td className="py-1 px-1 align-top">:</td>
                <td className="py-1 px-2 font-semibold">{sub.kode_sub_skpd} {sub.nama_sub_skpd}</td>
              </tr>
              <tr>
                <td className="py-1 px-3 font-semibold align-top">Sub Kegiatan</td>
                <td className="py-1 px-1 align-top">:</td>
                <td className="py-1 px-2 font-semibold">{sub.kode_sub_giat} {sub.nama_sub_giat}</td>
              </tr>
              <tr>
                <td className="py-1 px-3 font-semibold align-top">Sumber Pendanaan</td>
                <td className="py-1 px-1 align-top">:</td>
                <td className="py-1 px-2">{sub.nama_dana || 'Dana Alokasi Umum (DAU)'}</td>
              </tr>
              <tr>
                <td className="py-1 px-3 font-semibold align-top">Lokasi</td>
                <td className="py-1 px-1 align-top">:</td>
                <td className="py-1 px-2">{sub.nama_lokasi || 'Kab. Kediri, Semua Kecamatan, Semua Kel/Desa'}</td>
              </tr>
              <tr>
                <td className="py-1 px-3 font-semibold align-top">Waktu Pelaksanaan</td>
                <td className="py-1 px-1 align-top">:</td>
                <td className="py-1 px-2">Januari s.d. Desember</td>
              </tr>
              <tr>
                <td className="py-1 px-3 font-semibold align-top">Alokasi 2026</td>
                <td className="py-1 px-1 align-top">:</td>
                <td className="py-1 px-2 font-semibold">Rp 0,00</td>
              </tr>
              <tr>
                <td className="py-1 px-3 font-semibold align-top">Alokasi 2027</td>
                <td className="py-1 px-1 align-top">:</td>
                <td className="py-1 px-2 font-bold">Rp {formatRupiah(sub.pagu)}</td>
              </tr>
              <tr>
                <td className="py-1 px-3 font-semibold align-top">Alokasi 2028</td>
                <td className="py-1 px-1 align-top">:</td>
                <td className="py-1 px-2 font-semibold">Rp {formatRupiah(sub.pagu_n_depan || 0)}</td>
              </tr>
            </tbody>
          </table>

          {/* TABEL INDIKATOR KINERJA KEGIATAN */}
          <div className="font-bold text-center py-2 uppercase text-xs border-x-2 border-b border-black">
            Indikator dan Tolok Ukur Kinerja Kegiatan
          </div>
          <table className="w-full table-fixed border-collapse border-2 border-black text-xs">
            <colgroup>
              <col style={{ width: '22%' }} />
              <col style={{ width: '53%' }} />
              <col style={{ width: '25%' }} />
            </colgroup>
            <thead>
              <tr className="font-bold text-center">
                <th className="py-1.5 px-3 border border-black">Indikator</th>
                <th className="py-1.5 px-3 border border-black">Tolok Ukur Kinerja</th>
                <th className="py-1.5 px-3 border border-black">Target Kinerja</th>
              </tr>
            </thead>
            <tbody>
              {/* Capaian Program */}
              {data.sub_kegiatan.capaian && data.sub_kegiatan.capaian.length > 0 ? (
                data.sub_kegiatan.capaian.map((c, i) => (
                  <tr key={'cap-' + i}>
                    <td className="py-1.5 px-3 border border-black font-semibold">Capaian Program</td>
                    <td className="py-1.5 px-3 border border-black break-words">{c.capaianteks}</td>
                    <td className="py-1.5 px-3 border border-black font-semibold text-center">{c.targetcapaianteks || c.targetcapaian} {c.satuancapaian}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="py-1.5 px-3 border border-black font-semibold">Capaian Program</td>
                  <td className="py-1.5 px-3 border border-black">Persentase tertib administrasi layanan pemerintahan</td>
                  <td className="py-1.5 px-3 border border-black font-semibold text-center">100 Persen</td>
                </tr>
              )}

              {/* Masukan */}
              <tr>
                <td className="py-1.5 px-3 border border-black font-semibold">Masukan</td>
                <td className="py-1.5 px-3 border border-black">Dana yang dibutuhkan</td>
                <td className="py-1.5 px-3 border border-black font-bold text-center">Rp {formatRupiah(sub.pagu)}</td>
              </tr>

              {/* Keluaran / Hasil */}
              {data.sub_kegiatan.indikator_keluaran && data.sub_kegiatan.indikator_keluaran.length > 0 ? (
                data.sub_kegiatan.indikator_keluaran.map((ind, i) => (
                  <tr key={'ind-' + i}>
                    <td className="py-1.5 px-3 border border-black font-semibold">
                      {ind.tipe === 'kegiatan' ? 'Hasil' : 'Keluaran'}
                    </td>
                    <td className="py-1.5 px-3 border border-black break-words">{ind.outputteks || ind.tolok_ukur_sub}</td>
                    <td className="py-1.5 px-3 border border-black font-semibold text-center">{ind.targetoutput || ind.target_sub} {ind.satuanoutput || ind.satuan_sub}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="py-1.5 px-3 border border-black font-semibold">Keluaran</td>
                  <td className="py-1.5 px-3 border border-black">Terlaksananya kegiatan operasional</td>
                  <td className="py-1.5 px-3 border border-black font-semibold text-center">100 Persen</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* TABEL RINCIAN ANGGARAN BELANJA (1:1 FORMAT KEMENDAGRI RESMI) */}
          <table className="w-full table-fixed border-collapse border-2 border-black text-xs mt-4">
            <colgroup>
              <col style={{ width: '15%' }} /> {/* 1. Kode Rekening */}
              <col style={{ width: '38%' }} /> {/* 2. Uraian */}
              <col style={{ width: '11%' }} /> {/* 3. Koefisien */}
              <col style={{ width: '8%' }} />  {/* 4. Satuan */}
              <col style={{ width: '11%' }} /> {/* 5. Harga (Rp) */}
              <col style={{ width: '5%' }} />  {/* 6. PPN */}
              <col style={{ width: '12%' }} /> {/* 7. Jumlah (Rp) */}
            </colgroup>
            <thead>
              {/* Judul Tabel Rincian */}
              <tr>
                <th colSpan="7" className="border border-black py-2 px-3 font-bold text-center uppercase text-xs">
                  {mode === 'rincian'
                    ? 'RINCIAN ANGGARAN BELANJA KEGIATAN SATUAN KERJA PERANGKAT DAERAH'
                    : 'RINGKASAN PAKET / PENGELOMPOKAN BELANJA'}
                </th>
              </tr>
              {/* Header Kolom */}
              <tr className="font-bold text-center">
                <th rowSpan="2" className="border border-black py-2 px-2 align-middle">Kode Rekening</th>
                <th rowSpan="2" className="border border-black py-2 px-3 align-middle">Uraian</th>
                <th colSpan="4" className="border border-black py-1 px-2 align-middle">Rincian Perhitungan</th>
                <th rowSpan="2" className="border border-black py-2 px-2 align-middle">Jumlah (Rp)</th>
              </tr>
              {/* Sub-Header Rincian Perhitungan */}
              <tr className="font-bold text-center">
                <th className="border border-black py-1 px-2">Koefisien</th>
                <th className="border border-black py-1 px-2">Satuan</th>
                <th className="border border-black py-1 px-2">Harga (Rp)</th>
                <th className="border border-black py-1 px-2">PPN</th>
              </tr>
              {/* Baris Nomor Panduan Kolom 1-7 */}
              <tr className="text-center font-normal border-b-2 border-black">
                <th className="border border-black py-0.5">1</th>
                <th className="border border-black py-0.5">2</th>
                <th className="border border-black py-0.5">3</th>
                <th className="border border-black py-0.5">4</th>
                <th className="border border-black py-0.5">5</th>
                <th className="border border-black py-0.5">6</th>
                <th className="border border-black py-0.5">7</th>
              </tr>
            </thead>
            <tbody>
              {/* Baris 5: BELANJA DAERAH */}
              <tr className="font-bold">
                <td className="border border-black py-1.5 px-3 font-mono">5</td>
                <td className="border border-black py-1.5 px-3 uppercase">BELANJA DAERAH</td>
                <td className="border border-black py-1.5 px-2"></td>
                <td className="border border-black py-1.5 px-2"></td>
                <td className="border border-black py-1.5 px-2"></td>
                <td className="border border-black py-1.5 px-2"></td>
                <td className="border border-black py-1.5 px-2 text-right font-mono">{formatRupiah(totalBelanja)}</td>
              </tr>

              {/* Baris 5.1: BELANJA OPERASI */}
              <tr className="font-bold">
                <td className="border border-black py-1.5 px-3 font-mono">5.1</td>
                <td className="border border-black py-1.5 px-3 uppercase">BELANJA OPERASI</td>
                <td className="border border-black py-1.5 px-2"></td>
                <td className="border border-black py-1.5 px-2"></td>
                <td className="border border-black py-1.5 px-2"></td>
                <td className="border border-black py-1.5 px-2"></td>
                <td className="border border-black py-1.5 px-2 text-right font-mono">{formatRupiah(totalBelanja)}</td>
              </tr>

              {/* Loop Akun Rekening */}
              {Object.keys(groupedAccounts).map((accKey) => {
                const acc = groupedAccounts[accKey];
                return (
                  <React.Fragment key={accKey}>
                    {/* Rekening Header */}
                    <tr className="font-bold">
                      <td className="border border-black py-1.5 px-3 font-mono">{acc.kode_akun}</td>
                      <td className="border border-black py-1.5 px-3 break-words">{acc.nama_akun}</td>
                      <td className="border border-black py-1.5 px-2"></td>
                      <td className="border border-black py-1.5 px-2"></td>
                      <td className="border border-black py-1.5 px-2"></td>
                      <td className="border border-black py-1.5 px-2"></td>
                      <td className="border border-black py-1.5 px-2 text-right font-mono">{formatRupiah(acc.total)}</td>
                    </tr>

                    {/* Loop Paket [ # ] */}
                    {Object.keys(acc.pakets).map((pKey) => {
                      const pkt = acc.pakets[pKey];
                      return (
                        <React.Fragment key={pKey}>
                          {/* Paket Row */}
                          <tr className="font-bold">
                            <td className="border border-black py-1.5 px-3 font-mono"></td>
                            <td className="border border-black py-1.5 px-3 pl-5 break-words">
                              <div>[ # ] {pkt.nama_paket}</div>
                              <div className="text-[11px] font-normal italic mt-0.5">
                                Sumber Dana : {pkt.sumber_dana}
                              </div>
                            </td>
                            <td className="border border-black py-1.5 px-2"></td>
                            <td className="border border-black py-1.5 px-2"></td>
                            <td className="border border-black py-1.5 px-2"></td>
                            <td className="border border-black py-1.5 px-2"></td>
                            <td className="border border-black py-1.5 px-2 text-right font-mono">{formatRupiah(pkt.total)}</td>
                          </tr>

                          {/* Loop Keterangan [ - ] */}
                          {Object.keys(pkt.keterangans).map((kKey) => {
                            const ket = pkt.keterangans[kKey];
                            return (
                              <React.Fragment key={kKey}>
                                {/* Keterangan Row */}
                                <tr className="font-semibold">
                                  <td className="border border-black py-1.5 px-3 font-mono"></td>
                                  <td className="border border-black py-1.5 px-3 pl-8 break-words">
                                    [ - ] {ket.nama_keterangan}
                                  </td>
                                  <td className="border border-black py-1.5 px-2"></td>
                                  <td className="border border-black py-1.5 px-2"></td>
                                  <td className="border border-black py-1.5 px-2"></td>
                                  <td className="border border-black py-1.5 px-2"></td>
                                  <td className="border border-black py-1.5 px-2 text-right font-mono">{formatRupiah(ket.total)}</td>
                                </tr>

                                {/* Tampilkan item komponen HANYA jika mode 'rincian' */}
                                {mode === 'rincian' &&
                                  ket.items.map((item, itemIdx) => (
                                    <tr key={itemIdx}>
                                      <td className="border border-black py-1 px-3 font-mono"></td>
                                      <td className="border border-black py-1 px-3 pl-11 break-words">
                                        <div className="font-medium">{item.nama_komponen || item.nama_standar_harga}</div>
                                        {item.spek_komponen && (
                                          <div className="text-[11px] text-black font-normal mt-0.5">
                                            Spesifikasi : {item.spek_komponen}
                                          </div>
                                        )}
                                      </td>
                                      <td className="border border-black py-1 px-2 text-center font-mono break-words">
                                        {item.koefisien || `${item.volume || 1} ${item.satuan || ''}`}
                                      </td>
                                      <td className="border border-black py-1 px-2 text-center">
                                        {item.satuan || item.sat1 || '-'}
                                      </td>
                                      <td className="border border-black py-1 px-2 text-right font-mono">
                                        {formatRupiah(item.harga_satuan)}
                                      </td>
                                      <td className="border border-black py-1 px-2 text-center font-mono">
                                        {formatPpn(item.pajak)}
                                      </td>
                                      <td className="border border-black py-1 px-2 text-right font-mono">
                                        {formatRupiah(item.total_harga || item.rincian)}
                                      </td>
                                    </tr>
                                  ))}
                              </React.Fragment>
                            );
                          })}
                        </React.Fragment>
                      );
                    })}
                  </React.Fragment>
                );
              })}

              {/* JUMLAH TOTAL */}
              <tr className="font-bold border-t-2 border-b-4 border-double border-black">
                <td className="border border-black py-2 px-3 text-center uppercase" colSpan="6">
                  JUMLAH
                </td>
                <td className="border border-black py-2 px-2 text-right font-mono font-bold">
                  {formatRupiah(totalBelanja)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* TANDA TANGAN KEPALA DINAS */}
          <div className="mt-8 flex justify-end text-xs">
            <div className="w-80 text-center">
              <div>Kabupaten Kediri, {currentDate}</div>
              <div className="font-semibold mt-1">
                {data?.kepala_skpd?.status_kepala ? `${data.kepala_skpd.status_kepala} ` : ''}Kepala {sub.nama_skpd}
              </div>
              <div className="h-20"></div>
              <div className="font-bold underline text-sm">
                {data?.kepala_skpd?.nama_kepala || '........................................'}
              </div>
              <div className="text-xs text-black mt-0.5">
                {data?.kepala_skpd?.nip_kepala
                  ? `NIP. ${data.kepala_skpd.nip_kepala}`
                  : 'NIP. ..............................'}
              </div>
            </div>
          </div>

          {/* TIM ANGGARAN PEMERINTAH DAERAH (TAPD) */}
          <div className="mt-8 pt-4 border-t border-black/30">
            <div className="font-bold text-center uppercase text-xs mb-2">
              Tim Anggaran Pemerintah Daerah
            </div>
            <table className="w-full table-fixed border-collapse border border-black text-xs">
              <colgroup>
                <col style={{ width: '6%' }} />
                <col style={{ width: '34%' }} />
                <col style={{ width: '22%' }} />
                <col style={{ width: '20%' }} />
                <col style={{ width: '18%' }} />
              </colgroup>
              <thead>
                <tr className="font-bold text-center">
                  <th className="py-1.5 px-2 border border-black">No</th>
                  <th className="py-1.5 px-3 border border-black">Nama</th>
                  <th className="py-1.5 px-3 border border-black">NIP</th>
                  <th className="py-1.5 px-3 border border-black">Jabatan</th>
                  <th className="py-1.5 px-3 border border-black">Tanda Tangan</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan="5" className="py-6 text-center text-slate-500 italic border border-black">
                    Tim anggaran belum diisi untuk tahun ini.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* FOOTER KEDINASAN */}
          <div className="mt-6 pt-2 border-t border-black/30 flex justify-between text-[10px] text-slate-600 italic font-mono">
            <span>SIPD-RI: dicetak pada {currentDate}</span>
            <span>Halaman 1</span>
          </div>
        </div>
      </div>
    </div>
  );
}
