import React, { useState } from 'react';
import { Terminal, Copy, Check } from 'lucide-react';
import type { SimulatedStep } from '../../services/simulationService';
import { useToast } from '../../context/ToastContext';

interface StepPayloadInspectorProps {
  selectedStep: SimulatedStep | null;
}

export const StepPayloadInspector: React.FC<StepPayloadInspectorProps> = ({ selectedStep }) => {
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  if (!selectedStep) {
    return (
      <div className="glass-card rounded-xl p-6 border border-white/[0.08] bg-[#090c15] text-center flex flex-col items-center justify-center h-full text-slate-400">
        <Terminal className="w-8 h-8 text-slate-500 mb-2" />
        <h4 className="text-xs font-semibold text-white font-mono uppercase tracking-wider">
          Step Payload Inspector
        </h4>
        <p className="text-xs text-slate-400 max-w-xs mt-1">
          Click any step in the timeline to inspect its simulated JSON input and execution payload.
        </p>
      </div>
    );
  }

  const handleCopy = () => {
    const jsonStr = JSON.stringify(selectedStep.payload, null, 2);
    navigator.clipboard.writeText(jsonStr);
    setCopied(true);
    showToast('Payload JSON copied to clipboard.', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-card rounded-xl p-5 border border-white/[0.08] bg-[#090c15] flex flex-col justify-between h-full space-y-4 shadow-xl">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-semibold text-white font-mono uppercase tracking-wider">
              Step Payload Inspector
            </span>
          </div>
          <span className="text-[10px] font-mono text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
            Step {selectedStep.stepNumber}
          </span>
        </div>

        {/* Step Metadata Summary */}
        <div className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1.5 text-xs font-mono">
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-slate-400 uppercase text-[10px]">Step Name</span>
            <strong className="text-white truncate max-w-[180px]">{selectedStep.title}</strong>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-slate-400 uppercase text-[10px]">Node Type</span>
            <span className="text-indigo-300 capitalize">{selectedStep.nodeType}</span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-slate-400 uppercase text-[10px]">Execution Latency</span>
            <span className="text-cyan-300">{selectedStep.durationMs}ms</span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-slate-400 uppercase text-[10px]">Status</span>
            <span className="text-emerald-400 uppercase font-bold">{selectedStep.status}</span>
          </div>
        </div>

        {/* JSON Payload Output */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Runtime Payload State</span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-[10px] text-indigo-300 hover:text-white transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied' : 'Copy JSON'}
            </button>
          </div>

          <div className="rounded-lg bg-[#05070c] border border-white/10 p-3 font-mono text-xs text-indigo-200 max-h-[300px] overflow-y-auto shadow-inner">
            <pre className="text-[11px] leading-relaxed">
              {JSON.stringify(selectedStep.payload, null, 2)}
            </pre>
          </div>
        </div>
      </div>

      {/* Output Summary */}
      <div className="pt-2 border-t border-white/[0.06] text-xs text-slate-400 font-mono">
        <span className="text-[10px] uppercase text-slate-400 block mb-0.5">Summary Output</span>
        <p className="text-slate-200 line-clamp-2">{selectedStep.outputSummary}</p>
      </div>
    </div>
  );
};
