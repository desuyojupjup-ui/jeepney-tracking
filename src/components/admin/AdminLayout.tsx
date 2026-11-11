import React, { useState } from 'react';
import { AdminSidebar, AdminTab } from './AdminSidebar';
import { AdminTopbar } from './AdminTopbar';
import { UserRole, OperationalAlert } from '../../types';

interface AdminLayoutProps {
  currentTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  onSwitchRole: (role: UserRole) => void;
  alerts: OperationalAlert[];
  totalJeepneys?: number;
  onRequestSignOut?: () => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentTab,
  onTabChange,
  onSwitchRole,
  alerts,
  totalJeepneys = 8,
  onRequestSignOut,
  children,
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);

  const activeAlertCount = alerts.filter(a => a.status === 'active').length;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#0B132B] text-slate-900 dark:text-slate-100 flex font-sans antialiased transition-colors duration-200">
      
      {/* Left Sidebar */}
      <AdminSidebar
        currentTab={currentTab}
        onTabChange={onTabChange}
        onSwitchRole={onSwitchRole}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
        activeAlertCount={activeAlertCount}
        totalJeepneys={totalJeepneys}
      />

      {/* Main Content Area (offset by left sidebar) */}
      <div 
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'lg:pl-[72px]' : 'lg:pl-[268px]'
        }`}
      >
        {/* Topbar */}
        <AdminTopbar
          currentTab={currentTab}
          onTabChange={onTabChange}
          onSwitchRole={onSwitchRole}
          onOpenMobileSidebar={() => setIsMobileOpen(true)}
          alerts={alerts}
          onRequestSignOut={onRequestSignOut}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 pb-12">
          {children}
        </main>

        {/* Admin Footer */}
        <footer className="bg-white/90 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800/80 py-4 px-4 sm:px-6 lg:px-8 text-xs text-slate-500 transition-colors">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>
                <strong>PLMun–Alabang Franchise Telemetry Hub</strong> &bull; Muntinlupa Transport Management Division
              </span>
            </div>
            <div className="text-[11px] font-mono text-slate-400">
              Encrypted Dispatch Protocol &bull; GPS Corridor Geofence Active
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};
