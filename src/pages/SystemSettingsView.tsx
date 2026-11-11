import React, { useState } from 'react';
import { useTransit } from '../context/TransitContext';
import { useToast } from '../context/ToastContext';
import { SystemSettings } from '../types';
import { 
  Settings, 
  Sliders, 
  ShieldCheck, 
  Radio, 
  Bell, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  Download, 
  Save, 
  Database, 
  MapPin, 
  Clock, 
  Phone, 
  Building2, 
  Sparkles, 
  CheckCircle2, 
  Trash2, 
  AlertTriangle,
  Info,
  Server,
  Compass
} from 'lucide-react';

const SETTINGS_STORAGE_KEY = 'jeeptrack_system_settings_v1';

export const DEFAULT_SETTINGS: SystemSettings = {
  systemName: 'JeepTrack Muntinlupa',
  operatorAgency: 'City of Muntinlupa Transport Management Division & PLMun Cooperative',
  corridorName: 'PLMun Main Terminal ⇄ Alabang South Station via Manila South Road',
  operationsHotline: '0917-800-PLMUN (75686)',
  operatingHours: '05:00 AM – 10:00 PM',

  plmunGeofenceRadiusMeters: 150,
  alabangGeofenceRadiusMeters: 180,
  corridorDeviationToleranceMeters: 65,
  idleTimeoutMinutes: 15,
  speedLimitKmh: 45,
  gpsUpdateIntervalSeconds: 3,

  emergencySosSoundEnabled: true,
  autoAcknowledgeLowAlerts: false,
  notifyOnGeofenceBreach: true,
  notifyOnTerminalArrival: true,

  language: 'english',
};

export const SystemSettingsView: React.FC = () => {
  const { 
    jeepneys, 
    terminals, 
    stops, 
    alerts, 
    trips, 
    resetAllData 
  } = useTransit();
  const { showToast } = useToast();

  const [activeSection, setActiveSection] = useState<'general' | 'geofence' | 'alerts' | 'data'>('general');

  // Load settings from localStorage
  const [settings, setSettings] = useState<SystemSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch (e) {}
    return DEFAULT_SETTINGS;
  });

  const [hasSaved, setHasSaved] = useState<boolean>(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {}

    setHasSaved(true);
    setTimeout(() => setHasSaved(false), 3000);

    showToast({
      type: 'success',
      title: 'Settings Saved!',
      message: 'System configuration parameters successfully saved.',
      duration: 3500,
    });
  };

  const handleResetToDefault = () => {
    if (window.confirm('Are you sure you want to reset all system settings to their default values?')) {
      setSettings(DEFAULT_SETTINGS);
      try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
      } catch (e) {}
      showToast({
        type: 'info',
        title: 'Settings Reset',
        message: 'System parameters restored to defaults.',
        duration: 3500,
      });
    }
  };

  const handleExportBackup = () => {
    const backupData = {
      system: settings,
      exportedAt: new Date().toISOString(),
      fleetCount: jeepneys.length,
      terminalsCount: terminals.length,
      stopsCount: stops.length,
      alertsHistoryCount: alerts.length,
      tripsCompletedCount: trips.length,
      fleetSnapshot: jeepneys,
      alertsSnapshot: alerts,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jeeptrack_muntinlupa_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast({
      type: 'success',
      title: 'Backup Downloaded',
      message: 'Complete system snapshot exported as a JSON file.',
      duration: 3500,
    });
  };

  const handleFactoryResetData = () => {
    if (window.confirm('WARNING: Do you want to reset live telemetry data and return the fleet to default terminals? Your admin account will not be affected.')) {
      resetAllData();
      showToast({
        type: 'info',
        title: 'Data Reset Complete',
        message: 'Fleet and geofence telemetry restored to initial state.',
        duration: 4000,
      });
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* =========================================================================
          PAGE HEADER
          ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center font-black shadow-md shrink-0">
            <Settings className="w-6 h-6 text-slate-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                System Settings & Configuration
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                Control Center v2.4
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Manage operational parameters, geofence radius, alarm notifications, and backup controls for JeepTrack.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer active:scale-95"
            title="Reset to default system settings"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={handleExportBackup}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold transition-all cursor-pointer active:scale-95"
            title="Download backup JSON file"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Backup (JSON)</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          TOP KPI CARDS (Matching Image 5 Layout)
          ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: GPS Rate */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 shrink-0">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">GPS Refresh</span>
              <span className="text-[11px] text-slate-400">Mesh update interval</span>
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
            {settings.gpsUpdateIntervalSeconds}s
          </div>
        </div>

        {/* Card 2: Speed Limit */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Corridor Speed</span>
              <span className="text-[11px] text-emerald-500 font-medium">Over-speed threshold</span>
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
            {settings.speedLimitKmh} <span className="text-xs font-sans text-slate-400">km/h</span>
          </div>
        </div>

        {/* Card 3: PLMun Geofence */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">PLMun Geofence</span>
              <span className="text-[11px] text-slate-400">Terminal buffer</span>
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400">
            {settings.plmunGeofenceRadiusMeters}m
          </div>
        </div>

        {/* Card 4: Alabang Geofence */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Alabang Geofence</span>
              <span className="text-[11px] text-slate-400">Station buffer</span>
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
            {settings.alabangGeofenceRadiusMeters}m
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION TABS (Clean Navigation Pill Bar)
          ========================================================================= */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl overflow-x-auto">
        <button
          onClick={() => setActiveSection('general')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
            activeSection === 'general'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4 text-emerald-600" />
          <span>General & Agency Profile</span>
        </button>

        <button
          onClick={() => setActiveSection('geofence')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
            activeSection === 'geofence'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Compass className="w-4 h-4 text-blue-600" />
          <span>GPS & Geofence Boundaries</span>
        </button>

        <button
          onClick={() => setActiveSection('alerts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
            activeSection === 'alerts'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Bell className="w-4 h-4 text-amber-500" />
          <span>Alarms & Notifications</span>
        </button>

        <button
          onClick={() => setActiveSection('data')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
            activeSection === 'data'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Database className="w-4 h-4 text-purple-600" />
          <span>Data Storage & Maintenance</span>
        </button>
      </div>

      {/* =========================================================================
          MAIN SETTINGS FORM
          ========================================================================= */}
      <form onSubmit={handleSave} className="space-y-6">

        {/* ---------------- SECTION 1: GENERAL PROFILE ---------------- */}
        {activeSection === 'general' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5 animate-fade-in">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="font-extrabold text-base text-slate-900 dark:text-white">
                System Identity (Agency & Route Profile)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Agency name and official corridor identity displayed on commuter and driver portals.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  System Name:
                </label>
                <input
                  type="text"
                  required
                  value={settings.systemName}
                  onChange={(e) => setSettings({ ...settings, systemName: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Agency / Cooperative Operator:
                </label>
                <input
                  type="text"
                  required
                  value={settings.operatorAgency}
                  onChange={(e) => setSettings({ ...settings, operatorAgency: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Official Route Name (Corridor Name):
                </label>
                <input
                  type="text"
                  required
                  value={settings.corridorName}
                  onChange={(e) => setSettings({ ...settings, corridorName: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Terminal Operations Hotline:
                </label>
                <input
                  type="text"
                  required
                  value={settings.operationsHotline}
                  onChange={(e) => setSettings({ ...settings, operationsHotline: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Operating Hours:
                </label>
                <input
                  type="text"
                  required
                  value={settings.operatingHours}
                  onChange={(e) => setSettings({ ...settings, operatingHours: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Default Language:
                </label>
                <select
                  value={settings.language}
                  onChange={(e) => setSettings({ ...settings, language: e.target.value as any })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="english">English (Default)</option>
                  <option value="tagalog_english">Filipino / Tagalog + English (Bilingual Standard)</option>
                </select>
              </div>

            </div>
          </div>
        )}

        {/* ---------------- SECTION 2: GEOFENCE & TELEMETRY ---------------- */}
        {activeSection === 'geofence' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5 animate-fade-in">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="font-extrabold text-base text-slate-900 dark:text-white">
                GPS Telemetry & Geofencing Parameters
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Radar parameters for terminal boundaries, vehicle speed thresholds, and route corridor tracking.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* PLMun Geofence Radius */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    PLMun Terminal Radius
                  </label>
                  <span className="text-xs font-mono font-black text-emerald-600">
                    {settings.plmunGeofenceRadiusMeters}m
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="350"
                  step="10"
                  value={settings.plmunGeofenceRadiusMeters}
                  onChange={(e) => setSettings({ ...settings, plmunGeofenceRadiusMeters: Number(e.target.value) })}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
                <p className="text-[11px] text-slate-400">
                  Geofence radius for automated arrival and bay queue detection at PLMun Main Hub.
                </p>
              </div>

              {/* Alabang Geofence Radius */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Alabang South Station Radius
                  </label>
                  <span className="text-xs font-mono font-black text-blue-600">
                    {settings.alabangGeofenceRadiusMeters}m
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="400"
                  step="10"
                  value={settings.alabangGeofenceRadiusMeters}
                  onChange={(e) => setSettings({ ...settings, alabangGeofenceRadiusMeters: Number(e.target.value) })}
                  className="w-full accent-blue-600 cursor-pointer"
                />
                <p className="text-[11px] text-slate-400">
                  Geofence radius for Alabang South Station terminal boundary.
                </p>
              </div>

              {/* Route Deviation Tolerance */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Corridor Deviation Tolerance
                  </label>
                  <span className="text-xs font-mono font-black text-amber-500">
                    ±{settings.corridorDeviationToleranceMeters}m
                  </span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="200"
                  step="5"
                  value={settings.corridorDeviationToleranceMeters}
                  onChange={(e) => setSettings({ ...settings, corridorDeviationToleranceMeters: Number(e.target.value) })}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <p className="text-[11px] text-slate-400">
                  Corridor deviation threshold before triggering off-route alerts.
                </p>
              </div>

              {/* Speed Limit Warning */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Max Speed Limit Warning
                  </label>
                  <span className="text-xs font-mono font-black text-rose-600">
                    {settings.speedLimitKmh} km/h
                  </span>
                </div>
                <input
                  type="number"
                  min="20"
                  max="80"
                  value={settings.speedLimitKmh}
                  onChange={(e) => setSettings({ ...settings, speedLimitKmh: Number(e.target.value) })}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1.5 text-xs font-mono font-black text-slate-900 dark:text-white"
                />
                <p className="text-[11px] text-slate-400">
                  Triggers an alert when a vehicle exceeds the corridor speed limit.
                </p>
              </div>

              {/* Idle Timeout */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Idle / Stagnant Timeout
                  </label>
                  <span className="text-xs font-mono font-black text-slate-900 dark:text-white">
                    {settings.idleTimeoutMinutes} mins
                  </span>
                </div>
                <input
                  type="number"
                  min="5"
                  max="60"
                  value={settings.idleTimeoutMinutes}
                  onChange={(e) => setSettings({ ...settings, idleTimeoutMinutes: Number(e.target.value) })}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1.5 text-xs font-mono font-black text-slate-900 dark:text-white"
                />
                <p className="text-[11px] text-slate-400">
                  Alerts dispatch if a vehicle is stationary for longer than the threshold while in transit.
                </p>
              </div>

              {/* GPS Update Rate */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    GPS Mesh Update Interval
                  </label>
                  <span className="text-xs font-mono font-black text-teal-600">
                    {settings.gpsUpdateIntervalSeconds}s
                  </span>
                </div>
                <select
                  value={settings.gpsUpdateIntervalSeconds}
                  onChange={(e) => setSettings({ ...settings, gpsUpdateIntervalSeconds: Number(e.target.value) })}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-slate-900 dark:text-white cursor-pointer"
                >
                  <option value={1}>1 second (High Precision / Realtime)</option>
                  <option value={3}>3 seconds (Recommended Standard)</option>
                  <option value={5}>5 seconds (Battery Saver Mode)</option>
                </select>
                <p className="text-[11px] text-slate-400">
                  GPS update refresh frequency for vehicle markers on the map.
                </p>
              </div>

            </div>
          </div>
        )}

        {/* ---------------- SECTION 3: ALARMS & NOTIFICATIONS ---------------- */}
        {activeSection === 'alerts' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5 animate-fade-in">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="font-extrabold text-base text-slate-900 dark:text-white">
                Alarms & Notification Toggles
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Configure audible sirens and dispatch pop-up banners for critical operational events.
              </p>
            </div>

            <div className="space-y-3">
              
              {/* Toggle 1: Emergency SOS Sound */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shrink-0 ${
                    settings.emergencySosSoundEnabled ? 'bg-rose-600' : 'bg-slate-400'
                  }`}>
                    {settings.emergencySosSoundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-slate-900 dark:text-white">
                      In-Cab Emergency SOS Siren & Cockpit Audio
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Sounds an emergency alarm siren in the Control Center whenever a driver presses the distress SOS button.
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.emergencySosSoundEnabled}
                  onChange={(e) => setSettings({ ...settings, emergencySosSoundEnabled: e.target.checked })}
                  className="w-5 h-5 accent-rose-600 cursor-pointer shrink-0"
                />
              </div>

              {/* Toggle 2: Geofence Breach */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-slate-900 dark:text-white">
                      Route Deviation / Geofence Breach Pop-up
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Automatically triggers an operational banner whenever a vehicle deviates from the authorized corridor.
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifyOnGeofenceBreach}
                  onChange={(e) => setSettings({ ...settings, notifyOnGeofenceBreach: e.target.checked })}
                  className="w-5 h-5 accent-amber-500 cursor-pointer shrink-0"
                />
              </div>

              {/* Toggle 3: Terminal Arrival */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-slate-900 dark:text-white">
                      Terminal Arrival & Bay Queue Audio Chime
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Plays an alert chime whenever a vehicle enters terminal boundaries.
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifyOnTerminalArrival}
                  onChange={(e) => setSettings({ ...settings, notifyOnTerminalArrival: e.target.checked })}
                  className="w-5 h-5 accent-emerald-600 cursor-pointer shrink-0"
                />
              </div>

            </div>
          </div>
        )}

        {/* ---------------- SECTION 4: DATA & MAINTENANCE ---------------- */}
        {activeSection === 'data' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5 animate-fade-in">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="font-extrabold text-base text-slate-900 dark:text-white">
                Data Storage & Maintenance Controls
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Manage local storage cache, download data snapshots, and reset operational state.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Card 1: System Info Box */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 space-y-2 text-xs">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                  <Server className="w-4 h-4 text-emerald-600" />
                  <span>Current Database Snapshot</span>
                </div>
                <div className="divide-y divide-slate-200 dark:divide-slate-700 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                  <div className="flex justify-between py-1.5">
                    <span>Registered Fleet:</span>
                    <strong>{jeepneys.length} units</strong>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span>Terminal Hubs:</span>
                    <strong>{terminals.length} hubs (PLMun & Alabang)</strong>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span>Designated Stops:</span>
                    <strong>{stops.length} stops</strong>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span>Active Alerts:</span>
                    <strong>{alerts.length} incidents logged</strong>
                  </div>
                </div>
              </div>

              {/* Card 2: Factory Reset Data */}
              <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 space-y-3 text-xs">
                <div className="flex items-center gap-2 font-bold text-rose-800 dark:text-rose-300">
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  <span>Reset Fleet Telemetry Data</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Restores all units to initial terminal bays and clears temporary alert logs for fresh simulation.
                </p>
                <button
                  type="button"
                  onClick={handleFactoryResetData}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs transition-colors active:scale-95 cursor-pointer"
                >
                  Reset Telemetry Data
                </button>
              </div>

            </div>
          </div>
        )}

        {/* =========================================================================
            BOTTOM SAVE BAR
            ========================================================================= */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            {hasSaved ? (
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 animate-fade-in">
                <CheckCircle2 className="w-4 h-4" />
                <span>All settings have been successfully saved!</span>
              </div>
            ) : (
              <span className="text-xs text-slate-400">
                Click Save to apply updated parameters across the entire system.
              </span>
            )}
          </div>

          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#006837] via-[#008A4B] to-[#00B14F] hover:from-[#005a30] hover:to-[#009643] text-white text-xs font-extrabold shadow-sm active:scale-95 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save System Settings</span>
          </button>
        </div>

      </form>

    </div>
  );
};

