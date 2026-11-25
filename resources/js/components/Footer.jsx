import React from 'react';

export default function Footer() {
  return (
    <footer className="py-4 px-6 bg-white border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 mt-auto shrink-0 print:hidden">
      <div>
        <span className="font-semibold text-slate-700">SIPD Local Server</span> &bull; Terhubung ke Chrome Extension SIPD RI tools
      </div>
      <div className="flex items-center gap-4 text-slate-400">
        <span>Port 8000</span>
        <span>&bull;</span>
        <span>Laragon MySQL 3306</span>
        <span>&bull;</span>
        <span>Laravel 11 + React</span>
      </div>
    </footer>
  );
}
