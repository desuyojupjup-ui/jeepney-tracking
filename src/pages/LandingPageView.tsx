import React, { useState } from 'react';
import { UserRole, SystemKpiMetrics, Jeepney, RouteStop, Terminal } from '../types';
import { useAuth } from '../context/AuthContext';
import { 
  Bus, 
  MapPin, 
  Smartphone, 
  LayoutDashboard, 
  ShieldCheck, 
  Radio, 
  Clock, 
  ArrowRight, 
  CheckCircle2, 
  GraduationCap, 
  Users, 
  Zap, 
  Navigation, 
  ChevronRight, 
  Award, 
  Sparkles, 
  Compass, 
  QrCode, 
  AlertTriangle, 
  Bell, 
  ChevronDown,
  Layers,
  ArrowUpDown,
  Building2,
  Building,
  Briefcase
} from 'lucide-react';

interface LandingPageViewProps {
  onNavigateRole: (role: UserRole) => void;
  kpis?: SystemKpiMetrics;
  jeepneys?: Jeepney[];
  stops?: RouteStop[];
  terminals?: Terminal[];
  onOpenCommuterAuth?: () => void;
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({
  onNavigateRole,
  kpis,
  jeepneys = [],
  stops = [],
  terminals = [],
  onOpenCommuterAuth,
}) => {
  const { currentCommuter, isCommuterAuthenticated } = useAuth();
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [selectedPreviewStop, setSelectedPreviewStop] = useState<number>(0);

  const activeJeepneyCount = jeepneys.filter(j => j.status !== 'offline').length || 7;
  const currentStop = stops[selectedPreviewStop] || stops[0] || {
    id: 'stop-1',
    sequence: 1,
    name: 'PLMun University Terminal',
    landmark: 'University Road / Admin Bldg, Poblacion',
    fareFromOriginRegular: 13,
    fareFromOriginDiscounted: 11,
  };

  const faqs = [
    {
      q: 'Who has access to the JeepTrack Muntinlupa system?',
      a: 'The commuter tracking portal is built exclusively for actively enrolled students, faculty members, and employees of Pamantasan ng Lungsod ng Muntinlupa (PLMun). Jeepney drivers utilize the in-cab console, and authorized city transport personnel access the Central Dispatch Control Center.',
    },
    {
      q: 'How is the 20% student fare discount applied?',
      a: 'In full accordance with Republic Act No. 11314 (Student Fare Discount Act), active PLMun student credentials automatically calculate and display the mandated 20% discount fare (e.g. ₱11.00 base vs ₱13.00 regular) across all designated route stops along Manila South Road.',
    },
    {
      q: 'How does real-time GPS tracking work along the corridor?',
      a: 'Each participating Modern PUJ and traditional unit transmits high-frequency telemetry (latitude, longitude, heading angle, and speed) to our geofenced mesh network. Arrival estimates are computed dynamically using actual road speed and terminal bay queues.',
    },
    {
      q: 'What should drivers do during transit emergencies?',
      a: 'Drivers have an immediate One-Touch Emergency SOS beacon on their in-cab console. Activating it instantaneously transmits vehicle coordinates, plate number, and distress status to the Central Control Center for immediate dispatch response.',
    },
  ];

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-[#070e17] text-slate-900 dark:text-slate-100 transition-colors selection:bg-[#00B14F] selection:text-white overflow-hidden">
      
      {/* 
        ======================================================================
        HOMEPAGE OVERLAY GRAPHIC BACKGROUND (/overlay.png)
        ======================================================================
      */}
      <div className="absolute top-0 left-0 right-0 h-[720px] sm:h-[860px] lg:h-[980px] pointer-events-none overflow-hidden z-0">
        <img 
          src="/overlay.png" 
          alt="Muntinlupa Campus & Corridor Overlay" 
          className="w-full h-full object-cover object-top opacity-90 dark:opacity-30 transition-opacity duration-300 select-none"
        />
        {/* Soft bottom blend to seamlessly fade into the page background */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50/20 via-transparent to-slate-50 dark:from-[#070e17]/30 dark:via-[#070e17]/50 dark:to-[#070e17]" />
      </div>

      {/* 
        ======================================================================
        ADDITIONAL HERO OVERLAY BACKGROUND (/backoverlay.png)
        PLMun Students & Jeepney Corridor Overlay (Full Width)
        ======================================================================
      */}
      <div className="absolute top-0 left-0 right-0 w-full pointer-events-none overflow-hidden z-0">
        <div className="relative w-full">
          <img 
            src="/backoverlay.png" 
            alt="PLMun Students & Modern Jeepney Overlay" 
            className="w-full h-auto max-h-[720px] sm:max-h-[860px] lg:max-h-[960px] object-cover object-top opacity-85 sm:opacity-95 dark:opacity-30 sm:dark:opacity-40 transition-opacity duration-300 select-none filter drop-shadow-md pointer-events-none"
          />
          {/* Gradient blend to soften lower edge */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-50 dark:to-[#070e17] pointer-events-none" />
        </div>
      </div>

      {/* 
        ======================================================================
        BACKGROUND AMBIENT LIGHTS & GLOW ORBS
        ======================================================================
      */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-[#00B14F]/15 via-emerald-500/10 to-transparent rounded-full blur-3xl opacity-60" />
        <div className="absolute top-1/4 -left-40 w-[600px] h-[600px] bg-teal-500/10 dark:bg-emerald-950/40 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] bg-amber-500/10 dark:bg-amber-950/30 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-1/3 w-[800px] h-[500px] bg-indigo-500/10 dark:bg-indigo-950/30 rounded-full blur-3xl" />
      </div>

      {/* 
        ======================================================================
        HERO SECTION
        ======================================================================
      */}
      <section id="overview" className="relative z-10 pt-12 pb-20 sm:pt-20 sm:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-20">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          
          {/* Official Accreditation Capsule */}
          <div className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-full text-[11px] sm:text-xs font-bold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shadow-sm animate-fade-in max-w-full">
            <span className="w-2 h-2 rounded-full bg-[#00B14F] animate-pulse shrink-0"></span>
            <span className="sm:hidden whitespace-nowrap">City of Muntinlupa &bull; PLMun</span>
            <span className="hidden sm:inline">City of Muntinlupa &bull; Pamantasan ng Lungsod ng Muntinlupa</span>
            <span className="hidden sm:inline text-emerald-400">|</span>
            <span className="hidden sm:inline font-mono text-[11px] text-emerald-600 dark:text-emerald-400">PLMun ⇄ Alabang Corridor</span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.15]">
            Smart Campus Transit & <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-[#006837] via-[#00B14F] to-[#20C997] bg-clip-text text-transparent">
              Real-Time Jeepney Telemetry
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            The official intelligent Public Utility Jeepney (PUJ) tracking and terminal monitoring system built exclusively for <strong>PLMun students, faculty, and employees</strong>, transport cooperatives, and city dispatchers.
          </p>

          {/* Call to Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
            <button
              onClick={() => onNavigateRole('commuter')}
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-[#006837] via-[#008A4B] to-[#00B14F] hover:from-[#005a30] hover:to-[#009643] text-white text-sm sm:text-base font-extrabold shadow-xl shadow-emerald-700/25 active:scale-95 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <MapPin className="w-5 h-5" />
              <span>Launch Live Commuter Map</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {!isCommuterAuthenticated ? (
              <button
                onClick={() => {
                  if (onOpenCommuterAuth) {
                    onOpenCommuterAuth();
                  } else {
                    onNavigateRole('commuter');
                  }
                }}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white dark:bg-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-700/90 text-slate-800 dark:text-white text-sm sm:text-base font-bold border border-slate-200 dark:border-slate-700 shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <GraduationCap className="w-5 h-5 text-emerald-600" />
                <span>PLMun Sign In / Register</span>
              </button>
            ) : (
              <button
                onClick={() => onNavigateRole('commuter')}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 text-sm sm:text-base font-bold border border-emerald-300 dark:border-emerald-800 shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Active: {currentCommuter?.fullName.split(' ')[0]} (PLMun)</span>
              </button>
            )}
          </div>

          {/* Quick Portal Switch Links */}
          <div className="flex items-center justify-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400 pt-2">
            <span>Or switch to:</span>
            <button
              onClick={() => onNavigateRole('driver')}
              className="hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Driver Console</span>
            </button>
            <span>&bull;</span>
            <button
              onClick={() => onNavigateRole('operator')}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Control Center Dispatch</span>
            </button>
          </div>
        </div>

        {/* 
          ==================================================================
          HERO LIVE TELEMETRY MOCK PREVIEW CARD
          ==================================================================
        */}
        <div id="telemetry" className="mt-12 sm:mt-16 max-w-5xl mx-auto scroll-mt-24">
          <div className="relative rounded-3xl p-1.5 sm:p-2.5 bg-gradient-to-b from-emerald-500/30 via-slate-200/50 to-emerald-500/10 dark:from-emerald-500/30 dark:via-slate-800/40 dark:to-emerald-500/10 shadow-2xl shadow-emerald-950/20">
            <div className="bg-white dark:bg-[#0E1626] rounded-[22px] border border-slate-200/80 dark:border-slate-800 overflow-hidden">
              
              {/* Card Window Bar */}
              <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span>
                    <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
                    <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
                  </div>
                  <span className="text-slate-400 pl-2">|</span>
                  <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                    <span>Live Telemetry Grid: Manila South Road Corridor</span>
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    {activeJeepneyCount} PUJs Active
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">5.2 km Route</span>
                </div>
              </div>

              {/* Dynamic Telemetry Showcase Body */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 dark:divide-slate-800">
                
                {/* Left Live Route Map Simulation */}
                <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6 bg-gradient-to-br from-slate-50/50 to-white dark:from-[#0B1324] dark:to-[#0E1626]">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold tracking-wider text-emerald-600 dark:text-emerald-400 uppercase">
                        Active Vehicle Stream
                      </span>
                      <span className="text-xs font-mono text-slate-400">Headway: 6-8 mins</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
                      PLMun University Terminal ⇄ Alabang South Station
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Continuous sub-second geofence tracking with automatic terminal dispatch counters.
                    </p>
                  </div>

                  {/* Active PUJ Cards Mock */}
                  <div className="space-y-2.5">
                    <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/90 border border-emerald-200/90 dark:border-emerald-800/60 shadow-md flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm shadow-md shadow-emerald-600/30">
                          <Bus className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-slate-900 dark:text-white">PLM-01</span>
                            <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                              Modern Electric
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            Approaching <strong className="text-slate-700 dark:text-slate-300">SM Center Muntinlupa</strong> &bull; 34 km/h
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">
                          ~3 MINS ETA
                        </div>
                        <div className="text-[10px] font-bold text-slate-400">
                          6 Seats Free
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 shadow-xs flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow-md shadow-blue-600/30">
                          <Bus className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-slate-900 dark:text-white">PLM-04</span>
                            <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                              Modern Euro 4
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            Leaving <strong className="text-slate-700 dark:text-slate-300">PLMun Poblacion Terminal</strong> &bull; 28 km/h
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-black text-blue-600 dark:text-blue-400 font-mono">
                          ~8 MINS ETA
                        </div>
                        <div className="text-[10px] font-bold text-slate-400">
                          12 Seats Free
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Discount Privilege Pill */}
                  <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-bold text-emerald-900 dark:text-emerald-200">
                        RA 11314 Student Fare: ₱11.00 base vs ₱13.00 regular
                      </span>
                    </div>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                      Verified PLMun
                    </span>
                  </div>
                </div>

                {/* Right Interactive Stop Preview */}
                <div className="lg:col-span-5 p-6 sm:p-8 bg-slate-50/50 dark:bg-[#0B1320] flex flex-col justify-between space-y-6">
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">
                      <span>Corridor Landmark Check</span>
                      <span>8 Major Stops</span>
                    </div>
                    <h4 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                      Manila South Road Stations
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Select a landmark stop to preview sequence, distance, and fare.
                    </p>
                  </div>

                  {/* Stop Selector List */}
                  <div className="space-y-1.5">
                    {stops.slice(0, 5).map((s, idx) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSelectedPreviewStop(idx)}
                        className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                          selectedPreviewStop === idx
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 border-[#00B14F] text-[#006837] dark:text-emerald-300 shadow-sm'
                            : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                            selectedPreviewStop === idx
                              ? 'bg-[#00B14F] text-white'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                          }`}>
                            {s.sequence}
                          </span>
                          <span className="text-xs font-bold truncate">{s.name}</span>
                        </div>
                        <span className="text-xs font-mono font-extrabold text-emerald-600 dark:text-emerald-400 shrink-0">
                          ₱{s.fareFromOriginDiscounted.toFixed(2)}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Selected Stop Details Footer */}
                  <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Selected Landmark Details
                    </div>
                    <div className="font-extrabold text-slate-900 dark:text-white">
                      Stop #{currentStop.sequence}: {currentStop.name}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {currentStop.landmark}
                    </div>
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs">
                      <span className="text-slate-500">Regular: ₱{currentStop.fareFromOriginRegular.toFixed(2)}</span>
                      <span className="font-black text-emerald-600 dark:text-emerald-400">
                        Student Discount: ₱{currentStop.fareFromOriginDiscounted.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>
        </div>
      </section>

      {/* 
        ======================================================================
        LIVE SYSTEM METRICS TICKER SECTION
        ======================================================================
      */}
      <section className="relative z-10 py-12 bg-white dark:bg-slate-900/80 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {activeJeepneyCount} Units
              </div>
              <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                Active Telemetry Fleet
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Modern Electric & Euro 4 PUJs en route
              </p>
            </div>

            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-black text-blue-600 dark:text-blue-400 font-mono">
                5.2 km
              </div>
              <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                Corridor Length
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                PLMun Poblacion ⇄ Alabang Starmall
              </p>
            </div>

            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                ~8.5 min
              </div>
              <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                Average Departure Headway
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Real-time terminal bay queue pacing
              </p>
            </div>

            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-black text-amber-500 font-mono">
                20% Off
              </div>
              <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                Student Privilege Under RA 11314
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Automated fare calculations on all stops
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 
        ======================================================================
        THREE DEDICATED ECOSYSTEM GATEWAYS (PORTALS)
        ======================================================================
      */}
      <section id="portals" className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-20">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#00B14F]/10 text-[#006837] dark:text-emerald-300">
            <Layers className="w-3.5 h-3.5" />
            <span>Multi-Role Transit Architecture</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Designed for Every Stakeholder
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Select your dedicated access portal to experience real-time tracking, in-cab telemetry, or centralized dispatch operations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          
          {/* Card 1: PLMun Students & Commuters */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-emerald-100 dark:border-emerald-950/60 shadow-xl shadow-emerald-950/5 flex flex-col justify-between space-y-6 hover:border-emerald-400 transition-all group">
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-[#006837] dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center font-bold shadow-md">
                <GraduationCap className="w-7 h-7" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Exclusive Campus Access
                </span>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">
                  Students & Faculty
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                  Sign in with your PLMun student/employee credentials to track approaching PUJs, enjoy automated 20% student fare calculations, and receive proximity stop notifications.
                </p>
              </div>

              <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300 pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Verified PLMun ID Login & Registration</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>20% Student Fare Privilege under RA 11314</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Digital Transit Pass with QR Code</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Real-Time Seat Availability Peek</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => onNavigateRole('commuter')}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#006837] to-[#00B14F] hover:from-[#005a30] hover:to-[#009643] text-white text-xs font-bold shadow-md shadow-emerald-700/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Enter Student & Commuter Portal</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Card 2: Driver In-Cab Console */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-blue-100 dark:border-blue-950/60 shadow-xl shadow-blue-950/5 flex flex-col justify-between space-y-6 hover:border-blue-400 transition-all group">
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 flex items-center justify-center font-bold shadow-md">
                <Smartphone className="w-7 h-7" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  Mobile In-Cab Telemetry
                </span>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">
                  Jeepney Drivers
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                  Turn-by-turn Manila South Road corridor tracking, passenger load tallying, speed monitoring, and instant one-touch emergency panic SOS broadcasts to dispatchers.
                </p>
              </div>

              <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300 pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                  <span>Dispatch-Provisioned PIN Security</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                  <span>Automated Geofence Terminal Check-In</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                  <span>One-Touch Emergency SOS Distress Beacon</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                  <span>Route Corridor Deviation Warnings</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => onNavigateRole('driver')}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-600 hover:from-blue-800 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-blue-700/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Open Driver In-Cab Console</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Card 3: Central Control Center */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-indigo-100 dark:border-indigo-950/60 shadow-xl shadow-indigo-950/5 flex flex-col justify-between space-y-6 hover:border-indigo-400 transition-all group">
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center font-bold shadow-md">
                <LayoutDashboard className="w-7 h-7" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Command & Dispatch
                </span>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">
                  Control Center
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                  Terminal bay monitoring at PLMun & Alabang South Station, live Leaflet radar, geofence breach inspection, automated alerts, and driver provisioning.
                </p>
              </div>

              <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300 pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>Real-Time Terminal Bay Occupancy Gauges</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>Driver Account Provisioning & Password Reset</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>Emergency SOS Incident Acknowledgment</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>Hourly Passenger Volume & Speed Analytics</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => onNavigateRole('operator')}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-700 to-purple-700 hover:from-indigo-800 hover:to-purple-800 text-white text-xs font-bold shadow-md shadow-indigo-700/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Access Control Center Dashboard</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

        </div>
      </section>

      {/* 
        ======================================================================
        ROUTE CORRIDOR LANDMARKS SECTION
        ======================================================================
      */}
      <section id="route" className="relative z-10 py-16 bg-slate-100/60 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <Navigation className="w-3.5 h-3.5 text-emerald-600" />
                <span>Manila South Road Arterial Highway</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">
                Official PLMun–Alabang Route Sequence
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00B14F]"></span>
              <span>PLMun Terminal (Poblacion)</span>
              <span>⇄</span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#EA4335]"></span>
              <span>Alabang South Station</span>
            </div>
          </div>

          {/* Stops Timeline Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stops.map((stop) => (
              <div 
                key={stop.id}
                className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/80 shadow-xs hover:border-emerald-400 transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-black text-xs flex items-center justify-center font-mono">
                      #{stop.sequence}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-mono">
                      ₱{stop.fareFromOriginDiscounted.toFixed(2)} Student
                    </span>
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white mt-2">
                    {stop.name}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {stop.landmark}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>Reg: ₱{stop.fareFromOriginRegular.toFixed(2)}</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">20% Discounted</span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 
        ======================================================================
        FAQ ACCORDION
        ======================================================================
      */}
      <section id="faq" className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto scroll-mt-20">
        <div className="text-center mb-12 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Answers regarding PLMun institutional access, student fare privileges, and fleet telemetry.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs transition-colors"
            >
              <button
                type="button"
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                className="w-full py-4 px-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${activeFaq === idx ? 'rotate-180 text-emerald-500' : ''}`} />
              </button>

              {activeFaq === idx && (
                <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/80">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 
        ======================================================================
        FINAL CTA FOOTER BANNER
        ======================================================================
      */}
      <section className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        <div className="rounded-3xl p-8 sm:p-12 bg-gradient-to-r from-[#004D25] via-[#006837] to-[#008A4B] text-white shadow-2xl shadow-emerald-950/20 relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/10 blur-xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-amber-400/20 blur-xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              Ready to Track Your Next Ride to Campus?
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
              Eliminate guesswork and long queues. Access real-time PUJ locations, arrival ETAs, and verified student discounts across Muntinlupa.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => onNavigateRole('commuter')}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white text-[#006837] font-black text-sm shadow-xl hover:bg-emerald-50 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <MapPin className="w-4 h-4 text-[#006837]" />
                <span>Launch Commuter Map Now</span>
              </button>

              <button
                onClick={() => onNavigateRole('operator')}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-black/25 hover:bg-black/35 text-white font-bold text-sm border border-white/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Control Center Dispatch</span>
              </button>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};
