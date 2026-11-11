import React, { useState, useMemo } from 'react';
import { OperationalAlert, AlertSeverity, AlertType, Jeepney } from '../types';
import { useTransit } from '../context/TransitContext';
import { 
  AlertTriangle, 
  ShieldCheck, 
  CheckCircle2, 
  Radio, 
  Send, 
  Search, 
  Clock, 
  Check, 
  Plus, 
  Flame, 
  Activity,
  AlertCircle,
  Download,
  RefreshCw,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  MoreVertical
} from 'lucide-react';

interface OperationalAlertsViewProps {
  alerts?: OperationalAlert[];
  jeepneys?: Jeepney[];
  onAcknowledgeAlert?: (id: string) => void;
  onResolveAlert?: (id: string) => void;
}

export const OperationalAlertsView: React.FC<OperationalAlertsViewProps> = ({
  alerts: propAlerts,
  jeepneys: propJeepneys,
  onAcknowledgeAlert: propAcknowledge,
  onResolveAlert: propResolve,
}) => {
  const { 
    alerts: contextAlerts, 
    jeepneys: contextJeepneys,
    acknowledgeAlert: contextAcknowledge, 
    resolveAlert: contextResolve,
    triggerSosAlert 
  } = useTransit();

  const alerts = propAlerts || contextAlerts;
  const jeepneys = propJeepneys || contextJeepneys;
  const onAcknowledge = propAcknowledge || contextAcknowledge;
  const onResolve = propResolve || contextResolve;

  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selection & Pagination
  const [selectedAlertIds, setSelectedAlertIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);

  // View Alert Detail Modal
  const [viewingAlert, setViewingAlert] = useState<OperationalAlert | null>(null);

  // Broadcast modal state
  const [showBroadcastModal, setShowBroadcastModal] = useState<boolean>(false);
  const [broadcastTarget, setBroadcastTarget] = useState<string>('all');
  const [broadcastType, setBroadcastType] = useState<AlertType>('ROUTE_DEVIATION');
  const [broadcastSeverity, setBroadcastSeverity] = useState<AlertSeverity>('high');
  const [broadcastMessage, setBroadcastMessage] = useState<string>('');
  const [broadcastSuccess, setBroadcastSuccess] = useState<boolean>(false);

  // Filtered alerts
  const filteredAlerts = useMemo(() => {
    return alerts.filter((al) => {
      if (severityFilter !== 'all' && al.severity !== severityFilter) return false;
      if (statusFilter !== 'all' && al.status !== statusFilter) return false;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchCode = al.jeepneyCode.toLowerCase().includes(q);
        const matchMsg = al.message.toLowerCase().includes(q);
        const matchDriver = al.driverName?.toLowerCase().includes(q);
        const matchType = al.type.toLowerCase().includes(q);
        if (!matchCode && !matchMsg && !matchDriver && !matchType) return false;
      }
      return true;
    });
  }, [alerts, severityFilter, statusFilter, searchQuery]);

  // KPI Calculations
  const activeCount = alerts.filter(a => a.status === 'active').length;
  const criticalCount = alerts.filter(a => a.severity === 'critical' && a.status === 'active').length;
  const acknowledgedCount = alerts.filter(a => a.status === 'acknowledged').length;
  const resolvedCount = alerts.filter(a => a.status === 'resolved').length;

  // Pagination Calculations
  const totalAlerts = filteredAlerts.length;
  const totalPages = Math.max(1, Math.ceil(totalAlerts / rowsPerPage));
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedAlerts = useMemo(() => {
    const start = (validCurrentPage - 1) * rowsPerPage;
    return filteredAlerts.slice(start, start + rowsPerPage);
  }, [filteredAlerts, validCurrentPage, rowsPerPage]);

  // Selection Logic
  const allSelected = paginatedAlerts.length > 0 && paginatedAlerts.every(a => selectedAlertIds.includes(a.id));
  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedAlertIds(prev => prev.filter(id => !paginatedAlerts.some(a => a.id === id)));
    } else {
      const toAdd = paginatedAlerts.map(a => a.id).filter(id => !selectedAlertIds.includes(id));
      setSelectedAlertIds(prev => [...prev, ...toAdd]);
    }
  };

  const toggleSelectAlert = (id: string) => {
    setSelectedAlertIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = ['Alert ID', 'Unit Code', 'Driver Name', 'Type', 'Severity', 'Message', 'Status', 'Created At'];
    const rows = filteredAlerts.map(a => [
      `"${a.id}"`,
      `"${a.jeepneyCode}"`,
      `"${a.driverName || 'Corridor'}"`,
      `"${a.type}"`,
      `"${a.severity}"`,
      `"${a.message.replace(/"/g, '""')}"`,
      `"${a.status}"`,
      `"${a.createdAt}"`
    ].join(','));
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `operational_alerts_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;

    let targetCode = 'ALL-CORRIDOR';
    let targetDriver = 'Corridor Broadcast';
    let targetId = 'all';

    if (broadcastTarget !== 'all') {
      const found = jeepneys.find(j => j.id === broadcastTarget);
      if (found) {
        targetCode = found.jeepneyCode;
        targetDriver = found.driverName || 'Assigned Driver';
        targetId = found.id;
      }
    }

    triggerSosAlert(targetId, targetDriver, `[DISPATCH BROADCAST] ${broadcastMessage}`, broadcastType, broadcastSeverity);

    setBroadcastSuccess(true);
    setTimeout(() => {
      setBroadcastSuccess(false);
      setShowBroadcastModal(false);
      setBroadcastMessage('');
    }, 1200);
  };

  const handleQuickPreset = (presetText: string, type: AlertType, severity: AlertSeverity) => {
    setBroadcastMessage(presetText);
    setBroadcastType(type);
    setBroadcastSeverity(severity);
  };

  return (
    <div className="w-full max-w-[1720px] mx-auto px-3 sm:px-5 py-4 space-y-4 font-sans text-slate-900 dark:text-slate-100">
      
      {/* =========================================================================
          1. TOP KPI CARDS (Matching Image 5: Icon Left, Metric Right)
          ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Active Incidents */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600 shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Active Incidents</span>
              <span className="text-[11px] text-slate-400">Needs intervention</span>
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-rose-600 dark:text-rose-400">
            {activeCount.toLocaleString()}
          </div>
        </div>

        {/* Card 2: Critical SOS */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 flex items-center justify-center text-red-600 shrink-0">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Critical SOS</span>
              <span className="text-[11px] text-red-500 font-medium">Driver alarm triggers</span>
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-red-600 dark:text-red-400">
            {criticalCount.toLocaleString()}
          </div>
        </div>

        {/* Card 3: Acknowledged */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Under Review</span>
              <span className="text-[11px] text-amber-500 font-medium">Acknowledged by control</span>
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400">
            {acknowledgedCount.toLocaleString()}
          </div>
        </div>

        {/* Card 4: Resolved */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Resolved & Cleared</span>
              <span className="text-[11px] text-slate-400">Handled today</span>
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
            {resolvedCount.toLocaleString()}
          </div>
        </div>

      </div>

      {/* =========================================================================
          2. OPERATIONAL ALERTS DATA TABLE (With Integrated Toolbar, Search & Filters Inside)
          ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        
        {/* Integrated Action Toolbar & Search / Filter Bar Inside Datatable */}
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
                setSeverityFilter('all');
                setStatusFilter('all');
              }}
              className="h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Reset filters and refresh"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span>Refresh</span>
            </button>

            <button
              onClick={() => setShowBroadcastModal(true)}
              className="h-9 px-3.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Broadcast Corridor Alert</span>
            </button>

          </div>

          {/* Right Tools: Search & Filters Inside Datatable */}
          <div className="flex flex-wrap items-center gap-2">
            
            <div className="relative flex-1 sm:w-60">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by unit, driver, message..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
              />
            </div>

            <select
              value={severityFilter}
              onChange={(e) => {
                setSeverityFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-9 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical Only</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-9 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="resolved">Resolved</option>
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
                <th className="py-3 px-3">PUJ Unit Code</th>
                <th className="py-3 px-3">Alert Type</th>
                <th className="py-3 px-3">Severity</th>
                <th className="py-3 px-3">Description / Message</th>
                <th className="py-3 px-3">Driver Assignment</th>
                <th className="py-3 px-3">Incident Status</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {paginatedAlerts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No operational alerts match your criteria.
                  </td>
                </tr>
              ) : (
                paginatedAlerts.map((al) => {
                  const isSelected = selectedAlertIds.includes(al.id);

                  return (
                    <tr 
                      key={al.id} 
                      className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors ${
                        isSelected ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                      }`}
                    >
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectAlert(al.id)}
                          className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-3">
                        <button
                          onClick={() => setViewingAlert(al)}
                          className="font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer text-left block font-mono"
                        >
                          {al.jeepneyCode}
                        </button>
                        <span className="text-[10px] text-slate-400 font-mono">{al.id}</span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">
                        {al.type.replace('_', ' ')}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          al.severity === 'critical'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-900'
                            : al.severity === 'high'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-900'
                            : 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-400 dark:border-blue-900'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            al.severity === 'critical' ? 'bg-rose-500 animate-pulse' : al.severity === 'high' ? 'bg-amber-500' : 'bg-blue-500'
                          }`}></span>
                          {al.severity.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-3 max-w-xs text-slate-600 dark:text-slate-300">
                        <p className="truncate text-xs font-normal">{al.message}</p>
                        <span className="text-[10px] text-slate-400 block font-mono">{al.createdAt}</span>
                      </td>
                      <td className="py-3 px-3">
                        {al.driverName ? (
                          <span className="font-bold text-slate-800 dark:text-slate-200">{al.driverName}</span>
                        ) : (
                          <span className="text-slate-400 italic">Corridor Telemetry</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        {al.status === 'resolved' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-900">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Resolved
                          </span>
                        ) : al.status === 'acknowledged' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-900">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            Processing
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-900">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
                            Active
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setViewingAlert(al)}
                            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
                            title="View Incident Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {al.status !== 'acknowledged' && al.status !== 'resolved' && (
                            <button
                              onClick={() => onAcknowledge(al.id)}
                              className="px-2 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-[10px] cursor-pointer"
                              title="Acknowledge Alert"
                            >
                              Acknowledge
                            </button>
                          )}
                          {al.status !== 'resolved' && (
                            <button
                              onClick={() => onResolve(al.id)}
                              className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-[10px] cursor-pointer"
                              title="Mark as Resolved"
                            >
                              Resolve ✓
                            </button>
                          )}
                        </div>
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
            <span>out of <strong className="text-slate-900 dark:text-white font-mono">{totalAlerts}</strong> records</span>
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

      {/* VIEW ALERT DETAILS MODAL */}
      {viewingAlert && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                  viewingAlert.severity === 'critical' ? 'bg-rose-600' : 'bg-amber-600'
                }`}>
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                    Incident: {viewingAlert.jeepneyCode}
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">{viewingAlert.id}</span>
                </div>
              </div>
              <button 
                onClick={() => setViewingAlert(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 font-sans">Type:</span>
                <span className="font-bold text-slate-900 dark:text-white">{viewingAlert.type.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 font-sans">Severity:</span>
                <span className="font-bold uppercase text-rose-600">{viewingAlert.severity}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 font-sans">Driver:</span>
                <span className="font-bold text-slate-900 dark:text-white">{viewingAlert.driverName || 'Corridor Telemetry'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 font-sans">Timestamp:</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">{viewingAlert.createdAt}</span>
              </div>
              <div className="py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 font-sans block mb-1">Message:</span>
                <p className="font-sans text-xs text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  {viewingAlert.message}
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              {viewingAlert.status !== 'resolved' && (
                <button
                  onClick={() => {
                    onResolve(viewingAlert.id);
                    setViewingAlert(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                >
                  Mark as Resolved ✓
                </button>
              )}
              <button
                onClick={() => setViewingAlert(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BROADCAST CORRIDOR ALERT MODAL */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950 flex items-center justify-center text-rose-600">
                  <Radio className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  Broadcast Corridor Emergency Alert
                </h3>
              </div>
              <button 
                onClick={() => setShowBroadcastModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendBroadcast} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Recipient Vehicle / Corridor
                </label>
                <select
                  value={broadcastTarget}
                  onChange={(e) => setBroadcastTarget(e.target.value)}
                  className="w-full h-9 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 font-semibold text-slate-800 dark:text-slate-200"
                >
                  <option value="all">Broadcast to ALL Units on Corridor</option>
                  {jeepneys.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.jeepneyCode} &bull; {j.plateNumber} ({j.driverName || 'Driver'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Alert Type
                  </label>
                  <select
                    value={broadcastType}
                    onChange={(e) => setBroadcastType(e.target.value as AlertType)}
                    className="w-full h-9 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 font-semibold text-slate-800 dark:text-slate-200"
                  >
                    <option value="ROUTE_DEVIATION">Route Advisory</option>
                    <option value="EMERGENCY_SOS">Emergency Notice</option>
                    <option value="SPEED_WARNING">Speed Caution</option>
                    <option value="GEOFENCE_BREACH">Terminal Instruction</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Severity Level
                  </label>
                  <select
                    value={broadcastSeverity}
                    onChange={(e) => setBroadcastSeverity(e.target.value as AlertSeverity)}
                    className="w-full h-9 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 font-semibold text-slate-800 dark:text-slate-200"
                  >
                    <option value="critical">Critical (Immediate Stop)</option>
                    <option value="high">High Warning</option>
                    <option value="medium">Advisory</option>
                    <option value="low">Info</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Dispatch Message
                </label>
                <textarea
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="Enter explicit instructions for drivers along the Manila South Road corridor..."
                  rows={3}
                  required
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 block mb-1">Quick Corridor Presets:</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuickPreset('Heavy bottleneck at Putatan Plaza crossing. Expect 8-minute turnaround delay.', 'ROUTE_DEVIATION', 'high')}
                    className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    Traffic Bottleneck Putatan
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickPreset('Flash flood warning along Bayanan market sector. Reduce speed to 25 km/h.', 'SPEED_WARNING', 'high')}
                    className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    Weather Advisory Bayanan
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickPreset('Alabang South Station terminal bays at full capacity. Hold at Staging Bay 3.', 'GEOFENCE_BREACH', 'medium')}
                    className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    Alabang Bay Hold
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={broadcastSuccess}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-950/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {broadcastSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Transmitted!</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Transmit Dispatch Broadcast</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default OperationalAlertsView;
