import React from 'react';
import {
  Zap,
  Sparkles,
  Filter,
  Cpu,
  UserCheck,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import type { SimulatedStep } from '../../services/simulationService';

interface ExecutionTimelineListProps {
  steps: SimulatedStep[];
  selectedStepId: string | null;
  onSelectStep: (stepId: string) => void;
}

export const ExecutionTimelineList: React.FC<ExecutionTimelineListProps> = ({
  steps,
  selectedStepId,
  onSelectStep,
}) => {
  const getStepIcon = (step: SimulatedStep) => {
    if (step.status === 'running') {
      return <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />;
    }
    if (step.status === 'success') {
      return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
    }
    if (step.status === 'error') {
      return <XCircle className="w-4 h-4 text-rose-400" />;
    }
    if (step.status === 'warning') {
      return <AlertTriangle className="w-4 h-4 text-amber-400" />;
    }
    if (step.status === 'skipped') {
      return <span className="text-[10px] font-mono text-slate-500">—</span>;
    }

    switch (step.nodeType) {
      case 'trigger':
        return <Zap className="w-3.5 h-3.5 text-cyan-400" />;
      case 'aiAction':
        return <Sparkles className="w-3.5 h-3.5 text-violet-400" />;
      case 'condition':
        return <Filter className="w-3.5 h-3.5 text-amber-400" />;
      case 'approval':
        return <UserCheck className="w-3.5 h-3.5 text-violet-400" />;
      case 'end':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <Cpu className="w-3.5 h-3.5 text-indigo-400" />;
    }
  };

  const getStatusBadge = (status: SimulatedStep['status']) => {
    switch (status) {
      case 'success':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
            SUCCESS
          </span>
        );
      case 'running':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 animate-pulse">
            RUNNING
          </span>
        );
      case 'error':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold text-rose-300 bg-rose-500/15 border border-rose-500/30">
            ERROR
          </span>
        );
      case 'skipped':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono text-slate-400 bg-white/5 border border-white/10">
            SKIPPED
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono text-slate-400 bg-white/5 border border-white/10">
            PENDING
          </span>
        );
    }
  };

  return (
    <div className="glass-card rounded-xl p-5 border border-white/[0.08] bg-[#0c101d] space-y-4 shadow-xl">
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
        <span className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
          Sequential Execution Timeline
        </span>
        <span className="text-[10px] font-mono text-slate-400">
          {steps.length} Simulated Steps
        </span>
      </div>

      <div className="relative pl-6 space-y-4 before:absolute before:left-2.75 before:top-4 before:bottom-4 before:w-0.5 before:bg-white/[0.08]">
        {steps.map((step) => {
          const isSelected = selectedStepId === step.id;

          return (
            <div
              key={step.id}
              onClick={() => onSelectStep(step.id)}
              className={`relative flex items-start gap-4 p-3.5 rounded-xl cursor-pointer transition-all duration-150 border ${
                isSelected
                  ? 'bg-indigo-600/15 border-indigo-500/40 shadow-md ring-1 ring-indigo-500/30'
                  : 'bg-white/[0.01] hover:bg-white/[0.03] border-white/5'
              } ${step.status === 'skipped' ? 'opacity-40' : ''}`}
            >
              {/* Step Node Marker on Line */}
              <div
                className={`absolute -left-6 top-4 w-6 h-6 rounded-full border-2 bg-[#080b12] flex items-center justify-center -translate-x-1/2 transition-colors ${
                  step.status === 'success'
                    ? 'border-emerald-500 text-emerald-400 shadow-xs shadow-emerald-500/30'
                    : step.status === 'running'
                    ? 'border-indigo-500 text-indigo-400 ring-4 ring-indigo-500/20'
                    : step.status === 'error'
                    ? 'border-rose-500 text-rose-400'
                    : 'border-white/20 text-slate-500'
                }`}
              >
                {getStepIcon(step)}
              </div>

              {/* Step Content */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-400">
                      {step.stepNumber}
                    </span>
                    <h4 className="text-xs sm:text-sm font-semibold text-white tracking-tight">
                      {step.title}
                    </h4>
                  </div>

                  <div className="flex items-center gap-2">
                    {step.branchChoice && (
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                          step.branchChoice === 'YES'
                            ? 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30'
                            : 'text-slate-300 bg-white/5 border-white/10'
                        }`}
                      >
                        Branch: {step.branchChoice}
                      </span>
                    )}

                    {getStatusBadge(step.status)}
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed truncate">
                  {step.outputSummary || step.sublabel}
                </p>

                {step.timestamp && (
                  <div className="mt-1 flex items-center gap-3 text-[10px] font-mono text-slate-400">
                    <span>{step.timestamp}</span>
                    <span>•</span>
                    <span>Latency: {step.durationMs}ms</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
