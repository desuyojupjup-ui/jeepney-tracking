import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { UserRole, CommuterType } from '../../types';
import { 
  X, 
  GraduationCap, 
  Mail,
  Lock,
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2, 
  Briefcase, 
  Building
} from 'lucide-react';

interface UnifiedAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRole?: 'commuter' | 'driver' | 'operator';
  onLoginSuccess?: (role: UserRole) => void;
}

const GoogleIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

export const UnifiedAuthModal: React.FC<UnifiedAuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const { 
    loginCommuter, 
    registerCommuter, 
    loginDriver, 
    loginOperator 
  } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'signin' | 'register'>('signin');

  // Sign In State
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Register State (Commuter PLMun)
  const [regCommuterType, setRegCommuterType] = useState<CommuterType>('student');
  const [regFullName, setRegFullName] = useState('');
  const [regIdNumber, setRegIdNumber] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regCollege, setRegCollege] = useState('College of Information Technology (CIT)');
  const [regCourse, setRegCourse] = useState('BS Information Technology');
  const [regYearLevel, setRegYearLevel] = useState('1st Year');
  const [regContactNumber, setRegContactNumber] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);

  const handleSignInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      // 1. Try Commuter Authentication
      const commuterRes = loginCommuter(identifier, password);
      if (commuterRes.success) {
        setIsLoading(false);
        showToast({
          type: 'login',
          title: 'Welcome Back, Commuter!',
          message: 'Logged in successfully. Real-time campus telemetry is active.',
          duration: 4000,
        });
        if (onLoginSuccess) onLoginSuccess('commuter');
        onClose();
        return;
      }

      // 2. Try Driver Authentication
      const driverRes = loginDriver(identifier, password);
      if (driverRes.success) {
        setIsLoading(false);
        showToast({
          type: 'login',
          title: 'Driver Shift Active',
          message: 'Logged in successfully. In-cab console is ready for route dispatch.',
          duration: 4000,
        });
        if (onLoginSuccess) onLoginSuccess('driver');
        onClose();
        return;
      }

      // 3. Try Operator Authentication
      const operatorRes = loginOperator(identifier, password);
      if (operatorRes.success) {
        setIsLoading(false);
        showToast({
          type: 'login',
          title: 'Control Center Authenticated',
          message: 'Logged in successfully. Central fleet telemetry and dispatch console active.',
          duration: 4000,
        });
        if (onLoginSuccess) onLoginSuccess('operator');
        onClose();
        return;
      }

      if (driverRes.error && driverRes.error.includes('suspended')) {
        setIsLoading(false);
        setError(driverRes.error);
        return;
      }

      setIsLoading(false);
      setError('Invalid credentials. Please verify your Student/Employee ID, Driver username, or Admin username and password.');
    }, 350);
  };

  const handleGoogleSignIn = () => {
    loginCommuter('student@plmun.edu.ph', 'student123');
    showToast({
      type: 'login',
      title: 'Google Sign In Successful',
      message: 'Signed in with PLMun Google Account.',
      duration: 3500,
    });
    if (onLoginSuccess) onLoginSuccess('commuter');
    onClose();
  };

  const handleForgotPassword = () => {
    showToast({
      type: 'info',
      title: 'Password Recovery',
      message: 'Password reset link sent to your institutional email address.',
      duration: 4000,
    });
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setRegSuccess(null);

    if (!agreeTerms) {
      setRegError('Please confirm the PLMun affirmation and transit terms.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setRegError('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const res = registerCommuter({
        fullName: regFullName,
        idNumber: regIdNumber,
        email: regEmail,
        password: regPassword,
        commuterType: regCommuterType,
        collegeOrDepartment: regCollege,
        yearLevel: regCommuterType === 'student' ? regYearLevel : undefined,
        courseOrProgram: regCourse,
        contactNumber: regContactNumber || '0900-000-0000',
      });

      setIsLoading(false);

      if (res.success) {
        setRegSuccess('Registration successful! Logging into JeepTrack...');
        showToast({
          type: 'login',
          title: 'Account Created Successfully',
          message: 'Welcome to JeepTrack! Your digital transit pass is active.',
          duration: 4000,
        });
        setTimeout(() => {
          if (onLoginSuccess) onLoginSuccess('commuter');
          onClose();
        }, 700);
      } else {
        setRegError(res.error || 'Registration failed. Please check information.');
      }
    }, 450);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9000] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in overflow-y-auto">
      {/* Reference Design: Exactly 7px border radius, clean white/dark card */}
      <div className="relative w-full max-w-[420px] bg-white dark:bg-[#12131a] rounded-[7px] border border-slate-200/90 dark:border-slate-800/90 shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-7 sm:p-9 my-auto transition-all">
        {/* Subtle Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 w-7 h-7 rounded-[7px] flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer z-10"
          title="Close"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Title & Subtitle */}
        <div className="text-center mt-1">
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
            {activeTab === 'signin' ? 'WELCOME TO JEEPTRACK' : 'CREATE AN ACCOUNT'}
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-400 mt-1.5 leading-relaxed">
            {activeTab === 'signin'
              ? 'Access your account and unleash the full power of JEEPTRACK'
              : 'Join the smart transit network for automated discounts and tracking'}
          </p>
        </div>

        {/* Error Messages */}
        {error && activeTab === 'signin' && (
          <div className="mt-4 p-3 rounded-[7px] bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2.5 text-rose-700 dark:text-rose-300 text-xs animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        {regError && activeTab === 'register' && (
          <div className="mt-4 p-3 rounded-[7px] bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2.5 text-rose-700 dark:text-rose-300 text-xs animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
            <span className="leading-snug">{regError}</span>
          </div>
        )}

        {regSuccess && activeTab === 'register' && (
          <div className="mt-4 p-3 rounded-[7px] bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2.5 text-emerald-800 dark:text-emerald-200 text-xs animate-fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{regSuccess}</span>
          </div>
        )}

        {/* ================================================================ */}
        {/* SIGN IN TAB (Matching Reference Layout Image 1:1)                  */}
        {/* ================================================================ */}
        {activeTab === 'signin' && (
          <>
            {/* Form */}
            <form onSubmit={handleSignInSubmit} className="mt-6 space-y-4">
              {/* Field 1: Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Enter Your Email"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-[7px] border border-slate-200 dark:border-slate-750 bg-white dark:bg-[#181a24] text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-slate-500 transition-all"
                  />
                </div>
              </div>

              {/* Field 2: Passwords */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Passwords
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter Your Passwords"
                    className="w-full pl-9 pr-10 py-2.5 rounded-[7px] border border-slate-200 dark:border-slate-750 bg-white dark:bg-[#181a24] text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-slate-500 transition-all"
                  />
                  {password.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer animate-fade-in"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>

              {/* Forgot Password Link Right Aligned */}
              <div className="text-right pt-0.5">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs font-bold text-slate-900 dark:text-slate-200 hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Solid Black Login Button with 7px radius */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 rounded-[7px] bg-black hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-slate-200 text-white font-bold text-xs uppercase tracking-wider transition-all active:scale-[0.99] cursor-pointer shadow-xs disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white dark:border-black/40 dark:border-t-black rounded-full animate-spin" />
                ) : (
                  <span>Login</span>
                )}
              </button>
            </form>

            {/* Don't have an Account ? Register */}
            <div className="text-center text-xs text-slate-500 dark:text-slate-400 mt-5">
              <span>Don't have an Account ?</span>{' '}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('register');
                  setError(null);
                  setRegError(null);
                }}
                className="font-bold text-slate-900 dark:text-white hover:underline cursor-pointer"
              >
                Register
              </button>
            </div>
          </>
        )}

        {/* ================================================================ */}
        {/* REGISTER TAB (Consistent 7px radius design system)               */}
        {/* ================================================================ */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5 mt-5">
            {/* Account Type Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Account Type
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setRegCommuterType('student')}
                  className={`py-1.5 px-2 rounded-[7px] text-xs font-semibold flex items-center justify-center gap-1 border transition-all cursor-pointer ${
                    regCommuterType === 'student'
                      ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Student</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRegCommuterType('faculty')}
                  className={`py-1.5 px-2 rounded-[7px] text-xs font-semibold flex items-center justify-center gap-1 border transition-all cursor-pointer ${
                    regCommuterType === 'faculty'
                      ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Faculty</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRegCommuterType('employee')}
                  className={`py-1.5 px-2 rounded-[7px] text-xs font-semibold flex items-center justify-center gap-1 border transition-all cursor-pointer ${
                    regCommuterType === 'employee'
                      ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <Building className="w-3.5 h-3.5" />
                  <span>Staff</span>
                </button>
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={regFullName}
                onChange={(e) => setRegFullName(e.target.value)}
                placeholder="Juan C. Dela Cruz"
                className="w-full px-3.5 py-2 rounded-[7px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#181a24] text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
            </div>

            {/* ID Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {regCommuterType === 'student' ? 'Student ID Number' : 'Employee ID'}
              </label>
              <input
                type="text"
                required
                value={regIdNumber}
                onChange={(e) => {
                  const val = e.target.value;
                  setRegIdNumber(val);
                  if (!regEmail && val) {
                    setRegEmail(`${val.toLowerCase().replace(/[^a-z0-9]/g, '')}@plmun.edu.ph`);
                  }
                }}
                placeholder={regCommuterType === 'student' ? '2023-01234' : 'FAC-2020-001'}
                className="w-full px-3.5 py-2 rounded-[7px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#181a24] text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                PLMun Email
              </label>
              <input
                type="email"
                required
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="user@plmun.edu.ph"
                className="w-full px-3.5 py-2 rounded-[7px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#181a24] text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Password
                </label>
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Min 6 chars"
                  className="w-full px-3.5 py-2 rounded-[7px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#181a24] text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Confirm
                </label>
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  required
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  placeholder="Re-type"
                  className="w-full px-3.5 py-2 rounded-[7px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#181a24] text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="modal-agree-terms"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="w-3.5 h-3.5 rounded-[3px] text-black focus:ring-slate-400 border-slate-300 cursor-pointer"
              />
              <label htmlFor="modal-agree-terms" className="text-[11px] text-slate-500 dark:text-slate-400 cursor-pointer">
                I agree to the PLMun Transit Portal Terms & Privacy
              </label>
            </div>

            {/* Register Action Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-3 py-3 rounded-[7px] bg-black hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-slate-200 text-white font-bold text-xs uppercase tracking-wider transition-all active:scale-[0.99] cursor-pointer shadow-xs disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/40 border-t-white dark:border-black/40 dark:border-t-black rounded-full animate-spin" />
              ) : (
                <span>Register Digital Pass</span>
              )}
            </button>

            {/* Switch back to Login */}
            <div className="text-center text-xs text-slate-500 dark:text-slate-400 mt-4">
              <span>Already have an Account ?</span>{' '}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('signin');
                  setRegError(null);
                  setError(null);
                }}
                className="font-bold text-slate-900 dark:text-white hover:underline cursor-pointer"
              >
                Login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default UnifiedAuthModal;
