import React, { useState, useEffect } from 'react';
import {
  Server,
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import {
  checkRenderStatus,
  executeRenderWorkflow,
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
  | 'unconfigured';

interface RenderExecutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  workflowId: string;
  workflowName: string;
  simulationContext: Record<string, any>;
}

export const RenderExecutionModal: React.FC<RenderExecutionModalProps> = ({
  isOpen,
  onClose,
  workflowId,
  workflowName,
  simulationContext,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [engineState, setEngineState] = useState<ExecutionEngineState>('ready');
  const [renderStatus, setRenderStatus] = useState<RenderStatusInfo | null>(null);
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [taskRunId, setTaskRunId] = useState<string | null>(null);
  const [durationMs, setDurationMs] = useState<number>(0);
  const [stages, setStages] = useState<RenderStageResult[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [expandedStageIndex, setExpandedStageIndex] = useState<number | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  // Check Render server configuration whenever modal opens
  useEffect(() => {
    let isMounted = true;
    if (isOpen) {
      checkRenderStatus()
        .then((status) => {
          if (!isMounted) return;
          setRenderStatus(status);
          if (!status.configured) {
            setEngineState('unconfigured');
            setErrorMessage(
              status.message || 'Render execution is not configured. Please set RENDER_API_KEY in server environment.'
            );
          } else {
            setEngineState('ready');
            setErrorMessage(null);
          }
        })
        .catch((err) => {
          if (!isMounted) return;
          setEngineState('unconfigured');
          setErrorMessage(err?.message || 'Render execution is not configured.');
        });

      // Reset state for new execution run
      setStages([]);
      setExecutionId(null);
      setTaskRunId(null);
      setDurationMs(0);
      setErrorMessage(null);
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  const handleExecute = async () => {
    setIsExecuting(true);
    setEngineState('connecting');
    setErrorMessage(null);

    // Transition: connecting -> queued
    const timer = setTimeout(() => {
      setEngineState('queued');
    }, 400);

    try {
      const res = await executeRenderWorkflow({
        workflowId,
        workflowName,
        context: simulationContext,
        userId: user?.id,
        approved: true,
      });

      clearTimeout(timer);
      setIsExecuting(false);

      // If server reports Render is not configured, enter honest unconfigured state
      if (!res.configured || res.code === 'RENDER_NOT_CONFIGURED') {
        setEngineState('unconfigured');
        const errText =
          res.error || 'Render execution is not configured. Please set RENDER_API_KEY in server environment.';
        setErrorMessage(errText);
        showToast('Render execution is not configured.', 'warning');
        return;
      }

      if (!res.success || res.status === 'FAILED') {
        setEngineState('failed');
        setErrorMessage(res.error || 'Render Workflow stage execution failed.');
        setExecutionId(res.executionId || null);
        setTaskRunId(res.renderTaskRunId || null);
        if (res.stages) setStages(res.stages);
        showToast('Render Workflow execution failed.', 'error');
        return;
      }

      // Success transition
      setEngineState('succeeded');
      setExecutionId(res.executionId || null);
      setTaskRunId(res.renderTaskRunId || null);
      setDurationMs(res.durationMs || 0);
      setStages(res.stages || []);
      showToast('Workflow executed successfully on Render Workflows!', 'success');

      // Persist real execution record in Supabase
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
            Connecting to Render...
          </span>
        );
      case 'queued':
        return (
          <span className="px-2.5 py-1 rounded text-xs font-mono font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/20">
            Queued in Render Engine
          </span>
        );
      case 'running':
        return (
          <span className="px-2.5 py-1 rounded text-xs font-mono font-semibold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20">
            Executing Stages...
          </span>
        );
      case 'waiting_approval':
        return (
          <span className="px-2.5 py-1 rounded text-xs font-mono font-semibold text-amber-400 bg-amber-500/15 border border-amber-500/30">
            Waiting for Approval
          </span>
        );
      case 'succeeded':
        return (
          <span className="px-2.5 py-1 rounded text-xs font-mono font-semibold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> SUCCEEDED (Render Workflows)
          </span>
        );
      case 'failed':
        return (
          <span className="px-2.5 py-1 rounded text-xs font-mono font-semibold text-rose-300 bg-rose-500/15 border border-rose-500/30 flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" /> FAILED
          </span>
        );
      case 'unconfigured':
        return (
          <span className="px-2.5 py-1 rounded text-xs font-mono font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/20">
            Render Not Configured
          </span>
        );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Execute on Render Workflows"
      subtitle={`Triggering durable production workflow: "${workflowName}"`}
      maxWidth="xl"
    >
      <div className="space-y-5">
        {/* Engine Banner & Status Strip */}
        <div className="p-4 rounded-xl bg-[#090d16] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">Render Workflows Engine</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/[0.06] text-slate-400">
                  @renderinc/sdk
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Target Slug: <code className="text-indigo-300 font-mono">{renderStatus?.workflowSlug || 'flowmind-workflows'}</code>
              </p>
            </div>
          </div>
          <div>{getStatusBadge()}</div>
        </div>

        {/* Unconfigured Warning Banner (Requirement 13: Demo Mode Fallback) */}
        {engineState === 'unconfigured' && (
          <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs text-amber-200 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-amber-300">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{errorMessage || 'Render execution is not configured.'}</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              The application detected that real Render platform credentials have not yet been provided on the server.
              To execute this workflow on Render:
            </p>
            <ol className="list-decimal pl-5 space-y-1 text-[11px] text-slate-300 font-mono">
              <li>Open your server environment (<code className="text-amber-300">.env</code>)</li>
              <li>Set <code className="text-amber-300">RENDER_API_KEY=rnd_your_key_here</code></li>
              <li>Set <code className="text-amber-300">RENDER_WORKFLOW_SLUG=flowmind-workflows</code></li>
              <li>Restart your server or dev environment</li>
            </ol>
            <p className="text-[10px] text-slate-400 pt-1">
              Refer to <strong className="text-slate-200">RENDER_WORKFLOW_SETUP.md</strong> for step-by-step instructions.
            </p>
          </div>
        )}

        {/* Error Callout */}
        {errorMessage && engineState === 'failed' && (
          <div className="p-4 rounded-xl bg-rose-950/25 border border-rose-500/30 text-xs text-rose-200 flex items-start gap-2.5">
            <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-rose-300">Execution Encountered an Issue</div>
              <p className="text-[11px] text-rose-200/90 mt-1 font-mono">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Context Payload Preview */}
        <div className="p-3 rounded-lg bg-black/40 border border-white/5 text-xs font-mono">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="uppercase text-[10px] tracking-wider">Dispatched Payload Context</span>
            <span className="text-[10px] text-indigo-400">Customer Complaint Pipeline</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
            <div>
              <span className="text-slate-500 block text-[10px]">Customer</span>
              <span className="text-slate-200 font-semibold">{simulationContext.customerId || 'CUS-1042'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Priority</span>
              <span className="text-amber-300 font-semibold">{simulationContext.priority || 'HIGH'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Tier</span>
              <span className="text-slate-200">{simulationContext.customerTier || 'Enterprise'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Category</span>
              <span className="text-slate-300 truncate block">{simulationContext.category || 'Billing & Support'}</span>
            </div>
          </div>
        </div>

        {/* Stages Telemetry Trace (when executing or completed) */}
        {stages.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
                Render Workflow Stages ({stages.length})
              </span>
              {(taskRunId || executionId) && (
                <span className="text-[10px] font-mono text-slate-400">
                  Run ID: <span className="text-indigo-300">{taskRunId || executionId}</span>
                </span>
              )}
            </div>

            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {stages.map((st, idx) => {
                const isExpanded = expandedStageIndex === idx;
                const isSuccess = st.status === 'SUCCEEDED';
                const isSkipped = st.status === 'SKIPPED';

                return (
                  <div
                    key={st.id || idx}
                    className={`rounded-lg border text-xs transition-colors ${
                      isSuccess
                        ? 'bg-[#0d131f] border-emerald-500/20'
                        : isSkipped
                        ? 'bg-[#0a0d14] border-white/5 text-slate-500'
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
                            Bypassed (Priority != HIGH)
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-slate-400">
                          {st.durationMs > 0 ? `${st.durationMs}ms` : '0ms'}
                        </span>
                        {isSuccess && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </div>
                    </div>

                    {isExpanded && st.output && (
                      <div className="p-2.5 pt-0 border-t border-white/5 font-mono text-[10px] text-slate-300">
                        <pre className="bg-black/50 p-2 rounded overflow-x-auto text-[10px] text-slate-300 max-h-32">
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

        {/* Actions Footer */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-4 border-t border-white/[0.08]">
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
            <Button variant="outline" size="sm" onClick={onClose} disabled={isExecuting}>
              Close
            </Button>

            <Button
              variant="primary"
              size="md"
              onClick={handleExecute}
              loading={isExecuting}
              disabled={isExecuting || engineState === 'unconfigured'}
              icon={<Play className="w-4 h-4 fill-current" />}
            >
              {isExecuting
                ? 'Executing on Render...'
                : engineState === 'unconfigured'
                ? 'Render Not Configured'
                : 'Launch Render Workflow'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
