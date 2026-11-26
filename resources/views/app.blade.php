<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SADA SIPD - Sinkronisasi Anggaran dan Data</title>
    <link rel="icon" type="image/jpeg" href="{{ asset('images/sada-sipd-icon.jpg') }}">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" rel="stylesheet">
    <script>
        window.__APP_BASE__ = "{{ url('/') }}";
    </script>
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.jsx'])
</head>
<body class="bg-slate-50 text-slate-800 antialiased font-sans">
    <div id="root"></div>
</body>
</html>
