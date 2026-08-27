import React from 'react';
import { Sparkles, Zap, Clock, AlertTriangle } from 'lucide-react';
import type { SimulationAnalytics } from '../../services/simulationService';

interface SimulationInsightsCardProps {
  analytics: SimulationAnalytics;
}

export const SimulationInsightsCard: React.FC<SimulationInsightsCardProps> = ({ analytics }) => {
  return (
    <div className="glass-card rounded-xl p-5 border border-white/[0.08] bg-[#0c101d] space-y-3 shadow-xl">
      <div className="flex items-center gap-2 pb-2 border-b border-white/[0.06]">
        <Sparkles className="w-4 h-4 text-indigo-400" />
        <span className="text-xs font-semibold text-white font-mono uppercase tracking-wider">
          Simulation Insights & Latency
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
        {/* Fastest Step */}
        <div className="p-3 rounded-lg bg-black/40 border border-emerald-500/20">
          <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] uppercase mb-1">
            <Zap className="w-3 h-3" /> Fastest Execution
          </div>
          <div className="text-slate-200 font-bold truncate">{analytics.fastestStep.title}</div>
          <div className="text-emerald-400 font-bold mt-0.5">{analytics.fastestStep.duration}</div>
        </div>

        {/* Longest Step */}
        <div className="p-3 rounded-lg bg-black/40 border border-indigo-500/20">
          <div className="flex items-center gap-1.5 text-indigo-400 text-[10px] uppercase mb-1">
            <Clock className="w-3 h-3" /> Heaviest Payload Step
          </div>
          <div className="text-slate-200 font-bold truncate">{analytics.longestStep.title}</div>
          <div className="text-indigo-300 font-bold mt-0.5">{analytics.longestStep.duration}</div>
        </div>

        {/* Potential Bottleneck */}
        <div className="p-3 rounded-lg bg-black/40 border border-amber-500/20">
          <div className="flex items-center gap-1.5 text-amber-400 text-[10px] uppercase mb-1">
            <AlertTriangle className="w-3 h-3" /> Runtime Checkpoint
          </div>
          <div className="text-slate-200 font-bold truncate">{analytics.potentialBottleneck}</div>
          <div className="text-amber-300 font-medium text-[11px] mt-0.5">Manager Gate</div>
        </div>
      </div>
    </div>
  );
};
