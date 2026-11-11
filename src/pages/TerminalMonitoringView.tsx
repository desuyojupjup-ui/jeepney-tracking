import React, { useState, useMemo } from 'react';
import { Terminal, Jeepney, GeofenceEvent } from '../types';
import { 
  Building2, 
  ShieldCheck, 
  Clock, 
  Bus, 
  CheckCircle2, 
  History, 
  Search, 
  Download, 
  RefreshCw, 
  Eye, 
  X,
  ChevronLeft,
  ChevronRight,
  Activity,
  Layers
} from 'lucide-react';

interface TerminalMonitoringViewProps {
  terminals: Terminal[];
  jeepneys: Jeepney[];
  geofenceEvents: GeofenceEvent[];
}

export const TerminalMonitoringView: React.FC<TerminalMonitoringViewProps> = ({
  terminals,
  jeepneys,
  geofenceEvents,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [terminalFilter, setTerminalFilter] = useState<string>('all');

  // Checkbox selections & pagination
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);

  // Detail Modal
  const [viewingEvent, setViewingEvent] = useState<GeofenceEvent | null>(null);

  // KPI Calculations
  const totalBays = terminals.reduce((sum, t) => sum + t.totalBays, 0);
  const totalOccupied = terminals.reduce((sum, t) => sum + t.currentOccupiedBays, 0);
  const totalEvents = geofenceEvents.length;

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return geofenceEvents.filter((ev) => {
      if (typeFilter !== 'all' && ev.eventType !== typeFilter) return false;
      if (terminalFilter !== 'all' && ev.terminalId !== terminalFilter) return false;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchCode = ev.jeepneyCode.toLowerCase().includes(q);
        const matchTerm = ev.terminalName.toLowerCase().includes(q);
        if (!matchCode && !matchTerm) return false;
      }
      return true;
    });
  }, [geofenceEvents, typeFilter, terminalFilter, searchQuery]);

  // Pagination Calculations
  const totalRecords = filteredEvents.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / rowsPerPage));
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedEvents = useMemo(() => {
    const start = (validCurrentPage - 1) * rowsPerPage;
    return filteredEvents.slice(start, start + rowsPerPage);
  }, [filteredEvents, validCurrentPage, rowsPerPage]);

  // Selection Logic
  const allSelected = paginatedEvents.length > 0 && paginatedEvents.every(ev => selectedEventIds.includes(ev.id));
  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedEventIds(prev => prev.filter(id => !paginatedEvents.some(e => e.id === id)));
    } else {
      const toAdd = paginatedEvents.map(e => e.id).filter(id => !selectedEventIds.includes(id));
      setSelectedEventIds(prev => [...prev, ...toAdd]);
    }
  };

  const toggleSelectEvent = (id: string) => {
    setSelectedEventIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = ['Event ID', 'PUJ Code', 'Terminal', 'Boundary Action', 'Latitude', 'Longitude', 'Timestamp'];
    const rows = filteredEvents.map(e => [
      `"${e.id}"`,
      `"${e.jeepneyCode}"`,
      `"${e.terminalName}"`,
      `"${e.eventType}"`,
      `"${e.lat}"`,
      `"${e.lng}"`,
      `"${e.occurredAt}"`
    ].join(','));
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `geofence_events_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full max-w-[1720px] mx-auto px-3 sm:px-5 py-4 space-y-4 font-sans text-slate-900 dark:text-slate-100">
      
      {/* =========================================================================
          1. TOP KPI CARDS (Matching Image 5: Icon Left, Metric Right)
          ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Active Hubs */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Active Terminals</span>
              <span className="text-[11px] text-slate-400">PLMun & Alabang</span>
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
            {terminals.length}
          </div>
        </div>

        {/* Card 2: Occupied Bays */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 shrink-0">
              <Bus className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Docked PUJs</span>
              <span className="text-[11px] text-emerald-500 font-medium">Currently in bay</span>
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
            {totalOccupied}
          </div>
        </div>

        {/* Card 3: Total Bays Capacity */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Total Staging Bays</span>
              <span className="text-[11px] text-slate-400">Overall capacity</span>
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400">
            {totalBays}
          </div>
        </div>

        {/* Card 4: Geofence Events */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 shrink-0">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Boundary Triggers</span>
              <span className="text-[11px] text-slate-400">Automated geofence</span>
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
            {totalEvents}
          </div>
        </div>

      </div>

      {/* =========================================================================
          PHYSICAL TERMINAL OCCUPANCY CARDS (PLMun & Alabang)
          ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {terminals.map((term) => {
          const occupancyRate = Math.round((term.currentOccupiedBays / term.totalBays) * 100);
          const dockedUnits = jeepneys.filter((j) => {
            if (term.code === 'PLMUN') {
              return j.status === 'at_terminal' && (j.destinationName?.includes('Alabang') || j.nextStopName?.includes('PLMun'));
            } else {
              return j.status === 'at_terminal' && (j.destinationName?.includes('PLMun') || j.nextStopName?.includes('Alabang'));
            }
          });

          return (
            <div key={term.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-white shadow-xs ${
                    term.code === 'PLMUN' ? 'bg-teal-600' : 'bg-blue-600'
                  }`}>
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">{term.name}</h3>
                    <p className="text-[11px] text-slate-400">{term.locationDescription}</p>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-100 text-teal-800 dark:bg-slate-800 dark:text-teal-300 border border-slate-200 dark:border-slate-700">
                  {term.code}
                </span>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1 font-medium">
                  <span className="text-slate-500">Bay Occupancy:</span>
                  <span className="font-mono text-slate-900 dark:text-slate-100 font-bold">
                    {term.currentOccupiedBays} / {term.totalBays} Bays ({occupancyRate}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      occupancyRate > 75 ? 'bg-amber-500' : 'bg-teal-500'
                    }`}
                    style={{ width: `${occupancyRate}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 text-slate-500">
                <span>Radius: <strong>{term.radiusMeters}m</strong></span>
                <span>Active Bay Queue: <strong>{dockedUnits.length} Units</strong></span>
              </div>
            </div>
          );
        })}
      </div>

      {/* =========================================================================
          2. GEOFENCE DETECTION AUDIT DATA TABLE (With Integrated Buttons, Search & Filters Inside)
          ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        
        {/* Integrated Action Toolbar & Search / Filter Row Inside Datatable */}
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-slate-900">
          
          {/* Left Tools */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Download CSV report"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export</span>
            </button>

            <button
              onClick={() => {
                setSearchQuery('');
                setTypeFilter('all');
                setTerminalFilter('all');
              }}
              className="h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Reset filters and refresh"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span>Refresh</span>
            </button>
          </div>

          {/* Right Tools: Search & Filters Inside Datatable */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:w-60">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by PUJ code or terminal..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
              />
            </div>

            <select
              value={terminalFilter}
              onChange={(e) => {
                setTerminalFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-9 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">All Terminals</option>
              {terminals.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>

            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-9 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">All Actions</option>
              <option value="ENTERED">Entered (Docked)</option>
              <option value="EXITED">Departed (Exit)</option>
            </select>
          </div>

        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 text-[11px] font-bold text-slate-600 dark:text-slate-400 select-none">
                <th className="py-3 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-3">PUJ Body Code</th>
                <th className="py-3 px-3">Boundary Action</th>
                <th className="py-3 px-3">Terminal Hub</th>
                <th className="py-3 px-3">GPS Coordinates</th>
                <th className="py-3 px-3">Timestamp (PST)</th>
                <th className="py-3 px-3">Verification</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {paginatedEvents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No geofence events match your current filter.
                  </td>
                </tr>
              ) : (
                paginatedEvents.map((ev) => {
                  const isSelected = selectedEventIds.includes(ev.id);

                  return (
                    <tr 
                      key={ev.id} 
                      className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors ${
                        isSelected ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                      }`}
                    >
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectEvent(ev.id)}
                          className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-3">
                        <button
                          onClick={() => setViewingEvent(ev)}
                          className="font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer text-left block font-mono"
                        >
                          {ev.jeepneyCode}
                        </button>
                        <span className="text-[10px] text-slate-400 font-mono">{ev.id}</span>
                      </td>
                      <td className="py-3 px-3">
                        {ev.eventType === 'ENTERED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-900">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Docked (Entry)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-900">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            Departed (Exit)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">
                        {ev.terminalName}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400">
                        {ev.lat.toFixed(4)}° N, {ev.lng.toFixed(4)}° E
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-700 dark:text-slate-300">
                        {ev.occurredAt} PST
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1 font-bold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" /> GPS Verified
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => setViewingEvent(ev)}
                          className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
                          title="View Event Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* =========================================================================
            4. PAGINATION BAR (Matching Image 5)
            ========================================================================= */}
        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
          
          <div className="flex items-center gap-2">
            <span>Showing</span>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
            </select>
            <span>out of <strong className="text-slate-900 dark:text-white font-mono">{totalRecords}</strong> records</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={validCurrentPage === 1}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold cursor-pointer transition-colors"
            >
              &larr; Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
              const isActive = p === validCurrentPage;
              return (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {p}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={validCurrentPage === totalPages}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold cursor-pointer transition-colors"
            >
              Next &rarr;
            </button>
          </div>

        </div>

      </div>

      {/* VIEW EVENT DETAILS MODAL */}
      {viewingEvent && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-teal-600 font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                    {viewingEvent.terminalName}
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">Event ID: {viewingEvent.id}</span>
                </div>
              </div>
              <button 
                onClick={() => setViewingEvent(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 font-sans">Vehicle Code:</span>
                <span className="font-bold text-slate-900 dark:text-white">{viewingEvent.jeepneyCode}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 font-sans">Boundary Action:</span>
                <span className="font-bold uppercase text-emerald-600">{viewingEvent.eventType}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 font-sans">GPS Fix:</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {viewingEvent.lat.toFixed(5)}, {viewingEvent.lng.toFixed(5)}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 font-sans">Detected At:</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">{viewingEvent.occurredAt} PST</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setViewingEvent(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default TerminalMonitoringView;
