/**
 * FLOWMIND AI — Render Workflows Client Service
 * Dispatches live workflow execution requests to the backend Render integration layer,
 * polls execution telemetry, and synchronizes real execution records with Supabase.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Execution, ExecutionStatus, ExecutionStep } from '../types';

export interface RenderStatusInfo {
  configured: boolean;
  workflowSlug: string;
  tasksUrl: string | null;
  mode: string;
  message?: string;
}

export interface RenderStageResult {
  id: string;
  name: string;
  stageSlug: string;
  status: 'SUCCEEDED' | 'FAILED' | 'SKIPPED' | 'RUNNING';
  durationMs: number;
  output: Record<string, any>;
}

export interface RenderExecutionResponse {
  success: boolean;
  configured: boolean;
  executionId?: string;
  renderTaskRunId?: string;
  status?: 'QUEUED' | 'RUNNING' | 'WAITING_FOR_APPROVAL' | 'SUCCEEDED' | 'FAILED';
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  stages?: RenderStageResult[];
  engine?: string;
  ticketId?: string;
  priority?: string;
  error?: string;
  code?: string;
}

/**
 * Verifies if the backend Render Workflows credentials and endpoints are configured.
 */
export async function checkRenderStatus(): Promise<RenderStatusInfo> {
  try {
    const res = await fetch('/api/render/status', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      return { configured: false, workflowSlug: 'flowmind-workflows', tasksUrl: null, mode: 'unconfigured' };
    }
    const json = await res.json();
    return (
      json.data || {
        configured: json.configured ?? false,
        workflowSlug: 'flowmind-workflows',
        tasksUrl: null,
        mode: 'unconfigured',
        message: json.message,
      }
    );
  } catch (err) {
    console.warn('[RENDER SERVICE] Failed to check Render status:', err);
    return { configured: false, workflowSlug: 'flowmind-workflows', tasksUrl: null, mode: 'offline' };
  }
}

/**
 * Triggers actual workflow execution via the server-side Render Workflows execution layer.
 */
export async function executeRenderWorkflow(params: {
  workflowId: string;
  workflowName: string;
  context: Record<string, any>;
  workflowData?: Record<string, any>;
  userId?: string;
  approved?: boolean;
}): Promise<RenderExecutionResponse> {
  try {
    const res = await fetch('/api/render/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const data = await res.json();
    return data;
  } catch (err: any) {
    return {
      success: false,
      configured: false,
      error: err.message || 'Network error connecting to Render Workflows execution service.',
      code: 'NETWORK_ERROR',
    };
  }
}

/**
 * Retrieves execution telemetry by execution ID.
 */
export async function getRenderExecutionDetails(executionId: string): Promise<any> {
  try {
    const res = await fetch(`/api/render/executions/${executionId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Persists a real Render execution record into Supabase workflow_executions table.
 */
export async function persistRenderExecutionToSupabase(params: {
  executionId: string;
  workflowId: string | null;
  userId?: string;
  workflowName: string;
  status: 'QUEUED' | 'RUNNING' | 'WAITING_FOR_APPROVAL' | 'SUCCEEDED' | 'FAILED';
  durationMs: number;
  startedAt: string;
  completedAt?: string | null;
  stages: RenderStageResult[];
  renderTaskRunId?: string;
  context?: Record<string, any>;
  error?: string | null;
}): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    console.log('[SUPABASE] Offline mode: Skipping Supabase persistence for Render execution');
    return { success: true };
  }

  try {
    let effectiveUserId = params.userId;
    if (!effectiveUserId) {
      const { data } = await supabase.auth.getUser();
      effectiveUserId = data?.user?.id;
    }

    if (!effectiveUserId) {
      console.warn('[SUPABASE] No authenticated user session found to link Render execution record.');
      return { success: false, error: 'User session unauthenticated' };
    }

    const dbStatus =
      params.status === 'SUCCEEDED'
        ? 'SUCCESS'
        : params.status === 'FAILED'
        ? 'FAILED'
        : params.status === 'WAITING_FOR_APPROVAL'
        ? 'WAITING_APPROVAL'
        : 'RUNNING';

    const executionRecord = {
      id: params.executionId,
      workflow_id: params.workflowId,
      user_id: effectiveUserId,
      status: dbStatus,
      duration_ms: params.durationMs,
      started_at: params.startedAt,
      completed_at: params.completedAt || null,
      execution_data: {
        engine: 'Render Workflows',
        workflow_name: params.workflowName,
        render_task_run_id: params.renderTaskRunId || params.executionId,
        render_status: params.status,
        stages_count: params.stages.length,
        stages: params.stages,
        context: params.context || {},
        error: params.error || null,
        simulation_mode: false,
      },
    };

    // Upsert into public.workflow_executions
    const { error } = await supabase
      .from('workflow_executions')
      .upsert(executionRecord);

    if (error) {
      // If foreign key constraint failed on workflow_id (e.g. ad-hoc workflow not yet saved in workflows table),
      // retry with workflow_id: null to preserve telemetry
      if (error.message?.includes('foreign key') || error.code === '23503') {
        const { error: retryErr } = await supabase
          .from('workflow_executions')
          .upsert({ ...executionRecord, workflow_id: null });
        if (retryErr) {
          console.error('[SUPABASE] Failed to persist Render execution:', retryErr);
          return { success: false, error: retryErr.message };
        }
        return { success: true };
      }
      console.error('[SUPABASE] Failed to persist Render execution:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('[SUPABASE] Exception persisting Render execution:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Fetches real execution telemetry from Supabase, mapping them into the Execution model
 * for the Executions page.
 */
export async function fetchLiveExecutionsFromSupabase(
  userId: string,
  isElevated = false
): Promise<Execution[]> {
  if (!isSupabaseConfigured() || !userId) {
    return [];
  }

  try {
    let query = supabase
      .from('workflow_executions')
      .select('*')
      .order('started_at', { ascending: false });

    if (!isElevated) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error || !data) {
      console.error('[SUPABASE] Failed to query workflow_executions:', error);
      return [];
    }

    return data.map((row: any) => {
      const execData = row.execution_data || {};
      const isRender = execData.engine === 'Render Workflows';
      const rawStatus = (row.status || 'SUCCESS').toLowerCase();

      let mappedStatus: ExecutionStatus = 'success';
      if (rawStatus === 'failed') mappedStatus = 'failed';
      else if (rawStatus === 'running' || rawStatus === 'queued') mappedStatus = 'running';
      else if (rawStatus === 'waiting_approval') mappedStatus = 'queued';

      const steps: ExecutionStep[] = Array.isArray(execData.stages)
        ? execData.stages.map((stage: any, idx: number) => ({
            id: stage.id || `stage-${idx + 1}`,
            name: stage.name || stage.stageSlug || `Stage ${idx + 1}`,
            type: stage.stageSlug?.includes('notify')
              ? 'notification'
              : stage.stageSlug?.includes('ticket')
              ? 'integration'
              : 'action',
            status: stage.status === 'SUCCEEDED' ? 'success' : stage.status === 'FAILED' ? 'failed' : 'running',
            durationMs: stage.durationMs || 0,
            outputSummary: stage.output ? JSON.stringify(stage.output) : undefined,
            error: stage.error,
          }))
        : Array.isArray(execData.steps)
        ? execData.steps.map((st: any) => ({
            id: st.id,
            name: st.title || st.name,
            type: 'action',
            status: st.status === 'success' ? 'success' : 'failed',
            durationMs: st.durationMs || 0,
            outputSummary: st.outputSummary,
            error: st.error,
          }))
        : [];

      const durationMs = row.duration_ms || 0;
      const durationFormatted =
        durationMs > 1000 ? `${(durationMs / 1000).toFixed(2)}s` : `${durationMs}ms`;

      const startedDate = new Date(row.started_at);
      const startedAtFormatted = startedDate.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });

      return {
        id: row.id,
        workflowId: row.workflow_id || 'unlinked',
        workflowName: execData.workflow_name || (isRender ? 'Customer Complaint Flow (Render)' : 'Automated Workflow'),
        status: mappedStatus,
        duration: durationFormatted,
        startedAt: startedAtFormatted,
        triggerEvent: isRender ? 'Render Workflows Live Trigger' : 'Dry-Run Simulation Trigger',
        stepsTotal: steps.length || 6,
        stepsCompleted: steps.filter((s) => s.status === 'success').length,
        steps,
      };
    });
  } catch (err) {
    console.error('[SUPABASE] Exception in fetchLiveExecutionsFromSupabase:', err);
    return [];
  }
}
