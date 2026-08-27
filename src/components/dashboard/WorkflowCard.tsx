import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, MoreVertical, CheckCircle2, Clock } from 'lucide-react';
import type { Workflow } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { useToast } from '../../context/ToastContext';

interface WorkflowCardProps {
  workflow: Workflow;
  onEdit?: (wf: Workflow) => void;
}

export const WorkflowCard: React.FC<WorkflowCardProps> = ({ workflow, onEdit }) => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleSimulate = (e: React.MouseEvent) => {
    e.stopPropagation();
    showToast(`Loading simulation for "${workflow.name}"...`, 'info');
    navigate('/simulation', { state: { selectedWorkflowId: workflow.id } });
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(workflow);
    } else {
      showToast(`Options opened for ${workflow.name}`, 'info');
    }
  };

  return (
    <div
      onClick={() => onEdit?.(workflow)}
      className="glass-card glass-card-hover rounded-xl p-5 relative flex flex-col justify-between cursor-pointer group"
    >
      <div>
        {/* Card Header: Category & Status */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-[11px] font-medium font-mono text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">
            {workflow.category}
          </span>
          <div className="flex items-center gap-2">
            <StatusBadge status={workflow.status} />
            <button
              onClick={handleMenuClick}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
              aria-label="Workflow options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Workflow Title & Description */}
        <h3 className="text-base font-semibold text-white group-hover:text-indigo-300 transition-colors mb-1.5 line-clamp-1">
          {workflow.name}
        </h3>
        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
          {workflow.description}
        </p>

        {/* Trigger Summary */}
        <div className="p-2.5 rounded-lg bg-black/30 border border-white/5 mb-4 text-xs font-mono flex items-center gap-2 text-slate-300">
          <span className="text-slate-400 font-semibold">Trigger:</span>
          <span className="text-indigo-300 truncate">{workflow.trigger}</span>
        </div>

        {/* Integration Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {workflow.tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.04] text-slate-400 border border-white/5"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Footer Metrics & Actions */}
      <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
        <div className="flex items-center gap-3 text-slate-400">
          <span className="flex items-center gap-1" title="Last executed">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            {workflow.lastRun}
          </span>
          <span className="flex items-center gap-1 text-emerald-400" title="Success rate">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {workflow.successRate}%
          </span>
        </div>

        <button
          onClick={handleSimulate}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/25 hover:bg-indigo-600 hover:text-white transition-all cursor-pointer shadow-xs"
        >
          <Play className="w-3 h-3 fill-current" />
          <span>Simulate</span>
        </button>
      </div>
    </div>
  );
};
