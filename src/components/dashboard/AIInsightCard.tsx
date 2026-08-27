import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Zap } from 'lucide-react';
import { Button } from '../common/Button';
import { useToast } from '../../context/ToastContext';

export const AIInsightCard: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleApplyInsight = () => {
    showToast('Optimization suggestion loaded into AI Copilot workbench', 'success');
    navigate('/copilot');
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-indigo-500/30 bg-gradient-to-br from-[#111729]/90 via-[#0e1322]/80 to-[#0b0e17] p-5 shadow-lg">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">
            AI Copilot Insight
          </span>
        </div>
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium text-amber-300 bg-amber-500/10 border border-amber-500/20">
          DEMO PREVIEW
        </span>
      </div>

      <h4 className="text-sm font-semibold text-white tracking-tight mb-2">
        Optimize: Customer Complaint Automation
      </h4>

      <p className="text-xs text-slate-300 leading-relaxed mb-4">
        &ldquo;Your Customer Complaint workflow can reduce unnecessary manager notifications by adding a priority condition (<span className="text-indigo-300 font-mono">Severity == High</span>).&rdquo;
      </p>

      <div className="p-3 rounded-lg bg-black/40 border border-white/5 mb-4 flex items-center justify-between text-xs font-mono">
        <span className="text-slate-400">Estimated Impact:</span>
        <span className="text-emerald-400 font-semibold">-42% Slack Noise</span>
      </div>

      <div className="flex items-center justify-between gap-3 pt-2">
        <span className="text-[11px] text-slate-400">
          Generated based on 14,200 execution patterns
        </span>
        <Button
          variant="primary"
          size="sm"
          onClick={handleApplyInsight}
          icon={<Zap className="w-3.5 h-3.5" />}
        >
          Apply with Copilot
        </Button>
      </div>
    </div>
  );
};
