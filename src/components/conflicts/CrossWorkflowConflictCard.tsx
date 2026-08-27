import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Sparkles,
  Zap,
  Cpu,
  X,
  Layers,
} from 'lucide-react';
import type { DetectedConflict } from '../../services/conflictService';
import { Button } from '../common/Button';
import { useToast } from '../../context/ToastContext';

interface CrossWorkflowConflictCardProps {
  conflict: DetectedConflict;
  onDismiss: (id: string) => void;
}

export const CrossWorkflowConflictCard: React.FC<CrossWorkflowConflictCardProps> = ({
  conflict,
  onDismiss,
}) => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleReviewWorkflows = () => {
    showToast('Opening Visual Workflow Builder to review pipeline logic...', 'info');
    navigate('/workflows', { state: { openBuilder: true } });
  };

  const handleIgnore = () => {
    onDismiss(conflict.id);
    showToast('Conflict risk acknowledged and dismissed for this session.', 'info');
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'high':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      case 'medium':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      default:
        return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30';
    }
  };

  return (
    <div className="glass-card rounded-xl border border-amber-500/30 bg-[#0d101a] p-5 shadow-xl space-y-5 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border ${getSeverityBadge(conflict.severity)}`}>
                {conflict.type}
              </span>
              <span className="text-[10px] font-mono text-slate-400 uppercase">
                Severity: <strong className="text-white capitalize">{conflict.severity}</strong>
              </span>
            </div>
            <h4 className="text-sm font-semibold text-white tracking-tight mt-0.5">
              {conflict.title}
            </h4>
          </div>
        </div>

        <div className="text-xs font-mono text-amber-400 bg-amber-950/40 border border-amber-500/30 px-2.5 py-1 rounded-md">
          {conflict.overlapPoint}
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-slate-300 leading-relaxed">
        {conflict.description}
      </p>

      {/* Side-by-Side Comparison: Workflow A (Existing) VS Workflow B (Current) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
        {/* Workflow A: Existing */}
        <div className="p-4 rounded-xl bg-[#111624] border border-white/10 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400">
              Existing Automation (Workflow A)
            </span>
            <span className="text-[10px] font-mono text-indigo-300 bg-indigo-500/10 px-1.5 py-0.2 rounded border border-indigo-500/20">
              {conflict.workflowA.category}
            </span>
          </div>

          <div className="text-sm font-bold text-white">
            {conflict.workflowA.name}
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="p-2 rounded bg-black/40 border border-cyan-500/20 flex items-start gap-2">
              <Zap className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Trigger</span>
                <span className="text-slate-200">{conflict.workflowA.trigger}</span>
              </div>
            </div>

            <div className="p-2 rounded bg-black/40 border border-indigo-500/20 flex items-start gap-2">
              <Cpu className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Actions</span>
                <span className="text-slate-200">{conflict.workflowA.action}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Workflow B: Current Generation */}
        <div className="p-4 rounded-xl bg-[#161224] border border-indigo-500/30 space-y-3 relative">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-indigo-300">
              Current Draft (Workflow B)
            </span>
            <span className="text-[10px] font-mono text-amber-300 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
              Draft
            </span>
          </div>

          <div className="text-sm font-bold text-white">
            {conflict.workflowB.name}
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="p-2 rounded bg-black/40 border border-amber-500/30 flex items-start gap-2">
              <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Trigger (Collision)</span>
                <span className="text-amber-200 font-semibold">{conflict.workflowB.trigger}</span>
              </div>
            </div>

            <div className="p-2 rounded bg-black/40 border border-indigo-500/20 flex items-start gap-2">
              <Cpu className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Actions</span>
                <span className="text-slate-200 truncate block">{conflict.workflowB.action}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Recommendation Banner */}
      <div className="p-3.5 rounded-xl bg-gradient-to-r from-indigo-950/40 via-[#101525] to-[#0c101c] border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-300 block">
              AI Recommendation
            </span>
            <p className="text-xs text-slate-300 leading-relaxed mt-0.5">
              {conflict.aiRecommendation}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <Button
            variant="primary"
            size="sm"
            onClick={handleReviewWorkflows}
            icon={<Layers className="w-3.5 h-3.5" />}
            className="text-xs"
          >
            Review Workflows
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleIgnore}
            icon={<X className="w-3.5 h-3.5" />}
            className="text-xs"
          >
            Ignore for Now
          </Button>
        </div>
      </div>
    </div>
  );
};
