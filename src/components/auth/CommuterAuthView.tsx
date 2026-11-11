import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { CommuterType } from '../../types';
import { 
  Lock, 
  Mail,
  ArrowLeft,
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle,
  GraduationCap,
  Briefcase,
  Building,
  User,
  ShieldCheck,
  Phone
} from 'lucide-react';

interface CommuterAuthViewProps {
  onSuccess?: () => void;
  onContinueAsGuest?: () => void;
  onBackToLanding?: () => void;
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

export const CommuterAuthView: React.FC<CommuterAuthViewProps> = ({
  onSuccess,
  onContinueAsGuest,
  onBackToLanding,
}) => {
  const { loginCommuter, registerCommuter, isOperatorAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Register form state
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
  const [isRegistering, setIsRegistering] = useState(false);
  const [regSuccessMessage, setRegSuccessMessage] = useState<string | null>(null);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    setTimeout(() => {
      const res = loginCommuter(loginIdentifier, loginPassword);
      setIsLoggingIn(false);
      if (res.success) {
        showToast({
          type: 'login',
          title: 'Welcome to JeepTrack!',
          message: 'Logged in successfully. Real-time campus telemetry is active.',
          duration: 4000,
        });
        if (onSuccess) onSuccess();
      } else {
        setLoginError(res.error || 'Authentication failed. Please verify credentials.');
      }
    }, 450);
  };

  const handleGoogleSignIn = () => {
    loginCommuter('student@plmun.edu.ph', 'student123');
    showToast({
      type: 'login',
      title: 'Google Sign In Successful',
      message: 'Signed in with PLMun Google Account (student@plmun.edu.ph).',
      duration: 3500,
    });
    if (onSuccess) onSuccess();
  };

  const handleForgotPassword = () => {
    showToast({
      type: 'info',
      title: 'Password Recovery',
      message: 'Password reset link sent to your registered institutional email address.',
      duration: 4000,
    });
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setRegSuccessMessage(null);

    if (!agreeTerms) {
      setRegError('Please accept the transit terms and declaration.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setRegError('Passwords do not match. Please re-type your password.');
      return;
    }

    setIsRegistering(true);

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

      setIsRegistering(false);

      if (res.success) {
        setRegSuccessMessage('Registration successful! Welcome to JeepTrack Muntinlupa.');
        showToast({
          type: 'login',
          title: 'Account Registered',
          message: 'Welcome to JeepTrack! Your digital pass is now active.',
          duration: 4000,
        });
        setTimeout(() => {
          if (onSuccess) onSuccess();
        }, 700);
      } else {
        setRegError(res.error || 'Registration failed. Please check your information.');
      }
    }, 550);
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 overflow-hidden bg-[#fafafa] dark:bg-[#0b0c10] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1e2230_1px,transparent_1px)] [background-size:20px_20px] transition-colors duration-300">
      
      {/* Top Left Return Button */}
      {onBackToLanding && (
        <button
          type="button"
          onClick={onBackToLanding}
          className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-800 transition-all cursor-pointer shadow-xs"
          title={isOperatorAuthenticated ? "Return to Admin Portal" : "Return to Homepage"}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{isOperatorAuthenticated ? "Admin Portal" : "Homepage"}</span>
        </button>
      )}

      {/* Main Login Card - Exactly 7px border radius matching reference layout */}
      <div className="relative w-full max-w-[420px] z-10 my-6 bg-white dark:bg-[#12131a] rounded-[7px] border border-slate-200/90 dark:border-slate-800/90 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)] p-7 sm:p-9 transition-all">
        
        {/* Header Title & Subtitle matching reference */}
        <div className="text-center mt-1">
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
            {mode === 'login' ? 'WELCOME TO JEEPTRACK' : 'CREATE AN ACCOUNT'}
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-400 mt-1.5 leading-relaxed">
            {mode === 'login' 
              ? 'Access your account and unleash the full power of JEEPTRACK' 
              : 'Join the smart transit network for automated discounts and tracking'}
          </p>
        </div>

        {/* Error Messages */}
        {loginError && mode === 'login' && (
          <div className="mt-4 p-3 rounded-[7px] bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2.5 text-rose-700 dark:text-rose-300 text-xs animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
            <span className="leading-snug">{loginError}</span>
          </div>
        )}

        {regError && mode === 'register' && (
          <div className="mt-4 p-3 rounded-[7px] bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2.5 text-rose-700 dark:text-rose-300 text-xs animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
            <span className="leading-snug">{regError}</span>
          </div>
        )}

        {regSuccessMessage && mode === 'register' && (
          <div className="mt-4 p-3 rounded-[7px] bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2.5 text-emerald-800 dark:text-emerald-200 text-xs animate-fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{regSuccessMessage}</span>
          </div>
        )}

        {/* ================================================================ */}
        {/* LOGIN MODE (Matching Reference Layout Image 1:1)                  */}
        {/* ================================================================ */}
        {mode === 'login' && (
          <>
            {/* Form */}
            <form onSubmit={handleLoginSubmit} className="mt-6 space-y-4">
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
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
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
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter Your Passwords"
                    className="w-full pl-9 pr-10 py-2.5 rounded-[7px] border border-slate-200 dark:border-slate-750 bg-white dark:bg-[#181a24] text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-slate-500 transition-all"
                  />
                  {loginPassword.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer animate-fade-in"
                      aria-label="Toggle password visibility"
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                disabled={isLoggingIn}
                className="w-full mt-2 py-3 rounded-[7px] bg-black hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-slate-200 text-white font-bold text-xs uppercase tracking-wider transition-all active:scale-[0.99] cursor-pointer shadow-xs disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoggingIn ? (
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
                  setMode('register');
                  setLoginError(null);
                  setRegError(null);
                }}
                className="font-bold text-slate-900 dark:text-white hover:underline cursor-pointer"
              >
                Register
              </button>
            </div>

            {/* Visitor Limited Access Preview */}
            {onContinueAsGuest && (
              <div className="text-center pt-3 border-t border-slate-100 dark:border-slate-800/80 mt-4">
                <button
                  type="button"
                  onClick={onContinueAsGuest}
                  className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:underline cursor-pointer"
                >
                  Preview Live Tracking Map as Visitor (Limited Access)
                </button>
              </div>
            )}
          </>
        )}

        {/* ================================================================ */}
        {/* REGISTER MODE (Same 7px radius design system)                     */}
        {/* ================================================================ */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5 mt-5">
            {/* Account Role Selector */}
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
                onChange={(e) => setRegIdNumber(e.target.value)}
                placeholder="e.g. 2022-04921"
                className="w-full px-3.5 py-2 rounded-[7px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#181a24] text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="name@plmun.edu.ph"
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

            {/* Terms checkbox */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="agree-terms"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="w-3.5 h-3.5 rounded-[3px] text-black focus:ring-slate-400 border-slate-300 cursor-pointer"
              />
              <label htmlFor="agree-terms" className="text-[11px] text-slate-500 dark:text-slate-400 cursor-pointer">
                I agree to the PLMun Transit Portal Terms & Privacy
              </label>
            </div>

            {/* Register button */}
            <button
              type="submit"
              disabled={isRegistering}
              className="w-full mt-3 py-3 rounded-[7px] bg-black hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-slate-200 text-white font-bold text-xs uppercase tracking-wider transition-all active:scale-[0.99] cursor-pointer shadow-xs disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isRegistering ? (
                <div className="w-4 h-4 border-2 border-white/40 border-t-white dark:border-black/40 dark:border-t-black rounded-full animate-spin" />
              ) : (
                <span>Register Account</span>
              )}
            </button>

            {/* Switch back to Login */}
            <div className="text-center text-xs text-slate-500 dark:text-slate-400 mt-4">
              <span>Already have an Account ?</span>{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setRegError(null);
                  setLoginError(null);
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

export default CommuterAuthView;
