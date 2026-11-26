import React, { useState } from 'react';
import { X, Receipt, Target, Trophy, Building, DollarSign, Calendar, MapPin, Tag, FileText, Package } from 'lucide-react';

export default function SubKegiatanDetailModal({ sub: propSub, subKegiatan, onClose, onOpenPrint }) {
  const [activeTab, setActiveTab] = useState('rka');
  const sub = propSub || subKegiatan;

  if (!sub) return null;

  const formatRupiah = (num) => {
    return 'Rp ' + Number(num || 0).toLocaleString('id-ID', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const rkaList = sub.rka || [];
  const indikatorList = sub.indikator_keluaran || sub.indikatorKeluaran || [];
  const capaianList = sub.capaian || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl my-8 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-start justify-between">
          <div className="min-w-0 pr-4">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-200 uppercase tracking-wide">
                {sub.kode_sub_giat}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {sub.kode_sbl}
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 truncate">{sub.nama_sub_giat}</h3>
            <p className="text-xs text-slate-500 mt-0.5 truncate">
              {sub.nama_sub_skpd || sub.nama_skpd} &bull; <span className="text-emerald-700 font-bold tabular-nums">{formatRupiah(sub.pagu)}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Grid Bar */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-slate-400 text-[11px] block">Sumber Dana:</span>
            <span className="font-semibold text-slate-700">{sub.nama_dana || 'DAU / DBH'}</span>
          </div>
          <div>
            <span className="text-slate-400 text-[11px] block">Lokasi:</span>
            <span className="font-semibold text-slate-700">{sub.nama_lokasi || 'Kab. Kediri'}</span>
          </div>
          <div>
            <span className="text-slate-400 text-[11px] block">Waktu Pelaksanaan:</span>
            <span className="font-semibold text-slate-700">Bulan {sub.waktu_awal || 1} s/d {sub.waktu_akhir || 12}</span>
          </div>
          <div>
            <span className="text-slate-400 text-[11px] block">Pagu N+1:</span>
            <span className="font-semibold text-slate-700">{formatRupiah(sub.pagu_n_depan)}</span>
          </div>
        </div>

        {/* Tab Headers */}
        <div className="px-6 pt-3 border-b border-slate-200 flex items-center gap-2 bg-white shrink-0">
          <button
            onClick={() => setActiveTab('rka')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-semibold flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === 'rka'
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Rincian RKA</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-100 text-indigo-700">
              {rkaList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('indikator')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-semibold flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === 'indikator'
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Indikator Keluaran</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-700">
              {indikatorList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('capaian')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-semibold flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === 'capaian'
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Capaian Program</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-700">
              {capaianList.length}
            </span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 p-6 overflow-y-auto bg-slate-50/50">
          {/* TAB 1: RINCIAN RKA */}
          {activeTab === 'rka' && (
            <div>
              {rkaList.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  Belum ada data rincian RKA untuk sub kegiatan ini.
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-900 text-white font-semibold">
                        <th className="py-2.5 px-3 w-10 text-center">No</th>
                        <th className="py-2.5 px-3 w-36">Kode Rekening</th>
                        <th className="py-2.5 px-3">Uraian / Komponen</th>
                        <th className="py-2.5 px-3 text-center w-20">Volume</th>
                        <th className="py-2.5 px-3 text-center w-20">Satuan</th>
                        <th className="py-2.5 px-3 text-end w-28">Harga Satuan</th>
                        <th className="py-2.5 px-3 text-end w-32">Total Harga</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rkaList.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition">
                          <td className="py-2.5 px-3 text-center text-slate-400">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">{item.kode_akun}</td>
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-slate-900">{item.nama_komponen || item.nama_standar_harga}</div>
                            {item.spek_komponen && (
                              <div className="text-[10px] text-slate-500 mt-0.5">{item.spek_komponen}</div>
                            )}
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">{item.nama_akun}</div>
                          </td>
                          <td className="py-2.5 px-3 text-center text-slate-600">{item.koefisien || item.volume || 1}</td>
                          <td className="py-2.5 px-3 text-center text-slate-500">{item.satuan || '-'}</td>
                          <td className="py-2.5 px-3 text-end text-slate-600">{formatRupiah(item.harga_satuan)}</td>
                          <td className="py-2.5 px-3 text-end font-semibold text-emerald-700">{formatRupiah(item.total_harga || item.rincian)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: INDIKATOR KELUARAN */}
          {activeTab === 'indikator' && (
            <div>
              {indikatorList.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  Belum ada data indikator keluaran untuk sub kegiatan ini.
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-900 text-white font-semibold">
                        <th className="py-2.5 px-3 w-10 text-center">No</th>
                        <th className="py-2.5 px-3">Tolak Ukur Kinerja / Indikator</th>
                        <th className="py-2.5 px-3 text-center w-28">Target</th>
                        <th className="py-2.5 px-3 text-center w-28">Satuan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {indikatorList.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition">
                          <td className="py-2.5 px-3 text-center text-slate-400">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-medium text-slate-800">
                            {item.outputteks || item.tolok_ukur_sub || '-'}
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold text-indigo-700">
                            {item.targetoutput || item.target_sub || item.targetoutputteks || '-'}
                          </td>
                          <td className="py-2.5 px-3 text-center text-slate-500">
                            {item.satuanoutput || item.satuan_sub || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CAPAIAN PROGRAM */}
          {activeTab === 'capaian' && (
            <div>
              {capaianList.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  Belum ada data capaian program untuk sub kegiatan ini.
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-900 text-white font-semibold">
                        <th className="py-2.5 px-3 w-10 text-center">No</th>
                        <th className="py-2.5 px-3">Indikator Capaian Program</th>
                        <th className="py-2.5 px-3 text-center w-28">Target</th>
                        <th className="py-2.5 px-3 text-center w-28">Satuan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {capaianList.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition">
                          <td className="py-2.5 px-3 text-center text-slate-400">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-medium text-slate-800">
                            {item.capaianteks || '-'}
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold text-emerald-700">
                            {item.targetcapaianteks || item.targetcapaian || '-'}
                          </td>
                          <td className="py-2.5 px-3 text-center text-slate-500">
                            {item.satuancapaian || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-white border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {onOpenPrint && (
              <>
                <button
                  onClick={() => {
                    onClose();
                    onOpenPrint(sub.id, 'rincian');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Cetak RKA Rincian Belanja</span>
                </button>
                <button
                  onClick={() => {
                    onClose();
                    onOpenPrint(sub.id, 'paket');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>Cetak RKA Paket / Kelompok</span>
                </button>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
