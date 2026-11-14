import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  Polyline, 
  Marker, 
  Popup, 
  Circle,
  useMap 
} from 'react-leaflet';
import L from 'leaflet';
import { Jeepney, Terminal, RouteStop, TripDirection } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { PLMUN_ALABANG_PATH } from '../../data/mockData';
import { 
  CornerUpLeft, 
  CornerUpRight, 
  ArrowUp, 
  Mic, 
  Search, 
  Volume2, 
  VolumeX, 
  Compass as CompassIcon, 
  MessageSquarePlus, 
  LocateFixed, 
  Layers, 
  X, 
  Users, 
  ArrowUpDown, 
  AlertTriangle,
  Radio,
  Clock,
  ShieldCheck,
  ChevronUp,
  ChevronDown,
  Gauge,
  ArrowRightLeft
} from 'lucide-react';

interface DriverGrabMapProps {
  activeJeepney: Jeepney;
  terminals: Terminal[];
  stops: RouteStop[];
  direction: TripDirection;
  isTripActive: boolean;
  onPassengerChange?: (delta: number) => void;
  onToggleTrip?: () => void;
  onTriggerSos?: () => void;
  onTriggerHazard?: () => void;
  otherJeepneys?: Jeepney[];
  activeDriverName?: string;
  activeLicense?: string;
  activeDutyStatus?: string;
  onToggleDutyStatus?: () => void;
  onEndShift?: () => void;
  onToggleDirection?: () => void;
}

// Controller to smoothly pan to the driver's vehicle without bouncing or shaking
function DriverNavController({ 
  coords, 
  heading, 
  isAutoFollowActive, 
  setIsAutoFollowActive 
}: { 
  coords: [number, number]; 
  heading: number; 
  isAutoFollowActive: boolean;
  setIsAutoFollowActive: (active: boolean) => void;
}) {
  const map = useMap();
  const lastPanRef = useRef<string>('');

  useEffect(() => {
    const handleDragStart = () => {
      setIsAutoFollowActive(false);
    };

    map.on('dragstart', handleDragStart);
    return () => {
      map.off('dragstart', handleDragStart);
    };
  }, [map, setIsAutoFollowActive]);

  useEffect(() => {
    if (!isAutoFollowActive) return;

    // Immediately pan to vehicle when auto-follow is active or restored
    map.panTo(coords, {
      animate: true,
      duration: 0.6,
      easeLinearity: 0.25,
    });
    lastPanRef.current = `${coords[0].toFixed(5)},${coords[1].toFixed(5)}`;
  }, [isAutoFollowActive]);

  useEffect(() => {
    if (!isAutoFollowActive) return;

    const key = `${coords[0].toFixed(5)},${coords[1].toFixed(5)}`;
    if (lastPanRef.current === key) return;
    lastPanRef.current = key;

    const currentCenter = map.getCenter();
    const distance = map.distance(currentCenter, L.latLng(coords[0], coords[1]));

    if (distance > 15) {
      map.panTo(coords, {
        animate: true,
        duration: 0.8,
        easeLinearity: 0.25,
      });
    }
  }, [coords, isAutoFollowActive, map]);

  return null;
}

// Leaflet Resize Handler
function MapResizer() {
  const map = useMap();

  useEffect(() => {
    map.invalidateSize();
    const t1 = setTimeout(() => map.invalidateSize(), 80);
    const t2 = setTimeout(() => map.invalidateSize(), 300);
    const t3 = setTimeout(() => map.invalidateSize(), 800);

    const handleResize = () => map.invalidateSize();
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      window.removeEventListener('resize', handleResize);
    };
  }, [map]);

  return null;
}

export const DriverGrabMap: React.FC<DriverGrabMapProps> = ({
  activeJeepney,
  terminals,
  stops,
  direction,
  isTripActive,
  onPassengerChange,
  onToggleTrip,
  onTriggerSos,
  onTriggerHazard,
  otherJeepneys = [],
  activeDriverName = 'Juan Dela Cruz',
  activeLicense = 'N02-14-089234',
  activeDutyStatus = 'on_duty',
  onToggleDutyStatus,
  onEndShift,
  onToggleDirection,
}) => {
  const { theme } = useTheme();
  const [isAutoFollowActive, setIsAutoFollowActive] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [voiceToast, setVoiceToast] = useState<string | null>(null);
  const [bottomSheetExpanded, setBottomSheetExpanded] = useState(false);
  const [mapLayer, setMapLayer] = useState<'streets' | 'satellite'>('streets');

  const vehicleCoords: [number, number] = [
    activeJeepney.currentLat || 14.3854,
    activeJeepney.currentLng || 121.0422,
  ];

  // Recenter camera on the driver vehicle
  const handleRecenter = () => {
    setIsAutoFollowActive(true);
  };

  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    setVoiceToast(next ? 'Voice guidance muted' : 'Voice guidance enabled');
    setTimeout(() => setVoiceToast(null), 3000);
  };

  // Next Stop & Distance determination
  const nextStop = activeJeepney.nextStopName || (
    direction === 'PLMun_to_Alabang' ? 'Muntinlupa City Hall' : 'Montillano St. Junction'
  );

  const thenNextStop = direction === 'PLMun_to_Alabang' 
    ? 'Bayanan Public Market' 
    : 'PLMun Terminal';

  const distanceText = activeJeepney.distanceRemainingKm !== undefined
    ? `${(activeJeepney.distanceRemainingKm * 1000 > 1000) 
        ? `${activeJeepney.distanceRemainingKm.toFixed(1)} km` 
        : `${Math.round(activeJeepney.distanceRemainingKm * 1000)} m`}`
    : '2 km';

  const etaMinutes = activeJeepney.etaMinutes || 22;

  // Calculate arrival time (Current time + ETA mins)
  const now = new Date();
  const arrivalTime = new Date(now.getTime() + etaMinutes * 60000).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  // 1. User Custom Jeepney Vehicle Marker (/jeepney.png)
  // Memoized by [jeepneyCode, roundedHeading, isTripActive] to completely stop DOM reconstruction and image flickering
  const roundedHeading = Math.round((activeJeepney.heading || 0) / 4) * 4;

  const vehicleIcon = useMemo(() => {
    const headingDeg = roundedHeading;

    return L.divIcon({
      html: `
        <div class="relative flex flex-col items-center justify-center pointer-events-auto" style="width: 76px; height: 76px; will-change: transform; transform: translateZ(0); backface-visibility: hidden; -webkit-backface-visibility: hidden;">
          
          <!-- Soft Pulsing Radar Glow when moving (Non-strobe) -->
          ${isTripActive ? `
            <div class="absolute w-16 h-16 rounded-full bg-emerald-500/20 pointer-events-none animate-pulse" style="animation-duration: 2s;"></div>
          ` : ''}

          <!-- Floating Unit Code Badge -->
          <div class="absolute -top-3.5 z-30 flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-900/90 text-white border border-slate-700 shadow-md text-[9px] font-black font-mono tracking-tight whitespace-nowrap">
            <span class="w-1.5 h-1.5 rounded-full ${isTripActive ? 'bg-emerald-400' : 'bg-amber-400'}"></span>
            <span>${activeJeepney.jeepneyCode}</span>
          </div>

          <!-- USER CUSTOM JEEPNEY / VEHICLE (ROTATED TO HEADING) -->
          <div style="transform: rotate(${headingDeg - 90}deg); transform-origin: center center; will-change: transform; backface-visibility: hidden; -webkit-backface-visibility: hidden;" class="w-full h-full flex items-center justify-center pointer-events-none">
            <img 
              src="/jeepney.png" 
              alt="${activeJeepney.jeepneyCode}"
              class="filter drop-shadow-[0_6px_12px_rgba(0,0,0,0.45)] select-none"
              style="width: 66px; height: 31px; object-fit: contain; backface-visibility: hidden; -webkit-backface-visibility: hidden; transform: translateZ(0);"
              loading="eager"
              decoding="sync"
            />
          </div>
        </div>
      `,
      className: 'google-nav-red-vehicle',
      iconSize: [76, 76],
      iconAnchor: [38, 38],
    });
  }, [activeJeepney.jeepneyCode, roundedHeading, isTripActive]);

  // 2. Incident & Hazard Speech Balloon Pins (Matches the user's uploaded image exactly)
  const createHazardPinIcon = (type: 'traffic' | 'flood' | 'breakdown') => {
    let iconSvg = '';
    let badgeBg = '#F59E0B'; // Amber default

    if (type === 'traffic') {
      badgeBg = '#EA580C'; // Orange
      iconSvg = `
        <svg class="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.85 7h10.29l1.08 3.11H5.77L6.85 7zM19 17H5v-4.66l.12-.34h13.77l.11.34V17z"/>
        </svg>
      `;
    } else if (type === 'flood') {
      badgeBg = '#D97706'; // Amber-gold
      iconSvg = `
        <svg class="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2c-4 4.5-7 8.5-7 12 0 4 3 7 7 7s7-3 7-7c0-3.5-3-7.5-7-12zm0 17c-2.8 0-5-2.2-5-5 0-2.3 2-5.4 5-8.5 3 3.1 5 6.2 5 8.5 0 2.8-2.2 5-5 5z"/>
        </svg>
      `;
    } else {
      badgeBg = '#EF4444'; // Red breakdown
      iconSvg = `
        <svg class="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor">
          <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
        </svg>
      `;
    }

    return L.divIcon({
      html: `
        <div class="relative flex flex-col items-center pointer-events-auto cursor-pointer group" style="width: 38px; height: 44px;">
          <!-- White Teardrop Balloon with Soft Shadow -->
          <div class="w-9 h-9 rounded-full bg-white shadow-[0_4px_12px_rgba(0,0,0,0.22)] border border-slate-200/80 flex items-center justify-center p-1 group-hover:scale-110 transition-transform">
            <!-- Colored Icon Badge -->
            <div class="w-7 h-7 rounded-full flex items-center justify-center shadow-inner" style="background-color: ${badgeBg};">
              ${iconSvg}
            </div>
          </div>
          <!-- Pointer Tail -->
          <div class="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[7px] border-t-white -mt-0.5 filter drop-shadow-[0_2px_2px_rgba(0,0,0,0.15)]"></div>
        </div>
      `,
      className: 'google-hazard-pin',
      iconSize: [38, 44],
      iconAnchor: [19, 44],
    });
  };

  // Intermediate Highway and Gas icons along corridor (like in reference picture)
  const createHighwayShieldIcon = (routeNumber: string) => {
    return L.divIcon({
      html: `
        <div class="px-1.5 py-0.5 rounded bg-[#FEF08A] text-slate-900 border border-[#CA8A04] shadow-sm text-[9px] font-black font-mono tracking-tight pointer-events-none">
          ${routeNumber}
        </div>
      `,
      className: 'highway-shield',
      iconSize: [30, 18],
      iconAnchor: [15, 9],
    });
  };

  // Multi-colored Route Segments (Manila South Rd):
  // 1. Blue segment (Smooth flow): PLMun to Putatan
  const blueSegment = PLMUN_ALABANG_PATH.slice(0, 4);
  // 2. Red congested segment: Near Muntinlupa City Hall / Soldiers Hills (matches the reference red segment)
  const redSegment = PLMUN_ALABANG_PATH.slice(3, 7);
  // 3. Yellow moderate segment: SM Center to Bayanan
  const yellowSegment = PLMUN_ALABANG_PATH.slice(6, 9);
  // 4. Blue final segment: Bayanan to Alabang South Station
  const blueFinalSegment = PLMUN_ALABANG_PATH.slice(8);

  return (
    <div className="relative w-full h-[500px] xs:h-[520px] sm:h-[600px] lg:h-[660px] rounded-3xl overflow-hidden border border-slate-200/90 dark:border-slate-800 shadow-2xl bg-[#E8ECEF] dark:bg-[#12161A] font-sans select-none">
      
      {/* Voice Guidance Toast */}
      {voiceToast && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[1002] bg-slate-900/95 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-2xl border border-slate-700 animate-fade-in pointer-events-none flex items-center gap-2">
          {isMuted ? <VolumeX className="w-4 h-4 text-amber-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          <span>{voiceToast}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. TOP WHITE CARD: CURRENT SPEED & ROUTE (SPACIOUS & MOBILE-RESPONSIVE)   */}
      {/* ========================================================================= */}
      <div className="absolute top-2.5 left-2.5 right-2.5 sm:top-3.5 sm:left-3.5 sm:right-3.5 z-[1000] pointer-events-none">
        <div className="pointer-events-auto w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl shadow-lg border border-slate-200/90 dark:border-slate-800 p-2.5 sm:p-3.5 flex items-center justify-between gap-2.5 transition-colors">
          
          {/* Current Speed Section */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800/60 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0 shadow-xs">
              <Gauge className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block leading-tight">
                Speed
              </span>
              <div className="flex items-baseline gap-0.5 mt-0.5">
                <span className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white tracking-tight leading-none">
                  {isTripActive ? (activeJeepney.speedKmh || 0) : 0}
                </span>
                <span className="text-[10px] font-bold text-slate-400 font-mono">km/h</span>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 shrink-0 mx-0.5"></div>

          {/* Route Section - Ample room so "PLMun ➔ Alabang" never truncates */}
          <div className="flex-1 min-w-0">
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block leading-tight">
              Route:
            </span>
            <div className="mt-0.5">
              <button
                type="button"
                onClick={onToggleDirection}
                className="w-full flex items-center justify-between gap-1 text-xs sm:text-sm font-extrabold text-slate-900 dark:text-slate-100 py-1 px-2 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 shadow-2xs transition-all active:scale-[0.98] cursor-pointer"
                title="Tap to switch route direction"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <ArrowRightLeft className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                  <span className="truncate font-extrabold text-[11px] sm:text-xs">
                    {direction === 'PLMun_to_Alabang' ? 'PLMun ➔ Alabang' : 'Alabang ➔ PLMun'}
                  </span>
                </div>
                <span className="text-[9px] font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/80 px-1.5 py-0.5 rounded border border-teal-200 dark:border-teal-800/80 shrink-0">
                  Switch
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. RECENTER GPS BUTTON (Only shown when driver pans away from vehicle)     */}
      {/* ========================================================================= */}
      {!isAutoFollowActive && (
        <div className="absolute top-28 right-3.5 z-[1000] pointer-events-none">
          <button
            onClick={handleRecenter}
            className="pointer-events-auto w-12 h-12 rounded-full bg-[#1A73E8] text-white shadow-[0_4px_16px_rgba(26,115,232,0.45)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all animate-bounce"
            title="Recenter on vehicle"
          >
            <LocateFixed className="w-5 h-5 animate-pulse" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. INTERACTIVE LEAFLET ROAD MAP CANVAS                                    */}
      {/* ========================================================================= */}
      <MapContainer
        center={vehicleCoords}
        zoom={16}
        scrollWheelZoom={true}
        zoomControl={false}
        className="w-full h-full z-0"
        style={{ width: '100%', height: '100%' }}
      >
        <MapResizer />
        <DriverNavController 
          coords={vehicleCoords} 
          heading={activeJeepney.heading || 0} 
          isAutoFollowActive={isAutoFollowActive} 
          setIsAutoFollowActive={setIsAutoFollowActive}
        />

        {/* Crisp Google Maps / Carto Road Tiles */}
        {mapLayer === 'streets' && (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />
        )}

        {mapLayer === 'satellite' && (
          <TileLayer
            attribution='Tiles &copy; Esri'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            maxZoom={18}
          />
        )}

        {/* Route Outer White Casing (Like in Google Maps turn-by-turn) */}
        <Polyline
          positions={PLMUN_ALABANG_PATH}
          pathOptions={{
            color: '#FFFFFF',
            weight: 12,
            opacity: 0.95,
            lineCap: 'round',
            lineJoin: 'round',
          }}
        />

        {/* MULTI-COLOR TRAFFIC CORRIDOR (Matches Blue, Red Congestion, Yellow Slow) */}
        
        {/* Blue Fast Flow Segment */}
        <Polyline
          positions={blueSegment}
          pathOptions={{
            color: '#1A73E8', // Vibrant Google Nav Blue
            weight: 7,
            opacity: 1.0,
            lineCap: 'round',
            lineJoin: 'round',
          }}
        />

        {/* Red Congested Segment near Muntinlupa City Hall / Soldiers Hills */}
        <Polyline
          positions={redSegment}
          pathOptions={{
            color: '#D32F2F', // Heavy Traffic Red
            weight: 7,
            opacity: 1.0,
            lineCap: 'round',
            lineJoin: 'round',
          }}
        />

        {/* Yellow / Amber Moderate Traffic Segment near Bayanan */}
        <Polyline
          positions={yellowSegment}
          pathOptions={{
            color: '#F59E0B', // Moderate Traffic Amber
            weight: 7,
            opacity: 1.0,
            lineCap: 'round',
            lineJoin: 'round',
          }}
        />

        {/* Blue Final Approach Segment */}
        <Polyline
          positions={blueFinalSegment}
          pathOptions={{
            color: '#1A73E8',
            weight: 7,
            opacity: 1.0,
            lineCap: 'round',
            lineJoin: 'round',
          }}
        />

        {/* Highway 163 / National Rd Shields along route */}
        <Marker position={[14.3940, 121.0440]} icon={createHighwayShieldIcon('163')} />
        <Marker position={[14.4095, 121.0478]} icon={createHighwayShieldIcon('163')} />

        {/* Hazard Speech Balloon Pins placed along route (like in reference picture) */}
        {/* 1. Heavy traffic congestion pin */}
        <Marker 
          position={[14.3965, 121.0446]} 
          icon={createHazardPinIcon('traffic')}
        >
          <Popup>
            <div className="p-1 text-xs">
              <span className="font-bold text-amber-700">Traffic Congestion</span>
              <p className="text-[11px] text-slate-600">Slow moving traffic near Putatan Plaza</p>
            </div>
          </Popup>
        </Marker>

        {/* 2. Road puddle / flood alert pin */}
        <Marker 
          position={[14.3985, 121.0450]} 
          icon={createHazardPinIcon('flood')}
        >
          <Popup>
            <div className="p-1 text-xs">
              <span className="font-bold text-amber-700">Puddle Warning</span>
              <p className="text-[11px] text-slate-600">Water runoff reported along curb</p>
            </div>
          </Popup>
        </Marker>

        {/* 3. Vehicle breakdown / obstruction pin */}
        <Marker 
          position={[14.4025, 121.0465]} 
          icon={createHazardPinIcon('breakdown')}
        >
          <Popup>
            <div className="p-1 text-xs">
              <span className="font-bold text-rose-700">Vehicle Breakdown</span>
              <p className="text-[11px] text-slate-600">Disabled vehicle on right shoulder near SM Center</p>
            </div>
          </Popup>
        </Marker>

        {/* ACTIVE RED 3D DRIVER VEHICLE (YOU) */}
        <Marker
          position={vehicleCoords}
          icon={vehicleIcon}
          zIndexOffset={1000}
        >
          <Popup>
            <div className="p-1 text-xs font-sans">
              <div className="font-black text-sm text-rose-700">
                Unit {activeJeepney.jeepneyCode} (Your Vehicle)
              </div>
              <div className="text-slate-600 font-mono text-[11px]">Plate: {activeJeepney.plateNumber}</div>
              <div className="text-slate-600 font-mono text-[11px]">Speed: {activeJeepney.speedKmh} km/h</div>
              <div className="text-slate-600 text-[11px]">Load: {activeJeepney.currentPassengers}/{activeJeepney.capacity}</div>
            </div>
          </Popup>
        </Marker>
      </MapContainer>

      {/* ========================================================================= */}
      {/* 4. BOTTOM-LEFT FLOATING SPEEDOMETER (Circular widget)                     */}
      {/* ========================================================================= */}
      <div className="absolute bottom-36 left-3 z-[1000] pointer-events-none">
        <div className="pointer-events-auto w-13 h-13 sm:w-15 sm:h-15 rounded-full bg-white dark:bg-slate-900 shadow-[0_4px_16px_rgba(0,0,0,0.18)] border border-slate-200/90 dark:border-slate-800 flex flex-col items-center justify-center text-slate-900 dark:text-white">
          <span className="text-lg sm:text-xl font-black font-mono leading-none tracking-tight">
            {isTripActive ? (activeJeepney.speedKmh || '--') : '--'}
          </span>
          <span className="text-[8px] font-bold text-slate-400 font-mono mt-0.5">
            km/h
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. BOTTOM NAVIGATION SHEET (Compact, Responsive, Never Cuts Off)          */}
      {/* ========================================================================= */}
      <div className="absolute bottom-0 left-0 right-0 z-[1001] pointer-events-none">
        <div className="pointer-events-auto bg-white dark:bg-slate-900 rounded-t-[24px] sm:rounded-t-[30px] shadow-[0_-6px_28px_rgba(0,0,0,0.15)] border-t border-slate-200/80 dark:border-slate-800 p-3 sm:p-4 max-h-[85%] overflow-y-auto pb-6 sm:pb-4 transition-all duration-300">
          
          {/* Top Pull Handle Bar */}
          <div 
            onClick={() => setBottomSheetExpanded(!bottomSheetExpanded)}
            className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-2.5 cursor-pointer hover:bg-slate-400 transition-colors"
          />

          {/* Primary Navigation Row (ETA, Distance, Start/End Trip Button) */}
          <div className="flex items-center justify-between gap-2">
            
            {/* Left: Time Remaining + Distance & Arrival Time (Single Line, Never Wraps) */}
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-1.5 whitespace-nowrap">
                <span className={`text-xl sm:text-2xl font-black tracking-tight ${
                  isTripActive ? 'text-[#D32F2F]' : 'text-emerald-600 dark:text-emerald-400'
                }`}>
                  {isTripActive ? `${etaMinutes} min` : 'Parked / Ready'}
                </span>
                <span className="text-xs text-slate-500 font-semibold truncate">
                  ({activeJeepney.distanceRemainingKm || 2.1} km)
                </span>
              </div>
              
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                <span className="whitespace-nowrap">Arrival: <strong className="text-slate-800 dark:text-slate-200">{arrivalTime}</strong></span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 shrink-0 whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Fast Route
                </span>
              </div>
            </div>

            {/* Right: Trip Options Toggle & Start / End Trip Button */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setBottomSheetExpanded(!bottomSheetExpanded)}
                className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-2xs transition-all shrink-0 cursor-pointer"
                title="Trip options"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
              </button>

              <button
                onClick={onToggleTrip}
                className={`px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl font-black text-xs sm:text-sm text-white shadow-sm transition-all active:scale-95 flex items-center justify-center text-center cursor-pointer shrink-0 leading-tight ${
                  isTripActive
                    ? 'bg-[#D32F2F] hover:bg-[#B71C1C] shadow-red-600/30'
                    : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30 animate-pulse'
                }`}
              >
                <span>{isTripActive ? 'END TRIP' : 'START TRIP'}</span>
              </button>
            </div>
          </div>

          {/* Quick In-Cab Driver Controls Strip: Fits Beautifully on Mobile */}
          <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
            
            {/* Passenger Load Counter */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onPassengerChange && onPassengerChange(-1)}
                className="w-8 h-8 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-200 border border-rose-300 dark:border-rose-800 font-black text-sm active:scale-95 cursor-pointer shadow-2xs flex items-center justify-center transition-all"
                title="Passenger Alighting"
                aria-label="Decrease passenger count"
              >
                –
              </button>
              
              <div className="px-1 text-center min-w-[65px]">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block leading-none">
                  Passengers
                </span>
                <span className="font-black font-mono text-base text-slate-900 dark:text-white leading-none mt-0.5 block">
                  {activeJeepney.currentPassengers}
                  <span className="text-[11px] text-slate-400 font-normal">/{activeJeepney.capacity}</span>
                </span>
              </div>

              <button
                onClick={() => onPassengerChange && onPassengerChange(1)}
                className="w-8 h-8 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800 font-black text-sm active:scale-95 cursor-pointer shadow-2xs flex items-center justify-center transition-all"
                title="Passenger Boarding"
                aria-label="Increase passenger count"
              >
                +
              </button>
            </div>

            {/* Shift Status Badge */}
            {onToggleDutyStatus && (
              <button
                onClick={onToggleDutyStatus}
                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border cursor-pointer active:scale-95 transition-all shadow-2xs shrink-0 whitespace-nowrap ${
                  activeDutyStatus === 'on_duty'
                    ? 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700'
                    : 'bg-amber-500 text-white border-amber-600 hover:bg-amber-600'
                }`}
                title="Toggle Shift Status"
              >
                {activeDutyStatus === 'on_duty' ? 'ON DUTY' : 'ON BREAK'}
              </button>
            )}
          </div>

          {/* Expandable Cockpit Details */}
          {bottomSheetExpanded && (
            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 space-y-2 animate-fade-in text-xs">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block font-semibold text-[10px]">Driver</span>
                  <strong className="text-slate-900 dark:text-white text-xs truncate block">{activeDriverName}</strong>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block font-semibold text-[10px]">License</span>
                  <strong className="text-slate-900 dark:text-white font-mono text-xs truncate block">{activeLicense}</strong>
                </div>
              </div>

              {onEndShift && (
                <button
                  onClick={onEndShift}
                  className="w-full py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 font-bold text-xs transition-colors cursor-pointer"
                >
                  End Shift & Sign Out
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. SEARCH MODAL ALONG ROUTE (Triggered by Search Button)                   */}
      {/* ========================================================================= */}
      {showSearchModal && (
        <div className="fixed inset-0 z-[1003] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 max-w-sm w-full space-y-3 shadow-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between border-b pb-2 border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Search className="w-4 h-4 text-blue-600" />
                <span>Search Stops Along Route</span>
              </h3>
              <button onClick={() => setShowSearchModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              {stops.map((stop) => (
                <div
                  key={stop.id}
                  onClick={() => {
                    setShowSearchModal(false);
                    setVoiceToast(`Navigating to ${stop.name}`);
                    setTimeout(() => setVoiceToast(null), 3000);
                  }}
                  className="p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer border border-transparent hover:border-slate-200 transition-colors flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">{stop.name}</div>
                    <div className="text-[10px] text-slate-500">{stop.landmark}</div>
                  </div>
                  <span className="font-mono text-emerald-600 font-bold text-[11px]">₱{stop.fareFromOriginRegular.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
