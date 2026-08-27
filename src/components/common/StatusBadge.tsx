import React from 'react';
import { clsx } from 'clsx';

export interface StatusBadgeProps {
  status: 'active' | 'paused' | 'draft' | 'error' | 'success' | 'running' | 'failed' | 'queued' | 'high' | 'medium' | 'low' | 'validated' | 'ready';
  label?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, size = 'sm' }) => {
  const displayLabel = label || status.charAt(0).toUpperCase() + status.slice(1);

  const stylesMap: Record<string, { bg: string; text: string; dot: string; border: string }> = {
    active: {
      bg: 'bg-emerald-950/40',
      text: 'text-emerald-300',
      dot: 'bg-emerald-400',
      border: 'border-emerald-500/20',
    },
    ready: {
      bg: 'bg-emerald-950/40',
      text: 'text-emerald-300',
      dot: 'bg-emerald-400',
      border: 'border-emerald-500/20',
    },
    validated: {
      bg: 'bg-indigo-950/40',
      text: 'text-indigo-300',
      dot: 'bg-indigo-400',
      border: 'border-indigo-500/20',
    },
    success: {
      bg: 'bg-emerald-950/40',
      text: 'text-emerald-300',
      dot: 'bg-emerald-400',
      border: 'border-emerald-500/20',
    },
    running: {
      bg: 'bg-indigo-950/50',
      text: 'text-indigo-300',
      dot: 'bg-indigo-400 animate-pulse',
      border: 'border-indigo-500/30',
    },
    paused: {
      bg: 'bg-amber-950/40',
      text: 'text-amber-300',
      dot: 'bg-amber-400',
      border: 'border-amber-500/20',
    },
    draft: {
      bg: 'bg-slate-800/50',
      text: 'text-slate-300',
      dot: 'bg-slate-400',
      border: 'border-white/10',
    },
    queued: {
      bg: 'bg-slate-800/40',
      text: 'text-slate-400',
      dot: 'bg-slate-500',
      border: 'border-white/10',
    },
    error: {
      bg: 'bg-rose-950/40',
      text: 'text-rose-300',
      dot: 'bg-rose-400',
      border: 'border-rose-500/20',
    },
    failed: {
      bg: 'bg-rose-950/40',
      text: 'text-rose-300',
      dot: 'bg-rose-400',
      border: 'border-rose-500/20',
    },
    high: {
      bg: 'bg-rose-950/40',
      text: 'text-rose-300',
      dot: 'bg-rose-400',
      border: 'border-rose-500/20',
    },
    medium: {
      bg: 'bg-amber-950/40',
      text: 'text-amber-300',
      dot: 'bg-amber-400',
      border: 'border-amber-500/20',
    },
    low: {
      bg: 'bg-blue-950/40',
      text: 'text-blue-300',
      dot: 'bg-blue-400',
      border: 'border-blue-500/20',
    },
  };

  const current = stylesMap[status] || stylesMap.draft;

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full font-medium border font-mono tracking-tight select-none',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        current.bg,
        current.text,
        current.border
      )}
    >
      <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', current.dot)} />
      {displayLabel}
    </span>
  );
};
