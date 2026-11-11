export type UserRole = 'landing' | 'commuter' | 'driver' | 'operator' | 'admin';

export type JeepneyStatus = 'en_route' | 'at_terminal' | 'idle' | 'offline' | 'maintenance';

export type TripStatus = 'scheduled' | 'active' | 'completed' | 'cancelled';

export type TripDirection = 'PLMun_to_Alabang' | 'Alabang_to_PLMun';

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export type AlertType = 'ROUTE_DEVIATION' | 'IDLE_TIMEOUT' | 'SPEED_WARNING' | 'EMERGENCY_SOS' | 'GEOFENCE_BREACH';

export type CommuterType = 'student' | 'faculty' | 'employee';

export interface CommuterUser {
  id: string;
  fullName: string;
  idNumber: string; // e.g. "2022-04921", "FAC-2019-042", "EMP-2016-108"
  email: string;
  commuterType: CommuterType;
  collegeOrDepartment: string;
  yearLevel?: string; // For students: "1st Year", "2nd Year", "3rd Year", "4th Year", "Graduate"
  courseOrProgram?: string; // e.g. "BS Information Technology"
  contactNumber: string;
  password?: string;
  isVerifiedPlmun: boolean;
  transitDiscountEligible: boolean; // 20% discount for students
  avatarUrl?: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  status: 'active' | 'inactive';
}

export interface OperatorAccount {
  id: string;
  name: string;
  username: string;
  email: string;
  password: string;
  role: 'operator' | 'admin';
  badgeNumber: string;
  station: string;
}

export interface Driver {
  id: string;
  userId: string;
  fullName: string;
  licenseNumber: string;
  contactNumber: string;
  status: 'on_duty' | 'off_duty' | 'on_break';
  assignedJeepneyId?: string;
  rating: number;
  totalTripsCompleted: number;
  // Control Center Account Provisioning Credentials
  username: string;
  password: string;
  accountStatus: 'active' | 'suspended';
  createdAt?: string;
  createdBy?: string;
  lastLoginAt?: string;
}

export interface Jeepney {
  id: string;
  jeepneyCode: string; // e.g. "PLM-01"
  plateNumber: string; // e.g. "NCS-4182"
  modelType: 'modern_electric' | 'modern_euro4' | 'traditional_puj';
  capacity: number;
  currentPassengers: number;
  status: JeepneyStatus;
  assignedDriverId?: string;
  driverName?: string;
  currentLat: number;
  currentLng: number;
  heading: number; // degrees 0-360
  speedKmh: number;
  accuracyMeters: number;
  lastGpsUpdate: string;
  currentTripId?: string;
  direction?: TripDirection;
  destinationName?: string;
  nextStopName?: string;
  etaMinutes?: number;
  distanceRemainingKm?: number;
}

export interface RouteStop {
  id: string;
  name: string;
  landmark: string;
  lat: number;
  lng: number;
  sequence: number;
  fareFromOriginRegular: number;
  fareFromOriginDiscounted: number; // 20% discount for students/PWD/senior
}

export interface FareConfig {
  baseFareRegular: number; // e.g. 13.00 for regular
  baseFareDiscounted: number; // e.g. 11.00 for student/senior/pwd
  perKmRateRegular: number; // e.g. 1.80
  perKmRateDiscounted: number; // e.g. 1.50
  firstKmCoverage: number; // e.g. 4.0 km (LTFRB standard)
  lastUpdated?: string;
  updatedBy?: string;
}

export interface TransitRoute {
  id: string;
  name: string;
  code: string;
  originName: string;
  destinationName: string;
  distanceKm: number;
  averageTransitMins: number;
  pathCoordinates: [number, number][];
  corridorToleranceMeters: number;
  stops: RouteStop[];
}

export interface Terminal {
  id: string;
  code: 'PLMUN' | 'ALABANG';
  name: string;
  locationDescription: string;
  lat: number;
  lng: number;
  radiusMeters: number;
  totalBays: number;
  currentOccupiedBays: number;
  queuedJeepneyIds: string[];
  averageDepartureIntervalMin: number;
}

export interface Trip {
  id: string;
  tripNumber: string;
  jeepneyId: string;
  jeepneyCode: string;
  driverId: string;
  driverName: string;
  routeId: string;
  direction: TripDirection;
  startTime: string;
  endTime?: string;
  status: TripStatus;
  passengerCount: number;
  distanceCoveredKm: number;
  maxSpeedKmh: number;
  deviationsRecorded: number;
}

export interface GeofenceEvent {
  id: string;
  jeepneyId: string;
  jeepneyCode: string;
  terminalId: string;
  terminalName: string;
  eventType: 'ENTERED' | 'EXITED';
  lat: number;
  lng: number;
  occurredAt: string;
}

export interface OperationalAlert {
  id: string;
  jeepneyId: string;
  jeepneyCode: string;
  driverName: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  lat: number;
  lng: number;
  status: 'active' | 'acknowledged' | 'resolved';
  createdAt: string;
}

export interface SystemKpiMetrics {
  activeJeepneys: number;
  jeepneysEnRoute: number;
  jeepneysAtTerminals: number;
  offlineJeepneys: number;
  tripsToday: number;
  averageEtaMinutes: number;
  totalPassengersToday: number;
  activeAlertsCount: number;
  plmunTerminalOccupancyPct: number;
  alabangTerminalOccupancyPct: number;
}

export interface SystemSettings {
  systemName: string;
  operatorAgency: string;
  corridorName: string;
  operationsHotline: string;
  operatingHours: string;
  plmunGeofenceRadiusMeters: number;
  alabangGeofenceRadiusMeters: number;
  corridorDeviationToleranceMeters: number;
  idleTimeoutMinutes: number;
  speedLimitKmh: number;
  gpsUpdateIntervalSeconds: number;
  emergencySosSoundEnabled: boolean;
  autoAcknowledgeLowAlerts: boolean;
  notifyOnGeofenceBreach: boolean;
  notifyOnTerminalArrival: boolean;
  language: 'tagalog_english' | 'english';
}
