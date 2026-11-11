import React, { useState, useMemo } from 'react';
import { 
  Jeepney, 
  Terminal, 
  RouteStop, 
  TransitRoute, 
  SystemKpiMetrics, 
  OperationalAlert, 
  GeofenceEvent, 
  Trip 
} from '../types';
import { AdminTab } from '../components/admin/AdminSidebar';
import { TransitMap } from '../components/map/TransitMap';
import { 
  Bus, 
  Building2, 
  Users, 
  Navigation, 
  MapPin, 
  AlertTriangle,
  RotateCcw,
  CheckCircle2
} from 'lucide-react';

interface OperatorDashboardViewProps {
  kpis: SystemKpiMetrics;
  jeepneys: Jeepney[];
  terminals: Terminal[];
  stops: RouteStop[];
  route: TransitRoute;
  alerts: OperationalAlert[];
  geofenceEvents: GeofenceEvent[];
  recentTrips?: Trip[];
  hourlyData?: { hour: string; trips: number; passengers: number }[];
  onSelectJeepney?: (jeepney: Jeepney) => void;
  onAcknowledgeAlert?: (alertId: string) => void;
  onResolveAlert?: (alertId: string) => void;
  onNavigateTab?: (tab: AdminTab) => void;
}

export const OperatorDashboardView: React.FC<OperatorDashboardViewProps> = ({
  jeepneys,
  terminals,
  stops,
  route,
  alerts,
  onAcknowledgeAlert,
  onResolveAlert,
  onNavigateTab,
}) => {
  // Simple Filter State
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDirection, setFilterDirection] = useState<string>('all');
  const [selectedJeepneyId, setSelectedJeepneyId] = useState<string>(jeepneys[0]?.id || 'puj-01');

  // Filtered fleet
  const filteredJeepneys = useMemo(() => {
    return jeepneys.filter((j) => {
      if (filterStatus !== 'all' && j.status !== filterStatus) return false;
      if (filterDirection !== 'all' && j.direction !== filterDirection) return false;
      return true;
    });
  }, [jeepneys, filterStatus, filterDirection]);

  // Key Counts
  const totalUnits = filteredJeepneys.length;
  const inTransitCount = filteredJeepneys.filter(j => j.status === 'en_route').length;
  const atTerminalCount = filteredJeepneys.filter(j => j.status === 'at_terminal').length;
  const activeAlerts = alerts.filter(a => a.status === 'active');

  const selectedJeepney = jeepneys.find(j => j.id === selectedJeepneyId) || filteredJeepneys[0];

  return (
    <div className="w-full max-w-[1720px] mx-auto px-3 sm:px-5 py-4 space-y-4 font-sans text-slate-900 dark:text-slate-100">
      
      {/* =========================================================================
          1. UNIFIED KPI CARDS (Matching Standard Admin Dashboard Style)
          ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Jeepneys */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <Bus className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Total Fleet</span>
              <span className="text-[11px] text-slate-400">Registered units</span>
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
            {totalUnits}
          </div>
        </div>

        {/* Card 2: In Transit */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <Navigation className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">In Transit</span>
              <span className="text-[11px] text-emerald-500 font-medium">En route on road</span>
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
            {inTransitCount}
          </div>
        </div>

        {/* Card 3: At Terminal */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">At Terminal</span>
              <span className="text-[11px] text-slate-400">Boarding at bay</span>
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400">
            {atTerminalCount}
          </div>
        </div>

        {/* Card 4: Emergency Alerts */}
        <div 
          onClick={() => onNavigateTab && onNavigateTab('alerts')}
          title="Open Emergency SOS and Incident Alerts"
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-800 rounded-xl p-4 shadow-xs flex items-center justify-between cursor-pointer transition-all hover:scale-[1.01]"
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full border flex items-center justify-center shrink-0 ${
              activeAlerts.length > 0 
                ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-600 animate-pulse' 
                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
            }`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Emergency SOS</span>
              <span className={`text-[11px] font-semibold ${activeAlerts.length > 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                {activeAlerts.length > 0 ? 'Action required' : 'All clear'}
              </span>
            </div>
          </div>
          <div className={`text-2xl font-black font-mono ${activeAlerts.length > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
            {activeAlerts.length}
          </div>
        </div>

      </div>

      {/* =========================================================================
          2. MAIN SECTION: BIG LIVE MAP WITH INTEGRATED FILTERS + JEEPNEY LIST
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Main Map Box (8 Columns) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col space-y-3">
          
          {/* Live Map Card Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-black text-base text-slate-900 dark:text-white leading-tight">
                  Live Fleet Map (Real-Time GPS Tracking)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Click any vehicle marker to view driver and speed telemetry.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Live Telemetry
              </span>

              <button
                onClick={() => onNavigateTab && onNavigateTab('fare')}
                className="h-7 px-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center gap-1 transition-all shadow-2xs active:scale-95 cursor-pointer shrink-0"
                title="Adjust Jeepney Fare Rates"
              >
                <span className="font-mono font-black text-xs text-emerald-600 dark:text-emerald-400">₱</span>
                <span>Fare Rates</span>
              </button>
            </div>
          </div>

          {/* Quick Filter Bar (Integrated Inside the Live Map Card) */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-xl px-3 py-2 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-0.5">
                Filter Fleet:
              </span>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="h-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="en_route">In Transit (En Route)</option>
                <option value="at_terminal">At Terminal Hub</option>
                <option value="idle">Standby / Idle</option>
              </select>

              {/* Direction Filter */}
              <select
                value={filterDirection}
                onChange={(e) => setFilterDirection(e.target.value)}
                className="h-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="all">All Directions</option>
                <option value="PLMun_to_Alabang">Bound for Alabang South Station</option>
                <option value="Alabang_to_PLMun">Bound for PLMun Terminal (Poblacion)</option>
              </select>

              {(filterStatus !== 'all' || filterDirection !== 'all') && (
                <button
                  onClick={() => {
                    setFilterStatus('all');
                    setFilterDirection('all');
                  }}
                  className="h-8 px-2.5 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Clear Filter</span>
                </button>
              )}
            </div>

            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 pr-1">
              Showing: <strong className="text-slate-900 dark:text-white font-mono">{filteredJeepneys.length}</strong> of {jeepneys.length} units
            </div>
          </div>

          {/* Interactive Map */}
          <div className="w-full h-[520px] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 relative bg-slate-100 dark:bg-slate-950">
            <TransitMap
              jeepneys={filteredJeepneys}
              terminals={terminals}
              stops={stops}
              routePath={route.pathCoordinates}
              selectedJeepneyId={selectedJeepneyId}
              onSelectJeepney={(j) => setSelectedJeepneyId(j.id)}
              height="100%"
              showControls={true}
              hideDefaultSearch={true}
              telemetryMode={true}
            />
          </div>

          {/* Selected Jeepney Quick Summary Bar */}
          {selectedJeepney && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-mono font-black text-xs">
                  {selectedJeepney.jeepneyCode}
                </span>
                <div>
                  <span className="font-extrabold text-slate-900 dark:text-white block">
                    {selectedJeepney.driverName || 'No Assigned Driver'} &bull; Plate: {selectedJeepney.plateNumber}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                    Destination: <strong>{selectedJeepney.destinationName}</strong>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Passengers</span>
                  <span className="font-mono font-black text-slate-900 dark:text-white">
                    {selectedJeepney.currentPassengers} / {selectedJeepney.capacity}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Speed</span>
                  <span className="font-mono font-black text-emerald-600">
                    {selectedJeepney.speedKmh} km/h
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Status</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    selectedJeepney.status === 'en_route'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                  }`}>
                    {selectedJeepney.status === 'en_route' ? 'In Transit' : 'At Terminal'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Fleet List & Active Alerts (4 Columns) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Emergency / Alerts Card (if any) */}
          {activeAlerts.length > 0 && (
            <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-900 rounded-2xl p-4 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between pb-1 border-b border-rose-200 dark:border-rose-900">
                <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-black text-xs uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4 animate-pulse" />
                  <span>Action Required ({activeAlerts.length})</span>
                </div>
              </div>

              <div className="space-y-2 max-h-[160px] overflow-y-auto">
                {activeAlerts.map((al) => (
                  <div key={al.id} className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-rose-200 dark:border-rose-800 text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                      <span>Unit: {al.jeepneyCode}</span>
                      <span className="text-[10px] text-rose-600 font-mono font-bold uppercase">{al.severity}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                      {al.message}
                    </p>
                    <div className="flex justify-end pt-1">
                      {al.status !== 'acknowledged' ? (
                        <button
                          onClick={() => onAcknowledgeAlert && onAcknowledgeAlert(al.id)}
                          className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] cursor-pointer"
                        >
                          Acknowledge
                        </button>
                      ) : (
                        <button
                          onClick={() => onResolveAlert && onResolveAlert(al.id)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] cursor-pointer"
                        >
                          Resolved ✓
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Simple Vehicle Roster List */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Bus className="w-4 h-4 text-blue-600" />
                <span>Active Fleet List ({filteredJeepneys.length})</span>
              </h3>
              <button
                onClick={() => onNavigateTab && onNavigateTab('fleet')}
                className="text-[11px] text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
              >
                View All &rarr;
              </button>
            </div>

            {/* List */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[460px] overflow-y-auto space-y-1">
              {filteredJeepneys.map((puj) => {
                const isSelected = puj.id === selectedJeepneyId;
                return (
                  <div
                    key={puj.id}
                    onClick={() => setSelectedJeepneyId(puj.id)}
                    className={`p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-xs text-slate-900 dark:text-white">
                          {puj.jeepneyCode}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {puj.plateNumber}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate mt-0.5">
                        {puj.driverName || 'No Assigned Driver'}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        Destination: {puj.destinationName}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider block mb-1 ${
                        puj.status === 'en_route'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                      }`}>
                        {puj.status === 'en_route' ? 'In Transit' : 'Terminal'}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 font-bold block">
                        👥 {puj.currentPassengers}/{puj.capacity}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default OperatorDashboardView;
