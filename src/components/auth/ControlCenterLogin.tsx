import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { 
  Lock, 
  Mail,
  User, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  ArrowLeft
} from 'lucide-react';

interface ControlCenterLoginProps {
  onSuccess?: () => void;
  onBackToCommuter?: () => void;
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

export const ControlCenterLogin: React.FC<ControlCenterLoginProps> = ({
  onSuccess,
  onBackToCommuter,
}) => {
  const { loginOperator } = useAuth();
  const { showToast } = useToast();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      const res = loginOperator(username, password);
      setIsLoading(false);
      if (res.success) {
        showToast({
          type: 'login',
          title: 'Control Center Authenticated',
          message: 'Central fleet telemetry and dispatch console active.',
          duration: 4000,
        });
        if (onSuccess) onSuccess();
      } else {
        setError(res.error || 'Authentication failed. Please verify credentials.');
      }
    }, 400);
  };

  const handleGoogleSignIn = () => {
    loginOperator('operator@jeeptrack.ph', 'operator123');
    showToast({
      type: 'login',
      title: 'Google Single Sign-On',
      message: 'Logged in as Lead Dispatcher (operator@jeeptrack.ph).',
      duration: 3500,
    });
    if (onSuccess) onSuccess();
  };

  const handleForgotPassword = () => {
    showToast({
      type: 'info',
      title: 'Password Recovery',
      message: 'Master recovery credentials sent to Muntinlupa City Hall Transit Authority.',
      duration: 4000,
    });
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 overflow-hidden bg-[#fafafa] dark:bg-[#0b0c10] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1e2230_1px,transparent_1px)] [background-size:20px_20px] transition-colors duration-300">
      
      {/* Top Left Return Button */}
      {onBackToCommuter && (
        <button
          type="button"
          onClick={onBackToCommuter}
          className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-800 transition-all cursor-pointer shadow-xs"
          title="Return to Homepage"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Homepage</span>
        </button>
      )}

      {/* Main Login Card - Exactly 7px border radius matching reference layout */}
      <div className="relative w-full max-w-[420px] z-10 my-6 bg-white dark:bg-[#12131a] rounded-[7px] border border-slate-200/90 dark:border-slate-800/90 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)] p-7 sm:p-9 transition-all">
        
        {/* Header Title & Subtitle matching reference */}
        <div className="text-center mt-1">
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
            WELCOME TO CONTROL CENTER
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-400 mt-1.5 leading-relaxed">
            Access your account and unleash the full power of JEEPTRACK
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mt-4 p-3 rounded-[7px] bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2.5 text-rose-700 dark:text-rose-300 text-xs animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {/* Field 1: Email / Username */}
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
                value={username}
                onChange={(e) => setUsername(e.target.value)}
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

        {/* Bottom subtle text */}
        <div className="text-center text-xs text-slate-500 dark:text-slate-400 mt-5">
          <span>Official Dispatch Terminal &bull; Muntinlupa City Hall</span>
        </div>

      </div>
    </div>
  );
};

export default ControlCenterLogin;
