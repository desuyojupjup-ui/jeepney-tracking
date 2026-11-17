import React, { useState, useEffect, useRef } from 'react';
import { UserRole } from './types';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { TransitProvider, useTransit } from './context/TransitContext';
import { TopNavbar } from './components/navigation/TopNavbar';
import { CommuterView } from './pages/CommuterView';
import { DriverConsoleView } from './pages/DriverConsoleView';
import { OperatorDashboardView } from './pages/OperatorDashboardView';
import { FleetManagementView } from './pages/FleetManagementView';
import { TerminalMonitoringView } from './pages/TerminalMonitoringView';
import { OperationalAlertsView } from './pages/OperationalAlertsView';
import { PassengerAnalyticsView } from './pages/PassengerAnalyticsView';
import { FareManagementView } from './pages/FareManagementView';
import { RegisteredUsersView } from './pages/RegisteredUsersView';
import { SystemSettingsView } from './pages/SystemSettingsView';
import { ControlCenterLogin } from './components/auth/ControlCenterLogin';
import { DriverLogin } from './components/auth/DriverLogin';
import { CommuterAuthView } from './components/auth/CommuterAuthView';
import { LandingPageView } from './pages/LandingPageView';
import { CommuterProfileModal } from './components/commuter/CommuterProfileModal';
import { UnifiedAuthModal } from './components/auth/UnifiedAuthModal';
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminTab } from './components/admin/AdminSidebar';
import { EmergencyAlertModal } from './components/common/EmergencyAlertModal';
import { SignOutConfirmModal } from './components/common/SignOutConfirmModal';

function AppContent() {
  const { 
    isOperatorAuthenticated, 
    isDriverAuthenticated, 
    isCommuterAuthenticated,
    currentDriver,
    currentCommuter,
    currentOperator,
    drivers,
    logoutOperator,
    logoutDriver,
    logoutCommuter,
  } = useAuth();

  // Determine initial role based on saved active role or active authenticated session
  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    try {
      const savedRole = localStorage.getItem('jeeptrack_active_role') as UserRole | null;
      const hasOperatorSession = !!localStorage.getItem('jeeptrack_operator_session');
      const hasDriverSession = !!localStorage.getItem('jeeptrack_driver_session');
      const hasCommuterSession = !!localStorage.getItem('jeeptrack_commuter_session');

      if (savedRole) {
        if ((savedRole === 'operator' || savedRole === 'admin') && hasOperatorSession) return savedRole;
        if (savedRole === 'driver' && hasDriverSession) return 'driver';
        if (savedRole === 'commuter' && hasCommuterSession) return 'commuter';
        if (savedRole === 'landing' && !hasOperatorSession && !hasDriverSession) return 'landing';
      }

      if (hasOperatorSession) return 'operator';
      if (hasDriverSession) return 'driver';
      if (hasCommuterSession) return 'commuter';
    } catch (e) {
      console.error('Failed to parse active role from localStorage:', e);
    }
    return 'landing';
  });

  const [adminTab, setAdminTab] = useState<AdminTab>(() => {
    try {
      const saved = localStorage.getItem('jeeptrack_admin_tab') as AdminTab | null;
      if (saved) return saved;
    } catch (e) {}
    return 'overview';
  });

  const [isGuestCommuter, setIsGuestCommuter] = useState<boolean>(false);
  const [showCommuterProfileModal, setShowCommuterProfileModal] = useState<boolean>(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState<boolean>(false);
  const [unifiedAuthModalOpen, setUnifiedAuthModalOpen] = useState<boolean>(false);
  const [unifiedAuthInitialRole, setUnifiedAuthInitialRole] = useState<'commuter' | 'driver' | 'operator'>('commuter');

  const { showToast } = useToast();

  // Persist currentRole in localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('jeeptrack_active_role', currentRole);
    } catch (e) {}
  }, [currentRole]);

  // Persist adminTab in localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('jeeptrack_admin_tab', adminTab);
    } catch (e) {}
  }, [adminTab]);

  const handleConfirmSignOut = () => {
    let userName = 'User';
    let roleLabel = 'Signed out';

    if (isOperatorAuthenticated && currentOperator && (currentRole === 'operator' || currentRole === 'admin')) {
      userName = currentOperator.name;
      roleLabel = 'Control Center Operator';
      logoutOperator();
    } else if (isDriverAuthenticated && currentDriver && currentRole === 'driver') {
      userName = currentDriver.fullName;
      roleLabel = 'PUJ Driver';

      // Set the driver's assigned jeepney offline immediately when signing out
      const driverJeepney =
        (currentDriver.assignedJeepneyId && jeepneys.find((j) => j.id === currentDriver.assignedJeepneyId)) ||
        jeepneys.find((j) => j.assignedDriverId === currentDriver.id) ||
        jeepneys.find((j) => j.driverName?.toLowerCase() === currentDriver.fullName.toLowerCase()) ||
        (jeepneys.length === 1 ? jeepneys[0] : undefined);

      if (driverJeepney) {
        updateJeepney(driverJeepney.id, {
          status: 'offline',
          speedKmh: 0,
          currentPassengers: 0,
          etaMinutes: 0,
          distanceRemainingKm: 0,
          lastGpsUpdate: 'Offline',
        });
      }
      logoutDriver();
    } else if (isCommuterAuthenticated && currentCommuter && currentRole === 'commuter') {
      userName = currentCommuter.fullName;
      roleLabel = 'Commuter';
      logoutCommuter();
    } else {
      // Fallback: if signing out from another screen, ensure any active driver vehicle goes offline
      if (currentDriver) {
        const driverJeepney =
          (currentDriver.assignedJeepneyId && jeepneys.find((j) => j.id === currentDriver.assignedJeepneyId)) ||
          jeepneys.find((j) => j.assignedDriverId === currentDriver.id) ||
          jeepneys.find((j) => j.driverName?.toLowerCase() === currentDriver.fullName.toLowerCase()) ||
          (jeepneys.length === 1 ? jeepneys[0] : undefined);

        if (driverJeepney) {
          updateJeepney(driverJeepney.id, {
            status: 'offline',
            speedKmh: 0,
            currentPassengers: 0,
            etaMinutes: 0,
            distanceRemainingKm: 0,
            lastGpsUpdate: 'Offline',
          });
        }
      }
      logoutOperator();
      logoutDriver();
      logoutCommuter();
    }

    try {
      localStorage.removeItem('jeeptrack_active_role');
      localStorage.removeItem('jeeptrack_admin_tab');
    } catch (e) {}

    setIsGuestCommuter(false);
    setCurrentRole('landing');
    setShowSignOutConfirm(false);
    setShowCommuterProfileModal(false);

    showToast({
      type: 'logout',
      title: 'Signed Out Successfully',
      message: `Goodbye, ${userName}. Your active ${roleLabel} session has been securely closed.`,
      duration: 4000,
    });
  };

  // Whenever any authenticated user signs in or out, update the active role appropriately
  const prevAuthRef = useRef({
    commuter: isCommuterAuthenticated,
    driver: isDriverAuthenticated,
    operator: isOperatorAuthenticated,
  });

  useEffect(() => {
    const prev = prevAuthRef.current;

    // User newly signed in as operator
    if (!prev.operator && isOperatorAuthenticated) {
      setCurrentRole('operator');
    }
    // User newly signed in as driver
    else if (!prev.driver && isDriverAuthenticated) {
      setCurrentRole('driver');
    }
    // User newly signed in as commuter (do not hijack if operator is actively in Admin Portal)
    else if (!prev.commuter && isCommuterAuthenticated && !isOperatorAuthenticated) {
      setCurrentRole('commuter');
    }
    // Any user signed out
    else if (
      (prev.commuter && !isCommuterAuthenticated) ||
      (prev.driver && !isDriverAuthenticated) ||
      (prev.operator && !isOperatorAuthenticated)
    ) {
      setCurrentRole('landing');
      setIsGuestCommuter(false);
      try {
        localStorage.removeItem('jeeptrack_active_role');
      } catch (e) {}
    }

    prevAuthRef.current = {
      commuter: isCommuterAuthenticated,
      driver: isDriverAuthenticated,
      operator: isOperatorAuthenticated,
    };
  }, [isCommuterAuthenticated, isDriverAuthenticated, isOperatorAuthenticated]);
  
  // Real-time Transit System State & Actions
  const {
    jeepneys,
    terminals,
    stops,
    route,
    alerts,
    geofenceEvents,
    trips,
    kpis,
    hourlyData,
    updateJeepney,
    acknowledgeAlert,
    resolveAlert,
  } = useTransit();

  // Automatically keep logged-in drivers online on their assigned jeepney,
  // and turn jeepneys offline when their assigned driver logs out / goes off_duty
  useEffect(() => {
    if (jeepneys.length === 0) return;

    // 1. If a driver is currently logged in on this session and on_duty, ensure their unit is linked and online
    if (currentDriver && currentDriver.status === 'on_duty' && currentDriver.accountStatus !== 'suspended') {
      const matchedJeepney =
        (currentDriver.assignedJeepneyId && jeepneys.find((j) => j.id === currentDriver.assignedJeepneyId)) ||
        jeepneys.find((j) => j.assignedDriverId === currentDriver.id) ||
        jeepneys.find((j) => j.driverName?.toLowerCase() === currentDriver.fullName.toLowerCase()) ||
        (jeepneys.length === 1 ? jeepneys[0] : undefined);

      if (matchedJeepney) {
        const needsOnline = matchedJeepney.status === 'offline';
        const needsDriverLink =
          matchedJeepney.driverName !== currentDriver.fullName ||
          matchedJeepney.assignedDriverId !== currentDriver.id;

        if (needsOnline || needsDriverLink) {
          updateJeepney(matchedJeepney.id, {
            status: needsOnline ? 'at_terminal' : matchedJeepney.status,
            driverName: currentDriver.fullName,
            assignedDriverId: currentDriver.id,
            lastGpsUpdate: needsOnline ? 'Just now' : matchedJeepney.lastGpsUpdate,
          });
        }
      }
      return;
    }

    // 2. If NO driver is logged in, ensure any jeepney whose assigned driver is off_duty or on_break is marked offline
    if (!currentDriver) {
      jeepneys.forEach((j) => {
        if (j.status === 'offline') return;
        const assignedDrv = drivers.find(
          (d) =>
            d.id === j.assignedDriverId ||
            d.assignedJeepneyId === j.id ||
            (j.driverName && d.fullName.toLowerCase() === j.driverName.toLowerCase())
        );
        if (!assignedDrv || assignedDrv.status !== 'on_duty' || assignedDrv.accountStatus === 'suspended') {
          updateJeepney(j.id, {
            status: 'offline',
            speedKmh: 0,
            etaMinutes: 0,
            distanceRemainingKm: 0,
            lastGpsUpdate: 'Offline',
          });
        }
      });
    }
  }, [drivers, currentDriver, jeepneys, updateJeepney]);

  // Determine active jeepney assigned to current driver
  const assignedJeepney = (currentDriver?.assignedJeepneyId && jeepneys.find(j => j.id === currentDriver.assignedJeepneyId))
    || jeepneys.find(j => j.driverName?.toLowerCase() === currentDriver?.fullName?.toLowerCase())
    || jeepneys[1]
    || jeepneys[0];

  const activeAlertCount = alerts.filter(a => a.status === 'active').length;

  return (
    <>
      {/* Universal Emergency SOS / Incident Alert Popup Banner */}
      <EmergencyAlertModal />

      {/* Modern & Premium Sign Out Confirmation Alert Modal */}
      <SignOutConfirmModal
        isOpen={showSignOutConfirm}
        onClose={() => setShowSignOutConfirm(false)}
        onConfirm={handleConfirmSignOut}
      />

      {/* Official PLMun Digital Transit ID Pass Modal */}
      <CommuterProfileModal
        isOpen={showCommuterProfileModal}
        onClose={() => setShowCommuterProfileModal(false)}
        onRequestSignOut={() => {
          setShowCommuterProfileModal(false);
          setShowSignOutConfirm(true);
        }}
        onLogout={() => {
          setShowCommuterProfileModal(false);
          setShowSignOutConfirm(true);
        }}
      />

      {/* Unified 1-Card Authentication Portal for Students, Drivers, and Control Center */}
      <UnifiedAuthModal
        isOpen={unifiedAuthModalOpen}
        onClose={() => setUnifiedAuthModalOpen(false)}
        initialRole={unifiedAuthInitialRole}
        onLoginSuccess={(role) => {
          setCurrentRole(role);
          setUnifiedAuthModalOpen(false);
        }}
      />

      {/* -------------------------------------------------------------
          DEDICATED ADMIN PORTAL LAYOUT (Sidebar Left + Topbar)
          When logged in as Control Center Operator / Admin
          ------------------------------------------------------------- */}
      {(currentRole === 'operator' || currentRole === 'admin') && isOperatorAuthenticated ? (
        <AdminLayout
          currentTab={adminTab}
          onTabChange={setAdminTab}
          onSwitchRole={setCurrentRole}
          alerts={alerts}
          totalJeepneys={jeepneys.length}
          onRequestSignOut={() => setShowSignOutConfirm(true)}
        >
          {adminTab === 'overview' && (
            <OperatorDashboardView
              kpis={kpis}
              jeepneys={jeepneys}
              terminals={terminals}
              stops={stops}
              route={route}
              alerts={alerts}
              geofenceEvents={geofenceEvents}
              recentTrips={trips}
              hourlyData={hourlyData}
              onAcknowledgeAlert={acknowledgeAlert}
              onResolveAlert={resolveAlert}
              onNavigateTab={setAdminTab}
            />
          )}

          {adminTab === 'alerts' && (
            <OperationalAlertsView
              alerts={alerts}
              jeepneys={jeepneys}
              onAcknowledgeAlert={acknowledgeAlert}
              onResolveAlert={resolveAlert}
            />
          )}

          {adminTab === 'terminals' && (
            <TerminalMonitoringView
              terminals={terminals}
              jeepneys={jeepneys}
              geofenceEvents={geofenceEvents}
            />
          )}

          {adminTab === 'fleet' && (
            <FleetManagementView
              jeepneys={jeepneys}
              initialTab="jeepneys"
            />
          )}

          {adminTab === 'drivers' && (
            <FleetManagementView
              jeepneys={jeepneys}
              initialTab="drivers"
            />
          )}

          {adminTab === 'users' && (
            <RegisteredUsersView />
          )}

          {adminTab === 'fare' && (
            <FareManagementView />
          )}

          {adminTab === 'settings' && (
            <SystemSettingsView />
          )}
        </AdminLayout>
      ) : (
        /* -------------------------------------------------------------
           PUBLIC COMMUTER & DRIVER PORTAL LAYOUT (Standard Topbar)
           ------------------------------------------------------------- */
        <div className={`min-h-screen bg-slate-50 dark:bg-[#0B132B] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200 ${currentRole === 'commuter' ? 'h-screen overflow-hidden' : ''}`}>
          {/* Universal Top Navbar for Public Commuter & Driver Cab */}
          <TopNavbar
            currentRole={currentRole}
            onRoleChange={setCurrentRole}
            activeAlertCount={activeAlertCount}
            onOpenCommuterProfile={() => setShowCommuterProfileModal(true)}
            onOpenUnifiedLogin={(role = 'commuter') => {
              setUnifiedAuthInitialRole(role);
              setUnifiedAuthModalOpen(true);
            }}
            onRequestSignOut={() => setShowSignOutConfirm(true)}
          />

          {/* Main Content Area */}
          <main className={`flex-1 relative ${currentRole === 'commuter' ? 'overflow-hidden' : 'overflow-y-auto min-h-0'} ${currentRole === 'landing' ? 'pb-0' : 'pb-12'}`}>
            
            {/* LANDING PAGE (Smart Campus Transit Overview) */}
            {currentRole === 'landing' && (
              <LandingPageView
                onNavigateRole={(role) => {
                  if (role === 'driver' && !isDriverAuthenticated) {
                    setUnifiedAuthInitialRole('driver');
                    setUnifiedAuthModalOpen(true);
                  } else if ((role === 'operator' || role === 'admin') && !isOperatorAuthenticated) {
                    setUnifiedAuthInitialRole('operator');
                    setUnifiedAuthModalOpen(true);
                  } else {
                    setCurrentRole(role);
                  }
                }}
                kpis={kpis}
                jeepneys={jeepneys}
                stops={stops}
                terminals={terminals}
                onOpenCommuterAuth={() => {
                  setUnifiedAuthInitialRole('commuter');
                  setUnifiedAuthModalOpen(true);
                }}
              />
            )}

            {/* COMMUTER VIEW (Exclusive to PLMun Students & Faculty/Staff) */}
            {currentRole === 'commuter' && (
              !isCommuterAuthenticated && !isGuestCommuter && !isOperatorAuthenticated ? (
                <CommuterAuthView
                  onSuccess={() => {}}
                  onContinueAsGuest={() => setIsGuestCommuter(true)}
                  onBackToLanding={() => setCurrentRole(isOperatorAuthenticated ? 'operator' : 'landing')}
                />
              ) : (
                <>
                  {isOperatorAuthenticated && (
                    <div className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 flex items-center justify-between text-xs font-semibold shadow-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span>Control Center Dispatcher Mode: Live Commuter Telemetry Preview</span>
                      </div>
                      <button
                        onClick={() => setCurrentRole('operator')}
                        className="px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <span>← Return to Admin Portal</span>
                      </button>
                    </div>
                  )}
                  <CommuterView
                    jeepneys={jeepneys}
                    terminals={terminals}
                    stops={stops}
                    route={route}
                  />
                </>
              )
            )}

            {/* DRIVER CONSOLE (Requires Control Center Provisioned Account) */}
            {currentRole === 'driver' && (
              !isDriverAuthenticated && !isOperatorAuthenticated ? (
                <DriverLogin
                  onSuccess={() => {}}
                  onBackToCommuter={() => setCurrentRole(isOperatorAuthenticated ? 'operator' : 'landing')}
                />
              ) : (
                <>
                  {isOperatorAuthenticated && (
                    <div className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 flex items-center justify-between text-xs font-semibold shadow-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span>Control Center Dispatcher Mode: Driver Cab In-Vehicle Console Preview</span>
                      </div>
                      <button
                        onClick={() => setCurrentRole('operator')}
                        className="px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <span>← Return to Admin Portal</span>
                      </button>
                    </div>
                  )}
                  <DriverConsoleView
                    assignedJeepney={assignedJeepney}
                    terminals={terminals}
                    stops={stops}
                    onRequestSignOut={() => setShowSignOutConfirm(true)}
                    onLogout={() => setShowSignOutConfirm(true)}
                  />
                </>
              )
            )}

            {/* CONTROL CENTER LOGIN (Shown when unauthenticated operator tries to access) */}
            {(currentRole === 'operator' || currentRole === 'admin') && !isOperatorAuthenticated && (
              <ControlCenterLogin
                onSuccess={() => setAdminTab('overview')}
                onBackToCommuter={() => setCurrentRole('landing')}
              />
            )}
          </main>

          {/* Universal Footer (Shown only on landing page to allow clean edge-to-edge interactive maps on commuter/driver views) */}
          {currentRole === 'landing' && (
            <footer className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 py-6 text-xs text-slate-500 transition-colors">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                  <span>
                    <strong>PLMun–Alabang Route</strong> Smart Web-Based Jeepney Tracking and Terminal Monitoring System
                  </span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                  City of Muntinlupa Transport Management &bull; Realtime Leaflet GPS Telemetry
                </p>
              </div>
            </footer>
          )}
        </div>
      )}
    </>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <TransitProvider>
            <AppContent />
          </TransitProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
