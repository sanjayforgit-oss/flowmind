import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  Menu,
  Sparkles,
  Command,
  CheckCheck,
  Shield,
  Zap,
  LogOut,
  Settings,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import {
  fetchUserNotifications,
  markAllNotificationsAsRead,
  type InAppNotification,
} from '../../services/notificationService';

interface TopbarProps {
  onOpenSidebar: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onOpenSidebar }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const { showToast } = useToast();

  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const data = await fetchUserNotifications(user.id);
      setNotifications(data);
    } catch (err) {
      console.warn('Could not load notifications:', err);
    }
  }, [user]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Realtime notifications listener
  useEffect(() => {
    if (!user || !isSupabaseConfigured()) return;

    const channel = supabase
      .channel(`realtime_notifications_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, loadNotifications]);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getPageTitle = (pathname: string) => {
    switch (pathname) {
      case '/':
      case '/dashboard':
        return 'Overview Dashboard';
      case '/copilot':
        return 'AI Copilot';
      case '/workflows':
        return 'Workflows';
      case '/simulation':
        return 'Workflow Simulator';
      case '/conflicts':
        return 'Conflict Detection';
      case '/executions':
        return 'Execution Logs';
      case '/analytics':
        return 'Performance Analytics';
      case '/settings':
        return 'Settings';
      default:
        return 'FlowMind AI';
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      showToast(`Searching for "${searchQuery}"...`, 'info');
      if (searchQuery.toLowerCase().includes('copilot') || searchQuery.toLowerCase().includes('prompt')) {
        navigate('/copilot');
      } else if (searchQuery.toLowerCase().includes('conflict')) {
        navigate('/conflicts');
      } else if (searchQuery.toLowerCase().includes('exec') || searchQuery.toLowerCase().includes('log')) {
        navigate('/executions');
      } else {
        navigate('/workflows');
      }
    }
  };

  const handleSignOut = async () => {
    setShowUserMenu(false);
    await signOut();
    showToast('Signed out successfully.', 'info');
    navigate('/login');
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    await markAllNotificationsAsRead(user.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    showToast('All notifications marked as read', 'success');
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const displayName = profile?.fullName || user?.email?.split('@')[0] || 'User';
  const displayEmail = user?.email || 'user@flowmind.ai';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 h-16 bg-[#090b10]/90 backdrop-blur-md border-b border-white/[0.08] px-4 sm:px-6 flex items-center justify-between gap-4">
      {/* Left section: Hamburger & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <h2 className="text-sm sm:text-base font-semibold text-white tracking-tight">
            {getPageTitle(location.pathname)}
          </h2>
        </div>
      </div>

      {/* Center Search Bar */}
      <div className="hidden md:flex flex-1 max-w-md mx-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search workflows, triggers, executions..."
            className="w-full pl-9 pr-12 py-1.5 bg-[#0e131d] border border-white/10 rounded-lg text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-colors"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/10 text-[10px] font-mono text-slate-400 flex items-center gap-0.5">
            <Command className="w-2.5 h-2.5" /> K
          </kbd>
        </form>
      </div>

      {/* Right Section: Quick Copilot, Notifications & User Menu */}
      <div className="flex items-center gap-3 relative">
        {/* Quick Copilot Jump Button */}
        <button
          onClick={() => navigate('/copilot')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/25 hover:bg-indigo-500/20 transition-all cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Ask Copilot</span>
        </button>

        {/* Notifications Dropdown Toggle */}
        <div className="relative" ref={notifMenuRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-[#090b10] animate-pulse" />
            )}
          </button>

          {/* Notifications Flyout */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-[#0f1420] border border-white/10 shadow-2xl z-50 p-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-white">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-indigo-500/20 text-indigo-300">
                      {unreadCount} New
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-slate-400 hover:text-indigo-400 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCheck className="w-3.5 h-3.5" /> Mark read
                  </button>
                )}
              </div>

              <div className="space-y-2.5 max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400 font-mono">
                    No notifications yet.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 rounded-lg text-xs space-y-1 transition-colors ${
                        n.type === 'approval'
                          ? 'bg-emerald-950/30 border border-emerald-500/30'
                          : n.type === 'rejection'
                          ? 'bg-rose-950/30 border border-rose-500/30'
                          : 'bg-indigo-950/30 border border-indigo-500/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`font-semibold flex items-center gap-1.5 ${
                            n.type === 'approval'
                              ? 'text-emerald-300'
                              : n.type === 'rejection'
                              ? 'text-rose-300'
                              : 'text-indigo-300'
                          }`}
                        >
                          {n.type === 'approval' ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          ) : n.type === 'rejection' ? (
                            <XCircle className="w-3.5 h-3.5 text-rose-400" />
                          ) : (
                            <Zap className="w-3.5 h-3.5 text-indigo-400" />
                          )}
                          {n.title}
                        </span>

                        <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(n.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <p className="text-slate-300 text-[11px] leading-relaxed">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Account Menu Dropdown */}
        <div className="relative" ref={userMenuRef}>
          <div
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2.5 pl-2 border-l border-white/10 cursor-pointer group select-none"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 border border-indigo-400/30 flex items-center justify-center text-xs font-bold text-white shadow-sm">
              {initials || 'FM'}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors leading-tight flex items-center gap-1">
                {displayName}
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </span>
              <span className="text-[10px] text-slate-400 font-mono leading-tight truncate max-w-[120px]">
                {displayEmail}
              </span>
            </div>
          </div>

          {/* User Flyout */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[#0f1420] border border-white/10 shadow-2xl z-50 p-2 text-xs animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-2 border-b border-white/[0.06] mb-1">
                <p className="font-semibold text-white truncate">{displayName}</p>
                <p className="text-[11px] text-slate-400 font-mono truncate">{displayEmail}</p>
                <div className="mt-1.5 flex items-center gap-1">
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold uppercase ${
                      profile?.role === 'admin'
                        ? 'text-rose-300 bg-rose-500/15 border border-rose-500/30'
                        : profile?.role === 'manager'
                        ? 'text-amber-300 bg-amber-500/15 border border-amber-500/30'
                        : 'text-indigo-300 bg-indigo-500/15 border border-indigo-500/30'
                    }`}
                  >
                    {profile?.role === 'manager'
                      ? `${profile.department || 'HR'} Manager`
                      : profile?.role || 'user'}
                  </span>
                </div>
              </div>

              {profile?.role === 'admin' && (
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    navigate('/admin');
                  }}
                  className="w-full px-3 py-2 rounded-lg text-rose-300 hover:bg-rose-500/10 flex items-center gap-2 transition-colors cursor-pointer text-left"
                >
                  <Shield className="w-3.5 h-3.5 text-rose-400" />
                  <span>Admin Control Center</span>
                </button>
              )}

              <button
                onClick={() => {
                  setShowUserMenu(false);
                  navigate('/settings');
                }}
                className="w-full px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/[0.06] flex items-center gap-2 transition-colors cursor-pointer text-left"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Account Settings</span>
              </button>

              <div className="border-t border-white/[0.06] my-1" />

              <button
                onClick={handleSignOut}
                className="w-full px-3 py-2 rounded-lg text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 transition-colors cursor-pointer text-left"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
