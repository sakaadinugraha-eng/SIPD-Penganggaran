import urllib.request
import urllib.parse
import json

# 1. Test Dashboard GET
try:
    with urllib.request.urlopen('http://127.0.0.1:8000/') as res:
        print("GET Dashboard HTTP Status:", res.status)
except Exception as e:
    print("GET Dashboard failed:", e)

# 2. Test API Sync POST
payload = {
    'action': 'singkron_rka',
    'tahun_anggaran': 2027,
    'kode_sbl': '1.01.2.19.0.00.01.0000.1.01.01.1.01.01.2.01.1.01.01.2.01.0001',
    'kode_bl': '1.01.2.19.0.00.01.0000.1.01.01.1.01.01.2.01',
    'dataBl': json.dumps([{
        'id_sub_bl': 421017,
        'id_unik_sub_bl': '726485647',
        'id_unit': 106,
        'id_skpd': 106,
        'id_sub_skpd': 106,
        'kode_skpd': '1.01.2.19.0.00.01.0000',
        'nama_skpd': 'Dinas Pendidikan',
        'kode_sub_skpd': '1.01.2.19.0.00.01.0000',
        'nama_sub_skpd': 'Dinas Pendidikan',
        'kode_bidang_urusan': '1.01',
        'nama_bidang_urusan': 'URUSAN PEMERINTAHAN BIDANG PENDIDIKAN',
        'kode_program': '1.01.01',
        'nama_program': 'PROGRAM PENUNJANG URUSAN PEMERINTAHAN DAERAH KABUPATEN/KOTA',
        'kode_giat': '1.01.01.2.01',
        'nama_giat': 'Perencanaan, Penganggaran, dan Evaluasi Kinerja Perangkat Daerah',
        'kode_sub_giat': '1.01.01.2.01.0001',
        'nama_sub_giat': 'Penyusunan Dokumen Perencanaan Perangkat Daerah',
        'kode_bl': '1.01.2.19.0.00.01.0000.1.01.01.1.01.01.2.01',
        'kode_sbl': '1.01.2.19.0.00.01.0000.1.01.01.1.01.01.2.01.1.01.01.2.01.0001',
        'pagu': 2000000,
        'pagu_indikatif': 2000000,
        'pagu_n_depan': 5512500,
        'pagu_n2_depan': 5788125,
        'nama_dana': '1.2.01.08 Dana Alokasi Umum (DAU)',
        'indikator': 'Jumlah Dokumen Perencanaan Perangkat Daerah',
        'satuan': 'Dokumen',
        'target_1': '2'
    }]),
    'dataCapaian': json.dumps([{
        'id_capaian_bl': 522933,
        'capaianteks': '999.Persentase Tertib Administrasi Layanan Pemerintahan',
        'targetcapaian': '100',
        'satuancapaian': '%'
    }]),
    'dataOutput': json.dumps([{
        'idoutputbl': 421017,
        'outputteks': 'Jumlah Dokumen Perencanaan Perangkat Daerah',
        'targetoutput': '2',
        'satuanoutput': 'Dokumen',
        'tolok_ukur_sub': 'Jumlah Dokumen Perencanaan Perangkat Daerah',
        'target_sub': '2',
        'satuan_sub': 'Dokumen'
    }]),
    'rka': json.dumps([{
        'id_rinci_sub_bl': 8433904,
        'id_unik': '717582429',
        'kode_akun': '5.1.02.01.001.00026',
        'nama_akun': 'Belanja Alat/Bahan untuk Kegiatan Kantor- Bahan Cetak',
        'kode_standar_harga': '1.1.12.01.03.0001.00121',
        'nama_standar_harga': 'Fotokopi',
        'nama_komponen': 'Fotokopi',
        'spek_komponen': 'Hitam Putih, Uk. A4/F4',
        'koefisien': '500 Lembar',
        'volume': '500',
        'satuan': 'Lembar',
        'harga_satuan': 500,
        'total_harga': 250000,
        'rincian': 250000,
        'subs_bl_teks': 'Fotocopy Dokumen Perencanaan',
        'ket_bl_teks': 'Belanja Fotocopy Dokumen Perencanaan',
        'nama_dana': '1.2.01.08 Dana Alokasi Umum (DAU)',
        'is_paket': 1
    }])
}

data = urllib.parse.urlencode(payload).encode('utf-8')
req = urllib.request.Request('http://127.0.0.1:8000/api/sync-rka', data=data, method='POST')
try:
    with urllib.request.urlopen(req) as res:
        print("POST Sync-Rka Status:", res.status)
        print("POST Sync-Rka Body:", res.read().decode('utf-8'))
except Exception as e:
    print("POST Sync-Rka failed:", e)
