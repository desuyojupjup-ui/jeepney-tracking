import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import { 
  Jeepney, 
  Terminal, 
  RouteStop, 
  TransitRoute, 
  OperationalAlert, 
  GeofenceEvent, 
  Trip, 
  SystemKpiMetrics, 
  TripDirection, 
  AlertType, 
  AlertSeverity,
  FareConfig
} from '../types';
import { 
  PLMUN_ALABANG_PATH, 
  MOCK_TERMINALS, 
  MOCK_ROUTE, 
  MOCK_HOURLY_TRIPS_DATA 
} from '../data/mockData';
import { 
  interpolatePositionOnPath, 
  findClosestProgressOnPath, 
  getDistanceKm 
} from '../utils/geoUtils';

interface TransitContextType {
  jeepneys: Jeepney[];
  terminals: Terminal[];
  stops: RouteStop[];
  route: TransitRoute;
  alerts: OperationalAlert[];
  geofenceEvents: GeofenceEvent[];
  trips: Trip[];
  kpis: SystemKpiMetrics;
  hourlyData: { hour: string; trips: number; passengers: number }[];
  activeSosAlert: OperationalAlert | null;
  isSimulationActive: boolean;
  
  // Fleet mutations
  addJeepney: (newUnit: Jeepney) => void;
  updateJeepney: (id: string, updates: Partial<Jeepney>) => void;
  deleteJeepney: (id: string) => void;
  updateJeepneyPassengers: (id: string, count: number) => void;
  updateJeepneyLocation: (id: string, lat: number, lng: number, speed?: number, heading?: number) => void;
  
  // Trip actions (from Driver Console / Control Center)
  startTrip: (jeepneyId: string, direction?: TripDirection) => void;
  endTrip: (jeepneyId: string) => void;
  
  // Alert actions
  triggerSosAlert: (jeepneyId: string, driverName: string, message: string, type?: AlertType, severity?: AlertSeverity) => void;
  acknowledgeAlert: (alertId: string) => void;
  resolveAlert: (alertId: string) => void;
  dismissSosBanner: () => void;
  
  // Commuter helpers
  getEtaForStop: (stopId: string, direction?: TripDirection) => { etaMinutes: number; closestJeepney: Jeepney | null };
  calculateFare: (originStopId: string, destStopId: string, isDiscounted?: boolean) => number;
  
  // Fare management
  fareConfig: FareConfig;
  updateFareConfig: (newConfig: Partial<FareConfig>, autoRecalculateStops?: boolean) => void;
  updateStopFares: (stopId: string, regularFare: number, discountedFare: number) => void;
  resetFareConfig: () => void;

  // Simulation control
  toggleSimulation: () => void;
  resetAllData: () => void;
}

const TransitContext = createContext<TransitContextType | undefined>(undefined);

// Storage keys
const STORAGE_JEEPNEYS = 'jeeptrack_fleet_units_v3';
const STORAGE_ALERTS = 'jeeptrack_active_alerts_v3';
const STORAGE_GEOFENCE = 'jeeptrack_geofence_events_v3';
const STORAGE_TRIPS = 'jeeptrack_completed_trips_v3';
const STORAGE_FARE_CONFIG = 'jeeptrack_fare_config_v1';
const STORAGE_ROUTE_STOPS = 'jeeptrack_route_stops_v1';

export const DEFAULT_FARE_CONFIG: FareConfig = {
  baseFareRegular: 13.00,
  baseFareDiscounted: 11.00,
  perKmRateRegular: 1.80,
  perKmRateDiscounted: 1.50,
  firstKmCoverage: 4.0,
  lastUpdated: 'Nov 9, 2026',
  updatedBy: 'LTFRB Official / Control Center',
};

// Registered Fleet Units for the Muntinlupa Corridor (All default to offline until a driver logs in)
const INITIAL_FLEET: Jeepney[] = [
  {
    id: 'puj-01',
    jeepneyCode: 'PLM-01',
    plateNumber: 'NCS-4182',
    modelType: 'modern_electric',
    capacity: 22,
    currentPassengers: 0,
    status: 'offline',
    assignedDriverId: 'drv-01',
    driverName: 'Eduardo Reyes',
    currentLat: 14.3854,
    currentLng: 121.0422,
    heading: 90,
    speedKmh: 0,
    accuracyMeters: 3.5,
    lastGpsUpdate: 'Offline',
    direction: 'PLMun_to_Alabang',
    destinationName: 'Alabang South Station',
    nextStopName: 'PLMun Main Terminal',
    etaMinutes: 0,
    distanceRemainingKm: 0,
  },
  {
    id: 'puj-02',
    jeepneyCode: 'PLM-02',
    plateNumber: 'NDB-8831',
    modelType: 'modern_euro4',
    capacity: 20,
    currentPassengers: 0,
    status: 'offline',
    assignedDriverId: 'drv-02',
    driverName: 'Juan Dela Cruz',
    currentLat: 14.3854,
    currentLng: 121.0422,
    heading: 90,
    speedKmh: 0,
    accuracyMeters: 3.8,
    lastGpsUpdate: 'Offline',
    direction: 'PLMun_to_Alabang',
    destinationName: 'Alabang South Station',
    nextStopName: 'PLMun Main Terminal',
    etaMinutes: 0,
    distanceRemainingKm: 0,
  },
  {
    id: 'puj-03',
    jeepneyCode: 'PLM-03',
    plateNumber: 'NFC-1920',
    modelType: 'traditional_puj',
    capacity: 18,
    currentPassengers: 0,
    status: 'offline',
    assignedDriverId: 'drv-03',
    driverName: 'Rodrigo Santos',
    currentLat: 14.4215,
    currentLng: 121.0445,
    heading: 270,
    speedKmh: 0,
    accuracyMeters: 4.1,
    lastGpsUpdate: 'Offline',
    direction: 'Alabang_to_PLMun',
    destinationName: 'PLMun Terminal (Poblacion)',
    nextStopName: 'Alabang South Station Bay 3',
    etaMinutes: 0,
    distanceRemainingKm: 0,
  },
  {
    id: 'puj-04',
    jeepneyCode: 'PLM-04',
    plateNumber: 'NEB-7341',
    modelType: 'modern_electric',
    capacity: 24,
    currentPassengers: 0,
    status: 'offline',
    assignedDriverId: 'drv-04',
    driverName: 'Danilo Bautista',
    currentLat: 14.4215,
    currentLng: 121.0445,
    heading: 270,
    speedKmh: 0,
    accuracyMeters: 3.2,
    lastGpsUpdate: 'Offline',
    direction: 'Alabang_to_PLMun',
    destinationName: 'PLMun Terminal (Poblacion)',
    nextStopName: 'Alabang South Station',
    etaMinutes: 0,
    distanceRemainingKm: 0,
  },
  {
    id: 'puj-05',
    jeepneyCode: 'PLM-05',
    plateNumber: 'NGA-5012',
    modelType: 'modern_euro4',
    capacity: 20,
    currentPassengers: 0,
    status: 'offline',
    assignedDriverId: 'drv-05',
    driverName: 'Antonio Cruz',
    currentLat: 14.3854,
    currentLng: 121.0422,
    heading: 90,
    speedKmh: 0,
    accuracyMeters: 3.7,
    lastGpsUpdate: 'Offline',
    direction: 'PLMun_to_Alabang',
    destinationName: 'Alabang South Station',
    nextStopName: 'PLMun Bay 2',
    etaMinutes: 0,
    distanceRemainingKm: 0,
  },
  {
    id: 'puj-06',
    jeepneyCode: 'PLM-06',
    plateNumber: 'NFD-9942',
    modelType: 'modern_electric',
    capacity: 22,
    currentPassengers: 0,
    status: 'offline',
    assignedDriverId: 'drv-06',
    driverName: 'Nestor Ramos',
    currentLat: 14.3854,
    currentLng: 121.0422,
    heading: 90,
    speedKmh: 0,
    accuracyMeters: 5.0,
    lastGpsUpdate: 'Offline',
    direction: 'PLMun_to_Alabang',
    destinationName: 'Alabang South Station',
    nextStopName: 'PLMun Terminal',
    etaMinutes: 0,
    distanceRemainingKm: 0,
  },
  {
    id: 'puj-07',
    jeepneyCode: 'PLM-07',
    plateNumber: 'NCD-3312',
    modelType: 'traditional_puj',
    capacity: 18,
    currentPassengers: 0,
    status: 'offline',
    assignedDriverId: undefined,
    driverName: 'Standby Relief Driver',
    currentLat: 14.4215,
    currentLng: 121.0445,
    heading: 270,
    speedKmh: 0,
    accuracyMeters: 4.5,
    lastGpsUpdate: 'Offline',
    direction: 'Alabang_to_PLMun',
    destinationName: 'PLMun Terminal (Poblacion)',
    nextStopName: 'Alabang Staging Bay 4',
    etaMinutes: 0,
    distanceRemainingKm: 0,
  },
  {
    id: 'puj-08',
    jeepneyCode: 'PLM-08',
    plateNumber: 'NGB-1123',
    modelType: 'modern_euro4',
    capacity: 22,
    currentPassengers: 0,
    status: 'offline',
    assignedDriverId: undefined,
    driverName: 'Standby Relief Driver',
    currentLat: 14.3854,
    currentLng: 121.0422,
    heading: 90,
    speedKmh: 0,
    accuracyMeters: 4.0,
    lastGpsUpdate: 'Offline',
    direction: 'PLMun_to_Alabang',
    destinationName: 'Alabang South Station',
    nextStopName: 'PLMun Terminal Bay 5',
    etaMinutes: 0,
    distanceRemainingKm: 0,
  },
];

export const TransitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Initialize State with persistent LocalStorage
  const [jeepneys, setJeepneys] = useState<Jeepney[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_JEEPNEYS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load fleet from localStorage:', e);
    }
    return INITIAL_FLEET;
  });

  const [alerts, setAlerts] = useState<OperationalAlert[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_ALERTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const [geofenceEvents, setGeofenceEvents] = useState<GeofenceEvent[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_GEOFENCE);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const [trips, setTrips] = useState<Trip[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_TRIPS);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const [activeSosAlert, setActiveSosAlert] = useState<OperationalAlert | null>(null);
  const [isSimulationActive, setIsSimulationActive] = useState<boolean>(false);

  // 1.1 Persistent Fare Configuration & Route Stops
  const [fareConfig, setFareConfig] = useState<FareConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_FARE_CONFIG);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_FARE_CONFIG;
  });

  const [stops, setStops] = useState<RouteStop[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_ROUTE_STOPS);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return MOCK_ROUTE.stops;
  });

  const route = useMemo<TransitRoute>(() => {
    return {
      ...MOCK_ROUTE,
      stops,
    };
  }, [stops]);

  // BroadcastChannel for instant cross-tab real-time mesh
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    try {
      const channel = new BroadcastChannel('jeeptrack_transit_sync');
      channelRef.current = channel;

      channel.onmessage = (event) => {
        const { type, payload } = event.data || {};
        if (type === 'SYNC_FLEET' && payload) {
          setJeepneys(payload);
        } else if (type === 'SYNC_ALERTS' && payload) {
          setAlerts(payload);
        } else if (type === 'SYNC_GEOFENCE' && payload) {
          setGeofenceEvents(payload);
        } else if (type === 'TRIGGER_SOS' && payload) {
          setActiveSosAlert(payload);
          setAlerts(prev => [payload, ...prev]);
        }
      };

      return () => {
        channel.close();
      };
    } catch (e) {
      console.warn('BroadcastChannel not supported in this browser environment');
    }
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_JEEPNEYS, JSON.stringify(jeepneys));
    } catch (e) {}
  }, [jeepneys]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_ALERTS, JSON.stringify(alerts));
    } catch (e) {}
  }, [alerts]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_GEOFENCE, JSON.stringify(geofenceEvents));
    } catch (e) {}
  }, [geofenceEvents]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_TRIPS, JSON.stringify(trips));
    } catch (e) {}
  }, [trips]);

  // Track progress of en-route jeepneys (0.0 to 1.0 along the corridor path)
  const progressRef = useRef<Record<string, number>>({});

  useEffect(() => {
    // Initialize initial progress from current positions
    jeepneys.forEach((j) => {
      if (progressRef.current[j.id] === undefined) {
        progressRef.current[j.id] = findClosestProgressOnPath(
          PLMUN_ALABANG_PATH,
          j.currentLat,
          j.currentLng,
          j.direction || 'PLMun_to_Alabang'
        );
      }
    });
  }, []);

  // ---------------------------------------------------------------------------
  // DYNAMIC COMPUTED TERMINALS & OCCUPANCY
  // ---------------------------------------------------------------------------
  const terminals = useMemo(() => {
    return MOCK_TERMINALS.map((term) => {
      const docked = jeepneys.filter((j) => {
        if (j.status !== 'at_terminal') return false;
        const dist = getDistanceKm([j.currentLat, j.currentLng], [term.lat, term.lng]);
        return dist <= term.radiusMeters / 1000 + 0.05;
      });

      return {
        ...term,
        currentOccupiedBays: Math.min(term.totalBays, docked.length),
        queuedJeepneyIds: docked.map(d => d.id),
      };
    });
  }, [jeepneys]);

  // ---------------------------------------------------------------------------
  // DYNAMIC COMPUTED SYSTEM KPIS
  // ---------------------------------------------------------------------------
  const kpis = useMemo<SystemKpiMetrics>(() => {
    const active = jeepneys.filter(j => j.status !== 'offline');
    const enRoute = jeepneys.filter(j => j.status === 'en_route');
    const atTerm = jeepneys.filter(j => j.status === 'at_terminal');
    const offline = jeepneys.filter(j => j.status === 'offline');
    const activeAlerts = alerts.filter(a => a.status === 'active');

    const plmunTerm = terminals.find(t => t.code === 'PLMUN');
    const alabangTerm = terminals.find(t => t.code === 'ALABANG');

    const plmunOcc = plmunTerm && plmunTerm.totalBays > 0 
      ? Math.round((plmunTerm.currentOccupiedBays / plmunTerm.totalBays) * 100) 
      : 0;
    const alabangOcc = alabangTerm && alabangTerm.totalBays > 0 
      ? Math.round((alabangTerm.currentOccupiedBays / alabangTerm.totalBays) * 100) 
      : 0;

    const avgEta = enRoute.length > 0
      ? Math.round(enRoute.reduce((acc, curr) => acc + (curr.etaMinutes || 0), 0) / enRoute.length)
      : 0;

    return {
      activeJeepneys: active.length,
      jeepneysEnRoute: enRoute.length,
      jeepneysAtTerminals: atTerm.length,
      offlineJeepneys: offline.length,
      tripsToday: trips.length,
      averageEtaMinutes: avgEta,
      totalPassengersToday: trips.reduce((acc, t) => acc + (t.passengerCount || 0), 0) + jeepneys.reduce((acc, j) => acc + (j.currentPassengers || 0), 0),
      activeAlertsCount: activeAlerts.length,
      plmunTerminalOccupancyPct: plmunOcc,
      alabangTerminalOccupancyPct: alabangOcc,
    };
  }, [jeepneys, alerts, terminals, trips]);

  // ---------------------------------------------------------------------------
  // FLEET MUTATION ACTIONS
  // ---------------------------------------------------------------------------
  const addJeepney = (newUnit: Jeepney) => {
    setJeepneys((prev) => {
      const next = [newUnit, ...prev];
      channelRef.current?.postMessage({ type: 'SYNC_FLEET', payload: next });
      return next;
    });
  };

  const updateJeepney = (id: string, updates: Partial<Jeepney>) => {
    setJeepneys((prev) => {
      const next = prev.map((j) => (j.id === id ? { ...j, ...updates } : j));
      channelRef.current?.postMessage({ type: 'SYNC_FLEET', payload: next });
      return next;
    });
  };

  const deleteJeepney = (id: string) => {
    setJeepneys((prev) => {
      const next = prev.filter((j) => j.id !== id);
      channelRef.current?.postMessage({ type: 'SYNC_FLEET', payload: next });
      return next;
    });
  };

  const updateJeepneyPassengers = (id: string, count: number) => {
    setJeepneys((prev) => {
      const target = prev.find(j => j.id === id);
      if (!target) return prev;
      const validCount = Math.max(0, Math.min(target.capacity, count));
      const next = prev.map(j => j.id === id ? { ...j, currentPassengers: validCount } : j);
      channelRef.current?.postMessage({ type: 'SYNC_FLEET', payload: next });
      return next;
    });
  };

  const updateJeepneyLocation = (id: string, lat: number, lng: number, speed = 25, heading = 0) => {
    setJeepneys((prev) => {
      const next = prev.map(j => {
        if (j.id !== id) return j;
        return {
          ...j,
          currentLat: lat,
          currentLng: lng,
          speedKmh: speed,
          heading: heading,
          lastGpsUpdate: 'Just now',
        };
      });
      channelRef.current?.postMessage({ type: 'SYNC_FLEET', payload: next });
      return next;
    });
  };

  // ---------------------------------------------------------------------------
  // TRIP WORKFLOW (Driver In-Cab Console)
  // ---------------------------------------------------------------------------
  const startTrip = (jeepneyId: string, direction: TripDirection = 'PLMun_to_Alabang') => {
    const nowTime = new Date().toLocaleTimeString('en-PH', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Manila',
    });

    setJeepneys((prev) => {
      const target = prev.find(j => j.id === jeepneyId);
      if (!target) return prev;

      progressRef.current[jeepneyId] = 0.05;
      const roadPos = interpolatePositionOnPath(PLMUN_ALABANG_PATH, 0.05, direction);

      const next = prev.map(j => {
        if (j.id !== jeepneyId) return j;
        return {
          ...j,
          status: 'en_route' as const,
          direction: direction,
          currentLat: roadPos.lat,
          currentLng: roadPos.lng,
          heading: roadPos.bearing,
          speedKmh: 24,
          etaMinutes: 16,
          distanceRemainingKm: 5.0,
          destinationName: direction === 'PLMun_to_Alabang' ? 'Alabang South Station' : 'PLMun Terminal (Poblacion)',
          nextStopName: direction === 'PLMun_to_Alabang' ? 'Poblacion Health Center' : 'Montillano St. Junction',
          lastGpsUpdate: 'Just now',
        };
      });

      // Log trip record
      const newTrip: Trip = {
        id: `trip-${Date.now()}`,
        tripNumber: `TRP-${Date.now().toString().slice(-4)}`,
        jeepneyId: target.id,
        jeepneyCode: target.jeepneyCode,
        driverId: target.assignedDriverId || 'drv-live',
        driverName: target.driverName || 'Authorized Driver',
        routeId: 'route-plmun-alabang-01',
        direction: direction,
        startTime: nowTime,
        status: 'active',
        passengerCount: target.currentPassengers || 12,
        distanceCoveredKm: 0.1,
        maxSpeedKmh: 28,
        deviationsRecorded: 0,
      };

      setTrips(old => [newTrip, ...old]);
      channelRef.current?.postMessage({ type: 'SYNC_FLEET', payload: next });
      return next;
    });
  };

  const endTrip = (jeepneyId: string) => {
    const nowTime = new Date().toLocaleTimeString('en-PH', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Manila',
    });

    setJeepneys((prev) => {
      const target = prev.find(j => j.id === jeepneyId);
      if (!target) return prev;

      const isAtAlabang = target.direction === 'PLMun_to_Alabang';
      const terminalCoord: [number, number] = isAtAlabang 
        ? [14.4215, 121.0445] 
        : [14.3854, 121.0422];

      const next = prev.map(j => {
        if (j.id !== jeepneyId) return j;
        return {
          ...j,
          status: 'at_terminal' as const,
          speedKmh: 0,
          currentLat: terminalCoord[0],
          currentLng: terminalCoord[1],
          currentPassengers: 0,
          etaMinutes: 0,
          distanceRemainingKm: 0,
          destinationName: isAtAlabang ? 'PLMun Terminal (Poblacion)' : 'Alabang South Station',
          nextStopName: isAtAlabang ? 'Alabang Terminal Bay 2' : 'PLMun University Bay 1',
          lastGpsUpdate: 'Just now',
        };
      });

      // Update completed trip record
      setTrips(old => old.map(t => {
        if (t.jeepneyId === jeepneyId && t.status === 'active') {
          return {
            ...t,
            status: 'completed',
            endTime: nowTime,
            distanceCoveredKm: 5.2,
          };
        }
        return t;
      }));

      // Log Geofence arrival
      const geoEvent: GeofenceEvent = {
        id: `geo-end-${Date.now()}`,
        jeepneyId: target.id,
        jeepneyCode: target.jeepneyCode,
        terminalId: isAtAlabang ? 'term-alabang' : 'term-plmun',
        terminalName: isAtAlabang ? 'Alabang South Station Terminal' : 'PLMun University Terminal',
        eventType: 'ENTERED',
        lat: terminalCoord[0],
        lng: terminalCoord[1],
        occurredAt: `${nowTime} PST`,
      };
      setGeofenceEvents(old => [geoEvent, ...old]);

      channelRef.current?.postMessage({ type: 'SYNC_FLEET', payload: next });
      return next;
    });
  };

  // ---------------------------------------------------------------------------
  // ALERT / SOS HANDLING
  // ---------------------------------------------------------------------------
  const triggerSosAlert = (
    jeepneyId: string, 
    driverName: string, 
    message: string, 
    type: AlertType = 'EMERGENCY_SOS', 
    severity: AlertSeverity = 'critical'
  ) => {
    const target = jeepneys.find(j => j.id === jeepneyId);
    const nowTime = new Date().toLocaleTimeString('en-PH', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Manila',
    });

    const newAlert: OperationalAlert = {
      id: `alert-sos-${Date.now()}`,
      jeepneyId: jeepneyId,
      jeepneyCode: target?.jeepneyCode || 'PUJ-UNIT',
      driverName: driverName,
      type: type,
      severity: severity,
      message: message,
      lat: target?.currentLat || 14.4055,
      lng: target?.currentLng || 121.0470,
      status: 'active',
      createdAt: `${nowTime}`,
    };

    setActiveSosAlert(newAlert);
    setAlerts(prev => [newAlert, ...prev]);

    channelRef.current?.postMessage({ type: 'TRIGGER_SOS', payload: newAlert });
  };

  const acknowledgeAlert = (alertId: string) => {
    setAlerts((prev) => {
      const next = prev.map(a => a.id === alertId ? { ...a, status: 'acknowledged' as const } : a);
      channelRef.current?.postMessage({ type: 'SYNC_ALERTS', payload: next });
      return next;
    });
  };

  const resolveAlert = (alertId: string) => {
    setAlerts((prev) => {
      const next = prev.map(a => a.id === alertId ? { ...a, status: 'resolved' as const } : a);
      channelRef.current?.postMessage({ type: 'SYNC_ALERTS', payload: next });
      return next;
    });
  };

  const dismissSosBanner = () => {
    setActiveSosAlert(null);
  };

  // ---------------------------------------------------------------------------
  // COMMUTER MAP COMPUTED HELPERS
  // ---------------------------------------------------------------------------
  const getEtaForStop = (stopId: string, direction: TripDirection = 'PLMun_to_Alabang') => {
    const stop = MOCK_ROUTE.stops.find(s => s.id === stopId);
    if (!stop) return { etaMinutes: 5, closestJeepney: null };

    // Find closest en_route vehicle matching direction and heading toward this stop
    const candidateJeepneys = jeepneys.filter(j => {
      if (j.status !== 'en_route') return false;
      return j.direction === direction;
    });

    if (candidateJeepneys.length === 0) {
      // Return nearest docked unit
      const docked = jeepneys.find(j => j.status === 'at_terminal');
      return { etaMinutes: 8, closestJeepney: docked || null };
    }

    // Calculate nearest by Euclidean distance
    let nearest = candidateJeepneys[0];
    let minDistance = 999;

    candidateJeepneys.forEach(j => {
      const d = getDistanceKm([j.currentLat, j.currentLng], [stop.lat, stop.lng]);
      if (d < minDistance) {
        minDistance = d;
        nearest = j;
      }
    });

    const calculatedEta = Math.max(1, Math.round((minDistance / 25) * 60));
    return { etaMinutes: calculatedEta, closestJeepney: nearest };
  };

  const calculateFare = (originStopId: string, destStopId: string, isDiscounted = false) => {
    const s1 = stops.find(s => s.id === originStopId);
    const s2 = stops.find(s => s.id === destStopId);
    if (!s1 || !s2) return isDiscounted ? fareConfig.baseFareDiscounted : fareConfig.baseFareRegular;

    const stopDistance = Math.abs(s1.sequence - s2.sequence) * 1.4; // approx km per stop
    const baseFare = isDiscounted ? fareConfig.baseFareDiscounted : fareConfig.baseFareRegular;
    const additionalKmRate = isDiscounted ? fareConfig.perKmRateDiscounted : fareConfig.perKmRateRegular;

    if (stopDistance <= fareConfig.firstKmCoverage) {
      return baseFare;
    }
    const extraKm = Math.ceil(stopDistance - fareConfig.firstKmCoverage);
    return baseFare + (extraKm * additionalKmRate);
  };

  const updateFareConfig = (newConfig: Partial<FareConfig>, autoRecalculateStops = true) => {
    setFareConfig((prev) => {
      const updated: FareConfig = {
        ...prev,
        ...newConfig,
        lastUpdated: new Date().toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }),
      };
      try {
        localStorage.setItem(STORAGE_FARE_CONFIG, JSON.stringify(updated));
      } catch (e) {}

      if (autoRecalculateStops) {
        setStops((prevStops) => {
          const approxKmBySeq: Record<number, number> = {
            1: 0,
            2: 1.2,
            3: 2.6,
            4: 4.4,
            5: 5.9,
            6: 7.6,
            7: 9.3,
          };
          const recalculated = prevStops.map((stop) => {
            if (stop.sequence === 1) {
              return {
                ...stop,
                fareFromOriginRegular: updated.baseFareRegular,
                fareFromOriginDiscounted: updated.baseFareDiscounted,
              };
            }
            const dist = approxKmBySeq[stop.sequence] ?? (stop.sequence - 1) * 1.5;
            const extraKm = Math.max(0, Math.ceil(dist - updated.firstKmCoverage));
            const regular = updated.baseFareRegular + (extraKm * updated.perKmRateRegular);
            const discounted = updated.baseFareDiscounted + (extraKm * updated.perKmRateDiscounted);
            return {
              ...stop,
              fareFromOriginRegular: Math.round(regular * 2) / 2,
              fareFromOriginDiscounted: Math.round(discounted * 2) / 2,
            };
          });
          try {
            localStorage.setItem(STORAGE_ROUTE_STOPS, JSON.stringify(recalculated));
          } catch (e) {}
          return recalculated;
        });
      }

      return updated;
    });
  };

  const updateStopFares = (stopId: string, regularFare: number, discountedFare: number) => {
    setStops((prevStops) => {
      const updated = prevStops.map((s) => 
        s.id === stopId 
          ? { ...s, fareFromOriginRegular: regularFare, fareFromOriginDiscounted: discountedFare }
          : s
      );
      try {
        localStorage.setItem(STORAGE_ROUTE_STOPS, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const resetFareConfig = () => {
    try {
      localStorage.removeItem(STORAGE_FARE_CONFIG);
      localStorage.removeItem(STORAGE_ROUTE_STOPS);
    } catch (e) {}
    setFareConfig(DEFAULT_FARE_CONFIG);
    setStops(MOCK_ROUTE.stops);
  };

  // ---------------------------------------------------------------------------
  // CONTROLS & RESET
  // ---------------------------------------------------------------------------
  const toggleSimulation = () => {
    setIsSimulationActive(prev => !prev);
  };

  const resetAllData = () => {
    localStorage.removeItem(STORAGE_JEEPNEYS);
    localStorage.removeItem(STORAGE_ALERTS);
    localStorage.removeItem(STORAGE_GEOFENCE);
    localStorage.removeItem(STORAGE_TRIPS);
    localStorage.removeItem(STORAGE_FARE_CONFIG);
    localStorage.removeItem(STORAGE_ROUTE_STOPS);
    setJeepneys(INITIAL_FLEET);
    setAlerts([]);
    setGeofenceEvents([]);
    setTrips([]);
    setFareConfig(DEFAULT_FARE_CONFIG);
    setStops(MOCK_ROUTE.stops);
  };

  return (
    <TransitContext.Provider
      value={{
        jeepneys,
        terminals,
        stops,
        route,
        alerts,
        geofenceEvents,
        trips,
        kpis,
        hourlyData: MOCK_HOURLY_TRIPS_DATA,
        activeSosAlert,
        isSimulationActive,
        addJeepney,
        updateJeepney,
        deleteJeepney,
        updateJeepneyPassengers,
        updateJeepneyLocation,
        startTrip,
        endTrip,
        triggerSosAlert,
        acknowledgeAlert,
        resolveAlert,
        dismissSosBanner,
        getEtaForStop,
        calculateFare,
        fareConfig,
        updateFareConfig,
        updateStopFares,
        resetFareConfig,
        toggleSimulation,
        resetAllData,
      }}
    >
      {children}
    </TransitContext.Provider>
  );
};

export const useTransit = () => {
  const context = useContext(TransitContext);
  if (!context) {
    throw new Error('useTransit must be used within a TransitProvider');
  }
  return context;
};
