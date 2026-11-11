import React from 'react';
import { useTransit } from '../../context/TransitContext';
import { AlertTriangle, ShieldAlert, Check, X, PhoneCall, Radio } from 'lucide-react';

export const EmergencyAlertModal: React.FC = () => {
  const { activeSosAlert, acknowledgeAlert, dismissSosBanner } = useTransit();

  if (!activeSosAlert) return null;

  const handleAcknowledge = () => {
    acknowledgeAlert(activeSosAlert.id);
    dismissSosBanner();
  };

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-[95%] max-w-lg animate-bounce-once">
      <div className="bg-rose-950/95 border-2 border-rose-500 text-white rounded-2xl p-4 shadow-2xl backdrop-blur-md flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-rose-600/40 text-rose-300 border border-rose-400 flex items-center justify-center shrink-0 mt-0.5 animate-pulse">
          <ShieldAlert className="w-6 h-6 text-rose-300" />
        </div>

        <div className="flex-1 space-y-1 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-mono font-black text-rose-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
              {activeSosAlert.type.replace('_', ' ')} BROADCAST
            </span>
            <span className="font-mono text-rose-200 text-[10px]">{activeSosAlert.createdAt} PST</span>
          </div>

          <p className="text-white font-bold text-sm">
            Unit {activeSosAlert.jeepneyCode} &bull; Driver {activeSosAlert.driverName}
          </p>

          <p className="text-rose-100 text-xs">
            {activeSosAlert.message}
          </p>

          <div className="pt-2 flex items-center gap-2">
            <button
              onClick={handleAcknowledge}
              className="flex-1 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-md transition-all active:scale-95"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Acknowledge & Dispatch Response</span>
            </button>
            <button
              onClick={dismissSosBanner}
              className="px-2.5 py-1.5 rounded-lg bg-rose-900/60 hover:bg-rose-900 text-rose-200 text-xs font-semibold"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
