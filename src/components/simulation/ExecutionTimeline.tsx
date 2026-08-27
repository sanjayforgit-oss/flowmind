import React, { useState } from 'react';
import {
  Play,
  RotateCcw,
  CheckCircle2,
  Clock,
  Loader2,
  Terminal,
  Zap,
  Filter,
  Bell,
  Cpu,
  Sparkles,
} from 'lucide-react';
import { Button } from '../common/Button';
import { useToast } from '../../context/ToastContext';

interface StepState {
  id: number;
  label: string;
  sublabel: string;
  type: 'trigger' | 'condition' | 'action' | 'notification' | 'completed';
  status: 'idle' | 'running' | 'completed' | 'failed';
  timeMs: number;
  payload: string;
}

const defaultSteps: StepState[] = [
  {
    id: 1,
    label: 'Trigger detected',
    sublabel: 'Customer Complaint received via Webhook (Priority: Urgent)',
    type: 'trigger',
    status: 'idle',
    timeMs: 120,
    payload: '{"event": "ticket_created", "customer_tier": "Enterprise", "sentiment": -0.82}',
  },
  {
    id: 2,
    label: 'Condition evaluated',
    sublabel: 'Evaluated: Severity == "Urgent" & Tier == "Enterprise" -> TRUE',
    type: 'condition',
    status: 'idle',
    timeMs: 85,
    payload: '{"condition_match": true, "route": "escalation_fastlane"}',
  },
  {
    id: 3,
    label: 'Action executed: Create Zendesk Ticket',
    sublabel: 'Created high-priority ticket #ZD-9982 with SLA timer 1h',
    type: 'action',
    status: 'idle',
    timeMs: 430,
    payload: '{"ticket_id": "ZD-9982", "status": "open", "sla_minutes": 60}',
  },
  {
    id: 4,
    label: 'Action executed: Slack Alert Dispatched',
    sublabel: 'Notified on-call engineer and manager in #support-escalations',
    type: 'notification',
    status: 'idle',
    timeMs: 310,
    payload: '{"channel": "#support-escalations", "delivery": "success", "ts": "1719203991.01"}',
  },
  {
    id: 5,
    label: 'Completed successfully',
    sublabel: 'Full workflow executed in 945ms with 0 errors',
    type: 'completed',
    status: 'idle',
    timeMs: 0,
    payload: '{"status": "FINISHED", "total_duration_ms": 945, "exit_code": 0}',
  },
];

export const ExecutionTimeline: React.FC = () => {
  const [steps, setSteps] = useState<StepState[]>(defaultSteps);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedStep, setSelectedStep] = useState<StepState>(defaultSteps[0]);
  const { showToast } = useToast();

  const handleStartSimulation = () => {
    if (isRunning) return;
    setIsRunning(true);
    showToast('Starting simulated workflow execution...', 'info');

    // Reset steps to idle
    setSteps(defaultSteps.map((s) => ({ ...s, status: 'idle' })));
    let currentIdx = 0;

    const runNext = () => {
      if (currentIdx >= defaultSteps.length) {
        setIsRunning(false);
        showToast('Workflow simulation completed successfully! (945ms)', 'success');
        return;
      }

      setSteps((prev) =>
        prev.map((s, idx) =>
          idx === currentIdx
            ? { ...s, status: 'running' }
            : idx < currentIdx
            ? { ...s, status: 'completed' }
            : { ...s, status: 'idle' }
        )
      );
      setSelectedStep(defaultSteps[currentIdx]);

      const delay = defaultSteps[currentIdx].timeMs + 400; // Simulated latency

      setTimeout(() => {
        setSteps((prev) =>
          prev.map((s, idx) =>
            idx === currentIdx ? { ...s, status: 'completed' } : s
          )
        );
        currentIdx += 1;
        runNext();
      }, delay);
    };

    runNext();
  };

  const handleReset = () => {
    setIsRunning(false);
    setSteps(defaultSteps.map((s) => ({ ...s, status: 'idle' })));
    setSelectedStep(defaultSteps[0]);
    showToast('Simulation reset', 'info');
  };

  const getStepIcon = (step: StepState) => {
    if (step.status === 'running') {
      return <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />;
    }
    if (step.status === 'completed') {
      return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
    }

    switch (step.type) {
      case 'trigger':
        return <Zap className="w-4 h-4 text-cyan-400" />;
      case 'condition':
        return <Filter className="w-4 h-4 text-amber-400" />;
      case 'action':
        return <Cpu className="w-4 h-4 text-indigo-400" />;
      case 'notification':
        return <Bell className="w-4 h-4 text-violet-400" />;
      case 'completed':
        return <Sparkles className="w-4 h-4 text-emerald-400" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Simulation Controls Header */}
      <div className="glass-card rounded-xl p-5 border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-white">
              Customer Complaint Automation — Simulator
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono text-cyan-300 bg-cyan-500/10 border border-cyan-500/20">
              Virtual Sandbox
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Validate triggers, condition branches, and action payloads without affecting live services.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={isRunning}
            icon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Reset
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={handleStartSimulation}
            disabled={isRunning}
            loading={isRunning}
            icon={<Play className="w-4 h-4 fill-current" />}
          >
            {isRunning ? 'Executing Steps...' : '▶ Simulate Workflow'}
          </Button>
        </div>
      </div>

      {/* Main Simulation Viewport: Timeline (Left) + Payload Inspector (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Step-by-Step Timeline */}
        <div className="lg:col-span-7 glass-card rounded-xl p-5 border border-white/[0.08]">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/[0.06]">
            <span className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
              Execution Timeline
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              5 Planned Steps
            </span>
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2.75 before:top-3 before:bottom-3 before:w-0.5 before:bg-white/[0.08]">
            {steps.map((step) => {
              const isSelected = selectedStep.id === step.id;

              return (
                <div
                  key={step.id}
                  onClick={() => setSelectedStep(step)}
                  className={`relative flex items-start gap-4 p-3 rounded-lg cursor-pointer transition-all duration-150 ${
                    isSelected
                      ? 'bg-indigo-600/15 border border-indigo-500/40 shadow-sm'
                      : 'hover:bg-white/[0.03] border border-transparent'
                  }`}
                >
                  {/* Step Node Marker */}
                  <div
                    className={`absolute -left-6 top-3.5 w-6 h-6 rounded-full border-2 bg-[#090b10] flex items-center justify-center -translate-x-1/2 transition-colors ${
                      step.status === 'completed'
                        ? 'border-emerald-500 text-emerald-400 shadow-xs shadow-emerald-500/30'
                        : step.status === 'running'
                        ? 'border-indigo-500 text-indigo-400 ring-4 ring-indigo-500/20'
                        : 'border-white/20 text-slate-400'
                    }`}
                  >
                    {getStepIcon(step)}
                  </div>

                  {/* Step Info */}
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className="text-xs font-semibold text-white tracking-tight">
                        {step.label}
                      </span>
                      {step.timeMs > 0 && (
                        <span className="text-[10px] font-mono text-slate-400">
                          +{step.timeMs}ms
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed truncate">
                      {step.sublabel}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Realtime Step Payload Inspector */}
        <div className="lg:col-span-5 glass-card rounded-xl p-5 border border-white/[0.08] flex flex-col justify-between bg-[#0b0e17]">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-semibold text-white font-mono">
                  Step Payload & Output
                </span>
              </div>
              <span className="text-[10px] font-mono text-indigo-300 uppercase px-1.5 py-0.5 rounded bg-indigo-500/10">
                Step {selectedStep.id}
              </span>
            </div>

            <div className="mb-3">
              <span className="text-xs font-medium text-slate-300 block mb-1">
                {selectedStep.label}
              </span>
              <p className="text-[11px] text-slate-400 leading-normal">
                {selectedStep.sublabel}
              </p>
            </div>

            {/* JSON Code block */}
            <div className="rounded-lg bg-[#07090f] border border-white/10 p-3.5 font-mono text-xs text-indigo-200 overflow-x-auto shadow-inner">
              <pre className="text-[11px] leading-relaxed">
                {JSON.stringify(JSON.parse(selectedStep.payload), null, 2)}
              </pre>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Status: <strong className="text-slate-200 uppercase">{selectedStep.status}</strong></span>
            <span>Target: <strong className="text-slate-200 capitalize">{selectedStep.type}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
