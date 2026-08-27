import React from 'react';
import { Sparkles, Zap, Filter, Cpu } from 'lucide-react';
import type { GeneratedWorkflow } from '../../types';

interface AIUnderstandingProps {
  workflow: GeneratedWorkflow;
}

export const AIUnderstanding: React.FC<AIUnderstandingProps> = ({ workflow }) => {
  return (
    <div className="glass-card rounded-xl border border-indigo-500/25 p-5 bg-[#0c101b]/95 shadow-xl space-y-4 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <h3 className="text-xs font-semibold text-white tracking-tight uppercase font-mono">
            AI Understanding
          </h3>
        </div>
        <span className="text-[10px] font-mono text-slate-400">
          Deterministic Parser
        </span>
      </div>

      {/* Confidence Score Bar (clearly marked demo data) */}
      <div className="p-3 rounded-lg bg-black/40 border border-white/5">
        <div className="flex items-center justify-between text-xs mb-1.5 font-mono">
          <span className="text-slate-400">Intent Confidence</span>
          <span className="text-emerald-400 font-bold">{workflow.confidence}% Match</span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-500"
            style={{ width: `${workflow.confidence}%` }}
          />
        </div>
        <p className="text-[10px] text-slate-500 mt-1.5 font-mono">
          * Demo metric computed from heuristic schema match.
        </p>
      </div>

      {/* 1. Intent */}
      <div className="space-y-1">
        <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400">
          Intent
        </span>
        <div className="p-2.5 rounded-lg bg-[#0e1422] border border-white/5 text-xs text-slate-200 font-medium">
          {workflow.intent}
        </div>
      </div>

      {/* 2. Trigger */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-cyan-400">
          <Zap className="w-3.5 h-3.5" />
          Trigger
        </div>
        <div className="p-2.5 rounded-lg bg-[#0e1422] border border-cyan-500/20 text-xs">
          <div className="font-semibold text-slate-100">{workflow.trigger.label}</div>
          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
            {workflow.trigger.description}
          </div>
        </div>
      </div>

      {/* 3. Conditions */}
      {workflow.conditions.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-amber-400">
            <Filter className="w-3.5 h-3.5" />
            Conditions ({workflow.conditions.length})
          </div>
          <div className="space-y-1.5">
            {workflow.conditions.map((cond, idx) => (
              <div
                key={cond.id || idx}
                className="p-2.5 rounded-lg bg-[#0e1422] border border-amber-500/20 text-xs font-mono flex items-center justify-between"
              >
                <span className="text-slate-300">{cond.field}</span>
                <span className="text-amber-300 font-bold px-1.5 py-0.5 rounded bg-amber-500/10">
                  {cond.operator} {cond.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Actions */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-indigo-400">
          <Cpu className="w-3.5 h-3.5" />
          Actions ({workflow.actions.length})
        </div>
        <div className="space-y-1.5">
          {workflow.actions.map((act, idx) => (
            <div
              key={act.id}
              className="p-2.5 rounded-lg bg-[#0e1422] border border-indigo-500/20 text-xs flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-[10px] font-mono">
                  {idx + 1}
                </span>
                <span className="text-slate-200 font-medium">{act.label}</span>
              </div>
              <span className="text-[10px] font-mono text-indigo-300 capitalize px-1.5 py-0.5 rounded bg-indigo-500/10">
                {act.type}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
