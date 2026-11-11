import React, { useState, useMemo } from 'react';
import { Trip, RouteStop, SystemKpiMetrics, Jeepney } from '../types';
import { useTransit } from '../context/TransitContext';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Calendar, 
  Download, 
  Clock, 
  MapPin, 
  GraduationCap, 
  CreditCard, 
  Award,
  Zap,
  Filter,
  ArrowUpRight
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

interface PassengerAnalyticsViewProps {
  trips?: Trip[];
  stops?: RouteStop[];
  kpis?: SystemKpiMetrics;
  hourlyData?: { hour: string; trips: number; passengers: number }[];
  jeepneys?: Jeepney[];
}

export const PassengerAnalyticsView: React.FC<PassengerAnalyticsViewProps> = ({
  trips: propTrips,
  stops: propStops,
  kpis: propKpis,
  hourlyData: propHourlyData,
  jeepneys: propJeepneys,
}) => {
  const { 
    trips: contextTrips, 
    stops: contextStops, 
    kpis: contextKpis, 
    hourlyData: contextHourlyData,
    jeepneys: contextJeepneys 
  } = useTransit();

  const trips = propTrips || contextTrips;
  const stops = propStops || contextStops;
  const kpis = propKpis || contextKpis;
  const hourlyData = propHourlyData || contextHourlyData;
  const jeepneys = propJeepneys || contextJeepneys;

  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');
  const [selectedDirection, setSelectedDirection] = useState<string>('all');

  // Dynamic Ridership & Fare Calculations
  const totalRidership = useMemo(() => {
    const fromTrips = trips.reduce((acc, t) => acc + (t.passengerCount || 0), 0);
    const inTransit = jeepneys.reduce((acc, j) => acc + (j.currentPassengers || 0), 0);
    return fromTrips + inTransit || 1485;
  }, [trips, jeepneys]);

  const studentCount = Math.round(totalRidership * 0.72); // ~72% PLMun students along university corridor
  const regularCount = totalRidership - studentCount;

  const studentRevenue = studentCount * 11.0;
  const regularRevenue = regularCount * 13.0;
  const totalGrossRevenue = studentRevenue + regularRevenue;

  // Hourly Ridership Trend Chart Data derived from actual hourlyData
  const hourlyChartData = useMemo(() => {
    return hourlyData.map((h) => ({
      hour: h.hour,
      passengers: h.passengers,
      trips: h.trips,
      headway: h.trips > 0 ? Number((60 / h.trips).toFixed(1)) : 8.0,
      targetHeadway: 7.0,
    }));
  }, [hourlyData]);

  // Passenger Distribution by Landmark Stop
  const stopDemandData = useMemo(() => {
    return stops.slice(0, 8).map((st, idx) => {
      // Estimated distribution weight along the corridor
      const weightMultiplier = idx === 0 ? 0.30 : idx === 1 ? 0.18 : idx === 4 ? 0.16 : idx === 7 ? 0.22 : 0.08;
      const count = Math.round(totalRidership * weightMultiplier);
      return {
        stopName: st.name.replace('PLMun University Terminal', 'PLMun Terminal').replace('Alabang South Station', 'Alabang Hub').replace('Muntinlupa City Hall Complex', 'City Hall'),
        passengers: count,
        fare: st.fareFromOriginRegular,
      };
    });
  }, [stops, totalRidership]);

  // Commuter Demographic Pie Data
  const demographicData = [
    { name: 'PLMun Students (20% Disc.)', value: studentCount, color: '#00B14F' },
    { name: 'Regular Public Commuters', value: regularCount, color: '#3B82F6' },
  ];

  // CSV Export handler
  const handleExportCsv = () => {
    const headers = ['Hour', 'Completed Trips', 'Passenger Count', 'Average Headway (min)', 'Target SLA (min)\n'];
    const rows = hourlyChartData.map(h => `${h.hour},${h.trips},${h.passengers},${h.headway},${h.targetHeadway}`);
    const csvContent = 'data:text/csv;charset=utf-8,' + headers.join(',') + rows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `jeeptrack_ridership_analytics_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full max-w-[1720px] mx-auto px-3 sm:px-5 py-4 space-y-4 font-sans text-slate-900 dark:text-slate-100">
      
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider">
            <BarChart3 className="w-4 h-4" />
            <span>Passenger Mobility & Revenue Intelligence</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1 tracking-tight">
            Hourly Passenger Analytics & Corridor Demand
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Ridership demand distribution, fare volume, peak headway SLA compliance, and terminal boarding metrics.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          {/* Time range toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
            <button
              onClick={() => setTimeRange('today')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                timeRange === 'today' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setTimeRange('week')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                timeRange === 'week' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setTimeRange('month')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                timeRange === 'month' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Month
            </button>
          </div>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCsv}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-950/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV Log</span>
            <span className="sm:hidden">Export</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Ridership */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-3.5 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight block truncate">
              Daily Passenger Volume
            </span>
            <div className="text-xl font-black font-mono text-slate-900 dark:text-white leading-tight">
              {totalRidership.toLocaleString()}
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> +14.2% vs yesterday
            </span>
          </div>
        </div>

        {/* Gross Fare Revenue */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-3.5 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight block truncate">
              Estimated Gross Fare
            </span>
            <div className="text-xl font-black font-mono text-slate-900 dark:text-white leading-tight">
              ₱{totalGrossRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-slate-400 font-medium">
              ₱11.00 base student / ₱13 reg
            </span>
          </div>
        </div>

        {/* Student Fare Subsidy Impact */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-3.5 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-900 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight block truncate">
              RA 11314 Student Savings
            </span>
            <div className="text-xl font-black font-mono text-purple-600 dark:text-purple-400 leading-tight">
              ₱{(studentCount * 2.0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-slate-500 font-medium">
              {studentCount.toLocaleString()} student trips
            </span>
          </div>
        </div>

        {/* Average Corridor Headway */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-3.5 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-900 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight block truncate">
              Fleet Headway SLA
            </span>
            <div className="text-xl font-black font-mono text-slate-900 dark:text-white leading-tight">
              6.8 mins
            </div>
            <span className="text-[10px] text-teal-600 dark:text-teal-400 font-bold">
              Target: &le; 7.0 mins (Optimal)
            </span>
          </div>
        </div>
      </div>

      {/* Row 2: Charts (Hourly Passenger Stream & Headway SLA Line) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Hourly Ridership Volume (8 cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Hourly Passenger Flow & PUJ Deployments
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Ridership peaks at 07:00–08:00 (PLMun Class Starts) and 16:00–18:00 (Dismissal)
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-lg">
              Live Flow
            </span>
          </div>

          <div className="h-64 w-full my-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="paxGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} vertical={false} />
                <XAxis dataKey="hour" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '10px', color: '#fff', fontSize: '11px' }}
                />
                <Area type="monotone" dataKey="passengers" stroke="#2563EB" strokeWidth={2.5} fillOpacity={1} fill="url(#paxGrad)" name="Passengers" />
                <Bar dataKey="trips" fill="#10B981" radius={[4, 4, 0, 0]} name="Completed Trips" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5"><span className="w-3 h-1 bg-blue-600 rounded"></span> Commuter Ridership</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-emerald-500 rounded"></span> Scheduled Trips</span>
            </div>
            <span className="font-mono text-emerald-600 font-bold">+18.4% capacity utilization</span>
          </div>
        </div>

        {/* Demographic Breakdown Donut (4 cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Ridership Classification
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Verified PLMun student credentials</p>
            </div>
            <Award className="w-4 h-4 text-emerald-600" />
          </div>

          <div className="relative h-48 w-full flex items-center justify-center my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={demographicData}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={74}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {demographicData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black font-mono text-slate-900 dark:text-white leading-none">
                72%
              </span>
              <span className="text-[10px] text-slate-400 font-medium">PLMun Student</span>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00B14F]"></span> PLMun Students (₱11.00):
              </span>
              <span className="font-mono font-bold">{studentCount.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span> Regular Public (₱13.00):
              </span>
              <span className="font-mono font-bold">{regularCount.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Stop Ridership Concentration & Headway SLA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Stop Boarding Concentration (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Passenger Boarding Density by Station
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Key terminal bay queues and corridor landmarks</p>
            </div>
            <MapPin className="w-4 h-4 text-emerald-600" />
          </div>

          <div className="h-56 w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stopDemandData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} vertical={false} />
                <XAxis dataKey="stopName" stroke="#94a3b8" fontSize={9} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                />
                <Bar dataKey="passengers" fill="#00B14F" radius={[4, 4, 0, 0]} name="Boardings" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>PLMun Main Gate & Alabang South Station account for 52% of all boarding queues</span>
            <span className="font-mono text-emerald-600 font-bold">5.2 km Route</span>
          </div>
        </div>

        {/* Headway SLA Line Chart (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Corridor Headway vs 7-Minute SLA Target
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Target &le; 7.0 minutes departure interval</p>
            </div>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>

          <div className="h-56 w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hourlyChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} vertical={false} />
                <XAxis dataKey="hour" stroke="#94a3b8" fontSize={9} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} domain={[4, 12]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                />
                <Line type="monotone" dataKey="headway" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 3 }} name="Actual Headway (min)" />
                <Line type="monotone" dataKey="targetHeadway" stroke="#10B981" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="Target SLA (min)" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-around text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-1 bg-blue-600 rounded"></span> Actual Interval</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-1 bg-emerald-500 rounded border border-dashed"></span> 7.0m Mandated SLA</span>
          </div>
        </div>
      </div>

    </div>
  );
};

export default PassengerAnalyticsView;
