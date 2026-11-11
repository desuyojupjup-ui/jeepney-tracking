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
    const confirmLogout = window.confirm('End shift and sign out of the Driver Console? GPS broadcasting will cease and unit will go offline.');
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
      const confirmEnd = window.confirm(`End current trip and dock at ${direction === 'PLMun_to_Alabang' ? 'Alabang South Station' : 'PLMun Terminal'}?`);
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
        alert('Could not access device GPS sensor. Switched back to Corridor GPS Simulator.');
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 5000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [useDeviceGps, activeJeepney.id]);

  return (
    <div className="max-w-md lg:max-w-5xl mx-auto px-3 sm:px-4 py-4 space-y-4 font-sans text-slate-900 dark:text-slate-100">
      
      {/* Toast Notification when SOS is sent */}
      {sosSentToast && (
        <div className="fixed top-20 left-4 right-4 z-50 bg-rose-600 text-white p-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-fade-in border border-rose-400">
          <AlertTriangle className="w-5 h-5 text-white animate-pulse shrink-0" />
          <div className="text-xs">
            <span className="font-bold block">Alert Broadcasted Live to Control Center</span>
            <span>Dispatch and online commuters have received the incident coordinates.</span>
          </div>
        </div>
      )}

      {/* Top Driver & Unit Identification Card (Fully Mobile-Responsive & Collision-Free) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 sm:p-3.5 shadow-sm dark:shadow-xl transition-colors">
        <div className="flex items-center justify-between gap-3">
          {/* Left: Unit Badge & Driver Identification */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <div className="h-10 min-w-[46px] sm:min-w-[50px] px-2 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center font-black font-mono text-xs sm:text-sm tracking-tight text-white shadow-sm shrink-0 whitespace-nowrap">
              {activeJeepney.jeepneyCode}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <h1 className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-base leading-tight truncate">
                  {activeDriverName}
                </h1>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-mono leading-tight mt-0.5 truncate">
                {currentDriver?.username ? (
                  <>
                    <span>@{currentDriver.username}</span>
                    <span className="hidden sm:inline"> • Lic: {activeLicense}</span>
                  </>
                ) : (
                  <span>Lic: {activeLicense}</span>
                )}
              </p>
            </div>
          </div>

          {/* Right: Duty Status Badge & Corridor Route */}
          <div className="text-right shrink-0 flex flex-col items-end justify-center pl-2.5 sm:pl-3 border-l border-slate-200/80 dark:border-slate-800">
            <button
              type="button"
              onClick={handleToggleDutyStatus}
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border whitespace-nowrap cursor-pointer shadow-xs ${
                activeDutyStatus === 'on_duty' 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800' 
                  : 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
              }`}
              title="Click to toggle Shift Status"
            >
              {activeDutyStatus === 'on_duty' ? 'ON DUTY' : 'ON BREAK'}
            </button>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-mono font-bold whitespace-nowrap flex items-center gap-1">
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">PLMun</span>
              <span className="text-slate-400">⇄</span>
              <span>Alabang</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grab Rider Live Navigation Map */}
      <div className="space-y-3">
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

        {/* GPS Telemetry Diagnostic Status Banner */}
        <div className={`p-3 rounded-2xl border flex items-center justify-between text-xs transition-all shadow-sm ${
          isTripActive 
            ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-200 dark:border-emerald-800/80 text-emerald-900 dark:text-emerald-200' 
            : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
        }`}>
          <div className="flex items-center gap-2.5">
            <Radio className={`w-4 h-4 ${isTripActive ? 'text-emerald-600 dark:text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
            <div>
              <div className="font-extrabold uppercase tracking-wider text-[11px]">
                {isTripActive ? 'GPS Live Mesh Broadcasting' : 'GPS Standby (Docked at Bay)'}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                Acc: ±{activeJeepney.accuracyMeters}m | Lat: {activeJeepney.currentLat.toFixed(4)}° | Lng: {activeJeepney.currentLng.toFixed(4)}°
              </div>
            </div>
          </div>

          {/* Real Device GPS Hardware Toggle */}
          <button
            onClick={() => setUseDeviceGps(!useDeviceGps)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[10px] font-mono font-bold transition-all shadow-sm ${
              useDeviceGps
                ? 'bg-emerald-600 text-white border-emerald-500'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
            title="Toggle Hardware Phone/Laptop GPS Sensor"
          >
            <LocateFixed className="w-3 h-3" />
            <span>{useDeviceGps ? 'Phone GPS' : 'Corridor GPS'}</span>
          </button>
        </div>

        {/* Big Emergency SOS Button */}
        <div className="bg-rose-50 dark:bg-rose-950/60 border-2 border-rose-400 dark:border-rose-800 rounded-2xl p-4 sm:p-5 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <AlertOctagon className="w-7 h-7 animate-pulse" />
            </div>
            <div>
              <div className="text-sm sm:text-base font-black text-rose-900 dark:text-rose-100">
                Emergency Assistance & Panic Distress
              </div>
              <div className="text-xs text-rose-700 dark:text-rose-300">
                Immediately transmits your vehicle GPS coordinates to the Admin Control Center.
              </div>
            </div>
          </div>

          <button
            onClick={handleTriggerEmergencySos}
            className="w-full sm:w-auto py-3.5 px-6 rounded-2xl text-sm font-black bg-rose-600 hover:bg-rose-700 active:scale-95 text-white shadow-xl shadow-rose-900/40 flex items-center justify-center gap-2 shrink-0 transition-all cursor-pointer ring-2 ring-rose-400"
          >
            <AlertOctagon className="w-5 h-5 animate-pulse" />
            <span>EMERGENCY SOS DISTRESS</span>
          </button>
        </div>

        {/* Driver Shift Checklist & Terminal Hotline */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-xs text-slate-600 dark:text-slate-400 space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
            <span>Terminal Operations Hotline:</span>
            <span className="font-mono text-emerald-600 dark:text-teal-400 font-bold">0917-800-PLMUN</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            GPS coordinates and speed are streamed in real time to the Muntinlupa Control Center and the Commuter Live Map.
          </p>
        </div>
      </div>

      {/* Road Hazard Report Modal */}
      {showHazardModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 max-w-sm w-full space-y-3.5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>Report Incident to Dispatch</span>
              </h3>
              <button 
                onClick={() => setShowHazardModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              Select the condition currently affecting Unit <strong>{activeJeepney.jeepneyCode}</strong>:
            </p>

            <select
              value={hazardReason}
              onChange={(e) => setHazardReason(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 font-medium"
            >
              <option value="Heavy traffic congestion along Manila South Road">Heavy traffic congestion</option>
              <option value="Road works / Lane closure near Putatan Plaza">Road works / Lane closure</option>
              <option value="Minor collision / obstruction along corridor">Traffic accident / Obstruction</option>
              <option value="Flash flood / deep puddle after heavy rain">Flash flood / Puddle along route</option>
              <option value="Flat tire / mechanical check required">Flat tire / Mechanical issue</option>
            </select>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowHazardModal(false)}
                className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendHazardAlert}
                className="flex-1 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md"
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
