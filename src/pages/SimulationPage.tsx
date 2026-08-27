import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import { SimulationHeader } from '../components/simulation/SimulationHeader';
import { ExecutionSummaryBar } from '../components/simulation/ExecutionSummaryBar';
import { SimulationContextPanel } from '../components/simulation/SimulationContextPanel';
import { ExecutionTimelineList } from '../components/simulation/ExecutionTimelineList';
import { StepPayloadInspector } from '../components/simulation/StepPayloadInspector';
import { HumanApprovalCard } from '../components/simulation/HumanApprovalCard';
import { SimulationInsightsCard } from '../components/simulation/SimulationInsightsCard';
import {
  buildSimulationPlan,
  computeSimulationAnalytics,
  DEFAULT_SIMULATION_CONTEXT,
} from '../services/simulationService';
import type {
  SimulationContext,
  SimulatedStep,
  SimulationOverallStatus,
} from '../services/simulationService';
import { useWorkflow } from '../context/WorkflowContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/common/Button';

export const SimulationPage: React.FC = () => {
  const { activeWorkflow } = useWorkflow();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [context, setContext] = useState<SimulationContext>(DEFAULT_SIMULATION_CONTEXT);
  const [overallStatus, setOverallStatus] = useState<SimulationOverallStatus>('ready');
  const [steps, setSteps] = useState<SimulatedStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [elapsedDurationMs, setElapsedDurationMs] = useState<number>(0);

  const isRunningRef = useRef(false);
  const timerRef = useRef<any>(null);

  // Initialize or re-plan steps whenever activeWorkflow or context changes (if not running)
  useEffect(() => {
    if (activeWorkflow && overallStatus === 'ready') {
      const planned = buildSimulationPlan(activeWorkflow, context);
      setSteps(planned);
      if (planned.length > 0) {
        setSelectedStepId(planned[0].id);
      }
    }
  }, [activeWorkflow, context, overallStatus]);

  const analytics = useMemo(() => {
    return computeSimulationAnalytics(steps);
  }, [steps]);

  const handleUpdateContext = (updates: Partial<SimulationContext>) => {
    setContext((prev) => ({ ...prev, ...updates }));
    showToast('Simulation test context updated.', 'info');
  };

  const handleReset = () => {
    isRunningRef.current = false;
    if (timerRef.current) clearTimeout(timerRef.current);

    setOverallStatus('ready');
    setCurrentStepIndex(0);
    setElapsedDurationMs(0);

    if (activeWorkflow) {
      const planned = buildSimulationPlan(activeWorkflow, context);
      setSteps(planned);
      if (planned.length > 0) setSelectedStepId(planned[0].id);
    }
    showToast('Simulation runtime reset.', 'info');
  };

  const executeStepSequence = (startIndex: number) => {
    isRunningRef.current = true;
    setOverallStatus('running');

    let idx = startIndex;

    const runStep = () => {
      if (!isRunningRef.current) return;

      if (idx >= steps.length) {
        setOverallStatus('completed');
        isRunningRef.current = false;
        showToast('Simulation completed successfully in safe sandbox.', 'success');
        return;
      }

      const step = steps[idx];

      // If this step is skipped due to condition branch, advance immediately
      if (step.status === 'skipped') {
        idx += 1;
        runStep();
        return;
      }

      setCurrentStepIndex(idx);
      setSelectedStepId(step.id);

      // Set current step to running
      setSteps((prev) =>
        prev.map((s, i) => (i === idx ? { ...s, status: 'running' } : s))
      );

      const latency = step.durationMs + 200;
      setElapsedDurationMs((prev) => prev + latency);

      timerRef.current = setTimeout(() => {
        if (!isRunningRef.current) return;

        // Check if this step is Human Approval
        if (step.nodeType === 'approval') {
          setSteps((prev) =>
            prev.map((s, i) => (i === idx ? { ...s, status: 'running' } : s))
          );
          setOverallStatus('waiting_approval');
          isRunningRef.current = false;
          showToast('Simulation paused at Human Approval checkpoint.', 'info');
          return;
        }

        // Mark current step as success
        setSteps((prev) =>
          prev.map((s, i) => (i === idx ? { ...s, status: 'success' } : s))
        );

        idx += 1;
        runStep();
      }, latency);
    };

    runStep();
  };

  const handleStartSimulation = () => {
    if (overallStatus === 'running' || steps.length === 0) return;
    showToast('Starting workflow step simulation...', 'info');
    handleReset();
    setTimeout(() => {
      executeStepSequence(0);
    }, 100);
  };

  const handleApprove = () => {
    showToast('Human Approval simulated as APPROVED.', 'success');
    // Mark approval step as success
    setSteps((prev) =>
      prev.map((s) => (s.nodeType === 'approval' ? { ...s, status: 'success' } : s))
    );

    // Resume execution from step after approval
    const approvalIdx = steps.findIndex((s) => s.nodeType === 'approval');
    if (approvalIdx !== -1) {
      executeStepSequence(approvalIdx + 1);
    }
  };

  const handleReject = () => {
    isRunningRef.current = false;
    setOverallStatus('rejected');
    setSteps((prev) =>
      prev.map((s) => (s.nodeType === 'approval' ? { ...s, status: 'error' } : s))
    );
    showToast('Simulation concluded: Human Approval was REJECTED.', 'warning');
  };

  const selectedStep = steps.find((s) => s.id === selectedStepId) || steps[0] || null;
  const durationFormatted = `${(elapsedDurationMs / 1000).toFixed(2)}s`;

  if (!activeWorkflow) {
    return (
      <div className="py-16 text-center animate-in fade-in duration-200">
        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto mb-4">
          <Sparkles className="w-7 h-7" />
        </div>
        <h3 className="text-base font-semibold text-white mb-1">
          No active workflow to simulate
        </h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6">
          Synthesize a workflow in AI Copilot first before launching the safe runtime simulator.
        </p>
        <Button
          variant="primary"
          size="md"
          onClick={() => navigate('/copilot')}
          icon={<Sparkles className="w-4 h-4" />}
        >
          Open AI Copilot
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Simulation Header */}
      <SimulationHeader
        workflowName={activeWorkflow.name}
        isRunning={overallStatus === 'running'}
        isCompleted={overallStatus === 'completed'}
        isWaitingApproval={overallStatus === 'waiting_approval'}
        onRunSimulation={handleStartSimulation}
        onReset={handleReset}
      />

      {/* 2. Execution Summary & Live Progress Bar */}
      <ExecutionSummaryBar
        status={overallStatus}
        steps={steps}
        currentStepIndex={currentStepIndex}
        durationText={durationFormatted}
      />

      {/* 3. Simulation Context Input Controls */}
      <SimulationContextPanel
        context={context}
        onUpdateContext={handleUpdateContext}
        disabled={overallStatus === 'running'}
      />

      {/* 4. Main 12-Column Split: Timeline (Left 7) + Step Payload Inspector (Right 5) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Timeline & Human Approval Interactivity */}
        <div className="lg:col-span-7 space-y-6">
          {/* Waiting for Human Approval Callout */}
          {overallStatus === 'waiting_approval' && (
            <HumanApprovalCard
              onApprove={handleApprove}
              onReject={handleReject}
              isProcessing={false}
            />
          )}

          {/* Completed Banner */}
          {overallStatus === 'completed' && (
            <div className="glass-card rounded-xl p-5 border border-emerald-500/30 bg-emerald-950/20 shadow-xl flex items-center justify-between gap-4 animate-in fade-in duration-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    ✓ Simulation Completed Successfully
                  </h4>
                  <p className="text-xs text-emerald-300/80 mt-0.5">
                    All steps verified in safe local sandbox. Ready for production deployment review.
                  </p>
                </div>
              </div>

              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/50 border border-emerald-500/30 px-2.5 py-1 rounded-md shrink-0">
                Exit Code 0
              </span>
            </div>
          )}

          {/* Sequential Timeline List */}
          <ExecutionTimelineList
            steps={steps}
            selectedStepId={selectedStepId}
            onSelectStep={setSelectedStepId}
          />
        </div>

        {/* Right Column: Step Payload Inspector & Latency Insights */}
        <div className="lg:col-span-5 space-y-6">
          <div className="h-[480px]">
            <StepPayloadInspector selectedStep={selectedStep} />
          </div>

          <SimulationInsightsCard analytics={analytics} />
        </div>
      </div>

      {/* Safety Notice Footer */}
      <div className="p-3.5 rounded-xl bg-[#090c14] border border-white/5 flex items-center justify-between text-xs text-slate-400 font-mono">
        <span className="flex items-center gap-2">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
          SIMULATION ENVIRONMENT: No external emails, Slack messages, or ticket databases modified.
        </span>
        <span className="text-emerald-400 font-semibold">100% Isolated Sandbox</span>
      </div>
    </div>
  );
};
