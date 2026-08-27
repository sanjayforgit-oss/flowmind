import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export const AppLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#08090d] text-slate-100 flex flex-col antialiased">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="lg:pl-64 flex flex-col min-h-screen flex-1">
        <Topbar onOpenSidebar={() => setIsSidebarOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>

        {/* Product Footer */}
        <footer className="px-6 py-4 border-t border-white/[0.04] text-center text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl w-full mx-auto">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">FlowMind AI</span>
            <span>—</span>
            <span>AI-Powered Business Automation Copilot</span>
          </div>
          <div className="flex items-center gap-3 font-mono text-[11px] text-slate-500">
            <span>Demo Environment</span>
          </div>
        </footer>
      </div>
    </div>
  );
};
