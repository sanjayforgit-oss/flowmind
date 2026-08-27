import React from 'react';
import { Workflow, Zap, CheckCircle2, Clock, ArrowUpRight, TrendingUp } from 'lucide-react';
import type { StatMetric } from '../../types';

interface StatCardProps {
  metric: StatMetric;
}

export const StatCard: React.FC<StatCardProps> = ({ metric }) => {
  const getIcon = (name: string) => {
    switch (name) {
      case 'Workflow':
        return <Workflow className="w-4 h-4 text-indigo-400" />;
      case 'Zap':
        return <Zap className="w-4 h-4 text-cyan-400" />;
      case 'CheckCircle2':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'Clock':
        return <Clock className="w-4 h-4 text-violet-400" />;
      default:
        return <TrendingUp className="w-4 h-4 text-indigo-400" />;
    }
  };

  return (
    <div className="glass-card rounded-xl p-4 sm:p-5 relative overflow-hidden transition-all duration-200 hover:border-white/15">
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-xs font-medium text-slate-400 tracking-wide uppercase">{metric.title}</span>
        <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/5 flex items-center justify-center">
          {getIcon(metric.iconName)}
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-white font-sans">
          {metric.value}
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
        <span className={`inline-flex items-center font-medium ${metric.isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
          <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
          {metric.change}
        </span>
        <span className="text-slate-400 text-[11px]">{metric.timeframe}</span>
      </div>
    </div>
  );
};
