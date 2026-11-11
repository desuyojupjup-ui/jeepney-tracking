import React, { useState, useEffect } from 'react';
import { 
  Jeepney, 
  Terminal, 
  RouteStop, 
  TransitRoute 
} from '../types';
import { useAuth } from '../context/AuthContext';
import { TransitMap } from '../components/map/TransitMap';
import { 
  Bus, 
  MapPin, 
  Clock, 
  ArrowRight, 
  Users, 
  DollarSign, 
  Compass, 
  CheckCircle2, 
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Building2,
  Navigation,
  ArrowUpDown,
  ShieldCheck,
  Star,
  Zap,
  Radio,
  Bell,
  SlidersHorizontal,
  X
} from 'lucide-react';

interface CommuterViewProps {
  jeepneys: Jeepney[];
  terminals: Terminal[];
  stops: RouteStop[];
  route: TransitRoute;
}

export const CommuterView: React.FC<CommuterViewProps> = ({
  jeepneys,
  terminals,
  stops,
  route,
}) => {
  const { currentCommuter } = useAuth();
  const [selectedDirection, setSelectedDirection] = useState<'PLMun_to_Alabang' | 'Alabang_to_PLMun'>('PLMun_to_Alabang');
  const [selectedStopId, setSelectedStopId] = useState<string>(stops[0]?.id || '');
  const [selectedJeepneyId, setSelectedJeepneyId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'modern_electric' | 'modern_euro4' | 'traditional_puj'>('all');
  
  // Default to collapsed peek mode so 80%+ of the screen is pure live map!
  const [isBottomSheetExpanded, setIsBottomSheetExpanded] = useState<boolean>(false);

  const [showMobileRouteModal, setShowMobileRouteModal] = useState<boolean>(false);
  const [showTerminalModal, setShowTerminalModal] = useState<boolean>(false);
  const [arrivalAlertSet, setArrivalAlertSet] = useState<boolean>(false);
  const [alertToast, setAlertToast] = useState<string | null>(null);

  // Filter jeepneys heading toward selected destination or at terminals, matching vehicle category
  const filteredJeepneys = jeepneys.filter((j) => {
    if (j.status === 'offline') return false;
    const matchesDirection = j.direction === selectedDirection || j.status === 'at_terminal';
    const matchesCategory = selectedCategory === 'all' || j.modelType === selectedCategory;
    return matchesDirection && matchesCategory;
  });

  const selectedStop = stops.find((s) => s.id === selectedStopId) || stops[0];

  // Active / Highlighted jeepney (ONLY when user explicitly clicked/selected one!)
  const activeJeepney = selectedJeepneyId 
    ? (filteredJeepneys.find(j => j.id === selectedJeepneyId) || null) 
    : null;

  const seatsFree = activeJeepney ? activeJeepney.capacity - activeJeepney.currentPassengers : 0;

  const handleSwapDirection = () => {
    setSelectedDirection(prev => prev === 'PLMun_to_Alabang' ? 'Alabang_to_PLMun' : 'PLMun_to_Alabang');
  };

  const handleToggleArrivalAlert = (target: Jeepney | null) => {
    if (!arrivalAlertSet) {
      setArrivalAlertSet(true);
      const code = target?.jeepneyCode || 'approaching PUJs';
      const stopName = selectedStop?.name || 'your designated stop';
      setAlertToast(`🔔 Proximity Alert Active: You will receive an alert when ${code} is 2 mins from ${stopName}.`);
      setTimeout(() => setAlertToast(null), 4500);
    } else {
      setArrivalAlertSet(false);
      setAlertToast(`Proximity Alert cancelled.`);
      setTimeout(() => setAlertToast(null), 2500);
    }
  };

  return (
    <div className="w-full h-[calc(100vh-64px)] sm:h-[calc(100dvh-64px)] px-0 py-0 bg-white dark:bg-[#0B132B] relative overflow-hidden isolate">
      
      {/* 
        ======================================================================
        FULL-VIEWPORT IMMERSIVE RIDE-HAILING MAP (GRAB / MOVE IT / MAXIM STYLE)
        Edge-to-edge flush with top navbar, zero border-radius
        ======================================================================
      */}
      {/* Full-Viewport Interactive Transit Map */}
      <div className="relative w-full h-full rounded-none overflow-hidden border-none bg-slate-50 dark:bg-[#0B132B]">
        
        {/* Floating Proximity / Arrival Alert Toast */}
        {alertToast && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[1005] max-w-md w-[90%] bg-slate-900/95 text-white border border-teal-500/60 p-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-3 animate-fade-in pointer-events-auto">
            <Bell className="w-5 h-5 text-amber-400 fill-current shrink-0 animate-bounce" />
            <div className="text-xs font-medium text-slate-100 flex-1">
              {alertToast}
            </div>
            <button
              onClick={() => setAlertToast(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Leaflet Base Map */}
        <TransitMap
          jeepneys={filteredJeepneys}
          terminals={terminals}
          stops={stops}
          routePath={route.pathCoordinates}
          selectedJeepneyId={selectedJeepneyId}
          onSelectJeepney={(j) => setSelectedJeepneyId(j.id)}
          height="100%"
          hideDefaultSearch={true}
        >
          {/* 
            ==================================================================
            1. MOBILE TOP SLIM CAPSULE (< sm)
            Height: only ~44px! Never covers or blocks the map!
            ==================================================================
          */}
          <div className="lg:hidden absolute top-2.5 left-2.5 right-2.5 z-[1001] pointer-events-auto">
            <div className="bg-white/95 dark:bg-[#1e2433]/95 backdrop-blur-xl rounded-full shadow-lg border border-gray-200/90 dark:border-slate-700/80 px-3 py-1.5 flex items-center justify-between gap-1.5">
              
              {/* Route Indicator & Swap */}
              <button 
                onClick={handleSwapDirection}
                className="flex items-center gap-1 cursor-pointer active:scale-95 transition-transform bg-gray-100 dark:bg-slate-800/80 hover:bg-gray-200 dark:hover:bg-slate-700 px-2 py-1 rounded-full shrink-0"
                title="Tap to swap direction"
              >
                <span className="w-2 h-2 rounded-full bg-[#00B14F]"></span>
                <span className="text-[11px] font-extrabold text-gray-900 dark:text-white">
                  {selectedDirection === 'PLMun_to_Alabang' ? 'PLMun' : 'Alabang'}
                </span>
                <ArrowUpDown className="w-2.5 h-2.5 text-gray-500 dark:text-slate-400" />
                <span className="text-[11px] font-extrabold text-gray-900 dark:text-white">
                  {selectedDirection === 'PLMun_to_Alabang' ? 'Alabang' : 'PLMun'}
                </span>
                <span className="w-2 h-2 rounded-full bg-[#EA4335]"></span>
              </button>

              {/* Stop Selector Pill */}
              <div className="flex-1 min-w-0 max-w-[150px] relative">
                <select
                  value={selectedStopId}
                  onChange={(e) => setSelectedStopId(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 rounded-full pl-2 pr-5 py-1 text-[11px] font-bold text-gray-800 dark:text-slate-100 focus:outline-none truncate cursor-pointer"
                >
                  {stops.map((stop) => (
                    <option key={stop.id} value={stop.id} className="dark:bg-slate-800 dark:text-white">
                      #{stop.sequence} {stop.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-gray-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Fare & Active Badge */}
              <button 
                onClick={() => setShowMobileRouteModal(true)}
                className="px-2 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-[#1A73E8] dark:text-blue-400 border border-blue-200 dark:border-blue-800/60 text-[10px] font-extrabold font-mono shrink-0 active:scale-95 flex items-center gap-1"
                title="View Route & Fare Details"
              >
                <span>₱{selectedStop.fareFromOriginDiscounted.toFixed(0)}</span>
                <SlidersHorizontal className="w-2.5 h-2.5" />
              </button>
            </div>
          </div>

          {/* 
            ==================================================================
            FLOATING QUICK ACTION BUTTONS (Right Side) - Card 3
            ==================================================================
          */}
          <div className="absolute top-16 right-2.5 lg:top-4 lg:right-4 z-[990] flex flex-col gap-2 pointer-events-auto">
            {/* Terminal Bays Radar Toggle */}
            <button
              onClick={() => setShowTerminalModal(!showTerminalModal)}
              title="Terminal Bay Occupancy Radar"
              className="w-9 h-9 bg-white/95 dark:bg-[#1e2433]/95 backdrop-blur-md rounded-xl shadow-md border border-gray-200 dark:border-slate-700/80 flex items-center justify-center text-gray-700 dark:text-slate-200 hover:text-[#00B14F] hover:bg-gray-50 dark:hover:bg-slate-800 active:scale-95 transition-all"
            >
              <Building2 className="w-4 h-4 text-[#00B14F]" />
            </button>

            {/* Quick Vehicle Type Filter Cycle Button */}
            <button
              onClick={() => {
                const nextType: Record<string, 'all' | 'modern_electric' | 'modern_euro4'> = {
                  'all': 'modern_electric',
                  'modern_electric': 'modern_euro4',
                  'modern_euro4': 'all',
                };
                setSelectedCategory(nextType[selectedCategory] || 'all');
              }}
              title={`Active Filter: ${selectedCategory.replace('_', ' ')} (Tap to cycle)`}
              className={`w-9 h-9 rounded-xl shadow-md border flex items-center justify-center active:scale-95 transition-all text-[11px] font-extrabold ${
                selectedCategory === 'modern_electric'
                  ? 'bg-[#00B14F] text-white border-emerald-600 shadow-emerald-500/20'
                  : selectedCategory === 'modern_euro4'
                  ? 'bg-[#1A73E8] text-white border-blue-600 shadow-blue-500/20'
                  : 'bg-white/95 dark:bg-[#1e2433]/95 text-gray-700 dark:text-slate-200 border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800'
              }`}
            >
              {selectedCategory === 'modern_electric' ? '⚡' : selectedCategory === 'modern_euro4' ? 'E4' : <Bus className="w-4 h-4 text-gray-700 dark:text-slate-200" />}
            </button>
          </div>

          {/* 
            ==================================================================
            2. DESKTOP FLOATING ROUTE DISPATCH CAPSULE (>= lg)
            Clean floating card neatly tucked on the left
            ==================================================================
          */}
          <div className="hidden lg:block absolute top-4 left-4 w-[360px] z-[1001] pointer-events-auto space-y-2">
            
            {/* Main Capsule Card */}
            <div className="bg-white/95 dark:bg-[#1e2433]/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/90 dark:border-slate-700/80 p-3.5 space-y-2.5">
              
              {/* Header Status & Route Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00B14F] animate-pulse"></span>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-900 dark:text-white font-sans">
                    PLMun–Alabang Express Route
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border ${
                    filteredJeepneys.length > 0
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}>
                    {filteredJeepneys.length > 0 ? `${filteredJeepneys.length} Active PUJs` : '0 Active (Standby)'}
                  </span>
                </div>
              </div>

              {/* Commuter Identification Banner (When Logged In) */}
              {currentCommuter && (
                <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#006837] to-[#00B14F] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                      {currentCommuter.commuterType === 'student' ? '🎓' : currentCommuter.commuterType === 'faculty' ? '👩‍🏫' : '🏢'}
                    </div>
                    <div className="min-w-0">
                      <div className="font-extrabold text-emerald-950 dark:text-emerald-200 text-xs truncate leading-tight">
                        {currentCommuter.fullName}
                      </div>
                      <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium truncate leading-tight">
                        {currentCommuter.idNumber} &bull; {currentCommuter.collegeOrDepartment.split('(')[0].trim()}
                      </div>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 shrink-0">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    Verified
                  </span>
                </div>
              )}

              {/* Grab / MoveIt Origin & Destination Connected Line Inputs */}
              <div className="relative bg-gray-50/90 dark:bg-[#141a29]/90 rounded-xl p-2.5 border border-gray-200/80 dark:border-slate-800">
                {/* Connecting Dotted Line */}
                <div className="absolute left-[21px] top-[24px] bottom-[24px] w-0.5 border-l-2 border-dashed border-gray-300 dark:border-slate-700"></div>

                <div className="space-y-2">
                  {/* Origin */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-3.5 h-3.5 rounded-full bg-[#00B14F] border-2 border-white dark:border-slate-800 shadow-sm shrink-0"></div>
                    <div className="flex-1">
                      <div className="text-[9px] uppercase font-bold text-gray-400 dark:text-slate-400">Pickup Origin</div>
                      <div className="text-xs font-bold text-gray-900 dark:text-white truncate">
                        {selectedDirection === 'PLMun_to_Alabang' ? 'PLMun University Terminal (Poblacion)' : 'Alabang South Station / Starmall'}
                      </div>
                    </div>
                  </div>

                  {/* Destination */}
                  <div className="flex items-center gap-2.5 pt-1">
                    <div className="w-3.5 h-3.5 rounded-full bg-[#EA4335] border-2 border-white dark:border-slate-800 shadow-sm shrink-0"></div>
                    <div className="flex-1">
                      <div className="text-[9px] uppercase font-bold text-gray-400 dark:text-slate-400">Drop-off Destination</div>
                      <div className="text-xs font-bold text-gray-900 dark:text-white truncate">
                        {selectedDirection === 'PLMun_to_Alabang' ? 'Alabang South Station / Starmall' : 'PLMun University Terminal (Poblacion)'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Swap Direction Icon Button */}
                <button
                  onClick={handleSwapDirection}
                  title="Swap Origin & Destination"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white dark:bg-[#1e2433] shadow-md border border-gray-200 dark:border-slate-700 flex items-center justify-center text-gray-600 dark:text-slate-300 hover:text-[#00B14F] hover:bg-gray-50 dark:hover:bg-slate-800 active:scale-95 transition-all cursor-pointer"
                >
                  <ArrowUpDown className="w-4 h-4" />
                </button>
              </div>

              {/* Waiting Landmark Stop Selector */}
              <div>
                <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  Waiting Stop along Manila South Road:
                </label>
                <div className="relative">
                  <select
                    value={selectedStopId}
                    onChange={(e) => setSelectedStopId(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-[#141a29] border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-gray-800 dark:text-slate-100 focus:outline-none focus:border-[#00B14F] focus:bg-white dark:focus:bg-[#141a29] shadow-xs cursor-pointer pr-8"
                  >
                    {stops.map((stop) => (
                      <option key={stop.id} value={stop.id} className="dark:bg-slate-800 dark:text-white">
                        Stop #{stop.sequence}: {stop.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Fare Strip & Terminal Quick Button */}
              <div className="pt-1 flex items-center justify-between border-t border-gray-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {currentCommuter?.transitDiscountEligible ? (
                    <span className="px-2 py-0.5 rounded-full text-xs font-extrabold font-mono bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      ₱{selectedStop.fareFromOriginDiscounted.toFixed(2)} (Student 20% Off)
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-xs font-extrabold font-mono bg-blue-50 dark:bg-blue-950/50 text-[#1A73E8] dark:text-blue-400 border border-blue-200 dark:border-blue-800/60">
                      ₱{selectedStop.fareFromOriginRegular.toFixed(2)} Regular
                    </span>
                  )}
                  <span className="text-[10px] text-gray-400 dark:text-slate-500 font-mono">
                    {currentCommuter?.transitDiscountEligible 
                      ? `Regular: ₱${selectedStop.fareFromOriginRegular.toFixed(2)}`
                      : `Student: ₱${selectedStop.fareFromOriginDiscounted.toFixed(2)}`
                    }
                  </span>
                </div>

                <button
                  onClick={() => setShowTerminalModal(!showTerminalModal)}
                  className="text-[11px] font-bold text-[#00B14F] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Bays</span>
                </button>
              </div>
            </div>

            {/* Desktop Vehicle Fleet Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-full shadow-md font-bold text-xs whitespace-nowrap transition-all active:scale-95 ${
                  selectedCategory === 'all'
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-gray-900/30'
                    : 'bg-white/95 dark:bg-[#1e2433]/95 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-700'
                }`}
              >
                All Fleet ({jeepneys.length})
              </button>

              <button
                onClick={() => setSelectedCategory('modern_electric')}
                className={`px-3 py-1.5 rounded-full shadow-md font-bold text-xs whitespace-nowrap flex items-center gap-1 transition-all active:scale-95 ${
                  selectedCategory === 'modern_electric'
                    ? 'bg-[#00B14F] text-white shadow-emerald-600/30'
                    : 'bg-white/95 dark:bg-[#1e2433]/95 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-700'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-yellow-400 fill-current" />
                <span>Modern EV ({jeepneys.filter(j => j.modelType === 'modern_electric').length})</span>
              </button>

              <button
                onClick={() => setSelectedCategory('modern_euro4')}
                className={`px-3 py-1.5 rounded-full shadow-md font-bold text-xs whitespace-nowrap flex items-center gap-1 transition-all active:scale-95 ${
                  selectedCategory === 'modern_euro4'
                    ? 'bg-[#1A73E8] text-white shadow-blue-600/30'
                    : 'bg-white/95 dark:bg-[#1e2433]/95 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-700'
                }`}
              >
                <Bus className="w-3.5 h-3.5" />
                <span>Euro-4 ({jeepneys.filter(j => j.modelType === 'modern_euro4').length})</span>
              </button>
            </div>
          </div>

          {/* 
            ==================================================================
            3. MOBILE ROUTE DETAILS MODAL (Opens only when tapped on mobile)
            ==================================================================
          */}
          {showMobileRouteModal && (
            <div className="sm:hidden absolute inset-0 z-[1003] bg-black/60 backdrop-blur-sm flex items-end p-2 pointer-events-auto animate-fade-in">
              <div className="w-full bg-white dark:bg-[#1e2433] rounded-3xl p-4 space-y-3 shadow-2xl border border-gray-200 dark:border-slate-700">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-2">
                  <div className="font-extrabold text-sm text-gray-900 dark:text-white">Route & Fare Matrix</div>
                  <button 
                    onClick={() => setShowMobileRouteModal(false)}
                    className="p-1 rounded-full text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/60">
                    <span className="font-bold text-[#1A73E8] dark:text-blue-400">Student / PWD (20% Off):</span>
                    <span className="font-bold font-mono text-[#1A73E8] dark:text-blue-400">₱{selectedStop.fareFromOriginDiscounted.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
                    <span className="text-gray-600 dark:text-slate-300">Regular Passenger Fare:</span>
                    <span className="font-bold font-mono text-gray-800 dark:text-slate-100">₱{selectedStop.fareFromOriginRegular.toFixed(2)}</span>
                  </div>
                </div>

                {/* Fleet Category Switcher */}
                <div>
                  <div className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase mb-1.5">Filter Vehicle Type:</div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => { setSelectedCategory('all'); setShowMobileRouteModal(false); }}
                      className={`p-2 rounded-xl border text-xs font-bold ${selectedCategory === 'all' ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-slate-200 border-gray-200 dark:border-slate-700'}`}
                    >
                      All Vehicles
                    </button>
                    <button
                      onClick={() => { setSelectedCategory('modern_electric'); setShowMobileRouteModal(false); }}
                      className={`p-2 rounded-xl border text-xs font-bold ${selectedCategory === 'modern_electric' ? 'bg-[#00B14F] text-white' : 'bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-slate-200 border-gray-200 dark:border-slate-700'}`}
                    >
                      ⚡ Modern EV
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 
            ==================================================================
            4. FLOATING TERMINAL BAY OCCUPANCY MODAL / POPOVER
            ==================================================================
          */}
          {showTerminalModal && (
            <div className="absolute top-20 left-3 sm:left-4 z-[1002] w-80 bg-white/95 dark:bg-[#1e2433]/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700/80 p-4 space-y-3 pointer-events-auto animate-fade-in text-gray-800 dark:text-gray-100">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-2">
                <div className="flex items-center gap-1.5 font-bold text-xs text-gray-900 dark:text-white">
                  <Building2 className="w-4 h-4 text-[#00B14F]" />
                  <span>Terminal Bay Capacity Radar</span>
                </div>
                <button
                  onClick={() => setShowTerminalModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 font-bold text-xs"
                >
                  ✕
                </button>
              </div>

              {terminals.map((term) => {
                const occupancyRate = Math.round((term.currentOccupiedBays / term.totalBays) * 100);
                return (
                  <div key={term.id} className="space-y-1 text-xs">
                    <div className="flex justify-between font-semibold">
                      <span className="text-gray-800 dark:text-gray-200">{term.code === 'PLMUN' ? 'PLMun Terminal' : 'Alabang South Station'}</span>
                      <span className="font-mono text-[#00B14F]">{term.currentOccupiedBays} / {term.totalBays} Bays</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div className="h-full bg-[#00B14F] rounded-full" style={{ width: `${occupancyRate}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 
            ==================================================================
            5. SIGNATURE RIDE-HAILING BOTTOM TRACKING DRAWER (Card 2)
            ==================================================================
          */}
          <div className="absolute bottom-2 left-2 right-2 lg:bottom-4 lg:left-auto lg:right-4 lg:w-[400px] z-[1001] pointer-events-auto">
            <div className="bg-white/95 dark:bg-[#1e2433]/95 backdrop-blur-2xl rounded-2xl lg:rounded-3xl shadow-2xl border border-gray-200/90 dark:border-slate-700/80 overflow-hidden transition-all duration-300">
              
              {/* Drag Handle & Toggle */}
              <button
                onClick={() => setIsBottomSheetExpanded(!isBottomSheetExpanded)}
                className="w-full pt-2 pb-1 flex flex-col items-center justify-center hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                title={isBottomSheetExpanded ? "Tap to collapse" : "Tap to expand details"}
              >
                <div className="w-10 h-1 bg-gray-300 dark:bg-slate-600 rounded-full group-hover:bg-gray-400 dark:group-hover:bg-slate-500 transition-colors"></div>
                <div className="text-[9px] font-bold text-gray-400 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                  {isBottomSheetExpanded ? (
                    <><span>COLLAPSE DRAWER</span><ChevronDown className="w-3 h-3" /></>
                  ) : (
                    <><span>MORE DETAILS & JEEPNEYS</span><ChevronUp className="w-3 h-3" /></>
                  )}
                </div>
              </button>

              {/* 
                ==============================================================
                A. COMPACT PEEK MODE (Default) - Card 2
                ==============================================================
              */}
              {!isBottomSheetExpanded ? (
                <div className="px-3.5 pb-3 pt-0.5 space-y-2">
                  {!activeJeepney ? (
                    /* Default state when NO vehicle has been clicked */
                    <div className="flex items-center justify-between">
                      <div 
                        onClick={() => setIsBottomSheetExpanded(true)}
                        className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0 pr-2"
                        title="Tap to see approaching jeepneys on this corridor"
                      >
                        <div className="w-10 h-10 rounded-xl bg-slate-800 dark:bg-slate-900 text-teal-400 border border-slate-700 flex items-center justify-center shadow-md shrink-0">
                          <Bus className="w-5 h-5" />
                        </div>
                        <div className="truncate">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-sm font-black text-gray-900 dark:text-white font-sans tracking-tight">
                              {filteredJeepneys.length > 0 
                                ? `${filteredJeepneys.length} Active PUJs on Corridor` 
                                : '0 Active PUJs on Corridor'}
                            </span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full border ${
                              filteredJeepneys.length > 0
                                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-[#00B14F] dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                            }`}>
                              {filteredJeepneys.length > 0 ? 'Live' : 'Standby'}
                            </span>
                          </div>
                          <div className="text-[11px] text-gray-500 dark:text-slate-400 font-medium truncate">
                            {filteredJeepneys.length > 0 
                              ? 'Click any jeepney on map or tap here to pick'
                              : 'Waiting for active driver trip broadcast • Staged at bay'}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => setIsBottomSheetExpanded(true)}
                        className="bg-gray-900 hover:bg-gray-800 dark:bg-[#0f172a] dark:hover:bg-slate-900 dark:border dark:border-slate-700 text-white px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1 shadow-md active:scale-95 transition-all shrink-0"
                      >
                        <span>VIEW FLEET</span>
                        <ChevronUp className="w-3.5 h-3.5 text-teal-400" />
                      </button>
                    </div>
                  ) : (
                    /* Active vehicle state */
                    <div className="flex items-center justify-between">
                      <div 
                        onClick={() => setIsBottomSheetExpanded(true)}
                        className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0 pr-2"
                        title="Tap for vehicle & route details"
                      >
                        <div className="h-10 min-w-[54px] px-2 rounded-xl bg-gradient-to-br from-[#00B14F] to-emerald-700 text-white flex items-center justify-center font-black font-mono text-xs shadow-md shrink-0 whitespace-nowrap">
                          {activeJeepney.jeepneyCode}
                        </div>
                        <div className="truncate">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-lg font-black text-gray-900 dark:text-white font-sans tracking-tight">
                              {activeJeepney.etaMinutes ? `${activeJeepney.etaMinutes} MINS` : 'READY'}
                            </span>
                            <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                              {activeJeepney.status.replace('_', ' ')}
                            </span>
                          </div>
                          <div className="text-[11px] text-gray-500 dark:text-slate-400 font-medium truncate">
                            {seatsFree} seats free • {activeJeepney.driverName}
                          </div>
                        </div>
                      </div>

                      {/* Compact Primary Track Button + Deselect Button */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => {
                            if (activeJeepney) setSelectedJeepneyId(activeJeepney.id);
                          }}
                          className="bg-[#00B14F] hover:bg-[#009e45] text-white px-3 py-2 rounded-xl font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
                        >
                          <Navigation className="w-3.5 h-3.5 fill-current rotate-45" />
                          <span>TRACK</span>
                        </button>

                        <button
                          onClick={() => handleToggleArrivalAlert(activeJeepney)}
                          className={`p-2 rounded-xl border transition-all ${
                            arrivalAlertSet ? 'bg-amber-500 text-white border-amber-600' : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700 border-gray-200 dark:border-slate-700'
                          }`}
                          title={arrivalAlertSet ? "Proximity Alert Active (Click to cancel)" : "Notify when 2 mins away"}
                        >
                          <Bell className={`w-4 h-4 ${arrivalAlertSet ? 'fill-current' : ''}`} />
                        </button>

                        <button
                          onClick={() => setSelectedJeepneyId(null)}
                          className="p-2 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-400 dark:text-slate-400 hover:text-gray-700 dark:hover:text-white transition-colors"
                          title="Deselect jeepney"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* 
                  ============================================================
                  B. EXPANDED MODE (When commuter pulls up or taps drawer)
                  ============================================================
                */
                <div className="p-3.5 space-y-3 max-h-[50vh] overflow-y-auto">
                  <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-1.5">
                    <span className="text-xs font-extrabold text-gray-800 dark:text-white uppercase tracking-wide">
                      {activeJeepney ? `Tracking PUJ ${activeJeepney.jeepneyCode}` : `Corridor Fleet (${filteredJeepneys.length} Vehicles)`}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {activeJeepney && (
                        <button
                          onClick={() => setSelectedJeepneyId(null)}
                          className="text-[10px] font-bold text-gray-500 dark:text-slate-400 hover:text-red-600 px-2 py-0.5 rounded bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                        >
                          Deselect
                        </button>
                      )}
                      <button
                        onClick={() => setIsBottomSheetExpanded(false)}
                        className="p-1 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                        title="Close drawer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Informational Callout when no jeepney is selected */}
                  {!activeJeepney && (
                    <div className="p-3 rounded-2xl bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950/40 dark:to-emerald-950/40 border border-teal-200/70 dark:border-teal-800/60 text-xs text-teal-900 dark:text-teal-200 space-y-1">
                      <div className="font-extrabold flex items-center gap-1.5 text-teal-950 dark:text-teal-100">
                        <Bus className="w-4 h-4 text-[#00B14F]" />
                        <span>Select a Jeepney to Track Live</span>
                      </div>
                      <p className="text-[11px] text-teal-700 dark:text-teal-300 leading-relaxed">
                        Click any vehicle marker directly on the interactive map, or tap any approaching jeepney below to view real-time arrival countdown, remaining seats, and verified driver info.
                      </p>
                    </div>
                  )}
                  
                  {/* Hero Nearest Vehicle Banner */}
                  {activeJeepney && (
                    <div className="bg-gradient-to-br from-gray-50 to-white dark:from-[#141a29] dark:to-[#1e2433] rounded-2xl p-3 border border-gray-200 dark:border-slate-800 shadow-2xs space-y-2">
                      
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="h-12 min-w-[58px] px-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center shadow-md font-black font-mono text-sm shrink-0 whitespace-nowrap">
                            {activeJeepney.jeepneyCode}
                          </div>

                          <div>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-mono">
                                {activeJeepney.status.replace('_', ' ')}
                              </span>
                              <span className="text-[10px] text-gray-400 dark:text-slate-400 font-mono">
                                • {activeJeepney.plateNumber}
                              </span>
                            </div>

                            <div className="flex items-baseline gap-1.5 mt-0.5">
                              <span className="text-xl font-black text-gray-900 dark:text-white font-sans tracking-tight">
                                {activeJeepney.etaMinutes ? `${activeJeepney.etaMinutes} MINS` : 'READY'}
                              </span>
                              <span className="text-[11px] font-semibold text-gray-500 dark:text-slate-400">
                                ({activeJeepney.distanceRemainingKm || 1.2} km away)
                              </span>
                            </div>

                            <p className="text-[11px] text-gray-600 dark:text-slate-300 truncate max-w-[200px]">
                              Next: <strong className="text-gray-900 dark:text-white">{activeJeepney.nextStopName || 'Poblacion'}</strong>
                            </p>
                          </div>
                        </div>

                        {/* Verified Rating & Driver */}
                        <div className="text-right">
                          <div className="flex items-center justify-end gap-1 text-xs font-extrabold text-gray-900 dark:text-white">
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />
                            <span>4.9</span>
                          </div>
                          <div className="text-[10px] text-gray-500 dark:text-slate-400 font-medium">
                            {activeJeepney.driverName}
                          </div>
                          <div className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-end gap-0.5 mt-0.5">
                            <ShieldCheck className="w-3 h-3" /> Accredited
                          </div>
                        </div>
                      </div>

                      {/* Seat Capacity Bar */}
                      <div className="bg-white dark:bg-[#141a29] rounded-xl p-2 border border-gray-200 dark:border-slate-800 space-y-1 shadow-2xs">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-gray-500 dark:text-slate-400 font-medium flex items-center gap-1">
                            <Users className="w-3 h-3 text-[#00B14F]" /> Passenger Capacity
                          </span>
                          <span className="font-mono font-bold text-gray-900 dark:text-white">
                            {activeJeepney.currentPassengers} / {activeJeepney.capacity} Seats ({seatsFree} Free)
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              seatsFree > 5 ? 'bg-[#00B14F]' : seatsFree > 0 ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${Math.round((activeJeepney.currentPassengers / activeJeepney.capacity) * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Horizontal Scrollable Approaching Vehicles on Corridor */}
                  <div>
                    <div className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                      <span>{activeJeepney ? 'Other Vehicles on Corridor' : 'Approaching Vehicles on Corridor'}</span>
                      {filteredJeepneys.length > 0 && (
                        <span className="text-[9px] text-[#00B14F] font-bold">Tap to select</span>
                      )}
                    </div>

                    {filteredJeepneys.length === 0 ? (
                      <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#141a29] border border-gray-200 dark:border-slate-800 text-center space-y-1">
                        <div className="text-xs font-bold text-gray-800 dark:text-slate-200">
                          Corridor Currently in Standby
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-slate-400 leading-relaxed">
                          Units will broadcast live coordinates as soon as drivers sign in to the Driver Console and start their route.
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                        {filteredJeepneys.map((puj) => {
                          const isCurrent = activeJeepney ? puj.id === activeJeepney.id : false;
                          const freeSeats = puj.capacity - puj.currentPassengers;

                          return (
                            <div
                              key={puj.id}
                              onClick={() => setSelectedJeepneyId(puj.id)}
                              className={`min-w-[120px] p-2 rounded-xl border transition-all cursor-pointer select-none ${
                                isCurrent
                                  ? 'bg-emerald-50/80 dark:bg-emerald-950/50 border-[#00B14F] ring-2 ring-[#00B14F]/30 shadow-xs'
                                  : 'bg-gray-50 dark:bg-[#141a29] hover:bg-gray-100 dark:hover:bg-slate-800 border-gray-200 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-mono font-bold text-xs text-gray-900 dark:text-white">{puj.jeepneyCode}</span>
                                <span className="text-[10px] font-mono font-bold text-[#00B14F]">
                                  {puj.etaMinutes ? `${puj.etaMinutes}m` : '0m'}
                                </span>
                              </div>
                              <div className="text-[9px] text-gray-500 dark:text-slate-400 mt-0.5 truncate">
                                {puj.driverName}
                              </div>
                              <div className="text-[9px] font-semibold text-emerald-700 dark:text-emerald-400">
                                {freeSeats} seats free
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Primary CTA Buttons */}
                  {activeJeepney && (
                    <div className="flex items-center gap-2 pt-0.5">
                      <button
                        onClick={() => {
                          if (activeJeepney) setSelectedJeepneyId(activeJeepney.id);
                        }}
                        className="flex-1 bg-gradient-to-r from-[#00B14F] to-emerald-600 hover:from-[#009e45] text-white py-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all"
                      >
                        <Navigation className="w-3.5 h-3.5 fill-current rotate-45" />
                        <span>TRACK {activeJeepney.jeepneyCode} LIVE</span>
                      </button>

                      <button
                        onClick={() => handleToggleArrivalAlert(activeJeepney)}
                        className={`p-3 rounded-xl border transition-all active:scale-95 ${
                          arrivalAlertSet
                            ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                            : 'bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700'
                        }`}
                        title={arrivalAlertSet ? 'Proximity Alert Active (Click to cancel)' : 'Notify when 2 mins away'}
                      >
                        <Bell className={`w-4 h-4 ${arrivalAlertSet ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </TransitMap>
      </div>
    </div>
  );
};
