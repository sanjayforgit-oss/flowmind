import React from 'react';
import { Navigate, useLocation, Outlet, Link } from 'react-router-dom';
import { Loader2, ShieldAlert, ArrowLeft, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../common/Button';

export const AdminRoute: React.FC = () => {
  const { user, session, profile, loading, isAdmin } = useAuth();
  const location = useLocation();

  if (import.meta.env.DEV) {
    console.log('[ADMIN ROUTE CHECK]', {
      pathname: location.pathname,
      loading,
      userEmail: user?.email || null,
      role: profile?.role || null,
      isAdmin,
    });
  }

  // 1. Loading authentication and role verification from Supabase
  if (loading) {
    return (
      <div className="min-h-screen bg-[#07090f] flex flex-col items-center justify-center text-slate-400">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 animate-pulse">
          <Shield className="w-6 h-6" />
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
          <span>Verifying Administrator Privileges...</span>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated -> Redirect to Login
  if (!user || !session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Authenticated but lacks admin role -> Access Denied
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#07090f] flex items-center justify-center p-4">
        <div className="glass-card max-w-md w-full p-8 rounded-2xl border border-rose-500/30 bg-[#0d101d] text-center space-y-5 shadow-2xl animate-in fade-in duration-200">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <div className="space-y-1.5">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold text-rose-400 bg-rose-500/15 border border-rose-500/30 uppercase">
              Access Denied
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Administrator Privileges Required
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
              Your account (<strong className="text-slate-200">{user.email}</strong>) is registered as a standard <code className="text-indigo-400 font-mono">user</code>. This portal is restricted to authorized administrators.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <Link to="/">
              <Button variant="primary" size="md" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Return to User Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 4. Authorized Admin
  return <Outlet />;
};
