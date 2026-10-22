import React, { useState, useEffect, useCallback } from 'react';
import {
  Server,
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Code2,
  Copy,
  Check,
  Cpu,
  Layers,
  PauseCircle,
  ThumbsUp,
  ThumbsDown,
  ShieldCheck,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import {
  checkRenderStatus,
  executeRenderWorkflow,
  approveRenderWorkflow,
  generateRenderWorkflowCode,
  persistRenderExecutionToSupabase,
  type RenderStageResult,
  type RenderStatusInfo,
} from '../../services/renderWorkflowService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useNavigate } from 'react-router-dom';

export type ExecutionEngineState =
  | 'ready'
  | 'connecting'
  | 'queued'
  | 'running'
  | 'waiting_approval'
  | 'succeeded'
  | 'failed'
  | 'rejected'
  | 'unconfigured';

interface RenderExecutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  workflowId: string;
  workflowName: string;
  workflowData?: any;
  simulationContext: Record<string, any>;
}

export const RenderExecutionModal: React.FC<RenderExecutionModalProps> = ({
  isOpen,
  onClose,
  workflowId,
  workflowName,
  workflowData,
  simulationContext,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'timeline' | 'code' | 'tasks'>('timeline');
  const [engineState, setEngineState] = useState<ExecutionEngineState>('ready');
  const [renderStatus, setRenderStatus] = useState<RenderStatusInfo | null>(null);
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [taskRunId, setTaskRunId] = useState<string | null>(null);
  const [durationMs, setDurationMs] = useState<number>(0);
  const [stages, setStages] = useState<RenderStageResult[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [expandedStageIndex, setExpandedStageIndex] = useState<number | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [selectedEngineMode, setSelectedEngineMode] = useState<'auto' | 'cloud' | 'local'>('auto');
  const [pauseAtApproval, setPauseAtApproval] = useState<boolean>(false);

  // Render Workflows Code state
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [isCodeLoading, setIsCodeLoading] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Approval interaction state
  const [approvalComment, setApprovalComment] = useState<string>('');
  const [isApproving, setIsApproving] = useState<boolean>(false);

  // Fetch status on open
  useEffect(() => {
    let isMounted = true;
    if (isOpen) {
      checkRenderStatus()
        .then((status) => {
          if (!isMounted) return;
          setRenderStatus(status);
          setEngineState('ready');
          setErrorMessage(null);
        })
        .catch(() => {
          if (!isMounted) return;
          setRenderStatus({
            configured: true,
            cloudConfigured: false,
            localEngineAvailable: true,
            workflowSlug: 'flowmind-workflows',
            tasksUrl: null,
            mode: 'local-sdk-engine',
          });
          setEngineState('ready');
        });

      // Reset state for new execution run
      setStages([]);
      setExecutionId(null);
      setTaskRunId(null);
      setDurationMs(0);
      setErrorMessage(null);
      setApprovalComment('');
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Load generated code when code tab is selected
  const loadCode = useCallback(async () => {
    setIsCodeLoading(true);
    const targetWf = workflowData || {
      id: workflowId,
      name: workflowName,
      nodes: [
        { id: 'trg-1', title: 'Customer Complaint Trigger', type: 'trigger' },
        { id: 'act-1', title: 'Analyze Priority', type: 'action' },
        { id: 'cnd-1', title: 'Check Priority HIGH', type: 'condition' },
        { id: 'act-2', title: 'Notify Escalation Lead', type: 'action' },
        { id: 'act-3', title: 'Create Support Ticket', type: 'action' },
        { id: 'act-4', title: 'Draft Customer Response', type: 'action' },
        { id: 'app-1', title: 'Manager Sign-off Gate', type: 'approval' },
        { id: 'act-5', title: 'Complete Automation', type: 'action' },
      ],
    };

    const res = await generateRenderWorkflowCode(targetWf);
    if (res.success && res.code) {
      setGeneratedCode(res.code);
    } else {
      setGeneratedCode(`// Failed to compile Render Workflows code: ${res.error || 'Unknown error'}`);
    }
    setIsCodeLoading(false);
  }, [workflowData, workflowId, workflowName]);

  useEffect(() => {
    if (activeTab === 'code' && !generatedCode) {
      loadCode();
    }
  }, [activeTab, generatedCode, loadCode]);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(generatedCode);
      setCopiedCode(true);
      showToast('Render Workflows code copied to clipboard!', 'success');
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      showToast('Failed to copy code to clipboard', 'error');
    }
  };

  const handleExecute = async () => {
    setIsExecuting(true);
    setEngineState('connecting');
    setErrorMessage(null);

    const timer = setTimeout(() => {
      setEngineState('queued');
    }, 350);

    try {
      const res = await executeRenderWorkflow({
        workflowId,
        workflowName,
        context: simulationContext,
        workflowData: workflowData || null,
        userId: user?.id,
        approved: true,
        preferMode: selectedEngineMode,
        pauseAtApproval,
      });

      clearTimeout(timer);
      setIsExecuting(false);

      if (res.status === 'WAITING_FOR_APPROVAL') {
        setEngineState('waiting_approval');
        setExecutionId(res.executionId || null);
        setTaskRunId(res.renderTaskRunId || null);
        setDurationMs(res.durationMs || 0);
        if (res.stages) setStages(res.stages);
        showToast('Workflow paused at Human Approval checkpoint!', 'info');
        return;
      }

      if (!res.success || res.status === 'FAILED' || res.status === 'REJECTED') {
        setEngineState(res.status === 'REJECTED' ? 'rejected' : 'failed');
        setErrorMessage(res.error || 'Render Workflow stage execution failed.');
        setExecutionId(res.executionId || null);
        setTaskRunId(res.renderTaskRunId || null);
        if (res.stages) setStages(res.stages);
        showToast(res.error || 'Render Workflow execution stopped.', 'error');
        return;
      }

      // Success
      setEngineState('succeeded');
      setExecutionId(res.executionId || null);
      setTaskRunId(res.renderTaskRunId || null);
      setDurationMs(res.durationMs || 0);
      setStages(res.stages || []);
      showToast('Workflow executed successfully on Render Workflows!', 'success');

      // Persist to Supabase
      if (res.executionId) {
        await persistRenderExecutionToSupabase({
          executionId: res.executionId,
          workflowId,
          userId: user?.id,
          workflowName,
          status: 'SUCCEEDED',
          durationMs: res.durationMs || 0,
          startedAt: res.startedAt || new Date().toISOString(),
          completedAt: res.completedAt || new Date().toISOString(),
          stages: res.stages || [],
          renderTaskRunId: res.renderTaskRunId,
          context: simulationContext,
          engineMode: res.engineMode || selectedEngineMode,
        });
      }
    } catch (err: any) {
      clearTimeout(timer);
      setIsExecuting(false);
      setEngineState('failed');
      setErrorMessage(err?.message || 'Unexpected network failure contacting Render server.');
      showToast('Render execution error', 'error');
    }
  };

  const handleApprovalDecision = async (approved: boolean) => {
    if (!executionId) return;
    setIsApproving(true);
    try {
      const res = await approveRenderWorkflow({
        executionId,
        approved,
        approverRole: 'Operations Manager',
        approverName: user?.email || 'Authorized Manager',
        comments: approvalComment || (approved ? 'Approved by operator' : 'Rejected by operator'),
      });

      setIsApproving(false);
      if (res.success && res.status === 'SUCCEEDED') {
        setEngineState('succeeded');
        setDurationMs(res.durationMs || durationMs);
        if (res.stages) setStages(res.stages);
        showToast(approved ? 'Workflow approved and completed on Render!' : 'Workflow rejection processed.', 'success');

        // Update in Supabase
        await persistRenderExecutionToSupabase({
          executionId,
          workflowId,
          userId: user?.id,
          workflowName,
          status: 'SUCCEEDED',
          durationMs: res.durationMs || durationMs,
          startedAt: res.startedAt || new Date().toISOString(),
          completedAt: res.completedAt || new Date().toISOString(),
          stages: res.stages || stages,
          renderTaskRunId: taskRunId || executionId,
          context: simulationContext,
          engineMode: selectedEngineMode,
        });
      } else {
        setEngineState('rejected');
        setErrorMessage(res.error || 'Workflow rejected at approval gate.');
        if (res.stages) setStages(res.stages);
        showToast('Workflow rejected.', 'warning');
      }
    } catch (err: any) {
      setIsApproving(false);
      showToast(err?.message || 'Failed to submit approval', 'error');
    }
  };

  const getStatusBadge = () => {
    switch (engineState) {
      case 'ready':
        return (
          <span className="px-2.5 py-1 rounded text-xs font-mono font-semibold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20">
            Ready to Execute
          </span>
        );
      case 'connecting':
        return (
          <span className="px-2.5 py-1 rounded text-xs font-mono font-semibold text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 animate-pulse">
            Connecting...
          </span>
        );
      case 'queued':
        return (
          <span className="px-2.5 py-1 rounded text-xs font-mono font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/20">
            Queued in Render
          </span>
        );
      case 'running':
        return (
          <span className="px-2.5 py-1 rounded text-xs font-mono font-semibold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 animate-pulse">
            Executing Tasks...
          </span>
        );
      case 'waiting_approval':
        return (
          <span className="px-2.5 py-1 rounded text-xs font-mono font-semibold text-amber-300 bg-amber-500/20 border border-amber-500/30 flex items-center gap-1.5 animate-pulse">
            <PauseCircle className="w-3.5 h-3.5" /> Waiting for Human Approval
          </span>
        );
      case 'succeeded':
        return (
          <span className="px-2.5 py-1 rounded text-xs font-mono font-semibold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> SUCCEEDED
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2.5 py-1 rounded text-xs font-mono font-semibold text-amber-300 bg-amber-500/15 border border-amber-500/30 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> REJECTED AT CHECKPOINT
          </span>
        );
      case 'failed':
        return (
          <span className="px-2.5 py-1 rounded text-xs font-mono font-semibold text-rose-300 bg-rose-500/15 border border-rose-500/30 flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" /> FAILED
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Render Workflows Orchestration Hub"
      subtitle={`Durable cloud workflow orchestration for: "${workflowName}"`}
      maxWidth="2xl"
    >
      <div className="space-y-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 border-b border-white/10 pb-2">
          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors ${
              activeTab === 'timeline'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Live Execution
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors ${
              activeTab === 'code'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            Render Workflows Code
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors ${
              activeTab === 'tasks'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            Engine & Tasks Catalog
          </button>
        </div>

        {/* Tab 1: Live Execution */}
        {activeTab === 'timeline' && (
          <div className="space-y-4">
            {/* Header Status Strip */}
            <div className="p-3.5 rounded-xl bg-[#090d16] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                  <Server className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">Render Workflows</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      @renderinc/sdk/workflows
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Target: <code className="text-indigo-300 font-mono">{renderStatus?.workflowSlug || 'flowmind-workflows'}</code>
                  </p>
                </div>
              </div>
              <div>{getStatusBadge()}</div>
            </div>

            {/* Controls: Engine Mode & HITL Checkbox */}
            <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-medium">Engine Mode:</span>
                <select
                  value={selectedEngineMode}
                  onChange={(e) => setSelectedEngineMode(e.target.value as any)}
                  disabled={isExecuting}
                  className="bg-[#0f1422] border border-white/10 rounded px-2.5 py-1 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value="auto">Auto (Smart Cloud / SDK Engine)</option>
                  <option value="local">Render Local SDK Engine</option>
                  <option value="cloud" disabled={!renderStatus?.cloudConfigured}>
                    Render Cloud API {renderStatus?.cloudConfigured ? '✓' : '(Requires RENDER_API_KEY)'}
                  </option>
                </select>
              </div>

              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pauseAtApproval}
                  onChange={(e) => setPauseAtApproval(e.target.checked)}
                  disabled={isExecuting}
                  className="rounded border-white/20 bg-black/40 text-indigo-600 focus:ring-0"
                />
                <span>Pause at Human Approval Checkpoint (HITL)</span>
              </label>
            </div>

            {/* Error Callout */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-950/25 border border-rose-500/30 text-xs text-rose-200 flex items-start gap-2.5">
                <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-rose-300">Execution Notice</div>
                  <p className="text-[11px] text-rose-200/90 mt-1 font-mono">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* HITL Approval Action Card */}
            {engineState === 'waiting_approval' && (
              <div className="p-4 rounded-xl bg-amber-950/25 border border-amber-500/40 space-y-3">
                <div className="flex items-center gap-2 text-amber-300 font-semibold text-xs">
                  <PauseCircle className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
                  <span>Human-in-the-Loop Management Checkpoint Required</span>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">
                  The Render workflow execution has durably paused. A human operator must review the synthesized response
                  and SLA classification before final disbursement.
                </p>
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">
                    Approval / Rejection Comments (optional):
                  </label>
                  <input
                    type="text"
                    value={approvalComment}
                    onChange={(e) => setApprovalComment(e.target.value)}
                    placeholder="e.g. Verified SLA deadline and customer priority. Approved for release."
                    className="w-full px-3 py-1.5 rounded-lg bg-black/50 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button
                    variant="danger"
                    size="sm"
                    loading={isApproving}
                    onClick={() => handleApprovalDecision(false)}
                    icon={<ThumbsDown className="w-3.5 h-3.5" />}
                  >
                    Reject
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    loading={isApproving}
                    onClick={() => handleApprovalDecision(true)}
                    icon={<ThumbsUp className="w-3.5 h-3.5" />}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white"
                  >
                    Approve & Resume Workflow
                  </Button>
                </div>
              </div>
            )}

            {/* Stages Telemetry Trace */}
            {stages.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
                    Render Workflow Stages ({stages.length})
                  </span>
                  {(taskRunId || executionId) && (
                    <span className="text-[10px] font-mono text-slate-400">
                      Task Run ID: <span className="text-indigo-300">{taskRunId || executionId}</span>
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                  {stages.map((st, idx) => {
                    const isExpanded = expandedStageIndex === idx;
                    const isSuccess = st.status === 'SUCCEEDED';
                    const isSkipped = st.status === 'SKIPPED';
                    const isRejected = st.status === 'REJECTED';

                    return (
                      <div
                        key={st.id || idx}
                        className={`rounded-lg border text-xs transition-colors ${
                          isSuccess
                            ? 'bg-[#0d131f] border-emerald-500/20'
                            : isSkipped
                            ? 'bg-[#0a0d14] border-white/5 text-slate-500'
                            : isRejected
                            ? 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                            : 'bg-rose-950/20 border-rose-500/30 text-rose-200'
                        }`}
                      >
                        <div
                          onClick={() => setExpandedStageIndex(isExpanded ? null : idx)}
                          className="p-2.5 flex items-center justify-between cursor-pointer hover:bg-white/[0.02]"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-4 h-4 rounded bg-white/[0.06] flex items-center justify-center font-mono text-[9px] text-slate-400">
                              {idx + 1}
                            </span>
                            <span className="font-semibold text-slate-200">{st.name}</span>
                            {isSkipped && (
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/5 text-slate-400">
                                Bypassed
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] text-slate-400">
                              {st.durationMs > 0 ? `${st.durationMs}ms` : '0ms'}
                            </span>
                            {isSuccess && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                            {isRejected && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                            )}
                          </div>
                        </div>

                        {isExpanded && st.output && (
                          <div className="p-2.5 pt-0 border-t border-white/5 font-mono text-[10px] text-slate-300">
                            <pre className="bg-black/50 p-2 rounded overflow-x-auto text-[10px] text-slate-300 max-h-36">
                              {JSON.stringify(st.output, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Execution Metadata Footer */}
            {engineState === 'succeeded' && (
              <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-emerald-300 font-medium">
                    Durable execution confirmed by Render Workflows.
                  </span>
                </div>
                <span className="font-mono text-xs text-emerald-400 font-semibold">
                  Latency: {(durationMs / 1000).toFixed(2)}s
                </span>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Render Workflows Code (AI Compiler) */}
        {activeTab === 'code' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
                  Compiled @renderinc/sdk/workflows Code
                </span>
                <p className="text-[11px] text-slate-400">
                  FLOWMIND AI compiles this visual graph directly into native, type-safe Render Workflows definitions.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyCode}
                icon={copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              >
                {copiedCode ? 'Copied!' : 'Copy Code'}
              </Button>
            </div>

            <div className="relative rounded-xl border border-white/10 bg-[#07090e] p-3 max-h-96 overflow-y-auto font-mono text-[11px] text-slate-300">
              {isCodeLoading ? (
                <div className="p-8 text-center text-slate-400 animate-pulse">
                  Compiling visual workflow to @renderinc/sdk/workflows...
                </div>
              ) : (
                <pre className="whitespace-pre overflow-x-auto leading-relaxed">{generatedCode}</pre>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Registered Tasks & Engine Info */}
        {activeTab === 'tasks' && (
          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-white font-semibold">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <span>Render Workflows Architecture</span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                Render Workflows executes code-defined tasks with automatic retries, checkpointing, and durable execution.
                FLOWMIND AI registers business tasks with Render and orchestrates them across cloud and local workers.
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
                Registered Task Pipelines
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1">
                  <div className="font-semibold text-white">Customer Complaint Pipeline</div>
                  <code className="text-[10px] text-indigo-300 font-mono block">customer_complaint_workflow</code>
                  <p className="text-[11px] text-slate-400">NLP Sentiment, Conditional Escalation, Zendesk Ticket, HITL Approval</p>
                </div>

                <div className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1">
                  <div className="font-semibold text-white">Invoice Anomaly & CFO Sign-Off</div>
                  <code className="text-[10px] text-indigo-300 font-mono block">invoice_approval_workflow</code>
                  <p className="text-[11px] text-slate-400">OCR Extraction, $5k Threshold Branching, CFO Gate, NetSuite ERP</p>
                </div>

                <div className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1">
                  <div className="font-semibold text-white">Employee Onboarding Pipeline</div>
                  <code className="text-[10px] text-indigo-300 font-mono block">employee_onboarding_workflow</code>
                  <p className="text-[11px] text-slate-400">Okta SSO Provisioning, Hardware Logistics, Manager 30-day Plan</p>
                </div>

                <div className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1">
                  <div className="font-semibold text-white">Dynamic FlowMind Graph Orchestrator</div>
                  <code className="text-[10px] text-indigo-300 font-mono block">dynamic_workflow_orchestrator</code>
                  <p className="text-[11px] text-slate-400">Executes any arbitrary visual graph nodes via Render task steps</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-3 border-t border-white/[0.08]">
          <div className="flex items-center gap-2">
            {engineState === 'succeeded' && (
              <Button
                variant="outline"
                size="sm"
                icon={<ExternalLink className="w-3.5 h-3.5" />}
                onClick={() => {
                  onClose();
                  navigate('/executions');
                }}
              >
                View in Execution Logs
              </Button>
            )}
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={onClose} disabled={isExecuting || isApproving}>
              Close
            </Button>

            <Button
              variant="primary"
              size="md"
              onClick={handleExecute}
              loading={isExecuting}
              disabled={isExecuting || isApproving}
              icon={<Play className="w-4 h-4 fill-current" />}
            >
              {isExecuting ? 'Executing on Render...' : 'Launch on Render'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
