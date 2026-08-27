import React from 'react';
import { Sparkles, Copy, Play } from 'lucide-react';
import type { CopilotRequirement } from '../../types';
import { Button } from '../common/Button';
import { useToast } from '../../context/ToastContext';
import { useNavigate } from 'react-router-dom';

interface AIUnderstandingPanelProps {
  data: CopilotRequirement;
  isLoading?: boolean;
}

export const AIUnderstandingPanel: React.FC<AIUnderstandingPanelProps> = ({
  data,
  isLoading = false,
}) => {
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleCopyStructure = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    showToast('Workflow JSON schema copied to clipboard', 'success');
  };

  const handleTestInSimulator = () => {
    showToast('Opening simulation environment for this workflow structure...', 'info');
    navigate('/simulation');
  };

  return (
    <div className={`glass-card rounded-xl border border-indigo-500/25 p-5 flex flex-col h-full bg-[#0c101b]/90 shadow-xl transition-opacity ${isLoading ? 'opacity-60 pointer-events-none' : 'opacity-100'}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/[0.08]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <h3 className="text-sm font-semibold text-white tracking-tight">AI Understanding</h3>
        </div>
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium text-indigo-300 bg-indigo-500/15 border border-indigo-500/30">
          DEMO PREVIEW
        </span>
      </div>

      {/* Confidence Score Bar */}
      <div className="mb-5 p-3 rounded-lg bg-black/40 border border-white/5">
        <div className="flex items-center justify-between text-xs mb-1.5 font-mono">
          <span className="text-slate-400">Intent Confidence</span>
          <span className="text-emerald-400 font-bold">{data.confidenceScore}% Match</span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-500"
            style={{ width: `${data.confidenceScore}%` }}
          />
        </div>
      </div>

      {/* Structured Elements: Trigger -> Conditions -> Actions */}
      <div className="space-y-4 flex-1 overflow-y-auto pr-1">
        {/* 1. Trigger */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-cyan-400">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            1. Trigger Detected
          </div>
          <div className="p-3 rounded-lg bg-[#0e1422] border border-cyan-500/20 text-xs">
            <div className="font-semibold text-slate-100">{data.trigger.event}</div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
              Source: {data.trigger.source}
            </div>
          </div>
        </div>

        {/* 2. Conditions */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            2. Conditions & Filters
          </div>
          <div className="space-y-1.5">
            {data.conditions.map((cond, idx) => (
              <div
                key={idx}
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

        {/* 3. Actions */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-indigo-400">
            <span className="w-2 h-2 rounded-full bg-indigo-400" />
            3. Action Pipeline ({data.actions.length} Steps)
          </div>
          <div className="space-y-2">
            {data.actions.map((act, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg bg-[#0e1422] border border-indigo-500/20 text-xs"
              >
                <div className="flex items-center justify-between font-semibold text-slate-200">
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-[10px] font-mono">
                      {idx + 1}
                    </span>
                    <span>{act.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-indigo-300 px-1.5 py-0.5 rounded bg-indigo-500/10">
                    {act.target}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-1.5 pl-5.5">
                  {act.params}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="pt-4 mt-4 border-t border-white/[0.08] flex flex-col gap-2">
        <Button
          variant="primary"
          size="sm"
          onClick={handleTestInSimulator}
          icon={<Play className="w-3.5 h-3.5 fill-current" />}
          className="w-full"
        >
          Test in Simulator
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyStructure}
          icon={<Copy className="w-3.5 h-3.5" />}
          className="w-full text-xs"
        >
          Copy JSON Schema
        </Button>
      </div>
    </div>
  );
};
