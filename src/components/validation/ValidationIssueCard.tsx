import React from 'react';
import { AlertCircle, AlertTriangle, Lightbulb, ArrowRight, Wrench, Eye } from 'lucide-react';
import type { ValidationIssue, IssueSeverity } from '../../services/validationService';
import { Button } from '../common/Button';

interface ValidationIssueCardProps {
  issue: ValidationIssue;
  onFixNode: (nodeId?: string) => void;
}

const severityConfig: Record<
  IssueSeverity,
  { label: string; badge: string; border: string; bg: string; iconBg: string; text: string; Icon: any }
> = {
  error: {
    label: 'ERROR',
    badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    border: 'border-rose-500/30 hover:border-rose-500/60',
    bg: 'bg-gradient-to-r from-rose-950/20 via-[#120f18] to-[#0c0e17]',
    iconBg: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
    text: 'text-rose-400',
    Icon: AlertCircle,
  },
  warning: {
    label: 'WARNING',
    badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    border: 'border-amber-500/30 hover:border-amber-500/60',
    bg: 'bg-gradient-to-r from-amber-950/20 via-[#141217] to-[#0c0e17]',
    iconBg: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    text: 'text-amber-400',
    Icon: AlertTriangle,
  },
  info: {
    label: 'SUGGESTION',
    badge: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    border: 'border-indigo-500/30 hover:border-indigo-500/60',
    bg: 'bg-gradient-to-r from-indigo-950/20 via-[#10131e] to-[#0c0e17]',
    iconBg: 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30',
    text: 'text-indigo-400',
    Icon: Lightbulb,
  },
};

export const ValidationIssueCard: React.FC<ValidationIssueCardProps> = ({ issue, onFixNode }) => {
  const theme = severityConfig[issue.severity] || severityConfig.info;
  const Icon = theme.Icon;

  const getActionLabel = () => {
    if (issue.severity === 'error') return 'Fix Node';
    if (issue.severity === 'warning') return 'Review Node';
    return 'Review Workflow';
  };

  return (
    <div
      className={`glass-card rounded-xl p-4 sm:p-5 border transition-all duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${theme.bg} ${theme.border}`}
    >
      <div className="flex items-start gap-3.5">
        {/* Severity Icon */}
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${theme.iconBg}`}>
          <Icon className="w-4 h-4" />
        </div>

        {/* Issue Details */}
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border ${theme.badge}`}>
              {theme.label}
            </span>

            {issue.nodeTitle && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono text-slate-300 bg-white/5 border border-white/10">
                Affected Node: <strong className="text-white">{issue.nodeTitle}</strong>
              </span>
            )}
          </div>

          <h4 className="text-sm font-semibold text-white tracking-tight pt-0.5">
            {issue.title}
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
            {issue.description}
          </p>
        </div>
      </div>

      {/* Click-To-Fix Button */}
      <div className="shrink-0 sm:self-center">
        <Button
          variant={issue.severity === 'error' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => onFixNode(issue.nodeId)}
          icon={issue.severity === 'error' ? <Wrench className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          className="text-xs font-semibold whitespace-nowrap"
        >
          {getActionLabel()}
          <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </Button>
      </div>
    </div>
  );
};
