import React, { useState, useEffect } from 'react';
import { UserRole } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { 
  Bus, 
  Smartphone, 
  LayoutDashboard, 
  MapPin, 
  Bell, 
  Radio, 
  ShieldCheck, 
  Clock, 
  Menu, 
  X,
  LogOut,
  Lock,
  User,
  CheckCircle2,
  GraduationCap,
  Home,
  LogIn,
  Sparkles,
  Layers,
  Navigation,
  HelpCircle,
  ArrowRight
} from 'lucide-react';
import { ThemeToggle } from '../common/ThemeToggle';

interface TopNavbarProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  activeAlertCount?: number;
  onOpenCommuterProfile?: () => void;
  onOpenUnifiedLogin?: (initialRole?: 'commuter' | 'driver' | 'operator') => void;
  onRequestSignOut?: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  currentRole,
  onRoleChange,
  activeAlertCount = 1,
  onOpenCommuterProfile,
  onOpenUnifiedLogin,
  onRequestSignOut,
}) => {
  const { 
    currentOperator, 
    currentDriver, 
    currentCommuter,
    isOperatorAuthenticated, 
    isDriverAuthenticated, 
    isCommuterAuthenticated,
    logoutOperator, 
    logoutDriver,
    logoutCommuter,
  } = useAuth();

  const [currentTime, setCurrentTime] = useState<string>('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [activeSection, setActiveSection] = useState<string>('overview');

  const landingSections = [
    { id: 'overview', label: 'Overview', icon: Sparkles },
    { id: 'telemetry', label: 'Live Telemetry', icon: Radio },
    { id: 'portals', label: 'Portals', icon: Layers },
    { id: 'route', label: 'Route & Stops', icon: Navigation },
    { id: 'faq', label: 'FAQ', icon: HelpCircle },
  ];

  const scrollToSection = (sectionId: string) => {
    if (currentRole !== 'landing') {
      onRoleChange('landing');
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 120);
    } else {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  useEffect(() => {
    if (currentRole !== 'landing') return;

    const handleScroll = () => {
      const sectionIds = ['overview', 'telemetry', 'portals', 'route', 'faq'];
      const scrollPosition = window.scrollY + 140;

      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const element = document.getElementById(sectionIds[i]);
        if (element && element.offsetTop <= scrollPosition) {
          setActiveSection(sectionIds[i]);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentRole]);

  // Single unified session across all roles
  const activeUser = isOperatorAuthenticated && currentOperator
    ? {
        name: currentOperator.name.split('(')[0].trim(),
        roleLabel: currentOperator.role === 'admin' ? 'Lead Dispatcher' : 'Controller',
        roleType: 'operator' as const,
        avatarChar: currentOperator.name.charAt(0),
        gradient: 'from-indigo-600 to-purple-600',
        badgeBg: 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300',
        logout: logoutOperator,
      }
    : isDriverAuthenticated && currentDriver
    ? {
        name: currentDriver.fullName,
        roleLabel: `Driver @${currentDriver.username}`,
        roleType: 'driver' as const,
        avatarChar: currentDriver.fullName.charAt(0),
        gradient: 'from-blue-600 to-indigo-600',
        badgeBg: 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300',
        logout: logoutDriver,
      }
    : isCommuterAuthenticated && currentCommuter
    ? {
        name: currentCommuter.fullName,
        roleLabel: currentCommuter.commuterType === 'student' ? 'PLMun Student' : currentCommuter.commuterType === 'faculty' ? 'PLMun Faculty' : 'PLMun Staff',
        roleType: 'commuter' as const,
        avatarChar: currentCommuter.fullName.charAt(0),
        gradient: 'from-[#006837] to-[#00B14F]',
        badgeBg: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300',
        logout: logoutCommuter,
      }
    : null;

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

  return (
    <header className="sticky top-0 z-[1100] bg-white dark:bg-[#0B132B] border-b border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-sm transition-colors">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand & Route Title */}
        <button
          onClick={() => onRoleChange('landing')}
          className="flex items-center gap-3 shrink-0 text-left hover:opacity-90 transition-opacity cursor-pointer group"
          title="Return to JeepTrack Homepage"
        >
          <div className="w-10 h-10 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
            <img 
              src="/logo.png" 
              alt="JeepTrack Muntinlupa" 
              className="w-full h-full object-contain filter drop-shadow-sm"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-tight text-slate-900 dark:text-white text-base sm:text-lg whitespace-nowrap group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                JeepTrack <span className="text-[#00B14F] font-semibold">Muntinlupa</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block font-medium whitespace-nowrap">
              Smart Jeepney Tracking & Terminal Monitoring System
            </p>
          </div>
        </button>

        {/* Center Landing Page Section Navigation Buttons (Hidden when logged into a portal) */}
        {currentRole === 'landing' && !activeUser && (
          <nav 
            aria-label="Landing page sections"
            className="hidden md:flex items-center gap-1 bg-slate-100/90 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs"
          >
            {landingSections.map((sec) => {
              const Icon = sec.icon;
              const isActive = currentRole === 'landing' && activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => scrollToSection(sec.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-white dark:bg-slate-900 text-[#006837] dark:text-emerald-400 shadow-xs border border-emerald-500/20'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700/60'
                  }`}
                  title={`Jump to ${sec.label}`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#00B14F]' : 'text-slate-400'}`} />
                  <span>{sec.label}</span>
                </button>
              );
            })}
          </nav>
        )}

        {/* Right Role-Aware Switcher & Auth Badges */}
        <div className="hidden md:flex items-center gap-2.5 shrink-0">
          {/* Live Telemetry Clock Pill */}
          <div className="hidden 2xl:flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-500 dark:text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{currentTime || '12:00 PM'} PST</span>
          </div>

          {/* Theme Toggle Button */}
          <ThemeToggle />

          {/* Unified Active User Session Pill OR Single Sign In Button */}
          {activeUser ? (
            <div className="flex items-center gap-2">
              {/* Return to Admin Portal Button for Operator */}
              {isOperatorAuthenticated && (
                <button
                  type="button"
                  onClick={() => onRoleChange('operator')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
                  title="Return to Admin Portal / Control Center"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Admin Portal</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  if (activeUser.roleType === 'commuter' && onOpenCommuterProfile) {
                    onOpenCommuterProfile();
                  } else if (activeUser.roleType === 'operator') {
                    onRoleChange('operator');
                  }
                }}
                className={`flex items-center gap-2 px-2.5 py-1 rounded-xl border shadow-xs transition-all text-left ${activeUser.badgeBg} ${
                  activeUser.roleType === 'commuter' ? 'cursor-pointer hover:border-emerald-400' : 'cursor-pointer hover:border-blue-400 hover:shadow-sm'
                }`}
                title={activeUser.roleType === 'commuter' ? 'View PLMun Digital Transit Pass' : 'Return to Admin Portal / Control Center'}
              >
                <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${activeUser.gradient} text-white flex items-center justify-center font-black text-[11px] shadow-xs shrink-0`}>
                  {activeUser.avatarChar}
                </div>
                <div className="text-left hidden lg:block">
                  <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight truncate max-w-[120px] flex items-center gap-1">
                    <span>{activeUser.name.split(' ')[0]}</span>
                    <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400 inline shrink-0" />
                  </div>
                  <div className="text-[10px] font-mono font-semibold leading-tight truncate max-w-[120px]">
                    {activeUser.roleLabel}
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onRequestSignOut) {
                    onRequestSignOut();
                  } else {
                    activeUser.logout();
                    onRoleChange('landing');
                  }
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 dark:hover:text-rose-400 transition-colors flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                title="Sign out of account"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => {
                  if (onOpenUnifiedLogin) {
                    onOpenUnifiedLogin('commuter');
                  } else {
                    onRoleChange('commuter');
                  }
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#006837] via-[#008A4B] to-[#00B14F] hover:from-[#005a30] hover:to-[#009643] text-white text-xs font-extrabold shadow-sm active:scale-95 transition-all cursor-pointer"
                title="Open Universal Sign In & Registration Card"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In / Register</span>
              </button>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Toggle & Theme (Hidden for Driver since driver has In-Cab Console End Shift) */}
        <div className="md:hidden flex items-center gap-2">
          <ThemeToggle />
          {currentRole !== 'driver' && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors active:scale-95 cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-slate-800 dark:text-white" /> : <Menu className="w-5 h-5 text-slate-800 dark:text-white" />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 pt-3 pb-4 space-y-2 shadow-lg animate-fade-in text-slate-800 dark:text-slate-100">
          {/* Landing Page Section Shortcuts (Hidden when logged into a portal) */}
          {currentRole === 'landing' && !activeUser && (
            <div className="space-y-1">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1 py-1">
                Landing Page Sections
              </div>
              {landingSections.map((sec) => {
                const Icon = sec.icon;
                const isActive = currentRole === 'landing' && activeSection === sec.id;
                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => {
                      scrollToSection(sec.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-[#006837] dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>{sec.label}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 opacity-40" />
                  </button>
                );
              })}
            </div>
          )}

          {/* Mobile Active Session Logout OR Sign In */}
          {activeUser ? (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
              {isOperatorAuthenticated && (
                <button
                  onClick={() => {
                    onRoleChange('operator');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Return to Admin Portal</span>
                  </div>
                  <span className="text-[10px] bg-blue-700 text-white px-2 py-0.5 rounded">Active</span>
                </button>
              )}
              {activeUser.roleType === 'commuter' && currentCommuter && (
                <button
                  onClick={() => {
                    if (onOpenCommuterProfile) onOpenCommuterProfile();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800/60 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-emerald-600" />
                    <span>Digital Pass: {activeUser.name}</span>
                  </div>
                  <span className="text-[10px] bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 px-1.5 py-0.5 rounded">View ID</span>
                </button>
              )}

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (onRequestSignOut) {
                    onRequestSignOut();
                  } else {
                    activeUser.logout();
                    onRoleChange('landing');
                  }
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-bold border border-rose-200 dark:border-rose-900/40 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out of {activeUser.roleLabel}</span>
              </button>
            </div>
          ) : (
            onOpenUnifiedLogin && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => {
                    onOpenUnifiedLogin('commuter');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-[#006837] via-[#008A4B] to-[#00B14F] text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Universal Sign In & Registration</span>
                </button>
              </div>
            )
          )}

          {/* Mobile Telemetry Status Bar */}
          <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-1 font-mono">
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>GPS Online</span>
            </div>
            <span>{currentTime || '12:00:00 PM'} PST</span>
          </div>
        </div>
      )}
    </header>
  );
};
