import React from 'react';
import { Activity, CheckCircle2, AlertTriangle, XCircle, Clock, Loader2 } from 'lucide-react';
import type { SimulationOverallStatus, SimulatedStep } from '../../services/simulationService';

interface ExecutionSummaryBarProps {
  status: SimulationOverallStatus;
  steps: SimulatedStep[];
  currentStepIndex: number;
  durationText: string;
}

export const ExecutionSummaryBar: React.FC<ExecutionSummaryBarProps> = ({
  status,
  steps,
  currentStepIndex,
  durationText,
}) => {
  const completedCount = steps.filter((s) => s.status === 'success').length;
  const errorCount = steps.filter((s) => s.status === 'error').length;
  const warningCount = steps.filter((s) => s.status === 'warning').length;
  const totalCount = steps.length;

  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const currentStep = steps[currentStepIndex];

  const getStatusBadge = () => {
    switch (status) {
      case 'running':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-bold text-indigo-300 bg-indigo-500/15 border border-indigo-500/30">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
            RUNNING
          </span>
        );
      case 'waiting_approval':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-bold text-violet-300 bg-violet-500/15 border border-violet-500/30">
            <Clock className="w-3.5 h-3.5 text-violet-400" />
            WAITING APPROVAL
          </span>
        );
      case 'completed':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            COMPLETED
          </span>
        );
      case 'rejected':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-bold text-rose-300 bg-rose-500/15 border border-rose-500/30">
            <XCircle className="w-3.5 h-3.5 text-rose-400" />
            REJECTED
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-bold text-slate-300 bg-white/5 border border-white/10">
            <Activity className="w-3.5 h-3.5 text-slate-400" />
            READY
          </span>
        );
    }
  };

  return (
    <div className="glass-card rounded-xl p-5 border border-white/[0.08] bg-[#0c101d] shadow-xl space-y-4">
      {/* 5-Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* Status */}
        <div className="p-3 rounded-lg bg-black/40 border border-white/5 flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase text-slate-400">Status</span>
          <div className="mt-1">{getStatusBadge()}</div>
        </div>

        {/* Steps */}
        <div className="p-3 rounded-lg bg-black/40 border border-white/5">
          <span className="text-[10px] font-mono uppercase text-slate-400">Steps Executed</span>
          <div className="mt-1 flex items-baseline gap-1 font-mono">
            <span className="text-base font-bold text-white">{completedCount}</span>
            <span className="text-xs text-slate-400">/ {totalCount}</span>
          </div>
        </div>

        {/* Success */}
        <div className="p-3 rounded-lg bg-black/40 border border-white/5">
          <span className="text-[10px] font-mono uppercase text-slate-400">Success</span>
          <div className="mt-1 flex items-center gap-1.5 font-mono">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-base font-bold text-emerald-400">{completedCount}</span>
          </div>
        </div>

        {/* Warnings & Errors */}
        <div className="p-3 rounded-lg bg-black/40 border border-white/5">
          <span className="text-[10px] font-mono uppercase text-slate-400">Issues</span>
          <div className="mt-1 flex items-center gap-3 font-mono text-xs">
            <span className="text-amber-400 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> {warningCount}
            </span>
            <span className="text-rose-400 flex items-center gap-1">
              <XCircle className="w-3 h-3" /> {errorCount}
            </span>
          </div>
        </div>

        {/* Duration */}
        <div className="p-3 rounded-lg bg-black/40 border border-white/5 col-span-2 sm:col-span-1">
          <span className="text-[10px] font-mono uppercase text-slate-400">Simulated Latency</span>
          <div className="mt-1 flex items-center gap-1.5 font-mono">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span className="text-base font-bold text-cyan-300">{durationText}</span>
          </div>
        </div>
      </div>

      {/* Progress Bar & Current Step Title */}
      <div className="pt-2 space-y-1.5">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400">
            Simulation Progress: <strong className="text-slate-200">{progressPercent}%</strong>
          </span>
          {currentStep && status === 'running' && (
            <span className="text-indigo-300 font-semibold truncate max-w-xs animate-pulse">
              Executing: {currentStep.title}
            </span>
          )}
        </div>

        <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
};
