import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Sparkles,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Loader2,
  User,
  Briefcase,
  ShieldCheck,
  Building2,
  Crown,
} from 'lucide-react';
import { useAuth, type UserRole, type Department } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { useToast } from '../context/ToastContext';

const DEPARTMENTS: Department[] = [
  'HR',
  'Support',
  'Sales',
  'Finance',
  'Operations',
  'IT',
  'Other',
];

export const LoginPage: React.FC = () => {
  const [portalMode, setPortalMode] = useState<UserRole>('user');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState<Department>('HR');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { signIn, signInWithGoogle, isConfigured } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const handleToggleMode = (mode: UserRole) => {
    setPortalMode(mode);
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    if (portalMode === 'manager' && !department) {
      setErrorMessage('Please select your assigned department.');
      return;
    }

    setLoading(true);

    try {
      const { error, role } = await signIn(
        email,
        password,
        portalMode,
        portalMode === 'manager' ? department : undefined
      );

      if (error) {
        setErrorMessage(error);
        setLoading(false);
        return;
      }

      if (portalMode === 'admin' || role === 'admin') {
        showToast('Administrator session verified. Welcome Admin!', 'success');
        navigate('/admin', { replace: true });
      } else if (portalMode === 'manager' || role === 'manager') {
        showToast(`Welcome! Signed in as ${department} Department Manager.`, 'success');
        navigate(from === '/admin' ? '/' : from, { replace: true });
      } else {
        showToast('Welcome back! Signed in successfully.', 'success');
        navigate(from === '/admin' ? '/' : from, { replace: true });
      }
    } catch {
      setErrorMessage('An unexpected error occurred during sign in. Please try again.');
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setGoogleLoading(true);

    try {
      const { error } = await signInWithGoogle();
      if (error) {
        setErrorMessage(error);
        setGoogleLoading(false);
        return;
      }
      showToast('Redirecting to Google authentication...', 'info');
    } catch {
      setErrorMessage('Failed to connect to Google authentication.');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090f] text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Subtle Background Glows */}
      <div
        className={`absolute top-1/4 -left-32 w-96 h-96 rounded-full blur-3xl pointer-events-none transition-colors duration-500 ${
          portalMode === 'admin'
            ? 'bg-rose-500/10'
            : portalMode === 'manager'
            ? 'bg-amber-500/10'
            : 'bg-indigo-500/10'
        }`}
      />
      <div
        className={`absolute bottom-1/4 -right-32 w-96 h-96 rounded-full blur-3xl pointer-events-none transition-colors duration-500 ${
          portalMode === 'admin'
            ? 'bg-amber-500/10'
            : portalMode === 'manager'
            ? 'bg-violet-500/10'
            : 'bg-cyan-500/10'
        }`}
      />

      {/* Main Card Container */}
      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-3 group">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-all duration-300 ${
                portalMode === 'admin'
                  ? 'bg-gradient-to-tr from-rose-600 via-rose-500 to-amber-500 shadow-rose-600/30'
                  : portalMode === 'manager'
                  ? 'bg-gradient-to-tr from-amber-600 via-amber-500 to-violet-500 shadow-amber-600/30'
                  : 'bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 shadow-indigo-600/30'
              }`}
            >
              {portalMode === 'admin' ? (
                <Crown className="w-5 h-5 text-white" />
              ) : portalMode === 'manager' ? (
                <Briefcase className="w-5 h-5 text-white" />
              ) : (
                <Sparkles className="w-5 h-5 text-white" />
              )}
            </div>
            <span className="font-bold text-lg tracking-wider text-white uppercase">
              FLOWMIND{' '}
              <span
                className={`font-extrabold transition-colors duration-300 ${
                  portalMode === 'admin'
                    ? 'text-rose-400'
                    : portalMode === 'manager'
                    ? 'text-amber-400'
                    : 'text-indigo-400'
                }`}
              >
                {portalMode === 'admin'
                  ? 'ADMIN'
                  : portalMode === 'manager'
                  ? 'MANAGER'
                  : 'AI'}
              </span>
            </span>
          </Link>

          <h1 className="text-2xl font-bold text-white tracking-tight">
            {portalMode === 'admin'
              ? 'Administrator Sign In'
              : portalMode === 'manager'
              ? 'Manager Sign In'
              : 'Welcome back 👋'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {portalMode === 'admin'
              ? 'Enter verified system administrator credentials'
              : portalMode === 'manager'
              ? 'Sign in with your department credentials'
              : 'Sign in to continue to FLOWMIND'}
          </p>
        </div>

        {/* 3-Role Selection Toggle */}
        <div className="mb-4">
          <div className="text-center mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              Who are you signing in as?
            </span>
          </div>

          <div className="p-1 rounded-xl bg-[#0e1222] border border-white/10 grid grid-cols-3 gap-1 shadow-inner">
            {/* 1. Admin */}
            <button
              type="button"
              onClick={() => handleToggleMode('admin')}
              className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                portalMode === 'admin'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Crown className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>

            {/* 2. Manager */}
            <button
              type="button"
              onClick={() => handleToggleMode('manager')}
              className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                portalMode === 'manager'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Manager</span>
            </button>

            {/* 3. User */}
            <button
              type="button"
              onClick={() => handleToggleMode('user')}
              className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                portalMode === 'user'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>User</span>
            </button>
          </div>
        </div>

        {/* Form Card */}
        <div
          className={`glass-card rounded-2xl p-6 sm:p-8 border bg-[#0c101d]/90 shadow-2xl space-y-5 transition-all duration-300 ${
            portalMode === 'admin'
              ? 'border-rose-500/30 ring-1 ring-rose-500/20'
              : portalMode === 'manager'
              ? 'border-amber-500/30 ring-1 ring-amber-500/20'
              : 'border-white/[0.08]'
          }`}
        >
          {/* Admin Security Banner */}
          {portalMode === 'admin' && (
            <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2.5 animate-in fade-in duration-150">
              <ShieldCheck className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span className="text-[11px] leading-relaxed">
                Protected Administrator Portal. Role verified securely from database.
              </span>
            </div>
          )}

          {/* Manager Authorization Banner */}
          {portalMode === 'manager' && (
            <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-xs text-amber-300 flex items-start gap-2.5 animate-in fade-in duration-150">
              <Briefcase className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span className="text-[11px] leading-relaxed">
                Department Manager Portal. Grants authorization to approve/reject workflow checkpoints for your department.
              </span>
            </div>
          )}

          {/* Unconfigured Alert */}
          {!isConfigured && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-start gap-2.5 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">Supabase Configuration Required</strong>
                <span className="text-[11px] text-amber-200/80 leading-relaxed block mt-0.5">
                  Please update your real <code className="font-mono bg-black/40 px-1 py-0.5 rounded text-amber-300">VITE_SUPABASE_URL</code> and <code className="font-mono bg-black/40 px-1 py-0.5 rounded text-amber-300">VITE_SUPABASE_ANON_KEY</code> in the <code className="font-mono bg-black/40 px-1 py-0.5 rounded text-amber-300">.env</code> file.
                </span>
              </div>
            </div>
          )}

          {/* Error Alert */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {/* Google OAuth Button (User Mode Only) */}
          {portalMode === 'user' && (
            <>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading || loading}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-[#121726] hover:bg-[#181f33] border border-white/10 text-xs sm:text-sm font-medium text-slate-200 hover:text-white transition-all cursor-pointer shadow-xs disabled:opacity-60"
              >
                {googleLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.1s.7 5.4 1.9 7.8l3.7-2.9z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16.5C3.7 20.2 7.5 23.5 12 23.5z"
                    />
                  </svg>
                )}
                <span>{googleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
              </button>

              {/* Divider */}
              <div className="relative flex items-center justify-center my-2">
                <div className="w-full border-t border-white/[0.08]" />
                <span className="absolute bg-[#0c101d] px-3 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  OR CONTINUE WITH EMAIL
                </span>
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 block font-mono">
                {portalMode === 'admin'
                  ? 'Admin Email'
                  : portalMode === 'manager'
                  ? 'Username / Email'
                  : 'Email'}
              </label>
              <Input
                type="email"
                icon={<Mail className="w-4 h-4 text-slate-400" />}
                placeholder={
                  portalMode === 'admin'
                    ? 'admin@flowmind.ai'
                    : portalMode === 'manager'
                    ? 'manager@company.com'
                    : 'name@company.com'
                }
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="py-2 text-xs sm:text-sm"
              />
            </div>

            {/* Department Dropdown (Manager Mode Only) */}
            {portalMode === 'manager' && (
              <div className="space-y-1.5 animate-in fade-in duration-150">
                <label className="text-xs font-medium text-amber-300 block font-mono flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-amber-400" />
                  Department
                </label>
                <div className="relative">
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value as Department)}
                    className="w-full py-2.5 px-3 bg-[#0e131d] border border-amber-500/30 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30"
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept} className="bg-[#0c101d] text-slate-200">
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-300 font-mono">
                  Password
                </label>
                {portalMode === 'user' && (
                  <Link
                    to="/forgot-password"
                    className="text-[11px] font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    Forgot password?
                  </Link>
                )}
              </div>

              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  icon={<Lock className="w-4 h-4 text-slate-400" />}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="py-2 text-xs sm:text-sm pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1 cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={loading}
              className={`w-full font-semibold mt-2 ${
                portalMode === 'admin'
                  ? 'bg-rose-600 hover:bg-rose-500 border-rose-500/40 shadow-rose-600/30'
                  : portalMode === 'manager'
                  ? 'bg-amber-600 hover:bg-amber-500 border-amber-500/40 shadow-amber-600/30'
                  : ''
              }`}
            >
              {portalMode === 'admin'
                ? 'Admin Sign In'
                : portalMode === 'manager'
                ? 'Manager Sign In'
                : 'Sign In'}
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>

          {/* Switch to Sign Up (User Mode Only) */}
          {portalMode === 'user' && (
            <div className="text-center pt-2 text-xs text-slate-400">
              Don&apos;t have an account?{' '}
              <Link
                to="/signup"
                className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer ml-1"
              >
                Create Account
              </Link>
            </div>
          )}
        </div>

        {/* Security Footer */}
        <div className="text-center mt-6 text-xs text-slate-500 font-mono flex items-center justify-center gap-1.5">
          <span>Protected by FlowMind Role-Based Access Control</span>
        </div>
      </div>
    </div>
  );
};
