import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  X, 
  GraduationCap, 
  Briefcase, 
  Building, 
  ShieldCheck, 
  QrCode, 
  CheckCircle2, 
  LogOut, 
  Calendar, 
  Mail, 
  Phone, 
  Award,
  Bus
} from 'lucide-react';

interface CommuterProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout?: () => void;
  onRequestSignOut?: () => void;
}

export const CommuterProfileModal: React.FC<CommuterProfileModalProps> = ({
  isOpen,
  onClose,
  onLogout,
  onRequestSignOut,
}) => {
  const { currentCommuter, logoutCommuter } = useAuth();

  if (!isOpen || !currentCommuter) return null;

  const isStudent = currentCommuter.commuterType === 'student';
  const isFaculty = currentCommuter.commuterType === 'faculty';

  return (
    <div className="fixed inset-0 z-[9000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-emerald-100 dark:border-emerald-950/60 overflow-hidden transform transition-all">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/20 text-white hover:bg-black/40 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Top Header Card mimicking University ID */}
        <div className="relative bg-gradient-to-r from-[#004D25] via-[#006837] to-[#008A4B] text-white p-6 pt-7 text-center overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full bg-white/10 blur-xl pointer-events-none" />
          
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-extrabold tracking-widest uppercase bg-amber-400 text-slate-900 px-2.5 py-0.5 rounded-full shadow-xs">
                Official Digital Transit ID
              </span>
            </div>
            <h2 className="text-base font-black tracking-tight text-white">
              PAMANTASAN NG LUNGSOD NG MUNTINLUPA
            </h2>
            <p className="text-[11px] text-emerald-200">
              Muntinlupa City Smart Transit Network
            </p>

            {/* Avatar */}
            <div className="relative mt-4">
              <div className="w-20 h-20 rounded-2xl border-4 border-white/90 bg-slate-100 dark:bg-slate-800 shadow-xl overflow-hidden flex items-center justify-center">
                {currentCommuter.avatarUrl ? (
                  <img 
                    src={currentCommuter.avatarUrl} 
                    alt={currentCommuter.fullName} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-black text-[#006837]">
                    {currentCommuter.fullName.charAt(0)}
                  </span>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 p-1 bg-emerald-500 text-white rounded-full shadow-sm" title="PLMun Verified">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-2.5">
              <h3 className="text-lg font-black text-white leading-tight">
                {currentCommuter.fullName}
              </h3>
              <p className="text-xs text-emerald-100/90 font-mono mt-0.5">
                ID: {currentCommuter.idNumber}
              </p>
            </div>
          </div>
        </div>

        {/* Body Details */}
        <div className="p-6 space-y-4">
          
          {/* Institutional Role Pill */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
            <div className="flex items-center gap-2.5">
              {isStudent ? (
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                  <GraduationCap className="w-5 h-5" />
                </div>
              ) : isFaculty ? (
                <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                  <Briefcase className="w-5 h-5" />
                </div>
              ) : (
                <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                  <Building className="w-5 h-5" />
                </div>
              )}
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white capitalize">
                  {currentCommuter.commuterType} Account
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
                  {currentCommuter.collegeOrDepartment}
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                Verified
              </span>
            </div>
          </div>

          {/* Student Discount Privilege Banner */}
          {currentCommuter.transitDiscountEligible ? (
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 flex items-start gap-3">
              <Award className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                  20% Student Fare Discount Active
                </div>
                <div className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5">
                  Valid on all PLMun–Alabang Jeepney routes under RA 11314 (Student Fare Discount Act).
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 flex items-start gap-3 text-slate-600 dark:text-slate-300">
              <Bus className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  Regular University Transit Access
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Full access to real-time telemetry, terminal departures, and route arrival alerts.
                </div>
              </div>
            </div>
          )}

          {/* Additional details */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Institutional Email</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block mt-0.5">
                {currentCommuter.email}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Program / Unit</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block mt-0.5">
                {currentCommuter.courseOrProgram || currentCommuter.yearLevel || 'PLMun Member'}
              </span>
            </div>
          </div>

          {/* Simulated Boarding QR Code */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-center flex flex-col items-center justify-center gap-1.5">
            <div className="p-2 bg-white rounded-xl shadow-xs border border-slate-200">
              <QrCode className="w-16 h-16 text-slate-900" />
            </div>
            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
              SCAN TO VALIDATE PLMUN PASS #{currentCommuter.idNumber}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                if (onRequestSignOut) {
                  onRequestSignOut();
                } else {
                  logoutCommuter();
                  if (onLogout) onLogout();
                }
              }}
              className="flex-1 py-2.5 px-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-bold text-xs border border-rose-200 dark:border-rose-900/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out Account</span>
            </button>

            <button
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Close Pass
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
