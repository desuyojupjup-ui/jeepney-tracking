import React, { useState } from 'react';
import { useTransit } from '../context/TransitContext';
import { useToast } from '../context/ToastContext';
import { 
  Banknote, 
  Coins, 
  RotateCcw, 
  Save, 
  CheckCircle2, 
  Sparkles, 
  Bus, 
  Zap, 
  Wind, 
  Sliders, 
  Calculator, 
  ArrowRight, 
  HelpCircle,
  FileText
} from 'lucide-react';

export const FareManagementView: React.FC = () => {
  const { 
    stops, 
    fareConfig, 
    updateFareConfig, 
    updateStopFares, 
    resetFareConfig,
    calculateFare 
  } = useTransit();
  const { showToast } = useToast();

  // Local form state
  const [baseRegular, setBaseRegular] = useState<number>(fareConfig.baseFareRegular);
  const [baseDiscounted, setBaseDiscounted] = useState<number>(fareConfig.baseFareDiscounted);
  const [perKmRegular, setPerKmRegular] = useState<number>(fareConfig.perKmRateRegular);
  const [perKmDiscounted, setPerKmDiscounted] = useState<number>(fareConfig.perKmRateDiscounted);
  const [firstKmCoverage, setFirstKmCoverage] = useState<number>(fareConfig.firstKmCoverage);

  // Stop custom edit mode
  const [editingStopId, setEditingStopId] = useState<string | null>(null);
  const [stopRegularInput, setStopRegularInput] = useState<number>(0);
  const [stopDiscountedInput, setStopDiscountedInput] = useState<number>(0);

  // Test Calculator State
  const [testOrigin, setTestOrigin] = useState<string>(stops[0]?.id || 'stop-1');
  const [testDestination, setTestDestination] = useState<string>(stops[stops.length - 1]?.id || 'stop-7');

  const handleApplyPreset = (presetName: string, reg: number, disc: number, perKmR: number, perKmD: number) => {
    setBaseRegular(reg);
    setBaseDiscounted(disc);
    setPerKmRegular(perKmR);
    setPerKmDiscounted(perKmD);
    updateFareConfig({
      baseFareRegular: reg,
      baseFareDiscounted: disc,
      perKmRateRegular: perKmR,
      perKmRateDiscounted: perKmD,
    }, true);

    showToast({
      type: 'success',
      title: 'Preset Applied!',
      message: `Fare matrix configured to ${presetName}: ₱${reg.toFixed(2)} Regular / ₱${disc.toFixed(2)} Student.`,
      duration: 3500,
    });
  };

  const handleSaveGlobalRates = (e: React.FormEvent) => {
    e.preventDefault();
    updateFareConfig({
      baseFareRegular: Number(baseRegular),
      baseFareDiscounted: Number(baseDiscounted),
      perKmRateRegular: Number(perKmRegular),
      perKmRateDiscounted: Number(perKmDiscounted),
      firstKmCoverage: Number(firstKmCoverage),
    }, true);

    showToast({
      type: 'success',
      title: 'Fare Rates Saved!',
      message: `New tariff rates broadcasted across the entire system (Commuter and Driver apps).`,
      duration: 4000,
    });
  };

  const handleSaveSingleStop = (stopId: string) => {
    updateStopFares(stopId, Number(stopRegularInput), Number(stopDiscountedInput));
    setEditingStopId(null);
    showToast({
      type: 'success',
      title: 'Stop Fare Updated!',
      message: `Custom tariff rates saved for this stop.`,
      duration: 3000,
    });
  };

  const handleResetDefaults = () => {
    if (window.confirm('Are you sure you want to reset the fare matrix to official LTFRB default rates?')) {
      resetFareConfig();
      setBaseRegular(13.00);
      setBaseDiscounted(11.00);
      setPerKmRegular(1.80);
      setPerKmDiscounted(1.50);
      setFirstKmCoverage(4.0);
      showToast({
        type: 'info',
        title: 'Reset to Default',
        message: 'System restored to standard LTFRB ₱13.00 traditional PUJ fare matrix.',
        duration: 3500,
      });
    }
  };

  const calculatedTestRegular = calculateFare(testOrigin, testDestination, false);
  const calculatedTestDiscounted = calculateFare(testOrigin, testDestination, true);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* =========================================================================
          PAGE HEADER WITH ACTIONS
          ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#006837] to-[#00B14F] text-white flex items-center justify-center font-black text-xl shadow-md shrink-0">
            ₱
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Jeepney Fare Matrix & Rates
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                Live Dynamic Rates
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Configure official passenger fare rates for the PLMun ⇄ Alabang Corridor. Automatically updates commuter and driver apps.
            </p>
          </div>
        </div>

        <button
          onClick={handleResetDefaults}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer self-start md:self-auto active:scale-95"
          title="Reset to LTFRB standard fare rates"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset to Default (LTFRB)</span>
        </button>
      </div>

      {/* =========================================================================
          TOP KPI CARDS (Matching Image 5 Layout)
          ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Regular Base Fare */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 font-bold shrink-0">
              ₱
            </div>
            <div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Base Regular</span>
              <span className="text-[11px] text-slate-400">First {fareConfig.firstKmCoverage} km</span>
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
            ₱{fareConfig.baseFareRegular.toFixed(2)}
          </div>
        </div>

        {/* Card 2: Student / Senior Fare */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 font-bold shrink-0">
              %
            </div>
            <div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Student / Senior</span>
              <span className="text-[11px] text-emerald-500 font-medium">20% Mandated discount</span>
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
            ₱{fareConfig.baseFareDiscounted.toFixed(2)}
          </div>
        </div>

        {/* Card 3: Per Km Rate */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 shrink-0">
              <Bus className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Per Km Rate</span>
              <span className="text-[11px] text-slate-400">Succeeding distance</span>
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400">
            +₱{fareConfig.perKmRateRegular.toFixed(2)}
          </div>
        </div>

        {/* Card 4: Corridor Stops */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Corridor Stops</span>
              <span className="text-[11px] text-slate-400">PLMun to Alabang</span>
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
            {stops.length}
          </div>
        </div>
      </div>

      {/* =========================================================================
          1. QUICK LTFRB PRESETS BAR
          ========================================================================= */}
      <div className="space-y-2">
        <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Official Fare Presets (Quick LTFRB Profiles)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Preset 1: Traditional PUJ */}
          <button
            onClick={() => handleApplyPreset('Traditional PUJ', 13.00, 11.00, 1.80, 1.50)}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 text-left transition-all group shadow-xs cursor-pointer hover:scale-[1.01]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                  <Bus className="w-4 h-4" />
                </div>
                <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Traditional PUJ
                </span>
              </div>
              <span className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400">
                ₱13.00 Base
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
              Standard LTFRB tariff for traditional jeepneys: ₱13.00 base (first 4 km) + ₱1.80/km (Regular) / ₱11.00 (Student 20% disc).
            </p>
          </button>

          {/* Preset 2: Modern Electric Jeepney */}
          <button
            onClick={() => handleApplyPreset('Modern Electric PUJ', 15.00, 12.00, 2.20, 1.75)}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 text-left transition-all group shadow-xs cursor-pointer hover:scale-[1.01]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 flex items-center justify-center">
                  <Zap className="w-4 h-4" />
                </div>
                <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Modern E-Jeepney
                </span>
              </div>
              <span className="text-xs font-mono font-black text-blue-600 dark:text-blue-400">
                ₱15.00 Base
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
              Modern Electric E-Jeepney tariff: ₱15.00 base (first 4 km) + ₱2.20/km (Regular) / ₱12.00 (Student 20% disc).
            </p>
          </button>

          {/* Preset 3: Modern Air-Conditioned PUJ */}
          <button
            onClick={() => handleApplyPreset('Modern Aircon Euro-4', 16.00, 13.00, 2.40, 1.90)}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-500 dark:hover:border-purple-500 text-left transition-all group shadow-xs cursor-pointer hover:scale-[1.01]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 flex items-center justify-center">
                  <Wind className="w-4 h-4" />
                </div>
                <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Modern Aircon Euro-4
                </span>
              </div>
              <span className="text-xs font-mono font-black text-purple-600 dark:text-purple-400">
                ₱16.00 Base
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
              Air-conditioned Class 2 PUJ tariff: ₱16.00 base (first 4 km) + ₱2.40/km (Regular) / ₱13.00 (Student 20% disc).
            </p>
          </button>
        </div>
      </div>

      {/* =========================================================================
          2. CORE FARE ADJUSTMENT CARDS & FORM
          ========================================================================= */}
      <form onSubmit={handleSaveGlobalRates} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-600" />
            <h2 className="font-extrabold text-base text-slate-900 dark:text-white">
              Base Tariff & Distance Rates (Global Rate Adjustments)
            </h2>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Last Updated: {fareConfig.lastUpdated || 'Today'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Input 1: Regular Base Fare */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              Regular Base Fare (First 4 km)
            </label>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black text-slate-400">₱</span>
              <input
                type="number"
                step="0.5"
                min="5"
                max="50"
                value={baseRegular}
                onChange={(e) => setBaseRegular(Number(e.target.value))}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1.5 text-base font-black font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setBaseRegular((prev) => Math.max(5, prev - 1))}
                className="flex-1 py-1 text-[11px] font-bold rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
              >
                - ₱1
              </button>
              <button
                type="button"
                onClick={() => setBaseRegular((prev) => prev + 1)}
                className="flex-1 py-1 text-[11px] font-bold rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
              >
                + ₱1
              </button>
            </div>
          </div>

          {/* Input 2: Discounted Base Fare */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Student / Senior / PWD Base
              </label>
              <span className="text-[10px] font-extrabold text-emerald-600">20% Disc</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black text-slate-400">₱</span>
              <input
                type="number"
                step="0.5"
                min="4"
                max="40"
                value={baseDiscounted}
                onChange={(e) => setBaseDiscounted(Number(e.target.value))}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1.5 text-base font-black font-mono text-emerald-600 dark:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setBaseDiscounted((prev) => Math.max(4, prev - 1))}
                className="flex-1 py-1 text-[11px] font-bold rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
              >
                - ₱1
              </button>
              <button
                type="button"
                onClick={() => setBaseDiscounted((prev) => prev + 1)}
                className="flex-1 py-1 text-[11px] font-bold rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
              >
                + ₱1
              </button>
            </div>
          </div>

          {/* Input 3: Regular Per Km Rate */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              Rate per succeeding km (Regular)
            </label>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black text-slate-400">₱</span>
              <input
                type="number"
                step="0.10"
                min="0.5"
                max="10"
                value={perKmRegular}
                onChange={(e) => setPerKmRegular(Number(e.target.value))}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1.5 text-base font-black font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <span className="text-[10px] text-slate-400 block">Applied beyond first 4.0 km</span>
          </div>

          {/* Input 4: Discounted Per Km Rate */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              Rate per succeeding km (Student / Senior / PWD)
            </label>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black text-slate-400">₱</span>
              <input
                type="number"
                step="0.10"
                min="0.5"
                max="10"
                value={perKmDiscounted}
                onChange={(e) => setPerKmDiscounted(Number(e.target.value))}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1.5 text-base font-black font-mono text-emerald-600 dark:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <span className="text-[10px] text-slate-400 block">Includes 20% statutory discount</span>
          </div>

        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <HelpCircle className="w-4 h-4 text-slate-400" />
            <span>First 4.0 kilometers covered under base tariff per official LTFRB guidelines.</span>
          </div>

          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#006837] via-[#008A4B] to-[#00B14F] hover:from-[#005a30] hover:to-[#009643] text-white text-xs font-extrabold shadow-sm active:scale-95 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save and Apply Fare Changes</span>
          </button>
        </div>
      </form>

      {/* =========================================================================
          3. STOP-BY-STOP OFFICIAL CORRIDOR MATRIX TABLE
          ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <span>Official Corridor Fare Matrix (Stop-by-Stop)</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-mono text-slate-600 dark:text-slate-300">
                From PLMun Terminal
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Tariff rates from PLMun University to each designated stop along Manila South Road corridor.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/80 self-start sm:self-auto">
            {stops.length} Approved Stops
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Stop Name</th>
                <th className="py-3 px-4">Landmark / Location</th>
                <th className="py-3 px-4 text-center">Regular Fare</th>
                <th className="py-3 px-4 text-center">Student / Senior / PWD</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {stops.map((stop) => {
                const isEditing = editingStopId === stop.id;
                return (
                  <tr key={stop.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-black text-slate-400">
                      #{stop.sequence}
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-slate-900 dark:text-white">
                      {stop.name}
                      {stop.sequence === 1 && (
                        <span className="ml-2 text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          Origin Hub
                        </span>
                      )}
                      {stop.sequence === stops.length && (
                        <span className="ml-2 text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                          End Terminal
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                      {stop.landmark}
                    </td>
                    
                    {/* Regular Fare Column */}
                    <td className="py-3.5 px-4 text-center">
                      {isEditing ? (
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-slate-400">₱</span>
                          <input
                            type="number"
                            step="0.5"
                            value={stopRegularInput}
                            onChange={(e) => setStopRegularInput(Number(e.target.value))}
                            className="w-16 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded text-center font-black font-mono"
                          />
                        </div>
                      ) : (
                        <span className="font-mono font-black text-slate-900 dark:text-white text-sm bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                          ₱{stop.fareFromOriginRegular.toFixed(2)}
                        </span>
                      )}
                    </td>

                    {/* Discounted Fare Column */}
                    <td className="py-3.5 px-4 text-center">
                      {isEditing ? (
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-slate-400">₱</span>
                          <input
                            type="number"
                            step="0.5"
                            value={stopDiscountedInput}
                            onChange={(e) => setStopDiscountedInput(Number(e.target.value))}
                            className="w-16 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded text-center font-black font-mono text-emerald-600"
                          />
                        </div>
                      ) : (
                        <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800/80">
                          ₱{stop.fareFromOriginDiscounted.toFixed(2)}
                        </span>
                      )}
                    </td>

                    {/* Actions Column */}
                    <td className="py-3.5 px-4 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleSaveSingleStop(stop.id)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingStopId(null)}
                            className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingStopId(stop.id);
                            setStopRegularInput(stop.fareFromOriginRegular);
                            setStopDiscountedInput(stop.fareFromOriginDiscounted);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer"
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================================
          4. INTERACTIVE LIVE FARE CALCULATOR TESTER
          ========================================================================= */}
      <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-[#0B132B] text-white rounded-2xl p-5 sm:p-6 shadow-md border border-emerald-800/50 space-y-4">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-emerald-400" />
          <h3 className="font-black text-base text-white">
            Interactive Fare Test Calculator
          </h3>
        </div>
        <p className="text-xs text-slate-300">
          Select boarding origin and drop-off destination to immediately test tariff calculations before commuters use them.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-end">
          {/* Origin selector */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-emerald-200 uppercase">Origin:</label>
            <select
              value={testOrigin}
              onChange={(e) => setTestOrigin(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none cursor-pointer"
            >
              {stops.map(s => (
                <option key={s.id} value={s.id}>#{s.sequence} {s.name}</option>
              ))}
            </select>
          </div>

          {/* Destination selector */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-emerald-200 uppercase">Destination:</label>
            <select
              value={testDestination}
              onChange={(e) => setTestDestination(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none cursor-pointer"
            >
              {stops.map(s => (
                <option key={s.id} value={s.id}>#{s.sequence} {s.name}</option>
              ))}
            </select>
          </div>

          {/* Computed Regular Result */}
          <div className="bg-white/10 rounded-xl p-3 border border-white/15 text-center">
            <span className="text-[10px] font-extrabold uppercase text-slate-300 block">Calculated Regular Fare</span>
            <div className="text-2xl font-black font-mono text-white">
              ₱{calculatedTestRegular.toFixed(2)}
            </div>
          </div>

          {/* Computed Student Result */}
          <div className="bg-emerald-500/20 rounded-xl p-3 border border-emerald-400/30 text-center">
            <span className="text-[10px] font-extrabold uppercase text-emerald-300 block">Student / Senior (20% Off)</span>
            <div className="text-2xl font-black font-mono text-emerald-400">
              ₱{calculatedTestDiscounted.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

