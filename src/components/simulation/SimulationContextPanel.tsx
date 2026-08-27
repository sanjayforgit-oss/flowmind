import React from 'react';
import { Sliders } from 'lucide-react';
import type { SimulationContext } from '../../services/simulationService';

interface SimulationContextPanelProps {
  context: SimulationContext;
  onUpdateContext: (updates: Partial<SimulationContext>) => void;
  disabled: boolean;
}

export const SimulationContextPanel: React.FC<SimulationContextPanelProps> = ({
  context,
  onUpdateContext,
  disabled,
}) => {
  return (
    <div className="glass-card rounded-xl p-4 border border-white/[0.08] bg-[#0c101d] space-y-3 shadow-lg">
      <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Sliders className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-xs font-semibold text-white font-mono uppercase tracking-wider">
            Simulation Input Context
          </span>
        </div>
        <span className="text-[10px] font-mono text-slate-400">
          Editable Test Parameters
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        {/* Priority Selector (Controls condition evaluation) */}
        <div>
          <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
            Priority Level
          </label>
          <select
            value={context.priority}
            onChange={(e) => onUpdateContext({ priority: e.target.value as any })}
            disabled={disabled}
            className="w-full bg-[#111624] border border-white/10 rounded-lg p-2 text-xs font-mono font-semibold text-amber-300 focus:outline-none focus:border-indigo-500/60 disabled:opacity-50"
          >
            <option value="HIGH">HIGH (Urgent Route)</option>
            <option value="MEDIUM">MEDIUM (Standard)</option>
            <option value="LOW">LOW (Standard)</option>
          </select>
        </div>

        {/* Customer Tier */}
        <div>
          <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
            Customer Tier
          </label>
          <select
            value={context.customerTier}
            onChange={(e) => onUpdateContext({ customerTier: e.target.value as any })}
            disabled={disabled}
            className="w-full bg-[#111624] border border-white/10 rounded-lg p-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500/60 disabled:opacity-50"
          >
            <option value="Enterprise">Enterprise</option>
            <option value="Growth">Growth</option>
            <option value="Starter">Starter</option>
          </select>
        </div>

        {/* Customer ID */}
        <div>
          <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
            Customer ID
          </label>
          <input
            type="text"
            value={context.customerId}
            onChange={(e) => onUpdateContext({ customerId: e.target.value })}
            disabled={disabled}
            className="w-full bg-[#111624] border border-white/10 rounded-lg p-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500/60 disabled:opacity-50"
          />
        </div>

        {/* Category */}
        <div>
          <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
            Payload Category
          </label>
          <input
            type="text"
            value={context.category}
            onChange={(e) => onUpdateContext({ category: e.target.value })}
            disabled={disabled}
            className="w-full bg-[#111624] border border-white/10 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/60 disabled:opacity-50"
          />
        </div>
      </div>
    </div>
  );
};
