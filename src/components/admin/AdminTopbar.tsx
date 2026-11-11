import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole, OperationalAlert } from '../../types';
import { AdminTab } from './AdminSidebar';
import { ThemeToggle } from '../common/ThemeToggle';
import { 
  Menu, 
  Bell, 
  Radio, 
  Clock, 
  MapPin, 
  Smartphone, 
  LogOut, 
  ChevronDown, 
  AlertTriangle,
  CheckCircle2,
  Activity,
  X
} from 'lucide-react';

interface AdminTopbarProps {
  currentTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  onSwitchRole: (role: UserRole) => void;
  onOpenMobileSidebar: () => void;
  alerts: OperationalAlert[];
  onRequestSignOut?: () => void;
}

export const AdminTopbar: React.FC<AdminTopbarProps> = ({
  currentTab,
  onTabChange,
  onSwitchRole,
  onOpenMobileSidebar,
  alerts,
  onRequestSignOut,
}) => {
  const { currentOperator, logoutOperator } = useAuth();
  const [currentTime, setCurrentTime] = useState<string>('');
  const [showAlertsDropdown, setShowAlertsDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const alertsDropdownRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  const activeAlerts = alerts.filter(a => a.status === 'active');

  // Real-time Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-PH', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
          timeZone: 'Asia/Manila',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (alertsDropdownRef.current && !alertsDropdownRef.current.contains(e.target as Node)) {
        setShowAlertsDropdown(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target as Node)) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Tab Titles map
  const tabTitles: Record<AdminTab, { title: string; subtitle: string; category: string }> = {
    overview: { 
      category: 'Command Center', 
      title: 'Real-Time Telemetry & GPS Map', 
      subtitle: 'Corridor: PLMun Main Terminal ⇄ Alabang South Station via Manila South Road' 
    },
    alerts: {
      category: 'Safety & Dispatch',
      title: 'Emergency SOS & Operational Alerts',
      subtitle: 'Real-time in-cab panic reports, corridor incidents, and emergency broadcasts'
    },
    terminals: { 
      category: 'Terminal Hubs', 
      title: 'Terminals & Bay Occupancy', 
      subtitle: 'Automated 150m & 180m geofence radius boundary detection' 
    },
    fleet: { 
      category: 'Fleet Management', 
      title: 'PUJ Fleet Registry', 
      subtitle: 'Accredited Modern PUJs & Traditional Euro-4 Units' 
    },
    drivers: { 
      category: 'Driver Management', 
      title: 'Driver Accounts & Provisioning', 
      subtitle: 'Control Center issued credentials for In-Cab Mobile Console' 
    },
    users: {
      category: 'Commuter Management',
      title: 'PLMun Registered Users (Students, Instructors, Staff)',
      subtitle: 'Directory of verified institutional transit accounts, IDs, and discount verifications'
    },
    fare: {
      category: 'Tariff & Regulations',
      title: 'Jeepney Fare Matrix & Rates',
      subtitle: 'Adjust official LTFRB regular & discounted fare rates across the corridor'
    },
    settings: {
      category: 'System Configuration',
      title: 'System Settings & Operational Parameters',
      subtitle: 'Configure geofence radius, alarm notifications, operating hours, and backups'
    },
  };

  const currentMeta = tabTitles[currentTab] || tabTitles.overview;

  return (
    <header className="sticky top-0 z-[1000] h-16 bg-white/95 dark:bg-[#141416]/95 backdrop-blur-xl border-b border-zinc-200/80 dark:border-[#262629] text-zinc-800 dark:text-zinc-100 flex items-center justify-between px-4 sm:px-6 lg:px-8 transition-colors shadow-xs">
      
      {/* Left: Mobile Sidebar Toggle & Refined Breadcrumb Page Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenMobileSidebar}
          className="p-2 rounded-xl text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-[#202023] lg:hidden transition-colors shrink-0"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="truncate">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-zinc-500 dark:text-zinc-400 hidden sm:inline">
              Control Center
            </span>
            <span className="text-zinc-400 dark:text-zinc-600 hidden sm:inline">/</span>
            <span className="text-zinc-500 dark:text-zinc-400 hidden md:inline">
              {currentMeta.category}
            </span>
            <span className="text-zinc-400 dark:text-zinc-600 hidden md:inline">/</span>
            <h1 className="text-xs sm:text-sm font-extrabold text-zinc-900 dark:text-white tracking-tight truncate">
              {currentMeta.title}
            </h1>
          </div>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium hidden lg:block truncate mt-0.5">
            {currentMeta.subtitle}
          </p>
        </div>
      </div>

      {/* Right: Clean, Premium Utility Bar */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        
        {/* Live Corridor GPS Radar Pill */}
        <div className="hidden xl:flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-zinc-100/90 dark:bg-[#1f1f23] border border-zinc-200/80 dark:border-[#2b2b30] text-xs shadow-2xs">
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>GPS Mesh Live</span>
          </div>
          <span className="text-zinc-300 dark:text-zinc-700">|</span>
          <div className="flex items-center gap-1.5 font-mono text-zinc-600 dark:text-zinc-300 text-[11px] font-medium">
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
            <span>{currentTime || '12:00:00 PM'} PST</span>
          </div>
        </div>

        {/* Theme Toggle Button */}
        <ThemeToggle />

        {/* Alerts Notification Bell Dropdown */}
        <div className="relative" ref={alertsDropdownRef}>
          <button
            onClick={() => setShowAlertsDropdown(!showAlertsDropdown)}
            className="relative w-9 h-9 rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 hover:bg-zinc-200 dark:bg-[#1f1f23] dark:hover:bg-[#27272b] border border-zinc-200/80 dark:border-[#2b2b30] flex items-center justify-center transition-all"
            title="Active Incident Alerts"
          >
            <Bell className="w-4 h-4" />
            {activeAlerts.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#FF5722] text-white text-[10px] font-black flex items-center justify-center shadow-xs animate-pulse">
                {activeAlerts.length}
              </span>
            )}
          </button>

          {/* Alerts Dropdown Panel */}
          {showAlertsDropdown && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-[#1a1a1d] border border-zinc-200 dark:border-[#2c2c30] rounded-2xl shadow-2xl p-4 z-50 animate-fade-in space-y-3 text-zinc-800 dark:text-zinc-100">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span className="font-extrabold text-zinc-900 dark:text-white text-xs">Active Route Incidents</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-900 font-bold">
                  {activeAlerts.length} Active
                </span>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {activeAlerts.length === 0 ? (
                  <div className="text-center py-6 text-zinc-400 text-xs">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
                    <span className="font-medium">All corridors operating normally without incidents.</span>
                  </div>
                ) : (
                  activeAlerts.map((alert) => (
                    <div 
                      key={alert.id}
                      className="p-2.5 rounded-xl bg-zinc-50 dark:bg-[#141416] border border-zinc-200 dark:border-zinc-800 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-teal-600 dark:text-teal-400 font-mono">{alert.jeepneyCode}</span>
                        <span className="text-[10px] font-mono text-zinc-500">{alert.createdAt} PST</span>
                      </div>
                      <p className="text-zinc-700 dark:text-zinc-300 font-medium text-[11px]">{alert.message}</p>
                      <div className="text-[10px] text-zinc-500">Driver: {alert.driverName}</div>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center text-xs">
                <button
                  onClick={() => {
                    onTabChange('alerts');
                    setShowAlertsDropdown(false);
                  }}
                  className="text-[#FF5722] hover:underline font-bold"
                >
                  Emergency SOS Page &rarr;
                </button>
                <button
                  onClick={() => setShowAlertsDropdown(false)}
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Operator Profile Dropdown Pill */}
        <div className="relative" ref={profileDropdownRef}>
          <button
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-[#1f1f23] dark:hover:bg-[#27272b] border border-zinc-200/80 dark:border-[#2b2b30] text-xs transition-all shadow-2xs"
            title="Operator Account"
          >
            {/* Dual-tone Orange Avatar */}
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#FF5722] to-amber-500 text-white font-black flex items-center justify-center text-[10px] shadow-xs shrink-0">
              {currentOperator ? currentOperator.name.split(' ').map(n => n[0]).slice(0, 2).join('') : 'OP'}
            </div>

            <div className="text-left hidden sm:block leading-tight">
              <div className="font-extrabold text-zinc-900 dark:text-white truncate max-w-[110px] text-xs">
                {currentOperator ? currentOperator.name.split('(')[0].trim() : 'Operator'}
              </div>
              <div className="text-[10px] text-zinc-500 font-mono">
                {currentOperator?.badgeNumber || 'MNT-CMD-001'}
              </div>
            </div>

            <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
          </button>

          {/* Profile Dropdown Menu */}
          {showProfileDropdown && (
            <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-[#1a1a1d] border border-zinc-200 dark:border-[#2c2c30] rounded-2xl shadow-2xl p-3 z-50 animate-fade-in space-y-2 text-zinc-800 dark:text-zinc-100">
              <div className="px-2 py-1.5 border-b border-zinc-100 dark:border-zinc-800">
                <div className="font-extrabold text-zinc-900 dark:text-white text-xs">{currentOperator?.name}</div>
                <div className="text-[11px] text-zinc-500 font-mono mt-0.5">{currentOperator?.email}</div>
                <span className="inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-[#2a1d16] text-[#FF5722] border border-[#FF5722]/30 font-mono">
                  {currentOperator?.role === 'admin' ? 'Lead Dispatcher' : 'Terminal Controller'}
                </span>
              </div>

              <div className="space-y-1">
                <button
                  onClick={() => {
                    onSwitchRole('commuter');
                    setShowProfileDropdown(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2 font-medium"
                >
                  <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Public Commuter Live Map</span>
                </button>

                <button
                  onClick={() => {
                    onSwitchRole('driver');
                    setShowProfileDropdown(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2 font-medium"
                >
                  <Smartphone className="w-3.5 h-3.5 text-blue-500" />
                  <span>Driver In-Cab Console</span>
                </button>
              </div>

              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  onClick={() => {
                    setShowProfileDropdown(false);
                    if (onRequestSignOut) {
                      onRequestSignOut();
                    } else {
                      logoutOperator();
                      onSwitchRole('landing');
                    }
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center gap-2"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out of Control Center</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
