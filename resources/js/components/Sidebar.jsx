import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  FolderTree, 
  Building2, 
  Trash2, 
  Database, 
  LogOut, 
  Users,
  Settings,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Receipt,
  Coins,
  TrendingUp,
  ShoppingBag,
  Scale,
  Landmark,
  BookmarkCheck,
  Upload
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, user, onLogout, collapsed, setCollapsed }) {
  const [penganggaranOpen, setPenganggaranOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(
    activeTab === 'users' || activeTab === 'kosongkan' || activeTab === 'import-db'
  );

  const mainMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ];

  const penganggaranSubItems = [
    { id: 'skpd', label: 'Belanja & RKA', icon: ShoppingBag },
    { id: 'pendapatan', label: 'Pendapatan Daerah', icon: TrendingUp },
    { id: 'pembiayaan', label: 'Pembiayaan Daerah', icon: Scale },
    { id: 'posting', label: 'Posting Data', icon: BookmarkCheck },
  ];

  const masterMenuItems = [
    { id: 'master-akun', label: 'Master Akun', icon: Receipt },
    { id: 'sumber-dana', label: 'Sumber Dana', icon: Coins },
  ];

  const settingsSubItems = [
    { id: 'import-db', label: 'Import & Export DB', icon: Upload },
    { id: 'users', label: 'Atur Users', icon: Users },
    { id: 'kosongkan', label: 'Pembersihan Data', icon: Trash2, danger: true },
  ];

  const isPenganggaranActive = activeTab === 'skpd' || activeTab === 'subkegiatan' || activeTab === 'pendapatan' || activeTab === 'pembiayaan' || activeTab === 'posting';
  const isSettingsActive = activeTab === 'users' || activeTab === 'kosongkan' || activeTab === 'import-db';

  const handleSelectTab = (tabId) => {
    setActiveTab(tabId);
    if (tabId === 'users' || tabId === 'kosongkan' || tabId === 'import-db') {
      setSettingsOpen(true);
    }
    if (tabId === 'skpd' || tabId === 'subkegiatan' || tabId === 'pendapatan' || tabId === 'pembiayaan' || tabId === 'posting') {
      setPenganggaranOpen(true);
    }
  };

  return (
    <aside 
      className={`bg-white border-r border-slate-200 text-slate-700 flex flex-col shrink-0 h-screen transition-all duration-300 ease-in-out z-30 shadow-xs print:hidden ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className={`h-16 border-b border-slate-100 flex items-center ${collapsed ? 'justify-center px-2' : 'justify-between px-4'}`}>
        {collapsed ? (
          <button
            onClick={() => setCollapsed(false)}
            className="w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center text-white shadow-xs transition cursor-pointer group"
            title="Buka Sidebar"
          >
            <Database className="w-5 h-5 group-hover:hidden transition-transform" />
            <PanelLeftOpen className="w-5 h-5 hidden group-hover:block transition-transform" />
          </button>
        ) : (
          <>
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs shrink-0 font-bold">
                <Database className="w-5 h-5" />
              </div>
              <div className="min-w-0 transition-opacity duration-200">
                <h1 className="text-sm font-bold text-slate-900 tracking-tight truncate">SIPD LOCAL</h1>
                <p className="text-[11px] text-slate-500 font-medium truncate">Penganggaran 2027</p>
              </div>
            </div>

            {/* Toggle Collapse Button */}
            <button
              onClick={() => setCollapsed(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer shrink-0"
              title="Tutup Sidebar"
            >
              <PanelLeftClose className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Navigation List */}
      <div className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {!collapsed && (
          <div className="px-3 pb-1.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            Menu Utama
          </div>
        )}

        {/* Dashboard Item */}
        {mainMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleSelectTab(item.id)}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center ${collapsed ? 'justify-center px-0' : 'justify-between px-3.5'} py-2.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-600' : 'text-slate-500'}`} />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </div>
              {!collapsed && isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
              )}
            </button>
          );
        })}

        {/* Penganggaran Dropdown Parent */}
        <div className="pt-1">
          <button
            onClick={() => {
              if (collapsed) {
                setCollapsed(false);
                setPenganggaranOpen(true);
              } else {
                setPenganggaranOpen(!penganggaranOpen);
              }
            }}
            title={collapsed ? 'Penganggaran' : undefined}
            className={`w-full flex items-center ${collapsed ? 'justify-center px-0' : 'justify-between px-3.5'} py-2.5 rounded-xl text-xs font-medium transition cursor-pointer ${
              isPenganggaranActive && !penganggaranOpen
                ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200 shadow-xs'
                : isPenganggaranActive
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <Landmark className={`w-4 h-4 shrink-0 ${isPenganggaranActive ? 'text-indigo-600' : 'text-slate-500'}`} />
              {!collapsed && <span className="truncate font-semibold">Penganggaran</span>}
            </div>
            {!collapsed && (
              <div className="text-slate-400">
                {penganggaranOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </div>
            )}
          </button>

          {/* Sub Menu Penganggaran (Belanja, Pendapatan, Pembiayaan) */}
          {(!collapsed && penganggaranOpen) && (
            <div className="mt-1 pl-3.5 space-y-1 border-l-2 border-slate-100 ml-4 animate-in fade-in slide-in-from-top-1 duration-150">
              {penganggaranSubItems.map((sub) => {
                const SubIcon = sub.icon;
                const isSubActive = activeTab === sub.id || (sub.id === 'skpd' && activeTab === 'subkegiatan');
                return (
                  <button
                    key={sub.id}
                    onClick={() => handleSelectTab(sub.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition cursor-pointer ${
                      isSubActive
                        ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200 shadow-xs'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <SubIcon className={`w-3.5 h-3.5 shrink-0 ${
                        isSubActive ? 'text-indigo-600' : 'text-slate-400'
                      }`} />
                      <span className="truncate">{sub.label}</span>
                    </div>
                    {isSubActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Shortcut icon saat sidebar collapsed */}
          {collapsed && (
            <div className="mt-1 space-y-1">
              {penganggaranSubItems.map((sub) => {
                const SubIcon = sub.icon;
                const isSubActive = activeTab === sub.id || (sub.id === 'skpd' && activeTab === 'subkegiatan');
                return (
                  <button
                    key={sub.id}
                    onClick={() => handleSelectTab(sub.id)}
                    title={sub.label}
                    className={`w-full flex items-center justify-center py-2 rounded-xl transition cursor-pointer ${
                      isSubActive
                        ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                    }`}
                  >
                    <SubIcon className={`w-4 h-4 ${isSubActive ? 'text-indigo-600' : 'text-slate-500'}`} />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Data Master Group */}
        <div className="pt-2">
          {!collapsed && (
            <div className="px-3 pb-1.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              Data Master
            </div>
          )}
          {masterMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center ${collapsed ? 'justify-center px-0' : 'justify-between px-3.5'} py-2.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200 shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-600' : 'text-slate-500'}`} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </div>
                {!collapsed && isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                )}
              </button>
            );
          })}
        </div>

        {/* Divider Group Pengaturan */}
        <div className="pt-2">
          {!collapsed && (
            <div className="px-3 pb-1.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              Pengaturan Sistem
            </div>
          )}

          {/* Pengaturan Parent Button (Collapsible Dropdown) */}
          <button
            onClick={() => {
              if (collapsed) {
                setCollapsed(false);
                setSettingsOpen(true);
              } else {
                setSettingsOpen(!settingsOpen);
              }
            }}
            title={collapsed ? 'Pengaturan' : undefined}
            className={`w-full flex items-center ${collapsed ? 'justify-center px-0' : 'justify-between px-3.5'} py-2.5 rounded-xl text-xs font-medium transition cursor-pointer ${
              isSettingsActive && !settingsOpen
                ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200 shadow-xs'
                : isSettingsActive
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <Settings className={`w-4 h-4 shrink-0 ${isSettingsActive ? 'text-indigo-600' : 'text-slate-500'}`} />
              {!collapsed && <span className="truncate font-semibold">Pengaturan</span>}
            </div>
            {!collapsed && (
              <div className="text-slate-400">
                {settingsOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </div>
            )}
          </button>

          {/* Sub Menu Items Pengaturan */}
          {(!collapsed && settingsOpen) && (
            <div className="mt-1 pl-3.5 space-y-1 border-l-2 border-slate-100 ml-4 animate-in fade-in slide-in-from-top-1 duration-150">
              {settingsSubItems.map((sub) => {
                const SubIcon = sub.icon;
                const isSubActive = activeTab === sub.id;
                return (
                  <button
                    key={sub.id}
                    onClick={() => handleSelectTab(sub.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition cursor-pointer ${
                      isSubActive
                        ? sub.danger
                          ? 'bg-rose-50 text-rose-700 font-bold border border-rose-200 shadow-xs'
                          : 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200 shadow-xs'
                        : sub.danger
                        ? 'text-rose-600 hover:bg-rose-50/70 font-medium'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <SubIcon className={`w-3.5 h-3.5 shrink-0 ${
                        isSubActive
                          ? sub.danger ? 'text-rose-600' : 'text-indigo-600'
                          : sub.danger ? 'text-rose-500' : 'text-slate-400'
                      }`} />
                      <span className="truncate">{sub.label}</span>
                    </div>
                    {isSubActive && (
                      <span className={`w-1.5 h-1.5 rounded-full ${sub.danger ? 'bg-rose-500' : 'bg-indigo-600'}`} />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Icon Shortcut saat Collapsed */}
          {collapsed && (
            <div className="mt-1 space-y-1">
              {settingsSubItems.map((sub) => {
                const SubIcon = sub.icon;
                const isSubActive = activeTab === sub.id;
                return (
                  <button
                    key={sub.id}
                    onClick={() => handleSelectTab(sub.id)}
                    title={sub.label}
                    className={`w-full flex items-center justify-center py-2 rounded-xl transition cursor-pointer ${
                      isSubActive
                        ? sub.danger
                          ? 'bg-rose-50 text-rose-700 font-bold border border-rose-200'
                          : 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200'
                        : sub.danger
                        ? 'text-rose-600 hover:bg-rose-50/70'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <SubIcon className={`w-4 h-4 ${
                      isSubActive
                        ? sub.danger ? 'text-rose-600' : 'text-indigo-600'
                        : sub.danger ? 'text-rose-500' : 'text-slate-500'
                    }`} />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* System Status info (hanya saat tidak collapsed) */}
      {!collapsed && (
        <div className="px-4 py-3 mx-3 mb-3 bg-slate-50 border border-slate-200/80 rounded-xl text-[11px]">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="font-semibold text-slate-700">Server Lokal Aktif</span>
          </div>
          <p className="text-[10px] text-slate-500">127.0.0.1:8000 &bull; MySQL db_sipd</p>
        </div>
      )}

      {/* User Card & Logout */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/60">
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} p-1.5 rounded-xl`}>
          {!collapsed && (
            <div className="flex items-center gap-2.5 min-w-0 pr-2">
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate">{user?.name || 'Administrator'}</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email || 'admin@sipd.local'}</p>
              </div>
            </div>
          )}
          <button
            onClick={onLogout}
            title="Keluar dari Akun"
            className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
