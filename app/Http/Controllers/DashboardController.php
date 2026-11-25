<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\SubKegiatanBl;
use App\Models\Rka;
use App\Models\CapaianProgram;
use App\Models\SubKegiatanIndikator;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $skpd = $request->input('skpd');

        $query = SubKegiatanBl::where('active', 1)
            ->withCount(['rka', 'indikatorKeluaran as indikator_count', 'capaian']);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('nama_sub_giat', 'like', "%{$search}%")
                  ->orWhere('kode_sub_giat', 'like', "%{$search}%")
                  ->orWhere('nama_skpd', 'like', "%{$search}%")
                  ->orWhere('kode_sbl', 'like', "%{$search}%");
            });
        }

        if ($skpd) {
            $query->where('nama_skpd', $skpd);
        }

        $subKegiatan = $query->orderBy('nama_skpd')->orderBy('kode_sub_giat')->paginate(20)->withQueryString();

        $skpdList = SubKegiatanBl::where('active', 1)
            ->select('nama_skpd')
            ->distinct()
            ->orderBy('nama_skpd')
            ->pluck('nama_skpd');

        $totalSubKeg = SubKegiatanBl::where('active', 1)->count();
        $totalPagu = SubKegiatanBl::where('active', 1)->sum('pagu');
        $totalRka = Rka::where('active', 1)->count();
        $totalRkaNilai = Rka::where('active', 1)->sum('total_harga');

        return view('dashboard', compact(
            'subKegiatan',
            'skpdList',
            'totalSubKeg',
            'totalPagu',
            'totalRka',
            'totalRkaNilai',
            'search',
            'skpd'
        ));
    }

    public function detail($id)
    {
        $sub = SubKegiatanBl::with(['rka', 'indikatorKeluaran', 'capaian'])->findOrFail($id);
        return view('detail', compact('sub'));
    }
}
