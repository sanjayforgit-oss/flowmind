import React from 'react';
import {
  Bot,
  User,
  Sparkles,
  PlusCircle,
  Edit3,
  CheckCircle2,
  Play,
  AlertOctagon,
  Trash2,
  Sliders,
  MinusCircle,
  Clock,
  Workflow as WorkflowIcon,
} from 'lucide-react';
import type { AuditEvent } from '../../services/auditTrailService';

interface AuditTrailTimelineProps {
  logs: AuditEvent[];
  isLoading?: boolean;
}

export const AuditTrailTimeline: React.FC<AuditTrailTimelineProps> = ({ logs, isLoading }) => {
  const getActionConfig = (action: AuditEvent['action']) => {
    switch (action) {
      case 'workflow_generated_by_ai':
        return {
          label: 'AI Synthesis',
          color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
          icon: Sparkles,
        };
      case 'workflow_created':
        return {
          label: 'Workflow Created',
          color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
          icon: PlusCircle,
        };
      case 'workflow_updated':
        return {
          label: 'Workflow Updated',
          color: 'text-indigo-300 bg-indigo-500/10 border-indigo-500/30',
          icon: Edit3,
        };
      case 'workflow_published':
        return {
          label: 'Workflow Published',
          color: 'text-purple-300 bg-purple-500/10 border-purple-500/30',
          icon: CheckCircle2,
        };
      case 'workflow_executed':
        return {
          label: 'Workflow Executed',
          color: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30',
          icon: Play,
        };
      case 'workflow_execution_failed':
        return {
          label: 'Execution Failed',
          color: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
          icon: AlertOctagon,
        };
      case 'workflow_node_added':
        return {
          label: 'Step Added',
          color: 'text-blue-300 bg-blue-500/10 border-blue-500/30',
          icon: PlusCircle,
        };
      case 'workflow_node_updated':
        return {
          label: 'Step Configured',
          color: 'text-amber-300 bg-amber-500/10 border-amber-500/30',
          icon: Sliders,
        };
      case 'workflow_node_removed':
        return {
          label: 'Step Removed',
          color: 'text-rose-300 bg-rose-500/10 border-rose-500/30',
          icon: MinusCircle,
        };
      case 'workflow_deleted':
        return {
          label: 'Workflow Deleted',
          color: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
          icon: Trash2,
        };
      default:
        return {
          label: 'Action Logged',
          color: 'text-slate-300 bg-white/5 border-white/10',
          icon: Clock,
        };
    }
  };

  if (isLoading) {
    return (
      <div className="py-16 text-center text-slate-400 font-mono text-xs flex flex-col items-center justify-center gap-2">
        <div className="w-6 h-6 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
        <span>Loading persistent audit logs from Supabase...</span>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="glass-card rounded-2xl border border-white/[0.08] p-12 text-center text-slate-400">
        <Clock className="w-8 h-8 text-indigo-400/60 mx-auto mb-3" />
        <h4 className="text-sm font-semibold text-white mb-1">No Audit Records Yet</h4>
        <p className="text-xs max-w-sm mx-auto text-slate-400">
          Important automation events such as AI generation, workflow edits, and dry-run executions will automatically appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-[17px] before:top-3 before:bottom-3 before:w-0.5 before:bg-white/[0.08]">
      {logs.map((log) => {
        const config = getActionConfig(log.action);
        const Icon = config.icon;
        const isAi = log.actor_type === 'ai';
        const formattedDate = new Date(log.created_at).toLocaleString([], {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });

        return (
          <div key={log.id} className="relative group">
            {/* Timeline Dot Indicator */}
            <div
              className={`absolute -left-[30px] top-3.5 w-6 h-6 rounded-full flex items-center justify-center border text-[10px] shadow-sm z-10 transition-transform group-hover:scale-110 ${
                isAi
                  ? 'bg-[#0b1329] text-cyan-400 border-cyan-500/50 shadow-cyan-500/20'
                  : 'bg-[#121626] text-indigo-400 border-indigo-500/50 shadow-indigo-500/20'
              }`}
            >
              {isAi ? <Bot className="w-3 h-3" /> : <User className="w-3 h-3" />}
            </div>

            {/* Audit Log Card */}
            <div className="glass-card rounded-xl p-4 border border-white/[0.08] bg-[#0c101d]/90 hover:border-white/20 transition-all shadow-md space-y-2.5">
              {/* Card Header */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Action Badge */}
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.color}`}
                  >
                    <Icon className="w-3 h-3" />
                    {config.label}
                  </span>

                  {/* Actor Pill */}
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono border ${
                      isAi
                        ? 'bg-cyan-950/40 text-cyan-300 border-cyan-500/30'
                        : 'bg-indigo-950/40 text-indigo-300 border-indigo-500/30'
                    }`}
                  >
                    {isAi ? <Bot className="w-3 h-3" /> : <User className="w-3 h-3" />}
                    <strong>{log.actor_name}</strong>
                  </span>

                  {/* Workflow Association */}
                  <span className="inline-flex items-center gap-1 text-xs text-slate-300 font-medium">
                    <WorkflowIcon className="w-3 h-3 text-slate-400" />
                    <span className="text-slate-200">{log.workflow_name}</span>
                  </span>
                </div>

                {/* Timestamp */}
                <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{formattedDate}</span>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
                {log.description}
              </p>

              {/* Metadata Details (if present) */}
              {log.metadata && Object.keys(log.metadata).length > 0 && (
                <div className="pt-2 border-t border-white/[0.06] flex flex-wrap gap-2 text-[10px] font-mono text-slate-400">
                  {Object.entries(log.metadata).map(([key, val]) => (
                    <span
                      key={key}
                      className="px-2 py-0.5 rounded bg-black/40 border border-white/5 text-slate-300"
                    >
                      <span className="text-slate-400 uppercase">{key}:</span>{' '}
                      <span className="text-indigo-300">
                        {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                      </span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
