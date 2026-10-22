/**
 * FLOWMIND AI — Render Workflows Client Service
 * Dispatches live workflow execution requests to the backend Render integration layer,
 * polls execution telemetry, and synchronizes real execution records with Supabase.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Execution, ExecutionStatus, ExecutionStep } from '../types';

export interface RenderStatusInfo {
  configured: boolean;
  cloudConfigured?: boolean;
  localEngineAvailable?: boolean;
  workflowSlug: string;
  tasksUrl: string | null;
  mode: string;
  message?: string;
  capabilities?: {
    cloudConfigured: boolean;
    localEngineAvailable: boolean;
    supportedWorkflows: Array<{ id: string; name: string }>;
  };
}

export interface RenderStageResult {
  id: string;
  name: string;
  stageSlug: string;
  status: 'SUCCEEDED' | 'FAILED' | 'SKIPPED' | 'RUNNING' | 'REJECTED';
  durationMs: number;
  output: Record<string, any>;
}

export interface RenderExecutionResponse {
  success: boolean;
  configured: boolean;
  executionId?: string;
  renderTaskRunId?: string;
  status?: 'QUEUED' | 'RUNNING' | 'WAITING_FOR_APPROVAL' | 'SUCCEEDED' | 'FAILED' | 'REJECTED';
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  stages?: RenderStageResult[];
  engine?: string;
  engineMode?: 'cloud' | 'local-sdk';
  ticketId?: string;
  priority?: string;
  message?: string;
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
      return { configured: true, cloudConfigured: false, localEngineAvailable: true, workflowSlug: 'flowmind-workflows', tasksUrl: null, mode: 'local-sdk-engine' };
    }
    const json = await res.json();
    return (
      json.data || {
        configured: json.configured ?? true,
        cloudConfigured: json.cloudConfigured ?? false,
        localEngineAvailable: true,
        workflowSlug: json.workflowSlug || 'flowmind-workflows',
        tasksUrl: json.tasksUrl || null,
        mode: json.mode || 'local-sdk-engine',
        message: json.message,
        capabilities: json.capabilities,
      }
    );
  } catch (err) {
    console.warn('[RENDER SERVICE] Failed to check Render status:', err);
    return { configured: true, cloudConfigured: false, localEngineAvailable: true, workflowSlug: 'flowmind-workflows', tasksUrl: null, mode: 'local-sdk-engine' };
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
  preferMode?: 'auto' | 'cloud' | 'local';
  pauseAtApproval?: boolean;
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
 * Generates production-ready @renderinc/sdk/workflows code from any visual workflow definition.
 */
export async function generateRenderWorkflowCode(workflow: Record<string, any>): Promise<{
  success: boolean;
  code?: string;
  framework?: string;
  error?: string;
}> {
  try {
    const res = await fetch('/api/render/code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workflow }),
    });
    return await res.json();
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to generate Render Workflows code.',
    };
  }
}

/**
 * Resumes a workflow execution that paused at a Human Approval Checkpoint (HITL).
 */
export async function approveRenderWorkflow(params: {
  executionId: string;
  approved: boolean;
  approverRole?: string;
  approverName?: string;
  comments?: string;
}): Promise<RenderExecutionResponse> {
  try {
    const res = await fetch('/api/render/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return await res.json();
  } catch (err: any) {
    return {
      success: false,
      configured: false,
      error: err.message || 'Network error approving Render Workflow execution.',
      code: 'NETWORK_ERROR',
    };
  }
}

/**
 * Fetches the registered Render task catalog.
 */
export async function fetchRenderTasks(): Promise<{
  success: boolean;
  tasks?: Array<{ id: string; name: string }>;
  cloudConfigured?: boolean;
  localEngineAvailable?: boolean;
}> {
  try {
    const res = await fetch('/api/render/tasks', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return await res.json();
  } catch (err: any) {
    return { success: false };
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
  status: 'QUEUED' | 'RUNNING' | 'WAITING_FOR_APPROVAL' | 'SUCCEEDED' | 'FAILED' | 'REJECTED';
  durationMs: number;
  startedAt: string;
  completedAt?: string | null;
  stages: RenderStageResult[];
  renderTaskRunId?: string;
  context?: Record<string, any>;
  engineMode?: string;
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
        : params.status === 'FAILED' || params.status === 'REJECTED'
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
        engine_mode: params.engineMode || 'local-sdk',
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
      // If foreign key constraint failed on workflow_id, retry with workflow_id: null
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

    const { data, error } = await query.limit(50);

    if (error) {
      console.error('[SUPABASE] Error querying workflow_executions:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data.map((row: any) => {
      const execData = row.execution_data || {};
      const rawStatus = (row.status || 'SUCCESS').toUpperCase();

      let mappedStatus: ExecutionStatus = 'success';
      if (rawStatus === 'RUNNING') mappedStatus = 'running';
      else if (rawStatus === 'FAILED' || rawStatus === 'REJECTED') mappedStatus = 'failed';
      else if (rawStatus === 'WAITING_APPROVAL') mappedStatus = 'queued';

      const steps: ExecutionStep[] = Array.isArray(execData.stages)
        ? execData.stages.map((st: any, i: number) => ({
            id: st.id || `step-${i + 1}`,
            name: st.name || st.stageSlug || `Stage ${i + 1}`,
            status:
              st.status === 'SUCCEEDED'
                ? 'completed'
                : st.status === 'RUNNING'
                ? 'running'
                : st.status === 'SKIPPED'
                ? 'skipped'
                : 'failed',
            startedAt: st.output?.timestamp || row.started_at,
            completedAt: st.output?.evaluatedAt || st.output?.decidedAt || row.completed_at,
            durationMs: st.durationMs || 0,
            output: st.output,
          }))
        : [];

      const stepsTotal = steps.length;
      const stepsCompleted = steps.filter((s) => s.status === 'success' || (s as any).status === 'skipped').length;
      const durationSeconds = ((row.duration_ms || 0) / 1000).toFixed(1) + 's';

      return {
        id: row.id,
        workflowId: row.workflow_id || 'wf-custom',
        workflowName: execData.workflow_name || 'Render Workflow Execution',
        status: mappedStatus,
        duration: durationSeconds,
        startedAt: row.started_at,
        completedAt: row.completed_at,
        durationMs: row.duration_ms || 0,
        triggerEvent: execData.context?.event || 'Render Workflows Trigger',
        stepsTotal,
        stepsCompleted,
        steps,
        error: execData.error || null,
        metadata: {
          engine: execData.engine || 'Render Workflows',
          engineMode: execData.engine_mode || 'local-sdk',
          renderTaskRunId: execData.render_task_run_id,
          stagesCount: execData.stages_count || steps.length,
          context: execData.context,
          simulationMode: execData.simulation_mode ?? false,
        },
      } as Execution;
    });
  } catch (err) {
    console.error('[SUPABASE] Exception in fetchLiveExecutionsFromSupabase:', err);
    return [];
  }
}
