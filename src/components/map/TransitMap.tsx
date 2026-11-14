import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  Polyline, 
  Circle, 
  Marker, 
  Popup, 
  ScaleControl,
  useMap 
} from 'react-leaflet';
import L from 'leaflet';
import { Jeepney, Terminal, RouteStop } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { 
  Search, 
  Navigation, 
  Layers, 
  Compass, 
  Plus, 
  Minus, 
  Crosshair, 
  Maximize2, 
  Clock, 
  ArrowRight, 
  CheckCircle2, 
  ChevronRight, 
  Share2, 
  Bookmark, 
  Car, 
  Bus,
  MapPin,
  X
} from 'lucide-react';

interface TransitMapProps {
  jeepneys: Jeepney[];
  terminals: Terminal[];
  stops: RouteStop[];
  routePath: [number, number][];
  selectedJeepneyId?: string | null;
  onSelectJeepney?: (jeepney: Jeepney) => void;
  height?: string;
  showControls?: boolean;
  interactive?: boolean;
  hideDefaultSearch?: boolean;
  telemetryMode?: boolean;
  children?: React.ReactNode;
}

// Controller component to smoothly pan to coordinates without shaking or zoom bouncing
function MapController({ 
  targetCoord, 
  zoomLevel 
}: { 
  targetCoord: [number, number] | null; 
  zoomLevel?: number;
}) {
  const map = useMap();
  const lastTargetRef = useRef<string | null>(null);

  useEffect(() => {
    if (!targetCoord) return;

    // Check if we already panned to this spot to avoid jitter loops
    const coordKey = `${targetCoord[0].toFixed(5)},${targetCoord[1].toFixed(5)}`;
    if (lastTargetRef.current === coordKey) return;
    lastTargetRef.current = coordKey;

    // Stop any pending Leaflet animations so they don't fight and cause shaking
    map.stop();

    const currentCenter = map.getCenter();
    const distMeters = map.distance(currentCenter, L.latLng(targetCoord[0], targetCoord[1]));

    // If already centered near target, do nothing
    if (distMeters < 25) return;

    // Smooth gentle pan without parabolic fly zoom bounce
    map.panTo(targetCoord, {
      animate: true,
      duration: 0.6,
      easeLinearity: 0.2,
    });
  }, [targetCoord, zoomLevel, map]);

  return null;
}

// Automatically recalculates Leaflet container dimensions and forces tile fill across all viewport widths
function MapResizer() {
  const map = useMap();

  useEffect(() => {
    // Invalidate size immediately and after flexbox layout reflows
    map.invalidateSize();
    const t1 = setTimeout(() => map.invalidateSize(), 80);
    const t2 = setTimeout(() => map.invalidateSize(), 250);
    const t3 = setTimeout(() => map.invalidateSize(), 600);
    const t4 = setTimeout(() => map.invalidateSize(), 1200);

    const handleResize = () => {
      map.invalidateSize();
    };
    window.addEventListener('resize', handleResize);

    const container = map.getContainer();
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && container) {
      ro = new ResizeObserver(() => {
        map.invalidateSize();
      });
      ro.observe(container);
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      window.removeEventListener('resize', handleResize);
      if (ro) ro.disconnect();
    };
  }, [map]);

  return null;
}

// Authentic Google Maps Floating Controls (Compass, Crosshair, Zoom, Pegman)
function GoogleMapControlButtons({ 
  onRecenter,
  onZoomIn,
  onZoomOut,
  minimal = false,
}: { 
  onRecenter: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  minimal?: boolean;
}) {
  const map = useMap();
  const [isLocating, setIsLocating] = useState(false);

  if (minimal) {
    return (
      <div className="absolute bottom-2.5 left-2.5 z-[1000] flex items-center gap-1.5 pointer-events-auto">
        <div className="bg-white/95 dark:bg-[#202124]/95 backdrop-blur-xs rounded-lg shadow-sm border border-gray-200/90 dark:border-[#3c4043] flex items-center overflow-hidden">
          <button
            onClick={() => {
              map.zoomIn();
              onZoomIn();
            }}
            title="Zoom In"
            className="w-7 h-7 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#303134] transition-colors border-r border-gray-200/90 dark:border-[#3c4043] font-bold"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              map.zoomOut();
              onZoomOut();
            }}
            title="Zoom Out"
            className="w-7 h-7 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#303134] transition-colors font-bold"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          onClick={() => {
            setIsLocating(true);
            map.setView([14.4025, 121.0450], 14, { animate: true });
            onRecenter();
            setTimeout(() => setIsLocating(false), 1200);
          }}
          title="Center Corridor (PLMun–Alabang)"
          className="w-7 h-7 bg-white/95 dark:bg-[#202124]/95 backdrop-blur-xs rounded-lg shadow-sm border border-gray-200/90 dark:border-[#3c4043] flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#303134] transition-colors"
        >
          <Crosshair className={`w-3.5 h-3.5 ${isLocating ? 'text-[#1A73E8] animate-spin' : ''}`} />
        </button>
      </div>
    );
  }

  return (
    <div className="absolute bottom-28 right-3 sm:bottom-7 sm:right-4 z-[1000] flex flex-col items-center gap-2 pointer-events-auto">
      {/* Google Maps Compass Needle Button */}
      <button
        onClick={() => {
          map.setView([14.4025, 121.0450], 14, { animate: true });
          onRecenter();
        }}
        title="Reset North / Center View"
        className="w-10 h-10 bg-white dark:bg-[#202124] rounded-lg shadow-md border border-gray-200/90 dark:border-[#3c4043] flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#303134] active:bg-gray-100 transition-all group"
      >
        <div className="w-5 h-5 relative flex items-center justify-center">
          <div className="w-0 h-0 border-l-[3.5px] border-l-transparent border-r-[3.5px] border-r-transparent border-b-[8px] border-b-[#EA4335] absolute -top-0.5"></div>
          <div className="w-0 h-0 border-l-[3.5px] border-l-transparent border-r-[3.5px] border-r-transparent border-t-[8px] border-t-gray-400 dark:border-t-gray-500 absolute -bottom-0.5"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-white dark:bg-[#202124] border border-gray-400 z-10"></div>
        </div>
      </button>

      {/* Recenter / Locate Button */}
      <button
        onClick={() => {
          setIsLocating(true);
          onRecenter();
          setTimeout(() => setIsLocating(false), 1500);
        }}
        title="Center Corridor (PLMun–Alabang)"
        className="w-10 h-10 bg-white dark:bg-[#202124] rounded-lg shadow-md border border-gray-200/90 dark:border-[#3c4043] flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#303134] active:bg-gray-100 transition-all hover:text-[#1A73E8] dark:hover:text-[#8AB4F8]"
      >
        <Crosshair className={`w-5 h-5 transition-colors ${isLocating ? 'text-[#1A73E8] dark:text-[#8AB4F8] fill-[#1A73E8]/20 animate-pulse' : 'text-gray-600 dark:text-gray-300'}`} />
      </button>

      {/* Stacked Google Maps Zoom Controls */}
      <div className="bg-white dark:bg-[#202124] rounded-lg shadow-md border border-gray-200/90 dark:border-[#3c4043] overflow-hidden flex flex-col">
        <button
          onClick={() => {
            map.zoomIn();
            onZoomIn();
          }}
          title="Zoom In"
          className="w-10 h-10 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#303134] active:bg-gray-100 dark:active:bg-[#3c4043] transition-all border-b border-gray-200/90 dark:border-[#3c4043] font-bold"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            map.zoomOut();
            onZoomOut();
          }}
          title="Zoom Out"
          className="w-10 h-10 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#303134] active:bg-gray-100 dark:active:bg-[#3c4043] transition-all font-bold"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>

      {/* Google Yellow Streetview Pegman */}
      <button
        title="Street View (Simulated)"
        className="w-10 h-10 bg-white dark:bg-[#202124] rounded-lg shadow-md border border-gray-200/90 dark:border-[#3c4043] flex items-center justify-center hover:bg-gray-50 dark:hover:bg-[#303134] transition-all group"
      >
        <div className="w-4 h-6 relative flex flex-col items-center">
          <div className="w-2.5 h-2.5 rounded-full bg-[#fbbc04] border border-[#ea8600]"></div>
          <div className="w-3.5 h-3.5 bg-[#fbbc04] rounded-t-sm border border-[#ea8600] mt-0.5"></div>
        </div>
      </button>
    </div>
  );
}

export const TransitMap: React.FC<TransitMapProps> = ({
  jeepneys,
  terminals,
  stops,
  routePath,
  selectedJeepneyId,
  onSelectJeepney,
  height = '620px',
  showControls = true,
  interactive = true,
  hideDefaultSearch = false,
  telemetryMode = false,
  children,
}) => {
  const { theme: appTheme } = useTheme();
  const defaultCenter: [number, number] = [14.4025, 121.0450];
  const [googleTheme, setGoogleTheme] = useState<'google-updated' | 'google-classic' | 'google-clean' | 'google-dark' | 'satellite'>(
    appTheme === 'dark' ? 'google-dark' : 'google-updated'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [targetCoord, setTargetCoord] = useState<[number, number] | null>(null);
  const [showDirectionsCard, setShowDirectionsCard] = useState(true);
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [trafficOverlayActive, setTrafficOverlayActive] = useState(true);
  const iconCacheRef = useRef<Record<string, L.DivIcon>>({});

  // Automatically update map theme when the global dark mode toggle is clicked
  useEffect(() => {
    if (googleTheme !== 'satellite') {
      setGoogleTheme(appTheme === 'dark' ? 'google-dark' : 'google-updated');
    }
  }, [appTheme]);

  // Watch for selected jeepney changes: ONLY pan ONCE when selectedJeepneyId changes!
  const prevSelectedJeepneyId = useRef<string | null>(null);
  useEffect(() => {
    if (selectedJeepneyId && selectedJeepneyId !== prevSelectedJeepneyId.current) {
      prevSelectedJeepneyId.current = selectedJeepneyId;
      const puj = jeepneys.find(j => j.id === selectedJeepneyId);
      if (puj) {
        setTargetCoord([puj.currentLat, puj.currentLng]);
      }
    } else if (!selectedJeepneyId) {
      prevSelectedJeepneyId.current = null;
    }
  }, [selectedJeepneyId]);

  // Google Maps Red Teardrop Destination Pin for Alabang
  const createGoogleRedPin = (label: string) => {
    return L.divIcon({
      html: `
        <div class="relative flex flex-col items-center cursor-pointer group">
          <svg class="w-8 h-10 filter drop-shadow-md transition-transform group-hover:scale-110" viewBox="0 0 24 32" fill="none">
            <path d="M12 0C5.372 0 0 5.372 0 12c0 8.5 12 20 12 20s12-11.5 12-20c0-6.628-5.372-12-12-12z" fill="#EA4335" />
            <circle cx="12" cy="11" r="5" fill="#FFFFFF" />
            <circle cx="12" cy="11" r="3" fill="#B31412" />
          </svg>
          <div class="absolute -bottom-5 bg-white text-gray-800 text-[10px] font-bold px-1.5 py-0.5 rounded shadow border border-gray-200 whitespace-nowrap">
            ${label}
          </div>
        </div>
      `,
      className: 'google-red-pin',
      iconSize: [32, 40],
      iconAnchor: [16, 36],
    });
  };

  // Google Maps Green Origin Pin for PLMun Terminal
  const createGoogleGreenPin = (label: string) => {
    return L.divIcon({
      html: `
        <div class="relative flex flex-col items-center cursor-pointer group">
          <svg class="w-8 h-10 filter drop-shadow-md transition-transform group-hover:scale-110" viewBox="0 0 24 32" fill="none">
            <path d="M12 0C5.372 0 0 5.372 0 12c0 8.5 12 20 12 20s12-11.5 12-20c0-6.628-5.372-12-12-12z" fill="#34A853" />
            <circle cx="12" cy="11" r="5" fill="#FFFFFF" />
            <circle cx="12" cy="11" r="3" fill="#137333" />
          </svg>
          <div class="absolute -bottom-5 bg-white text-gray-800 text-[10px] font-bold px-1.5 py-0.5 rounded shadow border border-gray-200 whitespace-nowrap">
            ${label}
          </div>
        </div>
      `,
      className: 'google-green-pin',
      iconSize: [32, 40],
      iconAnchor: [16, 36],
    });
  };

  // Google Maps Transit Stop Circle
  const createGoogleStopIcon = (sequence: number) => {
    return L.divIcon({
      html: `
        <div class="relative flex items-center justify-center cursor-pointer group">
          <div class="w-6 h-6 rounded-full bg-white border-2 border-[#1A73E8] shadow-md flex items-center justify-center text-[#1A73E8] text-[11px] font-bold transition-transform group-hover:scale-125">
            ${sequence}
          </div>
        </div>
      `,
      className: 'google-stop-pin',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
  };

  // Top-view Modern Philippine Jeepney Tracker Puck using user custom /jeepney.png
  // Memoized / cached by [id, roundedHeading, isSelected, status, eta, modelType] to completely eliminate image flickering
  const getGoogleJeepneyPuck = (jeepney: Jeepney, isSelected: boolean) => {
    // Direction bearing alignment (Dynamic road-tangent bearing calculated from the path segment)
    const rawHeading = typeof jeepney.heading === 'number' 
      ? jeepney.heading 
      : (jeepney.direction === 'Alabang_to_PLMun' ? 195 : 15);
    const headingDeg = Math.round(rawHeading / 5) * 5;

    const cacheKey = `${jeepney.id}-${headingDeg}-${isSelected ? '1' : '0'}-${jeepney.status}-${jeepney.etaMinutes || 0}-${jeepney.modelType}`;
    if (iconCacheRef.current[cacheKey]) {
      return iconCacheRef.current[cacheKey];
    }

    // Vehicle category colors & badges
    let bodyColor = '#00B14F'; // Modern Electric (Emerald Green)
    if (jeepney.modelType === 'modern_euro4') {
      bodyColor = '#1A73E8'; // Modern Euro-4 (Transit Blue)
    } else if (jeepney.modelType === 'traditional_puj') {
      bodyColor = '#F59E0B'; // Traditional PUJ (Classic Jeepney Gold)
    }

    const isEnRoute = jeepney.status === 'en_route';

    const icon = L.divIcon({
      html: `
        <div class="relative w-[60px] h-[70px] flex items-center justify-center cursor-pointer select-none" style="will-change: transform; transform: translateZ(0); backface-visibility: hidden; -webkit-backface-visibility: hidden;">
          <!-- Floating Upright Code & ETA Badge (Level and always readable!) -->
          <div class="absolute -top-3 z-20 flex items-center gap-1 bg-slate-900/95 backdrop-blur-md px-2 py-0.5 rounded-full shadow-lg border text-white font-mono text-[10px] font-extrabold whitespace-nowrap transition-all ${
            isSelected 
              ? 'border-[#00B14F] ring-2 ring-[#00B14F]/60 shadow-emerald-500/30' 
              : 'border-slate-700/80 hover:border-slate-500'
          }">
            <span class="w-1.5 h-1.5 rounded-full shrink-0" style="background-color: ${bodyColor};"></span>
            <span class="tracking-tight text-white">${jeepney.jeepneyCode}</span>
            <span class="text-slate-500 font-sans text-[8px]">•</span>
            <span class="text-emerald-400 font-bold">${jeepney.etaMinutes ? `${jeepney.etaMinutes}m` : '0m'}</span>
          </div>

          <!-- Pulsing Radar Glow Halo when Selected or in Motion (Soft, non-strobe) -->
          ${isSelected ? `
            <div class="absolute w-14 h-14 rounded-full border-2 border-[#00B14F] pointer-events-none animate-pulse"></div>
            <div class="absolute w-16 h-16 rounded-full bg-[#00B14F]/15 pointer-events-none"></div>
          ` : isEnRoute ? `
            <div class="radar-halo" style="background: radial-gradient(circle, rgba(0,177,79,0.25) 0%, rgba(0,177,79,0) 70%);"></div>
          ` : ''}

          <!-- USER CUSTOM TOP-VIEW JEEPNEY ICON (/jeepney.png) ROTATED TO HEADING -->
          <div class="absolute inset-0 flex items-center justify-center pointer-events-none" style="transform: rotate(${headingDeg - 90}deg); transform-origin: center center; will-change: transform; backface-visibility: hidden; -webkit-backface-visibility: hidden;">
            <img 
              src="/jeepney.png" 
              alt="${jeepney.jeepneyCode}"
              class="filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.38)] select-none"
              style="width: 58px; height: 27px; object-fit: contain; backface-visibility: hidden; -webkit-backface-visibility: hidden; transform: translateZ(0);"
              loading="eager"
              decoding="sync"
            />
          </div>
        </div>
      `,
      className: 'google-vehicle-topview',
      iconSize: [60, 70],
      iconAnchor: [30, 35],
    });

    iconCacheRef.current[cacheKey] = icon;
    return icon;
  };

  const handleLandmarkClick = (coord: [number, number]) => {
    setTargetCoord(coord);
  };

  return (
    <div className={`relative w-full rounded-none overflow-hidden border-none google-map-canvas theme-${googleTheme} text-gray-800 dark:text-gray-100`} style={{ height }}>
      {/* Soft ambient lighting overlay to blend tile edges like Google Maps */}
      <div className="google-map-ambient-overlay" />
      
      {/* Custom Children Overlays (e.g. Floating Public Passenger Service & Approaching Jeepneys Panel) */}
      {children}

      {/* 1. Google Maps Floating Omnibox Search Card (Top-Left) - shown when hideDefaultSearch is false and not telemetryMode */}
      {!hideDefaultSearch && !telemetryMode && (
        <div className="absolute top-4 left-4 z-[1000] w-full max-w-sm pointer-events-none space-y-2">
          <div className="pointer-events-auto bg-white dark:bg-[#202124] rounded-xl shadow-lg border border-gray-200/90 dark:border-[#3c4043] flex items-center px-3 py-2 text-sm text-gray-800 dark:text-gray-100 transition-shadow hover:shadow-xl">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#303134] cursor-pointer mr-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </div>
            
            <input
              type="text"
              placeholder="Search PLMun–Alabang stops or PUJs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-none text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 text-xs sm:text-sm focus:outline-none"
            />

            <div className="flex items-center gap-1.5 border-l border-gray-200 dark:border-[#3c4043] pl-2">
              <button
                onClick={() => handleLandmarkClick(defaultCenter)}
                title="Search"
                className="p-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-[#303134] transition-colors"
              >
                <Search className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowDirectionsCard(!showDirectionsCard)}
                title="Directions"
                className="w-8 h-8 rounded-full bg-[#1A73E8] hover:bg-[#1557b0] text-white flex items-center justify-center shadow-md transition-all active:scale-95"
              >
                <Navigation className="w-4 h-4 fill-current rotate-45" />
              </button>
            </div>
          </div>

          {/* Google Maps Quick Filter Category Chips */}
          <div className="pointer-events-auto flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            <button
              onClick={() => handleLandmarkClick([14.3854, 121.0422])}
              className="bg-white/95 dark:bg-[#202124]/95 backdrop-blur hover:bg-gray-50 dark:hover:bg-[#303134] text-gray-700 dark:text-gray-200 px-3 py-1.5 rounded-full shadow border border-gray-200 dark:border-[#3c4043] font-medium whitespace-nowrap flex items-center gap-1.5 active:scale-95 transition-all"
            >
              <span>🎓</span>
              <span>PLMun Main</span>
            </button>
            <button
              onClick={() => handleLandmarkClick([14.3940, 121.0440])}
              className="bg-white/95 dark:bg-[#202124]/95 backdrop-blur hover:bg-gray-50 dark:hover:bg-[#303134] text-gray-700 dark:text-gray-200 px-3 py-1.5 rounded-full shadow border border-gray-200 dark:border-[#3c4043] font-medium whitespace-nowrap flex items-center gap-1.5 active:scale-95 transition-all"
            >
              <span>🏛️</span>
              <span>City Hall</span>
            </button>
            <button
              onClick={() => handleLandmarkClick([14.4095, 121.0478])}
              className="bg-white/95 dark:bg-[#202124]/95 backdrop-blur hover:bg-gray-50 dark:hover:bg-[#303134] text-gray-700 dark:text-gray-200 px-3 py-1.5 rounded-full shadow border border-gray-200 dark:border-[#3c4043] font-medium whitespace-nowrap flex items-center gap-1.5 active:scale-95 transition-all"
            >
              <span>🏪</span>
              <span>Bayanan</span>
            </button>
            <button
              onClick={() => handleLandmarkClick([14.4215, 121.0445])}
              className="bg-white/95 dark:bg-[#202124]/95 backdrop-blur hover:bg-gray-50 dark:hover:bg-[#303134] text-gray-700 dark:text-gray-200 px-3 py-1.5 rounded-full shadow border border-gray-200 dark:border-[#3c4043] font-medium whitespace-nowrap flex items-center gap-1.5 active:scale-95 transition-all"
            >
              <span>🚉</span>
              <span>Alabang South</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. Google Maps Layers Switcher Box (Bottom-Left) */}
      {!telemetryMode && (
        <div className="absolute bottom-6 left-4 z-[1000] pointer-events-auto">
        <div className="relative">
          <button
            onClick={() => setShowLayerMenu(!showLayerMenu)}
            className="w-12 h-12 bg-white dark:bg-[#202124] rounded-xl shadow-lg border border-gray-200/90 dark:border-[#3c4043] overflow-hidden flex flex-col items-center justify-center p-1 group hover:border-[#1A73E8] dark:hover:border-[#8AB4F8] transition-all"
            title="Google Maps Layers & Styles"
          >
            <div className="w-8 h-6 rounded bg-slate-200 dark:bg-slate-700 overflow-hidden relative border border-gray-300 dark:border-gray-600">
              {googleTheme === 'satellite' ? (
                <div className="w-full h-full bg-slate-900 flex items-center justify-center text-[7px] font-bold text-emerald-300">
                  SAT
                </div>
              ) : googleTheme === 'google-dark' ? (
                <div className="w-full h-full bg-[#202124] flex items-center justify-center text-[7px] font-bold text-amber-300">
                  NIGHT
                </div>
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-[#e8ecef] via-[#cbe6a3] to-[#a5bfdd] flex items-center justify-center text-[7px] font-bold text-gray-700">
                  MAP
                </div>
              )}
            </div>
            <span className="text-[9px] font-bold text-gray-600 dark:text-gray-300 mt-0.5">Layers</span>
          </button>

          {/* Layer Options Flyout Menu */}
          {showLayerMenu && (
            <div className="absolute bottom-14 left-0 bg-white dark:bg-[#202124] rounded-2xl shadow-2xl border border-gray-200 dark:border-[#3c4043] p-3 min-w-[260px] space-y-3 animate-fade-in text-xs z-[1002]">
              <div className="flex items-center justify-between px-0.5">
                <span className="font-bold text-gray-800 dark:text-gray-200 text-xs tracking-tight">
                  Google Map Type
                </span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono">Updated UI</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setGoogleTheme('google-updated');
                    setShowLayerMenu(false);
                  }}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    googleTheme === 'google-updated' || googleTheme === 'google-classic'
                      ? 'border-[#1A73E8] bg-blue-50 dark:bg-blue-950/40 text-[#1A73E8] dark:text-[#8AB4F8] font-bold ring-1 ring-[#1A73E8]'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[#303134] text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <div className="w-full h-8 rounded-lg bg-gradient-to-tr from-[#e8ecef] via-[#cbe6a3] to-[#a5bfdd] mb-1.5 border border-gray-300 dark:border-gray-600 flex items-center justify-center text-[9px] font-bold text-gray-700 shadow-sm">
                    Updated
                  </div>
                  <span>Google Default</span>
                </button>

                <button
                  onClick={() => {
                    setGoogleTheme('satellite');
                    setShowLayerMenu(false);
                  }}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    googleTheme === 'satellite'
                      ? 'border-[#1A73E8] bg-blue-50 dark:bg-blue-950/40 text-[#1A73E8] dark:text-[#8AB4F8] font-bold ring-1 ring-[#1A73E8]'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[#303134] text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <div className="w-full h-8 rounded-lg bg-slate-900 mb-1.5 border border-gray-600 flex items-center justify-center text-[9px] font-bold text-emerald-400 shadow-sm">
                    Satellite
                  </div>
                  <span>Satellite</span>
                </button>

                <button
                  onClick={() => {
                    setGoogleTheme('google-clean');
                    setShowLayerMenu(false);
                  }}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    googleTheme === 'google-clean'
                      ? 'border-[#1A73E8] bg-blue-50 dark:bg-blue-950/40 text-[#1A73E8] dark:text-[#8AB4F8] font-bold ring-1 ring-[#1A73E8]'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[#303134] text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <div className="w-full h-8 rounded-lg bg-white dark:bg-slate-100 mb-1.5 border border-gray-300 flex items-center justify-center text-[9px] font-bold text-gray-600 shadow-sm">
                    Vector
                  </div>
                  <span>Clean High-Key</span>
                </button>

                <button
                  onClick={() => {
                    setGoogleTheme('google-dark');
                    setShowLayerMenu(false);
                  }}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    googleTheme === 'google-dark'
                      ? 'border-[#1A73E8] bg-blue-50 dark:bg-blue-950/40 text-[#1A73E8] dark:text-[#8AB4F8] font-bold ring-1 ring-[#1A73E8]'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[#303134] text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <div className="w-full h-8 rounded-lg bg-[#202124] mb-1.5 border border-gray-700 flex items-center justify-center text-[9px] font-bold text-amber-300 shadow-sm">
                    Night
                  </div>
                  <span>Dark Mode</span>
                </button>
              </div>

              {/* Map Details / Overlays */}
              <div className="pt-2 border-t border-gray-100 dark:border-gray-700 space-y-2">
                <div className="flex items-center justify-between px-0.5">
                  <span className="text-gray-700 dark:text-gray-300 font-semibold text-[11px]">Map Details</span>
                </div>

                <label className="flex items-center justify-between cursor-pointer p-1 rounded-lg hover:bg-gray-50 dark:hover:bg-[#303134]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span className="text-gray-700 dark:text-gray-300 text-xs font-medium">Traffic Congestion</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={trafficOverlayActive}
                    onChange={(e) => setTrafficOverlayActive(e.target.checked)}
                    className="accent-[#1A73E8] w-4 h-4 rounded"
                  />
                </label>

                {/* Google Traffic Legend */}
                {trafficOverlayActive && (
                  <div className="flex items-center justify-between px-1 text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#34A853]"></span> Fast
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#FBBC04]"></span> Moderate
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#EA4335]"></span> Slow
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      )}

      {/* 3. Google Maps Floating Transit Directions Preview Bottom Card */}
      {showDirectionsCard && !hideDefaultSearch && !telemetryMode && (
        <div className="absolute bottom-6 left-20 right-16 md:left-24 md:right-auto md:w-96 z-[999] pointer-events-auto">
          <div className="bg-white dark:bg-[#202124] rounded-2xl shadow-xl border border-gray-200 dark:border-[#3c4043] p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#1A73E8] text-white flex items-center justify-center shadow-md">
                  <Bus className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold text-gray-900 dark:text-gray-100 font-sans">22 min</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">(5.2 km)</span>
                  </div>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Fastest route now • Usual traffic
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowDirectionsCard(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-gray-50 dark:bg-[#18191a] rounded-xl p-2.5 text-xs text-gray-700 dark:text-gray-300 space-y-1.5 border border-gray-100 dark:border-[#3c4043]">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900 dark:text-gray-100">PLMun ⇄ Alabang Route</span>
                <span className="text-[11px] font-mono text-[#1A73E8] dark:text-[#8AB4F8] font-bold">Every 5 min</span>
              </div>
              <div className="text-[11px] text-gray-500 dark:text-gray-400">
                Departing from PLMun Poblacion Terminal via Manila South Road
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => handleLandmarkClick([14.3854, 121.0422])}
                className="flex-1 bg-[#1A73E8] hover:bg-[#1557b0] text-white py-2 rounded-full font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95"
              >
                <Navigation className="w-3.5 h-3.5 fill-current" />
                <span>Start Live Tracking</span>
              </button>

              <button
                onClick={() => handleLandmarkClick(defaultCenter)}
                className="px-3 py-2 bg-gray-100 dark:bg-[#303134] hover:bg-gray-200 dark:hover:bg-[#3c4043] text-gray-700 dark:text-gray-200 rounded-full font-semibold text-xs transition-colors"
              >
                Stops
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leaflet Map Canvas with OpenStreetMap Tiles */}
      <MapContainer
        center={defaultCenter}
        zoom={14}
        scrollWheelZoom={interactive}
        zoomControl={false} // Disabled default Leaflet control for Google Maps controls
        style={{ height: '100%', width: '100%' }}
      >
        <MapController targetCoord={targetCoord} />
        <MapResizer />
        <ScaleControl position="bottomright" metric={true} imperial={false} />
        
        {showControls && (
          <GoogleMapControlButtons
            onRecenter={() => setTargetCoord(defaultCenter)}
            onZoomIn={() => {}}
            onZoomOut={() => {}}
            minimal={telemetryMode}
          />
        )}

        {/* Base Tile Layer: Standard OpenStreetMap */}
        {googleTheme !== 'satellite' && (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />
        )}

        {/* Satellite Aerial Tile Layer (Optional Layer Toggle) */}
        {googleTheme === 'satellite' && (
          <TileLayer
            attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            maxZoom={18}
          />
        )}

        {/* 1. Google Maps Transit Route Casing (White outer border) */}
        <Polyline
          positions={routePath}
          pathOptions={{
            color: '#FFFFFF',
            weight: 9,
            opacity: 0.95,
            lineJoin: 'round',
            lineCap: 'round',
          }}
        />

        {/* 2. Google Maps Primary Route Polyline (Signature Transit Blue #1A73E8) */}
        <Polyline
          positions={routePath}
          pathOptions={{
            color: '#1A73E8',
            weight: 6,
            opacity: 1.0,
            lineJoin: 'round',
            lineCap: 'round',
          }}
        />

        {/* 3. Simulated Live Traffic Speed Segments along corridor */}
        {trafficOverlayActive && (
          <>
            {/* Moderate traffic near Putatan City Hall */}
            <Polyline
              positions={routePath.slice(2, 5)}
              pathOptions={{
                color: '#FBBC04', // Google Yellow
                weight: 4,
                opacity: 0.9,
              }}
            />
            {/* Congested bottleneck near Montillano Alabang Viaduct */}
            <Polyline
              positions={routePath.slice(9, 12)}
              pathOptions={{
                color: '#EA4335', // Google Red
                weight: 4,
                opacity: 0.9,
              }}
            />
          </>
        )}

        {/* Terminal Geofence Circles styled like Google boundary zones */}
        {terminals.map((term) => (
          <Circle
            key={term.id}
            center={[term.lat, term.lng]}
            radius={term.radiusMeters}
            pathOptions={{
              color: term.code === 'PLMUN' ? '#34A853' : '#EA4335',
              fillColor: term.code === 'PLMUN' ? '#34A853' : '#EA4335',
              fillOpacity: 0.15,
              weight: 2,
              dashArray: '6, 6',
            }}
          />
        ))}

        {/* Origin Green Pin: PLMun Terminal */}
        <Marker
          position={[14.3854, 121.0422]}
          icon={createGoogleGreenPin('PLMun Terminal')}
        >
          <Popup className="google-maps-popup" autoPan={false}>
            <div className="p-3 w-64 text-gray-800 dark:text-gray-100">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 dark:bg-green-950/60 text-green-800 dark:text-green-300">
                  ORIGIN TERMINAL
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">Poblacion</span>
              </div>
              <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm">PLMun University Terminal</h3>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">University Road, Brgy. Poblacion, Muntinlupa</p>
              
              <div className="mt-2 pt-2 border-t border-gray-100 dark:border-[#3c4043] flex items-center justify-between text-xs">
                <span className="text-gray-500 dark:text-gray-400">Bay Occupancy:</span>
                <span className="font-bold text-green-700 dark:text-green-400">5 / 8 Bays Available</span>
              </div>
              
              <button className="mt-2.5 w-full bg-[#1A73E8] hover:bg-[#1557b0] text-white py-1.5 rounded-lg text-xs font-semibold shadow-sm">
                View Terminal Schedule
              </button>
            </div>
          </Popup>
        </Marker>

        {/* Destination Red Pin: Alabang South Station */}
        <Marker
          position={[14.4215, 121.0445]}
          icon={createGoogleRedPin('Alabang Terminal')}
        >
          <Popup className="google-maps-popup" autoPan={false}>
            <div className="p-3 w-64 text-gray-800 dark:text-gray-100">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300">
                  DESTINATION TERMINAL
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">Alabang</span>
              </div>
              <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm">Alabang South Station / Starmall</h3>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">Corporate Ave & Spectrum Midway, Filinvest City</p>
              
              <div className="mt-2 pt-2 border-t border-gray-100 dark:border-[#3c4043] flex items-center justify-between text-xs">
                <span className="text-gray-500 dark:text-gray-400">Bay Occupancy:</span>
                <span className="font-bold text-gray-800 dark:text-gray-200">4 / 10 Bays Active</span>
              </div>

              <button className="mt-2.5 w-full bg-[#1A73E8] hover:bg-[#1557b0] text-white py-1.5 rounded-lg text-xs font-semibold shadow-sm">
                Inspect South Station Queue
              </button>
            </div>
          </Popup>
        </Marker>

        {/* Intermediate Transit Stops */}
        {stops.slice(1, -1).map((stop) => (
          <Marker
            key={stop.id}
            position={[stop.lat, stop.lng]}
            icon={createGoogleStopIcon(stop.sequence)}
          >
            <Popup className="google-maps-popup" autoPan={false}>
              <div className="p-3 w-60 text-gray-800 dark:text-gray-100">
                <div className="flex items-center gap-1.5 text-xs text-[#1A73E8] dark:text-[#8AB4F8] font-bold mb-1">
                  <span>Transit Stop #{stop.sequence}</span>
                </div>
                <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm">{stop.name}</h4>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">{stop.landmark}</p>
                
                <div className="mt-2 bg-gray-50 dark:bg-[#18191a] rounded-lg p-2 text-xs border border-gray-100 dark:border-[#3c4043] space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Student Fare:</span>
                    <span className="font-bold text-[#1A73E8] dark:text-[#8AB4F8]">₱{stop.fareFromOriginDiscounted.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Regular Fare:</span>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">₱{stop.fareFromOriginRegular.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Live Jeepney Pucks */}
        {jeepneys.map((puj) => (
          <Marker
            key={puj.id}
            position={[puj.currentLat, puj.currentLng]}
            icon={getGoogleJeepneyPuck(puj, puj.id === selectedJeepneyId)}
            eventHandlers={{
              click: () => onSelectJeepney && onSelectJeepney(puj),
            }}
          >
            <Popup className="google-maps-popup" autoPan={false}>
              <div className="p-3 w-64 text-gray-800 dark:text-gray-100">
                <div className="flex items-center justify-between pb-1.5 border-b border-gray-100 dark:border-[#3c4043]">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-base text-[#1A73E8] dark:text-[#8AB4F8]">{puj.jeepneyCode}</span>
                    <span className="text-xs font-mono text-gray-500 dark:text-gray-400">({puj.plateNumber})</span>
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    puj.status === 'en_route' ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300' :
                    puj.status === 'at_terminal' ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300' :
                    'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                  }`}>
                    {puj.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 my-2 text-xs">
                  <div className="bg-gray-50 dark:bg-[#18191a] p-2 rounded-lg border border-gray-100 dark:border-[#3c4043]">
                    <span className="text-gray-500 dark:text-gray-400 text-[10px] block">Velocity</span>
                    <span className="font-mono font-bold text-gray-900 dark:text-gray-100 text-sm">{puj.speedKmh} km/h</span>
                  </div>
                  <div className="bg-gray-50 dark:bg-[#18191a] p-2 rounded-lg border border-gray-100 dark:border-[#3c4043]">
                    <span className="text-gray-500 dark:text-gray-400 text-[10px] block">ETA to Terminal</span>
                    <span className="font-mono font-bold text-[#1A73E8] dark:text-[#8AB4F8] text-sm">
                      {puj.etaMinutes ? `${puj.etaMinutes} mins` : 'Docked'}
                    </span>
                  </div>
                </div>

                <div className="text-xs space-y-1 text-gray-600 dark:text-gray-300">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Driver:</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">{puj.driverName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Heading:</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">{puj.destinationName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Available Seats:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {puj.capacity - puj.currentPassengers} seats free
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] text-gray-400 dark:text-gray-500 pt-1 border-t border-gray-100 dark:border-[#3c4043]">
                    <span>GPS Telemetry:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">{puj.lastGpsUpdate}</span>
                  </div>
                </div>

                <button
                  onClick={() => onSelectJeepney && onSelectJeepney(puj)}
                  className="mt-2.5 w-full bg-[#1A73E8] hover:bg-[#1557b0] text-white py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-1"
                >
                  <Navigation className="w-3.5 h-3.5 fill-current" />
                  <span>Track This Jeepney Live</span>
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};
