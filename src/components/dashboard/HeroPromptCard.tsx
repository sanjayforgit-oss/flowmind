import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Lightbulb } from 'lucide-react';
import { Button } from '../common/Button';
import { promptExamples } from '../../data/mockData';
import { useToast } from '../../context/ToastContext';

export const HeroPromptCard: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleGenerate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim()) {
      showToast('Please type a requirement or select a demo prompt.', 'warning');
      return;
    }
    showToast('Redirecting to AI Copilot workbench...', 'info');
    navigate('/copilot', { state: { initialPrompt: prompt } });
  };

  const handleQuickSelect = (example: string) => {
    setPrompt(example);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-b from-[#111728] via-[#0d121f] to-[#0a0d16] p-6 sm:p-8 shadow-xl">
      {/* Subtle background glow */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-3xl">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-medium text-indigo-300 mb-4">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Natural Language Automation Copilot</span>
        </div>

        {/* Hero title & subtitle */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white leading-tight">
          Automate your business with natural language.
        </h1>
        <p className="text-sm sm:text-base text-slate-300 mt-2 leading-relaxed">
          Describe what you want to automate. FlowMind turns business intent into intelligent workflows.
        </p>

        {/* Large Prompt Input Form */}
        <form onSubmit={handleGenerate} className="mt-6">
          <div className="relative rounded-xl bg-[#090c13] border border-white/10 p-2 sm:p-3 shadow-inner focus-within:border-indigo-500/60 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
            <div className="text-xs font-semibold text-slate-400 px-2 pt-1 uppercase tracking-wider">
              What do you want to automate?
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="When a customer complaint is received, evaluate priority, create a Zendesk ticket, and alert the manager on Slack..."
              rows={3}
              className="w-full bg-transparent border-0 text-sm sm:text-base text-slate-100 placeholder-slate-400 focus:outline-none resize-none p-2"
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 px-2 border-t border-white/[0.06]">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/10 text-[10px] font-mono text-slate-400">
                  Shift + Enter
                </kbd>
                <span>for new line</span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  icon={<Sparkles className="w-4 h-4" />}
                >
                  Generate Workflow
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        </form>

        {/* Quick Suggestion Chips */}
        <div className="mt-4 pt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            Try an example:
          </span>
          {promptExamples.map((ex, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleQuickSelect(ex)}
              className="text-xs px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.08] text-slate-300 hover:text-white hover:bg-white/[0.08] hover:border-indigo-500/30 transition-all text-left truncate max-w-xs cursor-pointer"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
