<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Detail Sub Kegiatan: {{ $sub->nama_sub_giat }}</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
    <style>
        body { background-color: #f8fafc; font-family: system-ui, -apple-system, sans-serif; }
        .card-custom { border: none; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
        .table-custom th { background-color: #0f172a; color: white; font-weight: 600; font-size: 0.85rem; }
    </style>
</head>
<body>
    <nav class="navbar navbar-dark bg-dark sticky-top shadow-sm">
        <div class="container-fluid px-4">
            <a href="{{ route('dashboard') }}" class="btn btn-outline-light btn-sm d-flex align-items-center gap-2">
                <i class="bi bi-arrow-left"></i> Kembali ke Dashboard
            </a>
            <span class="navbar-brand mb-0 h1">Detail Sub Kegiatan</span>
        </div>
    </nav>

    <div class="container-fluid px-4 py-4">
        <!-- Informasi Sub Kegiatan Header -->
        <div class="card card-custom bg-white p-4 mb-4">
            <div class="row align-items-center">
                <div class="col-md-8">
                    <span class="badge bg-primary mb-2">{{ $sub->kode_sub_skpd }} - {{ $sub->nama_skpd }}</span>
                    <h4 class="fw-bold mb-1">{{ $sub->kode_sub_giat }} {{ $sub->nama_sub_giat }}</h4>
                    <p class="text-muted mb-0"><i class="bi bi-diagram-3"></i> {{ $sub->nama_program }} &rsaquo; {{ $sub->nama_giat }}</p>
                </div>
                <div class="col-md-4 text-md-end mt-3 mt-md-0">
                    <div class="text-muted small">PAGU ANGGARAN</div>
                    <div class="fs-3 fw-bold text-success">Rp {{ number_format($sub->pagu, 0, ',', '.') }}</div>
                    <small class="text-muted">Sumber Dana: {{ $sub->nama_dana ?: '-' }}</small>
                </div>
            </div>
        </div>

        <ul class="nav nav-pills mb-3" id="pills-tab" role="tablist">
            <li class="nav-item" role="presentation">
                <button class="nav-link active fw-semibold" id="tab-rka" data-bs-toggle="pill" data-bs-target="#content-rka" type="button">
                    <i class="bi bi-receipt"></i> Rincian Belanja RKA ({{ $sub->rka->count() }})
                </button>
            </li>
            <li class="nav-item" role="presentation">
                <button class="nav-link fw-semibold" id="tab-indikator" data-bs-toggle="pill" data-bs-target="#content-indikator" type="button">
                    <i class="bi bi-list-check"></i> Indikator Keluaran ({{ $sub->indikatorKeluaran->count() }})
                </button>
            </li>
            <li class="nav-item" role="presentation">
                <button class="nav-link fw-semibold" id="tab-capaian" data-bs-toggle="pill" data-bs-target="#content-capaian" type="button">
                    <i class="bi bi-trophy"></i> Capaian Program ({{ $sub->capaian->count() }})
                </button>
            </li>
        </ul>

        <div class="tab-content" id="pills-tabContent">
            <!-- TAB 1: RINCIAN RKA -->
            <div class="tab-pane fade show active" id="content-rka" role="tabpanel">
                <div class="card card-custom bg-white p-3">
                    <div class="table-responsive">
                        <table class="table table-hover align-middle mb-0">
                            <thead class="table-dark">
                                <tr>
                                    <th width="3%">No</th>
                                    <th width="15%">Kode Rekening</th>
                                    <th width="20%">Nama Rekening</th>
                                    <th width="22%">Nama Komponen & Spek</th>
                                    <th width="10%">Koefisien</th>
                                    <th width="12%" class="text-end">Harga Satuan</th>
                                    <th width="12%" class="text-end">Total Harga</th>
                                    <th width="6%" class="text-center">Paket</th>
                                </tr>
                            </thead>
                            <tbody>
                                @php $totalNilai = 0; @endphp
                                @forelse($sub->rka as $idx => $item)
                                    @php $totalNilai += $item->total_harga; @endphp
                                    <tr>
                                        <td>{{ $idx + 1 }}</td>
                                        <td><code>{{ $item->kode_akun }}</code></td>
                                        <td>
                                            <div class="fw-semibold">{{ $item->nama_akun }}</div>
                                            <small class="text-muted">{{ $item->ket_bl_teks }}</small>
                                        </td>
                                        <td>
                                            <div class="fw-semibold text-primary">{{ $item->nama_komponen }}</div>
                                            <small class="text-muted">{{ $item->spek_komponen }}</small>
                                            @if($item->subs_bl_teks)
                                                <div class="badge bg-light text-dark border mt-1"><i class="bi bi-tag"></i> {{ $item->subs_bl_teks }}</div>
                                            @endif
                                        </td>
                                        <td>{{ $item->koefisien ?: ($item->volume . ' ' . $item->satuan) }}</td>
                                        <td class="text-end">Rp {{ number_format($item->harga_satuan, 0, ',', '.') }}</td>
                                        <td class="text-end fw-bold">Rp {{ number_format($item->total_harga, 0, ',', '.') }}</td>
                                        <td class="text-center">
                                            @if($item->is_paket)
                                                <span class="badge bg-info text-dark">Ya</span>
                                            @else
                                                <span class="badge bg-light text-muted border">-</span>
                                            @endif
                                        </td>
                                    </tr>
                                @empty
                                    <tr>
                                        <td colspan="8" class="text-center py-4 text-muted">Belum ada rincian belanja untuk sub-kegiatan ini.</td>
                                    </tr>
                                @endforelse
                            </tbody>
                            @if($sub->rka->count() > 0)
                                <tfoot class="table-light fw-bold">
                                    <tr>
                                        <td colspan="6" class="text-end">TOTAL RINCIAN BELANJA:</td>
                                        <td class="text-end text-success fs-6">Rp {{ number_format($totalNilai, 0, ',', '.') }}</td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            @endif
                        </table>
                    </div>
                </div>
            </div>

            <!-- TAB 2: INDIKATOR KELUARAN -->
            <div class="tab-pane fade" id="content-indikator" role="tabpanel">
                <div class="card card-custom bg-white p-3">
                    <table class="table table-hover align-middle mb-0">
                        <thead class="table-dark">
                            <tr>
                                <th width="5%">No</th>
                                <th width="15%">Tingkat</th>
                                <th width="55%">Tolak Ukur Kinerja / Indikator</th>
                                <th width="15%" class="text-center">Target</th>
                                <th width="10%">Satuan</th>
                            </tr>
                        </thead>
                        <tbody>
                            @forelse($sub->indikatorKeluaran as $idx => $ind)
                                <tr>
                                    <td>{{ $idx + 1 }}</td>
                                    <td>
                                        <span class="badge {{ $ind->tipe == 'sub_kegiatan' ? 'bg-primary' : 'bg-secondary' }}">
                                            {{ strtoupper(str_replace('_', ' ', $ind->tipe)) }}
                                        </span>
                                    </td>
                                    <td class="fw-semibold">{{ $ind->outputteks ?: $ind->tolok_ukur_sub }}</td>
                                    <td class="text-center fw-bold">{{ $ind->targetoutput ?: $ind->target_sub }}</td>
                                    <td>{{ $ind->satuanoutput ?: $ind->satuan_sub }}</td>
                                </tr>
                            @empty
                                <tr>
                                    <td colspan="5" class="text-center py-4 text-muted">Belum ada indikator keluaran.</td>
                                </tr>
                            @endforelse
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- TAB 3: CAPAIAN PROGRAM -->
            <div class="tab-pane fade" id="content-capaian" role="tabpanel">
                <div class="card card-custom bg-white p-3">
                    <table class="table table-hover align-middle mb-0">
                        <thead class="table-dark">
                            <tr>
                                <th width="5%">No</th>
                                <th width="65%">Tolak Ukur Capaian Program</th>
                                <th width="15%" class="text-center">Target</th>
                                <th width="15%">Satuan</th>
                            </tr>
                        </thead>
                        <tbody>
                            @forelse($sub->capaian as $idx => $cap)
                                <tr>
                                    <td>{{ $idx + 1 }}</td>
                                    <td class="fw-semibold">{{ $cap->capaianteks }}</td>
                                    <td class="text-center fw-bold">{{ $cap->targetcapaian ?: $cap->targetcapaianteks }}</td>
                                    <td>{{ $cap->satuancapaian }}</td>
                                </tr>
                            @empty
                                <tr>
                                    <td colspan="4" class="text-center py-4 text-muted">Belum ada capaian program.</td>
                                </tr>
                            @endforelse
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
