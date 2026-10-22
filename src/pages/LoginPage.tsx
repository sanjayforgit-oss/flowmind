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
  Building2,
  Crown,
  Zap,
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

  const { signIn, signInAsDemo, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const handleToggleMode = (mode: UserRole) => {
    setPortalMode(mode);
    setErrorMessage(null);
  };

  const handleDemoSignIn = async (role: UserRole = 'admin', dept: Department = 'Operations') => {
    try {
      await signInAsDemo(role, dept);
      showToast(`Welcome! Signed in as ${role === 'admin' ? 'Administrator' : 'Demo Operator'}.`, 'success');
      navigate(from === '/admin' && role !== 'admin' ? '/' : from, { replace: true });
    } catch {
      showToast('Demo sign-in failed. Please try again.', 'error');
    }
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
      {/* Background Glows */}
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

      {/* Main Container */}
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
              : 'Welcome to FlowMind AI'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Sign in or use 1-click access to explore workflows and Render execution
          </p>
        </div>

        {/* 1-Click Instant Demo Login Banner */}
        <div className="mb-4 p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 space-y-3 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-indigo-300 font-semibold text-xs">
              <Zap className="w-4 h-4 text-cyan-400 fill-cyan-400" />
              <span>1-Click Instant Access (No Password Needed)</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Instant
            </span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Skip the password and enter FlowMind AI immediately with full access to the Workflow Builder, Render Workflows engine, and telemetry logs:
          </p>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleDemoSignIn('admin', 'Operations')}
              className="py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Crown className="w-3.5 h-3.5 text-amber-300" />
              <span>Enter as Admin</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemoSignIn('user', 'Operations')}
              className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <User className="w-3.5 h-3.5 text-indigo-300" />
              <span>Enter as Operator</span>
            </button>
          </div>
        </div>

        {/* 3-Role Selection Toggle */}
        <div className="mb-4">
          <div className="text-center mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              Or Sign In with Credentials
            </span>
          </div>

          <div className="p-1 rounded-xl bg-[#0e1222] border border-white/10 grid grid-cols-3 gap-1 shadow-inner">
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
          {/* Error Alert */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {/* Google OAuth Button */}
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

              <div className="relative flex items-center justify-center my-2">
                <div className="w-full border-t border-white/[0.08]" />
                <span className="absolute bg-[#0c101d] px-3 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  OR EMAIL
                </span>
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 block font-mono">
                {portalMode === 'admin'
                  ? 'Admin Email'
                  : portalMode === 'manager'
                  ? 'Username / Email'
                  : 'Email'}
              </label>
              <Input
                type="text"
                icon={<Mail className="w-4 h-4 text-slate-400" />}
                placeholder={portalMode === 'admin' ? 'admin or admin@flowmind.ai' : 'operator or operator@flowmind.ai'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="username"
                className="py-2 text-xs sm:text-sm"
              />
            </div>

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
                ? 'Sign in as Administrator'
                : portalMode === 'manager'
                ? `Sign in to ${department} Department`
                : 'Sign in to Account'}
            </Button>
            {/* Default Credentials Cheat Sheet */}
            <div className="p-3 rounded-xl bg-slate-900/60 border border-white/10 space-y-1.5 text-[11px] font-mono">
              <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-semibold">
                <span>Default Credentials</span>
                <span className="text-emerald-400">Ready to Use</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <div 
                  onClick={() => { setEmail('admin'); setPassword('AdminPassword@123'); }}
                  className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] cursor-pointer transition-colors border border-white/5"
                >
                  <span className="text-rose-400 font-bold block">Admin Account</span>
                  <span className="text-slate-300 block truncate">User: admin</span>
                  <span className="text-slate-400 block truncate">Pass: AdminPassword@123</span>
                </div>
                <div 
                  onClick={() => { setEmail('operator'); setPassword('OperatorPassword@123'); }}
                  className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] cursor-pointer transition-colors border border-white/5"
                >
                  <span className="text-indigo-400 font-bold block">Operator Account</span>
                  <span className="text-slate-300 block truncate">User: operator</span>
                  <span className="text-slate-400 block truncate">Pass: OperatorPassword@123</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 text-center pt-1">
                Click any credential box above to auto-fill.
              </p>
            </div>

          </form>

          {portalMode === 'user' && (
            <div className="text-center pt-2 border-t border-white/[0.08]">
              <p className="text-xs text-slate-400">
                Don't have an account?{' '}
                <Link
                  to="/signup"
                  className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors inline-flex items-center gap-1 group"
                >
                  Create account
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
