import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const ProtectedRoute: React.FC = () => {
  const { user, session, loading } = useAuth();
  const location = useLocation();

  if (import.meta.env.DEV) {
    console.log('[PROTECTED ROUTE CHECK]', {
      pathname: location.pathname,
      loading,
      hasUser: Boolean(user),
      hasSession: Boolean(session),
      userEmail: user?.email || null,
    });
  }

  // 1. While Supabase session is being retrieved asynchronously, display loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-[#07090f] flex flex-col items-center justify-center text-slate-400">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 animate-pulse">
          <Sparkles className="w-6 h-6" />
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
          <span>Restoring FlowMind Security Session...</span>
        </div>
      </div>
    );
  }

  // 2. If no active Supabase session exists, strictly redirect unauthenticated visitor to /login
  if (!user || !session) {
    if (import.meta.env.DEV) {
      console.log(`[PROTECTED ROUTE] No active session. Redirecting unauthenticated user from "${location.pathname}" to "/login".`);
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Authenticated session verified: render protected child routes
  return <Outlet />;
};
