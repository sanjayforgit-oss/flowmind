import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import {
  Zap,
  Sparkles,
  Filter,
  Cpu,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Check,
  XCircle,
  Loader2,
} from 'lucide-react';
import type { FlowNodeType, NodeStatus } from '../../types';

export interface CustomNodeData {
  id: string;
  type: FlowNodeType;
  title: string;
  description: string;
  status: NodeStatus;
  branch?: 'yes' | 'no' | 'main';
  actionType?: string;
  [key: string]: unknown;
}

const statusConfig: Record<NodeStatus, { label: string; dot: string; text: string; Icon?: any }> = {
  ready: { label: 'Ready', dot: 'bg-emerald-400', text: 'text-emerald-300' },
  idle: { label: 'Idle', dot: 'bg-slate-400', text: 'text-slate-400' },
  running: { label: 'Running', dot: 'bg-indigo-400 animate-pulse', text: 'text-indigo-300', Icon: Loader2 },
  success: { label: 'Success', dot: 'bg-emerald-400', text: 'text-emerald-300', Icon: Check },
  warning: { label: 'Warning', dot: 'bg-amber-400', text: 'text-amber-300', Icon: AlertTriangle },
  error: { label: 'Error', dot: 'bg-rose-400', text: 'text-rose-300', Icon: XCircle },
  pending: { label: 'Pending', dot: 'bg-violet-400', text: 'text-violet-300', Icon: Clock },
};

const nodeTypeThemes: Record<
  FlowNodeType,
  { typeLabel: string; border: string; bg: string; iconBg: string; badge: string; Icon: any }
> = {
  trigger: {
    typeLabel: 'TRIGGER',
    border: 'border-cyan-500/40 hover:border-cyan-500/80',
    bg: 'bg-gradient-to-br from-[#0c1626] to-[#090d16]',
    iconBg: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30',
    badge: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
    Icon: Zap,
  },
  aiAction: {
    typeLabel: 'AI ACTION',
    border: 'border-violet-500/40 hover:border-violet-500/80',
    bg: 'bg-gradient-to-br from-[#141026] to-[#090d16]',
    iconBg: 'bg-violet-500/20 text-violet-400 border border-violet-500/30',
    badge: 'bg-violet-500/10 text-violet-300 border-violet-500/20',
    Icon: Sparkles,
  },
  condition: {
    typeLabel: 'CONDITION',
    border: 'border-amber-500/40 hover:border-amber-500/80',
    bg: 'bg-gradient-to-br from-[#1a150c] to-[#090d16]',
    iconBg: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    badge: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
    Icon: Filter,
  },
  action: {
    typeLabel: 'ACTION',
    border: 'border-indigo-500/40 hover:border-indigo-500/80',
    bg: 'bg-gradient-to-br from-[#0e1428] to-[#090d16]',
    iconBg: 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30',
    badge: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
    Icon: Cpu,
  },
  approval: {
    typeLabel: 'APPROVAL',
    border: 'border-violet-500/40 hover:border-violet-500/80',
    bg: 'bg-gradient-to-br from-[#18112b] to-[#090d16]',
    iconBg: 'bg-violet-500/20 text-violet-400 border border-violet-500/30',
    badge: 'bg-violet-500/10 text-violet-300 border-violet-500/20',
    Icon: UserCheck,
  },
  end: {
    typeLabel: 'END',
    border: 'border-emerald-500/40 hover:border-emerald-500/80',
    bg: 'bg-gradient-to-br from-[#0c1c18] to-[#090d16]',
    iconBg: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
    Icon: CheckCircle2,
  },
};

export const CustomFlowNode = memo(({ data, selected }: { data: CustomNodeData; selected: boolean }) => {
  const theme = nodeTypeThemes[data.type] || nodeTypeThemes.action;
  const status = statusConfig[data.status] || statusConfig.ready;
  const Icon = theme.Icon;

  return (
    <div
      className={`relative w-72 rounded-xl border p-4 shadow-xl transition-all duration-150 select-none ${
        theme.bg
      } ${theme.border} ${
        selected ? 'ring-2 ring-indigo-500/80 border-indigo-400 shadow-indigo-500/20 scale-[1.02]' : ''
      }`}
    >
      {/* Top Handle (Incoming connection) for non-trigger nodes */}
      {data.type !== 'trigger' && (
        <Handle
          type="target"
          position={Position.Top}
          className="w-3 h-3 rounded-full bg-indigo-500 border-2 border-[#090d16] hover:scale-125 transition-transform"
        />
      )}

      {/* Header with Icon, Type Badge & Status */}
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${theme.iconBg}`}>
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider border ${theme.badge}`}
            >
              {theme.typeLabel}
            </span>
          </div>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-1.5 font-mono text-[10px]">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${status.dot}`} />
          <span className={status.text}>{status.label}</span>
        </div>
      </div>

      {/* Title & Description */}
      <div>
        <h4 className="text-xs font-semibold text-white tracking-tight line-clamp-1">
          {data.title}
        </h4>
        <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
          {data.description}
        </p>
      </div>

      {/* Condition Branch Labels & Handles */}
      {data.type === 'condition' ? (
        <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[10px] font-mono">
          <div className="relative pl-1">
            <span className="text-emerald-400 font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
              YES (Urgent)
            </span>
            <Handle
              type="source"
              id="yes"
              position={Position.Bottom}
              style={{ left: '25%' }}
              className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#090d16] hover:scale-125 transition-transform"
            />
          </div>

          <div className="relative pr-1">
            <span className="text-slate-400 font-bold px-1.5 py-0.5 rounded bg-white/5 border border-white/10">
              NO (Standard)
            </span>
            <Handle
              type="source"
              id="no"
              position={Position.Bottom}
              style={{ left: '75%' }}
              className="w-3 h-3 rounded-full bg-slate-400 border-2 border-[#090d16] hover:scale-125 transition-transform"
            />
          </div>
        </div>
      ) : data.type !== 'end' ? (
        /* Bottom Handle (Outgoing connection) for standard non-end nodes */
        <Handle
          type="source"
          position={Position.Bottom}
          className="w-3 h-3 rounded-full bg-indigo-500 border-2 border-[#090d16] hover:scale-125 transition-transform"
        />
      ) : null}
    </div>
  );
});

CustomFlowNode.displayName = 'CustomFlowNode';
