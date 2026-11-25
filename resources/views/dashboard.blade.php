<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SIPD Local Dashboard</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
    <style>
        body { background-color: #f8fafc; font-family: system-ui, -apple-system, sans-serif; }
        .card-stat { border: none; border-radius: 12px; transition: transform 0.2s; }
        .card-stat:hover { transform: translateY(-2px); }
        .table-custom { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
        .table-custom th { background-color: #0f172a; color: white; font-weight: 600; font-size: 0.85rem; text-transform: uppercase; }
        .badge-pagu { background: #e0f2fe; color: #0369a1; font-weight: 600; }
        .badge-rka { background: #fef3c7; color: #b45309; font-weight: 600; }
    </style>
</head>
<body>
    <nav class="navbar navbar-dark bg-dark sticky-top shadow-sm">
        <div class="container-fluid px-4">
            <span class="navbar-brand mb-0 h1 d-flex align-items-center gap-2">
                <i class="bi bi-database-fill-gear text-primary"></i>
                <strong>SIPD Local</strong>
                <span class="badge bg-primary text-uppercase" style="font-size: 0.65rem;">Laravel Standalone</span>
            </span>
            <div class="d-flex align-items-center gap-3">
                <span class="text-white-50 small"><i class="bi bi-clock"></i> Tahun Anggaran 2027</span>
                <span class="badge bg-success"><i class="bi bi-check-circle"></i> Sinkronisasi Aktif</span>
            </div>
        </div>
    </nav>

    <div class="container-fluid px-4 py-4">
        <!-- Statistik Cards -->
        <div class="row g-3 mb-4">
            <div class="col-md-3">
                <div class="card card-stat bg-white shadow-sm p-3">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <div class="text-muted small fw-semibold">TOTAL SUB KEGIATAN</div>
                            <div class="fs-4 fw-bold text-dark">{{ number_format($totalSubKeg) }}</div>
                        </div>
                        <div class="bg-primary-subtle text-primary p-3 rounded-circle">
                            <i class="bi bi-folder2-open fs-4"></i>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card card-stat bg-white shadow-sm p-3">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <div class="text-muted small fw-semibold">TOTAL PAGU KEGIATAN</div>
                            <div class="fs-4 fw-bold text-primary">Rp {{ number_format($totalPagu, 0, ',', '.') }}</div>
                        </div>
                        <div class="bg-success-subtle text-success p-3 rounded-circle">
                            <i class="bi bi-cash-stack fs-4"></i>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card card-stat bg-white shadow-sm p-3">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <div class="text-muted small fw-semibold">TOTAL ITEM RINCIAN RKA</div>
                            <div class="fs-4 fw-bold text-dark">{{ number_format($totalRka) }}</div>
                        </div>
                        <div class="bg-warning-subtle text-warning p-3 rounded-circle">
                            <i class="bi bi-receipt fs-4"></i>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card card-stat bg-white shadow-sm p-3">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <div class="text-muted small fw-semibold">TOTAL RINCIAN BELANJA</div>
                            <div class="fs-4 fw-bold text-success">Rp {{ number_format($totalRkaNilai, 0, ',', '.') }}</div>
                        </div>
                        <div class="bg-info-subtle text-info p-3 rounded-circle">
                            <i class="bi bi-wallet2 fs-4"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Filter & Search -->
        <div class="card bg-white border-0 shadow-sm p-3 mb-4 rounded-3">
            <form method="GET" action="{{ route('dashboard') }}" class="row g-2 align-items-center">
                <div class="col-md-4">
                    <div class="input-group">
                        <span class="input-group-text bg-light"><i class="bi bi-search"></i></span>
                        <input type="text" name="search" class="form-control" placeholder="Cari nama sub kegiatan, kode, SKPD..." value="{{ $search }}">
                    </div>
                </div>
                <div class="col-md-4">
                    <select name="skpd" class="form-select">
                        <option value="">-- Semua SKPD / Perangkat Daerah --</option>
                        @foreach($skpdList as $s)
                            <option value="{{ $s }}" {{ $skpd == $s ? 'selected' : '' }}>{{ $s }}</option>
                        @endforeach
                    </select>
                </div>
                <div class="col-md-2">
                    <button type="submit" class="btn btn-primary w-100"><i class="bi bi-filter"></i> Filter</button>
                </div>
                <div class="col-md-2 text-end">
                    <a href="{{ route('dashboard') }}" class="btn btn-outline-secondary w-100"><i class="bi bi-arrow-clockwise"></i> Reset</a>
                </div>
            </form>
        </div>

        <!-- Tabel Data Sub Kegiatan -->
        <div class="table-custom">
            <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                    <thead>
                        <tr>
                            <th width="4%">No</th>
                            <th width="20%">Perangkat Daerah</th>
                            <th width="12%">Kode Sub Giat</th>
                            <th width="28%">Nama Sub Kegiatan</th>
                            <th width="14%" class="text-end">Pagu Sub Kegiatan</th>
                            <th width="10%" class="text-center">Rincian RKA</th>
                            <th width="8%" class="text-center">Indikator</th>
                            <th width="4%" class="text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse($subKegiatan as $index => $row)
                            <tr>
                                <td>{{ $subKegiatan->firstItem() + $index }}</td>
                                <td>
                                    <div class="fw-semibold text-dark">{{ $row->nama_skpd }}</div>
                                    <small class="text-muted">{{ $row->kode_sub_skpd }}</small>
                                </td>
                                <td>
                                    <code class="text-primary fw-bold">{{ $row->kode_sub_giat }}</code>
                                </td>
                                <td>
                                    <div class="fw-semibold">{{ $row->nama_sub_giat }}</div>
                                    <small class="text-muted d-block">{{ $row->nama_program }}</small>
                                </td>
                                <td class="text-end">
                                    <span class="badge badge-pagu px-2 py-1 fs-6">
                                        Rp {{ number_format($row->pagu, 0, ',', '.') }}
                                    </span>
                                </td>
                                <td class="text-center">
                                    <span class="badge badge-rka px-2 py-1 fs-6">
                                        {{ $row->rka_count }} Item
                                    </span>
                                </td>
                                <td class="text-center">
                                    <span class="badge bg-light text-dark border">
                                        {{ $row->indikator_count }} Keluaran
                                    </span>
                                </td>
                                <td class="text-center">
                                    <a href="{{ route('sub_kegiatan.detail', $row->id) }}" class="btn btn-sm btn-outline-primary" title="Lihat Detail RKA & Indikator">
                                        <i class="bi bi-eye"></i>
                                    </a>
                                </td>
                            </tr>
                        @empty
                            <tr>
                                <td colspan="8" class="text-center py-5 text-muted">
                                    <i class="bi bi-inbox fs-1 d-block mb-2"></i>
                                    Belum ada data sub-kegiatan tersinkron.<br>
                                    Silakan buka SIPD di browser dan klik tombol <strong>"Singkron RKA ke DB lokal"</strong>.
                                </td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
            @if($subKegiatan->hasPages())
                <div class="p-3 border-top d-flex justify-content-between align-items-center">
                    <span class="text-muted small">Menampilkan {{ $subKegiatan->firstItem() }} - {{ $subKegiatan->lastItem() }} dari {{ $subKegiatan->total() }} sub-kegiatan</span>
                    <div>{{ $subKegiatan->links('pagination::bootstrap-5') }}</div>
                </div>
            @endif
        </div>
    </div>
</body>
</html>
