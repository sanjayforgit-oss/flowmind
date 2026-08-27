import React from 'react';
import { CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { PROCESSING_STEPS } from '../../services/aiService';

interface AIProcessingProps {
  currentStepId: number;
}

export const AIProcessing: React.FC<AIProcessingProps> = ({ currentStepId }) => {
  return (
    <div className="glass-card rounded-xl border border-indigo-500/30 p-5 bg-[#0c101b]/95 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
      <div className="flex items-center gap-2 pb-3 mb-4 border-b border-white/[0.08]">
        <div className="w-6 h-6 rounded-md bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
        </div>
        <span className="text-xs font-semibold text-white tracking-tight uppercase font-mono">
          FlowMind AI Reasoning Pipeline
        </span>
      </div>

      <div className="space-y-3">
        {PROCESSING_STEPS.map((step) => {
          const isDone = currentStepId > step.id;
          const isCurrent = currentStepId === step.id;

          return (
            <div
              key={step.id}
              className={`flex items-center justify-between p-2.5 rounded-lg border text-xs transition-all duration-200 ${
                isDone
                  ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                  : isCurrent
                  ? 'bg-indigo-950/40 border-indigo-500/40 text-indigo-200 shadow-sm'
                  : 'bg-white/[0.01] border-white/5 text-slate-400 opacity-40'
              }`}
            >
              <div className="flex items-center gap-2.5 font-medium">
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : isCurrent ? (
                  <Loader2 className="w-4 h-4 text-indigo-400 animate-spin shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-white/20 shrink-0" />
                )}
                <span>{step.label}</span>
              </div>

              {isDone && (
                <span className="text-[10px] font-mono text-emerald-400 font-semibold uppercase">
                  Done
                </span>
              )}
              {isCurrent && (
                <span className="text-[10px] font-mono text-indigo-400 font-semibold animate-pulse uppercase">
                  Processing
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
