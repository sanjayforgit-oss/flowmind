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
import { supabase } from '../lib/supabase';

import { useAuth, type Department } from '../context/AuthContext';
import { createApprovalRequest, updateApprovalStatus } from '../services/approvalService';
import { SimulationApprovalRequestsCard } from '../components/dashboard/SimulationApprovalRequestsCard';

export const SimulationPage: React.FC = () => {
  const { activeWorkflow, recordWorkflowAudit } = useWorkflow();
  const { user, profile, canApproveCheckpoint } = useAuth();
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
  const stepsRef = useRef<SimulatedStep[]>([]);

  // Keep live ref in sync with latest steps array
  stepsRef.current = steps;

  // Initialize or re-plan steps whenever activeWorkflow or context changes (if not running)
  useEffect(() => {
    if (activeWorkflow && overallStatus === 'ready') {
      const planned = buildSimulationPlan(activeWorkflow, context);
      setSteps(planned);
      stepsRef.current = planned;
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
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    setOverallStatus('ready');
    setCurrentStepIndex(0);
    setElapsedDurationMs(0);

    if (activeWorkflow) {
      const planned = buildSimulationPlan(activeWorkflow, context);
      setSteps(planned);
      stepsRef.current = planned;
      if (planned.length > 0) setSelectedStepId(planned[0].id);
    }
    showToast('Simulation runtime reset.', 'info');
  };

  const persistExecutionRecord = async (completedSteps: SimulatedStep[]) => {
    try {
      const {
        data: { user: currentUser },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !currentUser) {
        console.warn(
          '[SIMULATION EXECUTION] User unauthenticated or could not get user from supabase.auth.getUser():',
          userError
        );
        return;
      }

      const executionRecord = {
        id: `exec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        workflow_id: activeWorkflow?.id || null,
        user_id: currentUser.id,
        status: 'SUCCESS',
        execution_data: {
          total_steps: completedSteps.length,
          simulation_mode: true,
          status: 'SUCCESS',
          workflow_name: activeWorkflow?.name || 'Simulation Workflow',
          steps: completedSteps.map((s) => ({
            id: s.id,
            stepNumber: s.stepNumber,
            title: s.title,
            status: s.status,
            nodeType: s.nodeType,
            durationMs: s.durationMs,
          })),
          context_priority: context.priority,
          elapsed_duration_ms: elapsedDurationMs,
        },
        duration_ms: elapsedDurationMs,
        started_at: new Date(Date.now() - elapsedDurationMs).toISOString(),
        completed_at: new Date().toISOString(),
      };

      const { data, error: insertError } = await supabase
        .from('workflow_executions')
        .insert(executionRecord)
        .select();

      if (insertError) {
        // If error was due to foreign key constraint on workflow_id, retry with null workflow_id
        if (insertError.message?.includes('foreign key') || insertError.code === '23503') {
          const fallbackRecord = { ...executionRecord, workflow_id: null };
          const { data: fbData, error: fbError } = await supabase
            .from('workflow_executions')
            .insert(fallbackRecord)
            .select();

          if (fbError) {
            console.error(
              '[SIMULATION EXECUTION ERROR] Failed to insert workflow execution record into Supabase:',
              fbError
            );
          } else {
            console.log(
              '[SIMULATION EXECUTION SUCCESS] Successfully written record to workflow_executions in Supabase (unlinked workflow):',
              fbData
            );
          }
        } else {
          console.error(
            '[SIMULATION EXECUTION ERROR] Failed to insert workflow execution record into Supabase:',
            insertError
          );
        }
      } else {
        console.log(
          '[SIMULATION EXECUTION SUCCESS] Successfully written record to workflow_executions in Supabase:',
          data
        );
      }
    } catch (err) {
      console.error(
        '[SIMULATION EXECUTION ERROR] Unexpected exception while writing workflow_executions:',
        err
      );
    }
  };

  const executeStepSequence = (startIndex: number) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    isRunningRef.current = true;
    setOverallStatus('running');

    let idx = startIndex;

    const runNextStep = () => {
      if (!isRunningRef.current) return;

      const currentSteps = stepsRef.current;

      // Completion check: all steps finished
      if (idx >= currentSteps.length) {
        // Ensure all executed non-skipped steps are marked as SUCCESS
        const finalSteps = currentSteps.map((s) =>
          s.status === 'skipped' ? s : { ...s, status: 'success' as const }
        );
        setSteps(finalSteps);
        setOverallStatus('completed');
        isRunningRef.current = false;
        showToast('Simulation completed successfully in safe sandbox.', 'success');

        // Persist execution record to Supabase
        persistExecutionRecord(finalSteps);

        if (activeWorkflow) {
          recordWorkflowAudit(
            'workflow_executed',
            `Dry-run simulation of "${activeWorkflow.name}" executed successfully with all ${currentSteps.length} steps.`,
            { totalSteps: currentSteps.length, priorityContext: context.priority }
          );
        }
        return;
      }

      const step = currentSteps[idx];

      // If this step is skipped due to condition branch, advance immediately
      if (step.status === 'skipped') {
        idx += 1;
        runNextStep();
        return;
      }

      setCurrentStepIndex(idx);
      setSelectedStepId(step.id);

      // Transition current step to RUNNING (and mark previous active steps as SUCCESS)
      setSteps((prev) =>
        prev.map((s, i) => {
          if (i < idx && s.status !== 'skipped') return { ...s, status: 'success' };
          if (i === idx) return { ...s, status: 'running' };
          return s;
        })
      );

      const latency = Math.max(step.durationMs || 350, 300);
      setElapsedDurationMs((prev) => prev + latency);

      timerRef.current = setTimeout(() => {
        if (!isRunningRef.current) return;

        // Check if this step is Human Approval Checkpoint
        if (step.nodeType === 'approval') {
          setOverallStatus('waiting_approval');
          isRunningRef.current = false;
          showToast('Simulation paused at Human Approval checkpoint.', 'info');
          return;
        }

        // Mark current step as SUCCESS
        setSteps((prev) =>
          prev.map((s, i) => (i === idx ? { ...s, status: 'success' } : s))
        );

        // Advance to next step (e.g. step 03, step 04)
        idx += 1;
        runNextStep();
      }, latency);
    };

    runNextStep();
  };

  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null);

  const handleStartSimulation = async () => {
    if (overallStatus === 'running' || steps.length === 0) return;
    showToast('Starting workflow step simulation...', 'info');

    // Create persistent approval request if workflow has human approval node
    const hasApprovalNode = steps.some((s) => s.nodeType === 'approval');
    if (hasApprovalNode && activeWorkflow) {
      const created = await createApprovalRequest({
        workflowName: activeWorkflow.name || 'Automated Workflow',
        employeeName: profile?.fullName || user?.email?.split('@')[0] || 'Mohanraj',
        department: (activeWorkflow.category as Department) || profile?.department || 'HR',
        userId: user?.id,
        details: {
          workflowId: activeWorkflow.id,
          totalSteps: steps.length,
          confidence: activeWorkflow.confidence,
        },
      });
      if (created) {
        setCurrentRequestId(created.id);
      }
    }

    handleReset();
    setTimeout(() => {
      executeStepSequence(0);
    }, 150);
  };

  const handleApprove = async () => {
    showToast('Human Approval simulated as APPROVED.', 'success');

    if (currentRequestId && activeWorkflow) {
      await updateApprovalStatus({
        requestId: currentRequestId,
        newStatus: 'accepted',
        workflowName: activeWorkflow.name,
        approverId: user?.id || 'admin',
        approverName: profile?.fullName || user?.email?.split('@')[0] || 'Manager',
        approverRole: profile?.role || 'user',
        approverDepartment: profile?.department,
      });
    }

    const currentSteps = stepsRef.current;
    const approvalIdx = currentSteps.findIndex((s) => s.nodeType === 'approval');

    // Mark the approval step (and any previous steps) as SUCCESS immediately
    const updatedSteps = currentSteps.map((s, i) => {
      if (s.nodeType === 'approval' || (approvalIdx !== -1 && i <= approvalIdx)) {
        return s.status !== 'skipped' ? { ...s, status: 'success' as const } : s;
      }
      return s;
    });

    setSteps(updatedSteps);

    // Automatically propagate execution state down to remaining steps (03, 04, etc.)
    if (approvalIdx !== -1 && approvalIdx + 1 < currentSteps.length) {
      setTimeout(() => {
        executeStepSequence(approvalIdx + 1);
      }, 200);
    } else {
      setOverallStatus('completed');
      persistExecutionRecord(updatedSteps);
      showToast('All workflow steps completed successfully.', 'success');
    }
  };

  const handleReject = async () => {
    isRunningRef.current = false;
    if (timerRef.current) clearTimeout(timerRef.current);
    setOverallStatus('rejected');

    if (currentRequestId && activeWorkflow) {
      await updateApprovalStatus({
        requestId: currentRequestId,
        newStatus: 'rejected',
        workflowName: activeWorkflow.name,
        approverId: user?.id || 'admin',
        approverName: profile?.fullName || user?.email?.split('@')[0] || 'Manager',
        approverRole: profile?.role || 'user',
        approverDepartment: profile?.department,
      });
    }

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
              canApprove={canApproveCheckpoint('Management / Support')}
              userRole={profile?.role || 'user'}
              userDepartment={profile?.department}
              requiredDepartment="Management / Support"
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
                    All {steps.length} steps verified in safe local sandbox. Execution propagated to completion with 0 errors.
                  </p>
                </div>
              </div>

              <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/50 border border-emerald-500/30 px-2.5 py-1 rounded-md shrink-0">
                100% SUCCESS
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

      {/* Simulation Approval Queue & Requests */}
      <SimulationApprovalRequestsCard />

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
