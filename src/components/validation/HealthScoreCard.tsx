import React from 'react';
import { AlertCircle, AlertTriangle, Lightbulb } from 'lucide-react';
import type { ValidationResult } from '../../services/validationService';

interface HealthScoreCardProps {
  validationResult: ValidationResult;
}

export const HealthScoreCard: React.FC<HealthScoreCardProps> = ({ validationResult }) => {
  const { score, errorCount, warningCount, suggestionCount, isValid } = validationResult;

  const getScoreTheme = (val: number) => {
    if (val >= 90) return { text: 'text-emerald-400', stroke: '#34d399', bg: 'bg-emerald-500/10 border-emerald-500/20' };
    if (val >= 70) return { text: 'text-amber-400', stroke: '#fbbf24', bg: 'bg-amber-500/10 border-amber-500/20' };
    return { text: 'text-rose-400', stroke: '#f87171', bg: 'bg-rose-500/10 border-rose-500/20' };
  };

  const theme = getScoreTheme(score);
  const strokeDashoffset = 283 - (283 * score) / 100;

  return (
    <div className="glass-card rounded-xl p-6 border border-white/[0.08] bg-[#0c101c] shadow-xl">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
        {/* Left: Score Wheel & Summary */}
        <div className="flex items-center gap-6">
          {/* Circular SVG Gauge */}
          <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="transparent"
                stroke="#1e293b"
                strokeWidth="8"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="transparent"
                stroke={theme.stroke}
                strokeWidth="8"
                strokeDasharray="283"
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className={`text-2xl font-bold font-mono ${theme.text}`}>{score}</span>
              <span className="text-[10px] font-mono text-slate-400">/ 100</span>
            </div>
          </div>

          {/* Title & Description */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
                Rule-Based Workflow Health
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${
                  isValid
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                }`}
              >
                {isValid ? 'Ready for Runtime' : 'Review Recommended'}
              </span>
            </div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              {validationResult.workflowName}
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md leading-relaxed">
              Static verification completed. Inspects structural integrity, trigger gating, and condition divergence before simulation.
            </p>
          </div>
        </div>

        {/* Right: Metrics Strip (Errors, Warnings, Suggestions) */}
        <div className="flex items-center gap-3 w-full lg:w-auto justify-around lg:justify-end">
          {/* Errors */}
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#140f17] border border-rose-500/20 min-w-[110px]">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-400 block">Errors</span>
              <span className="text-base font-bold font-mono text-rose-400">{errorCount}</span>
            </div>
          </div>

          {/* Warnings */}
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#17140f] border border-amber-500/20 min-w-[110px]">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-400 block">Warnings</span>
              <span className="text-base font-bold font-mono text-amber-400">{warningCount}</span>
            </div>
          </div>

          {/* Suggestions */}
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#0f141f] border border-indigo-500/20 min-w-[110px]">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
              <Lightbulb className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-400 block">Suggestions</span>
              <span className="text-base font-bold font-mono text-indigo-300">{suggestionCount}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
