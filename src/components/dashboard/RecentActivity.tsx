import React from 'react';
import { NavLink } from 'react-router-dom';
import { Activity, ArrowRight, CheckCircle2, Clock, XCircle, Loader2 } from 'lucide-react';
import { mockExecutions } from '../../data/mockData';
import { StatusBadge } from '../common/StatusBadge';

export const RecentActivity: React.FC = () => {
  return (
    <div className="glass-card rounded-xl p-5 border border-white/[0.08] flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-white tracking-tight">Recent Execution Activity</h3>
          </div>
          <NavLink
            to="/executions"
            className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 font-medium"
          >
            View all <ArrowRight className="w-3.5 h-3.5" />
          </NavLink>
        </div>

        <div className="space-y-3">
          {mockExecutions.slice(0, 4).map((exec) => (
            <div
              key={exec.id}
              className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:border-white/10 hover:bg-white/[0.04] transition-all flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="shrink-0">
                  {exec.status === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  {exec.status === 'running' && <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />}
                  {exec.status === 'failed' && <XCircle className="w-4 h-4 text-rose-400" />}
                  {exec.status === 'queued' && <Clock className="w-4 h-4 text-slate-400" />}
                </div>

                <div className="truncate">
                  <p className="font-medium text-slate-200 truncate">{exec.workflowName}</p>
                  <p className="text-[11px] text-slate-400 font-mono truncate">{exec.triggerEvent}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 text-right">
                <div className="hidden sm:flex flex-col text-right font-mono text-[11px]">
                  <span className="text-slate-300">{exec.duration}</span>
                  <span className="text-slate-400">{exec.startedAt.split(' ')[0]} ago</span>
                </div>
                <StatusBadge status={exec.status} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400 font-mono">
        <span>48,290 Total Runs</span>
        <span className="text-emerald-400">99.4% SLA</span>
      </div>
    </div>
  );
};
