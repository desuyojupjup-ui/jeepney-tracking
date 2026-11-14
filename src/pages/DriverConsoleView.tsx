import React, { useState, useEffect, useRef } from 'react';
import { Jeepney, Terminal, RouteStop, TripDirection } from '../types';
import { useAuth } from '../context/AuthContext';
import { useTransit } from '../context/TransitContext';
import { PLMUN_ALABANG_PATH } from '../data/mockData';
import { interpolatePositionOnPath } from '../utils/geoUtils';
import { 
  Play, 
  Square, 
  Radio, 
  Navigation, 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  Gauge, 
  Users, 
  Compass, 
  CheckCircle2, 
  MapPin, 
  UserCheck, 
  LocateFixed, 
  AlertOctagon,
  ArrowRightLeft,
  ChevronDown
} from 'lucide-react';
import { DriverGrabMap } from '../components/map/DriverGrabMap';

interface DriverConsoleViewProps {
  assignedJeepney?: Jeepney;
  terminals: Terminal[];
  stops: RouteStop[];
  onLogout?: () => void;
  onRequestSignOut?: () => void;
}

export const DriverConsoleView: React.FC<DriverConsoleViewProps> = ({
  assignedJeepney: propJeepney,
  terminals,
  stops,
  onLogout,
  onRequestSignOut,
}) => {
  const { currentDriver, logoutDriver, updateDriver } = useAuth();
  const { 
    jeepneys, 
    updateJeepney,
    updateJeepneyPassengers, 
    startTrip, 
    endTrip, 
    triggerSosAlert, 
    updateJeepneyLocation 
  } = useTransit();

  const fallbackUnit: Jeepney = {
    id: 'puj-standby',
    jeepneyCode: 'PLM-01',
    plateNumber: 'NCS-4182',
    modelType: 'modern_euro4',
    capacity: 20,
    currentPassengers: 0,
    status: 'at_terminal',
    currentLat: 14.3854,
    currentLng: 121.0422,
    heading: 90,
    speedKmh: 0,
    accuracyMeters: 4.0,
    lastGpsUpdate: 'Just now',
    direction: 'PLMun_to_Alabang',
    destinationName: 'Alabang South Station',
    nextStopName: 'PLMun Main Terminal',
    etaMinutes: 0,
    distanceRemainingKm: 0,
  };

  // Find dynamic jeepney assigned to current logged-in driver from live TransitContext
  const activeJeepney = (currentDriver?.assignedJeepneyId && jeepneys.find(j => j.id === currentDriver.assignedJeepneyId))
    || (currentDriver && jeepneys.find(j => j.driverName?.toLowerCase() === currentDriver.fullName.toLowerCase()))
    || (propJeepney && jeepneys.find(j => j.id === propJeepney.id))
    || jeepneys[0]
    || fallbackUnit;

  const [useDeviceGps, setUseDeviceGps] = useState<boolean>(false);
  const [direction, setDirection] = useState<TripDirection>(activeJeepney.direction || 'PLMun_to_Alabang');
  const [showHazardModal, setShowHazardModal] = useState<boolean>(false);
  const [hazardReason, setHazardReason] = useState<string>('Heavy traffic jam / congestion at Putatan');
  const [sosSentToast, setSosSentToast] = useState<boolean>(false);

  const isTripActive = activeJeepney.status === 'en_route';
  const activeDriverName = currentDriver?.fullName || activeJeepney.driverName || 'Juan Dela Cruz';
  const activeLicense = currentDriver?.licenseNumber || 'N02-14-089234';
  const activeDutyStatus = currentDriver?.status || 'on_duty';

  const handleToggleDutyStatus = () => {
    if (!currentDriver) return;
    const nextStatus = activeDutyStatus === 'on_duty' ? 'on_break' : 'on_duty';
    updateDriver(currentDriver.id, { status: nextStatus });
    if (nextStatus === 'on_break') {
      updateJeepney(activeJeepney.id, { status: 'at_terminal', speedKmh: 0 });
    }
  };

  const handleEndShift = () => {
    if (onRequestSignOut) {
      onRequestSignOut();
      return;
    }
    const confirmLogout = window.confirm('End shift and sign out? Your vehicle will go offline.');
    if (confirmLogout) {
      if (isTripActive) {
        endTrip(activeJeepney.id);
      }
      updateJeepney(activeJeepney.id, {
        status: 'offline',
        speedKmh: 0,
        etaMinutes: 0,
        distanceRemainingKm: 0,
        lastGpsUpdate: 'Offline',
      });
      logoutDriver();
      if (onLogout) onLogout();
    }
  };

  // Bring driver's assigned jeepney online at terminal upon opening the console
  useEffect(() => {
    if (activeJeepney.status === 'offline') {
      updateJeepney(activeJeepney.id, {
        status: 'at_terminal',
        driverName: activeDriverName,
        assignedDriverId: currentDriver?.id,
        direction: direction,
        speedKmh: 0,
        lastGpsUpdate: 'Just now',
      });
    }
  }, [activeJeepney.id, activeJeepney.status, activeDriverName, currentDriver?.id, direction, updateJeepney]);

  // Passenger Count Actions
  const handlePassengerChange = (delta: number) => {
    const newCount = Math.max(0, Math.min(activeJeepney.capacity, activeJeepney.currentPassengers + delta));
    updateJeepneyPassengers(activeJeepney.id, newCount);
  };

  // Start / End Trip Actions
  const handleToggleTrip = () => {
    if (isTripActive) {
      const confirmEnd = window.confirm(`End current trip and arrive at ${direction === 'PLMun_to_Alabang' ? 'Alabang South Station' : 'PLMun Terminal'}?`);
      if (confirmEnd) {
        endTrip(activeJeepney.id);
        progressRef.current = 0.05;
        // Switch next planned direction
        setDirection(prev => prev === 'PLMun_to_Alabang' ? 'Alabang_to_PLMun' : 'PLMun_to_Alabang');
      }
    } else {
      progressRef.current = 0.05;
      startTrip(activeJeepney.id, direction);
    }
  };

  // Active Trip GPS Progression Loop (simulates driving along corridor when not using hardware GPS)
  const progressRef = useRef<number>(0.05);

  useEffect(() => {
    if (!isTripActive || useDeviceGps) return;

    const interval = setInterval(() => {
      progressRef.current += 0.015;
      if (progressRef.current >= 0.98) {
        // Automatically dock at destination terminal
        endTrip(activeJeepney.id);
        progressRef.current = 0.05;
        setDirection(prev => prev === 'PLMun_to_Alabang' ? 'Alabang_to_PLMun' : 'PLMun_to_Alabang');
        return;
      }

      const roadPos = interpolatePositionOnPath(PLMUN_ALABANG_PATH, progressRef.current, direction);
      const remainingKm = Math.max(0.1, +(5.2 * (1 - progressRef.current)).toFixed(1));
      const etaMins = Math.max(1, Math.round((remainingKm / 24) * 60));
      const speed = Math.round(22 + Math.random() * 8);

      // Determine next stop landmark
      const nextStop = direction === 'PLMun_to_Alabang'
        ? (progressRef.current < 0.25 ? 'Poblacion Health Center' : progressRef.current < 0.5 ? 'Muntinlupa City Hall' : progressRef.current < 0.75 ? 'Bayanan Public Market' : 'Alabang South Station')
        : (progressRef.current < 0.25 ? 'Montillano St. Junction' : progressRef.current < 0.5 ? 'Bayanan Public Market' : progressRef.current < 0.75 ? 'Muntinlupa City Hall' : 'PLMun Terminal');

      updateJeepney(activeJeepney.id, {
        currentLat: roadPos.lat,
        currentLng: roadPos.lng,
        heading: roadPos.bearing,
        speedKmh: speed,
        distanceRemainingKm: remainingKm,
        etaMinutes: etaMins,
        nextStopName: nextStop,
        lastGpsUpdate: 'Just now',
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [isTripActive, useDeviceGps, activeJeepney.id, direction, endTrip, updateJeepney]);

  // Emergency SOS Trigger
  const handleTriggerEmergencySos = () => {
    triggerSosAlert(
      activeJeepney.id,
      activeDriverName,
      `EMERGENCY SOS: Driver reported immediate vehicle breakdown or medical emergency near ${activeJeepney.nextStopName || 'corridor'}.`,
      'EMERGENCY_SOS',
      'critical'
    );
    setSosSentToast(true);
    setTimeout(() => setSosSentToast(false), 5000);
  };

  // Road Hazard Trigger
  const handleSendHazardAlert = () => {
    triggerSosAlert(
      activeJeepney.id,
      activeDriverName,
      `ROAD HAZARD: ${hazardReason} reported by Unit ${activeJeepney.jeepneyCode}.`,
      'ROUTE_DEVIATION',
      'high'
    );
    setShowHazardModal(false);
    setSosSentToast(true);
    setTimeout(() => setSosSentToast(false), 5000);
  };

  // Optional Real Device Geolocation Watcher
  useEffect(() => {
    if (!useDeviceGps || !navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, speed, heading } = position.coords;
        const speedKmh = speed ? Math.round(speed * 3.6) : activeJeepney.speedKmh;
        updateJeepneyLocation(activeJeepney.id, latitude, longitude, speedKmh, heading || activeJeepney.heading);
      },
      (err) => {
        console.warn('HTML5 Geolocation watch error:', err.message);
        setUseDeviceGps(false);
        alert('Could not access device GPS sensor. Switched back to Simulated GPS.');
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 5000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [useDeviceGps, activeJeepney.id]);

  return (
    <div className="max-w-md lg:max-w-5xl mx-auto px-3 sm:px-6 py-3 sm:py-5 space-y-3 sm:space-y-4 font-sans text-slate-900 dark:text-slate-100 pb-16">
      
      {/* Toast Notification when SOS is sent */}
      {sosSentToast && (
        <div className="fixed top-20 left-4 right-4 z-50 bg-rose-600 text-white p-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-fade-in border border-rose-400">
          <AlertTriangle className="w-6 h-6 text-white animate-pulse shrink-0" />
          <div className="text-xs">
            <span className="font-bold block text-sm">Emergency Alert Sent</span>
            <span>Dispatch and passengers have received your vehicle location.</span>
          </div>
        </div>
      )}

      {/* Top Driver & Unit Identification Card (Compact 1-Row Responsive Header) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2.5 sm:p-3.5 shadow-sm transition-colors">
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          
          {/* Left: Unit Badge & Driver Identification */}
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
            <div className="h-9 min-w-[44px] sm:h-10 sm:min-w-[50px] px-2 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center font-black font-mono text-xs sm:text-sm tracking-tight text-white shadow-xs shrink-0 whitespace-nowrap">
              {activeJeepney.jeepneyCode}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <h1 className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm leading-tight truncate">
                  {activeDriverName}
                </h1>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-mono leading-tight mt-0.5 truncate">
                {currentDriver?.username ? `@${currentDriver.username}` : `Lic: ${activeLicense}`}
              </p>
            </div>
          </div>

          {/* Right: Duty Status Badge & Route Info */}
          <div className="text-right shrink-0 flex flex-col items-end justify-center pl-2 sm:pl-3 border-l border-slate-200/80 dark:border-slate-800">
            <button
              type="button"
              onClick={handleToggleDutyStatus}
              className={`px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all border whitespace-nowrap cursor-pointer shadow-xs ${
                activeDutyStatus === 'on_duty' 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800 hover:bg-emerald-100' 
                  : 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800 hover:bg-amber-100'
              }`}
              title="Tap to toggle shift status"
            >
              {activeDutyStatus === 'on_duty' ? 'ON DUTY' : 'ON BREAK'}
            </button>
            <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono font-bold whitespace-nowrap flex items-center gap-1">
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">PLMun</span>
              <span className="text-slate-400">⇄</span>
              <span>Alabang</span>
            </div>
          </div>
        </div>
      </div>

      {/* Live Navigation Map */}
      <div className="space-y-3.5 sm:space-y-4">
        {/* Grab Rider Map Component */}
        <DriverGrabMap
          activeJeepney={activeJeepney}
          terminals={terminals}
          stops={stops}
          direction={direction}
          isTripActive={isTripActive}
          onPassengerChange={handlePassengerChange}
          onToggleTrip={handleToggleTrip}
          onTriggerSos={handleTriggerEmergencySos}
          onTriggerHazard={() => setShowHazardModal(true)}
          otherJeepneys={jeepneys}
          activeDriverName={activeDriverName}
          activeLicense={activeLicense}
          activeDutyStatus={activeDutyStatus}
          onToggleDutyStatus={handleToggleDutyStatus}
          onEndShift={handleEndShift}
          onToggleDirection={() => setDirection(prev => prev === 'PLMun_to_Alabang' ? 'Alabang_to_PLMun' : 'PLMun_to_Alabang')}
        />

        {/* GPS Live Status Banner (Simplified Wording & Clean Spacing) */}
        <div className={`p-3.5 sm:p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs transition-all shadow-sm ${
          isTripActive 
            ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-200 dark:border-emerald-800/80 text-emerald-900 dark:text-emerald-200' 
            : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
        }`}>
          <div className="flex items-center gap-3 min-w-0">
            <Radio className={`w-5 h-5 shrink-0 ${isTripActive ? 'text-emerald-600 dark:text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
            <div className="min-w-0">
              <div className="font-extrabold uppercase tracking-wider text-xs truncate">
                {isTripActive ? 'GPS Online (Broadcasting)' : 'GPS Standby (Parked)'}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                {isTripActive ? 'Signal Strong • Live updates streaming' : 'Ready to start trip • Location locked'}
              </div>
            </div>
          </div>

          {/* Real Device GPS Hardware Toggle */}
          <button
            onClick={() => setUseDeviceGps(!useDeviceGps)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer ${
              useDeviceGps
                ? 'bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-700'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
            }`}
            title="Toggle between phone GPS and simulated GPS"
          >
            <LocateFixed className="w-3.5 h-3.5" />
            <span>{useDeviceGps ? 'Phone GPS' : 'Simulated GPS'}</span>
          </button>
        </div>

        {/* Emergency SOS Button (Driver-Friendly & Accessible) */}
        <div className="bg-rose-50 dark:bg-rose-950/60 border-2 border-rose-400 dark:border-rose-800 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <AlertOctagon className="w-7 h-7 animate-pulse" />
            </div>
            <div>
              <div className="text-sm sm:text-base font-black text-rose-900 dark:text-rose-100">
                Emergency SOS Help
              </div>
              <div className="text-xs text-rose-700 dark:text-rose-300 mt-0.5">
                Sends your vehicle location immediately to the terminal dispatch team.
              </div>
            </div>
          </div>

          <button
            onClick={handleTriggerEmergencySos}
            className="w-full sm:w-auto py-3.5 px-6 rounded-2xl text-sm font-black bg-rose-600 hover:bg-rose-700 active:scale-95 text-white shadow-xl shadow-rose-900/40 flex items-center justify-center gap-2 shrink-0 transition-all cursor-pointer ring-2 ring-rose-400"
          >
            <AlertOctagon className="w-5 h-5 animate-pulse" />
            <span>SEND EMERGENCY SOS</span>
          </button>
        </div>

        {/* Driver Shift Checklist & Terminal Hotline */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-4.5 text-xs text-slate-600 dark:text-slate-400 space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
            <span>Terminal Hotline:</span>
            <span className="font-mono text-emerald-600 dark:text-teal-400 font-bold text-xs sm:text-sm">0917-800-PLMUN</span>
          </div>
          <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            Your vehicle location and speed are shared live with dispatch and passengers.
          </p>
        </div>
      </div>

      {/* Road Hazard Report Modal */}
      {showHazardModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl sm:rounded-3xl p-5 sm:p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
                <span>Report Road Problem</span>
              </h3>
              <button 
                onClick={() => setShowHazardModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Select what is happening on the road for Unit <strong>{activeJeepney.jeepneyCode}</strong>:
            </p>

            <select
              value={hazardReason}
              onChange={(e) => setHazardReason(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 font-medium"
            >
              <option value="Heavy traffic jam along Manila South Road">Heavy traffic jam</option>
              <option value="Road works / Lane closed near Putatan Plaza">Road works / Lane closed</option>
              <option value="Car accident / Road blocked along route">Car accident / Road blocked</option>
              <option value="Flooding / Deep water along route">Flooding / High water</option>
              <option value="Flat tire / Engine breakdown">Flat tire / Engine breakdown</option>
            </select>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowHazardModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs sm:text-sm cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendHazardAlert}
                className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs sm:text-sm shadow-md cursor-pointer transition-colors"
              >
                Send Alert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
