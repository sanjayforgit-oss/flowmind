import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface AuditEvent {
  id: string;
  workflow_id?: string;
  workflow_name: string;
  user_id: string;
  actor_type: 'user' | 'ai';
  actor_name: string;
  action:
    | 'workflow_created'
    | 'workflow_updated'
    | 'workflow_published'
    | 'workflow_unpublished'
    | 'workflow_executed'
    | 'workflow_execution_failed'
    | 'workflow_generated_by_ai'
    | 'workflow_node_added'
    | 'workflow_node_removed'
    | 'workflow_node_updated'
    | 'workflow_deleted';
  description: string;
  metadata?: Record<string, any>;
  created_at: string;
}

const LOCAL_STORAGE_AUDIT = 'flowmind_workflow_audit_logs';

/**
 * Record an audit log event into Supabase and local storage
 */
export async function recordAuditEvent(params: {
  workflowId?: string;
  workflowName: string;
  userId: string;
  actorType?: 'user' | 'ai';
  actorName?: string;
  action: AuditEvent['action'];
  description: string;
  metadata?: Record<string, any>;
}): Promise<void> {
  const actorType = params.actorType || 'user';
  const actorName = params.actorName || (actorType === 'ai' ? 'FLOWMIND AI' : 'User');

  const newEvent: AuditEvent = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    workflow_id: params.workflowId,
    workflow_name: params.workflowName,
    user_id: params.userId,
    actor_type: actorType,
    actor_name: actorName,
    action: params.action,
    description: params.description,
    metadata: params.metadata || {},
    created_at: new Date().toISOString(),
  };

  // Local persistence buffer
  try {
    const existingStr = localStorage.getItem(`${LOCAL_STORAGE_AUDIT}_${params.userId}`);
    const existing: AuditEvent[] = existingStr ? JSON.parse(existingStr) : [];
    const updated = [newEvent, ...existing].slice(0, 100);
    localStorage.setItem(`${LOCAL_STORAGE_AUDIT}_${params.userId}`, JSON.stringify(updated));
  } catch {
    // ignore
  }

  if (!isSupabaseConfigured()) return;

  try {
    await supabase.from('workflow_audit_logs').insert({
      workflow_id: params.workflowId || null,
      workflow_name: params.workflowName,
      user_id: params.userId,
      actor_type: actorType,
      actor_name: actorName,
      action: params.action,
      description: params.description,
      metadata: params.metadata || {},
    });
  } catch (err) {
    console.warn('Could not record audit log to Supabase in background:', err);
  }
}

/**
 * Fetch all audit logs for the authenticated user
 */
export async function fetchWorkflowAuditLogs(
  userId: string,
  workflowId?: string,
  limit = 50
): Promise<AuditEvent[]> {
  if (!isSupabaseConfigured()) {
    try {
      const stored = localStorage.getItem(`${LOCAL_STORAGE_AUDIT}_${userId}`);
      const logs: AuditEvent[] = stored ? JSON.parse(stored) : [];
      if (workflowId) {
        return logs.filter((l) => l.workflow_id === workflowId).slice(0, limit);
      }
      return logs.slice(0, limit);
    } catch {
      return [];
    }
  }

  try {
    let query = supabase
      .from('workflow_audit_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (workflowId) {
      query = query.eq('workflow_id', workflowId);
    }

    const { data, error } = await query;

    if (error) {
      console.warn('Supabase fetch audit logs error, using local fallback:', error);
      const stored = localStorage.getItem(`${LOCAL_STORAGE_AUDIT}_${userId}`);
      const logs: AuditEvent[] = stored ? JSON.parse(stored) : [];
      if (workflowId) {
        return logs.filter((l) => l.workflow_id === workflowId).slice(0, limit);
      }
      return logs.slice(0, limit);
    }

    return (data as AuditEvent[]) || [];
  } catch (err) {
    console.error('Failed to fetch audit logs from Supabase:', err);
    return [];
  }
}
