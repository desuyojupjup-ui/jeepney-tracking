import React, { useEffect } from 'react';
import { LogOut, X, AlertTriangle, ShieldCheck, Bus, GraduationCap, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SignOutConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const SignOutConfirmModal: React.FC<SignOutConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const { currentCommuter, currentDriver, currentOperator } = useAuth();

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Determine active profile for display
  const userRole = currentOperator
    ? 'operator'
    : currentDriver
    ? 'driver'
    : currentCommuter
    ? 'commuter'
    : null;

  const userName = currentOperator?.name || currentDriver?.fullName || currentCommuter?.fullName || 'Active User';
  const roleLabel = currentOperator
    ? `Control Center Dispatcher • Badge #${currentOperator.badgeNumber || '001'}`
    : currentDriver
    ? `PUJ Driver • ${currentDriver.licenseNumber || 'Verified'}`
    : currentCommuter?.commuterType === 'student'
    ? `PLMun Student (${currentCommuter.idNumber})`
    : `PLMun Community Pass (${currentCommuter?.idNumber || 'Verified'})`;

  const consequenceText = currentDriver
    ? 'Signing out will terminate your current active shift, stop vehicle GPS telemetry broadcasting, and mark your PUJ unit as Off Duty.'
    : currentOperator
    ? 'Signing out will disconnect your access from the Central Dispatch console and terminal bay monitoring dashboard.'
    : 'Signing out will return you to the public landing page. Automated 20% student fare calculation will pause until you sign in again.';

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/60 animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl p-6 sm:p-7 text-slate-900 dark:text-slate-100 animate-in zoom-in-95 duration-200 overflow-hidden"
      >
        {/* Subtle Ambient Background Glow */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Top Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Cancel"
          aria-label="Cancel"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header Icon */}
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200/80 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-lg shadow-rose-500/10 mb-4 animate-bounce-once">
            <LogOut className="w-6 h-6 stroke-[2.2]" />
          </div>

          <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Sign Out Confirmation
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
            Are you sure you want to end your active session?
          </p>
        </div>

        {/* User Card Snapshot */}
        <div className="my-5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center font-black text-base shadow-sm shrink-0">
            {userRole === 'operator' ? (
              <LayoutDashboard className="w-5 h-5 text-indigo-200" />
            ) : userRole === 'driver' ? (
              <Bus className="w-5 h-5 text-blue-200" />
            ) : (
              <GraduationCap className="w-5 h-5 text-emerald-200" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-extrabold text-sm text-slate-900 dark:text-white truncate flex items-center gap-1.5">
              <span>{userName}</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 inline shrink-0" />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
              {roleLabel}
            </p>
          </div>
        </div>

        {/* Helpful Consequence Notice */}
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 flex items-start gap-2.5 text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed mb-6">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>{consequenceText}</span>
        </div>

        {/* Modal Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs transition-colors cursor-pointer active:scale-98"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 via-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-extrabold text-xs shadow-lg shadow-rose-600/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
          >
            <LogOut className="w-4 h-4" />
            <span>Yes, Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
