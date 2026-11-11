import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { 
  LayoutDashboard, 
  AlertTriangle,
  Building2, 
  Bus, 
  UserCheck, 
  Coins,
  GraduationCap,
  Settings,
  ChevronsLeft, 
  Plus, 
  X
} from 'lucide-react';

export type AdminTab = 'overview' | 'alerts' | 'terminals' | 'fleet' | 'drivers' | 'users' | 'fare' | 'settings';

interface AdminSidebarProps {
  currentTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  onSwitchRole: (role: UserRole) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  activeAlertCount?: number;
  totalJeepneys?: number;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentTab,
  onTabChange,
  onSwitchRole,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  activeAlertCount = 0,
  totalJeepneys = 8,
}) => {
  const { drivers, commuters } = useAuth();

  const handleSelectTab = (tab: AdminTab) => {
    onTabChange(tab);
    if (isMobileOpen) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container: Deep dark matte background matching SearchAtlas screenshot */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-[#141416] border-r border-[#262629] text-zinc-300 transition-all duration-300 ease-in-out select-none shadow-2xl ${
          isCollapsed ? 'w-[72px] px-2.5 py-3.5' : 'w-[268px] px-3.5 py-3.5'
        } ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* =========================================================================
            TOP HEADER / BRAND PILL CARD (Matching Screenshot)
            ========================================================================= */}
        {isCollapsed ? (
          /* Collapsed Top: Square Logo Card */
          <div className="flex flex-col items-center mb-4">
            <button
              onClick={onToggleCollapse}
              className="w-12 h-12 rounded-2xl bg-[#222225] border border-[#2e2e32] flex items-center justify-center shadow-md hover:border-emerald-500/40 hover:bg-[#27272b] transition-all group p-1.5 cursor-pointer"
              title="Expand Sidebar"
            >
              <div className="w-8 h-8 rounded-lg bg-white border border-white p-1 flex items-center justify-center shadow-xs">
                <img 
                  src="/logo.png" 
                  alt="JeepTrack Muntinlupa" 
                  className="w-full h-full object-contain drop-shadow-xs group-hover:scale-105 transition-transform" 
                />
              </div>
            </button>
          </div>
        ) : (
          /* Expanded Top: Rounded Pill Card with Logo, Brand Text, and Collapse Chevron */
          <div className="bg-[#222225] border border-[#2e2e32] rounded-2xl p-2.5 mb-3 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-white border border-white p-1 flex items-center justify-center shrink-0 shadow-xs">
                <img 
                  src="/logo.png" 
                  alt="JeepTrack Muntinlupa" 
                  className="w-full h-full object-contain filter drop-shadow-xs" 
                />
              </div>

              <div className="truncate leading-tight">
                <div className="font-extrabold text-white text-xs tracking-tight truncate flex items-center gap-1">
                  <span>JeepTrack</span> <span className="text-[#00B14F] font-semibold">Muntinlupa</span>
                </div>
                <div className="text-[10px] text-zinc-400 font-medium truncate">
                  Smart Jeepney Tracking System
                </div>
              </div>
            </div>

            {/* Collapse Button (<< icon in screenshot) */}
            <div className="flex items-center gap-1">
              <button
                onClick={onToggleCollapse}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors hidden lg:flex items-center justify-center cursor-pointer"
                title="Collapse Sidebar"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>

              <button
                onClick={onCloseMobile}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors lg:hidden flex items-center justify-center cursor-pointer"
                aria-label="Close sidebar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            NAVIGATION TREE (Original Buttons & Functions in Sleek Modern Layout)
            ========================================================================= */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-0.5 custom-scrollbar">
          
          {/* -------------------- SECTION 1: MAIN OPERATIONS -------------------- */}
          <div className="space-y-0.5">
            {!isCollapsed && (
              <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider px-2.5 py-1">
                Main
              </div>
            )}

            {/* 1. Command Center / Overview Tab */}
            <button
              onClick={() => handleSelectTab('overview')}
              title={isCollapsed ? "Live Telemetry Map" : undefined}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'} rounded-xl text-xs font-semibold transition-all group ${
                currentTab === 'overview'
                  ? 'text-white font-bold bg-[#26262a] border border-zinc-700/70 shadow-xs'
                  : 'text-zinc-400 hover:text-white hover:bg-[#202024]'
              }`}
            >
              <LayoutDashboard className={`w-4 h-4 shrink-0 transition-colors ${
                currentTab === 'overview' ? 'text-white' : 'text-zinc-400 group-hover:text-white'
              }`} />
              {!isCollapsed && (
                <div className="flex-1 text-left flex items-center justify-between">
                  <span>Live Telemetry Map</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded border font-bold bg-emerald-950/80 text-emerald-300 border-emerald-800/80">
                    Live
                  </span>
                </div>
              )}
            </button>

            {/* 2. Emergency SOS & Alerts Tab */}
            <button
              onClick={() => handleSelectTab('alerts')}
              title={isCollapsed ? `Emergency SOS & Alerts (${activeAlertCount})` : undefined}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'} rounded-xl text-xs font-semibold transition-all group ${
                currentTab === 'alerts'
                  ? 'text-white font-bold bg-[#26262a] border border-zinc-700/70 shadow-xs'
                  : (activeAlertCount || 0) > 0
                  ? 'text-rose-400 hover:text-white hover:bg-rose-950/40 bg-rose-950/20 border border-rose-800/40'
                  : 'text-zinc-400 hover:text-white hover:bg-[#202024]'
              }`}
            >
              <div className="relative shrink-0 flex items-center justify-center">
                <AlertTriangle className={`w-4 h-4 transition-colors ${
                  currentTab === 'alerts' 
                    ? 'text-rose-400' 
                    : (activeAlertCount || 0) > 0 
                    ? 'text-rose-400 animate-pulse' 
                    : 'text-zinc-400 group-hover:text-white'
                }`} />
                {isCollapsed && (activeAlertCount || 0) > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-[#141416] animate-pulse" />
                )}
              </div>
              {!isCollapsed && (
                <div className="flex-1 text-left flex items-center justify-between min-w-0">
                  <span className="truncate">Emergency SOS</span>
                  {(activeAlertCount || 0) > 0 ? (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded border font-bold bg-rose-950/80 text-rose-300 border-rose-800/80 animate-pulse shrink-0">
                      {activeAlertCount} SOS
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-zinc-500">
                      0
                    </span>
                  )}
                </div>
              )}
            </button>

            {/* 3. Terminals Tab */}
            <button
              onClick={() => handleSelectTab('terminals')}
              title={isCollapsed ? "Terminals" : undefined}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'} rounded-xl text-xs font-semibold transition-all group ${
                currentTab === 'terminals'
                  ? 'text-white font-bold bg-[#26262a] border border-zinc-700/70 shadow-xs'
                  : 'text-zinc-400 hover:text-white hover:bg-[#202024]'
              }`}
            >
              <Building2 className={`w-4 h-4 shrink-0 transition-colors ${
                currentTab === 'terminals' ? 'text-white' : 'text-zinc-400 group-hover:text-white'
              }`} />
              {!isCollapsed && (
                <div className="flex-1 text-left flex items-center justify-between">
                  <span>Terminals & Bays</span>
                  <span className="text-[10px] text-zinc-500 font-mono">2 Hubs</span>
                </div>
              )}
            </button>

            {/* 3. Jeepney Units Tab */}
            <button
              onClick={() => handleSelectTab('fleet')}
              title={isCollapsed ? "Jeepney Fleet" : undefined}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'} rounded-xl text-xs font-semibold transition-all group ${
                currentTab === 'fleet'
                  ? 'text-white font-bold bg-[#26262a] border border-zinc-700/70 shadow-xs'
                  : 'text-zinc-400 hover:text-white hover:bg-[#202024]'
              }`}
            >
              <Bus className={`w-4 h-4 shrink-0 transition-colors ${
                currentTab === 'fleet' ? 'text-white' : 'text-zinc-400 group-hover:text-white'
              }`} />
              {!isCollapsed && (
                <div className="flex-1 text-left flex items-center justify-between">
                  <span>Jeepney Fleet</span>
                  <span className="text-[10px] text-zinc-500 font-mono">{totalJeepneys} Units</span>
                </div>
              )}
            </button>

            {/* 4. Driver Accounts Tab */}
            <button
              onClick={() => handleSelectTab('drivers')}
              title={isCollapsed ? `Drivers (${drivers.length})` : undefined}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'} rounded-xl text-xs font-semibold transition-all group ${
                currentTab === 'drivers'
                  ? 'text-white font-bold bg-[#26262a] border border-zinc-700/70 shadow-xs'
                  : 'text-zinc-400 hover:text-white hover:bg-[#202024]'
              }`}
            >
              <UserCheck className={`w-4 h-4 shrink-0 transition-colors ${
                currentTab === 'drivers' ? 'text-white' : 'text-zinc-400 group-hover:text-white'
              }`} />
              {!isCollapsed && (
                <div className="flex-1 text-left flex items-center justify-between">
                  <span>Driver Accounts</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded border font-medium bg-zinc-800 text-zinc-300 border-zinc-700">
                    {drivers.length}
                  </span>
                </div>
              )}
            </button>

            {/* 5. Registered Commuters Tab (Students, Faculty, Staff) */}
            <button
              onClick={() => handleSelectTab('users')}
              title={isCollapsed ? `PLMun Commuters (${commuters.length})` : undefined}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'} rounded-xl text-xs font-semibold transition-all group ${
                currentTab === 'users'
                  ? 'text-white font-bold bg-[#26262a] border border-zinc-700/70 shadow-xs'
                  : 'text-zinc-400 hover:text-white hover:bg-[#202024]'
              }`}
            >
              <GraduationCap className={`w-4 h-4 shrink-0 transition-colors ${
                currentTab === 'users' ? 'text-emerald-400' : 'text-zinc-400 group-hover:text-emerald-400'
              }`} />
              {!isCollapsed && (
                <div className="flex-1 text-left flex items-center justify-between min-w-0">
                  <span className="truncate">PLMun Commuters</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded border font-medium bg-zinc-800 text-zinc-300 border-zinc-700">
                    {commuters.length}
                  </span>
                </div>
              )}
            </button>

            {/* 6. Jeepney Fare Tab */}
            <button
              onClick={() => handleSelectTab('fare')}
              title={isCollapsed ? "Fare Matrix & Rates" : undefined}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'} rounded-xl text-xs font-semibold transition-all group ${
                currentTab === 'fare'
                  ? 'text-white font-bold bg-[#26262a] border border-zinc-700/70 shadow-xs'
                  : 'text-zinc-400 hover:text-white hover:bg-[#202024]'
              }`}
            >
              <div className="w-4 h-4 flex items-center justify-center font-bold text-xs shrink-0 transition-colors">
                <span className={currentTab === 'fare' ? 'text-emerald-400' : 'text-zinc-400 group-hover:text-emerald-400'}>
                  ₱
                </span>
              </div>
              {!isCollapsed && (
                <div className="flex-1 text-left flex items-center justify-between">
                  <span>Fare Matrix</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded border font-bold bg-emerald-950/60 text-emerald-300 border-emerald-800/60">
                    Rates
                  </span>
                </div>
              )}
            </button>

            {/* 7. System Settings Tab */}
            <button
              onClick={() => handleSelectTab('settings')}
              title={isCollapsed ? "System Settings" : undefined}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'} rounded-xl text-xs font-semibold transition-all group ${
                currentTab === 'settings'
                  ? 'text-white font-bold bg-[#26262a] border border-zinc-700/70 shadow-xs'
                  : 'text-zinc-400 hover:text-white hover:bg-[#202024]'
              }`}
            >
              <Settings className={`w-4 h-4 shrink-0 transition-colors ${
                currentTab === 'settings' ? 'text-blue-400' : 'text-zinc-400 group-hover:text-blue-400'
              }`} />
              {!isCollapsed && (
                <div className="flex-1 text-left flex items-center justify-between">
                  <span>System Settings</span>
                </div>
              )}
            </button>
          </div>
        </div>

        {/* =========================================================================
            BOTTOM CALL-TO-ACTION CARD & UNIFORM BUTTON
            ========================================================================= */}
        <div className="pt-3 shrink-0">
          {isCollapsed ? (
            /* Collapsed Bottom Button */
            <button
              onClick={() => handleSelectTab('drivers')}
              className="w-11 h-11 rounded-2xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/80 text-zinc-200 hover:text-white flex items-center justify-center font-bold text-xl shadow-md active:scale-95 transition-all mx-auto cursor-pointer"
              title="Provision Driver Account +"
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </button>
          ) : (
            /* Expanded Bottom Card */
            <div className="bg-[#1c1c20] border border-[#2b2b30] rounded-2xl p-3.5 space-y-3 shadow-md">
              {/* Top Graphic / Decorative Icon */}
              <div className="flex items-center gap-1.5 text-zinc-500">
                <div className="w-4 h-4 flex items-center justify-center">
                  <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </div>
              </div>

              {/* Informational Text */}
              <p className="text-[11px] text-zinc-400 leading-snug">
                Provision new driver console credentials or broadcast corridor alerts
              </p>

              {/* Plain Uniform Action Button */}
              <button
                onClick={() => handleSelectTab('drivers')}
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-700/80 text-xs font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-xs active:scale-[0.98] transition-all cursor-pointer"
              >
                <span>Provision driver</span>
                <Plus className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
