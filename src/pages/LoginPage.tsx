import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { useToast } from '../context/ToastContext';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { signIn, signInWithGoogle, isConfigured } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await signIn(email, password);

      if (error) {
        setErrorMessage(error);
        setLoading(false);
        return;
      }

      showToast('Welcome back! Signed in successfully.', 'success');
      navigate(from, { replace: true });
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
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Card Container */}
      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-4 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-wider text-white uppercase">
              FLOWMIND <span className="text-indigo-400 font-extrabold">AI</span>
            </span>
          </Link>

          <h1 className="text-2xl font-bold text-white tracking-tight">
            Welcome back
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5">
            Sign in to continue building smarter automations.
          </p>
        </div>

        {/* Form Card */}
        <div className="glass-card rounded-2xl p-6 sm:p-8 border border-white/[0.08] bg-[#0c101d]/90 shadow-2xl space-y-5">
          {/* Unconfigured Alert */}
          {!isConfigured && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-start gap-2.5 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">Supabase Configuration Required</strong>
                <span className="text-[11px] text-amber-200/80 leading-relaxed block mt-0.5">
                  Please update your real <code className="font-mono bg-black/40 px-1 py-0.5 rounded text-amber-300">VITE_SUPABASE_URL</code> and <code className="font-mono bg-black/40 px-1 py-0.5 rounded text-amber-300">VITE_SUPABASE_ANON_KEY</code> in the <code className="font-mono bg-black/40 px-1 py-0.5 rounded text-amber-300">.env</code> file and restart the dev server.
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

          {/* Google OAuth Button */}
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

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 block font-mono">
                Email Address
              </label>
              <Input
                type="email"
                icon={<Mail className="w-4 h-4 text-slate-400" />}
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="py-2 text-xs sm:text-sm"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-300 font-mono">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-[11px] font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Forgot password?
                </Link>
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
              className="w-full font-semibold mt-2"
            >
              Sign In
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>

          {/* Switch to Sign Up */}
          <div className="text-center pt-2 text-xs text-slate-400">
            Don&apos;t have an account?{' '}
            <Link
              to="/signup"
              className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer ml-1"
            >
              Create an account
            </Link>
          </div>
        </div>

        {/* Security Footer */}
        <div className="text-center mt-6 text-xs text-slate-500 font-mono flex items-center justify-center gap-1.5">
          <span>Protected by Supabase Auth with Row Level Security</span>
        </div>
      </div>
    </div>
  );
};
