import React from 'react';
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertOctagon,
  Download,
  Zap,
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { Button } from '../components/common/Button';
import { useToast } from '../context/ToastContext';

export const AnalyticsPage: React.FC = () => {
  const { showToast } = useToast();

  const handleExportData = () => {
    showToast('Exporting analytics telemetry report (CSV)...', 'info');
  };

  const weeklyData = [
    { day: 'Mon', runs: 6400, success: 99.2, savedHours: 24 },
    { day: 'Tue', runs: 8200, success: 99.5, savedHours: 31 },
    { day: 'Wed', runs: 9100, success: 99.7, savedHours: 35 },
    { day: 'Thu', runs: 8800, success: 99.1, savedHours: 33 },
    { day: 'Fri', runs: 7900, success: 99.6, savedHours: 30 },
    { day: 'Sat', runs: 4100, success: 99.8, savedHours: 16 },
    { day: 'Sun', runs: 3790, success: 99.9, savedHours: 15 },
  ];

  const maxRuns = Math.max(...weeklyData.map((d) => d.runs));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operational Analytics & ROI"
        description="Monitor automated throughput, SLA reliability metrics, cost efficiency, and total engineer hours saved."
        badge={
          <span className="px-2 py-0.5 rounded text-[11px] font-mono text-indigo-300 bg-indigo-500/10 border border-indigo-500/20">
            30-Day Window
          </span>
        }
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportData}
            icon={<Download className="w-3.5 h-3.5" />}
          >
            Export Report
          </Button>
        }
      />

      {/* Demo watermark banner */}
      <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center justify-between font-mono">
        <span>* All analytics metrics displayed below are computed from realistic simulated demo telemetry data.</span>
        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20">DEMO VALUES</span>
      </div>

      {/* 4 Core Metric Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Executions */}
        <div className="glass-card rounded-xl p-5 border border-white/[0.08]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Total Executions
            </span>
            <Zap className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white font-sans">
            48,290
          </div>
          <div className="mt-2 text-[11px] text-emerald-400 font-mono flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> +14.2% vs previous period
          </div>
        </div>

        {/* 2. Success Rate */}
        <div className="glass-card rounded-xl p-5 border border-white/[0.08]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Success Rate
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-emerald-400 font-sans">
            99.4%
          </div>
          <div className="mt-2 text-[11px] text-slate-400 font-mono">
            48,000 successful / 290 failed
          </div>
        </div>

        {/* 3. Failures */}
        <div className="glass-card rounded-xl p-5 border border-white/[0.08]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Failures Flagged
            </span>
            <AlertOctagon className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-rose-400 font-sans">
            0.6%
          </div>
          <div className="mt-2 text-[11px] text-slate-400 font-mono">
            Down 0.3% after schema fix
          </div>
        </div>

        {/* 4. Time Saved */}
        <div className="glass-card rounded-xl p-5 border border-white/[0.08]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Time Saved
            </span>
            <Clock className="w-4 h-4 text-violet-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-violet-300 font-sans">
            184 hrs
          </div>
          <div className="mt-2 text-[11px] text-emerald-400 font-mono">
            ~$14,720 engineering cost saved
          </div>
        </div>
      </div>

      {/* Lightweight SVG Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Weekly Throughput Bar Visualizer */}
        <div className="lg:col-span-8 glass-card rounded-xl p-5 border border-white/[0.08]">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/[0.06]">
            <div>
              <h3 className="text-sm font-semibold text-white">
                Daily Execution Volume (This Week)
              </h3>
              <p className="text-xs text-slate-400">
                Peak load occurs between 14:00 - 18:00 UTC
              </p>
            </div>
            <span className="text-xs font-mono text-indigo-300">
              Avg: 6,898 runs/day
            </span>
          </div>

          {/* Bar chart container */}
          <div className="h-48 flex items-end justify-between gap-2 sm:gap-4 pt-6 px-2">
            {weeklyData.map((d) => {
              const heightPct = (d.runs / maxRuns) * 100;
              return (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-2 group">
                  <span className="text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    {(d.runs / 1000).toFixed(1)}k
                  </span>
                  <div className="w-full max-w-[40px] bg-white/[0.04] rounded-t-md overflow-hidden h-36 flex items-end">
                    <div
                      className="w-full bg-gradient-to-t from-indigo-600 to-cyan-400 rounded-t-md group-hover:brightness-125 transition-all duration-300"
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-slate-300">{d.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Workflow Distribution by Category */}
        <div className="lg:col-span-4 glass-card rounded-xl p-5 border border-white/[0.08] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.06]">
              <h3 className="text-sm font-semibold text-white">Execution Share</h3>
              <span className="text-[10px] font-mono text-slate-400">By Domain</span>
            </div>

            <div className="space-y-3 pt-2">
              {[
                { name: 'Customer Support', pct: 45, color: 'bg-indigo-500' },
                { name: 'Lead & Sales Sync', pct: 30, color: 'bg-cyan-500' },
                { name: 'Finance & Invoicing', pct: 15, color: 'bg-emerald-500' },
                { name: 'HR & Operations', pct: 10, color: 'bg-violet-500' },
              ].map((item) => (
                <div key={item.name} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-300">{item.name}</span>
                    <span className="text-slate-400 font-mono">{item.pct}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className={`h-full rounded-full ${item.color}`}
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-white/[0.06] text-[11px] text-slate-400 text-center font-mono">
            Optimized for enterprise scale throughput
          </div>
        </div>
      </div>
    </div>
  );
};
