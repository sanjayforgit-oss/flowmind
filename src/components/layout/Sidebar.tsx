import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Bot,
  Workflow,
  PlayCircle,
  AlertTriangle,
  Activity,
  History as HistoryIcon,
  BarChart3,
  Settings,
  HelpCircle,
  Sparkles,
  X
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { showToast } = useToast();

  const mainNav = [
    { name: 'Overview', path: '/', icon: LayoutDashboard },
    { name: 'AI Copilot', path: '/copilot', icon: Bot, badge: 'AI' },
    { name: 'Workflows', path: '/workflows', icon: Workflow },
    { name: 'Simulation', path: '/simulation', icon: PlayCircle },
    { name: 'Conflicts', path: '/conflicts', icon: AlertTriangle, badgeCount: 2 },
    { name: 'Executions', path: '/executions', icon: Activity },
    { name: 'Audit Trail', path: '/audit', icon: HistoryIcon, badge: 'Logs' },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
  ];

  const bottomNav = [
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const handleHelpClick = () => {
    showToast('FlowMind AI documentation & shortcuts are active.', 'info');
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-[#0a0d14] border-r border-white/[0.08] flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Logo Header */}
        <div>
          <div className="h-16 px-5 flex items-center justify-between border-b border-white/[0.06]">
            <NavLink to="/" className="flex items-center gap-2.5 group" onClick={onClose}>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-md shadow-indigo-600/30">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm tracking-wider text-white uppercase group-hover:text-indigo-300 transition-colors">
                  FLOWMIND <span className="text-indigo-400 font-extrabold">AI</span>
                </span>
                <span className="text-[10px] text-slate-400 truncate">
                  AI-Powered Business Automation
                </span>
              </div>
            </NavLink>

            {onClose && (
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] lg:hidden"
                aria-label="Close sidebar"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Navigation Items */}
          <div className="px-3 py-4 space-y-1">
            <div className="px-3 pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Platform
            </div>

            {mainNav.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 group ${
                    isActive
                      ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-300'
                      }`}
                    />
                    <span>{item.name}</span>
                  </div>

                  {item.badge && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {item.badge}
                    </span>
                  )}
                  {item.badgeCount !== undefined && (
                    <span className="w-4 h-4 rounded-full text-[10px] font-mono font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center">
                      {item.badgeCount}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* Footer Navigation (Settings & Help) */}
        <div className="p-3 border-t border-white/[0.06] space-y-0.5">
          {bottomNav.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}

          <button
            onClick={handleHelpClick}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] transition-colors text-left cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-slate-400" />
            <span>Help & Docs</span>
          </button>
        </div>
      </aside>
    </>
  );
};
