import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  Menu,
  Sparkles,
  Command,
  CheckCheck,
  ShieldCheck,
  Zap,
  LogOut,
  Settings,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface TopbarProps {
  onOpenSidebar: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onOpenSidebar }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const { showToast } = useToast();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
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

  const displayName = profile?.fullName || user?.email?.split('@')[0] || 'Admin';
  const displayEmail = user?.email || 'admin@flowmind.ai';
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
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-[#090b10]" />
          </button>

          {/* Notifications Flyout */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-[#0f1420] border border-white/10 shadow-2xl z-50 p-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-white">Notifications</span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-indigo-500/20 text-indigo-300">
                    2 New
                  </span>
                </div>
                <button
                  onClick={() => {
                    showToast('All notifications marked as read', 'success');
                    setShowNotifications(false);
                  }}
                  className="text-[11px] text-slate-400 hover:text-indigo-400 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5" /> Mark read
                </button>
              </div>

              <div className="space-y-2.5">
                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs">
                  <div className="flex items-center gap-2 text-amber-300 font-medium mb-1">
                    <Zap className="w-3.5 h-3.5" /> Potential Workflow Overlap
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Conflict detected between Welcome Email and Promo Email workflows.
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs">
                  <div className="flex items-center gap-2 text-indigo-300 font-medium mb-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> AI Optimization Ready
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Customer Complaint workflow has a high-priority condition recommendation.
                  </p>
                </div>
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

          {/* User Flyout Menu */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[#0f1420] border border-white/10 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-2 border-b border-white/5">
                <div className="text-xs font-semibold text-white truncate">{displayName}</div>
                <div className="text-[10px] font-mono text-slate-400 truncate mt-0.5">{displayEmail}</div>
              </div>

              <div className="py-1 space-y-0.5">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    navigate('/settings');
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-200 hover:text-white hover:bg-white/[0.06] transition-colors text-left cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-400" />
                  <span>Workspace Settings</span>
                </button>
              </div>

              <div className="pt-1 border-t border-white/5">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors text-left cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
