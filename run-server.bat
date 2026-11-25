@echo off
title SIPD Local Server (Port 8000)
cd /d C:\laragon\www\sipd-local
echo ==============================================
echo Menjalankan SIPD Local Server di Port 8000...
echo Dashboard: http://127.0.0.1:8000
echo Endpoint : http://127.0.0.1:8000/api/sync-rka
echo ==============================================
"C:\laragon\bin\php\php-8.3.36-Win32-vs16-x64\php.exe" artisan serve --host=127.0.0.1 --port=8000
pause
