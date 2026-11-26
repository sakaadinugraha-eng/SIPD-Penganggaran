import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

// Global fetch interceptor to automatically support subfolder deployments (e.g. http://10.50.2.10/sipd-local/public/)
(function() {
  const originalFetch = window.fetch;
  function getBaseUrl() {
    const path = window.location.pathname;
    const publicIdx = path.indexOf('/public');
    if (publicIdx !== -1) {
      return path.substring(0, publicIdx + 7); // returns e.g. "/sipd-local/public"
    }
    const segments = path.split('/').filter(Boolean);
    if (segments.length > 0 && segments[0] !== 'api') {
      return '/' + segments[0]; // returns e.g. "/sipd-local" (tanpa /public)
    }
    if (window.__APP_BASE__ && !window.__APP_BASE__.includes('127.0.0.1:8000')) {
      return window.__APP_BASE__.replace(/\/+$/, '');
    }
    return '';
  }

  window.fetch = function(input, init) {
    const base = getBaseUrl();
    if (base) {
      if (typeof input === 'string' && input.startsWith('/api')) {
        input = base + input;
      }
    }
    return originalFetch.call(this, input, init);
  };
})();

import Login from './pages/Login';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Dashboard from './pages/Dashboard';
import SubKegiatan from './pages/SubKegiatan';
import SkpdList from './pages/SkpdList';
import KosongkanData from './pages/KosongkanData';
import UserManagement from './pages/UserManagement';
import RkaPrintView from './pages/RkaPrintView';
import MasterAkun from './pages/MasterAkun';
import MasterSumberDana from './pages/MasterSumberDana';
import MasterSkpd from './pages/MasterSkpd';
import Pendapatan from './pages/Pendapatan';
import Pembiayaan from './pages/Pembiayaan';
import PostingData from './pages/PostingData';
import ImportDatabase from './pages/ImportDatabase';
import { Toaster, toast } from 'react-hot-toast';

function App() {
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [skpdList, setSkpdList] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSkpdFilter, setSelectedSkpdFilter] = useState('all');
  const [selectedSubUnitFilter, setSelectedSubUnitFilter] = useState('all');
  const [printViewSubKegiatanId, setPrintViewSubKegiatanId] = useState(null);
  const [printViewMode, setPrintViewMode] = useState('rincian'); // 'rincian' | 'paket'
  const [collapsed, setCollapsed] = useState(false);
  const [tahunAnggaran, setTahunAnggaran] = useState(() => {
    try {
      return localStorage.getItem('sipd_tahun_anggaran') || '2026';
    } catch {
      return '2026';
    }
  });
  const [availableYears, setAvailableYears] = useState([2027, 2026, 2025]);

  // 1. Cek sesi login saat aplikasi dibuka
  const checkAuth = async () => {
    try {
      const res = await fetch('/api/me');
      const data = await res.json();
      if (data.authenticated && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setCheckingAuth(false);
    }
  };

  // 2. Ambil daftar tahun anggaran yang tersedia
  const fetchAvailableYears = async () => {
    try {
      const res = await fetch('/api/data/tahun-anggaran');
      const json = await res.json();
      if (json.status === 'success' && Array.isArray(json.data) && json.data.length > 0) {
        setAvailableYears(json.data);
        const saved = localStorage.getItem('sipd_tahun_anggaran');
        if (!saved && json.default_year) {
          setTahunAnggaran(String(json.default_year));
        }
      }
    } catch (err) {
      console.error('Error fetching available years:', err);
    }
  };

  // 3. Ambil data statistik dan daftar SKPD sesuai tahun anggaran
  const fetchGlobalData = async () => {
    setRefreshing(true);
    try {
      const params = new URLSearchParams({ tahun_anggaran: String(tahunAnggaran) });
      const [resStats, resSkpd] = await Promise.all([
        fetch(`/api/data/stats?${params.toString()}`),
        fetch(`/api/data/skpd-list?${params.toString()}`),
      ]);

      const dataStats = await resStats.json();
      const dataSkpd = await resSkpd.json();

      if (dataStats.status === 'success') {
        setStats(dataStats.data);
      }
      if (dataSkpd.status === 'success') {
        setSkpdList(dataSkpd.data || []);
      }
    } catch (err) {
      console.error('Error fetching global data:', err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      fetchAvailableYears();
    }
  }, [user]);

  useEffect(() => {
    try {
      localStorage.setItem('sipd_tahun_anggaran', String(tahunAnggaran));
    } catch {}
    if (user) {
      fetchGlobalData();
    }
  }, [user, tahunAnggaran]);

  const handleRefreshAll = async () => {
    await Promise.all([fetchAvailableYears(), fetchGlobalData()]);
  };

  const handleLogout = async () => {
    if (!window.confirm('Yakin ingin keluar dari dashboard?')) return;
    try {
      await fetch('/api/logout', { method: 'POST' });
    } catch (e) {}
    setUser(null);
  };

  const handleSelectSkpdFromList = (skpdSelection) => {
    if (typeof skpdSelection === 'string') {
      setSelectedSkpdFilter(skpdSelection);
      setSelectedSubUnitFilter('all');
    } else if (skpdSelection && typeof skpdSelection === 'object') {
      setSelectedSkpdFilter(skpdSelection.namaSkpd || 'all');
      setSelectedSubUnitFilter(skpdSelection.subSkpd || 'all');
    }
    setActiveTab('subkegiatan');
  };

  const handleOpenPrint = (subId, mode = 'rincian') => {
    setPrintViewSubKegiatanId(subId);
    setPrintViewMode(mode);
  };

  // Layar loading awal yang cerah
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-700 text-xs">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="font-semibold text-slate-600">Memuat sesi SIPD Local...</span>
        </div>
      </div>
    );
  }

  // Jika belum login, tampilkan layar login cerah
  if (!user) {
    return (
      <>
        <Toaster 
          position="top-right" 
          reverseOrder={false}
          toastOptions={{
            duration: 4000,
            style: {
              background: '#ffffff',
              color: '#1e293b',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              fontSize: '13px',
              fontWeight: '500',
              padding: '12px 16px',
            },
          }}
        />
        <Login onLoginSuccess={(u) => setUser(u)} />
      </>
    );
  }

  // Jika sudah login, tampilkan dashboard lengkap dengan Sidebar & Navbar (Persis SIPD Resmi)
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50/70 text-slate-800 font-sans">
      <Toaster 
        position="top-right" 
        reverseOrder={false}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#ffffff',
            color: '#1e293b',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            fontSize: '13px',
            fontWeight: '500',
            padding: '12px 16px',
          },
        }}
      />
      {/* Sidebar Kiri (Fixed Height - Tidak Memanjang Saat Konten Scroll) */}
      <Sidebar
        activeTab={printViewSubKegiatanId ? 'subkegiatan' : activeTab}
        setActiveTab={(tab) => {
          setPrintViewSubKegiatanId(null);
          setActiveTab(tab);
        }}
        user={user}
        onLogout={handleLogout}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        tahunAnggaran={tahunAnggaran}
      />

      {/* Konten Kanan (Fixed Height dengan Scroll Area Sendiri) */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Navbar
          activeTab={printViewSubKegiatanId ? 'rka-print' : activeTab}
          onRefresh={handleRefreshAll}
          refreshing={refreshing}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          tahunAnggaran={tahunAnggaran}
          setTahunAnggaran={(val) => {
            setSelectedSkpdFilter('all');
            setSelectedSubUnitFilter('all');
            setPrintViewSubKegiatanId(null);
            setTahunAnggaran(String(val));
          }}
          availableYears={availableYears}
        />

        {/* Hanya Konten di Bawah Ini Yang Bergeser / Scroll */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto overflow-x-auto">
          {printViewSubKegiatanId ? (
            <RkaPrintView
              subKegiatanId={printViewSubKegiatanId}
              initialMode={printViewMode}
              onBack={() => setPrintViewSubKegiatanId(null)}
            />
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <Dashboard
                  stats={stats}
                  onNavigate={(tab) => setActiveTab(tab)}
                  tahunAnggaran={tahunAnggaran}
                />
              )}

              {activeTab === 'skpd' && (
                <SkpdList
                  skpdList={skpdList}
                  onSelectSkpd={handleSelectSkpdFromList}
                  tahunAnggaran={tahunAnggaran}
                />
              )}

              {activeTab === 'subkegiatan' && (
                <SubKegiatan
                  skpdList={skpdList}
                  initialSkpd={selectedSkpdFilter}
                  initialSubSkpd={selectedSubUnitFilter}
                  onOpenPrint={handleOpenPrint}
                  onBackToSkpd={() => setActiveTab('skpd')}
                  tahunAnggaran={tahunAnggaran}
                />
              )}

              {activeTab === 'pendapatan' && (
                <Pendapatan tahunAnggaran={tahunAnggaran} />
              )}

              {activeTab === 'pembiayaan' && (
                <Pembiayaan tahunAnggaran={tahunAnggaran} />
              )}

              {activeTab === 'posting' && (
                <PostingData tahunAnggaran={tahunAnggaran} />
              )}

              {activeTab === 'master-skpd' && (
                <MasterSkpd tahunAnggaran={tahunAnggaran} />
              )}

              {activeTab === 'master-akun' && (
                <MasterAkun tahunAnggaran={tahunAnggaran} />
              )}

              {activeTab === 'sumber-dana' && (
                <MasterSumberDana tahunAnggaran={tahunAnggaran} />
              )}

              {activeTab === 'users' && (
                <UserManagement currentUser={user} />
              )}

              {activeTab === 'kosongkan' && (
                <KosongkanData
                  skpdList={skpdList}
                  onDataReset={handleRefreshAll}
                  tahunAnggaran={tahunAnggaran}
                />
              )}

              {activeTab === 'import-db' && (
                <ImportDatabase
                  onDataImported={handleRefreshAll}
                  tahunAnggaran={tahunAnggaran}
                  availableYears={availableYears}
                />
              )}
            </>
          )}
        </main>

        <Footer />
      </div>
    </div>
  );
}

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(<App />);
}
