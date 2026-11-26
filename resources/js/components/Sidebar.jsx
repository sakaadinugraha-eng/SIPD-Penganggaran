import React, { useState, useEffect } from 'react';
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
  Upload,
  X
} from 'lucide-react';

function CollapsedTooltip({ label, show }) {
  if (!show) return null;
  return (
    <span
      role="tooltip"
      className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-medium whitespace-nowrap opacity-0 group-hover/tip:opacity-100 group-focus-visible/tip:opacity-100 transition-opacity duration-150 shadow-md z-50"
    >
      {label}
    </span>
  );
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  user,
  onLogout,
  collapsed,
  setCollapsed,
  mobileOpen = false,
  setMobileOpen,
  tahunAnggaran = '2026',
  dbInfo = null,
}) {
  const [penganggaranOpen, setPenganggaranOpen] = useState(true);
  const dataMasterTabIds = ['master-skpd', 'master-akun', 'sumber-dana'];
  const settingsTabIds = [...dataMasterTabIds, 'import-db', 'users', 'kosongkan'];
  const [settingsOpen, setSettingsOpen] = useState(
    settingsTabIds.includes(activeTab)
  );
  const [dataMasterOpen, setDataMasterOpen] = useState(
    dataMasterTabIds.includes(activeTab)
  );

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && mobileOpen && setMobileOpen) {
        setMobileOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen, setMobileOpen]);

  const mainMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ];

  const penganggaranSubItems = [
    { id: 'skpd', label: 'Belanja & RKA', icon: ShoppingBag },
    { id: 'pendapatan', label: 'Pendapatan Daerah', icon: TrendingUp },
    { id: 'pembiayaan', label: 'Pembiayaan Daerah', icon: Scale },
    { id: 'posting', label: 'Posting Data', icon: BookmarkCheck },
  ];

  const dataMasterSubItems = [
    { id: 'master-skpd', label: 'Master SKPD', icon: Building2 },
    { id: 'master-akun', label: 'Master Akun', icon: Receipt },
    { id: 'sumber-dana', label: 'Sumber Dana', icon: Coins },
  ];

  const settingsSubItems = [
    { id: 'import-db', label: 'Import & Export DB', icon: Upload },
    { id: 'users', label: 'Atur Users', icon: Users },
    { id: 'kosongkan', label: 'Pembersihan Data', icon: Trash2, danger: true },
  ];

  const isDataMasterActive = dataMasterTabIds.includes(activeTab);

  const isPenganggaranActive =
    activeTab === 'skpd' ||
    activeTab === 'subkegiatan' ||
    activeTab === 'pendapatan' ||
    activeTab === 'pembiayaan' ||
    activeTab === 'posting';
  const isSettingsActive = settingsTabIds.includes(activeTab);

  const handleSelectTab = (tabId) => {
    setActiveTab(tabId);
    if (dataMasterTabIds.includes(tabId)) {
      setDataMasterOpen(true);
    }
    if (settingsTabIds.includes(tabId)) {
      setSettingsOpen(true);
    }
    if (['skpd', 'subkegiatan', 'pendapatan', 'pembiayaan', 'posting'].includes(tabId)) {
      setPenganggaranOpen(true);
    }
    if (setMobileOpen) {
      setMobileOpen(false);
    }
  };

  const logoSrc = `${(typeof window !== 'undefined' && window.__APP_BASE__) ? window.__APP_BASE__.replace(/\/+$/, '') : ''}/images/sada-sipd-icon.jpg`;

  const isDbError = dbInfo?.status === 'error';
  const isDbConnected = dbInfo?.status === 'connected';
  const isCollapsedDesktop = collapsed && !mobileOpen;

  return (
    <>
      {/* Backdrop Drawer untuk Layar Kecil */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden transition-opacity"
          onClick={() => setMobileOpen && setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        aria-label="Navigasi Utama"
        className={`fixed inset-y-0 left-0 lg:static bg-white border-r border-slate-200 text-slate-700 flex flex-col shrink-0 h-screen transition-all duration-300 ease-in-out z-50 lg:z-30 print:hidden ${
          mobileOpen ? 'translate-x-0 w-64 shadow-xl' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsedDesktop ? 'lg:w-20' : 'lg:w-64'}`}
      >
        {/* Brand Header */}
        <div className={`h-16 border-b border-slate-100 flex items-center shrink-0 ${isCollapsedDesktop ? 'justify-center px-2' : 'justify-between px-4'}`}>
          {isCollapsedDesktop ? (
            <div className="relative group/tip">
              <button
                type="button"
                onClick={() => setCollapsed(false)}
                aria-label="Buka Sidebar"
                className="w-11 h-11 rounded-xl bg-slate-900 hover:bg-indigo-700 flex items-center justify-center text-white transition cursor-pointer group overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <img
                  src={logoSrc}
                  alt="Logo SADA SIPD"
                  width={44}
                  height={44}
                  className="w-full h-full object-cover group-hover:hidden"
                />
                <PanelLeftOpen className="w-5 h-5 hidden group-hover:block" aria-hidden="true" />
              </button>
              <CollapsedTooltip label="Buka Sidebar" show={true} />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 overflow-hidden">
                <img
                  src={logoSrc}
                  alt="Logo SADA SIPD"
                  width={36}
                  height={36}
                  className="w-9 h-9 rounded-xl object-cover shrink-0"
                />
                <div className="min-w-0">
                  <h1 className="text-sm font-bold text-slate-900 tracking-tight truncate">SADA SIPD</h1>
                  <p className="text-[11px] text-slate-500 font-medium truncate">Penganggaran TA {tahunAnggaran}</p>
                </div>
              </div>

              {/* Tombol tutup di mobile vs collapse di desktop */}
              <button
                type="button"
                onClick={() => (mobileOpen && setMobileOpen ? setMobileOpen(false) : setCollapsed(true))}
                aria-label={mobileOpen ? 'Tutup Menu' : 'Ciutkan Sidebar'}
                className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                title={mobileOpen ? 'Tutup Menu' : 'Ciutkan Sidebar'}
              >
                {mobileOpen ? (
                  <X className="w-5 h-5 lg:hidden" aria-hidden="true" />
                ) : (
                  <PanelLeftClose className="w-5 h-5" aria-hidden="true" />
                )}
                {mobileOpen && <PanelLeftClose className="w-5 h-5 hidden lg:block" aria-hidden="true" />}
              </button>
            </>
          )}
        </div>

        {/* Navigation List */}
        <nav className={`flex-1 px-3 py-4 space-y-2 ${isCollapsedDesktop ? 'overflow-visible' : 'overflow-y-auto'}`}>
          {!isCollapsedDesktop && (
            <div className="px-3 pb-1 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
              Menu Utama
            </div>
          )}

          {/* Dashboard Item */}
          {mainMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <div key={item.id} className="relative group/tip">
                <button
                  type="button"
                  onClick={() => handleSelectTab(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  aria-label={item.label}
                  className={`relative w-full min-h-[42px] flex items-center ${isCollapsedDesktop ? 'justify-center px-0' : 'justify-between px-3.5'} py-2.5 rounded-xl text-xs transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-800 font-bold border border-indigo-200'
                      : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900 font-medium'
                  }`}
                >
                  {isActive && !isCollapsedDesktop && (
                    <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-indigo-600" aria-hidden="true" />
                  )}
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-700' : 'text-slate-500'}`} aria-hidden="true" />
                    {!isCollapsedDesktop && <span className="truncate">{item.label}</span>}
                  </div>
                  {!isCollapsedDesktop && isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0" aria-hidden="true" />
                  )}
                </button>
                <CollapsedTooltip label={item.label} show={isCollapsedDesktop} />
              </div>
            );
          })}

          {/* Penganggaran Section */}
          <div className="pt-1">
            {!isCollapsedDesktop ? (
              <button
                type="button"
                onClick={() => setPenganggaranOpen(!penganggaranOpen)}
                aria-expanded={penganggaranOpen}
                className={`w-full min-h-[42px] flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                  isPenganggaranActive && !penganggaranOpen
                    ? 'bg-indigo-50 text-indigo-800 font-bold border border-indigo-200'
                    : isPenganggaranActive
                    ? 'bg-slate-100 text-slate-900 font-semibold'
                    : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900 font-semibold'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Landmark className={`w-4 h-4 shrink-0 ${isPenganggaranActive ? 'text-indigo-600' : 'text-slate-500'}`} aria-hidden="true" />
                  <span className="truncate">Penganggaran</span>
                </div>
                <div className="text-slate-400">
                  {penganggaranOpen ? <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" /> : <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />}
                </div>
              </button>
            ) : (
              <div className="border-t border-slate-100 my-1.5" />
            )}

            {/* Sub Menu Penganggaran */}
            {(!isCollapsedDesktop && penganggaranOpen) && (
              <div className="mt-1.5 pl-3 space-y-1 border-l-2 border-slate-200/80 ml-4">
                {penganggaranSubItems.map((sub) => {
                  const SubIcon = sub.icon;
                  const isSubActive = activeTab === sub.id || (sub.id === 'skpd' && activeTab === 'subkegiatan');
                  return (
                    <button
                      type="button"
                      key={sub.id}
                      onClick={() => handleSelectTab(sub.id)}
                      aria-current={isSubActive ? 'page' : undefined}
                      className={`relative w-full min-h-[38px] flex items-center justify-between px-3 py-2 rounded-xl text-xs transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                        isSubActive
                          ? 'bg-indigo-50 text-indigo-800 font-bold border border-indigo-200'
                          : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 font-medium'
                      }`}
                    >
                      {isSubActive && (
                        <span className="absolute -left-[14px] top-2 bottom-2 w-1 rounded-r-full bg-indigo-600" aria-hidden="true" />
                      )}
                      <div className="flex items-center gap-2.5 min-w-0">
                        <SubIcon className={`w-3.5 h-3.5 shrink-0 ${isSubActive ? 'text-indigo-700' : 'text-slate-500'}`} aria-hidden="true" />
                        <span className="truncate">{sub.label}</span>
                      </div>
                      {isSubActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0" aria-hidden="true" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Shortcut icon saat sidebar collapsed */}
            {isCollapsedDesktop && (
              <div className="space-y-1.5">
                {penganggaranSubItems.map((sub) => {
                  const SubIcon = sub.icon;
                  const isSubActive = activeTab === sub.id || (sub.id === 'skpd' && activeTab === 'subkegiatan');
                  return (
                    <div key={sub.id} className="relative group/tip">
                      <button
                        type="button"
                        onClick={() => handleSelectTab(sub.id)}
                        aria-label={sub.label}
                        aria-current={isSubActive ? 'page' : undefined}
                        className={`w-full min-h-[40px] flex items-center justify-center py-2 rounded-xl transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                          isSubActive
                            ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        <SubIcon className={`w-4 h-4 ${isSubActive ? 'text-indigo-700' : 'text-slate-500'}`} aria-hidden="true" />
                      </button>
                      <CollapsedTooltip label={sub.label} show={true} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Divider Group Pengaturan */}
          <div className="pt-2">
            {!isCollapsedDesktop ? (
              <>
                <div className="px-3 pb-1.5 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                  Pengaturan Sistem
                </div>
                <button
                  type="button"
                  onClick={() => setSettingsOpen(!settingsOpen)}
                  aria-expanded={settingsOpen}
                  className={`w-full min-h-[42px] flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                    isSettingsActive && !settingsOpen
                      ? 'bg-indigo-50 text-indigo-800 font-bold border border-indigo-200'
                      : isSettingsActive
                      ? 'bg-slate-100 text-slate-900 font-semibold'
                      : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900 font-semibold'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Settings className={`w-4 h-4 shrink-0 ${isSettingsActive ? 'text-indigo-600' : 'text-slate-500'}`} aria-hidden="true" />
                    <span className="truncate">Pengaturan</span>
                  </div>
                  <div className="text-slate-400">
                    {settingsOpen ? <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" /> : <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />}
                  </div>
                </button>
              </>
            ) : (
              <div className="border-t border-slate-100 my-1.5" />
            )}

            {/* Sub Menu Items Pengaturan */}
            {(!isCollapsedDesktop && settingsOpen) && (
              <div className="mt-1.5 pl-3 space-y-1 border-l-2 border-slate-200/80 ml-4">
                {/* Sub Menu Data Master (Master SKPD, Master Akun, Sumber Dana) */}
                <div>
                  <button
                    type="button"
                    onClick={() => setDataMasterOpen(!dataMasterOpen)}
                    aria-expanded={dataMasterOpen}
                    className={`w-full min-h-[38px] flex items-center justify-between px-3 py-2 rounded-xl text-xs transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                      isDataMasterActive && !dataMasterOpen
                        ? 'bg-indigo-50 text-indigo-800 font-bold border border-indigo-200'
                        : isDataMasterActive
                        ? 'bg-slate-100 text-slate-900 font-semibold'
                        : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FolderTree
                        className={`w-3.5 h-3.5 shrink-0 ${isDataMasterActive ? 'text-indigo-700' : 'text-slate-500'}`}
                        aria-hidden="true"
                      />
                      <span className="truncate">Data Master</span>
                    </div>
                    <div className="text-slate-400">
                      {dataMasterOpen ? <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" /> : <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />}
                    </div>
                  </button>

                  {dataMasterOpen && (
                    <div className="mt-1 pl-3 space-y-1 border-l-2 border-slate-200/80 ml-3.5">
                      {dataMasterSubItems.map((sub) => {
                        const SubIcon = sub.icon;
                        const isSubActive = activeTab === sub.id;
                        return (
                          <button
                            type="button"
                            key={sub.id}
                            onClick={() => handleSelectTab(sub.id)}
                            aria-current={isSubActive ? 'page' : undefined}
                            className={`relative w-full min-h-[36px] flex items-center justify-between px-3 py-1.5 rounded-xl text-xs transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                              isSubActive
                                ? 'bg-indigo-50 text-indigo-800 font-bold border border-indigo-200'
                                : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 font-medium'
                            }`}
                          >
                            {isSubActive && (
                              <span
                                className="absolute -left-[14px] top-1.5 bottom-1.5 w-1 rounded-r-full bg-indigo-600"
                                aria-hidden="true"
                              />
                            )}
                            <div className="flex items-center gap-2.5 min-w-0">
                              <SubIcon
                                className={`w-3.5 h-3.5 shrink-0 ${isSubActive ? 'text-indigo-700' : 'text-slate-500'}`}
                                aria-hidden="true"
                              />
                              <span className="truncate">{sub.label}</span>
                            </div>
                            {isSubActive && (
                              <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-indigo-600" aria-hidden="true" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {settingsSubItems.map((sub) => {
                  const SubIcon = sub.icon;
                  const isSubActive = activeTab === sub.id;
                  return (
                    <button
                      type="button"
                      key={sub.id}
                      onClick={() => handleSelectTab(sub.id)}
                      aria-current={isSubActive ? 'page' : undefined}
                      className={`relative w-full min-h-[38px] flex items-center justify-between px-3 py-2 rounded-xl text-xs transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                        isSubActive
                          ? sub.danger
                            ? 'bg-rose-50 text-rose-800 font-bold border border-rose-200'
                            : 'bg-indigo-50 text-indigo-800 font-bold border border-indigo-200'
                          : sub.danger
                          ? 'text-rose-700 hover:bg-rose-50/70 font-medium'
                          : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 font-medium'
                      }`}
                    >
                      {isSubActive && (
                        <span
                          className={`absolute -left-[14px] top-2 bottom-2 w-1 rounded-r-full ${sub.danger ? 'bg-rose-600' : 'bg-indigo-600'}`}
                          aria-hidden="true"
                        />
                      )}
                      <div className="flex items-center gap-2.5 min-w-0">
                        <SubIcon
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isSubActive
                              ? sub.danger ? 'text-rose-700' : 'text-indigo-700'
                              : sub.danger ? 'text-rose-600' : 'text-slate-500'
                          }`}
                          aria-hidden="true"
                        />
                        <span className="truncate">{sub.label}</span>
                      </div>
                      {isSubActive && (
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${sub.danger ? 'bg-rose-600' : 'bg-indigo-600'}`} aria-hidden="true" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Icon Shortcut saat Collapsed */}
            {isCollapsedDesktop && (
              <div className="space-y-1.5">
                {[...dataMasterSubItems, ...settingsSubItems].map((sub) => {
                  const SubIcon = sub.icon;
                  const isSubActive = activeTab === sub.id;
                  return (
                    <div key={sub.id} className="relative group/tip">
                      <button
                        type="button"
                        onClick={() => handleSelectTab(sub.id)}
                        aria-label={sub.label}
                        aria-current={isSubActive ? 'page' : undefined}
                        className={`w-full min-h-[40px] flex items-center justify-center py-2 rounded-xl transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                          isSubActive
                            ? sub.danger
                              ? 'bg-rose-50 text-rose-700 font-bold border border-rose-200'
                              : 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200'
                            : sub.danger
                            ? 'text-rose-600 hover:bg-rose-50/70'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        <SubIcon
                          className={`w-4 h-4 ${
                            isSubActive
                              ? sub.danger ? 'text-rose-700' : 'text-indigo-700'
                              : sub.danger ? 'text-rose-600' : 'text-slate-500'
                          }`}
                          aria-hidden="true"
                        />
                      </button>
                      <CollapsedTooltip label={sub.label} show={true} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        {/* User Card & Logout */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/70 shrink-0">
          <div className={`flex items-center ${isCollapsedDesktop ? 'justify-center' : 'justify-between'} p-1 rounded-xl`}>
            {!isCollapsedDesktop && (
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-800 font-bold flex items-center justify-center text-xs shrink-0">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">{user?.name || 'Administrator'}</p>
                  <p className="text-[10px] text-slate-500 truncate">{user?.email || 'admin@sipd.local'}</p>
                </div>
              </div>
            )}
            <div className="relative group/tip">
              <button
                type="button"
                onClick={onLogout}
                aria-label="Keluar dari Akun"
                title="Keluar dari Akun"
                className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-50 transition cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
              >
                <LogOut className="w-4 h-4" aria-hidden="true" />
              </button>
              <CollapsedTooltip label="Keluar dari Akun" show={isCollapsedDesktop} />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
