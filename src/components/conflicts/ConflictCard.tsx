import React from 'react';
import { AlertTriangle, ArrowRight, ShieldAlert, Check } from 'lucide-react';
import type { WorkflowConflict } from '../../types';
import { Button } from '../common/Button';
import { StatusBadge } from '../common/StatusBadge';
import { useToast } from '../../context/ToastContext';

interface ConflictCardProps {
  conflict: WorkflowConflict;
  onResolve?: (id: string) => void;
}

export const ConflictCard: React.FC<ConflictCardProps> = ({ conflict, onResolve }) => {
  const { showToast } = useToast();

  const handleResolveClick = () => {
    if (onResolve) {
      onResolve(conflict.id);
    } else {
      showToast(`Resolution strategy applied for "${conflict.title}"`, 'success');
    }
  };

  return (
    <div className="glass-card rounded-xl p-6 border border-amber-500/20 bg-[#10141f]/80 relative overflow-hidden transition-all duration-200 hover:border-amber-500/40">
      {/* Header with Title & Severity */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-white tracking-tight">
              {conflict.title}
            </h3>
            <span className="text-[11px] font-mono text-amber-300">
              Status: {conflict.status}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <StatusBadge status={conflict.severity} label={`Severity: ${conflict.severity.toUpperCase()}`} />
        </div>
      </div>

      {/* Description */}
      <p className="text-xs sm:text-sm text-slate-300 mb-5 leading-relaxed">
        {conflict.description}
      </p>

      {/* Side-by-Side Workflow Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        {/* Workflow A */}
        <div className="p-4 rounded-lg bg-[#0b0e17] border border-white/10 relative">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
              Workflow A
            </span>
            <span className="text-xs font-semibold text-slate-200 truncate">
              {conflict.workflowA.name}
            </span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="text-slate-400">
              Trigger: <span className="text-slate-200">{conflict.workflowA.trigger}</span>
            </div>
            <div className="flex items-center gap-1.5 text-indigo-300">
              <ArrowRight className="w-3 h-3 shrink-0" />
              <span>{conflict.workflowA.action}</span>
            </div>
          </div>
        </div>

        {/* Workflow B */}
        <div className="p-4 rounded-lg bg-[#0b0e17] border border-white/10 relative">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
              Workflow B
            </span>
            <span className="text-xs font-semibold text-slate-200 truncate">
              {conflict.workflowB.name}
            </span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="text-slate-400">
              Trigger: <span className="text-slate-200">{conflict.workflowB.trigger}</span>
            </div>
            <div className="flex items-center gap-1.5 text-cyan-300">
              <ArrowRight className="w-3 h-3 shrink-0" />
              <span>{conflict.workflowB.action}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Suggested Fix and Action Bar */}
      <div className="pt-4 border-t border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2 text-xs text-slate-300">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>
            <strong className="text-white">Suggested Fix:</strong> {conflict.suggestedFix}
          </span>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={handleResolveClick}
          icon={<Check className="w-3.5 h-3.5 text-emerald-400" />}
          className="shrink-0"
        >
          Auto-Merge Rule
        </Button>
      </div>
    </div>
  );
};
