import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Lock, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { useToast } from '../context/ToastContext';

export const ResetPasswordPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const { updatePassword } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (password.length < 6) {
      setErrorMessage('New password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify.');
      return;
    }

    setLoading(true);

    try {
      const result = await updatePassword(password);

      if (result.error) {
        setErrorMessage(result.error);
        setLoading(false);
        return;
      }

      setIsSuccess(true);
      setLoading(false);
      showToast('Password updated successfully! You can now log in.', 'success');
    } catch {
      setErrorMessage('Failed to update password. The reset link may have expired.');
      setLoading(false);
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
            Set new password
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5">
            Enter your new password to restore account access.
          </p>
        </div>

        {/* Form Card */}
        <div className="glass-card rounded-2xl p-6 sm:p-8 border border-white/[0.08] bg-[#0c101d]/90 shadow-2xl space-y-5">
          {/* Error Alert */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {isSuccess ? (
            <div className="space-y-4 text-center py-2 animate-in fade-in duration-200">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Password Updated</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Your password has been successfully updated. You can now access your account with your new credentials.
              </p>
              <div className="pt-2">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => navigate('/login')}
                  className="w-full"
                >
                  Proceed to Sign In
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 block font-mono">
                  New Password (min 6 characters)
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    icon={<Lock className="w-4 h-4 text-slate-400" />}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
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

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 block font-mono">
                  Confirm New Password
                </label>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  icon={<Lock className="w-4 h-4 text-slate-400" />}
                  placeholder="••••••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="py-2 text-xs sm:text-sm"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={loading}
                className="w-full font-semibold mt-2"
              >
                Update Password
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
